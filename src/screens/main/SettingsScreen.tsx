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
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Check,
  Trash2,
  UserX,
  Camera,
  Edit2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common/Avatar';
import { BoldButton } from '../../components/common/BoldButton';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../config/api';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserProfile } = useAuthStore();
  const { palette } = useThemeStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(user?.privacy?.lastSeenVisible ?? true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(user?.privacy?.readReceiptsEnabled ?? true);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
        }
      }
    } catch (err: any) {
      console.error('[Avatar Pick/Upload Error]', err?.message || err);
      Alert.alert('Upload Failed', 'Failed to upload profile picture.');
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

  return (
    <View style={styles.container}>
      {/* Profile Hero Header */}
      <LinearGradient
        colors={['#8E0E2C', '#540F27', '#251025']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.profileHero, { paddingTop: Math.max(insets.top + 8, 20) }]}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setEditName(user?.name || '');
            setEditBio(user?.bio || '');
            setEditAvatarUrl(user?.avatarUrl || '');
            setShowProfileModal(true);
          }}
          style={styles.heroCard}
        >
          <Avatar url={user?.avatarUrl} name={user?.name} size="lg" isOnline={true} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{user?.name}</Text>
            <Text style={styles.heroBio} numberOfLines={1}>
              {user?.bio || 'Available on MeshX'}
            </Text>
            <Text style={styles.heroEmail}>{user?.email}</Text>
          </View>
          <View style={styles.editProfileBtn}>
            <Edit2 size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* White Curved Sheet for Settings Options */}
      <View style={styles.whiteCardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Privacy & Security */}
          <Text style={styles.sectionHeading}>PRIVACY & PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Bell size={18} color="#8E0E2C" />
                <Text style={styles.settingLabel}>Notifications</Text>
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
                <Shield size={18} color="#8E0E2C" />
                <Text style={styles.settingLabel}>Last Seen Online</Text>
              </View>
              <ClaySwitch
                value={lastSeenVisible}
                onValueChange={(val) => handleTogglePrivacy('lastSeenVisible', val)}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Check size={18} color="#8E0E2C" />
                <Text style={styles.settingLabel}>Read Receipts</Text>
              </View>
              <ClaySwitch
                value={readReceiptsEnabled}
                onValueChange={(val) => handleTogglePrivacy('readReceiptsEnabled', val)}
              />
            </View>

            <TouchableOpacity onPress={handleOpenBlockedModal} style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <UserX size={18} color="#8E0E2C" />
                <Text style={styles.settingLabel}>Blocked Contacts</Text>
              </View>
              <ChevronRight size={16} color="#9E9E9E" />
            </TouchableOpacity>
          </View>

          {/* Account Actions */}
          <Text style={styles.sectionHeading}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('heavy');
                logout();
              }}
              style={styles.settingRow}
            >
              <View style={styles.settingLeft}>
                <LogOut size={18} color="#C62828" />
                <Text style={[styles.settingLabel, { color: '#C62828' }]}>Log Out</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
            >
              <View style={styles.settingLeft}>
                <Trash2 size={18} color="#C62828" />
                <Text style={[styles.settingLabel, { color: '#C62828' }]}>Delete Account</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarPickerWrapper}>
              <Avatar url={editAvatarUrl} name={editName} size="xl" />
              <View style={styles.cameraBadge}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Bio / Status</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              style={styles.modalInput}
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

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedModal} transparent animationType="fade" onRequestClose={() => setShowBlockedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Blocked Contacts</Text>
            {blockedUsers.length === 0 ? (
              <Text style={styles.emptyBlocked}>No blocked contacts.</Text>
            ) : (
              blockedUsers.map((b) => (
                <View key={b._id} style={styles.blockedRow}>
                  <Text style={styles.blockedName}>{b.name || 'User'}</Text>
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
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: '#C62828' }]}>Delete Account</Text>
            <Text style={styles.modalSub}>
              This action is permanent and cannot be undone. Type DELETE to confirm.
            </Text>

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#9E9E9E"
              style={styles.modalInput}
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
  container: { flex: 1, backgroundColor: '#8E0E2C' },
  profileHero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 14,
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E0E2C',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#757575',
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
    backgroundColor: '#8E0E2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E0E2C',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  emptyBlocked: {
    fontSize: 13,
    color: '#9E9E9E',
    marginVertical: 14,
    textAlign: 'center',
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  blockedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
