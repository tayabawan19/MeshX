import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { ArrowLeft, Check, Users } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const NewGroupModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { contacts, createNewGroup } = useChatStore();
  const { theme } = useThemeStore();

  const toggleSelectUser = (id: string) => {
    triggerHaptic('selection');
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    triggerHaptic('success');
    const chatId = await createNewGroup(groupName.trim(), selectedUserIds);
    navigation.replace('Chat', { chatId, title: groupName.trim(), isGroup: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>New Group</Text>
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor:
                groupName.trim() && selectedUserIds.length > 0
                  ? theme.colors.primary
                  : theme.colors.surfaceLight,
            },
          ]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedUserIds.length === 0}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <View style={[styles.groupIconBox, { backgroundColor: theme.colors.surfaceLight }]}>
          <Users size={28} color={theme.colors.primary} />
        </View>
        <TextInput
          style={[
            styles.groupInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
          ]}
          placeholder="Group Name..."
          placeholderTextColor={theme.colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <View style={styles.membersSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          SELECT PARTICIPANTS ({selectedUserIds.length})
        </Text>
        <FlatList
          data={contacts}
          keyExtractor={(item, idx) => item.id || item._id || `c_${idx}`}
          renderItem={({ item }) => {
            const uId = item.id || item._id || (item as any).userId;
            const isSelected = selectedUserIds.includes(uId);
            return (
              <TouchableOpacity
                style={[styles.userRow, { borderBottomColor: theme.colors.border }]}
                onPress={() => toggleSelectUser(uId)}
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
                  <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.userBio, { color: theme.colors.textSecondary }]}>
                    {item.bio || item.email}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
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
    paddingTop: 8,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  inputSection: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  groupIconBox: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  groupInput: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '600' },
  membersSection: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userBio: { fontSize: 13, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});
