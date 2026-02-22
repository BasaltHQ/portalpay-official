import { CapacitorConfig } from '@capacitor/cli';

// The Capacitor config. 
// Note: In production, `server.url` is dynamically set in MainActivity.kt
// using BuildConfig.BASE_DOMAIN to support partner white-labeling.
// This config serves as the default development configuration.
const config: CapacitorConfig = {
    appId: 'com.example.basaltsurgemobile',
    appName: process.env.APP_NAME || 'BasaltSurge',
    webDir: 'public', // Using public as a placeholder webDir since we load a live URL
    bundledWebRuntime: false,
    server: {
        url: process.env.BASE_DOMAIN || 'https://surge.basalthq.com',
        cleartext: true
    }
};

export default config;
