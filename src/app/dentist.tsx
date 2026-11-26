import { router } from 'expo-router';
import { useState } from 'react';

import { ChoiceButton } from '@/components/choice-button';
import { Screen } from '@/components/screen';

export default function DentistScreen() {
  const [booked, setBooked] = useState(false);

  if (booked) {
    return (
      <Screen emoji="✅" title="予約が完了しました" description="歯を大事にしましょうね。">
        <ChoiceButton label="はじめに戻る" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  return (
    <Screen
      emoji="🦷"
      title="歯医者さんに行きましょう"
      description="虫歯になる前に、一度チェックしてもらうと安心です。">
      <ChoiceButton label="歯医者さんを予約する" onPress={() => setBooked(true)} />
      <ChoiceButton label="あとで" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
