import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Text,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Camera,
  ImageIcon,
  FileText,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { VoiceRecorder } from './VoiceRecorder';
import { apiClient } from '../../config/api';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
  onSendMedia: (type: 'image' | 'voice' | 'document', url: string, extra?: any) => void;
  onTyping: (isTyping: boolean) => void;
  replyPreview?: { id: string; text: string; senderName?: string } | null;
  setReplyPreview: (preview: any) => void;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  onSendMedia,
  onTyping,
  replyPreview,
  setReplyPreview,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();

  const sendBtnOffset = useSharedValue(0);

  const handleTextChange = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    triggerHaptic('light');
    onSendMessage(text);
    setText('');
    onTyping(false);
  };

  const handleSendPressIn = () => {
    triggerHaptic('light');
    sendBtnOffset.value = withSpring(3, { damping: 14, stiffness: 280 });
  };

  const handleSendPressOut = () => {
    sendBtnOffset.value = withSpring(0, { damping: 12, stiffness: 220 });
  };

  const sendBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sendBtnOffset.value },
      { translateY: sendBtnOffset.value },
    ],
  }));

  const sendShadowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sendBtnOffset.value >= 2 ? 0 : 1,
  }));

  const uploadAndSend = async (uri: string, type: 'image' | 'voice' | 'document', extra?: any) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || `file_${Date.now()}`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : '';
      const mime = type === 'image'
        ? `image/${ext === 'png' ? 'png' : 'jpeg'}`
        : type === 'voice'
        ? `audio/${ext || 'm4a'}`
        : `application/${ext || 'pdf'}`;

      formData.append('file', {
        uri,
        name: filename,
        type: mime,
      } as any);

      console.log(`[MediaUpload] Uploading ${type} from ${uri}...`);

      const res = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const finalUrl = res.data?.mediaUrl || res.data?.url;
      if (finalUrl) {
        console.log(`[MediaUpload Success] ${finalUrl}`);
        onSendMedia(type, finalUrl, extra);
      } else {
        onSendMedia(type, uri, extra);
      }
    } catch (err: any) {
      console.warn('[MediaUpload Failed, using local fallback]:', err?.message || err);
      onSendMedia(type, uri, extra);
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in device settings to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSend(asset.uri, 'image');
      }
    } catch (error: any) {
      console.error('[PickImage Error]', error);
      Alert.alert('Gallery Error', 'Could not open photo library. Please try again.');
    }
  };

  const takePhoto = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in device settings to take and send photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSend(asset.uri, 'image');
      }
    } catch (error: any) {
      console.error('[TakePhoto Error]', error);
      Alert.alert(
        'Camera Unavailable',
        'Could not launch camera. If you are on an Android emulator, make sure camera is set to "Webcam0" in AVD settings, or choose an image from the Gallery instead.'
      );
    }
  };

  const pickDocument = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        await uploadAndSend(doc.uri, 'document', {
          mediaFileName: doc.name,
          mediaFileSize: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
        });
      }
    } catch (error) {
      console.error('[PickDocument Error]', error);
    }
  };

  if (isRecordingVoice) {
    return (
      <VoiceRecorder
        onSendVoiceNote={async (url, duration) => {
          setIsRecordingVoice(false);
          await uploadAndSend(url, 'voice', { audioDuration: duration, duration });
        }}
        onCancel={() => setIsRecordingVoice(false)}
      />
    );
  }

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8) + 4;

  return (
    <View style={[styles.wrapper, { backgroundColor: palette.background, paddingBottom: bottomInset }]}>
      {/* Reply Preview Banner */}
      {replyPreview && (
        <View style={[styles.replyBanner, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
          <View style={[styles.replyBar, { backgroundColor: palette.secondary }]} />
          <View style={styles.replyTextContainer}>
            <Text style={[styles.replyTitle, { color: palette.secondary }]}>
              Replying to {replyPreview.senderName || 'Message'}
            </Text>
            <Text style={[styles.replySubtext, { color: palette.textPrimary }]} numberOfLines={1}>
              {replyPreview.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyPreview(null)} style={styles.closeReplyBtn}>
            <X size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <View
          style={[
            styles.emojiBar,
            {
              backgroundColor: palette.surface,
              borderColor: '#000000',
            },
          ]}
        >
          {['🔥', '😂', '❤️', '👍', '🎉', '🙌', '💯', '✨', '⚡'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                triggerHaptic('light');
                setText((prev) => prev + emoji);
              }}
              style={styles.emojiBtn}
            >
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Bold Input Row */}
      <View style={styles.inputRowContainer}>
        <View style={styles.inputRowShadow} />
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: palette.surface,
              borderColor: '#000000',
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setShowEmojiPicker(!showEmojiPicker);
            }}
            style={styles.iconBtn}
          >
            <Smile size={22} color={showEmojiPicker ? palette.secondary : palette.textMuted} />
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder="Write a message..."
            placeholderTextColor={palette.textMuted}
            multiline
            style={[styles.textInput, { color: palette.textPrimary }]}
          />

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setShowAttachments(true);
            }}
            style={styles.iconBtn}
          >
            <Paperclip size={20} color={palette.textMuted} />
          </TouchableOpacity>

          {isUploading ? (
            <View style={styles.iconBtn}>
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          ) : text.trim().length > 0 ? (
            <View style={styles.sendWrapper}>
              <Animated.View style={[styles.sendShadow, sendShadowAnimatedStyle]} />
              <Pressable
                onPressIn={handleSendPressIn}
                onPressOut={handleSendPressOut}
                onPress={handleSend}
              >
                <Animated.View
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: palette.primary, // Hot Coral #FF4D5E
                      borderColor: '#000000',
                    },
                    sendBtnAnimatedStyle,
                  ]}
                >
                  <Send size={17} color="#FFFFFF" strokeWidth={2.5} />
                </Animated.View>
              </Pressable>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                setIsRecordingVoice(true);
              }}
              style={styles.iconBtn}
            >
              <Mic size={22} color={palette.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Attachment Options Modal */}
      <Modal visible={showAttachments} transparent animationType="slide" onRequestClose={() => setShowAttachments(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowAttachments(false)} style={styles.modalOverlay}>
          <View style={[styles.attachmentSheet, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Share Content</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity onPress={pickImage} style={styles.optionItem}>
                <View style={styles.optionIconWrapper}>
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#2E4BFF', borderColor: '#000000' }]}>
                    <ImageIcon size={24} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePhoto} style={styles.optionItem}>
                <View style={styles.optionIconWrapper}>
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#FF4D5E', borderColor: '#000000' }]}>
                    <Camera size={24} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickDocument} style={styles.optionItem}>
                <View style={styles.optionIconWrapper}>
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#C6FF3D', borderColor: '#000000' }]}>
                    <FileText size={24} color="#100F17" />
                  </View>
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
  },
  replyBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  replySubtext: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  closeReplyBtn: {
    padding: 4,
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 8,
  },
  emojiBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  inputRowContainer: {
    position: 'relative',
  },
  inputRowShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 22,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 2,
    zIndex: 1,
  },
  iconBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sendWrapper: {
    position: 'relative',
    marginRight: 4,
  },
  sendShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionItem: {
    alignItems: 'center',
  },
  optionIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  optionIconShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#000000',
  },
  optionIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
});
