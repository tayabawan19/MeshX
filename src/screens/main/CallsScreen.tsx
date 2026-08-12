import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneMissed } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { formatChatTimestamp, formatCallDuration } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

export const CallsScreen: React.FC = () => {
  const { calls, startCall } = useChatStore();
  const palette = useThemeStore((state) => state.palette);

  const renderCallIcon = (status: string, type: string) => {
    if (status === 'missed') {
      return <PhoneMissed size={16} color={palette.error} style={{ marginRight: 6 }} />;
    }
    return <PhoneIncoming size={16} color={palette.onlineGreen} style={{ marginRight: 6 }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Calls" />

      <FlatList
        data={calls}
        keyExtractor={(item, index) => item.id || item._id || `call_${index}`}
        renderItem={({ item }) => {
          const peerName = item.receiverName || item.callerName || 'Peer';
          const peerAvatar = item.receiverAvatar || item.callerAvatar || '';
          const recId = typeof item.receiverId === 'string' ? item.receiverId : (item.receiverId as any)?._id || 'peer';
          const timeVal = Number(item.timestamp || item.createdAt) || Date.now();

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('light');
                startCall(recId, peerName, peerAvatar, item.type);
              }}
              style={[styles.callRow, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}
            >
              <Avatar url={peerAvatar} name={peerName} size="md" />

              <View style={styles.content}>
                <Text style={[styles.name, { color: palette.textPrimary }]}>{peerName}</Text>
                <View style={styles.statusRow}>
                  {renderCallIcon(item.status, item.type)}
                  <Text style={[styles.timeText, { color: palette.textMuted }]}>
                    {formatChatTimestamp(timeVal)}
                    {item.duration > 0 ? ` • ${formatCallDuration(item.duration)}` : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  startCall(recId, peerName, peerAvatar, item.type);
                }}
                style={[styles.callActionBtn, { backgroundColor: palette.surfaceElevated }]}
              >
                {item.type === 'video' ? (
                  <Video size={20} color={palette.primaryLight} />
                ) : (
                  <Phone size={18} color={palette.primaryLight} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📞</Text>
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No Call History</Text>
            <Text style={[styles.emptySub, { color: palette.textMuted }]}>Your voice and video calls will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  content: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 13 },
  callActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14 },
});
