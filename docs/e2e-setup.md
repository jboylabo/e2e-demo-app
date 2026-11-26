# e2e（モバイル E2E テスト）導入・セットアップ手順（pnpm）

このプロジェクトに [e2e](https://e2e.com/docs/ja/quickstart) を pnpm で導入し、iOS シミュレーターでテストを実行するまでの手順です。

- 参考: [クイックスタート](https://e2e.com/docs/ja/quickstart) / [モバイルガイド](https://e2e.com/docs/ja/mobile) / [設定リファレンス](https://e2e.com/docs/ja/reference/config)
- 動作確認環境: Node.js 26.5.0 / pnpm 12.23.0 / Xcode 27.2 / Expo SDK 58 / `e2e` 0.24.0 / `@e2e-dev/mobile` 0.12.8

## 0. 前提条件

| 項目 | 要件 |
| --- | --- |
| Node.js | 24.8 以上（22 系なら 22.22.3 以上） |
| pnpm | `pnpm -v` で確認 |
| iOS | Xcode と iOS シミュレーターランタイム |
| Android（使う場合） | Android SDK とエミュレーター |
| Windows | WSL 内で実行 |

## 1. インストール

### 1-1. 初期化（設定ファイル・サンプルテストの生成）

```bash
pnpm dlx e2e init
```

ウィザードが以下を作成・変更します（このリポジトリでは実施済み）。

- `e2e.config.ts` … 設定ファイル
- `tests/example.e2e.ts` … サンプルテスト（iOS の「設定」アプリを開く。現在は `tests/onboarding.e2e.ts` に置き換え済み）
- `package.json` … devDependencies（`e2e` / `@e2e-dev/core` / `@e2e-dev/mobile`）と `test:e2e` スクリプト
- `.gitignore` … `.e2e/` 配下の生成物
- `.github/workflows/e2e.yml`、`.mcp.json`、`.claude/skills/e2e` など（選択した場合）

### 1-2. 依存関係のインストール

```bash
pnpm install
```

> **失敗した場合の注意点**
> `init` は `package.json` に依存関係を追記しますが、`node_modules` へのインストールまで完了していないことがあります（`node_modules/e2e` が存在しない状態）。その場合は上記の `pnpm install` を改めて実行してください。
> このリポジトリは pnpm に統一済みです（`package-lock.json` は削除、`package.json` の `packageManager` で pnpm 12.23.0 を指定）。npm / yarn でインストールしないでください。

### 1-3. インストール確認

```bash
pnpm exec e2e --version
ls node_modules/e2e node_modules/@e2e-dev
```

## 2. 環境チェック（`e2e doctor`）

```bash
pnpm exec e2e doctor
```

すべて `✓` で、最後に `e2e run can start here` と出れば OK です。`model` の `-` は AI エージェント未設定という意味で、通常のテストは実行できます（「5. AI エージェント」参照）。

### よくあるエラー: `target-app` が失敗する

```
✗ target-app  [ios] Target app check failed: Failed to list iOS apps:
  The developer disk image could not be mounted on this device.
```

**原因:** `device` を指定していないと、起動中のシミュレーターに加えて **USB 接続された実機 iPhone** もテスト対象に含まれます。実機の開発者ディスクイメージ（DDI）が未準備だとこのエラーになります。

**対処:** `e2e.config.ts` でシミュレーターを明示的に指定します（このリポジトリでは対応済み）。

```ts
engine: mobile({ platform: 'ios', device: process.env.E2E_DEVICE ?? 'iPhone 17' }),
```

- 名前は `xcrun simctl list devices` に表示されるシミュレーター名を使います。
- `E2E_DEVICE` は CI がシミュレーターの UDID を渡すための環境変数です。
- 実機で動かしたい場合は、Xcode > Window > Devices and Simulators で端末の準備完了を待ち、Developer Mode を有効にしてください。

## 3. アプリをシミュレーターにインストールする

e2e はアプリをインストールしないので、先に Debug ビルドを入れておきます（初回は数分かかります）。

```bash
pnpm exec expo run:ios --device "iPhone 17"
```

- bundle ID は `app.json` の `ios.bundleIdentifier`（`com.jboy422san.e2e-demo-app`）です。
- `ios/` は CNG で自動生成されるため手で編集しないでください。
- Debug ビルドは起動時に `localhost:8081` の Metro から JS を読み込みます。**JS を変えただけなら再ビルドは不要**です。ネイティブ設定（`app.json` やネイティブモジュール）を変えたときだけ再ビルドします。

## 4. e2e テストを実行する

```bash
pnpm test:e2e
# ファイル指定
pnpm exec e2e run tests/onboarding.e2e.ts
# シミュレーターを表示して実行
pnpm exec e2e run --headed
```

`e2e.config.ts` の `app.command` が Metro（`expo start --port 8081`）を自動で起動し、`readyUrl` で起動を待ってからテストを始めます。すでに Metro が動いていれば `reuseExisting: true` によりそれを使います。

```ts
app: {
  bundleId: 'com.jboy422san.e2e-demo-app',
  command: {
    executable: 'pnpm',
    args: ['exec', 'expo', 'start', '--port', '8081'],
    reuseExisting: true,
    startupTimeout: 120_000,
    log: '.e2e/logs/metro.log',
  },
  readyUrl: 'http://localhost:8081/status',
},
```

### テストの中身（`tests/onboarding.e2e.ts`）

画面フロー: オンボーディング（`/`）→「食べすぎた」→ 歯医者さん予約（`/dentist`）→ 予約完了 ／「控えている」→ 励まし（`/keep-it-up`）

```ts
import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

describe('お菓子オンボーディング', () => {
  beforeEach(async ({ app, screen }) => {
    await app.open(); // 毎回アプリを再起動して最初の画面から
    await screen.getByText('お菓子、最近どうですか？').waitFor();
  });

  test('「食べすぎた」を選ぶと歯医者さんの予約が出る', async ({ screen }) => {
    await screen.getByRole('button', '食べすぎた').tap();

    await expect(screen.getByRole('button', '歯医者さんを予約する')).toBeVisible();
  });
  // ...
});
```

- ボタンは `Pressable` に `accessibilityRole="button"` を付けているので `getByRole('button', 'ラベル')` で探せます（`src/components/choice-button.tsx`）。
- `app.open()` を省略すると、前のテストの画面状態を引き継ぎます。

### よくあるエラー

| 症状 | 対処 |
| --- | --- |
| `observed: no node` で `toBeVisible` が失敗 | `.e2e/results/<テスト名>/trace.md` で実際の画面を確認。文言の違いやシミュレーターの言語設定を疑う |
| アプリが起動しない／赤い画面 | `pnpm exec expo run:ios --device "iPhone 17"` で再インストール。`.e2e/logs/metro.log` を確認 |
| `target-app` チェック失敗 | 「2. 環境チェック」を参照（実機が選ばれている） |


## 5. （任意）AI エージェントを使う

`agent.act()` / `agent.assert()` を使うテストにはモデル設定が必要です。

```ts
import { gateway } from 'ai';

export default {
  agents: { default: { model: gateway('openai/gpt-6-luna-fast') } },
  // ...targets
};
```

モデルや認証は [モデル](https://e2e.com/docs/ja/models) / [サブスクリプション](https://e2e.com/docs/ja/subscriptions) を参照してください。

## 6. CI（GitHub Actions）

`.github/workflows/e2e.yml` は PR と main への push で動き、macOS ランナーで次を行います（pnpm 対応済み）。

1. `pnpm/action-setup` で `packageManager` の pnpm を入れ、`actions/setup-node`（`cache: pnpm`）→ `pnpm install --frozen-lockfile`
2. `pnpm exec expo run:ios --configuration Release ...` で **Release ビルド**（JS 同梱）を作成
3. iPhone 17 Pro シミュレーターを起動してアプリをインストールし、UDID を `E2E_DEVICE` に設定
4. `pnpm exec e2e run --target ios --workers 1 --reporter list,junit`
5. `.e2e/report.json`・`junit.xml`・`results/` をアーティファクトとしてアップロード

ポイント:

- CI では `CI=true` になるため、`e2e.config.ts` は Metro（`app.command`）を起動しません。Release ビルドは JS を内蔵しているので不要です。
- `pnpm-lock.yaml` と `package.json` がずれていると `--frozen-lockfile` で失敗します。依存を変えたら必ず `pnpm install` してロックファイルもコミットしてください。
- アクションはコミット SHA で固定しています。更新するときは SHA ごと差し替えてください。

`.mcp.json` の e2e MCP サーバーも `pnpm exec e2e mcp` で起動します。

## コマンド早見表

| やりたいこと | コマンド |
| --- | --- |
| 依存関係インストール | `pnpm install` |
| 環境チェック | `pnpm exec e2e doctor` |
| 全テスト実行 | `pnpm test:e2e` |
| シミュレーターを表示して実行 | `pnpm exec e2e run --headed` |
| シミュレーター一覧 | `xcrun simctl list devices` |
| テレメトリー無効化 | `pnpm exec e2e telemetry disable` |
