import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
  const translateX = useSharedValue(value ? 24 : 3);

  useEffect(() => {
    translateX.value = withSpring(value ? 24 : 3, {
      damping: 12,
      stiffness: 280,
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
      {/* Hard Offset Shadow */}
      <View style={styles.hardShadow} />

      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.secondary : palette.surfaceLight, // Electric lime when ON
            borderColor: '#000000',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: value ? '#100F17' : '#FFFFFF',
              borderColor: '#000000',
            },
            thumbAnimatedStyle,
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 56,
    height: 32,
  },
  hardShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  track: {
    width: 54,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    zIndex: 1,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});
