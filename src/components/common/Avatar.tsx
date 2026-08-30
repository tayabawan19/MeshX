import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

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
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'User',
  size = 'md',
  isOnline = false,
  hasStory = false,
  storyViewed = false,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const dimension = SIZE_MAP[size];
  const storyPadding = hasStory ? 2.5 : 0;
  const imageSize = dimension - storyPadding * 2;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const storyBorderColor = storyViewed ? '#4E5058' : palette.primary;

  const renderContent = () => (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: imageSize,
          height: imageSize,
          borderRadius: imageSize / 2,
          backgroundColor: '#35373C',
        },
      ]}
    >
      {url ? (
        <Image
          source={{ uri: optimizeCloudinaryUrl(url, 'avatar') }}
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
              backgroundColor: palette.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.fallbackText,
              {
                fontSize: imageSize * 0.42,
                color: '#FFFFFF',
              },
            ]}
          >
            {initial}
          </Text>
        </View>
      )}
    </View>
  );

  const dotSize = size === 'sm' ? 10 : size === 'md' ? 13 : size === 'lg' ? 16 : 18;

  return (
    <View style={{ width: dimension, height: dimension, position: 'relative' }}>
      {hasStory ? (
        <View
          style={[
            styles.storyRing,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderColor: storyBorderColor,
            },
          ]}
        >
          {renderContent()}
        </View>
      ) : (
        renderContent()
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: palette.onlineGreen, // Discord status green #23A55A
              borderColor: palette.background,       // Base dark mask cutout
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderWidth: 2,
              right: 0,
              bottom: 0,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    padding: 1,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    zIndex: 2,
  },
});
