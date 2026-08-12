import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Smile, Paperclip, Mic, Send, X, Image as ImageIcon, Camera, FileText } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { VoiceRecorder } from './VoiceRecorder';
import { triggerHaptic } from '../../utils/haptics';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
  onSendMedia: (type: 'image' | 'voice' | 'document', url: string, extra?: any) => void;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  onSendMedia,
  onTyping,
}) => {
  const { palette, themeMode } = useThemeStore();
  const { replyPreview, setReplyPreview } = useChatStore();

  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleTextChange = (val: string) => {
    setText(val);
    onTyping(val.trim().length > 0);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    triggerHaptic('light');
    onSendMessage(text);
    setText('');
    onTyping(false);
  };

  const uploadAndSend = async (uri: string, type: 'image' | 'voice' | 'document', extra?: any) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || `file_${Date.now()}`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : '';
      const mime = type === 'image' ? `image/${ext || 'jpeg'}` : type === 'voice' ? `audio/${ext || 'm4a'}` : `application/${ext || 'pdf'}`;

      formData.append('file', {
        uri,
        name: filename,
        type: mime,
      } as any);

      const res = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.mediaUrl) {
        onSendMedia(type, res.data.mediaUrl, extra);
      } else {
        onSendMedia(type, uri, extra);
      }
    } catch (err) {
      console.warn('[MediaUpload] Backend upload failed, using local URI fallback:', err);
      onSendMedia(type, uri, extra);
    }
  };

  const pickImage = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndSend(result.assets[0].uri, 'image');
    }
  };

  const takePhoto = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        await uploadAndSend(result.assets[0].uri, 'image');
      }
    }
  };

  const pickDocument = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets[0]) {
      const doc = result.assets[0];
      await uploadAndSend(doc.uri, 'document', {
        mediaFileName: doc.name,
        mediaFileSize: `${(doc.size! / (1024 * 1024)).toFixed(1)} MB`,
      });
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


  return (
    <View style={[styles.wrapper, { backgroundColor: palette.background }]}>
      {/* Reply Preview Banner */}
      {replyPreview && (
        <View style={[styles.replyBanner, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          <View style={styles.replyBar} />
          <View style={styles.replyTextContainer}>
            <Text style={[styles.replyTitle, { color: palette.primaryLight }]}>
              Replying to {replyPreview.senderName || 'Message'}
            </Text>
            <Text style={[styles.replySubtext, { color: palette.textSecondary }]} numberOfLines={1}>
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
        <View style={[styles.emojiBar, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          {['😊', '😂', '🔥', '❤️', '👍', '🎉', '🙌', '💯', '✨'].map((emoji) => (
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

      {/* Main Input Row */}
      <View style={[styles.inputRow, { backgroundColor: palette.inputBackground, borderColor: palette.border }]}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowEmojiPicker(!showEmojiPicker);
          }}
          style={styles.iconBtn}
        >
          <Smile size={22} color={showEmojiPicker ? palette.primaryLight : palette.textMuted} />
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

        {text.trim().length > 0 ? (
          <TouchableOpacity activeOpacity={0.8} onPress={handleSend} style={styles.sendBtnTouchable}>
            <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.sendGradient}>
              <Send size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              setIsRecordingVoice(true);
            }}
            style={styles.iconBtn}
          >
            <Mic size={22} color={palette.primaryLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Attachment Options Modal */}
      <Modal visible={showAttachments} transparent animationType="slide" onRequestClose={() => setShowAttachments(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowAttachments(false)} style={styles.modalOverlay}>
          <View style={[styles.attachmentSheet, { backgroundColor: palette.surfaceElevated }]}>
            <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Share Content</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity onPress={pickImage} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: '#3B82F6' }]}>
                  <ImageIcon size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePhoto} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: '#EC4899' }]}>
                  <Camera size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickDocument} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: '#10B981' }]}>
                  <FileText size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Document</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  replyBar: {
    width: 4,
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
    marginRight: 10,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  replySubtext: {
    fontSize: 12,
  },
  closeReplyBtn: {
    padding: 6,
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  emojiBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 48,
  },
  iconBtn: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 6,
  },
  sendBtnTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 4,
  },
  sendGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  optionItem: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
