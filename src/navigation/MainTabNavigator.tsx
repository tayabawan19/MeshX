import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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

const CustomBoldTabBar: React.FC<CustomTabBarProps> = ({
  state,
  navigation,
  totalUnread,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const insets = useSafeAreaInsets();
  const horizontalPadding = 16;
  const dockWidth = SCREEN_WIDTH - horizontalPadding * 2;
  const tabWidth = dockWidth / 3;

  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 14,
      stiffness: 240,
      mass: 0.7,
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

  const bottomInsetPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12) + 8;

  return (
    <View style={[styles.bottomContainer, { backgroundColor: palette.background, paddingBottom: bottomInsetPadding }]}>
      {/* Outer Dock Container with Hard Shadow */}
      <View style={styles.dockShadowWrapper}>
        <View style={styles.hardShadow} />

        <View
          style={[
            styles.boldDock,
            {
              backgroundColor: palette.surface,
              borderColor: '#000000',
            },
          ]}
        >
          {/* Animated Active Tab Pill */}
          <Animated.View style={[styles.activePillWrapper, { width: tabWidth }, indicatorAnimatedStyle]}>
            <View style={styles.activePillShadow} />
            <View
              style={[
                styles.activePill,
                {
                  backgroundColor: palette.secondary, // Electric Lime #C6FF3D
                  borderColor: '#000000',
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
                        size={22}
                        color={isFocused ? '#100F17' : palette.textMuted}
                        strokeWidth={isFocused ? 2.5 : 2}
                      />
                      {idx === 0 && totalUnread > 0 && (
                        <View style={[styles.badge, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
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
                          color: isFocused ? '#100F17' : palette.textMuted,
                          fontWeight: isFocused ? '900' : '700',
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
      tabBar={(props) => <CustomBoldTabBar {...props} totalUnread={totalUnread} />}
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
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  dockShadowWrapper: {
    position: 'relative',
  },
  hardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  boldDock: {
    height: 66,
    borderRadius: 24,
    borderWidth: 2,
    position: 'relative',
    justifyContent: 'center',
    zIndex: 1,
  },
  activePillWrapper: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activePillShadow: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 8,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: '#000000',
  },
  activePill: {
    width: '84%',
    height: 50,
    borderRadius: 18,
    borderWidth: 2,
    zIndex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconHolder: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
