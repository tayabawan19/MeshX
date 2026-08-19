import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { getContactAccent } from '../../theme/colors';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  hasStory?: boolean;
  storyViewed?: boolean;
  accentColor?: string;
}

const SIZE_MAP = {
  sm: 38,
  md: 50,
  lg: 64,
  xl: 84,
};

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'User',
  size = 'md',
  isOnline = false,
  hasStory = false,
  storyViewed = false,
  accentColor,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const dimension = SIZE_MAP[size];
  const borderPadding = hasStory ? 4 : 0;
  const imageSize = dimension - borderPadding * 2;
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const assignedColor = accentColor || getContactAccent(name);

  // Dual-tone candy story rings: Coral & Lime
  const storyGradients: [string, string] = storyViewed
    ? ['#4A485A', '#2E2B48']
    : ['#FF4D5E', '#C6FF3D'];

  const renderContent = () => (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: imageSize,
          height: imageSize,
          borderRadius: imageSize / 2,
          borderColor: '#000000',
        },
      ]}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: imageSize,
              height: imageSize,
              borderRadius: imageSize / 2,
              backgroundColor: assignedColor,
            },
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              {
                fontSize: imageSize * 0.44,
                color: assignedColor === '#C6FF3D' || assignedColor === '#FFD23F' ? '#100F17' : '#FFFFFF',
              },
            ]}
          >
            {initial}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ width: dimension, height: dimension, position: 'relative' }}>
      {hasStory ? (
        <LinearGradient
          colors={storyGradients}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.storyRing,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        renderContent()
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: palette.onlineGreen, // #C6FF3D
              borderColor: '#000000',
              width: size === 'sm' ? 12 : size === 'md' ? 15 : 19,
              height: size === 'sm' ? 12 : size === 'md' ? 15 : 19,
              borderRadius: 99,
              right: size === 'sm' ? -1 : 1,
              bottom: size === 'sm' ? -1 : 1,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    overflow: 'hidden',
    backgroundColor: '#1E1C30',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRing: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    borderWidth: 2,
    borderColor: '#000000',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 2,
  },
});
