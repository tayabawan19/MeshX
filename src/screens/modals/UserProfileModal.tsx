import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Bell, ShieldOff, Phone, Video, Image as ImageIcon } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { ClayCard } from '../../components/common/ClayCard';
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
          style={[
            styles.backButton,
            {
              backgroundColor: palette.surfaceElevated,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0,0,0,0.35)',
              borderRightColor: 'rgba(0,0,0,0.2)',
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={palette.textPrimary} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View
          style={[
            styles.clayAvatarWrapper,
            {
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.45)',
              borderRightColor: 'rgba(0, 0, 0, 0.30)',
            },
          ]}
        >
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
        <Text style={[styles.contactDetail, { color: palette.primaryLight }]}>
          {email || phone || ''}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: palette.surfaceElevated,
                borderTopColor: palette.clayHighlight,
                borderLeftColor: palette.clayHighlight,
                borderBottomColor: 'rgba(0,0,0,0.35)',
                borderRightColor: 'rgba(0,0,0,0.2)',
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'voice');
              navigation.navigate('CallModal');
            }}
          >
            <Phone size={18} color={palette.primaryLight} />
            <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: palette.surfaceElevated,
                borderTopColor: palette.clayHighlight,
                borderLeftColor: palette.clayHighlight,
                borderBottomColor: 'rgba(0,0,0,0.35)',
                borderRightColor: 'rgba(0,0,0,0.2)',
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              startCall('peer', title || 'Contact', avatar || '', 'video');
              navigation.navigate('CallModal');
            }}
          >
            <Video size={18} color={palette.accent} />
            <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shared Media */}
      <ClayCard borderRadius={24} style={styles.section}>
        <View style={styles.sectionHeader}>
          <ImageIcon size={18} color={palette.primaryLight} />
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Shared Media</Text>
        </View>
        <View style={styles.mediaGrid}>
          {sampleMedia.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaItem} />
          ))}
        </View>
      </ClayCard>

      {/* Settings List */}
      <ClayCard borderRadius={24} style={styles.section}>
        <View style={styles.row}>
          <Bell size={20} color={palette.textPrimary} style={{ marginRight: 14 }} />
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
          <ShieldOff size={20} color={palette.error} style={{ marginRight: 14 }} />
          <Text style={[styles.rowText, { color: palette.error, fontWeight: '700' }]}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>
      </ClayCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  profileHeader: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  clayAvatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.2,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  bio: { fontSize: 14, textAlign: 'center', marginBottom: 6 },
  contactDetail: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: { fontWeight: '700', fontSize: 14 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  mediaGrid: { flexDirection: 'row', gap: 10 },
  mediaItem: { width: 74, height: 74, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, justifyContent: 'space-between' },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
