import React, { useState, useEffect } from 'react';
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
  User,
  Moon,
  Sun,
  Palette,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Check,
  X,
  Trash2,
  Lock,
  UserX,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { BoldCard } from '../../components/common/BoldCard';
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
  const { themeMode, toggleTheme, setThemeMode, palette, setChatBubbleTheme } = useThemeStore();
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

        console.log('[AvatarUpload] Uploading avatar to /api/media/upload...');
        const uploadRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url;
        console.log('[AvatarUpload Success]', uploadedUrl);

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
      <Header title="Settings & Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <BoldCard
          borderRadius={20}
          onPress={() => {
            setEditName(user?.name || '');
            setEditBio(user?.bio || '');
            setEditAvatarUrl(user?.avatarUrl || '');
            setShowProfileModal(true);
          }}
          style={styles.userCard}
        >
          <View style={styles.userCardRow}>
            <Avatar url={user?.avatarUrl} name={user?.name} size="xl" />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: palette.textPrimary }]}>{user?.name}</Text>
              <Text style={[styles.userBio, { color: palette.textSecondary }]} numberOfLines={1}>
                {user?.bio || 'Available on MeshX'}
              </Text>
              <Text style={[styles.userEmail, { color: palette.secondary }]}>{user?.email}</Text>
            </View>
            <ChevronRight size={22} color={palette.textMuted} />
          </View>
        </BoldCard>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: palette.secondary }]}>APPEARANCE</Text>
        <BoldCard borderRadius={20} style={styles.sectionCard}>
          {/* Segmented Theme Switcher */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {themeMode === 'dark' ? <Moon size={22} color={palette.primary} /> : <Sun size={22} color={palette.highlight} />}
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Theme</Text>
            </View>

            <View style={[styles.segmentedContainer, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
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
                        backgroundColor: palette.secondary,
                        borderColor: '#000000',
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: themeMode === mode ? '#100F17' : palette.textMuted },
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
              <Palette size={22} color={palette.accent} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Chat Accent Palette</Text>
            </View>
            <ChevronRight size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </BoldCard>

        {/* Section: Privacy & Notifications */}
        <Text style={[styles.sectionTitle, { color: palette.secondary }]}>PRIVACY & SECURITY</Text>
        <BoldCard borderRadius={20} style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={22} color={palette.accent} />
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
              <Shield size={22} color={palette.secondary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Last Seen Online</Text>
            </View>
            <ClaySwitch
              value={lastSeenVisible}
              onValueChange={(val) => handleTogglePrivacy('lastSeenVisible', val)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Check size={22} color={palette.primary} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Read Receipts</Text>
            </View>
            <ClaySwitch
              value={readReceiptsEnabled}
              onValueChange={(val) => handleTogglePrivacy('readReceiptsEnabled', val)}
            />
          </View>

          <TouchableOpacity onPress={handleOpenBlockedModal} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <UserX size={22} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Blocked Users</Text>
            </View>
            <ChevronRight size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </BoldCard>

        {/* Section: Account Actions */}
        <Text style={[styles.sectionTitle, { color: palette.secondary }]}>ACCOUNT</Text>
        <BoldCard borderRadius={20} style={styles.sectionCard}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('heavy');
              logout();
            }}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <LogOut size={22} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={22} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.error }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </BoldCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Edit Profile</Text>

            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarPickerWrapper}>
              <Avatar url={editAvatarUrl} name={editName} size="xl" />
              <View style={[styles.cameraBadge, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Display Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: '#000000', backgroundColor: palette.inputBackground }]}
            />

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Bio / Status</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: '#000000', backgroundColor: palette.inputBackground }]}
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
      <Modal visible={showThemeModal} transparent animationType="slide" onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Chat Accent Palette</Text>
            <Text style={[styles.modalSub, { color: palette.textMuted }]}>
              Choose a saturated flat accent color for chat message bubbles.
            </Text>

            <View style={styles.themeGrid}>
              {BUBBLE_THEMES.map((th) => (
                <TouchableOpacity
                  key={th.name}
                  onPress={() => handleSelectBubbleTheme(th.color, th.receivedColorDark)}
                  style={styles.themeOption}
                >
                  <View style={styles.themeSwatchShadow} />
                  <View style={[styles.themeSwatch, { backgroundColor: th.color, borderColor: '#000000' }]}>
                    <Text style={[styles.themeSwatchLabel, { color: th.color === '#C6FF3D' || th.color === '#FFD23F' || th.color === '#00F0FF' ? '#100F17' : '#FFFFFF' }]}>
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
      <Modal visible={showBlockedModal} transparent animationType="slide" onRequestClose={() => setShowBlockedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Blocked Contacts</Text>
            {blockedUsers.length === 0 ? (
              <Text style={[styles.emptyBlocked, { color: palette.textMuted }]}>No blocked users.</Text>
            ) : (
              blockedUsers.map((b) => (
                <View key={b._id} style={styles.blockedRow}>
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
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.modalTitle, { color: palette.error }]}>Delete Account</Text>
            <Text style={[styles.modalSub, { color: palette.textSecondary }]}>
              This action is permanent and cannot be undone. Type DELETE to confirm.
            </Text>

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={palette.textMuted}
              style={[styles.modalInput, { color: palette.textPrimary, borderColor: '#000000', backgroundColor: palette.inputBackground }]}
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
  content: { padding: 16 },
  userCard: { marginBottom: 16 },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  userBio: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  userEmail: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: { marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  segmentBtnActive: {
    borderWidth: 1.5,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 22,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  avatarPickerWrapper: {
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 14,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  themeOption: {
    width: '47%',
    position: 'relative',
  },
  themeSwatchShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  themeSwatch: {
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  themeSwatchLabel: {
    fontWeight: '900',
    fontSize: 14,
  },
  emptyBlocked: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 16,
    textAlign: 'center',
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  blockedName: {
    fontSize: 15,
    fontWeight: '800',
  },
});
