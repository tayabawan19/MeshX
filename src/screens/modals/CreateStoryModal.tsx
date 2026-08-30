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
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';
import { BoldButton } from '../../components/common/BoldButton';

const FLAT_PALETTES: string[] = [
  '#8E0E2C', // Crimson Velvet
  '#540F27', // Plum Wine
  '#251025', // Dark Velvet
  '#C2185B', // Deep Rose
  '#D81B60', // Fuchsia Berry
  '#160D1E', // Dark Plum Charcoal
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
            'Please allow photo library access in device settings.'
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
            'Please allow camera access in device settings.'
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
      Alert.alert('Upload Failed', 'Failed to upload story.');
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
            <View style={styles.pickerSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Create Status</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              {/* Privacy Trigger Pill */}
              <TouchableOpacity
                onPress={() => setShowPrivacySheet(true)}
                style={styles.privacyTrigger}
              >
                <Lock size={13} color="#8E0E2C" style={{ marginRight: 6 }} />
                <Text style={styles.privacyTriggerText}>
                  {visibility === 'contacts'
                    ? 'My contacts'
                    : visibility === 'except'
                    ? `My contacts except (${selectedContactIds.length})`
                    : `Only share with (${selectedContactIds.length})`}
                </Text>
              </TouchableOpacity>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => pickMedia('camera')} style={styles.optionBtn}>
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(142, 14, 44, 0.08)' }]}>
                    <Camera size={26} color="#8E0E2C" />
                  </View>
                  <Text style={styles.optionLabel}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => pickMedia('gallery')} style={styles.optionBtn}>
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(142, 14, 44, 0.08)' }]}>
                    <ImageIcon size={26} color="#8E0E2C" />
                  </View>
                  <Text style={styles.optionLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setMode('text');
                  }}
                  style={styles.optionBtn}
                >
                  <LinearGradient
                    colors={['#8E0E2C', '#540F27']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionIcon}
                  >
                    <Type size={26} color="#FFFFFF" strokeWidth={2.5} />
                  </LinearGradient>
                  <Text style={styles.optionLabel}>Text</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Mode: Text Story Creator */}
        {mode === 'text' && (
          <View style={[styles.fullScreenContent, { backgroundColor: selectedColor }]}>
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={handleReset} style={styles.iconCircle}>
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
                style={[styles.postBtn, { opacity: text.trim() ? 1 : 0.5 }]}
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
              <TouchableOpacity onPress={handleReset} style={styles.iconCircle}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomCaptionRow}>
              <View style={styles.captionInputSlot}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption..."
                  placeholderTextColor="#9E9E9E"
                  style={styles.captionTextInput}
                />
                <TouchableOpacity onPress={handlePost} disabled={isPosting} style={styles.sendMediaBtn}>
                  {isPosting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Privacy Selector Modal Sheet */}
        <Modal visible={showPrivacySheet} transparent animationType="fade" onRequestClose={() => setShowPrivacySheet(false)}>
          <View style={styles.privacyModalOverlay}>
            <View style={styles.privacySheetCard}>
              <Text style={styles.privacySheetTitle}>Status Privacy</Text>
              <Text style={styles.privacySheetSub}>
                Who can see my status updates:
              </Text>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('contacts');
                }}
                style={[styles.privacyOption, visibility === 'contacts' && styles.privacyOptionActive]}
              >
                <Text style={styles.privacyOptionText}>My contacts</Text>
                {visibility === 'contacts' && <Check size={16} color="#8E0E2C" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('except');
                }}
                style={[styles.privacyOption, visibility === 'except' && styles.privacyOptionActive]}
              >
                <Text style={styles.privacyOptionText}>My contacts except...</Text>
                {visibility === 'except' && <Check size={16} color="#8E0E2C" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setVisibility('only');
                }}
                style={[styles.privacyOption, visibility === 'only' && styles.privacyOptionActive]}
              >
                <Text style={styles.privacyOptionText}>Only share with...</Text>
                {visibility === 'only' && <Check size={16} color="#8E0E2C" />}
              </TouchableOpacity>

              {/* Contacts Selection List */}
              {(visibility === 'except' || visibility === 'only') && (
                <View style={styles.contactListWrapper}>
                  <Text style={styles.contactListHeader}>
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
                          <Text style={styles.contactName}>{item.name}</Text>
                          <View style={[styles.checkbox, isSelected && { backgroundColor: '#8E0E2C', borderColor: '#8E0E2C' }]}>
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
  container: { flex: 1, backgroundColor: '#000000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  closeBtn: { padding: 4 },
  privacyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    marginBottom: 24,
  },
  privacyTriggerText: { fontSize: 12, fontWeight: '600', color: '#8E0E2C' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  optionBtn: { alignItems: 'center' },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 26,
    fontWeight: '800',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  captionTextInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  sendMediaBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8E0E2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  privacySheetCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
  privacySheetTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  privacySheetSub: { fontSize: 12, color: '#757575', marginBottom: 14 },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  privacyOptionActive: { backgroundColor: 'rgba(142, 14, 44, 0.05)', borderRadius: 8, paddingHorizontal: 6 },
  privacyOptionText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  contactListWrapper: { marginTop: 10 },
  contactListHeader: { fontSize: 11, fontWeight: '700', color: '#8E0E2C', marginBottom: 6 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  contactName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
