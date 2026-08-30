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
import { ArrowLeft, Mail, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    triggerHaptic('selection');
    clearError();
    setIsSubmitting(true);

    try {
      const success = await forgotPassword(email.trim());
      if (success) {
        triggerHaptic('success');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'reset' });
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
            <Text style={styles.screenHeading}>Forgot</Text>
            <Text style={styles.screenHeading}>Password?</Text>
            <Text style={styles.headerSubtitle}>
              Enter your email to receive a password reset code.
            </Text>
          </View>
        </View>

        {/* White Curved Container */}
        <View style={styles.whiteCardContainer}>
          <View style={styles.whiteCardContent}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Registered Gmail</Text>
              <View style={styles.inputUnderlineRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Joydeo@gmail.com"
                  placeholderTextColor="#BDBDBD"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {email.includes('@') && <Check size={18} color="#8E0E2C" strokeWidth={2.5} />}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={!email || !email.includes('@') || isSubmitting}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={['#8E0E2C', '#540F27', '#251025']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradientBtn}
              >
                <Text style={styles.submitBtnText}>SEND CODE</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
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
