import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface ClayInputProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  isFocused?: boolean;
}

export const ClayInput: React.FC<ClayInputProps> = ({
  children,
  style,
  borderRadius = 8,
  isFocused = false,
}) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={styles.outerWrapper}>
      <View
        style={[
          styles.inputSlot,
          {
            backgroundColor: palette.inputBackground,
            borderRadius,
            borderColor: isFocused ? palette.primary : 'rgba(0, 0, 0, 0.28)',
            borderWidth: 1,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    marginVertical: 4,
  },
  inputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
  },
});
