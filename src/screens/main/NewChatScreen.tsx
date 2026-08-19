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
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { BoldCard } from '../../components/common/BoldCard';
import { BoldButton } from '../../components/common/BoldButton';

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
    }, 400);

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
      <View style={[styles.header, { borderBottomColor: '#000000', backgroundColor: palette.surface }]}>
        <TouchableOpacity
          style={styles.backBtnWrapper}
          onPress={() => {
            triggerHaptic('light');
            navigation.goBack();
          }}
        >
          <View style={styles.backBtnShadow} />
          <View style={[styles.backBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
            <ArrowLeft color={palette.textPrimary} size={20} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Chat</Text>

        <TouchableOpacity
          style={styles.groupBtnWrapper}
          onPress={() => {
            triggerHaptic('selection');
            navigation.navigate('NewGroupModal');
          }}
        >
          <View style={styles.groupBtnShadow} />
          <View style={[styles.groupBtn, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
            <Users color="#FFFFFF" size={18} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchShadow} />
        <View
          style={[
            styles.searchBar,
            { backgroundColor: palette.surfaceElevated, borderColor: '#000000' },
          ]}
        >
          <Search color={palette.secondary} size={20} strokeWidth={2.5} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: palette.textPrimary }]}
            placeholder="Search by email or phone..."
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

      {/* Search Result Card (if user searched) */}
      {searchResult && (
        <View style={styles.resultContainer}>
          {searchResult.found && searchResult.user ? (
            <BoldCard borderRadius={20} shadowOffset={4} style={styles.resultCard}>
              <View style={styles.profileRow}>
                <Avatar url={searchResult.user.avatarUrl} name={searchResult.user.name} size="lg" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: palette.textPrimary }]}>
                    {searchResult.user.name}
                  </Text>
                  <Text style={[styles.cardBio, { color: palette.textMuted }]} numberOfLines={1}>
                    {searchResult.user.bio || 'Hey there! I am using MeshX.'}
                  </Text>
                </View>
              </View>
              <BoldButton
                title="Add & Chat"
                variant="primary"
                icon={<UserPlus size={16} color="#FFFFFF" strokeWidth={2.5} />}
                onPress={() => handleAddAndStartChat(searchResult.user!)}
                size="md"
                style={{ marginTop: 12 }}
              />
            </BoldCard>
          ) : (
            <BoldCard borderRadius={20} shadowOffset={4} style={styles.inviteCard}>
              <View style={styles.inviteContent}>
                <View style={[styles.inviteIconCircle, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                  <Mail size={28} color={palette.primary} strokeWidth={2.5} />
                </View>
                <Text style={[styles.inviteTitle, { color: palette.textPrimary }]}>
                  No MeshX User Found
                </Text>
                <Text style={[styles.inviteSubtitle, { color: palette.textMuted }]}>
                  No active user matches "{query}". Send an invite to start messaging!
                </Text>

                {inviteSent ? (
                  <View style={[styles.sentBadge, { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
                    <Text style={styles.sentBadgeText}>✓ Invitation sent!</Text>
                  </View>
                ) : (
                  <BoldButton
                    title="Send Email Invite"
                    variant="primary"
                    loading={isInviting}
                    icon={<Send size={16} color="#FFFFFF" strokeWidth={2.5} />}
                    onPress={handleSendInvite}
                    size="md"
                    style={{ width: '100%', marginTop: 8 }}
                  />
                )}
              </View>
            </BoldCard>
          )}
        </View>
      )}

      {/* Quick Contacts List */}
      {(!query || query.trim().length === 0) && (
        <View style={styles.contactsSection}>
          <Text style={[styles.sectionTitle, { color: palette.secondary }]}>
            YOUR CONTACTS ({contacts.length})
          </Text>
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id || item._id || `contact_${index}`}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <BoldCard
                borderRadius={18}
                shadowOffset={2}
                onPress={() => handleAddAndStartChat(item)}
                style={styles.contactCard}
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
              </BoldCard>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContacts}>
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                  No contacts found yet. Use the search bar above to find friends by email or phone!
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
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
  },
  backBtnWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  backBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  groupBtnWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  groupBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  groupBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchSection: { padding: 16, position: 'relative' },
  searchShadow: {
    position: 'absolute',
    top: 19,
    left: 19,
    right: 13,
    bottom: 13,
    borderRadius: 24,
    backgroundColor: '#000000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
  resultContainer: { paddingHorizontal: 16, marginBottom: 12 },
  resultCard: { padding: 14 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 16, fontWeight: '800' },
  cardBio: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  inviteCard: { padding: 18 },
  inviteContent: { alignItems: 'center' },
  inviteIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  inviteSubtitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  sentBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 6,
  },
  sentBadgeText: { color: '#100F17', fontWeight: '900', fontSize: 13 },
  contactsSection: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  contactCard: { marginVertical: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: '800' },
  contactBio: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  emptyContacts: { paddingVertical: 30, alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
});
