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
  borderRadius = 22,
  isFocused = false,
}) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View
      style={[
        styles.recessedSlot,
        {
          backgroundColor: palette.inputBackground,
          borderRadius,
          borderTopColor: isFocused ? palette.primary : palette.clayInsetDark,
          borderLeftColor: isFocused ? palette.primary : palette.clayInsetDark,
          borderBottomColor: isFocused ? palette.primaryLight : palette.clayInsetLight,
          borderRightColor: isFocused ? palette.primaryLight : palette.clayInsetLight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  recessedSlot: {
    borderWidth: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
  },
});
