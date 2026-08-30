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
import { X, Search, Check, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { BoldButton } from '../../components/common/BoldButton';
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
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Forward Message ({selectedChatIds.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchSlot, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Search size={16} color={palette.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search conversations..."
              placeholderTextColor={palette.textMuted}
              style={[styles.searchInput, { color: palette.textPrimary }]}
            />
          </View>

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
                      {isGroup ? <Users size={16} color="#FFFFFF" /> : <Text style={styles.avatarInitial}>{name?.[0]}</Text>}
                    </View>
                  )}

                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: palette.textPrimary }]}>{name || 'Chat'}</Text>
                    <Text style={[styles.chatType, { color: palette.textMuted }]}>
                      {isGroup ? 'Group' : 'Direct Message'}
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
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Bottom Forward Action Button */}
          {selectedChatIds.length > 0 && (
            <BoldButton
              title={`Send to ${selectedChatIds.length} Chat${selectedChatIds.length > 1 ? 's' : ''}`}
              variant="primary"
              loading={isSending}
              onPress={handleSendForward}
              style={{ marginTop: 10 }}
            />
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
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  searchSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '400' },
  list: { paddingBottom: 16 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitial: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 14, fontWeight: '600' },
  chatType: { fontSize: 11, marginTop: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
