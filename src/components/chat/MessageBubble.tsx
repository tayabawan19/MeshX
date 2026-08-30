import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, CheckCheck, Star } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { formatMessageTime } from '../../utils/dateUtils';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';
import { Message } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.76;

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  isSelected = false,
  onLongPress,
  onPress,
}) => {
  const { palette } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const renderStatus = () => {
    if (!isMe) return null;
    const status = message.status;
    if (status === 'read') {
      return <CheckCheck size={14} color="#80D8FF" />;
    }
    if (status === 'delivered') {
      return <CheckCheck size={14} color="rgba(255,255,255,0.7)" />;
    }
    return <Check size={14} color="rgba(255,255,255,0.7)" />;
  };

  const senderDisplayName = (message as any).senderName || (typeof message.senderId === 'object' ? (message.senderId as any)?.name : undefined);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        isMe ? styles.myContainer : styles.theirContainer,
        isSelected && styles.selectedRow,
      ]}
    >
      <Animated.View
        style={[
          styles.bubbleWrapper,
          isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper,
          animatedStyle,
        ]}
      >
        {isMe ? (
          <LinearGradient
            colors={['#8E0E2C', '#540F27']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.myBubble}
          >
            {senderDisplayName && !isMe ? (
              <Text style={styles.senderName}>{senderDisplayName}</Text>
            ) : null}

            {/* Media Rendering */}
            {message.type === 'image' && message.mediaUrl ? (
              <Image source={{ uri: optimizeCloudinaryUrl(message.mediaUrl, 'thumbnail') }} style={styles.mediaImage} resizeMode="cover" />
            ) : null}

            {/* Message Text */}
            {message.text ? (
              <Text style={styles.myMessageText}>{message.text}</Text>
            ) : null}

            {/* Footer Time & Status */}
            <View style={styles.footerRow}>
              {message.isStarred && <Star size={11} color="#FFD54F" fill="#FFD54F" style={{ marginRight: 4 }} />}
              <Text style={styles.myTimeText}>
                {formatMessageTime(Number(message.createdAt) || Date.now())}
              </Text>
              <View style={{ marginLeft: 4 }}>{renderStatus()}</View>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.theirBubble}>
            {senderDisplayName ? (
              <Text style={styles.senderName}>{senderDisplayName}</Text>
            ) : null}

            {/* Media Rendering */}
            {message.type === 'image' && message.mediaUrl ? (
              <Image source={{ uri: optimizeCloudinaryUrl(message.mediaUrl, 'thumbnail') }} style={styles.mediaImage} resizeMode="cover" />
            ) : null}

            {/* Message Text */}
            {message.text ? (
              <Text style={styles.theirMessageText}>{message.text}</Text>
            ) : null}

            {/* Footer Time */}
            <View style={styles.footerRow}>
              {message.isStarred && <Star size={11} color="#F57F17" fill="#F57F17" style={{ marginRight: 4 }} />}
              <Text style={styles.theirTimeText}>
                {formatMessageTime(Number(message.createdAt) || Date.now())}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: 8,
  },
  myContainer: {
    alignItems: 'flex-end',
  },
  theirContainer: {
    alignItems: 'flex-start',
  },
  selectedRow: {
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    borderRadius: 8,
  },
  bubbleWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
  },
  myBubbleWrapper: {
    borderBottomRightRadius: 4,
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  theirBubbleWrapper: {
    borderBottomLeftRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  myBubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E0E2C',
    marginBottom: 3,
  },
  myMessageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '400',
  },
  theirMessageText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    fontWeight: '400',
  },
  mediaImage: {
    width: MAX_BUBBLE_WIDTH - 28,
    height: 180,
    borderRadius: 12,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  theirTimeText: {
    fontSize: 11,
    color: '#9E9E9E',
  },
});
