import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { formatChatTimestamp } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';
import { CallLog } from '../../types';

export const CallsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { palette } = useThemeStore();
  const { calls, fetchCallHistory, startCall, startGroupCall } = useChatStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'missed'>('all');

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const filteredHistory = calls.filter((c: CallLog) => {
    if (activeFilter === 'missed') {
      return c.status === 'missed';
    }
    return true;
  });

  const handleStartDirectCall = (call: any, type: 'voice' | 'video') => {
    triggerHaptic('selection');
    const peerId = typeof call.receiverId === 'string' ? call.receiverId : (call.receiverId as any)?._id || 'peer';
    const peerName = call.receiverName || (typeof call.receiverId === 'object' ? (call.receiverId as any)?.name : 'User');
    const peerAvatar = call.receiverAvatar || (typeof call.receiverId === 'object' ? (call.receiverId as any)?.avatarUrl : '') || '';

    if (call.isGroupCall) {
      startGroupCall(peerId, peerName, type);
    } else {
      startCall(peerId, peerName, peerAvatar, type);
    }
    navigation.navigate('CallModal');
  };

  return (
    <View style={styles.container}>
      {/* Top Crimson Gradient Header Area */}
      <LinearGradient
        colors={['#8E0E2C', '#540F27', '#251025']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.topGradientArea, { paddingTop: Math.max(insets.top + 8, 20) }]}
      >
        <View style={styles.topAppBar}>
          <View>
            <Text style={styles.appTitle}>MESHX</Text>
            <Text style={styles.appSubtitle}>Voice & Video Calls</Text>
          </View>
        </View>

        {/* Filter Segmented Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveFilter('all');
            }}
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
              All Calls
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveFilter('missed');
            }}
            style={[styles.filterPill, activeFilter === 'missed' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'missed' && styles.filterPillTextActive]}>
              Missed
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* White Curved Container for Calls List */}
      <View style={styles.whiteCardContainer}>
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, idx) => item.id || item._id || `call_${idx}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMissed = item.status === 'missed';
            const isIncoming = item.status === 'incoming';
            const peerName = item.receiverName || (typeof item.receiverId === 'object' ? (item.receiverId as any)?.name : 'User');
            const peerAvatar = item.receiverAvatar || (typeof item.receiverId === 'object' ? (item.receiverId as any)?.avatarUrl : '');

            return (
              <View style={styles.callRow}>
                {(item as any).isGroupCall ? (
                  <View style={styles.groupAvatarBox}>
                    <Users size={20} color="#8E0E2C" />
                  </View>
                ) : (
                  <Image
                    source={{
                      uri:
                        peerAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                    }}
                    style={styles.avatar}
                  />
                )}

                <View style={styles.callInfo}>
                  <Text style={[styles.peerName, isMissed && { color: '#C62828' }]}>
                    {peerName}
                  </Text>
                  <View style={styles.callMeta}>
                    {isMissed ? (
                      <PhoneMissed size={13} color="#C62828" style={{ marginRight: 4 }} />
                    ) : isIncoming ? (
                      <PhoneIncoming size={13} color="#2E7D32" style={{ marginRight: 4 }} />
                    ) : (
                      <PhoneOutgoing size={13} color="#8E0E2C" style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.callTime}>
                      {formatChatTimestamp(Number(item.createdAt) || Number(item.timestamp) || Date.now())}
                    </Text>
                  </View>
                </View>

                <View style={styles.callActions}>
                  <TouchableOpacity
                    onPress={() => handleStartDirectCall(item, 'voice')}
                    style={styles.actionIconBtn}
                  >
                    <Phone size={18} color="#8E0E2C" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStartDirectCall(item, 'video')}
                    style={styles.actionIconBtn}
                  >
                    <Video size={18} color="#8E0E2C" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Phone size={36} color="#8E0E2C" />
              </View>
              <Text style={styles.emptyTitle}>No call logs</Text>
              <Text style={styles.emptySubtitle}>
                Voice and video calls you make or receive will appear right here.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8E0E2C' },
  topGradientArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topAppBar: {
    marginBottom: 14,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 3,
    alignSelf: 'flex-start',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#8E0E2C',
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  groupAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  callActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 19,
  },
});
