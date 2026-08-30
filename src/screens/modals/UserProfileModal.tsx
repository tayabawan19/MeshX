import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ChevronLeft, Bell, ShieldOff, Phone, Video, Image as ImageIcon } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { ClaySwitch } from '../../components/common/ClaySwitch';
import { triggerHaptic } from '../../utils/haptics';

export const UserProfileModal: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { title, avatar, bio, email, phone, chatId } = route.params || {};
  const palette = useThemeStore((state) => state.palette);
  const { startCall, muteChat } = useChatStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const sampleMedia = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80',
  ];

  const handleMuteToggle = (val: boolean) => {
    triggerHaptic('selection');
    setIsMuted(val);
    if (chatId) muteChat(chatId);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: palette.surfaceElevated }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={palette.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            }}
            style={styles.avatar}
          />
        </View>

        <Text style={[styles.name, { color: palette.textPrimary }]}>{title || 'Contact'}</Text>
        <Text style={[styles.bio, { color: palette.textSecondary }]}>
          {bio || 'Hey there! I am using MeshX.'}
        </Text>
        <Text style={[styles.contactDetail, { color: palette.textMuted }]}>
          {email || phone || ''}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'voice');
              navigation.navigate('CallModal');
            }}
          >
            <Phone size={16} color={palette.textPrimary} />
            <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Voice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'video');
              navigation.navigate('CallModal');
            }}
          >
            <Video size={16} color={palette.textPrimary} />
            <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shared Media */}
      <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <ImageIcon size={16} color={palette.textMuted} />
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Shared Media</Text>
        </View>
        <View style={styles.mediaGrid}>
          {sampleMedia.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaItem} />
          ))}
        </View>
      </View>

      {/* Settings List */}
      <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.row}>
          <Bell size={18} color={palette.textPrimary} style={{ marginRight: 10 }} />
          <Text style={[styles.rowText, { color: palette.textPrimary }]}>Mute Notifications</Text>
          <ClaySwitch value={isMuted} onValueChange={handleMuteToggle} />
        </View>

        <TouchableOpacity
          style={[styles.row, { borderTopWidth: 1, borderTopColor: palette.border, borderBottomWidth: 0 }]}
          onPress={() => {
            triggerHaptic('heavy');
            setIsBlocked(!isBlocked);
          }}
        >
          <ShieldOff size={18} color={palette.error} style={{ marginRight: 10 }} />
          <Text style={[styles.rowText, { color: palette.error, fontWeight: '600' }]}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 44, paddingBottom: 6 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  bio: { fontSize: 13, textAlign: 'center', marginBottom: 4 },
  contactDetail: { fontSize: 12, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionLabel: { fontWeight: '600', fontSize: 13 },
  section: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 10, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  mediaGrid: { flexDirection: 'row', gap: 8 },
  mediaItem: { width: 68, height: 68, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, justifyContent: 'space-between' },
  rowText: { flex: 1, fontSize: 14, fontWeight: '500' },
});
