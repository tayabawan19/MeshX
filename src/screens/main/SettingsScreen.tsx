import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
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

        if (uploadRes.data?.url) {
          setEditAvatarUrl(uploadRes.data.url);
          triggerHaptic('success');
        }
      }
    } catch (err) {
      console.error('Avatar pick error:', err);
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
        lastSeenVisible: key === 'lastSeenVisible' ? value : lastSeenVisible,
        readReceiptsEnabled: key === 'readReceiptsEnabled' ? value : readReceiptsEnabled,
      });
    } catch (err) {
      console.error('Privacy update error:', err);
    }
  };

  const handleOpenBlockedModal = async () => {
    triggerHaptic('light');
    setShowBlockedModal(true);
    try {
      const res = await apiClient.get('/users/blocked');
      if (res.data?.blockedUsers) {
        setBlockedUsers(res.data.blockedUsers);
      }
    } catch (err) {
      console.error('Fetch blocked users error:', err);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    triggerHaptic('light');
    try {
      await apiClient.delete(`/users/block/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Unblock user error:', err);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE to confirm account deletion.');
      return;
    }

    triggerHaptic('heavy');
    setIsUpdating(true);
    try {
      await apiClient.delete('/users/me');
      logout();
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectBubbleTheme = (gradient: [string, string], receivedColor: string) => {
    triggerHaptic('success');
    if (targetChatId) {
      setChatBubbleTheme(targetChatId, gradient, receivedColor);
      apiClient.patch(`/chats/${targetChatId}/theme`, { sentGradient: gradient, receivedColor });
    }
    setShowThemeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Settings & Profile" />

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
          <Avatar url={user?.avatarUrl} name={user?.name} size="xl" />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: palette.textPrimary }]}>{user?.name}</Text>
            <Text style={[styles.userBio, { color: palette.textSecondary }]} numberOfLines={1}>
              {user?.bio || 'Available on MeshX'}
            </Text>
            <Text style={[styles.userEmail, { color: palette.primaryLight }]}>{user?.email}</Text>
          </View>
          <ChevronRight size={20} color={palette.textMuted} />
        </TouchableOpacity>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {/* Segmented Theme Switcher */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {themeMode === 'dark' ? <Moon size={22} color="#8B5CF6" /> : <Sun size={22} color="#F59E0B" />}
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Theme</Text>
            </View>

            <View style={styles.segmentedContainer}>
              {(['dark', 'light', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    triggerHaptic('selection');
                    setThemeMode(mode);
                  }}
                  style={[
                    styles.segmentBtn,
                    themeMode === mode && { backgroundColor: palette.primary },
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
          <TouchableOpacity onPress={() => setShowThemeModal(true)} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Palette size={22} color="#EC4899" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Bubble Theme Picker</Text>
            </View>
            <ChevronRight size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Notifications */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>PRIVACY & NOTIFICATIONS</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={22} color="#3B82F6" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Message Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setNotificationsEnabled(val);
              }}
              trackColor={{ false: '#767577', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Shield size={22} color="#10B981" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Show Last Seen</Text>
            </View>
            <Switch
              value={lastSeenVisible}
              onValueChange={(val) => handleTogglePrivacy('lastSeenVisible', val)}
              trackColor={{ false: '#767577', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Check size={22} color="#6366F1" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Read Receipts (✓✓)</Text>
            </View>
            <Switch
              value={readReceiptsEnabled}
              onValueChange={(val) => handleTogglePrivacy('readReceiptsEnabled', val)}
              trackColor={{ false: '#767577', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity onPress={handleOpenBlockedModal} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <UserX size={22} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Blocked Users</Text>
            </View>
            <ChevronRight size={20} color={palette.textMuted} />
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
              <LogOut size={22} color={palette.error} />
              <Text style={[styles.settingLabel, { color: palette.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('heavy');
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={22} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={24} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <TouchableOpacity onPress={handlePickAvatar} style={{ position: 'relative' }}>
                <Avatar url={editAvatarUrl} name={editName} size="xl" />
                <View style={styles.avatarBadge}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: palette.textMuted }]}>Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.input, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.surface }]}
            />

            <Text style={[styles.inputLabel, { color: palette.textMuted }]}>Bio Status</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              multiline
              style={[styles.input, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.surface, height: 80 }]}
            />

            <TouchableOpacity
              disabled={isUpdating}
              onPress={handleSaveProfile}
              style={[styles.saveBtn, { backgroundColor: palette.primary }]}
            >
              <Text style={styles.saveBtnText}>{isUpdating ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated, maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Blocked Users</Text>
              <TouchableOpacity onPress={() => setShowBlockedModal(false)}>
                <X size={24} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            {blockedUsers.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <UserX size={40} color={palette.textMuted} />
                <Text style={{ color: palette.textMuted, marginTop: 12 }}>No blocked users</Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 12 }}>
                {blockedUsers.map((bUser) => (
                  <View key={bUser._id} style={[styles.blockedRow, { borderBottomColor: palette.border }]}>
                    <Avatar url={bUser.avatarUrl} name={bUser.name} size="md" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>{bUser.name}</Text>
                      <Text style={{ color: palette.textMuted, fontSize: 12 }}>{bUser.bio || 'Blocked'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblockUser(bUser._id)}
                      style={[styles.unblockBtn, { backgroundColor: palette.surface }]}
                    >
                      <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalCardCenter, { backgroundColor: palette.surfaceElevated }]}>
            <Trash2 size={44} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.deleteTitle, { color: palette.textPrimary }]}>Delete Account?</Text>
            <Text style={[styles.deleteSub, { color: palette.textMuted }]}>
              This action is permanent and cannot be undone. Type <Text style={{ fontWeight: '800', color: '#EF4444' }}>DELETE</Text> below to confirm.
            </Text>

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="characters"
              style={[styles.input, { color: palette.textPrimary, borderColor: palette.border, textAlign: 'center', fontWeight: '800' }]}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={[styles.cancelBtn, { borderColor: palette.border }]}
              >
                <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccountConfirm}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bubble Theme Picker Modal */}
      <Modal visible={showThemeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Choose Bubble Gradient</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <X size={24} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: palette.textSecondary }]}>
              Select colors for sent and received message bubbles.
            </Text>

            <View style={styles.themesGrid}>
              {BUBBLE_THEMES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    handleSelectBubbleTheme(item.gradient, themeMode === 'dark' ? item.receivedColorDark : item.receivedColorLight)
                  }
                  style={styles.themeOption}
                >
                  <LinearGradient colors={item.gradient} style={styles.themeGradient}>
                    <Check size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.themeName, { color: palette.textPrimary }]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
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
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 18, fontWeight: '700' },
  userBio: { fontSize: 13, marginTop: 2 },
  userEmail: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 20, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  segmentedContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3 },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  segmentText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSub: { fontSize: 14, marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  saveBtn: { height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#7C3AED', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  blockedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  unblockBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalCardCenter: { borderRadius: 24, padding: 24 },
  deleteTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  deleteSub: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteBtn: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  themesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-around' },
  themeOption: { alignItems: 'center' },
  themeGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  themeName: { fontSize: 12, fontWeight: '600' },
});
