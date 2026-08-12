import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ChatScreen } from '../screens/main/ChatScreen';
import { NewChatScreen } from '../screens/main/NewChatScreen';
import { NewGroupModal } from '../screens/modals/NewGroupModal';
import { CallModal } from '../screens/modals/CallModal';
import { MediaViewerModal } from '../screens/modals/MediaViewerModal';
import { UserProfileModal } from '../screens/modals/UserProfileModal';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  const { setupSocketListeners } = useChatStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setupSocketListeners();
    }
  }, [isAuthenticated]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="NewChat" component={NewChatScreen} />

            {/* Modals */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="NewGroupModal" component={NewGroupModal} />
              <Stack.Screen name="CallModal" component={CallModal} />
              <Stack.Screen name="MediaViewerModal" component={MediaViewerModal} />
              <Stack.Screen name="UserProfileModal" component={UserProfileModal} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
