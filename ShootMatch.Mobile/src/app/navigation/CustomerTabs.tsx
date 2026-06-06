import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { CustomerTabParamList, CustomerStackParamList } from './types';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

// Tab screens
import HomeScreen       from '../../features/customer/screens/HomeScreen';
import DiscoverScreen   from '../../features/customer/screens/DiscoverScreen';
import AllChatScreen    from '../../features/chat/screens/AllChatScreen';
import MyBookingsScreen from '../../features/customer/screens/MyBookingsScreen';
import ProfileScreen    from '../../features/customer/screens/ProfileScreen';

// Stack screens (pushed on top of tabs)
import PhotographerProfileScreen from '../../features/customer/screens/PhotographerProfileScreen';
import SearchScreen              from '../../features/customer/screens/SearchScreen';
import PhotographerPortfolioScreen from '../../features/customer/screens/PhotographerPortfolioScreen';
import PhotographerServicePackagesScreen from '../../features/customer/screens/PhotographerServicePackagesScreen';
import CheckoutScreen            from '../../features/customer/screens/CheckoutScreen';
import BookingSuccessScreen      from '../../features/customer/screens/BookingSuccessScreen';
import BookingDetailScreen       from '../../features/customer/screens/BookingDetailScreen';
import NotificationsScreen       from '../../features/customer/screens/NotificationsScreen';
import EditProfileScreen         from '../../features/customer/screens/EditProfileScreen';
import CustomerFavoritesScreen   from '../../features/customer/screens/CustomerFavoritesScreen';
import CustomerSharedMediaScreen from '../../features/customer/screens/CustomerSharedMediaScreen';
import ChatScreen                from '../../features/chat/screens/ChatScreen';
import CallScreen                from '../../features/chat/screens/CallScreen';

const Tab   = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const TAB_CONFIG: Record<keyof CustomerTabParamList, { label: string; icon: IconName; iconActive: IconName }> = {
  Home:     { label: 'Trang chủ', icon: 'home-outline',         iconActive: 'home' },
  Discover: { label: 'Khám phá',  icon: 'compass-outline',       iconActive: 'compass' },
  Chat:     { label: 'Tin nhắn',  icon: 'chatbubble-outline',    iconActive: 'chatbubble' },
  Bookings: { label: 'Lịch hẹn', icon: 'calendar-outline',      iconActive: 'calendar' },
  Profile:  { label: 'Hồ sơ',    icon: 'person-circle-outline', iconActive: 'person-circle' },
};

function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof CustomerTabParamList];
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
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
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Chat"     component={AllChatScreen} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root stack wraps tabs + full-screen routes
export default function CustomerTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerRoot"         component={CustomerTabNavigator} />
      <Stack.Screen name="Search"               component={SearchScreen} />
      <Stack.Screen name="PhotographerProfile"  component={PhotographerProfileScreen} />
      <Stack.Screen name="PhotographerPortfolio" component={PhotographerPortfolioScreen} />
      <Stack.Screen name="PhotographerServicePackages" component={PhotographerServicePackagesScreen} />
      <Stack.Screen name="Checkout"             component={CheckoutScreen} />
      <Stack.Screen name="BookingSuccess"       component={BookingSuccessScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="BookingDetail"        component={BookingDetailScreen} />
      <Stack.Screen name="Notifications"        component={NotificationsScreen} />
      <Stack.Screen name="EditProfile"          component={EditProfileScreen} />
      <Stack.Screen name="CustomerFavorites"    component={CustomerFavoritesScreen} />
      <Stack.Screen name="CustomerSharedMedia"  component={CustomerSharedMediaScreen} />
      <Stack.Screen name="Chat"                 component={ChatScreen} />
      <Stack.Screen name="Call"                 component={CallScreen} />
    </Stack.Navigator>

  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  label: { fontSize: fontSizes.xs, fontWeight: '600' },
});
