import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { ArrowLeft, Bell, ShieldOff, Phone, Video, Image as ImageIcon } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { triggerHaptic } from '../../utils/haptics';

export const UserProfileModal: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { title, avatar, bio, email, phone, chatId } = route.params || {};
  const { theme } = useThemeStore();
  const { startCall, muteChat } = useChatStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const sampleMedia = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80',
  ];

  const handleMuteToggle = () => {
    triggerHaptic('selection');
    setIsMuted(!isMuted);
    if (chatId) muteChat(chatId);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <Image
          source={{
            uri: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{title || 'Contact'}</Text>
        <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
          {bio || 'Hey there! I am using MeshX.'}

        </Text>
        <Text style={[styles.contactDetail, { color: theme.colors.primary }]}>
          {email || phone || ''}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'voice');
              navigation.navigate('CallModal');
            }}
          >
            <Phone size={20} color={theme.colors.primary} />
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'video');
              navigation.navigate('CallModal');
            }}
          >
            <Video size={20} color={theme.colors.primary} />
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shared Media */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <ImageIcon size={18} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Shared Media</Text>
        </View>
        <View style={styles.mediaGrid}>
          {sampleMedia.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaItem} />
          ))}
        </View>
      </View>

      {/* Settings List */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.row}>
          <Bell size={20} color={theme.colors.textPrimary} style={{ marginRight: 14 }} />
          <Text style={[styles.rowText, { color: theme.colors.textPrimary }]}>Mute Notifications</Text>
          <Switch value={isMuted} onValueChange={handleMuteToggle} trackColor={{ true: theme.colors.primary }} />
        </View>

        <TouchableOpacity
          style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}
          onPress={() => {
            triggerHaptic('heavy');
            setIsBlocked(!isBlocked);
          }}
        >
          <ShieldOff size={20} color="#ef4444" style={{ marginRight: 14 }} />
          <Text style={[styles.rowText, { color: '#ef4444', fontWeight: '700' }]}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 14 },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  bio: { fontSize: 14, textAlign: 'center', marginBottom: 6 },
  contactDetail: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, gap: 8 },
  actionLabel: { fontWeight: '700', fontSize: 14 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  mediaGrid: { flexDirection: 'row', gap: 10 },
  mediaItem: { width: 72, height: 72, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, justifyContent: 'space-between' },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
