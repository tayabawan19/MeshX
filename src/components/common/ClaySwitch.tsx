import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

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
  const translateX = useSharedValue(value ? 20 : 2);

  useEffect(() => {
    translateX.value = withTiming(value ? 20 : 2, {
      duration: 150,
    });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleToggle = () => {
    if (disabled) return;
    triggerHaptic('light');
    onValueChange(!value);
  };

  return (
    <Pressable onPress={handleToggle} disabled={disabled} style={styles.container}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.primary : '#4E5058',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            thumbAnimatedStyle,
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 26,
    justifyContent: 'center',
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
