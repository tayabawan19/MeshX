import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDateDivider } from '../../utils/dateUtils';
import { useThemeStore } from '../../store/useThemeStore';

interface DateDividerProps {
  timestamp: number;
}

export const DateDivider: React.FC<DateDividerProps> = ({ timestamp }) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
        <Text style={[styles.text, { color: palette.textMuted }]}>{formatDateDivider(timestamp)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
