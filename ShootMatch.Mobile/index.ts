import { registerRootComponent } from 'expo';
import { Alert, Platform } from 'react-native';

// ── Global Alert Polyfill for React Native Web ──────────────────────────────
if (Platform.OS === 'web') {
  // Inject CSS fix for mobile web bottom bar overlapping & premium centered layout on desktop
  const style = document.createElement('style');
  style.textContent = `
    * { -webkit-tap-highlight-color: transparent; outline: none; }
    html, body {
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
      overscroll-behavior-y: none;
      background-color: #f3ede2; /* Warm premium background */
    }
    #root {
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
      max-width: 800px;
      margin: 0 auto;
      background-color: #faf5ee;
      box-shadow: 0 0 30px rgba(26, 26, 15, 0.08);
      border-left: 1px solid rgba(26, 26, 15, 0.05);
      border-right: 1px solid rgba(26, 26, 15, 0.05);
    }
  `;
  document.head.appendChild(style);

  Alert.alert = (title: string, message?: string, buttons?: any[]) => {
    const formattedMsg = message ? `${title}\n\n${message}` : title;
    if (!buttons || buttons.length === 0) {
      alert(formattedMsg);
    } else {
      const cancelBtn = buttons.find(b => b.style === 'cancel');
      const positiveBtn = buttons.find(b => b.style !== 'cancel') || buttons[0];
      
      if (buttons.length === 1) {
        alert(formattedMsg);
        if (buttons[0].onPress) {
          buttons[0].onPress();
        }
        return;
      }

      const confirmed = window.confirm(formattedMsg);
      if (confirmed) {
        if (positiveBtn && positiveBtn.onPress) {
          positiveBtn.onPress();
        }
      } else {
        if (cancelBtn && cancelBtn.onPress) {
          cancelBtn.onPress();
        }
      }
    }
  };
}

// ── Global atob Polyfill for React Native ────────────────────────────────────
if (!global.atob) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  global.atob = (input: string): string => {
    const str = input.replace(/=+$/, '');
    let output = '';
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      const idx = chars.indexOf(char);
      if (idx === -1) continue;
      buffer = (buffer << 6) | idx;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    return output;
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
