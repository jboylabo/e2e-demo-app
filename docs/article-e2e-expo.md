---
title: "Expo アプリの E2E テストに「e2e」を使ってみたら、セットアップが驚くほど簡単だった"
tags: [Expo, ReactNative, E2E, テスト, pnpm]
---

# Expo アプリの E2E テストに「e2e」を使ってみたら、セットアップが驚くほど簡単だった

Expo で作ったアプリの E2E テストツールを探していたところ、[e2e](https://e2e.com/docs/ja/quickstart) というツールに出会いました。
セットアップがとにかく簡単で、AI を活用しながら iOS シミュレーター上でアプリをビルドしてテストまで回せる。ここまで便利なものは他にありませんでした。

この記事では、

1. e2e とはどんなツールか
2. Expo（pnpm）プロジェクトへのセットアップ手順
3. 簡単な画面を作って E2E テストを書いて動かすまで
4. 使ってみて良かったところ

をまとめます。

## 動作環境

| 項目 | バージョン |
| --- | --- |
| Expo SDK | 58（Expo Router） |
| Node.js | 26.5.0 |
| pnpm | 12.23.0 |
| Xcode | 27.2 |
| e2e / @e2e-dev/mobile | 0.24.0 / 0.12.8 |

## e2e とは

e2e は **「AI エージェント」と「厳密な操作・検証」を 1 本のテストの中で混ぜて書ける E2E テストランナー**です。

- **Web**（Playwright のブラウザ）と **モバイル**（iOS シミュレーター / Android エミュレーター / 実機）の両方に対応
- モバイルは `@e2e-dev/mobile` が [agent-device](https://github.com/callstack/agent-device) 経由で端末を操作
- テストは TypeScript で、Playwright や Vitest に近い書き味（`test` / `describe` / `expect` / `getByRole`）

### 2 種類のステップ

| 種類 | 例 | 用途 |
| --- | --- | --- |
| 厳密なステップ | `screen.getByRole('button', '保存').tap()`、`expect(...).toBeVisible()` | 正確な操作と検証 |
| エージェントのステップ | `agent.act('設定の一般を開く')`、`agent.assert('一般の画面が表示されている')` | 自然言語でゴールを渡し、AI が画面を見ながら操作・判定 |

```ts
test('the agent opens General', async ({ agent, app, device }) => {
  await app.open();
  await agent.act('open {section} settings', { params: { section: 'General' } });

  await agent.assert('the General settings screen is showing');
});
```

エージェントのステップは、一度成功するとその操作が **リプレイキャッシュ** に記録され、次回からはモデルを呼ばずに再生されます。毎回 AI のコストがかかるわけではないのがうれしいところです。

### コーディングエージェントとの連携

`e2e init` を実行すると、テスト用の設定ファイルに加えて次のようなファイルも生成できます。

- `.mcp.json` … e2e の **MCP サーバー**（`e2e mcp`）。Claude Code などのコーディングエージェントが、起動中のアプリを操作して画面を確認したり、スクリーンショットを撮ったり、ロケーターを試したりできる
- `.claude/skills/e2e` など … エージェント向けの **スキル**（e2e の書き方・実行・デバッグのリファレンス）
- `.github/workflows/e2e.yml` … GitHub Actions のワークフロー

つまり、AI に「この画面の E2E テストを書いて、シミュレーターで動かして」と頼むと、AI がアプリをビルドし、シミュレーターを立ち上げ、テストを書いて実行し、失敗したらトレースを読んで直す、という流れまで任せられます。

## セットアップ手順（Expo + pnpm）

### 前提条件

- Node.js 24.8 以上（22 系なら 22.22.3 以上）
- iOS なら Xcode と iOS シミュレーターランタイム（Android なら Android SDK とエミュレーター）
- Windows の場合は WSL 内で実行

### 1. 初期化

```bash
pnpm dlx e2e init
```

ウィザードが対話形式で進み、以下が作られます。

- `e2e.config.ts`（設定ファイル）
- `tests/example.e2e.ts`（サンプルテスト。iOS の「設定」アプリを開く）
- `package.json` への devDependencies（`e2e`、`@e2e-dev/core`、`@e2e-dev/mobile`）と `test:e2e` スクリプトの追加
- 必要に応じて `.mcp.json`、スキル、CI ワークフロー

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境チェック

```bash
pnpm exec e2e doctor
```

Node.js、設定ファイル、Xcode、シミュレーターなどをまとめてチェックしてくれます。最後に `e2e run can start here` と出れば準備完了です。

### 4. サンプルを実行

```bash
pnpm test:e2e
```

シミュレーターが起動し、「設定」アプリが開いてテストが通ります。

### ハマりどころ（Tips）

**USB で iPhone 実機をつないでいると、そちらが選ばれることがある**

`device` を指定しないと、起動中のシミュレーターに加えて接続中の実機もテスト対象になります。シミュレーターを使いたいときは名前で指定しておくと安心です。

```ts
engine: mobile({ platform: 'ios', device: 'iPhone 17' }),
```

**シミュレーターが日本語設定だとサンプルテストが落ちる**

サンプルは `General` ボタンを探しますが、日本語環境では「一般」と表示されます。テストの文言を変えるか、起動引数で英語にします。

```ts
app: { bundleId: 'Settings', launchArguments: ['-AppleLanguages', '(en)', '-AppleLocale', 'en_US'] },
```

## 自分のアプリをテストする

ここからは、実際に簡単な画面を作ってテストしてみます。

### 作った画面

お菓子の食べすぎをチェックする、オンボーディング風の画面です（Expo Router の Stack）。

```
[お菓子、最近どうですか？]
   ├─「食べすぎた」 → [歯医者さんに行きましょう]
   │                    ├─「歯医者さんを予約する」 → [予約が完了しました]
   │                    └─「あとで」 → 戻る
   └─「控えている」 → [えらい！その調子です]
```

ボタンは `Pressable` に `accessibilityRole="button"` を付けておくと、テストから `getByRole('button', 'ラベル')` で探せます。

```tsx
// src/components/choice-button.tsx（抜粋）
<Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
  <Text style={styles.label}>{label}</Text>
</Pressable>
```

### アプリをシミュレーターにインストール

e2e 自体はアプリをインストールしないので、先に Debug ビルドを入れておきます。

```bash
pnpm exec expo run:ios --device "iPhone 17"
```

Debug ビルドは起動時に Metro（`localhost:8081`）から JS を読み込むので、JS を書き換えただけなら再ビルドは不要です。

### 設定ファイル

`app.command` で Metro を自動起動させると、`pnpm test:e2e` だけでテストが回るようになります。

```ts
// e2e.config.ts
import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

export default {
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: 'iPhone 17' }),
      app: {
        bundleId: 'com.example.e2edemoapp', // app.json の ios.bundleIdentifier
        // テスト前に Metro を起動（すでに動いていればそれを使う）
        command: {
          executable: 'pnpm',
          args: ['exec', 'expo', 'start', '--port', '8081'],
          reuseExisting: true,
          startupTimeout: 120_000,
          log: '.e2e/logs/metro.log',
        },
        readyUrl: 'http://localhost:8081/status',
      },
    },
  ],
  workers: 1,
} satisfies E2EConfig;
```

### テストコード

```ts
// tests/onboarding.e2e.ts
import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

describe('お菓子オンボーディング', () => {
  beforeEach(async ({ app, screen }) => {
    await app.open(); // 毎回アプリを再起動して最初の画面から
    await screen.getByText('お菓子、最近どうですか？').waitFor();
  });

  test('オンボーディング画面が表示される', async ({ screen }) => {
    await expect(screen.getByText('お菓子、最近どうですか？')).toBeVisible();
    await expect(screen.getByRole('button', '食べすぎた')).toBeVisible();
    await expect(screen.getByRole('button', '控えている')).toBeVisible();
  });

  test('「食べすぎた」を選ぶと歯医者さんの予約が出る', async ({ screen }) => {
    await screen.getByRole('button', '食べすぎた').tap();

    await expect(screen.getByText('歯医者さんに行きましょう')).toBeVisible();
    await expect(screen.getByRole('button', '歯医者さんを予約する')).toBeVisible();
  });

  test('歯医者さんを予約すると完了メッセージが出る', async ({ screen }) => {
    await screen.getByRole('button', '食べすぎた').tap();
    await screen.getByRole('button', '歯医者さんを予約する').tap();

    await expect(screen.getByText('予約が完了しました')).toBeVisible();
  });

  test('「控えている」を選ぶと励ましの画面が出る', async ({ screen }) => {
    await screen.getByRole('button', '控えている').tap();

    await expect(screen.getByText('えらい！その調子です')).toBeVisible();
  });
});
```

### 実行結果

```bash
pnpm test:e2e
```

```
ℹ iPhone 17: boot 3.4s, iOS runner 1.7s, open com.example.e2edemoapp 2.4s
 ✓ mobile engine for target "ios" prepared 7.48s
 ✓ target "ios" command at http://localhost:8081/status ready 927ms
   ✓ |ios| tests/onboarding.e2e.ts > お菓子オンボーディング > オンボーディング画面が表示される 6.31s
   ✓ |ios| tests/onboarding.e2e.ts > お菓子オンボーディング > 「食べすぎた」を選ぶと歯医者さんの予約が出る 3.68s
   ✓ |ios| tests/onboarding.e2e.ts > お菓子オンボーディング > 歯医者さんを予約すると完了メッセージが出る 4.23s
   ✓ |ios| tests/onboarding.e2e.ts > お菓子オンボーディング > 「控えている」を選ぶと励ましの画面が出る 3.39s

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  18.81s
```

シミュレーターの起動から 4 テスト完了まで約 19 秒でした。失敗したときは `.e2e/results/<テスト名>/trace.md` に、その時点の画面のアクセシビリティツリーなどが出力されるので、原因を追いやすいです。
シミュレーターの画面を見ながら実行したいときは `pnpm exec e2e run --headed` を使います。

## 使ってみて良かったところ

### セットアップが簡単

`e2e init` → `pnpm install` → `e2e doctor` の 3 ステップで、シミュレーター上でテストが動く状態になりました。
Detox などで苦労しがちなネイティブ側の設定は一切不要で、Expo の CNG（`ios/` を手で触らない運用）ともぶつかりません。`e2e doctor` が環境の問題を具体的に教えてくれるのも助かりました。

### AI を活用してシミュレーターでのビルドからテストまで回せる

MCP サーバーとスキルが最初から用意されているので、コーディングエージェントに「画面を作って、その画面の E2E テストを書いて動かして」と頼むだけで、

- アプリのビルドとシミュレーターへのインストール
- テストコードの作成
- 実行と、失敗時のトレースを読んだ修正

まで一気に進めてくれました。
テスト自体にも `agent.act` / `agent.assert` で自然言語のステップを書けるので、ロケーターを決めにくい画面でも AI に任せられます。

### 書き味が Web のテストと同じ

`getByRole` / `getByText` / `expect(...).toBeVisible()` と、Playwright に慣れていればそのまま書けます。React Native 側も `accessibilityRole` や `testID` を付けるだけで、特別な仕込みは要りません。

## まとめ

Expo アプリの E2E テストツールを探している方には、e2e を強くおすすめします。
セットアップの手軽さに加えて、AI と組み合わせて「ビルド → シミュレーターで実行 → 修正」まで回せる体験は、これまでのモバイル E2E テストとはまったく別物でした。

## 参考

- [e2e クイックスタート](https://e2e.com/docs/ja/quickstart)
- [モバイルガイド](https://e2e.com/docs/ja/mobile)
- [設定リファレンス](https://e2e.com/docs/ja/reference/config)
- [コーディングエージェントとの連携](https://e2e.com/docs/ja/coding-agents)
- [Expo Router](https://docs.expo.dev/router/introduction/)
