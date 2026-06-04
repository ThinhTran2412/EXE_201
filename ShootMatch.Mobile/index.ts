import { registerRootComponent } from 'expo';

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
