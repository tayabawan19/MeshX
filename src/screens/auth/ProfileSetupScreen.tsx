import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, FileText, Check } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { GradientButton } from '../../components/common/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const ProfileSetupScreen: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const pickAvatar = async () => {
    triggerHaptic('selection');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    triggerHaptic('success');
    updateProfile({
      name,
      bio,
      avatarUrl,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header title="Profile Setup" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity activeOpacity={0.8} onPress={pickAvatar} style={styles.avatarTouchable}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: palette.primary }]}>
                <Text style={styles.initialText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: palette.primary }]}>
              <Camera size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.changeText, { color: palette.primaryLight }]}>Tap to change avatar</Text>
        </View>

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
          icon={<Check size={20} color="#FFFFFF" />}
          style={{ marginTop: 24 }}
        />
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
});
