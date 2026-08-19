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
import { ClayInput } from '../../components/common/ClayInput';
import { BoldButton } from '../../components/common/BoldButton';
import { triggerHaptic } from '../../utils/haptics';
import { getContactAccent } from '../../theme/colors';

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
              backgroundColor: palette.surface,
              borderColor: '#000000',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Forward to ({selectedChatIds.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <ClayInput borderRadius={16} style={styles.searchSlot}>
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
              const assignedAccent = getContactAccent(name || 'Chat');

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
                    <View style={[styles.avatarFallback, { backgroundColor: assignedAccent, borderColor: '#000000' }]}>
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
                        borderColor: '#000000',
                        backgroundColor: isSelected ? palette.secondary : palette.surfaceElevated,
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#100F17" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Bottom Forward Action Button */}
          {selectedChatIds.length > 0 && (
            <BoldButton
              title={`Forward (${selectedChatIds.length})`}
              variant="primary"
              loading={isSending}
              onPress={handleSendForward}
              style={{ marginTop: 12 }}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    padding: 22,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  closeBtn: { padding: 4 },
  searchSlot: { height: 46, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 20 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#000000', marginRight: 12 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '800' },
  chatType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
