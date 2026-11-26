import { beforeEach, describe, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

describe('お菓子オンボーディング', () => {
  beforeEach(async ({ app, screen }) => {
    await app.open();
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
