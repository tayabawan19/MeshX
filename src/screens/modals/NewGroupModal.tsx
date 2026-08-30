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
import { ChevronLeft, Check, Users } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NewGroupModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { contacts, createNewGroup } = useChatStore();
  const palette = useThemeStore((state) => state.palette);
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: palette.surfaceElevated,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: palette.surfaceLight,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={palette.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Group</Text>
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor:
                groupName.trim() && selectedUserIds.length > 0
                  ? palette.primary
                  : palette.surfaceLight,
            },
          ]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedUserIds.length === 0}
        >
          <Text
            style={[
              styles.createBtnText,
              {
                color:
                  groupName.trim() && selectedUserIds.length > 0
                    ? '#FFFFFF'
                    : palette.textMuted,
              },
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <View
          style={[
            styles.groupIconBox,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Users size={22} color={palette.primary} />
        </View>
        <View style={[styles.groupInputWrapper, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <TextInput
            style={[styles.groupInput, { color: palette.textPrimary }]}
            placeholder="Group Name..."
            placeholderTextColor={palette.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      </View>

      <View style={styles.membersSection}>
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
          SELECT MEMBERS ({selectedUserIds.length})
        </Text>
        <FlatList
          data={contacts}
          keyExtractor={(item, idx) => item.id || item._id || `c_${idx}`}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const uId = item.id || item._id || (item as any).userId;
            const isSelected = selectedUserIds.includes(uId);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSelectUser(uId)}
                style={[styles.userRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
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
                  <Text style={[styles.userBio, { color: palette.textMuted }]} numberOfLines={1}>
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
                  {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
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
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createBtnText: { fontWeight: '600', fontSize: 13 },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  groupIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  groupInput: {
    fontSize: 14,
    fontWeight: '500',
  },
  membersSection: { flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600' },
  userBio: { fontSize: 12, marginTop: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
