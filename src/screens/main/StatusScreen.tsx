import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { X, Send } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { formatChatTimestamp } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StatusScreenProps {
  activeStatusId: string | null;
  onClose: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({ activeStatusId, onClose }) => {
  const { statuses, markStatusViewed } = useChatStore();

  const [replyText, setReplyText] = useState('');

  const activeStatus = statuses.find((s) => s.id === activeStatusId) || statuses[0];
  const progress = useSharedValue(0);

  useEffect(() => {
    if (activeStatusId && activeStatus) {
      markStatusViewed(activeStatus.id);
      progress.value = 0;
      progress.value = withTiming(1, { duration: 5000 });
    }
  }, [activeStatusId]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleReply = () => {
    if (!replyText.trim()) return;
    triggerHaptic('light');
    setReplyText('');
    onClose();
  };

  if (!activeStatusId || !activeStatus) return null;

  const uName = activeStatus.userName || 'User';

  return (
    <Modal visible={!!activeStatusId} transparent animationType="slide">
      <View style={styles.container}>
        <Image source={{ uri: activeStatus.mediaUrl }} style={styles.backgroundImage} />

        <View style={styles.overlay}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
          </View>

          <View style={styles.header}>
            <Image source={{ uri: activeStatus.userAvatar }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{uName}</Text>
              <Text style={styles.timeText}>{formatChatTimestamp(Number(activeStatus.createdAt) || Date.now())}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {activeStatus.caption ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{activeStatus.caption}</Text>
            </View>
          ) : null}

          <View style={styles.replyBar}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to ${uName.split(' ')[0]}...`}
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={styles.replyInput}
            />

            <TouchableOpacity onPress={handleReply} style={styles.sendReplyBtn}>
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  backgroundImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.3)' },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  userInfo: { flex: 1 },
  userName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  timeText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  closeBtn: { padding: 8 },
  captionBox: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, alignSelf: 'center', marginBottom: 20, maxWidth: '90%' },
  captionText: { color: '#FFFFFF', fontSize: 15, textAlign: 'center', fontWeight: '500' },
  replyBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  replyInput: { flex: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, paddingHorizontal: 18, color: '#FFFFFF', fontSize: 14, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  sendReplyBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
});
