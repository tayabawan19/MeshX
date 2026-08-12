import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Phone, Video, MessageSquare, BellOff, ShieldAlert } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { MOCK_USERS } from '../../utils/mockData';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { triggerHaptic } from '../../utils/haptics';

interface ContactProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({ userId, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const { startCall, openMediaViewer } = useChatStore();

  const user = MOCK_USERS.find((u) => u.userId === userId || u.id === userId || u._id === userId) || MOCK_USERS[0];
  const targetId = user.userId || user.id || user._id || 'peer';

  const sharedMedia = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
  ];

  if (!userId) return null;

  return (
    <Modal visible={!!userId} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Header title="Contact Info" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileHeader}>
            <Avatar url={user.avatarUrl} name={user.name} size="xl" isOnline={user.isOnline} />
            <Text style={[styles.name, { color: palette.textPrimary }]}>{user.name}</Text>
            <Text style={[styles.bio, { color: palette.textSecondary }]}>{user.bio}</Text>
            <Text style={[styles.email, { color: palette.primaryLight }]}>{user.email}</Text>
          </View>

          <View style={[styles.actionRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TouchableOpacity
              onPress={() => {
                onClose();
              }}
              style={styles.actionBtn}
            >
              <MessageSquare size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                startCall(targetId, user.name, user.avatarUrl || '', 'voice');
              }}
              style={styles.actionBtn}
            >
              <Phone size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                startCall(targetId, user.name, user.avatarUrl || '', 'video');
              }}
              style={styles.actionBtn}
            >
              <Video size={22} color={palette.primaryLight} />
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>Video</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>SHARED MEDIA & DOCUMENTS</Text>
          <View style={styles.mediaGrid}>
            {sharedMedia.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => openMediaViewer(url, 'image', 'Shared Media')}
                style={styles.mediaItem}
              >
                <Image source={{ uri: url }} style={styles.mediaThumb} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.optionsCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TouchableOpacity onPress={() => triggerHaptic('light')} style={styles.optionRow}>
              <BellOff size={20} color={palette.textMuted} />
              <Text style={[styles.optionText, { color: palette.textPrimary }]}>Mute Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => triggerHaptic('error')} style={styles.optionRow}>
              <ShieldAlert size={20} color={palette.error} />
              <Text style={[styles.optionText, { color: palette.error }]}>Block Contact</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  email: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  actionBtn: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  mediaItem: { width: '23%', height: 80, borderRadius: 12, overflow: 'hidden' },
  mediaThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 12 },
  optionText: { fontSize: 15, fontWeight: '600' },
});
