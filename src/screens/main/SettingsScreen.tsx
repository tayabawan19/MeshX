import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Moon,
  Sun,
  Palette,
  Bell,
  Shield,
  Image as ImageIcon,
  ChevronRight,
  LogOut,
  Check,
  X,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { BUBBLE_THEMES } from '../../theme/colors';
import { triggerHaptic } from '../../utils/haptics';

interface SettingsScreenProps {
  onOpenProfileSetup: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenProfileSetup }) => {
  const { user, logout } = useAuthStore();
  const { themeMode, toggleTheme, palette, setChatBubbleTheme } = useThemeStore();
  const { chats, activeChatId } = useChatStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const targetChatId = activeChatId || (chats.length > 0 ? chats[0].chatId : 'chat_sarah');

  const handleSelectBubbleTheme = (gradient: [string, string], receivedColor: string) => {
    triggerHaptic('success');
    setChatBubbleTheme(targetChatId, gradient, receivedColor);
    setShowThemeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Settings & Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenProfileSetup}
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
          {/* Dark / Light Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {themeMode === 'dark' ? <Moon size={22} color="#8B5CF6" /> : <Sun size={22} color="#F59E0B" />}
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>
                {themeMode === 'dark' ? 'True Dark Mode (#0F0F14)' : 'Light Theme'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={() => {
                triggerHaptic('selection');
                toggleTheme();
              }}
              trackColor={{ false: '#767577', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Per-Chat Bubble Customization */}
          <TouchableOpacity onPress={() => setShowThemeModal(true)} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Palette size={22} color="#EC4899" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Per-Chat Bubble Themes</Text>
            </View>
            <ChevronRight size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Notifications */}
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>PREFERENCES & PRIVACY</Text>
        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={22} color="#3B82F6" />
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Push Notifications</Text>
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
              <Text style={[styles.settingLabel, { color: palette.textPrimary }]}>Read Receipts (✓✓)</Text>
            </View>
            <Switch
              value={readReceiptsEnabled}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setReadReceiptsEnabled(val);
              }}
              trackColor={{ false: '#767577', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('heavy');
            logout();
          }}
          style={[styles.logoutBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <LogOut size={20} color={palette.error} />
          <Text style={[styles.logoutText, { color: palette.error }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

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
              Customize sent & received message colors for your active conversation.
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userBio: {
    fontSize: 13,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 14,
    marginBottom: 20,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-around',
  },
  themeOption: {
    alignItems: 'center',
  },
  themeGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
  },
});
