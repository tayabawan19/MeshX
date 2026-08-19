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
  borderRadius = 18,
  isFocused = false,
}) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={styles.outerWrapper}>
      {isFocused && (
        <View
          style={[
            styles.hardShadow,
            {
              backgroundColor: palette.secondary, // Electric lime shadow on focus
              borderRadius,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.inputSlot,
          {
            backgroundColor: palette.inputBackground,
            borderRadius,
            borderColor: isFocused ? palette.secondary : '#000000',
            borderWidth: 2,
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
    position: 'relative',
    marginVertical: 4,
  },
  hardShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    zIndex: 0,
  },
  inputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    zIndex: 1,
  },
});
