import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotographerTabParamList, PhotographerStackParamList } from './types';
import { fontSizes } from '../theme/typography';
import { PhotographerThemeProvider, usePhotographerTheme } from '../../features/photographer/PhotographerThemeContext';

// Tab screens
import DashboardScreen       from '../../features/photographer/screens/DashboardScreen';
import PBookingsScreen       from '../../features/photographer/screens/PBookingsScreen';
import PAllChatScreen        from '../../features/photographer/screens/PAllChatScreen';
import UploadPortfolioScreen from '../../features/photographer/screens/UploadPortfolioScreen';
import PProfileScreen        from '../../features/photographer/screens/PProfileScreen';

// Stack screens
import PChatScreen from '../../features/photographer/screens/PChatScreen';
import ServiceManagementScreen from '../../features/photographer/screens/ServiceManagementScreen';
import PBookingCalendarScreen from '../../features/photographer/screens/PBookingCalendarScreen';
import PersonalInfoScreen from '../../features/photographer/screens/PersonalInfoScreen';
import ManageEquipmentScreen from '../../features/photographer/screens/ManageEquipmentScreen';
import CallScreen from '../../features/chat/screens/CallScreen';
import CustomerProfileViewScreen from '../../features/photographer/screens/CustomerProfileViewScreen';
import BookingDetailScreen from '../../features/customer/screens/BookingDetailScreen';
import PNotificationsScreen from '../../features/photographer/screens/PNotificationsScreen';
import PhotographerPortfolioScreen from '../../features/customer/screens/PhotographerPortfolioScreen';
import PhotographerSubscriptionScreen from '../../features/photographer/screens/PhotographerSubscriptionScreen';


const Tab   = createBottomTabNavigator<PhotographerTabParamList>();
const Stack = createNativeStackNavigator<PhotographerStackParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const CFG: Record<keyof PhotographerTabParamList, { label: string; icon: IconName; iconActive: IconName }> = {
  Dashboard: { label: 'Dashboard', icon: 'grid-outline',       iconActive: 'grid' },
  PBookings: { label: 'Lịch hẹn',  icon: 'calendar-outline',   iconActive: 'calendar' },
  PChat:     { label: 'Tin nhắn',  icon: 'chatbubble-outline',  iconActive: 'chatbubble' },
  Portfolio: { label: 'Portfolio', icon: 'images-outline',      iconActive: 'images' },
  PProfile:  { label: 'Hồ sơ',    icon: 'person-outline',      iconActive: 'person' },
};

function PhotographerTabNavigator() {
  const { colors } = usePhotographerTheme();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const tabBarHeight = Platform.OS === 'ios' ? 88 : (isWeb ? 60 : 60 + insets.bottom);
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 24 : (isWeb ? 4 : (insets.bottom > 0 ? insets.bottom : 8));

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = CFG[route.name as keyof PhotographerTabParamList];
        return {
          headerShown: false,
          tabBarStyle: [styles.tabBar, { backgroundColor: colors.tabBar, borderTopWidth: isWeb ? 0 : 1, borderTopColor: colors.border, height: tabBarHeight, paddingBottom: tabBarPaddingBottom, paddingTop: isWeb ? 4 : 8 }],
          tabBarActiveTintColor:   colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.label,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? cfg.iconActive : cfg.icon} size={size} color={color} />
          ),
          tabBarLabel: cfg.label,
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="PBookings" component={PBookingsScreen} />
      <Tab.Screen name="PChat"     component={PAllChatScreen} />
      <Tab.Screen name="Portfolio" component={UploadPortfolioScreen} />
      <Tab.Screen name="PProfile"  component={PProfileScreen} />
    </Tab.Navigator>
  );
}

function PhotographerStackNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhotographerRoot" component={PhotographerTabNavigator} />
      <Stack.Screen name="Chat" component={PChatScreen} />
      <Stack.Screen name="ServiceManagement" component={ServiceManagementScreen} />
      <Stack.Screen name="BookingCalendar" component={PBookingCalendarScreen} />
      <Stack.Screen name="ManageEquipment" component={ManageEquipmentScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Call" component={CallScreen} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfileViewScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="Notifications" component={PNotificationsScreen} />
      <Stack.Screen name="PhotographerPortfolio" component={PhotographerPortfolioScreen} />
      <Stack.Screen name="PhotographerSubscription" component={PhotographerSubscriptionScreen} />
    </Stack.Navigator>
  );
}

// Root stack wraps tabs + push screens with PhotographerThemeProvider
export default function PhotographerTabs() {
  return (
    <PhotographerThemeProvider>
      <PhotographerStackNavigation />
    </PhotographerThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  label: { fontSize: fontSizes.xs, fontWeight: '600' },
});
