import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Switch, Alert } from 'react-native';
import { Phone, Video, MessageSquare, BellOff, ShieldAlert, Clock, ChevronRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { BoldCard } from '../../components/common/BoldCard';
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
          {/* User Hero Banner */}
          <View style={styles.profileHeader}>
            <Avatar url={contactUser.avatarUrl} name={contactUser.name} size="xl" />
            <Text style={[styles.name, { color: palette.textPrimary }]}>{contactUser.name}</Text>
            <Text style={[styles.bio, { color: palette.textSecondary }]}>{contactUser.bio || 'Available on MeshX'}</Text>
          </View>

          {/* Quick Action Grid */}
          <BoldCard borderRadius={22} shadowOffset={3} style={styles.actionCard}>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
                  <MessageSquare size={20} color="#100F17" strokeWidth={2.5} />
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
                <View style={[styles.actionIconCircle, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
                  <Phone size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'video');
                }}
                style={styles.actionBtn}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: palette.accent, borderColor: '#000000' }]}>
                  <Video size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Video</Text>
              </TouchableOpacity>
            </View>
          </BoldCard>

          {/* Shared Media Grid */}
          <Text style={[styles.sectionTitle, { color: palette.secondary }]}>SHARED MEDIA ({mediaMessages.length})</Text>
          {mediaMessages.length === 0 ? (
            <BoldCard borderRadius={18} shadowOffset={2} style={styles.emptyMediaCard}>
              <Text style={{ color: palette.textMuted, fontWeight: '600', textAlign: 'center' }}>
                No shared photos or videos yet
              </Text>
            </BoldCard>
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
          <Text style={[styles.sectionTitle, { color: palette.secondary, marginTop: 12 }]}>CHAT SETTINGS</Text>
          <BoldCard borderRadius={20} shadowOffset={3} style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <BellOff size={20} color={palette.textMuted} strokeWidth={2.5} />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Mute Notifications</Text>
              </View>
              <Switch
                value={isMuted}
                onValueChange={handleToggleMute}
                trackColor={{ false: '#3A394D', true: palette.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity onPress={() => setShowDisappearingPicker(true)} style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Clock size={20} color={palette.highlight} strokeWidth={2.5} />
                <Text style={[styles.optionText, { color: palette.textPrimary }]}>Disappearing Messages</Text>
              </View>
              <Text style={{ color: palette.secondary, fontWeight: '800' }}>
                {disappearingDuration === 86400 ? '24h' : disappearingDuration === 604800 ? '7 days' : 'Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleBlock} style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <View style={styles.optionLeft}>
                <ShieldAlert size={20} color={palette.error} strokeWidth={2.5} />
                <Text style={[styles.optionText, { color: palette.error }]}>
                  {isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </Text>
              </View>
            </TouchableOpacity>
          </BoldCard>
        </ScrollView>

        {/* Disappearing Messages Duration Picker Modal */}
        <Modal visible={showDisappearingPicker} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowDisappearingPicker(false)}
            style={styles.pickerOverlay}
          >
            <BoldCard borderRadius={24} shadowOffset={4} style={styles.pickerCard}>
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
                    <Text style={{ color: palette.secondary, fontWeight: '900' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </BoldCard>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 60 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 24, fontWeight: '900', marginTop: 14, letterSpacing: -0.4 },
  bio: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  actionCard: { marginBottom: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionBtn: { alignItems: 'center' },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  emptyMediaCard: { padding: 16, marginBottom: 20 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  mediaItem: { width: '22.5%', height: 80, borderRadius: 14, borderWidth: 2, borderColor: '#000000', overflow: 'hidden' },
  mediaThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionsCard: { marginBottom: 20 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 15, fontWeight: '800' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  pickerCard: { padding: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, textAlign: 'center', letterSpacing: -0.3 },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  pickerLabel: { fontSize: 16, fontWeight: '700' },
});
