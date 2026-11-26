import { router } from 'expo-router';

import { ChoiceButton } from '@/components/choice-button';
import { Screen } from '@/components/screen';

export default function KeepItUpScreen() {
  return (
    <Screen emoji="🎉" title="えらい！その調子です" description="この調子で続けていきましょう。">
      <ChoiceButton label="はじめに戻る" onPress={() => router.back()} />
    </Screen>
  );
}
