import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Search, UserPlus, Mail, Users, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { BoldButton } from '../../components/common/BoldButton';

export const NewChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    user?: UserProfile;
    isContact?: boolean;
    message?: string;
  } | null>(null);

  const [inviteSent, setInviteSent] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const { contacts, createNewChat, fetchContacts } = useChatStore();
  const { palette } = useThemeStore();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSearchResult(null);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query || query.trim().length === 0) return;
    setIsSearching(true);
    setSearchResult(null);
    setInviteSent(false);

    try {
      const res = await apiClient.get(`/users/search?query=${encodeURIComponent(query.trim())}`);
      setSearchResult(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSearchResult({
          found: false,
          message: 'No MeshX user found with that email/phone.',
        });
      } else {
        const clean = query.trim().toLowerCase();
        const foundUser = contacts.find(
          (c) => c.email?.toLowerCase() === clean || (c.phone && c.phone.includes(clean))
        );
        if (foundUser) {
          setSearchResult({ found: true, user: foundUser, isContact: true });
        } else {
          setSearchResult({
            found: false,
            message: 'No MeshX user found with that email/phone.',
          });
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAndStartChat = async (targetUser: UserProfile) => {
    triggerHaptic('medium');
    const uId = targetUser.id || targetUser._id || (targetUser as any).userId;
    try {
      const chatId = await createNewChat(uId);
      if (chatId) {
        navigation.replace('Chat', {
          chatId,
          title: targetUser.name,
          avatar: targetUser.avatarUrl,
          isGroup: false,
          userId: uId,
        });
      } else {
        Alert.alert('Error', 'Could not create chat session.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not create chat session.');
    }
  };

  const handleSendInvite = async () => {
    if (!query || !query.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsInviting(true);
    triggerHaptic('selection');
    try {
      await apiClient.post('/users/invite', { email: query.trim() });
      setInviteSent(true);
      triggerHaptic('success');
    } catch (err) {
      setInviteSent(true);
    } finally {
      setIsInviting(false);
    }
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <Text style={styles.appTitle}>New Message</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewGroupModal')}
            style={styles.groupNavBtn}
          >
            <Users color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Search size={18} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search email, username, or phone..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 6 }} />
          )}
        </View>
      </LinearGradient>

      {/* White Curved Container for Results / Contacts */}
      <View style={styles.whiteCardContainer}>
        {searchResult && (
          <View style={styles.resultSection}>
            {searchResult.found && searchResult.user ? (
              <View style={styles.resultCard}>
                <View style={styles.profileRow}>
                  <Avatar url={searchResult.user.avatarUrl} name={searchResult.user.name} size="lg" />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{searchResult.user.name}</Text>
                    <Text style={styles.cardBio} numberOfLines={1}>
                      {searchResult.user.bio || 'Available on MeshX'}
                    </Text>
                  </View>
                </View>
                <BoldButton
                  title="Send Message"
                  variant="primary"
                  icon={<UserPlus size={15} color="#FFFFFF" />}
                  onPress={() => handleAddAndStartChat(searchResult.user!)}
                  size="md"
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <View style={styles.inviteCard}>
                <View style={styles.inviteIconCircle}>
                  <Mail size={24} color="#8E0E2C" />
                </View>
                <Text style={styles.inviteTitle}>No User Found</Text>
                <Text style={styles.inviteSubtitle}>
                  No active user matches "{query}". Send an invite link to join!
                </Text>

                {inviteSent ? (
                  <View style={styles.sentBadge}>
                    <Text style={styles.sentBadgeText}>✓ Invitation sent</Text>
                  </View>
                ) : (
                  <BoldButton
                    title="Send Invite"
                    variant="primary"
                    loading={isInviting}
                    icon={<Send size={15} color="#FFFFFF" />}
                    onPress={handleSendInvite}
                    size="md"
                    style={{ width: '100%', marginTop: 8 }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {(!query || query.trim().length === 0) && (
          <View style={styles.contactsSection}>
            <Text style={styles.sectionHeading}>
              CONTACTS ({contacts.length})
            </Text>
            <FlatList
              data={contacts}
              keyExtractor={(item, index) => item.id || item._id || `contact_${index}`}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleAddAndStartChat(item)}
                  style={styles.contactRow}
                >
                  <Avatar url={item.avatarUrl} name={item.name} size="md" />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactBio} numberOfLines={1}>
                      {item.bio || item.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContacts}>
                  <Text style={styles.emptyText}>
                    No contacts found. Use the search bar above to find friends by email or phone.
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8E0E2C' },
  topGradientArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  groupNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 21,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  resultSection: {
    padding: 16,
  },
  resultCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  cardBio: { fontSize: 12, color: '#757575', marginTop: 1 },
  inviteCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
  },
  inviteIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  inviteSubtitle: { fontSize: 12, color: '#757575', textAlign: 'center', marginBottom: 10 },
  sentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  sentBadgeText: { color: '#2E7D32', fontWeight: '700', fontSize: 12 },
  contactsSection: { flex: 1, paddingHorizontal: 18, paddingTop: 16 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E0E2C',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  contactBio: { fontSize: 12, color: '#757575', marginTop: 1 },
  emptyContacts: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', lineHeight: 19 },
});
