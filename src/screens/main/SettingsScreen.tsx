import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Moon,
  Sun,
  Palette,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Check,
  Trash2,
  UserX,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { BoldButton } from '../../components/common/BoldButton';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { BUBBLE_THEMES } from '../../theme/colors';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../config/api';

interface SettingsScreenProps {
  onOpenProfileSetup?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { user, logout, updateUserProfile } = useAuthStore();
  const { themeMode, setThemeMode, palette, setChatBubbleTheme } = useThemeStore();
  const { chats, activeChatId } = useChatStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(user?.privacy?.lastSeenVisible ?? true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(user?.privacy?.readReceiptsEnabled ?? true);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  // Delete account confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const targetChatId = activeChatId || (chats.length > 0 ? chats[0].chatId : '');

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access in device settings to update your profile avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const formData = new FormData();
        formData.append('file', {
          uri: fileUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const uploadRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url;

        if (uploadedUrl) {
          setEditAvatarUrl(uploadedUrl);
          const patchRes = await apiClient.patch('/users/me', {
            avatarUrl: uploadedUrl,
          });
          if (patchRes.data?.user) {
            updateUserProfile(patchRes.data.user);
          } else {
            updateUserProfile({ avatarUrl: uploadedUrl });
          }
          triggerHaptic('success');
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          Alert.alert('Upload Error', 'Could not obtain image URL from server.');
        }
      }
    } catch (err: any) {
      console.error('[Avatar Pick/Upload Error]', err?.message || err);
      Alert.alert('Upload Failed', 'Failed to upload profile picture. Please check your connection.');
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    triggerHaptic('medium');
    try {
      const res = await apiClient.patch('/users/me', {
        name: editName,
        bio: editBio,
        avatarUrl: editAvatarUrl,
      });
      if (res.data?.user) {
        updateUserProfile(res.data.user);
      }
      setShowProfileModal(false);
      triggerHaptic('success');
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePrivacy = async (key: 'lastSeenVisible' | 'readReceiptsEnabled', value: boolean) => {
    triggerHaptic('selection');
    if (key === 'lastSeenVisible') setLastSeenVisible(value);
    if (key === 'readReceiptsEnabled') setReadReceiptsEnabled(value);

    try {
      await apiClient.patch('/users/privacy', {
        [key]: value,
      });
    } catch (err) {
      console.error('Update privacy error:', err);
    }
  };

  const handleOpenBlockedModal = async () => {
    triggerHaptic('light');
    try {
      const res = await apiClient.get('/users/blocked');
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error('Fetch blocked users error:', err);
    }
    setShowBlockedModal(true);
  };

  const handleUnblockUser = async (userId: string) => {
    triggerHaptic('medium');
    try {
      await apiClient.post(`/users/unblock/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
      triggerHaptic('success');
    } catch (err) {
      console.error('Unblock user error:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in all caps to confirm.');
      return;
    }

    setIsUpdating(true);
    triggerHaptic('heavy');
    try {
      await apiClient.delete('/users/me');
      logout();
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectBubbleTheme = (color: string, receivedColor: string) => {
    triggerHaptic('success');
    if (targetChatId) {
      setChatBubbleTheme(targetChatId, color, receivedColor);
      apiClient.patch(`/chats/${targetChatId}/theme`, { color, receivedColor });
    }
    setShowThemeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setEditName(user?.name || '');
            setEditBio(user?.bio || '');
            setEditAvatarUrl(user?.avatarUrl || '');
            setShowProfileModal(true);
          }}
          style={[styles.userCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <View style={styles.userCardRow}>
            <Avatar url={user?.avatarUrl} name={user?.name} size="lg" isOnline={true} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: palette.textPrimary }]}>{user?.name}</Text>
              <Text style={[styles.userBio, { color: palette.textSecondary }]} numberOfLines={1}>
                {user?.bio || 'Online'}
              </Text>
              <Text style={[styles.userEmail, { color: palette.textMuted }]}>{user?.email}</Text>
            </View>
            <ChevronRight size={18} color={palette.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {/* Segmented Theme Switcher */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {themeMode === 'dark' ? <Moon size={18} color={palette.textPrimary} /> : <Sun size={18} color={palette.textPrimary} />}
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Theme</Text>
            </View>

            <View style={[styles.segmentedContainer, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              {(['dark', 'light', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    triggerHaptic('selection');
                    setThemeMode(mode);
                  }}
                  style={[
                    styles.segmentBtn,
                    themeMode === mode && [
                      styles.segmentBtnActive,
                      {
                        backgroundColor: palette.primary,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: themeMode === mode ? '#FFFFFF' : palette.textMuted },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Per-Chat Bubble Customization */}
          <TouchableOpacity onPress={() => setShowThemeModal(true)} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Palette size={18} color={palette.textPrimary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Chat Theme</Text>
            </View>
            <ChevronRight size={16} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Notifications */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>PRIVACY & SECURITY</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={18} color={palette.textPrimary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Notifications</Text>
            </View>
            <ClaySwitch
              value={notificationsEnabled}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setNotificationsEnabled(val);
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Shield size={18} color={palette.textPrimary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Last Seen Online</Text>
            </View>
            <ClaySwitch
              value={lastSeenVisible}
              onValueChange={(val) => handleTogglePrivacy('lastSeenVisible', val)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Check size={18} color={palette.textPrimary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Read Receipts</Text>
            </View>
            <ClaySwitch
              value={readReceiptsEnabled}
              onValueChange={(val) => handleTogglePrivacy('readReceiptsEnabled', val)}
            />
          </View>

          <TouchableOpacity onPress={handleOpenBlockedModal} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <UserX size={18} color={palette.textPrimary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Blocked Users</Text>
            </View>
            <ChevronRight size={16} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Account Actions */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('heavy');
              logout();
            }}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <LogOut size={18} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={18} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.error }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Edit Profile</Text>

            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarPickerWrapper}>
              <Avatar url={editAvatarUrl} name={editName} size="xl" />
              <View style={[styles.cameraBadge, { backgroundColor: palette.primary }]}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Display Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.inputBackground }]}
            />

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Bio / Status</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.inputBackground }]}
            />

            <View style={styles.modalButtonsRow}>
              <BoldButton
                title="Cancel"
                variant="surface"
                onPress={() => setShowProfileModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <BoldButton
                title="Save"
                variant="primary"
                loading={isUpdating}
                onPress={handleSaveProfile}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Bubble Theme Palette Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Chat Theme</Text>
            <Text style={[styles.modalSub, { color: palette.textMuted }]}>
              Default Blurple identity color for sent messages.
            </Text>

            <View style={styles.themeGrid}>
              {BUBBLE_THEMES.map((th) => (
                <TouchableOpacity
                  key={th.name}
                  onPress={() => handleSelectBubbleTheme(th.color, th.receivedColorDark)}
                  style={styles.themeOption}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: th.color }]}>
                    <Text style={styles.themeSwatchLabel}>
                      {th.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <BoldButton
              title="Close"
              variant="surface"
              onPress={() => setShowThemeModal(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedModal} transparent animationType="fade" onRequestClose={() => setShowBlockedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Blocked Contacts</Text>
            {blockedUsers.length === 0 ? (
              <Text style={[styles.emptyBlocked, { color: palette.textMuted }]}>No blocked users.</Text>
            ) : (
              blockedUsers.map((b) => (
                <View key={b._id} style={[styles.blockedRow, { borderBottomColor: palette.border }]}>
                  <Text style={[styles.blockedName, { color: palette.textPrimary }]}>{b.name || 'User'}</Text>
                  <BoldButton
                    title="Unblock"
                    size="sm"
                    variant="danger"
                    onPress={() => handleUnblockUser(b._id)}
                  />
                </View>
              ))
            )}
            <BoldButton
              title="Done"
              variant="surface"
              onPress={() => setShowBlockedModal(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.error }]}>Delete Account</Text>
            <Text style={[styles.modalSub, { color: palette.textSecondary }]}>
              This action is permanent and cannot be undone. Type DELETE to confirm.
            </Text>

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={palette.textMuted}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.inputBackground }]}
            />

            <View style={styles.modalButtonsRow}>
              <BoldButton
                title="Cancel"
                variant="surface"
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <BoldButton
                title="Confirm Delete"
                variant="danger"
                loading={isUpdating}
                onPress={handleDeleteAccount}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14 },
  userCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 16, fontWeight: '700' },
  userBio: { fontSize: 13, fontWeight: '400', marginTop: 1 },
  userEmail: { fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentBtnActive: {},
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 14,
  },
  avatarPickerWrapper: {
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 6,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  themeOption: {
    width: '100%',
  },
  themeSwatch: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeSwatchLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyBlocked: {
    fontSize: 13,
    fontWeight: '400',
    marginVertical: 14,
    textAlign: 'center',
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  blockedName: {
    fontSize: 14,
    fontWeight: '600',
  },
});
