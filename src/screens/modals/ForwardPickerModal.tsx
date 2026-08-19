import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { X, Send, Search, Check, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { ClayInput } from '../../components/common/ClayInput';
import { triggerHaptic } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ForwardPickerModalProps {
  visible: boolean;
  messageIds: string[];
  onClose: () => void;
  onForwardComplete?: () => void;
}

export const ForwardPickerModal: React.FC<ForwardPickerModalProps> = ({
  visible,
  messageIds,
  onClose,
  onForwardComplete,
}) => {
  const { palette } = useThemeStore();
  const { chats, forwardMessages } = useChatStore();
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleSelect = (chatId: string) => {
    triggerHaptic('selection');
    if (selectedChatIds.includes(chatId)) {
      setSelectedChatIds(selectedChatIds.filter((id) => id !== chatId));
    } else {
      setSelectedChatIds([...selectedChatIds, chatId]);
    }
  };

  const handleSendForward = async () => {
    if (selectedChatIds.length === 0 || messageIds.length === 0 || isSending) return;
    setIsSending(true);
    triggerHaptic('success');
    await forwardMessages(messageIds, selectedChatIds);
    setIsSending(false);
    setSelectedChatIds([]);
    if (onForwardComplete) onForwardComplete();
    onClose();
  };

  if (!visible) return null;

  const filteredChats = chats.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.groupName?.toLowerCase().includes(q) ||
      c.otherParticipant?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: palette.surfaceElevated,
              borderTopColor: palette.clayHighlight,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Forward to ({selectedChatIds.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <ClayInput borderRadius={20} style={styles.searchSlot}>
            <Search size={16} color={palette.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search chats..."
              placeholderTextColor={palette.textMuted}
              style={[styles.searchInput, { color: palette.textPrimary }]}
            />
          </ClayInput>

          {/* List of Chats */}
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.chatId || (item as any).id || (item as any)._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const cId = item.chatId || (item as any).id || (item as any)._id;
              const isSelected = selectedChatIds.includes(cId);
              const isGroup = item.type === 'group';
              const name = isGroup ? item.groupName : item.otherParticipant?.name;
              const avatar = isGroup ? (item.groupAvatar || item.groupAvatarUrl) : item.otherParticipant?.avatarUrl;

              return (
                <TouchableOpacity
                  onPress={() => toggleSelect(cId)}
                  style={[
                    styles.chatRow,
                    isSelected && { backgroundColor: 'rgba(255,255,255,0.06)' },
                  ]}
                >
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: palette.primary }]}>
                      {isGroup ? <Users size={18} color="#FFFFFF" /> : <Text style={styles.avatarInitial}>{name?.[0]}</Text>}
                    </View>
                  )}

                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: palette.textPrimary }]}>{name || 'Chat'}</Text>
                    <Text style={[styles.chatType, { color: palette.textMuted }]}>
                      {isGroup ? 'Group' : 'Direct'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? palette.primary : palette.border,
                        backgroundColor: isSelected ? palette.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Bottom Forward Action Button */}
          {selectedChatIds.length > 0 && (
            <TouchableOpacity
              onPress={handleSendForward}
              disabled={isSending}
              style={[styles.sendBtn, { backgroundColor: palette.primary }]}
            >
              <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.sendBtnText}>Forward ({selectedChatIds.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 6 },
  searchSlot: { height: 42, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingBottom: 20 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '700' },
  chatType: { fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 22,
    marginTop: 10,
    elevation: 4,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
