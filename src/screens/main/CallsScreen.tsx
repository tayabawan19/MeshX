import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { BoldCard } from '../../components/common/BoldCard';
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
      return <PhoneOutgoing size={16} color={palette.primary} style={{ marginRight: 6 }} />;
    }
    return <PhoneIncoming size={16} color={palette.secondary} style={{ marginRight: 6 }} />;
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
            <BoldCard
              borderRadius={20}
              shadowOffset={3}
              onPress={() => {
                triggerHaptic('light');
                startCall(recId, partnerName, partnerAvatar, item.type);
              }}
              style={styles.cardContainer}
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
                  style={[
                    styles.callIconBtn,
                    {
                      backgroundColor: item.type === 'video' ? palette.accent : palette.secondary,
                      borderColor: '#000000',
                    },
                  ]}
                >
                  {item.type === 'video' ? (
                    <Video size={18} color="#FFFFFF" />
                  ) : (
                    <Phone size={18} color="#100F17" />
                  )}
                </TouchableOpacity>
              </View>
            </BoldCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
              <Phone size={36} color={palette.secondary} />
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
  listContent: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 90 },
  cardContainer: {
    marginVertical: 5,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 12, fontWeight: '700' },
  callIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  emptySub: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
