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
      <View
        style={[
          styles.pill,
          {
            backgroundColor: palette.surfaceElevated,
            borderTopColor: palette.clayHighlight,
            borderLeftColor: palette.clayHighlight,
            borderBottomColor: 'rgba(0, 0, 0, 0.35)',
            borderRightColor: 'rgba(0, 0, 0, 0.20)',
          },
        ]}
      >
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
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
