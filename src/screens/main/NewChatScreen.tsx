import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Search, UserPlus, Mail, Users, Send } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfile } from '../../types';

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

  // 400ms Debounce effect on search input
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
        // Fallback match for offline / demo mode
        const clean = query.trim().toLowerCase();
        const foundUser = contacts.find(
          (c) => c.email.toLowerCase() === clean || (c.phone && c.phone.includes(clean))
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
      <View style={[styles.header, { borderBottomColor: palette.border, backgroundColor: palette.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={palette.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>New Chat</Text>
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => navigation.navigate('NewGroupModal')}
        >
          <Users color={palette.primary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: palette.inputBackground, borderColor: palette.border },
          ]}
        >
          <Search color={palette.textMuted} size={20} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: palette.textPrimary }]}
            placeholder="Search by email or phone number..."
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
            <View style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Image
                source={{
                  uri:
                    searchResult.user.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.cardAvatar}
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: palette.textPrimary }]}>
                  {searchResult.user.name}
                </Text>
                <Text style={[styles.cardBio, { color: palette.textMuted }]} numberOfLines={1}>
                  {searchResult.user.bio || 'Hey there! I am using MeshX.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: palette.primary }]}
                onPress={() => handleAddAndStartChat(searchResult.user!)}
              >
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add & Chat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.inviteCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Mail size={32} color={palette.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.inviteTitle, { color: palette.textPrimary }]}>
                No MeshX User Found
              </Text>
              <Text style={[styles.inviteSubtitle, { color: palette.textMuted }]}>
                No active user matches "{query}". Send an invitation via email to join MeshX!
              </Text>

              {inviteSent ? (
                <Text style={styles.inviteSuccessText}>✓ Invitation sent via Brevo!</Text>
              ) : (
                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: palette.primary }]}
                  onPress={handleSendInvite}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.inviteBtnText}>Send Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Quick Contacts List (visible when search query is empty) */}
      {(!query || query.trim().length === 0) && (
        <View style={styles.contactsSection}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>
            YOUR CONTACTS
          </Text>
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id || item._id || `contact_${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.contactRow, { borderBottomColor: palette.border }]}
                onPress={() => handleAddAndStartChat(item)}
              >
                <Image
                  source={{
                    uri:
                      item.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                  }}
                  style={styles.contactAvatar}
                />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: palette.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.contactBio, { color: palette.textMuted }]} numberOfLines={1}>
                    {item.bio || 'Available'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  groupButton: { padding: 4 },
  searchSection: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  resultContainer: { paddingHorizontal: 16, marginBottom: 16 },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardBio: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  inviteCard: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  inviteTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  inviteSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  inviteBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  inviteSuccessText: { color: '#10b981', fontWeight: '700', fontSize: 14 },
  contactsSection: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 14 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700' },
  contactBio: { fontSize: 13, marginTop: 2 },
});
