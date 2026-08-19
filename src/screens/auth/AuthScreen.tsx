import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MessageSquare, Mail, Lock, User, Phone } from 'lucide-react-native';
import { BoldButton } from '../../components/common/BoldButton';
import { BoldCard } from '../../components/common/BoldCard';
import { ClayInput } from '../../components/common/ClayInput';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const AuthScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const initialMode = route.params?.initialMode || 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [localError, setLocalError] = useState('');

  const { signup, login, isLoading, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleAuthSubmit = async () => {
    clearError();
    setLocalError('');
    triggerHaptic('selection');

    if (isLogin) {
      if (!email.trim() || !password) {
        setLocalError('Please enter both email and password.');
        return;
      }
      const result = await login(email.trim(), password);
      if (result === true) {
        triggerHaptic('success');
      } else if (result === 'UNVERIFIED') {
        triggerHaptic('warning');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'signup' });
      }
    } else {
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        setLocalError('Please fill in all required fields (Name, Phone, Email, Password).');
        return;
      }
      if (password.length < 8 || !/\d/.test(password)) {
        setLocalError('Password must be at least 8 characters long and contain at least one number.');
        return;
      }
      const success = await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      if (success) {
        triggerHaptic('success');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'signup' });
      }
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Logo Badge with Hard Shadow */}
        <View style={styles.header}>
          <View style={styles.logoShadowWrapper}>
            <View style={styles.logoHardShadow} />
            <View style={[styles.logoBadge, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
              <MessageSquare size={38} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>

          <Text style={[styles.appTitle, { color: palette.textPrimary }]}>MESHX</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to start chatting.'}
          </Text>
        </View>

        {/* Bold Form Card */}
        <BoldCard borderRadius={24} style={styles.formCard}>
          {/* Segmented Toggle Track */}
          <View style={[styles.toggleTrack, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                clearError();
                triggerHaptic('selection');
                setIsLogin(true);
              }}
              style={[
                styles.togglePill,
                isLogin && [
                  styles.togglePillActive,
                  {
                    backgroundColor: palette.secondary, // Electric Lime #C6FF3D
                    borderColor: '#000000',
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, { color: isLogin ? '#100F17' : palette.textMuted }]}>
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                clearError();
                triggerHaptic('selection');
                setIsLogin(false);
              }}
              style={[
                styles.togglePill,
                !isLogin && [
                  styles.togglePillActive,
                  {
                    backgroundColor: palette.secondary, // Electric Lime #C6FF3D
                    borderColor: '#000000',
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, { color: !isLogin ? '#100F17' : palette.textMuted }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {(localError || error) ? (
            <View style={[styles.errorBanner, { borderColor: palette.error }]}>
              <Text style={[styles.errorText, { color: palette.error }]}>{localError || error}</Text>
            </View>
          ) : null}

          {/* Bold Input Slots */}
          {!isLogin && (
            <>
              <ClayInput style={styles.inputSlot}>
                <User size={20} color={palette.textMuted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={palette.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={[styles.textInput, { color: palette.textPrimary }]}
                  autoCapitalize="words"
                />
              </ClayInput>

              <ClayInput style={styles.inputSlot}>
                <Phone size={20} color={palette.textMuted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor={palette.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  style={[styles.textInput, { color: palette.textPrimary }]}
                  keyboardType="phone-pad"
                />
              </ClayInput>
            </>
          )}

          <ClayInput style={styles.inputSlot}>
            <Mail size={20} color={palette.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={palette.textMuted}
              value={email}
              onChangeText={setEmail}
              style={[styles.textInput, { color: palette.textPrimary }]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ClayInput>

          <ClayInput style={styles.inputSlot}>
            <Lock size={20} color={palette.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password (min 8 chars)"
              placeholderTextColor={palette.textMuted}
              value={password}
              onChangeText={setPassword}
              style={[styles.textInput, { color: palette.textPrimary }]}
              secureTextEntry
            />
          </ClayInput>

          {isLogin && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: palette.secondary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <BoldButton
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuthSubmit}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={{ marginTop: 10 }}
          />
        </BoldCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoShadowWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  logoHardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
  },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 2,
    padding: 4,
    marginBottom: 20,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  togglePillActive: {
    borderWidth: 1.5,
  },
  toggleText: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 77, 94, 0.15)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '800',
  },
  inputSlot: {
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
