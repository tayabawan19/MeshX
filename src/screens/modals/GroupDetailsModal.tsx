import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  UserPlus,
  ShieldCheck,
  LogOut,
  Trash2,
  Edit2,
  Copy,
  Link,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { BoldButton } from '../../components/common/BoldButton';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../config/api';

interface GroupDetailsModalProps {
  visible: boolean;
  chat: any | null;
  onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ visible, chat, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const { user } = useAuthStore();
  const {
    deleteChat,
    contacts,
    leaveGroup,
    updateGroupInfo,
    updateGroupSettings,
    getGroupInviteLink,
    removeGroupMember,
    addGroupMembers,
  } = useChatStore();

  const chatId = chat?.chatId || chat?.id || chat?._id;
  const currentUserId = user?.id || user?._id || 'usr_me';
  const isAdmin =
    chat?.groupAdmins?.includes(currentUserId) ||
    chat?.groupAdmin === currentUserId ||
    chat?.createdBy === currentUserId;

  const [groupName, setGroupName] = useState(chat?.groupName || 'Group Chat');
  const [groupDescription, setGroupDescription] = useState(
    chat?.groupDescription || 'No description provided.'
  );
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [inviteLink, setInviteLink] = useState(chat?.inviteLink || '');
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(
    chat?.groupSettings?.onlyAdminsCanSend ?? false
  );

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedContactToAdd, setSelectedContactToAdd] = useState<string | null>(null);

  const participants = chat?.participants || [];

  const handleSaveInfo = async () => {
    triggerHaptic('medium');
    try {
      if (chatId) {
        await updateGroupInfo(chatId, {
          groupName,
          groupDescription,
        });
      }
      setIsEditingInfo(false);
      triggerHaptic('success');
    } catch (err) {
      console.error('Update group info error:', err);
    }
  };

  const handleToggleAdminOnly = async (val: boolean) => {
    triggerHaptic('selection');
    setOnlyAdminsCanSend(val);
    try {
      if (chatId) {
        await updateGroupSettings(chatId, {
          onlyAdminsCanSend: val,
        });
      }
    } catch (err) {
      console.error('Update settings error:', err);
    }
  };

  const handleGenerateInviteLink = async () => {
    triggerHaptic('selection');
    try {
      if (chatId) {
        const code = await getGroupInviteLink(chatId);
        setInviteLink(code ? `https://meshx.app/join/${code}` : `https://meshx.app/join/${chatId}`);
      }
      triggerHaptic('success');
    } catch (err) {
      setInviteLink(`https://meshx.app/join/${chatId}`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('heavy');
          try {
            if (chatId) {
              await removeGroupMember(chatId, memberId);
            }
            triggerHaptic('success');
          } catch (err) {
            console.error('Remove member error:', err);
          }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    if (!selectedContactToAdd || !chatId) return;
    triggerHaptic('selection');
    try {
      await addGroupMembers(chatId, [selectedContactToAdd]);
      setShowAddMemberModal(false);
      setSelectedContactToAdd(null);
      triggerHaptic('success');
    } catch (err) {
      console.error('Add member error:', err);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('heavy');
          try {
            if (chatId) {
              await leaveGroup(chatId);
            }
            onClose();
          } catch (err) {
            console.error('Leave group error:', err);
          }
        },
      },
    ]);
  };

  if (!visible || !chat) return null;

  return (
    <Modal visible={visible && !!chat} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Header title="Group Info" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Group Header Hero */}
          <View style={styles.profileHeader}>
            <Avatar url={chat.groupAvatar || chat.groupAvatarUrl} name={groupName} size="xl" />

            {isEditingInfo ? (
              <View style={styles.editInfoContainer}>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  style={styles.editInput}
                  placeholder="Group Name"
                  placeholderTextColor="#9E9E9E"
                />
                <TextInput
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  style={[styles.editInput, { height: 60 }]}
                  placeholder="Group Description"
                  placeholderTextColor="#9E9E9E"
                  multiline
                />
                <BoldButton title="Save Changes" size="sm" onPress={handleSaveInfo} />
              </View>
            ) : (
              <>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{groupName}</Text>
                  {isAdmin && (
                    <TouchableOpacity onPress={() => setIsEditingInfo(true)} style={styles.editBtn}>
                      <Edit2 size={15} color="#8E0E2C" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.bio}>{groupDescription}</Text>
                <Text style={styles.memberCountText}>
                  {participants.length} Members
                </Text>
              </>
            )}
          </View>

          {/* Group Admin Permissions */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>GROUP SETTINGS</Text>
              <View style={styles.optionsCard}>
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <ShieldCheck size={18} color="#8E0E2C" />
                    <Text style={styles.optionText}>Only Admins Can Send</Text>
                  </View>
                  <ClaySwitch
                    value={onlyAdminsCanSend}
                    onValueChange={handleToggleAdminOnly}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleGenerateInviteLink}
                  style={[styles.optionRow, { borderBottomWidth: 0 }]}
                >
                  <View style={styles.optionLeft}>
                    <Link size={18} color="#8E0E2C" />
                    <Text style={styles.optionText}>
                      {inviteLink ? 'Copy Invite Link' : 'Generate Invite Link'}
                    </Text>
                  </View>
                  {inviteLink ? (
                    <Copy size={16} color="#8E0E2C" />
                  ) : null}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Participants List Card */}
          <View style={styles.participantsHeaderRow}>
            <Text style={styles.sectionTitle}>MEMBERS ({participants.length})</Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowAddMemberModal(true)}
                style={styles.addMemberBtn}
              >
                <UserPlus size={14} color="#8E0E2C" style={{ marginRight: 4 }} />
                <Text style={styles.addMemberText}>Add Member</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.optionsCard}>
            {participants.map((p: any, idx: number) => {
              const pId = p.id || p._id || p.userId;
              const isPAdmin =
                chat.groupAdmins?.includes(pId) ||
                chat.groupAdmin === pId ||
                chat.createdBy === pId;
              const isMe = pId === currentUserId;

              return (
                <View
                  key={pId || idx}
                  style={[
                    styles.participantRow,
                    idx === participants.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Avatar url={p.avatarUrl} name={p.name || 'User'} size="md" />
                  <View style={styles.pInfo}>
                    <Text style={styles.pName}>
                      {p.name || 'Member'} {isMe && '(You)'}
                    </Text>
                    <Text style={styles.pRole}>{isPAdmin ? 'Admin' : 'Member'}</Text>
                  </View>

                  {isAdmin && !isMe && (
                    <TouchableOpacity onPress={() => handleRemoveMember(pId)} style={styles.removeBtn}>
                      <Trash2 size={15} color="#C62828" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Leave / Delete Group Card */}
          <View style={[styles.optionsCard, { marginTop: 14 }]}>
            <TouchableOpacity onPress={handleLeaveGroup} style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <View style={styles.optionLeft}>
                <LogOut size={18} color="#C62828" />
                <Text style={[styles.optionText, { color: '#C62828' }]}>Exit Group</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Member Modal */}
        <Modal visible={showAddMemberModal} transparent animationType="fade">
          <View style={styles.addModalOverlay}>
            <View style={styles.addCard}>
              <Text style={styles.addTitle}>Add Member</Text>
              <ScrollView style={{ maxHeight: 240, marginVertical: 10 }}>
                {contacts.map((c) => {
                  const cId = c.id || c._id || '';
                  const isSelected = selectedContactToAdd === cId;
                  return (
                    <TouchableOpacity
                      key={cId}
                      onPress={() => setSelectedContactToAdd(cId || null)}
                      style={[styles.addContactRow, isSelected && styles.addContactSelected]}
                    >
                      <Avatar url={c.avatarUrl} name={c.name} size="sm" />
                      <Text style={styles.addContactName}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.addBtnsRow}>
                <BoldButton
                  title="Cancel"
                  variant="surface"
                  onPress={() => setShowAddMemberModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <BoldButton
                  title="Add"
                  variant="primary"
                  disabled={!selectedContactToAdd}
                  onPress={handleAddMember}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 18, paddingBottom: 50 },
  profileHeader: { alignItems: 'center', marginVertical: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  name: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  editBtn: { padding: 4 },
  bio: { fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 3 },
  memberCountText: { fontSize: 12, fontWeight: '600', color: '#8E0E2C', marginTop: 4 },
  editInfoContainer: { width: '100%', marginTop: 14, gap: 10 },
  editInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#8E0E2C', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  participantsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  addMemberText: { fontSize: 12, fontWeight: '700', color: '#8E0E2C' },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pInfo: { flex: 1, marginLeft: 12 },
  pName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  pRole: { fontSize: 11, color: '#757575' },
  removeBtn: { padding: 8 },
  addModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  addCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  addTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  addContactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8 },
  addContactSelected: { backgroundColor: 'rgba(142, 14, 44, 0.08)' },
  addContactName: { fontSize: 14, fontWeight: '600', marginLeft: 10, color: '#1A1A1A' },
  addBtnsRow: { flexDirection: 'row', marginTop: 10 },
});
