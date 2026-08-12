import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatChatTimestamp, formatCallDuration } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

export const CallsScreen: React.FC = () => {
  const { calls, startCall, fetchCallHistory } = useChatStore();
  const palette = useThemeStore((state) => state.palette);
  const currentUser = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    triggerHaptic('light');
    await fetchCallHistory();
    setRefreshing(false);
  };

  const renderCallIcon = (status: string, callerId: any) => {
    const isOutgoing = (typeof callerId === 'string' ? callerId : callerId?._id) === currentUser?.id;
    if (status === 'missed' || status === 'declined') {
      return <PhoneMissed size={16} color={palette.error} style={{ marginRight: 6 }} />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing size={16} color={palette.primaryLight} style={{ marginRight: 6 }} />;
    }
    return <PhoneIncoming size={16} color={palette.onlineGreen} style={{ marginRight: 6 }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Calls" />

      <FlatList
        data={calls}
        keyExtractor={(item, index) => item.id || (item as any)._id || `call_${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} />}
        renderItem={({ item }) => {
          const isCallerMe = (typeof item.callerId === 'string' ? item.callerId : (item.callerId as any)?._id) === currentUser?.id;
          const partner = isCallerMe ? (item.receiverId as any) : (item.callerId as any);

          const partnerName = partner?.name || (item as any).receiverName || (item as any).callerName || 'Contact';
          const partnerAvatar = partner?.avatarUrl || (item as any).receiverAvatar || (item as any).callerAvatar || '';
          const recId = partner?._id || partner?.id || 'peer';
          const timeVal = Number(item.createdAt || (item as any).timestamp) || Date.now();

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('light');
                startCall(recId, partnerName, partnerAvatar, item.type);
              }}
              style={[styles.callRow, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}
            >
              <Avatar url={partnerAvatar} name={partnerName} size="md" />

              <View style={styles.content}>
                <Text style={[styles.name, { color: palette.textPrimary }]}>{partnerName}</Text>
                <View style={styles.statusRow}>
                  {renderCallIcon(item.status, item.callerId)}
                  <Text style={[styles.timeText, { color: item.status === 'missed' ? palette.error : palette.textMuted }]}>
                    {item.status === 'missed' ? 'Missed' : formatChatTimestamp(timeVal)}
                    {item.duration > 0 ? ` • ${formatCallDuration(item.duration)}` : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  startCall(recId, partnerName, partnerAvatar, item.type);
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
