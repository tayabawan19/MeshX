import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MessageSquare, Phone, Settings } from 'lucide-react-native';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { CallsScreen } from '../screens/main/CallsScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useThemeStore } from '../store/useThemeStore';
import { useChatStore } from '../store/useChatStore';
import { triggerHaptic } from '../utils/haptics';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  totalUnread: number;
}

const CustomDiscordTabBar: React.FC<CustomTabBarProps> = ({
  state,
  navigation,
  totalUnread,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / 3;

  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withTiming(state.index * tabWidth, {
      duration: 180,
    });
  }, [state.index, tabWidth]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const tabs = [
    { name: 'Chats', icon: MessageSquare },
    { name: 'Calls', icon: Phone },
    { name: 'Settings', icon: Settings },
  ];

  const bottomInsetPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8) + 4;

  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
          paddingBottom: bottomInsetPadding,
        },
      ]}
    >
      {/* Animated Active Tab Pill */}
      <Animated.View style={[styles.activePillWrapper, { width: tabWidth }, indicatorAnimatedStyle]}>
        <View
          style={[
            styles.activePill,
            {
              backgroundColor: palette.surfaceElevated,
            },
          ]}
        />
      </Animated.View>

      {/* Tab Items */}
      <View style={styles.tabsRow}>
        {tabs.map((t, idx) => {
          const isFocused = state.index === idx;
          const IconComponent = t.icon;

          const onPress = () => {
            triggerHaptic('selection');
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[idx].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[idx].name);
            }
          };

          return (
            <TouchableWithoutFeedback key={t.name} onPress={onPress}>
              <View style={styles.tabButton}>
                <View style={styles.iconHolder}>
                  <IconComponent
                    size={20}
                    color={isFocused ? palette.primary : palette.textMuted}
                    strokeWidth={isFocused ? 2.4 : 2}
                  />
                  {idx === 0 && totalUnread > 0 && (
                    <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                      <Text style={styles.badgeText}>
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? palette.textPrimary : palette.textMuted,
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                >
                  {t.name}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    </View>
  );
};

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
  const chats = useChatStore((state) => state.chats);
  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomDiscordTabBar {...props} totalUnread={totalUnread} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Chats">
        {() => (
          <ChatsListScreen
            navigation={navigation}
            onSelectChat={onSelectChat}
            onOpenNewGroup={onOpenNewGroup}
            onOpenStatusViewer={onOpenStatusViewer}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Calls" component={CallsScreen} />

      <Tab.Screen name="Settings">
        {() => (
          <SettingsScreen
            onOpenProfileSetup={onOpenProfileSetup || (() => navigation?.navigate('ProfileSetup'))}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    borderTopWidth: 1,
    paddingTop: 6,
    position: 'relative',
  },
  activePillWrapper: {
    position: 'absolute',
    top: 4,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activePill: {
    width: '65%',
    height: 38,
    borderRadius: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 44,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconHolder: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0,
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
    zIndex: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
