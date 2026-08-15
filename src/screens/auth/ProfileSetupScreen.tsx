import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, FileText, Check, ArrowRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { GradientButton } from '../../components/common/GradientButton';
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setAvatarUrl(localUri);

        // Upload to Cloudinary via backend /media/upload
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

          if (uploadRes.data?.url) {
            setAvatarUrl(uploadRes.data.url);
            triggerHaptic('success');
          }
        } catch (uploadErr) {
          console.warn('Avatar upload failed, will retry on save:', uploadErr);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (err) {
      console.error('Pick avatar error:', err);
    }
  };

  const handleFinish = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Display name cannot be empty.');
      triggerHaptic('warning');
      return;
    }

    setIsSaving(true);
    triggerHaptic('medium');

    try {
      let finalAvatarUrl = avatarUrl;

      // If avatar is a local file URI that hasn't been uploaded yet
      if (avatarUrl && (avatarUrl.startsWith('file://') || avatarUrl.startsWith('content://'))) {
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

          if (uploadRes.data?.url) {
            finalAvatarUrl = uploadRes.data.url;
          }
        } catch (e) {
          console.warn('Avatar upload retry failed:', e);
        }
      }

      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl: finalAvatarUrl,
      });

      triggerHaptic('success');
      handleFinish();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg('Failed to save profile. Please try again.');
      triggerHaptic('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    handleFinish();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header
        title="Profile Setup"
        showBack={navigation.canGoBack()}
        rightElement={
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: palette.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={pickAvatar}
            disabled={isUploadingAvatar}
            style={styles.avatarTouchable}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: palette.primary }]}>
                <Text style={styles.initialText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: palette.primary }]}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={18} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.changeText, { color: palette.primaryLight }]}>
            {isUploadingAvatar ? 'Uploading avatar...' : 'Tap to change avatar'}
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>DISPLAY NAME</Text>
          <View style={[styles.inputRow, { backgroundColor: palette.inputBackground, borderColor: palette.border }]}>
            <User size={20} color={palette.textMuted} style={styles.inputIcon} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={palette.textMuted}
              style={[styles.input, { color: palette.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>STATUS / BIO</Text>
          <View style={[styles.inputRow, { backgroundColor: palette.inputBackground, borderColor: palette.border }]}>
            <FileText size={20} color={palette.textMuted} style={styles.inputIcon} />
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

        <GradientButton
          title="Save Profile"
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving || isUploadingAvatar}
          icon={<Check size={20} color="#FFFFFF" />}
          style={{ marginTop: 24 }}
        />

        <TouchableOpacity onPress={handleSkip} style={styles.skipBottomButton}>
          <Text style={[styles.skipBottomText, { color: palette.textSecondary }]}>Continue to Chats</Text>
          <ArrowRight size={16} color={palette.textSecondary} style={{ marginLeft: 4 }} />
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
    marginBottom: 32,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F0F14',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 10,
  },
  skipBottomText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});
