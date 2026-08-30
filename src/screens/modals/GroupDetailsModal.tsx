import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Clipboard,
  Dimensions,
} from 'react-native';
import {
  X,
  Crown,
  Trash2,
  Share2,
  LogOut,
  Edit2,
  Check,
  Shield,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { Chat, UserProfile } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GroupDetailsModalProps {
  visible: boolean;
  chat: Chat | null;
  onClose: () => void;
  onLeaveGroupSuccess?: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  visible,
  chat,
  onClose,
  onLeaveGroupSuccess,
}) => {
  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const {
    promoteDemoteAdmin,
    removeGroupMember,
    leaveGroup,
    updateGroupSettings,
    updateGroupInfo,
    getGroupInviteLink,
  } = useChatStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!visible || !chat || chat.type !== 'group') return null;

  const currentUserId = user?.id || user?._id || user?.userId || '';
  const adminIds = (chat.admins || []).map((a: any) => (typeof a === 'object' ? a._id || a.id : a));
  const isMeAdmin = adminIds.includes(currentUserId);

  const participants = chat.participantProfiles || (chat.participants as UserProfile[]) || [];

  const handleToggleAdmin = (targetId: string, isCurrentlyAdmin: boolean) => {
    triggerHaptic('selection');
    promoteDemoteAdmin(chat.chatId, targetId, isCurrentlyAdmin ? 'demote' : 'promote');
  };

  const handleRemoveMember = (targetId: string, memberName: string) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${memberName} from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('heavy');
          removeGroupMember(chat.chatId, targetId);
        },
      },
    ]);
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('heavy');
          await leaveGroup(chat.chatId);
          if (onLeaveGroupSuccess) onLeaveGroupSuccess();
          onClose();
        },
      },
    ]);
  };

  const handleSaveGroupName = async () => {
    if (!groupName.trim()) return;
    await updateGroupInfo(chat.chatId, { groupName: groupName.trim() });
    setIsEditingName(false);
  };

  const handleShareInviteLink = async () => {
    triggerHaptic('light');
    const code = await getGroupInviteLink(chat.chatId);
    Clipboard.setString(`https://everchat.app/join/${code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

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
            <Text style={[styles.title, { color: palette.textPrimary }]}>Group Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {/* Group Banner & Avatar */}
            <View style={styles.groupHero}>
              <Image
                source={{
                  uri:
                    chat.groupAvatar ||
                    chat.groupAvatarUrl ||
                    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.heroAvatar}
              />

              {isEditingName ? (
                <View style={styles.editNameRow}>
                  <TextInput
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group name"
                    placeholderTextColor={palette.textMuted}
                    style={[styles.nameInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.inputBackground }]}
                  />
                  <TouchableOpacity onPress={handleSaveGroupName} style={[styles.saveNameBtn, { backgroundColor: palette.primary }]}>
                    <Check size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.groupNameRow}>
                  <Text style={[styles.groupName, { color: palette.textPrimary }]}>{chat.groupName || 'Group'}</Text>
                  {isMeAdmin && (
                    <TouchableOpacity
                      onPress={() => {
                        setGroupName(chat.groupName || '');
                        setIsEditingName(true);
                      }}
                      style={styles.editBtn}
                    >
                      <Edit2 size={14} color={palette.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={[styles.participantCount, { color: palette.textMuted }]}>
                {participants.length} Members
              </Text>
            </View>

            {/* Invite Link Card */}
            <TouchableOpacity
              onPress={handleShareInviteLink}
              style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Share2 size={18} color={palette.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>Invite via Link</Text>
                <Text style={[styles.cardSubtitle, { color: palette.textMuted }]}>
                  {copiedLink ? 'Link copied to clipboard!' : 'Share a joinable link or code'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Admin Permissions */}
            {isMeAdmin && (
              <View style={[styles.settingsBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.settingsTitle, { color: palette.textMuted }]}>PERMISSIONS</Text>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Only admins can send messages</Text>
                  <ClaySwitch
                    value={!!chat.onlyAdminsCanMessage}
                    onValueChange={(val) => updateGroupSettings(chat.chatId, { onlyAdminsCanMessage: val })}
                  />
                </View>
                <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Only admins can edit group info</Text>
                  <ClaySwitch
                    value={!!chat.onlyAdminsCanEditInfo}
                    onValueChange={(val) => updateGroupSettings(chat.chatId, { onlyAdminsCanEditInfo: val })}
                  />
                </View>
              </View>
            )}

            {/* Participants Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>
                MEMBERS — {participants.length}
              </Text>

              {participants.map((p, idx) => {
                const pId = p.id || p._id || (p as any).userId;
                const isAdmin = adminIds.includes(pId);
                const isMe = pId === currentUserId;

                return (
                  <View key={idx} style={styles.memberRow}>
                    <Image
                      source={{
                        uri:
                          p.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                      }}
                      style={styles.memberAvatar}
                    />
                    <View style={styles.memberMeta}>
                      <Text style={[styles.memberName, { color: palette.textPrimary }]}>
                        {p.name} {isMe ? '(You)' : ''}
                      </Text>
                      <Text style={[styles.memberBio, { color: palette.textMuted }]} numberOfLines={1}>
                        {p.bio || p.email}
                      </Text>
                    </View>

                    {isAdmin && (
                      <View style={[styles.adminBadge, { backgroundColor: palette.surfaceLight }]}>
                        <Crown size={11} color={palette.warning} style={{ marginRight: 3 }} />
                        <Text style={[styles.adminText, { color: palette.warning }]}>Admin</Text>
                      </View>
                    )}

                    {isMeAdmin && !isMe && (
                      <View style={styles.adminControls}>
                        <TouchableOpacity
                          onPress={() => handleToggleAdmin(pId, isAdmin)}
                          style={[styles.smallIconBtn, { backgroundColor: palette.surfaceLight }]}
                        >
                          <Shield size={13} color={isAdmin ? palette.error : palette.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveMember(pId, p.name)}
                          style={[styles.smallIconBtn, { backgroundColor: palette.surfaceLight }]}
                        >
                          <Trash2 size={13} color={palette.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Exit Group Button */}
            <TouchableOpacity onPress={handleLeaveGroup} style={[styles.leaveBtn, { borderColor: palette.error }]}>
              <LogOut size={16} color={palette.error} style={{ marginRight: 6 }} />
              <Text style={[styles.leaveText, { color: palette.error }]}>Leave Group</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: SCREEN_HEIGHT * 0.7 },
  groupHero: { alignItems: 'center', marginVertical: 10 },
  heroAvatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { fontSize: 18, fontWeight: '700' },
  editBtn: { padding: 4 },
  participantCount: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14, fontWeight: '500' },
  saveNameBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardSubtitle: { fontSize: 11, marginTop: 1 },
  settingsBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginVertical: 6 },
  settingsTitle: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  settingLabel: { fontSize: 13, fontWeight: '500', flex: 1, marginRight: 10 },
  section: { marginVertical: 10 },
  sectionHeading: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  memberMeta: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberBio: { fontSize: 11, marginTop: 1 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminText: { fontSize: 10, fontWeight: '700' },
  adminControls: { flexDirection: 'row', gap: 4, marginLeft: 6 },
  smallIconBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
  },
  leaveText: { fontSize: 14, fontWeight: '700' },
});
