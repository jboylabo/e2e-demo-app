import type { ReactNode } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  emoji: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

/** Shared layout for the onboarding screens: emoji, title, description, then actions. */
export function Screen({ emoji, title, description, children }: Props) {
  const isDark = useColorScheme() === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const subColor = isDark ? '#B0B4BA' : '#60646C';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: subColor }]}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 72 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  actions: { gap: 12, paddingBottom: 24 },
});
