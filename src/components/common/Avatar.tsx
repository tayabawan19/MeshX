import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';

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
  const palette = useThemeStore((state) => state.palette);
  const dimension = SIZE_MAP[size];
  const borderPadding = hasStory ? 4 : 0;
  const imageSize = dimension - borderPadding * 2;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const storyGradients: [string, string] = storyViewed
    ? ['#4A4A60', '#323246']
    : ['#8B7FD1', '#7B93D6'];

  const renderContent = () => (
    <View
      style={[
        styles.clayAvatarWrapper,
        {
          width: imageSize,
          height: imageSize,
          borderRadius: imageSize / 2,
          borderTopColor: palette.clayHighlight,
          borderLeftColor: palette.clayHighlight,
          borderBottomColor: 'rgba(0, 0, 0, 0.35)',
          borderRightColor: 'rgba(0, 0, 0, 0.25)',
        },
      ]}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }} />
      ) : (
        <View style={[styles.fallback, { width: imageSize, height: imageSize, borderRadius: imageSize / 2, backgroundColor: palette.primary }]}>
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
          style={[
            styles.storyDonutRing,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.40)',
              borderRightColor: 'rgba(0, 0, 0, 0.30)',
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
            styles.onlineClayNub,
            {
              backgroundColor: palette.onlineGreen,
              borderColor: palette.background,
              width: size === 'sm' ? 11 : size === 'md' ? 14 : 18,
              height: size === 'sm' ? 11 : size === 'md' ? 14 : 18,
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
  clayAvatarWrapper: {
    overflow: 'hidden',
    backgroundColor: '#242436',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  storyDonutRing: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 5,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  onlineClayNub: {
    position: 'absolute',
    borderWidth: 2.2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
