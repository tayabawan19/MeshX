import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text } from 'react-native';
import { MessageSquare, Phone, Settings } from 'lucide-react-native';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { CallsScreen } from '../screens/main/CallsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useThemeStore } from '../store/useThemeStore';
import { useChatStore } from '../store/useChatStore';
import { triggerHaptic } from '../utils/haptics';

const Tab = createBottomTabNavigator();

interface MainTabNavigatorProps {
  onSelectChat?: (chatId: string) => void;
  onOpenNewGroup?: () => void;
  onOpenStatusViewer?: (statusId: string) => void;
  onOpenProfileSetup?: () => void;
  navigation?: any;
  route?: any;
}

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({
  onSelectChat,
  onOpenNewGroup,
  onOpenStatusViewer,
  onOpenProfileSetup,
  navigation,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const chats = useChatStore((state) => state.chats);

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: palette.surfaceElevated, borderTopColor: palette.border }],
        tabBarActiveTintColor: palette.primaryLight,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="Chats"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <MessageSquare size={size} color={color} />
              {totalUnread > 0 && (
                <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                  <Text style={styles.badgeText}>{totalUnread}</Text>
                </View>
              )}
            </View>
          ),
        }}
      >
        {() => (
          <ChatsListScreen
            navigation={navigation}
            onSelectChat={onSelectChat}
            onOpenNewGroup={onOpenNewGroup}
            onOpenStatusViewer={onOpenStatusViewer}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Phone size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => triggerHaptic('selection'),
        }}
      />

      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => triggerHaptic('selection'),
        }}
      >
        {() => <SettingsScreen onOpenProfileSetup={onOpenProfileSetup || (() => navigation?.navigate('ProfileSetup'))} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
