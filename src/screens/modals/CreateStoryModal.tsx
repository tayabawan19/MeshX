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
import { X, Camera, ImageIcon, Type, Check, Send, Lock } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { BoldButton } from '../../components/common/BoldButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FLAT_PALETTES: string[] = [
  '#FF4D5E', // Hot Coral
  '#2E4BFF', // Cobalt Blue
  '#C6FF3D', // Electric Lime
  '#A855F7', // Bubblegum Violet
  '#00F0FF', // Cyber Cyan
  '#FFD23F', // Sunshine Yellow
];

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ visible, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const { contacts, postStory } = useChatStore();

  const [mode, setMode] = useState<'picker' | 'text' | 'media'>('picker');
  const [selectedColor, setSelectedColor] = useState<string>(FLAT_PALETTES[0]);
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
          backgroundColor: selectedColor,
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
            <View style={[styles.pickerSheet, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Create Story</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={22} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Privacy Trigger Pill */}
              <TouchableOpacity
                onPress={() => setShowPrivacySheet(true)}
                style={[styles.privacyTrigger, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}
              >
                <Lock size={14} color={palette.secondary} style={{ marginRight: 6 }} />
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
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#FF4D5E', borderColor: '#000000' }]}>
                    <Camera size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => pickMedia('gallery')} style={styles.optionBtn}>
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#2E4BFF', borderColor: '#000000' }]}>
                    <ImageIcon size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setMode('text');
                  }}
                  style={styles.optionBtn}
                >
                  <View style={styles.optionIconShadow} />
                  <View style={[styles.optionIcon, { backgroundColor: '#C6FF3D', borderColor: '#000000' }]}>
                    <Type size={28} color="#100F17" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Text Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Mode: Text Story Creator */}
        {mode === 'text' && (
          <View style={[styles.fullScreenContent, { backgroundColor: selectedColor }]}>
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={[styles.iconCircle, { backgroundColor: '#000000', borderColor: '#FFFFFF' }]}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.swatchRow}>
                {FLAT_PALETTES.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.swatch,
                      { backgroundColor: color, borderColor: '#000000' },
                      selectedColor === color && styles.swatchActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handlePost}
                disabled={isPosting || !text.trim()}
                style={[styles.postBtn, { backgroundColor: '#000000', borderColor: '#FFFFFF', opacity: text.trim() ? 1 : 0.5 }]}
              >
                {isPosting ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" strokeWidth={2.5} />}
              </TouchableOpacity>
            </View>

            <View style={styles.textCenterWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Tap to type a story..."
                placeholderTextColor={selectedColor === '#C6FF3D' || selectedColor === '#FFD23F' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'}
                multiline
                autoFocus
                style={[
                  styles.textStoryInput,
                  { color: selectedColor === '#C6FF3D' || selectedColor === '#FFD23F' ? '#100F17' : '#FFFFFF' },
                ]}
              />
            </View>
          </View>
        )}

        {/* Mode: Media Story Preview & Caption */}
        {mode === 'media' && mediaUri && (
          <View style={styles.fullScreenContent}>
            <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />

            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={[styles.iconCircle, { backgroundColor: '#000000', borderColor: '#000000' }]}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomCaptionRow}>
              <View style={styles.captionInputShadow} />
              <View style={styles.captionInputSlot}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption..."
                  placeholderTextColor="#A5A5BA"
                  style={styles.captionTextInput}
                />
                <TouchableOpacity onPress={handlePost} disabled={isPosting} style={styles.sendMediaBtn}>
                  {isPosting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={18} color="#FFFFFF" strokeWidth={2.5} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Privacy Selector Modal Sheet */}
        <Modal visible={showPrivacySheet} transparent animationType="slide" onRequestClose={() => setShowPrivacySheet(false)}>
          <View style={styles.privacyModalOverlay}>
            <View style={[styles.privacySheetCard, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
              <Text style={[styles.privacySheetTitle, { color: palette.textPrimary }]}>Status Privacy</Text>
              <Text style={[styles.privacySheetSub, { color: palette.textMuted }]}>
                Who can see my status updates:
              </Text>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('contacts');
                }}
                style={[styles.privacyOption, visibility === 'contacts' && styles.privacyOptionActive]}
              >
                <Text style={[styles.privacyOptionText, { color: palette.textPrimary }]}>My contacts</Text>
                {visibility === 'contacts' && <Check size={18} color={palette.secondary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('except');
                }}
                style={[styles.privacyOption, visibility === 'except' && styles.privacyOptionActive]}
              >
                <Text style={[styles.privacyOptionText, { color: palette.textPrimary }]}>My contacts except...</Text>
                {visibility === 'except' && <Check size={18} color={palette.secondary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('only');
                }}
                style={[styles.privacyOption, visibility === 'only' && styles.privacyOptionActive]}
              >
                <Text style={[styles.privacyOptionText, { color: palette.textPrimary }]}>Only share with...</Text>
                {visibility === 'only' && <Check size={18} color={palette.secondary} />}
              </TouchableOpacity>

              {/* Contacts Selection List */}
              {(visibility === 'except' || visibility === 'only') && (
                <View style={styles.contactListWrapper}>
                  <Text style={[styles.contactListHeader, { color: palette.secondary }]}>
                    {visibility === 'except' ? 'Hide status from:' : 'Share status only with:'}
                  </Text>
                  <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id || item._id || ''}
                    style={{ maxHeight: 180 }}
                    renderItem={({ item }) => {
                      const cId = item.id || item._id || '';
                      const isSelected = selectedContactIds.includes(cId);
                      return (
                        <TouchableOpacity
                          onPress={() => toggleSelectPrivacyContact(cId)}
                          style={styles.contactRow}
                        >
                          <Text style={[styles.contactName, { color: palette.textPrimary }]}>{item.name}</Text>
                          <View style={[styles.checkbox, isSelected && { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
                            {isSelected && <Check size={14} color="#100F17" strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}

              <BoldButton
                title="Save Privacy"
                variant="primary"
                onPress={() => setShowPrivacySheet(false)}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  closeBtn: { padding: 4 },
  privacyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 24,
  },
  privacyTriggerText: { fontSize: 13, fontWeight: '800' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  optionBtn: { alignItems: 'center' },
  optionIconShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#000000',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  optionLabel: { fontSize: 13, fontWeight: '800' },
  fullScreenContent: { flex: 1, justifyContent: 'space-between' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  postBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textStoryInput: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    lineHeight: 42,
  },
  bottomCaptionRow: {
    padding: 16,
    paddingBottom: 34,
    position: 'relative',
  },
  captionInputShadow: {
    position: 'absolute',
    top: 19,
    left: 19,
    right: 13,
    bottom: 31,
    borderRadius: 24,
    backgroundColor: '#000000',
  },
  captionInputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1A2E',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 14,
    height: 50,
    zIndex: 1,
  },
  captionTextInput: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  sendMediaBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4D5E', // Hot Coral
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  privacySheetCard: { borderRadius: 24, borderWidth: 2, padding: 20 },
  privacySheetTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
  privacySheetSub: { fontSize: 13, fontWeight: '600', marginBottom: 16 },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  privacyOptionActive: { backgroundColor: 'rgba(198, 255, 61, 0.08)', borderRadius: 12, paddingHorizontal: 8 },
  privacyOptionText: { fontSize: 15, fontWeight: '800' },
  contactListWrapper: { marginTop: 12 },
  contactListHeader: { fontSize: 12, fontWeight: '900', marginBottom: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  contactName: { fontSize: 14, fontWeight: '700' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#A5A5BA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
