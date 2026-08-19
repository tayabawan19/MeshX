import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, FileText, Check, ArrowRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { BoldButton } from '../../components/common/BoldButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, updateUserProfile } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || 'Hey there! I am using MeshX.');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pickAvatar = async () => {
    triggerHaptic('selection');
    setErrorMsg('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access in device settings to choose an avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setAvatarUrl(localUri);

        setIsUploadingAvatar(true);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: localUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as any);

          const uploadRes = await apiClient.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const uploadedUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url;
          if (uploadedUrl) {
            setAvatarUrl(uploadedUrl);
            triggerHaptic('success');
          }
        } catch (uploadErr) {
          console.warn('Direct avatar upload failed, will upload on save:', uploadErr);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (err) {
      console.warn('Avatar pick error:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Display name is required');
      triggerHaptic('heavy');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    triggerHaptic('medium');

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarUrl && avatarUrl.startsWith('file://')) {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: avatarUrl,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as any);

          const uploadRes = await apiClient.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          finalAvatarUrl = uploadRes.data?.mediaUrl || uploadRes.data?.url || avatarUrl;
        } catch (upErr) {
          console.warn('Save fallback avatar upload warning:', upErr);
        }
      }

      await updateProfile({ name: name.trim(), bio: bio.trim(), avatarUrl: finalAvatarUrl });
      updateUserProfile({ name: name.trim(), bio: bio.trim(), avatarUrl: finalAvatarUrl });
      triggerHaptic('success');

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
      triggerHaptic('heavy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Set Up Profile" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
            <View style={styles.avatarShadow} />
            <View style={[styles.avatarRing, { borderColor: '#000000', backgroundColor: palette.surfaceElevated }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: palette.accent }]}>
                  <Text style={styles.initialText}>
                    {name ? name.charAt(0).toUpperCase() : 'M'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.cameraBadge, { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
              <Camera size={18} color="#100F17" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.avatarSubtext, { color: palette.textMuted }]}>
            {isUploadingAvatar ? 'Uploading avatar...' : 'Tap to change photo'}
          </Text>
        </View>

        {errorMsg ? (
          <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 77, 94, 0.15)', borderColor: palette.error }]}>
            <Text style={[styles.errorText, { color: palette.error }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Display Name Input */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.secondary }]}>DISPLAY NAME</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputShadow} />
            <View style={[styles.inputBox, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
              <User size={20} color={palette.secondary} strokeWidth={2.5} style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, { color: palette.textPrimary }]}
              />
            </View>
          </View>
        </View>

        {/* Status / Bio Input */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.secondary }]}>STATUS / BIO</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputShadow} />
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: palette.surfaceElevated,
                  borderColor: '#000000',
                  height: 80,
                  alignItems: 'flex-start',
                  paddingTop: 12,
                },
              ]}
            >
              <FileText size={20} color={palette.primary} strokeWidth={2.5} style={[styles.inputIcon, { marginTop: 2 }]} />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Write a short bio..."
                placeholderTextColor={palette.textMuted}
                multiline
                style={[styles.input, { color: palette.textPrimary, height: 60 }]}
              />
            </View>
          </View>
        </View>

        <BoldButton
          title="Save Profile"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || isUploadingAvatar}
          icon={<Check size={20} color="#FFFFFF" strokeWidth={3} />}
          size="lg"
          style={{ marginTop: 16 }}
        />

        <TouchableOpacity onPress={handleSkip} style={styles.skipBottomButton}>
          <Text style={[styles.skipBottomText, { color: palette.textSecondary }]}>Continue to Chats</Text>
          <ArrowRight size={16} color={palette.textSecondary} strokeWidth={2.5} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarTouchable: {
    position: 'relative',
    width: 114,
    height: 114,
  },
  avatarShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 57,
    backgroundColor: '#000000',
  },
  avatarRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarSubtext: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 20,
    backgroundColor: '#000000',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  skipBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 10,
  },
  skipBottomText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
