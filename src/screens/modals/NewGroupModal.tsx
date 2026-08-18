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
import { ClayInput } from '../../components/common/ClayInput';
import { ClayCard } from '../../components/common/ClayCard';
import { triggerHaptic } from '../../utils/haptics';

export const NewGroupModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { contacts, createNewGroup } = useChatStore();
  const palette = useThemeStore((state) => state.palette);

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
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: palette.surfaceElevated,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0,0,0,0.35)',
              borderRightColor: 'rgba(0,0,0,0.2)',
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={palette.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Group</Text>
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor:
                groupName.trim() && selectedUserIds.length > 0
                  ? palette.primary
                  : palette.surfaceElevated,
              borderTopColor:
                groupName.trim() && selectedUserIds.length > 0
                  ? palette.clayHighlight
                  : 'transparent',
              borderWidth: 1.2,
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
              backgroundColor: palette.surfaceElevated,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0,0,0,0.4)',
              borderRightColor: 'rgba(0,0,0,0.25)',
            },
          ]}
        >
          <Users size={28} color={palette.primaryLight} />
        </View>
        <ClayInput style={styles.groupInputWrapper}>
          <TextInput
            style={[styles.groupInput, { color: palette.textPrimary }]}
            placeholder="Group Name..."
            placeholderTextColor={palette.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
        </ClayInput>
      </View>

      <View style={styles.membersSection}>
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
          SELECT PARTICIPANTS ({selectedUserIds.length})
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  createBtnText: { fontWeight: '700', fontSize: 14 },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  groupIconBox: {
    width: 54,
    height: 54,
    borderRadius: 22,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  groupInputWrapper: {
    flex: 1,
    height: 54,
  },
  groupInput: {
    flex: 1,
    fontSize: 16,
  },
  membersSection: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userBio: { fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
