import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageSquare, Phone, Settings } from 'lucide-react-native';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { CallsScreen } from '../screens/main/CallsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useChatStore } from '../store/useChatStore';
import { triggerHaptic } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const { chats } = useChatStore();
  const insets = useSafeAreaInsets();

  const totalUnreadCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#EEEEEE',
            height: 60 + Math.max(insets.bottom, 6),
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ],
        tabBarActiveTintColor: '#8E0E2C', // Crimson active
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatsListScreen}
        options={{
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#8E0E2C',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
            lineHeight: 14,
            height: 16,
            minWidth: 16,
          },
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.activePill]}>
              <MessageSquare size={22} color={focused ? '#8E0E2C' : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic('selection'),
        }}
      />

      <Tab.Screen
        name="CallsTab"
        component={CallsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.activePill]}>
              <Phone size={22} color={focused ? '#8E0E2C' : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic('selection'),
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, focused && styles.activePill]}>
              <Settings size={22} color={focused ? '#8E0E2C' : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic('selection'),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activePill: {
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
  },
});
