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
      <View style={[styles.line, { backgroundColor: palette.border }]} />
      <Text style={[styles.text, { color: palette.textMuted, backgroundColor: palette.background }]}>
        {formatDateDivider(timestamp)}
      </Text>
      <View style={[styles.line, { backgroundColor: palette.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '600',
  },
});
