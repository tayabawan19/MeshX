import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Check, CheckCheck } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { formatMessageTime } from '../../utils/dateUtils';
import { Message } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MessageInfoModalProps {
  visible: boolean;
  message: Message | null;
  chatId: string;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  visible,
  message,
  chatId,
  onClose,
}) => {
  const { palette } = useThemeStore();
  const { getMessageInfo } = useChatStore();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && message) {
      setLoading(true);
      const msgId = message.id || message._id || '';
      getMessageInfo(chatId, msgId).then((data) => {
        setInfo(data);
        setLoading(false);
      });
    } else {
      setInfo(null);
    }
  }, [visible, message, chatId]);

  if (!visible || !message) return null;

  const deliveredList = info?.deliveredTo || [];
  const readList = info?.readBy || [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>Message Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Message Preview Snippet */}
          <View style={[styles.previewBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.previewText, { color: palette.textPrimary }]} numberOfLines={2}>
              {message.text || `[${message.type}]`}
            </Text>
            <Text style={[styles.previewTime, { color: palette.textMuted }]}>
              Sent {formatMessageTime(Number(message.createdAt) || Date.now())}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {/* Read Section */}
              <View style={styles.sectionHeader}>
                <CheckCheck size={16} color={palette.onlineGreen} />
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Read by</Text>
              </View>
              {readList.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>Not read yet</Text>
              ) : (
                readList.map((item: any, idx: number) => {
                  const u = item.userId || {};
                  return (
                    <View key={idx} style={styles.recipientRow}>
                      <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                      <View style={styles.meta}>
                        <Text style={[styles.name, { color: palette.textPrimary }]}>{u.name || 'Recipient'}</Text>
                        <Text style={[styles.time, { color: palette.textMuted }]}>
                          {item.readAt ? formatMessageTime(new Date(item.readAt).getTime()) : 'Read'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Delivered Section */}
              <View style={[styles.sectionHeader, { marginTop: 14 }]}>
                <Check size={16} color={palette.textMuted} />
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Delivered to</Text>
              </View>
              {deliveredList.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>Delivered to server</Text>
              ) : (
                deliveredList.map((item: any, idx: number) => {
                  const u = item.userId || {};
                  return (
                    <View key={idx} style={styles.recipientRow}>
                      <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                      <View style={styles.meta}>
                        <Text style={[styles.name, { color: palette.textPrimary }]}>{u.name || 'Recipient'}</Text>
                        <Text style={[styles.time, { color: palette.textMuted }]}>
                          {item.deliveredAt ? formatMessageTime(new Date(item.deliveredAt).getTime()) : 'Delivered'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 18,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  previewBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewText: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  previewTime: { fontSize: 11 },
  loadingContainer: { padding: 30, alignItems: 'center' },
  content: { maxHeight: SCREEN_HEIGHT * 0.45 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 12, marginHorizontal: 8, marginBottom: 6 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  meta: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600' },
  time: { fontSize: 11, marginTop: 1 },
});
