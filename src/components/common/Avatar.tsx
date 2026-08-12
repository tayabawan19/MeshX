import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '../../theme';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  hasStory?: boolean;
  storyViewed?: boolean;
}

const SIZE_MAP = {
  sm: 36,
  md: 48,
  lg: 60,
  xl: 80,
};

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'User',
  size = 'md',
  isOnline = false,
  hasStory = false,
  storyViewed = false,
}) => {
  const dimension = SIZE_MAP[size];
  const borderPadding = hasStory ? 3 : 0;
  const imageSize = dimension - borderPadding * 2;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const storyGradients: [string, string] = storyViewed
    ? ['#6B6B80', '#A0A0B0']
    : ['#EC4899', '#7C3AED'];

  const renderContent = () => (
    <View style={[styles.imageContainer, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }} />
      ) : (
        <View style={[styles.fallback, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}>
          <Text style={[styles.fallbackText, { fontSize: imageSize * 0.4 }]}>{initial}</Text>
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
          style={[styles.storyBorder, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        renderContent()
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: size === 'sm' ? 10 : size === 'md' ? 13 : 16,
              height: size === 'sm' ? 10 : size === 'md' ? 13 : 16,
              borderRadius: 99,
              right: size === 'sm' ? 0 : 2,
              bottom: size === 'sm' ? 0 : 2,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  storyBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: '#242430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F0F14',
  },
});
