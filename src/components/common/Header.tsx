import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  transparent = false,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    triggerHaptic('light');
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const content = (
    <View
      style={[
        styles.contentRow,
        {
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>
        ) : null}
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
    </View>
  );

  if (transparent) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      {content}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
