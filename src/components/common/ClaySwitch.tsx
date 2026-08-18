import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';

interface ClaySwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}

export const ClaySwitch: React.FC<ClaySwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const translateX = useSharedValue(value ? 22 : 2);

  useEffect(() => {
    translateX.value = withSpring(value ? 22 : 2, {
      damping: 14,
      stiffness: 220,
    });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleToggle = () => {
    if (disabled) return;
    onValueChange(!value);
  };

  return (
    <TouchableWithoutFeedback onPress={handleToggle} disabled={disabled}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.primary : palette.inputBackground,
            borderTopColor: value ? palette.primaryLight : palette.clayInsetDark,
            borderLeftColor: value ? palette.primaryLight : palette.clayInsetDark,
            borderBottomColor: value ? palette.primary : palette.clayInsetLight,
            borderRightColor: value ? palette.primary : palette.clayInsetLight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: '#FFFFFF',
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.35)',
              borderRightColor: 'rgba(0, 0, 0, 0.20)',
            },
            thumbAnimatedStyle,
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.38,
    shadowRadius: 5,
    elevation: 4,
  },
});
