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
  const { theme } = useThemeStore();

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={['#0F0F14', '#161622', '#0F0F14']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.logoBadge}>
          <MessageSquare size={36} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.appTitle}>MESHX</Text>

        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to start chatting.'}
        </Text>
      </View>

      <View style={styles.formCard}>
        {/* Toggle Switch */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => {
              clearError();
              triggerHaptic('selection');
              setIsLogin(true);
            }}
            style={[styles.toggleTab, isLogin && styles.toggleTabActive]}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              clearError();
              triggerHaptic('selection');
              setIsLogin(false);
            }}
            style={[styles.toggleTab, !isLogin && styles.toggleTabActive]}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Signup Fields */}
        {!isLogin && (
          <>
            <View style={styles.inputContainer}>
              <User size={20} color="#A0A0B0" style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#6B6B80"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#A0A0B0" style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number (+1 555 019 2834)"
                placeholderTextColor="#6B6B80"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </>
        )}

        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Mail size={20} color="#A0A0B0" style={styles.inputIcon} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#6B6B80"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <Lock size={20} color="#A0A0B0" style={styles.inputIcon} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6B6B80"
            secureTextEntry
            style={styles.input}
          />
        </View>

        {isLogin && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotBtnText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {(error || localError) ? <Text style={styles.errorText}>{error || localError}</Text> : null}

        <GradientButton
          title={isLogin ? 'Sign In' : 'Sign Up & Verify Email'}
          onPress={handleAuthSubmit}
          isLoading={isLoading}
          style={{ marginTop: 12 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0B0',
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleTabActive: {
    backgroundColor: '#7C3AED',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0B0',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotBtnText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
});
