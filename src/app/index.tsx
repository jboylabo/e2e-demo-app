import { router } from 'expo-router';

import { ChoiceButton } from '@/components/choice-button';
import { Screen } from '@/components/screen';

export default function OnboardingScreen() {
  return (
    <Screen
      emoji="🍫"
      title="お菓子、最近どうですか？"
      description="あてはまるほうを選んでください。">
      <ChoiceButton label="食べすぎた" onPress={() => router.push('/dentist')} />
      <ChoiceButton
        label="控えている"
        variant="secondary"
        onPress={() => router.push('/keep-it-up')}
      />
    </Screen>
  );
}
