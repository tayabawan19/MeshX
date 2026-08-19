import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import { ArrowLeft, Check, Radio, Send } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ClayInput } from '../../components/common/ClayInput';
import { ClayCard } from '../../components/common/ClayCard';
import { triggerHaptic } from '../../utils/haptics';

export const NewBroadcastModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { contacts, createNewChat, sendMessage } = useChatStore();
  const palette = useThemeStore((state) => state.palette);

  const toggleSelectUser = (id: string) => {
    triggerHaptic('selection');
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSendBroadcast = async () => {
    if (!messageText.trim() || selectedUserIds.length === 0 || isSending) return;
    setIsSending(true);
    triggerHaptic('success');

    for (const userId of selectedUserIds) {
      const chatId = await createNewChat(userId);
      if (chatId) {
        sendMessage(messageText.trim(), 'text', undefined, undefined, chatId);
      }
    }

    setIsSending(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: palette.surfaceElevated }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={palette.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Broadcast</Text>
          <Text style={[styles.headerSub, { color: palette.textMuted }]}>{selectedUserIds.length} recipients</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor:
                messageText.trim() && selectedUserIds.length > 0
                  ? palette.primary
                  : palette.surfaceElevated,
            },
          ]}
          onPress={handleSendBroadcast}
          disabled={!messageText.trim() || selectedUserIds.length === 0 || isSending}
        >
          <Send size={16} color={messageText.trim() && selectedUserIds.length > 0 ? '#FFFFFF' : palette.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Broadcast Message Input */}
      <View style={styles.inputSection}>
        <ClayInput borderRadius={20} style={styles.messageInputWrapper}>
          <TextInput
            style={[styles.messageInput, { color: palette.textPrimary }]}
            placeholder="Type broadcast message..."
            placeholderTextColor={palette.textMuted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </ClayInput>
      </View>

      {/* Select Recipients List */}
      <View style={styles.membersSection}>
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
          SELECT RECIPIENTS ({selectedUserIds.length} of {contacts.length})
        </Text>
        <FlatList
          data={contacts}
          keyExtractor={(item, idx) => item.id || item._id || `c_${idx}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const uId = item.id || item._id || (item as any).userId;
            const isSelected = selectedUserIds.includes(uId);
            return (
              <ClayCard
                borderRadius={20}
                onPress={() => toggleSelectUser(uId)}
                style={styles.userRow}
              >
                <Image
                  source={{
                    uri:
                      item.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: palette.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.userBio, { color: palette.textSecondary }]} numberOfLines={1}>
                    {item.bio || item.email}
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
              </ClayCard>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 11 },
  createBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  inputSection: { padding: 16 },
  messageInputWrapper: { height: 80, padding: 12 },
  messageInput: { flex: 1, fontSize: 15 },
  membersSection: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: 16, marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userBio: { fontSize: 13, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});
