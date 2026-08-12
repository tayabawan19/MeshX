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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Camera, ImageIcon, Type, Check, Send } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_PALETTES: [string, string][] = [
  ['#7C3AED', '#3B82F6'],
  ['#EC4899', '#8B5CF6'],
  ['#10B981', '#06B6D4'],
  ['#F59E0B', '#EF4444'],
  ['#6366F1', '#EC4899'],
  ['#06B6D4', '#3B82F6'],
];

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ visible, onClose }) => {
  const palette = useThemeStore((state) => state.palette);
  const postStory = useChatStore((state) => state.postStory);

  const [mode, setMode] = useState<'picker' | 'text' | 'media'>('picker');
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(COLOR_PALETTES[0]);
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

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
    let result;
    if (source === 'gallery') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
    } else {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
      setMode('media');
    }
  };

  const handlePost = async () => {
    if (isPosting) return;
    setIsPosting(true);
    triggerHaptic('medium');

    try {
      if (mode === 'text') {
        if (!text.trim()) {
          setIsPosting(false);
          return;
        }
        await postStory({
          type: 'text',
          caption: text.trim(),
          backgroundColor: selectedGradient[0],
        });
      } else if (mode === 'media' && mediaUri) {
        // Upload media first via /api/media/upload
        const formData = new FormData();
        const filename = mediaUri.split('/').pop() || `story_${Date.now()}`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        const mime = mediaType === 'video' ? `video/${ext}` : `image/${ext}`;

        formData.append('file', {
          uri: mediaUri,
          name: filename,
          type: mime,
        } as any);

        const uploadRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.mediaUrl || mediaUri;

        await postStory({
          type: mediaType,
          mediaUrl: uploadedUrl,
          caption: caption.trim(),
        });
      }

      triggerHaptic('success');
      handleClose();
    } catch (err) {
      console.error('[CreateStory Error]', err);
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

              {/* Color Swatches */}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  closeBtn: { padding: 4 },
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
  mediaPreview: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'cover' },
  captionInputContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 8 },
  captionInput: { color: '#FFFFFF', fontSize: 16, height: 44 },
});
