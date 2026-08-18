import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
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

const CustomClayTabBar: React.FC<CustomTabBarProps> = ({
  state,
  navigation,
  totalUnread,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const horizontalPadding = 16;
  const dockWidth = SCREEN_WIDTH - horizontalPadding * 2;
  const tabWidth = dockWidth / 3;

  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 16,
      stiffness: 200,
      mass: 0.8,
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

  return (
    <View style={[styles.bottomContainer, { backgroundColor: palette.background }]}>
      {/* Raised Clay Pill Dock */}
      <View
        style={[
          styles.clayDock,
          {
            backgroundColor: palette.surfaceElevated,
            borderTopColor: palette.clayHighlight,
            borderLeftColor: palette.clayHighlight,
            borderBottomColor: 'rgba(0, 0, 0, 0.40)',
            borderRightColor: 'rgba(0, 0, 0, 0.25)',
          },
        ]}
      >
        {/* Recessed Inset Pressed Slot for Active Tab */}
        <Animated.View style={[styles.recessedSlotWrapper, { width: tabWidth }, indicatorAnimatedStyle]}>
          <View
            style={[
              styles.recessedSlot,
              {
                backgroundColor: palette.inputBackground,
                borderTopColor: palette.clayInsetDark,
                borderLeftColor: palette.clayInsetDark,
                borderBottomColor: palette.clayInsetLight,
                borderRightColor: palette.clayInsetLight,
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
                      color={isFocused ? palette.primary : palette.textMuted}
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
                        color: isFocused ? palette.primary : palette.textMuted,
                        fontWeight: isFocused ? '800' : '600',
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
      tabBar={(props) => <CustomClayTabBar {...props} totalUnread={totalUnread} />}
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
  clayDock: {
    height: 66,
    borderRadius: 33,
    borderWidth: 1.8,
    position: 'relative',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  recessedSlotWrapper: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  recessedSlot: {
    width: '82%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
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
    fontSize: 11,
    letterSpacing: 0.2,
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
    fontSize: 9,
    fontWeight: '800',
  },
});
