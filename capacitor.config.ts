import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vantix.app',
  appName: 'Vantix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    FirebaseAuthentication: {
      // false => הפלאגין מבצע גם את ההתחברות מול Firebase Auth המקומי (לא רק Google)
      skipNativeAuth: false,
      providers: ['google.com'],
      authDomain: 'maxdeliveries.firebaseapp.com',
    },
  },
}

export default config
