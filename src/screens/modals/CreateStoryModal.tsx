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

const FLAT_PALETTES: string[] = [
  '#5865F2', // Discord Blurple
  '#23A55A', // Discord Green
  '#F23F42', // Discord Red
  '#FEE75C', // Discord Yellow
  '#EB459E', // Discord Fuchsia
  '#2B2D31', // Discord Dark Charcoal
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

        const uploadRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url || mediaUri;

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Mode: Picker Sheet */}
        {mode === 'picker' && (
          <TouchableOpacity activeOpacity={1} onPress={handleClose} style={styles.modalOverlay}>
            <View style={[styles.pickerSheet, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Create Status</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Privacy Trigger Pill */}
              <TouchableOpacity
                onPress={() => setShowPrivacySheet(true)}
                style={[styles.privacyTrigger, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <Lock size={13} color={palette.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.privacyTriggerText, { color: palette.textSecondary }]}>
                  {visibility === 'contacts'
                    ? 'My contacts'
                    : visibility === 'except'
                    ? `My contacts except (${selectedContactIds.length})`
                    : `Only share with (${selectedContactIds.length})`}
                </Text>
              </TouchableOpacity>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => pickMedia('camera')} style={styles.optionBtn}>
                  <View style={[styles.optionIcon, { backgroundColor: palette.surfaceLight }]}>
                    <Camera size={24} color={palette.textPrimary} />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => pickMedia('gallery')} style={styles.optionBtn}>
                  <View style={[styles.optionIcon, { backgroundColor: palette.surfaceLight }]}>
                    <ImageIcon size={24} color={palette.textPrimary} />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Media</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setMode('text');
                  }}
                  style={styles.optionBtn}
                >
                  <View style={[styles.optionIcon, { backgroundColor: palette.primary }]}>
                    <Type size={24} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.optionLabel, { color: palette.textSecondary }]}>Text</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Mode: Text Story Creator */}
        {mode === 'text' && (
          <View style={[styles.fullScreenContent, { backgroundColor: selectedColor }]}>
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={[styles.iconCircle, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.swatchRow}>
                {FLAT_PALETTES.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.swatch,
                      { backgroundColor: color },
                      selectedColor === color && styles.swatchActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handlePost}
                disabled={isPosting || !text.trim()}
                style={[styles.postBtn, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: text.trim() ? 1 : 0.5 }]}
              >
                {isPosting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            <View style={styles.textCenterWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a status update..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                autoFocus
                style={styles.textStoryInput}
              />
            </View>
          </View>
        )}

        {/* Mode: Media Story Preview & Caption */}
        {mode === 'media' && mediaUri && (
          <View style={styles.fullScreenContent}>
            <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />

            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={[styles.iconCircle, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomCaptionRow}>
              <View style={[styles.captionInputSlot, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption..."
                  placeholderTextColor={palette.textMuted}
                  style={[styles.captionTextInput, { color: palette.textPrimary }]}
                />
                <TouchableOpacity onPress={handlePost} disabled={isPosting} style={[styles.sendMediaBtn, { backgroundColor: palette.primary }]}>
                  {isPosting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Privacy Selector Modal Sheet */}
        <Modal visible={showPrivacySheet} transparent animationType="fade" onRequestClose={() => setShowPrivacySheet(false)}>
          <View style={styles.privacyModalOverlay}>
            <View style={[styles.privacySheetCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
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
                {visibility === 'contacts' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('except');
                }}
                style={[styles.privacyOption, visibility === 'except' && styles.privacyOptionActive]}
              >
                <Text style={[styles.privacyOptionText, { color: palette.textPrimary }]}>My contacts except...</Text>
                {visibility === 'except' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('only');
                }}
                style={[styles.privacyOption, visibility === 'only' && styles.privacyOptionActive]}
              >
                <Text style={[styles.privacyOptionText, { color: palette.textPrimary }]}>Only share with...</Text>
                {visibility === 'only' && <Check size={16} color={palette.primary} />}
              </TouchableOpacity>

              {/* Contacts Selection List */}
              {(visibility === 'except' || visibility === 'only') && (
                <View style={styles.contactListWrapper}>
                  <Text style={[styles.contactListHeader, { color: palette.textSecondary }]}>
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
                          <View style={[styles.checkbox, isSelected && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
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
                style={{ marginTop: 14 }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1F22' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  pickerSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  privacyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 20,
  },
  privacyTriggerText: { fontSize: 12, fontWeight: '500' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  optionBtn: { alignItems: 'center' },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLabel: { fontSize: 12, fontWeight: '600' },
  fullScreenContent: { flex: 1, justifyContent: 'space-between' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  postBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  textStoryInput: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    lineHeight: 34,
    color: '#FFFFFF',
  },
  bottomCaptionRow: {
    padding: 14,
    paddingBottom: 28,
  },
  captionInputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  captionTextInput: { flex: 1, fontSize: 14, fontWeight: '400' },
  sendMediaBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  privacySheetCard: { borderRadius: 14, borderWidth: 1, padding: 18 },
  privacySheetTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  privacySheetSub: { fontSize: 12, fontWeight: '400', marginBottom: 14 },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  privacyOptionActive: { borderRadius: 8, paddingHorizontal: 6 },
  privacyOptionText: { fontSize: 14, fontWeight: '600' },
  contactListWrapper: { marginTop: 10 },
  contactListHeader: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  contactName: { fontSize: 13, fontWeight: '500' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#949BA4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
