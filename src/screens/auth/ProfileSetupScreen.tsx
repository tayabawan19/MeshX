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
            <View style={[styles.avatarRing, { borderColor: palette.border, backgroundColor: palette.surfaceElevated }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: palette.primary }]}>
                  <Text style={styles.initialText}>
                    {name ? name.charAt(0).toUpperCase() : 'M'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.cameraBadge, { backgroundColor: palette.surfaceLight }]}>
              <Camera size={16} color={palette.textPrimary} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.avatarSubtext, { color: palette.textMuted }]}>
            {isUploadingAvatar ? 'Uploading avatar...' : 'Tap to change photo'}
          </Text>
        </View>

        {errorMsg ? (
          <View style={[styles.errorContainer, { backgroundColor: 'rgba(242, 63, 66, 0.15)', borderColor: palette.error }]}>
            <Text style={[styles.errorText, { color: palette.error }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Display Name Input */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>DISPLAY NAME</Text>
          <View style={[styles.inputBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <User size={18} color={palette.textMuted} style={styles.inputIcon} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={palette.textMuted}
              style={[styles.input, { color: palette.textPrimary }]}
            />
          </View>
        </View>

        {/* Status / Bio Input */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>STATUS / BIO</Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                height: 72,
                alignItems: 'flex-start',
                paddingTop: 10,
              },
            ]}
          >
            <FileText size={18} color={palette.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio..."
              placeholderTextColor={palette.textMuted}
              multiline
              style={[styles.input, { color: palette.textPrimary, height: 50 }]}
            />
          </View>
        </View>

        <BoldButton
          title="Save Profile"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || isUploadingAvatar}
          icon={<Check size={18} color="#FFFFFF" />}
          size="lg"
          style={{ marginTop: 14 }}
        />

        <TouchableOpacity onPress={handleSkip} style={styles.skipBottomButton}>
          <Text style={[styles.skipBottomText, { color: palette.textMuted }]}>Skip for now</Text>
          <ArrowRight size={14} color={palette.textMuted} style={{ marginLeft: 4 }} />
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
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarTouchable: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSubtext: {
    fontSize: 12,
    marginTop: 8,
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  skipBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  skipBottomText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
