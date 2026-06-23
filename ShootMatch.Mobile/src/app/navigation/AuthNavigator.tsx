import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

import SplashScreen      from '../../features/auth/screens/SplashScreen';
import RoleSelectScreen  from '../../features/auth/screens/RoleSelectScreen';
import AuthMethodScreen  from '../../features/auth/screens/AuthMethodScreen';
import LoginScreen       from '../../features/auth/screens/LoginScreen';
import OtpVerifyScreen   from '../../features/auth/screens/OtpVerifyScreen';
import RegisterScreen    from '../../features/auth/screens/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"      component={SplashScreen} />
      <Stack.Screen name="RoleSelect"  component={RoleSelectScreen} />
      <Stack.Screen name="AuthMethod"  component={AuthMethodScreen} />
      <Stack.Screen name="Login"       component={LoginScreen} />
      <Stack.Screen name="OtpVerify"   component={OtpVerifyScreen} />
      <Stack.Screen name="Register"    component={RegisterScreen} />
    </Stack.Navigator>
  );
}
