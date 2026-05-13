import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import AuthNavigator from './navigation/AuthNavigator';
import RoleNavigator from './navigation/RoleNavigator';
import { colors } from './theme/colors';

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

export default function AppRoot() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <Router />
          </NavigationContainer>
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
