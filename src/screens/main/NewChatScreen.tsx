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
import { ChevronLeft, Search, UserPlus, Mail, Users, Send } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { BoldButton } from '../../components/common/BoldButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NewChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
  const insets = useSafeAreaInsets();

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
      navigation.replace('Chat', { chatId, title: targetUser.name, avatar: targetUser.avatarUrl });
    } catch (error) {
      Alert.alert('Error', 'Could not create chat session.');
    }
  };

  const handleSendInvite = async () => {
    if (!query || !query.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address to send an invitation.');
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: palette.surfaceElevated,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: palette.surfaceLight }]}
          onPress={() => {
            triggerHaptic('light');
            navigation.goBack();
          }}
        >
          <ChevronLeft color={palette.textPrimary} size={20} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Direct Message</Text>

        <TouchableOpacity
          style={[styles.groupBtn, { backgroundColor: palette.primary }]}
          onPress={() => {
            triggerHaptic('selection');
            navigation.navigate('NewGroupModal');
          }}
        >
          <Users color="#FFFFFF" size={17} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Search color={palette.textMuted} size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: palette.textPrimary }]}
            placeholder="Search by username, email or phone..."
            placeholderTextColor={palette.textMuted}
            value={query}
            onChangeText={(t) => setQuery(t)}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={palette.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>

      {/* Search Result Card */}
      {searchResult && (
        <View style={styles.resultContainer}>
          {searchResult.found && searchResult.user ? (
            <View style={[styles.resultCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.profileRow}>
                <Avatar url={searchResult.user.avatarUrl} name={searchResult.user.name} size="lg" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: palette.textPrimary }]}>
                    {searchResult.user.name}
                  </Text>
                  <Text style={[styles.cardBio, { color: palette.textMuted }]} numberOfLines={1}>
                    {searchResult.user.bio || 'Available on MeshX'}
                  </Text>
                </View>
              </View>
              <BoldButton
                title="Send Direct Message"
                variant="primary"
                icon={<UserPlus size={15} color="#FFFFFF" />}
                onPress={() => handleAddAndStartChat(searchResult.user!)}
                size="md"
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <View style={[styles.inviteCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.inviteContent}>
                <View style={[styles.inviteIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Mail size={24} color={palette.primary} />
                </View>
                <Text style={[styles.inviteTitle, { color: palette.textPrimary }]}>
                  No User Found
                </Text>
                <Text style={[styles.inviteSubtitle, { color: palette.textMuted }]}>
                  No active user matches "{query}". Send an invite link!
                </Text>

                {inviteSent ? (
                  <View style={[styles.sentBadge, { backgroundColor: palette.surfaceElevated }]}>
                    <Text style={[styles.sentBadgeText, { color: palette.onlineGreen }]}>✓ Invitation sent</Text>
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
            </View>
          )}
        </View>
      )}

      {/* Quick Contacts List */}
      {(!query || query.trim().length === 0) && (
        <View style={styles.contactsSection}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
            DIRECT CONTACTS ({contacts.length})
          </Text>
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id || item._id || `contact_${index}`}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleAddAndStartChat(item)}
                style={[styles.contactCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <View style={styles.contactRow}>
                  <Avatar url={item.avatarUrl} name={item.name} size="md" />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: palette.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.contactBio, { color: palette.textMuted }]} numberOfLines={1}>
                      {item.bio || 'Available on MeshX'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContacts}>
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                  No contacts found. Use the search bar above to find users.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  groupBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: { padding: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '400' },
  resultContainer: { paddingHorizontal: 12, marginBottom: 10 },
  resultCard: { padding: 14, borderRadius: 10, borderWidth: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardBio: { fontSize: 12, marginTop: 1 },
  inviteCard: { padding: 16, borderRadius: 10, borderWidth: 1 },
  inviteContent: { alignItems: 'center' },
  inviteIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  inviteSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 16, marginBottom: 10 },
  sentBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  sentBadgeText: { fontWeight: '600', fontSize: 12 },
  contactsSection: { flex: 1, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  contactCard: { marginVertical: 3, padding: 10, borderRadius: 8, borderWidth: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 10 },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactBio: { fontSize: 12, marginTop: 1 },
  emptyContacts: { paddingVertical: 24, alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
