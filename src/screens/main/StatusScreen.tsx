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
    <Modal visible={!!activeStatusId} transparent animationType="fade">
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
              <X size={22} color="#FFFFFF" />
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
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.replyInput}
            />

            <TouchableOpacity onPress={handleReply} style={styles.sendReplyBtn}>
              <Send size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1F22' },
  backgroundImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16, paddingTop: 44, backgroundColor: 'rgba(0,0,0,0.4)' },
  progressTrack: { height: 2.5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', backgroundColor: '#5865F2' },
  header: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userInfo: { flex: 1 },
  userName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  closeBtn: { padding: 6 },
  captionBox: { backgroundColor: 'rgba(30,31,34,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'center', marginBottom: 16, maxWidth: '90%' },
  captionText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center', fontWeight: '400' },
  replyBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  replyInput: { flex: 1, height: 42, backgroundColor: 'rgba(43,45,49,0.9)', borderRadius: 8, paddingHorizontal: 14, color: '#FFFFFF', fontSize: 13, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendReplyBtn: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#5865F2', justifyContent: 'center', alignItems: 'center' },
});
