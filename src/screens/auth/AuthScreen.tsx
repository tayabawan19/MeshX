import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MoreHorizontal,
  Check,
  Eye,
  EyeOff,
  Instagram,
  Twitter,
  Facebook,
  MessageSquare,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AuthScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const initialMode = route.params?.initialMode;
  // Modes: 'welcome' | 'login' | 'signup'
  const [viewMode, setViewMode] = useState<'welcome' | 'login' | 'signup'>(
    initialMode === 'signup' ? 'signup' : initialMode === 'login' ? 'login' : 'welcome'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, login, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleLoginSubmit = async () => {
    clearError();
    setLocalError('');
    triggerHaptic('selection');

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result === true) {
        triggerHaptic('success');
      } else if (result === 'UNVERIFIED') {
        triggerHaptic('warning');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'signup' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async () => {
    clearError();
    setLocalError('');
    triggerHaptic('selection');

    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setLocalError('Password must be at least 8 characters and contain a number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await signup({
        name: name.trim(),
        email: email.trim(),
        phone: '0000000000',
        password,
      });
      if (success) {
        triggerHaptic('success');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'signup' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SCREEN 1: WELCOME SCREEN (Middle screen in reference mockup)
  // ---------------------------------------------------------------------------
  if (viewMode === 'welcome') {
    return (
      <LinearGradient
        colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.fullGradient, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.dotsBtn} onPress={() => triggerHaptic('light')}>
            <MoreHorizontal color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeContent}>
          {/* Logo & Brand */}
          <View style={styles.welcomeLogoSection}>
            <View style={styles.welcomeLogoIconWrapper}>
              <MessageSquare size={44} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.welcomeBrandText}>MESHX</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeTitle}>Welcome Back</Text>

          {/* Action Buttons */}
          <View style={styles.welcomeButtonsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('selection');
                clearError();
                setLocalError('');
                setViewMode('login');
              }}
              style={styles.welcomeOutlineBtn}
            >
              <Text style={styles.welcomeOutlineBtnText}>SIGN IN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('selection');
                clearError();
                setLocalError('');
                setViewMode('signup');
              }}
              style={styles.welcomeSolidBtn}
            >
              <Text style={styles.welcomeSolidBtnText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Footer */}
          <View style={styles.socialSection}>
            <Text style={styles.socialPromptText}>Login with Social Media</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIconCircle} onPress={() => triggerHaptic('light')}>
                <Instagram size={18} color="#160D1E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconCircle} onPress={() => triggerHaptic('light')}>
                <Twitter size={18} color="#160D1E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconCircle} onPress={() => triggerHaptic('light')}>
                <Facebook size={18} color="#160D1E" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2 & 3: LOGIN OR SIGN UP (Left and Right screens in reference mockup)
  // ---------------------------------------------------------------------------
  const isLogin = viewMode === 'login';

  return (
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.fullGradient, { paddingTop: Math.max(insets.top, 20) }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header Section */}
        <View style={styles.formHeader}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.dotsBtn}
              onPress={() => {
                triggerHaptic('light');
                setViewMode('welcome');
              }}
            >
              <MoreHorizontal color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerTitleContainer}>
            {isLogin ? (
              <>
                <Text style={styles.screenHeading}>Hello</Text>
                <Text style={styles.screenHeading}>Sign in!</Text>
              </>
            ) : (
              <>
                <Text style={styles.screenHeading}>Create Your</Text>
                <Text style={styles.screenHeading}>Account</Text>
              </>
            )}
          </View>
        </View>

        {/* White Curved Form Sheet */}
        <View style={styles.whiteCardContainer}>
          <ScrollView
            contentContainerStyle={styles.whiteCardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {(localError || error) ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{localError || error}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <>
                {/* Full Name */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
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
              </>
            )}

            {/* Email / Gmail */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{isLogin ? 'Gmail' : 'Phone or Gmail'}</Text>
              <View style={styles.inputUnderlineRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Joydeo@gmail.com"
                  placeholderTextColor="#BDBDBD"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {email.includes('@') && <Check size={18} color="#8E0E2C" strokeWidth={2.5} />}
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputUnderlineRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#BDBDBD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <Eye size={18} color="#8E0E2C" />
                  ) : (
                    <EyeOff size={18} color="#9E9E9E" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              /* Confirm Password */
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputUnderlineRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#BDBDBD"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? (
                      <Eye size={18} color="#8E0E2C" />
                    ) : (
                      <EyeOff size={18} color="#9E9E9E" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isLogin && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassBtn}
              >
                <Text style={styles.forgotPassText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Gradient Submit Pill Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={isLogin ? handleLoginSubmit : handleSignupSubmit}
              disabled={isSubmitting}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={['#8E0E2C', '#540F27', '#251025']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradientBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{isLogin ? 'SIGN IN' : 'SIGN UP'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Bottom Navigation Link */}
            <View style={styles.switchModeFooter}>
              <Text style={styles.switchModeMuted}>Don't have account? </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  clearError();
                  setLocalError('');
                  setViewMode(isLogin ? 'signup' : 'login');
                }}
              >
                <Text style={styles.switchModeBold}>{isLogin ? 'Sign up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullGradient: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dotsBtn: {
    padding: 6,
  },

  // ---------------------------------------------------------------------------
  // Welcome Screen Styles
  // ---------------------------------------------------------------------------
  welcomeContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  welcomeLogoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeLogoIconWrapper: {
    marginBottom: 8,
  },
  welcomeBrandText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 20,
  },
  welcomeButtonsContainer: {
    width: '100%',
    gap: 16,
  },
  welcomeOutlineBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeOutlineBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  welcomeSolidBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSolidBtnText: {
    color: '#160D1E',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  socialSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  socialPromptText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---------------------------------------------------------------------------
  // Form Header & White Card Styles
  // ---------------------------------------------------------------------------
  formHeader: {
    paddingBottom: 24,
  },
  headerTitleContainer: {
    paddingHorizontal: 30,
    marginTop: 8,
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
    overflow: 'hidden',
  },
  whiteCardScroll: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 36,
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
    color: '#8E0E2C', // Signature deep red/crimson label
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
  eyeBtn: {
    padding: 4,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 26,
  },
  forgotPassText: {
    color: '#757575',
    fontSize: 13,
    fontWeight: '600',
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
  switchModeFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 26,
    paddingBottom: 10,
  },
  switchModeMuted: {
    color: '#9E9E9E',
    fontSize: 13,
    fontWeight: '500',
  },
  switchModeBold: {
    color: '#212121',
    fontSize: 13,
    fontWeight: '800',
  },
});
