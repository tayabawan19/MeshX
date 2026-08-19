import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Camera, ImageIcon, Type, Check, Send, Lock, Globe, Users, ShieldAlert } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_PALETTES: [string, string][] = [
  ['#8B7FD1', '#7B93D6'],
  ['#6FAFA0', '#7B93D6'],
  ['#E58A8A', '#8B7FD1'],
  ['#D4A373', '#E6A868'],
  ['#7EA68B', '#6FAFA0'],
  ['#7B93D6', '#8B7FD1'],
];

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ visible, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const { contacts, postStory } = useChatStore();

  const [mode, setMode] = useState<'picker' | 'text' | 'media'>('picker');
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(COLOR_PALETTES[0]);
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Story Privacy Controls
  const [visibility, setVisibility] = useState<'contacts' | 'except' | 'only'>('contacts');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);

  const handleReset = () => {
    setMode('picker');
    setText('');
    setMediaUri(null);
    setCaption('');
    setIsPosting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const pickMedia = async (source: 'gallery' | 'camera') => {
    triggerHaptic('selection');
    try {
      if (source === 'gallery') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow photo library access in device settings to select story photos or videos.'
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset?.uri) {
            setMediaUri(asset.uri);
            setMediaType(asset.type === 'video' ? 'video' : 'image');
            setMode('media');
          }
        }
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow camera access in device settings to take story photos or videos.'
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset?.uri) {
            setMediaUri(asset.uri);
            setMediaType(asset.type === 'video' ? 'video' : 'image');
            setMode('media');
          }
        }
      }
    } catch (err: any) {
      console.error('[CreateStory pickMedia Error]', err?.message || err);
      Alert.alert('Media Picker Error', 'Could not open media picker. Please try again.');
    }
  };

  const toggleSelectPrivacyContact = (id: string) => {
    triggerHaptic('selection');
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter((uId) => uId !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const handlePost = async () => {
    if (isPosting) return;
    setIsPosting(true);
    triggerHaptic('medium');

    try {
      const privacyPayload = {
        visibility,
        excludedUsers: visibility === 'except' ? selectedContactIds : [],
        includedUsers: visibility === 'only' ? selectedContactIds : [],
      };

      if (mode === 'text') {
        if (!text.trim()) {
          setIsPosting(false);
          return;
        }
        await postStory({
          type: 'text',
          caption: text.trim(),
          backgroundColor: selectedGradient[0],
          ...privacyPayload,
        });
      } else if (mode === 'media' && mediaUri) {
        const formData = new FormData();
        const filename = mediaUri.split('/').pop() || `story_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : (mediaType === 'video' ? 'mp4' : 'jpg');
        const mime = mediaType === 'video' ? `video/${ext}` : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

        formData.append('file', {
          uri: mediaUri,
          name: filename,
          type: mime,
        } as any);

        console.log('[StoryUpload] Uploading story media...');
        const uploadRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url || mediaUri;
        console.log('[StoryUpload Success]', uploadedUrl);

        await postStory({
          type: mediaType,
          mediaUrl: uploadedUrl,
          caption: caption.trim(),
          ...privacyPayload,
        });
      }

      triggerHaptic('success');
      handleClose();
    } catch (err: any) {
      console.error('[CreateStory Post Error]', err?.message || err);
      Alert.alert('Upload Failed', 'Failed to upload story. Please check your internet connection.');
    } finally {
      setIsPosting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Mode: Picker Sheet */}
        {mode === 'picker' && (
          <TouchableOpacity activeOpacity={1} onPress={handleClose} style={styles.modalOverlay}>
            <View style={[styles.pickerSheet, { backgroundColor: palette.surfaceElevated }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Create Story</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={22} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Privacy Trigger Pill */}
              <TouchableOpacity
                onPress={() => setShowPrivacySheet(true)}
                style={[styles.privacyTrigger, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <Lock size={14} color={palette.primaryLight} style={{ marginRight: 6 }} />
                <Text style={[styles.privacyTriggerText, { color: palette.textPrimary }]}>
                  {visibility === 'contacts'
                    ? 'My contacts'
                    : visibility === 'except'
                    ? `My contacts except (${selectedContactIds.length})`
                    : `Only share with (${selectedContactIds.length})`}
                </Text>
              </TouchableOpacity>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => pickMedia('camera')} style={styles.optionBtn}>
                  <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.optionIcon}>
                    <Camera size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => pickMedia('gallery')} style={styles.optionBtn}>
                  <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.optionIcon}>
                    <ImageIcon size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setMode('text');
                  }}
                  style={styles.optionBtn}
                >
                  <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.optionIcon}>
                    <Type size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Text Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Mode: Text Story Creator */}
        {mode === 'text' && (
          <LinearGradient colors={selectedGradient} style={styles.fullScreenContent}>
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={styles.iconCircle}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.swatchRow}>
                {COLOR_PALETTES.map((colors, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedGradient(colors)}
                    style={[
                      styles.swatch,
                      { backgroundColor: colors[0] },
                      selectedGradient[0] === colors[0] && styles.swatchActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handlePost}
                disabled={isPosting || !text.trim()}
                style={[styles.postBtn, { opacity: text.trim() ? 1 : 0.5 }]}
              >
                {isPosting ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            <View style={styles.textCenterWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Tap to type a story..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                autoFocus
                style={styles.textStoryInput}
              />
            </View>
          </LinearGradient>
        )}

        {/* Mode: Media Story Preview */}
        {mode === 'media' && mediaUri && (
          <View style={styles.fullScreenContent}>
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />

            <View style={styles.topHeaderOverlay}>
              <TouchableOpacity onPress={handleReset} style={styles.iconCircle}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePost} disabled={isPosting} style={styles.postBtn}>
                {isPosting ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            <View style={styles.captionInputContainer}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.captionInput}
              />
            </View>
          </View>
        )}

        {/* Privacy Selector Bottom Sheet */}
        <Modal visible={showPrivacySheet} transparent animationType="slide" onRequestClose={() => setShowPrivacySheet(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setShowPrivacySheet(false)} style={styles.modalOverlay}>
            <View style={[styles.privacySheetContainer, { backgroundColor: palette.surfaceElevated }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Story Privacy</Text>
                <TouchableOpacity onPress={() => setShowPrivacySheet(false)}>
                  <Check size={22} color={palette.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setVisibility('contacts')}
                style={[styles.privacyOption, visibility === 'contacts' && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
              >
                <Globe size={18} color={palette.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: palette.textPrimary }]}>My contacts</Text>
                  <Text style={[styles.privacyDesc, { color: palette.textMuted }]}>Share with all contacts</Text>
                </View>
                {visibility === 'contacts' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setVisibility('except')}
                style={[styles.privacyOption, visibility === 'except' && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
              >
                <ShieldAlert size={18} color={palette.error} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: palette.textPrimary }]}>My contacts except...</Text>
                  <Text style={[styles.privacyDesc, { color: palette.textMuted }]}>Hide from selected people</Text>
                </View>
                {visibility === 'except' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setVisibility('only')}
                style={[styles.privacyOption, visibility === 'only' && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
              >
                <Users size={18} color={palette.primaryLight} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: palette.textPrimary }]}>Only share with...</Text>
                  <Text style={[styles.privacyDesc, { color: palette.textMuted }]}>Share with selected people only</Text>
                </View>
                {visibility === 'only' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              {/* Multi-Select Contact List for Except / Only */}
              {(visibility === 'except' || visibility === 'only') && (
                <FlatList
                  data={contacts}
                  keyExtractor={(item) => item.id || item._id || ''}
                  style={styles.privacyContactsList}
                  renderItem={({ item }) => {
                    const uId = item.id || item._id || '';
                    const isSelected = selectedContactIds.includes(uId);
                    return (
                      <TouchableOpacity onPress={() => toggleSelectPrivacyContact(uId)} style={styles.privacyContactRow}>
                        <Image source={{ uri: item.avatarUrl }} style={styles.contactAvatar} />
                        <Text style={[styles.contactName, { color: palette.textPrimary }]}>{item.name}</Text>
                        <View style={[styles.checkbox, isSelected && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
                          {isSelected && <Check size={12} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  closeBtn: { padding: 4 },
  privacyTrigger: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  privacyTriggerText: { fontSize: 12, fontWeight: '600' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 16 },
  optionBtn: { alignItems: 'center' },
  optionIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 4 },
  optionLabel: { fontSize: 13, fontWeight: '600' },
  fullScreenContent: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'space-between' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  topHeaderOverlay: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#FFFFFF' },
  swatchActive: { transform: [{ scale: 1.2 }], borderColor: '#F59E0B' },
  postBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  textCenterWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  textStoryInput: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', textAlign: 'center', width: '100%' },
  mediaPreview: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain', backgroundColor: '#000000' },
  captionInputContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 8 },
  captionInput: { color: '#FFFFFF', fontSize: 16, height: 44 },
  privacySheetContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: SCREEN_HEIGHT * 0.7 },
  privacyOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8 },
  privacyTitle: { fontSize: 15, fontWeight: '700' },
  privacyDesc: { fontSize: 12, marginTop: 2 },
  privacyContactsList: { maxHeight: 200, marginTop: 10 },
  privacyContactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  contactAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  contactName: { fontSize: 14, fontWeight: '600', flex: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#666', justifyContent: 'center', alignItems: 'center' },
});
