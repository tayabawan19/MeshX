import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Mail, Lock, User, Phone } from 'lucide-react-native';
import { GradientButton } from '../../components/common/GradientButton';
import { ClayCard } from '../../components/common/ClayCard';
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
        {/* Header Clay Logo */}
        <View style={styles.header}>
          <View
            style={[
              styles.clayLogoBadge,
              {
                borderTopColor: palette.clayHighlight,
                borderLeftColor: palette.clayHighlight,
                borderBottomColor: 'rgba(0,0,0,0.45)',
                borderRightColor: 'rgba(0,0,0,0.30)',
              },
            ]}
          >
            <LinearGradient
              colors={[palette.primary, palette.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <MessageSquare size={38} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.appTitle, { color: palette.textPrimary }]}>MESHX</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to start chatting.'}
          </Text>
        </View>

        {/* Raised Clay Form Card */}
        <ClayCard borderRadius={32} elevationLevel="high" style={styles.formCard}>
          {/* Recessed Clay Toggle Track */}
          <View
            style={[
              styles.toggleTrack,
              {
                backgroundColor: palette.inputBackground,
                borderTopColor: palette.clayInsetDark,
                borderLeftColor: palette.clayInsetDark,
                borderBottomColor: palette.clayInsetLight,
                borderRightColor: palette.clayInsetLight,
              },
            ]}
          >
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
                    backgroundColor: palette.primary,
                    borderTopColor: palette.clayHighlight,
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, isLogin ? styles.toggleTextActive : { color: palette.textMuted }]}>
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
                    backgroundColor: palette.primary,
                    borderTopColor: palette.clayHighlight,
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, !isLogin ? styles.toggleTextActive : { color: palette.textMuted }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {(localError || error) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          ) : null}

          {/* Recessed Clay Input Slots */}
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
              <Text style={[styles.forgotText, { color: palette.primaryLight }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <GradientButton
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuthSubmit}
            isLoading={isLoading}
            style={{ marginTop: 8 }}
          />
        </ClayCard>
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
  clayLogoBadge: {
    width: 80,
    height: 80,
    borderRadius: 32,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
  },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: 20,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  togglePillActive: {
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleText: {
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: 'rgba(229, 115, 115, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.35)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#E57373',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputSlot: {
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
