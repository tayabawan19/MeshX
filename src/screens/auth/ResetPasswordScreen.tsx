import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { email, otp } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const { theme } = useThemeStore();

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    triggerHaptic('selection');
    clearError();

    const success = await resetPassword(email, otp, newPassword);
    if (success) {
      triggerHaptic('success');
      setIsSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isSuccess ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: 16 }} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Password Reset!</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Your password has been reset successfully. You can now login with your new password.
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
              onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
            >
              <Text style={styles.submitButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceLight }]}>
              <Lock size={40} color={theme.colors.primary} />
            </View>

            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Set New Password</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your new password below for account <Text style={{ fontWeight: '700' }}>{email}</Text>
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Lock size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="New Password (min 6 chars)"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                value={newPassword}
                onChangeText={(t) => {
                  clearError();
                  setNewPassword(t);
                }}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Lock size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleReset}
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  header: { height: 48, justifyContent: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  content: { flex: 1, alignItems: 'center', paddingTop: 24 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  submitButton: { width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  successBox: { alignItems: 'center', width: '100%', paddingTop: 40 },
});
