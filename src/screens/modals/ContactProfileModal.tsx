import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Switch, Alert } from 'react-native';
import { Phone, Video, MessageSquare, BellOff, ShieldAlert, Clock, ChevronRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
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

  const targetChat = chats.find((c) => c.chatId === chatId || (c as any)._id === chatId);
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
        <Header title="Contact Info" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileHeader}>
            <Avatar url={contactUser.avatarUrl} name={contactUser.name} size="xl" />
            <Text style={[styles.name, { color: palette.textPrimary }]}>{contactUser.name}</Text>
            <Text style={[styles.bio, { color: palette.textSecondary }]}>{contactUser.bio}</Text>
          </View>

          <View style={[styles.actionRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
              <MessageSquare size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'voice');
              }}
              style={styles.actionBtn}
            >
              <Phone size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'video');
              }}
              style={styles.actionBtn}
            >
              <Video size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Video</Text>
            </TouchableOpacity>
          </View>

          {/* Shared Media Grid */}
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>SHARED MEDIA</Text>
          {mediaMessages.length === 0 ? (
            <View style={[styles.emptyMedia, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={{ color: palette.textMuted }}>No shared photos or videos yet</Text>
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

          {/* Options Card */}
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>CHAT SETTINGS</Text>
          <View style={[styles.optionsCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <BellOff size={20} color={palette.textMuted} />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Mute Notifications</Text>
              </View>
              <Switch
                value={isMuted}
                onValueChange={handleToggleMute}
                trackColor={{ false: '#767577', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity onPress={() => setShowDisappearingPicker(true)} style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Clock size={20} color="#8B5CF6" />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Disappearing Messages</Text>
              </View>
              <Text style={{ color: palette.primaryLight, fontWeight: '600' }}>
                {disappearingDuration === 86400 ? '24h' : disappearingDuration === 604800 ? '7 days' : 'Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleBlock} style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <ShieldAlert size={20} color={palette.error} />
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
            <View style={[styles.pickerCard, { backgroundColor: palette.surfaceElevated }]}>
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
                  {disappearingDuration === opt.value && <Text style={{ color: palette.primary, fontWeight: '800' }}>✓</Text>}
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
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  bio: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  actionBtn: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  emptyMedia: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  mediaItem: { width: '23%', height: 80, borderRadius: 12, overflow: 'hidden' },
  mediaThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 15, fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  pickerCard: { borderRadius: 24, padding: 24 },
  pickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  pickerLabel: { fontSize: 16, fontWeight: '600' },
});
