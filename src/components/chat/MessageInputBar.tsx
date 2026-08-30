import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Mic, Image, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VoiceRecorder } from './VoiceRecorder';
import { triggerHaptic } from '../../utils/haptics';

interface MessageInputBarProps {
  onSendMessage: (
    text: string,
    type?: 'text' | 'image' | 'voice' | 'document' | 'system',
    mediaUrl?: string
  ) => void;
  replyingMessage?: any;
  onCancelReply?: () => void;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  replyingMessage,
  onCancelReply,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (!text.trim()) return;
    triggerHaptic('light');
    onSendMessage(text.trim(), 'text');
    setText('');
  };

  const handlePickImage = async () => {
    triggerHaptic('selection');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onSendMessage('', 'image', result.assets[0].uri);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* Reply Preview Bar */}
      {replyingMessage && (
        <View style={styles.replyPreview}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replySender}>{replyingMessage.senderName || 'Replying'}</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingMessage.text || `[${replyingMessage.type}]`}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyBtn}>
            <X size={16} color="#757575" />
          </TouchableOpacity>
        </View>
      )}

      {isRecording ? (
        <VoiceRecorder
          onSendVoiceNote={(uri: string) => {
            setIsRecording(false);
            if (uri) onSendMessage('', 'voice', uri);
          }}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        <View style={styles.inputRow}>
          {/* Attach Button */}
          <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
            <Image size={20} color="#757575" />
          </TouchableOpacity>

          {/* Text Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
            />
          </View>

          {/* Mic or Gradient Send Button */}
          {text.trim().length === 0 ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setIsRecording(true);
              }}
              style={styles.micButton}
            >
              <Mic size={20} color="#8E0E2C" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSend}
              style={styles.sendButtonWrapper}
            >
              <LinearGradient
                colors={['#8E0E2C', '#540F27']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#8E0E2C',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E0E2C',
  },
  replyText: {
    fontSize: 12,
    color: '#616161',
  },
  cancelReplyBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  textInput: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '400',
    paddingTop: 0,
    paddingBottom: 0,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
