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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { email, otp } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.formHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.screenHeading}>Create New</Text>
            <Text style={styles.screenHeading}>Password</Text>
          </View>
        </View>

        {/* White Curved Container */}
        <View style={styles.whiteCardContainer}>
          <View style={styles.whiteCardContent}>
            {isSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={56} color="#2E7D32" style={{ marginBottom: 14 }} />
                <Text style={styles.successTitle}>Password Reset!</Text>
                <Text style={styles.successSubtitle}>
                  Your password has been reset successfully. You can now sign in.
                </Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorBoxText}>{error}</Text>
                  </View>
                ) : null}

                {/* New Password */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <View style={styles.inputUnderlineRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#BDBDBD"
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        clearError();
                      }}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      {showPass ? <Eye size={18} color="#8E0E2C" /> : <EyeOff size={18} color="#9E9E9E" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.inputUnderlineRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#BDBDBD"
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        clearError();
                      }}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <Eye size={18} color="#8E0E2C" /> : <EyeOff size={18} color="#9E9E9E" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            {isSuccess ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
                style={styles.submitBtnWrapper}
              >
                <LinearGradient
                  colors={['#8E0E2C', '#540F27', '#251025']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradientBtn}
                >
                  <Text style={styles.submitBtnText}>BACK TO SIGN IN</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReset}
                disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword || isSubmitting}
                style={styles.submitBtnWrapper}
              >
                <LinearGradient
                  colors={['#8E0E2C', '#540F27', '#251025']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradientBtn}
                >
                  <Text style={styles.submitBtnText}>RESET PASSWORD</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formHeader: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    paddingHorizontal: 8,
  },
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
    justifyContent: 'space-between',
    padding: 28,
    paddingBottom: 36,
  },
  whiteCardContent: {
    paddingTop: 10,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 19,
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
  footer: {
    width: '100%',
  },
  submitBtnWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
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
});
