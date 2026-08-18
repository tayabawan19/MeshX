import React from 'react';
import { TouchableWithoutFeedback, Text, StyleSheet, ViewStyle, TextStyle, View, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: [string, string];
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const scale = useSharedValue(1);

  const buttonColors: [string, string] = colors || [palette.primary, palette.accent];

  const handlePressIn = () => {
    if (disabled || isLoading) return;
    scale.value = withSpring(0.95, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    if (disabled || isLoading) return;
    triggerHaptic('light');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      <Animated.View
        style={[
          styles.clayShadowWrapper,
          {
            borderTopColor: palette.clayHighlight,
            borderLeftColor: palette.clayHighlight,
            borderBottomColor: 'rgba(0, 0, 0, 0.40)',
            borderRightColor: 'rgba(0, 0, 0, 0.28)',
          },
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={buttonColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.innerRow}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text style={[styles.text, textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  clayShadowWrapper: {
    borderRadius: 26,
    borderWidth: 1.8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientFill: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
