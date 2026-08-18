import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Avatar } from '../../components/common/Avatar';
import { ClayCard } from '../../components/common/ClayCard';
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
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isCallerMe = (typeof item.callerId === 'string' ? item.callerId : (item.callerId as any)?._id) === currentUser?.id;
          const partner = isCallerMe ? (item.receiverId as any) : (item.callerId as any);

          const partnerName = partner?.name || (item as any).receiverName || (item as any).callerName || 'Contact';
          const partnerAvatar = partner?.avatarUrl || (item as any).receiverAvatar || (item as any).callerAvatar || '';
          const recId = partner?._id || partner?.id || 'peer';
          const timeVal = Number(item.createdAt || (item as any).timestamp) || Date.now();

          return (
            <ClayCard
              borderRadius={22}
              onPress={() => {
                triggerHaptic('light');
                startCall(recId, partnerName, partnerAvatar, item.type);
              }}
              style={styles.callRow}
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
                style={[
                  styles.clayCallIconBtn,
                  {
                    backgroundColor: palette.surfaceElevated,
                    borderTopColor: palette.clayHighlight,
                    borderLeftColor: palette.clayHighlight,
                    borderBottomColor: 'rgba(0,0,0,0.35)',
                    borderRightColor: 'rgba(0,0,0,0.2)',
                  },
                ]}
              >
                {item.type === 'video' ? (
                  <Video size={19} color={palette.accent} />
                ) : (
                  <Phone size={18} color={palette.primaryLight} />
                )}
              </TouchableOpacity>
            </ClayCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📞</Text>
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
  listContent: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 80 },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  content: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 13, fontWeight: '500' },
  clayCallIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
