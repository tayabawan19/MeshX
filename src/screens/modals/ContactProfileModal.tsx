import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Phone, Video, MessageSquare, BellOff, ShieldAlert, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View style={styles.container}>
        <Header title="Contact Info" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* User Hero Banner */}
          <View style={styles.profileHeader}>
            <Avatar url={contactUser.avatarUrl} name={contactUser.name} size="xl" isOnline={true} />
            <Text style={styles.name}>{contactUser.name}</Text>
            <Text style={styles.bio}>{contactUser.bio || 'Available on MeshX'}</Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionCard}>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                <View style={styles.actionIconCircle}>
                  <MessageSquare size={18} color="#8E0E2C" />
                </View>
                <Text style={styles.actionText}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'voice');
                }}
                style={styles.actionBtn}
              >
                <View style={styles.actionIconCircle}>
                  <Phone size={18} color="#8E0E2C" />
                </View>
                <Text style={styles.actionText}>Voice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(userId, contactUser.name, contactUser.avatarUrl || '', 'video');
                }}
                style={styles.actionBtn}
              >
                <View style={styles.actionIconCircle}>
                  <Video size={18} color="#8E0E2C" />
                </View>
                <Text style={styles.actionText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Shared Media */}
          <Text style={styles.sectionTitle}>SHARED MEDIA ({mediaMessages.length})</Text>
          {mediaMessages.length === 0 ? (
            <View style={styles.emptyMediaCard}>
              <Text style={styles.emptyMediaText}>
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
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>CHAT SETTINGS</Text>
          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <BellOff size={18} color="#8E0E2C" />
                <Text style={styles.optionText}>Mute Notifications</Text>
              </View>
              <ClaySwitch
                value={isMuted}
                onValueChange={handleToggleMute}
              />
            </View>

            <TouchableOpacity onPress={() => setShowDisappearingPicker(true)} style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Clock size={18} color="#8E0E2C" />
                <Text style={styles.optionText}>Disappearing Messages</Text>
              </View>
              <Text style={styles.optionValue}>
                {disappearingDuration === 86400 ? '24h' : disappearingDuration === 604800 ? '7 days' : 'Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleBlock} style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <View style={styles.optionLeft}>
                <ShieldAlert size={18} color="#C62828" />
                <Text style={[styles.optionText, { color: '#C62828' }]}>
                  {isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Disappearing Duration Picker */}
        <Modal visible={showDisappearingPicker} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowDisappearingPicker(false)}
            style={styles.pickerOverlay}
          >
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Disappearing Messages</Text>

              {[
                { label: 'Off', value: null },
                { label: '24 Hours', value: 86400 },
                { label: '7 Days', value: 604800 },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => handleSetDisappearing(opt.value)}
                  style={styles.pickerOption}
                >
                  <Text style={styles.pickerLabel}>{opt.label}</Text>
                  {disappearingDuration === opt.value && (
                    <Text style={styles.pickerCheck}>✓</Text>
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
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { padding: 18, paddingBottom: 50 },
  profileHeader: { alignItems: 'center', marginVertical: 18 },
  name: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 10 },
  bio: { fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 3 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 20,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionBtn: { alignItems: 'center' },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginTop: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#8E0E2C', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  emptyMediaCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  emptyMediaText: { color: '#9E9E9E', fontWeight: '500', textAlign: 'center', fontSize: 13 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mediaItem: { width: '22.5%', height: 74, borderRadius: 8, overflow: 'hidden' },
  mediaThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  optionValue: { color: '#8E0E2C', fontWeight: '700', fontSize: 13 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  pickerCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20 },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  pickerCheck: { color: '#8E0E2C', fontWeight: '800' },
});
