import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  colors = ['#7C3AED', '#3B82F6'],
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const handlePress = () => {
    if (disabled || isLoading) return;
    triggerHaptic('light');
    onPress();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} disabled={disabled || isLoading} style={[styles.touchable, style]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && icon}
            <Text style={[styles.text, textStyle, icon ? { marginLeft: 8 } : null]}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
