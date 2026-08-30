import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Phone, Video, MessageSquare, BellOff, ShieldAlert, Clock } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../config/api';

interface ContactProfileModalProps {
  userId: string | null;
  chatId?: string;
  onClose: () => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({ userId, chatId, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const { startCall, openMediaViewer, messages, chats, contacts } = useChatStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState<number | null>(null);
  const [showDisappearingPicker, setShowDisappearingPicker] = useState(false);

  const contactUser = contacts.find((c) => (c._id || c.id || (c as any).userId) === userId) || {
    _id: userId || 'peer',
    name: 'Contact',
    avatarUrl: '',
    bio: 'MeshX User',
    email: '',
  };

  const chatMessages = (chatId && messages[chatId]) || [];

  const mediaMessages = chatMessages.filter(
    (m) => ((m.type as any) === 'image' || (m.type as any) === 'video') && m.mediaUrl
  );

  const handleToggleMute = async (val: boolean) => {
    triggerHaptic('selection');
    setIsMuted(val);
    if (chatId) {
      try {
        await apiClient.patch(`/chats/${chatId}/mute`, { muted: val });
      } catch (err) {
        console.error('Toggle mute error:', err);
      }
    }
  };

  const handleSetDisappearing = async (duration: number | null) => {
    triggerHaptic('success');
    setDisappearingDuration(duration);
    setShowDisappearingPicker(false);
    if (chatId) {
      try {
        await apiClient.patch(`/chats/${chatId}/disappearing`, { duration });
      } catch (err) {
        console.error('Update disappearing error:', err);
      }
    }
  };

  const handleToggleBlock = async () => {
    triggerHaptic('heavy');
    if (!userId) return;
    try {
      if (isBlocked) {
        await apiClient.delete(`/users/block/${userId}`);
        setIsBlocked(false);
        Alert.alert('Unblocked', `${contactUser.name} has been unblocked.`);
      } else {
        await apiClient.post(`/users/block/${userId}`);
        setIsBlocked(true);
        Alert.alert('Blocked', `${contactUser.name} has been blocked.`);
      }
    } catch (err) {
      console.error('Block toggle error:', err);
    }
  };

  if (!userId) return null;

  return (
    <Modal visible={!!userId} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Header title="User Profile" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* User Hero Banner */}
          <View style={styles.profileHeader}>
            <Avatar url={contactUser.avatarUrl} name={contactUser.name} size="xl" isOnline={true} />
            <Text style={[styles.name, { color: palette.textPrimary }]}>{contactUser.name}</Text>
            <Text style={[styles.bio, { color: palette.textSecondary }]}>{contactUser.bio || 'Online'}</Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <MessageSquare size={18} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'voice');
                }}
                style={styles.actionBtn}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Phone size={18} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Voice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'video');
                }}
                style={styles.actionBtn}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Video size={18} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Shared Media */}
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>SHARED MEDIA ({mediaMessages.length})</Text>
          {mediaMessages.length === 0 ? (
            <View style={[styles.emptyMediaCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={{ color: palette.textMuted, fontWeight: '500', textAlign: 'center', fontSize: 13 }}>
                No shared photos or videos
              </Text>
            </View>
          ) : (
            <View style={styles.mediaGrid}>
              {mediaMessages.map((msg, idx) => (
                <TouchableOpacity
                  key={msg.id || idx}
                  onPress={() => openMediaViewer(msg.mediaUrl!, msg.type as any, 'Shared Media')}
                  style={styles.mediaItem}
                >
                  <Image source={{ uri: msg.mediaUrl }} style={styles.mediaThumb} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chat Settings Card */}
          <Text style={[styles.sectionTitle, { color: palette.textMuted, marginTop: 12 }]}>CHAT SETTINGS</Text>
          <View style={[styles.optionsCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <BellOff size={18} color={palette.textMuted} />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Mute Notifications</Text>
              </View>
              <ClaySwitch
                value={isMuted}
                onValueChange={handleToggleMute}
              />
            </View>

            <TouchableOpacity onPress={() => setShowDisappearingPicker(true)} style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Clock size={18} color={palette.textMuted} />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Disappearing Messages</Text>
              </View>
              <Text style={{ color: palette.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {disappearingDuration === 86400 ? '24h' : disappearingDuration === 604800 ? '7 days' : 'Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleBlock} style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <View style={styles.optionLeft}>
                <ShieldAlert size={18} color={palette.error} />
                <Text style={[styles.optionText, { color: palette.error }]}>
                  {isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Disappearing Messages Duration Picker Modal */}
        <Modal visible={showDisappearingPicker} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowDisappearingPicker(false)}
            style={styles.pickerOverlay}
          >
            <View style={[styles.pickerCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              <Text style={[styles.pickerTitle, { color: palette.textPrimary }]}>Disappearing Messages</Text>

              {[
                { label: 'Off', value: null },
                { label: '24 Hours', value: 86400 },
                { label: '7 Days', value: 604800 },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => handleSetDisappearing(opt.value)}
                  style={[styles.pickerOption, { borderBottomColor: palette.border }]}
                >
                  <Text style={[styles.pickerLabel, { color: palette.textPrimary }]}>{opt.label}</Text>
                  {disappearingDuration === opt.value && (
                    <Text style={{ color: palette.primary, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 50 },
  profileHeader: { alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 10, letterSpacing: -0.2 },
  bio: { fontSize: 13, fontWeight: '400', textAlign: 'center', marginTop: 2 },
  actionCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionBtn: { alignItems: 'center' },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  emptyMediaCard: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mediaItem: { width: '22.5%', height: 74, borderRadius: 8, overflow: 'hidden' },
  mediaThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionsCard: { borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 14, fontWeight: '500' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  pickerCard: { padding: 18, borderRadius: 12, borderWidth: 1 },
  pickerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  pickerLabel: { fontSize: 14, fontWeight: '500' },
});
