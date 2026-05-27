import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { NotificationProvider } from '../shared/notifications/NotificationContext';
import AuthNavigator from './navigation/AuthNavigator';
import RoleNavigator from './navigation/RoleNavigator';
import { colors } from './theme/colors';
import * as ChatHub from '../features/chat/ChatHub';

export const navigationRef = React.createRef<any>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card:        colors.surface,
    text:        colors.text,
    border:      colors.border,
    primary:     colors.accent,
    notification: colors.accent,
  },
};


function Router() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>S</Text>
        </View>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!session) return <AuthNavigator />;
  return <RoleNavigator role={session.role} />;
}

function CallListener() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.accessToken) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        await ChatHub.connect();
        if (cancelled) return;
        cleanup = ChatHub.onReceiveCallEvent((evt) => {
          if (evt.event === 'ring' && evt.initiatorId !== session.userId) {
            navigationRef.current?.navigate('Call', {
              conversationId: evt.conversationId,
              callSessionId: evt.id,
              callType: evt.callType as 'audio' | 'video',
              role: 'callee',
              name: evt.initiatorRole === 'customer' ? 'Khách hàng' : 'Nhiếp ảnh gia',
            });
          }
        });
      } catch (err) {
        console.warn('Failed to start global chat hub connection:', err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
      // Giữ hub nền — tránh disconnect/reconnect gây timeout log liên tục
    };
  }, [session?.accessToken, session?.userId]);

  return null;
}

export default function AppRoot() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer ref={navigationRef} theme={navTheme}>
              <Router />
              <CallListener />
            </NavigationContainer>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.clay,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 10,
  },
  logoLetter: { fontSize: 44, fontWeight: '700', color: colors.background },
});
