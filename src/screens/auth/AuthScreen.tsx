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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, login, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleAuthSubmit = async () => {
    clearError();
    setLocalError('');
    triggerHaptic('selection');

    setIsSubmitting(true);
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: palette.primary }]}>
            <MessageSquare size={36} color="#FFFFFF" strokeWidth={2.2} />
          </View>

          <Text style={[styles.appTitle, { color: palette.textPrimary }]}>MeshX</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </Text>
        </View>

        {/* Discord Form Card */}
        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {/* Segmented Toggle Track */}
          <View style={[styles.toggleTrack, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
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
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, { color: isLogin ? '#FFFFFF' : palette.textMuted }]}>
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
                  },
                ],
              ]}
            >
              <Text style={[styles.toggleText, { color: !isLogin ? '#FFFFFF' : palette.textMuted }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {(localError || error) ? (
            <View style={[styles.errorBanner, { borderColor: palette.error }]}>
              <Text style={[styles.errorText, { color: palette.error }]}>{localError || error}</Text>
            </View>
          ) : null}

          {/* Input Slots */}
          {!isLogin && (
            <>
              <ClayInput style={styles.inputSlot}>
                <User size={18} color={palette.textMuted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Display Name"
                  placeholderTextColor={palette.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={[styles.textInput, { color: palette.textPrimary }]}
                  autoCapitalize="words"
                />
              </ClayInput>

              <ClayInput style={styles.inputSlot}>
                <Phone size={18} color={palette.textMuted} style={styles.inputIcon} />
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
            <Mail size={18} color={palette.textMuted} style={styles.inputIcon} />
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
            <Lock size={18} color={palette.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password (min 8 characters)"
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
              <Text style={[styles.forgotText, { color: palette.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <BoldButton
            title={isLogin ? 'Log In' : 'Continue'}
            onPress={handleAuthSubmit}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    marginBottom: 16,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  togglePillActive: {},
  toggleText: {
    fontWeight: '600',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: 'rgba(242, 63, 66, 0.15)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputSlot: {
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
