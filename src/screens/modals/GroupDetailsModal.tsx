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
  Switch,
  Clipboard,
  Dimensions,
} from 'react-native';
import {
  X,
  UserPlus,
  Crown,
  Trash2,
  Share2,
  LogOut,
  Settings,
  Edit2,
  Check,
  Shield,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
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
  const [inviteCode, setInviteCode] = useState('');
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
    setInviteCode(code);
    Clipboard.setString(`https://everchat.app/join/${code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

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
                    style={[styles.nameInput, { color: palette.textPrimary, borderColor: palette.border }]}
                  />
                  <TouchableOpacity onPress={handleSaveGroupName} style={[styles.saveNameBtn, { backgroundColor: palette.primary }]}>
                    <Check size={16} color="#FFFFFF" />
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
                      <Edit2 size={16} color={palette.primaryLight} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={[styles.participantCount, { color: palette.textMuted }]}>
                Group • {participants.length} participants
              </Text>
            </View>

            {/* Invite Link Card */}
            <TouchableOpacity
              onPress={handleShareInviteLink}
              style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Share2 size={20} color={palette.primary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>Invite via Link</Text>
                <Text style={[styles.cardSubtitle, { color: palette.textMuted }]}>
                  {copiedLink ? 'Link copied to clipboard!' : 'Share a joinable link or code'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Admin Permissions (if admin) */}
            {isMeAdmin && (
              <View style={[styles.settingsBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.settingsTitle, { color: palette.primaryLight }]}>GROUP PERMISSIONS</Text>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Only admins can send messages</Text>
                  <Switch
                    value={!!chat.onlyAdminsCanMessage}
                    onValueChange={(val) => updateGroupSettings(chat.chatId, { onlyAdminsCanMessage: val })}
                    trackColor={{ false: '#3E3E3E', true: palette.primary }}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Only admins can edit group info</Text>
                  <Switch
                    value={!!chat.onlyAdminsCanEditInfo}
                    onValueChange={(val) => updateGroupSettings(chat.chatId, { onlyAdminsCanEditInfo: val })}
                    trackColor={{ false: '#3E3E3E', true: palette.primary }}
                  />
                </View>
              </View>
            )}

            {/* Participants Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>
                PARTICIPANTS ({participants.length})
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
                      <View style={[styles.adminBadge, { backgroundColor: palette.surfaceElevated, borderColor: palette.primary }]}>
                        <Crown size={12} color={palette.primaryLight} style={{ marginRight: 4 }} />
                        <Text style={[styles.adminText, { color: palette.primaryLight }]}>Admin</Text>
                      </View>
                    )}

                    {isMeAdmin && !isMe && (
                      <View style={styles.adminControls}>
                        <TouchableOpacity
                          onPress={() => handleToggleAdmin(pId, isAdmin)}
                          style={[styles.smallIconBtn, { backgroundColor: palette.surfaceElevated }]}
                        >
                          <Shield size={14} color={isAdmin ? palette.error : palette.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveMember(pId, p.name)}
                          style={[styles.smallIconBtn, { backgroundColor: palette.surfaceElevated }]}
                        >
                          <Trash2 size={14} color={palette.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Exit Group Button */}
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveBtn}>
              <LogOut size={18} color={palette.error} style={{ marginRight: 8 }} />
              <Text style={[styles.leaveText, { color: palette.error }]}>Exit Group</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 6 },
  scroll: { maxHeight: SCREEN_HEIGHT * 0.72 },
  groupHero: { alignItems: 'center', paddingVertical: 14 },
  heroAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { fontSize: 20, fontWeight: '800' },
  editBtn: { padding: 4 },
  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nameInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 16, width: 200 },
  saveNameBtn: { padding: 8, borderRadius: 12 },
  participantCount: { fontSize: 13, marginTop: 4 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  settingsBox: { padding: 14, borderRadius: 18, borderWidth: 1, marginVertical: 10 },
  settingsTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  settingLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  section: { marginTop: 12 },
  sectionHeading: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  memberMeta: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberBio: { fontSize: 12, marginTop: 1 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  adminText: { fontSize: 11, fontWeight: '700' },
  adminControls: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  smallIconBtn: { padding: 8, borderRadius: 12 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 16 },
  leaveText: { fontSize: 15, fontWeight: '800' },
});
