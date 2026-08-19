import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { ClayInput } from '../../components/common/ClayInput';
import { BoldButton } from '../../components/common/BoldButton';

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { email, otp } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    triggerHaptic('selection');
    clearError();
    setIsSubmitting(true);

    try {
      const success = await resetPassword(email, otp, newPassword);
      if (success) {
        triggerHaptic('success');
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'space-between' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <View style={styles.header}>
            <View style={styles.backWrapper}>
              <View style={styles.backShadow} />
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: palette.surfaceElevated,
                    borderColor: '#000000',
                  },
                ]}
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            {isSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={64} color={palette.secondary} style={{ marginBottom: 16 }} />
                <Text style={[styles.title, { color: palette.textPrimary }]}>Password Reset!</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Your password has been reset successfully. You can now login with your new password.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.iconShadowWrapper}>
                  <View style={styles.iconHardShadow} />
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: palette.primary,
                        borderColor: '#000000',
                      },
                    ]}
                  >
                    <Lock size={40} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>

                <Text style={[styles.title, { color: palette.textPrimary }]}>Create New Password</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Your new password must be different from previous passwords.
                </Text>

                {error ? (
                  <View style={[styles.errorBox, { borderColor: palette.error }]}>
                    <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>
                  </View>
                ) : null}

                <ClayInput style={styles.inputWrapper}>
                  <Lock size={20} color={palette.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={[styles.input, { color: palette.textPrimary }]}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={palette.textMuted}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      clearError();
                    }}
                    secureTextEntry
                  />
                </ClayInput>

                <ClayInput style={[styles.inputWrapper, { marginTop: 14 }]}>
                  <Lock size={20} color={palette.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={[styles.input, { color: palette.textPrimary }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={palette.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      clearError();
                    }}
                    secureTextEntry
                  />
                </ClayInput>
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {isSuccess ? (
            <BoldButton
              title="Back to Sign In"
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
            />
          ) : (
            <BoldButton
              title="Reset Password"
              onPress={handleReset}
              loading={isSubmitting}
              disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              variant="primary"
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 54,
  },
  header: {
    marginBottom: 20,
  },
  backWrapper: {
    position: 'relative',
  },
  backShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
  },
  iconShadowWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  iconHardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 77, 94, 0.15)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '800',
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  footer: {
    marginBottom: 20,
  },
});
