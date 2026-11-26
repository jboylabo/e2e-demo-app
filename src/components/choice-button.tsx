import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function ChoiceButton({ label, onPress, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#208AEF' },
  secondary: { borderWidth: 1.5, borderColor: '#208AEF' },
  pressed: { opacity: 0.7 },
  label: { fontSize: 17, fontWeight: '600' },
  primaryLabel: { color: '#FFFFFF' },
  secondaryLabel: { color: '#208AEF' },
});
