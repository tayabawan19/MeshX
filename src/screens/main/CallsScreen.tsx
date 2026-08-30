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
      return <PhoneMissed size={15} color={palette.error} style={{ marginRight: 6 }} />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing size={15} color={palette.textSecondary} style={{ marginRight: 6 }} />;
    }
    return <PhoneIncoming size={15} color={palette.onlineGreen} style={{ marginRight: 6 }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Calls" />

      <FlatList
        data={calls}
        keyExtractor={(item, index) => item.id || (item as any)._id || `call_${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} />}
        contentContainerStyle={styles.listContent}
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
              style={[styles.callCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <View style={styles.callRow}>
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
                  style={[styles.callIconBtn, { backgroundColor: palette.surfaceLight }]}
                >
                  {item.type === 'video' ? (
                    <Video size={16} color={palette.textPrimary} />
                  ) : (
                    <Phone size={16} color={palette.textPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceElevated }]}>
              <Phone size={28} color={palette.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No calls yet</Text>
            <Text style={[styles.emptySub, { color: palette.textMuted }]}>
              Recent voice and video calls will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingVertical: 8, paddingBottom: 90 },
  callCard: {
    marginVertical: 3,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timeText: { fontSize: 12, fontWeight: '400' },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
});
