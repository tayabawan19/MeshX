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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../config/api';
import { triggerHaptic } from '../../utils/haptics';

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, updateUserProfile } = useAuthStore();

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
          'Please allow photo library access in device settings.'
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
          console.warn('Direct avatar upload error:', uploadErr);
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
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
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
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  };

  return (
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
    >
      {/* Header Area */}
      <View style={styles.formHeader}>
        <Text style={styles.screenHeading}>Set Up Your</Text>
        <Text style={styles.screenHeading}>Profile</Text>
      </View>

      {/* White Curved Sheet */}
      <View style={styles.whiteCardContainer}>
        <ScrollView contentContainerStyle={styles.whiteCardScroll} keyboardShouldPersistTaps="handled">
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarTouchable}>
              <View style={styles.avatarRing}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.initialText}>
                      {name ? name.charAt(0).toUpperCase() : 'M'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cameraBadge}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarSubtext}>
              {isUploadingAvatar ? 'Uploading avatar...' : 'Tap to change photo'}
            </Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <View style={styles.inputUnderlineRow}>
              <TextInput
                style={styles.textInput}
                placeholder="John Smith"
                placeholderTextColor="#BDBDBD"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              {name.trim().length > 0 && <Check size={18} color="#8E0E2C" strokeWidth={2.5} />}
            </View>
          </View>

          {/* Status / Bio */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Status / Bio</Text>
            <View style={styles.inputUnderlineRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Hey there! I am using MeshX."
                placeholderTextColor="#BDBDBD"
                value={bio}
                onChangeText={setBio}
              />
            </View>
          </View>

          {/* Submit Pill Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={isSaving || isUploadingAvatar}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#8E0E2C', '#540F27', '#251025']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradientBtn}
            >
              <Text style={styles.submitBtnText}>SAVE PROFILE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBottomButton}>
            <Text style={styles.skipBottomText}>Skip for now</Text>
            <ArrowRight size={14} color="#757575" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formHeader: { paddingHorizontal: 28, paddingBottom: 24 },
  screenHeading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  whiteCardScroll: {
    padding: 28,
    paddingTop: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 26,
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
    borderWidth: 2.5,
    borderColor: '#8E0E2C',
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
    backgroundColor: '#8E0E2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSubtext: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldWrapper: {
    marginBottom: 22,
  },
  fieldLabel: {
    color: '#8E0E2C',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputUnderlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
    paddingVertical: 2,
  },
  submitBtnWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradientBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
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
    fontWeight: '600',
    color: '#757575',
  },
});
