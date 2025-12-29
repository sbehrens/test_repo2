# Activity Reminder App - Deployment Guide

This guide explains how to build and deploy the Activity Reminder App using Expo Application Services (EAS) Build.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- An Expo account (free tier is sufficient for development)
- Git installed and configured

## Table of Contents

1. [Installing EAS CLI](#installing-eas-cli)
2. [Setting Up Your Expo Account](#setting-up-your-expo-account)
3. [Building for Development](#building-for-development)
4. [Building for Preview/Testing](#building-for-previewtesting)
5. [Building for Production](#building-for-production)
6. [Getting Install Links](#getting-install-links)
7. [Troubleshooting](#troubleshooting)

---

## Installing EAS CLI

Install the EAS CLI globally using npm:

```bash
npm install -g eas-cli
```

Verify the installation:

```bash
eas --version
```

You should see a version number (3.0.0 or higher).

---

## Setting Up Your Expo Account

### 1. Create an Expo Account

If you don't have an Expo account, create one at [expo.dev](https://expo.dev).

### 2. Login to Expo

Run the following command and follow the prompts:

```bash
eas login
```

Enter your Expo username and password when prompted.

### 3. Configure Your Project

If this is your first time using EAS with this project, run:

```bash
eas build:configure
```

This will ensure your project is properly set up with EAS.

---

## Building for Development

Development builds are for testing on physical devices or simulators during development.

### iOS Development Build

For iOS Simulator:
```bash
eas build --profile development --platform ios
```

The build will be available for download once complete. You can install it on your simulator.

### Android Development Build

For Android devices:
```bash
eas build --profile development --platform android
```

This creates an APK file that can be installed directly on Android devices.

### Installing Development Builds

After the build completes:
1. EAS will provide a download link
2. For iOS: Download and drag to your simulator
3. For Android: Download the APK and install on your device (you may need to enable "Install from Unknown Sources")

---

## Building for Preview/Testing

Preview builds are for sharing with testers who don't have the development environment set up.

### iOS Preview Build

```bash
eas build --profile preview --platform ios
```

### Android Preview Build

```bash
eas build --profile preview --platform android
```

### Build Both Platforms

```bash
eas build --profile preview --platform all
```

---

## Building for Production

Production builds are optimized for App Store and Google Play Store submission.

### iOS Production Build

```bash
eas build --profile production --platform ios
```

**Note:** For iOS production builds, you'll need:
- An Apple Developer account ($99/year)
- Proper certificates and provisioning profiles (EAS can manage these for you)

### Android Production Build

```bash
eas build --profile production --platform android
```

This creates an AAB (Android App Bundle) file for Google Play Store submission.

### Build Both Platforms for Production

```bash
eas build --profile production --platform all
```

---

## Getting Install Links

### After Build Completion

1. Once your build completes, EAS will display a link in the terminal
2. You can also view all your builds at: `https://expo.dev/accounts/[your-username]/projects/activity-reminder-app/builds`

### Sharing Builds with Testers

For development and preview builds:

1. Go to your [Expo dashboard](https://expo.dev)
2. Navigate to your project
3. Click on "Builds"
4. Click on the specific build you want to share
5. Copy the install link from the build details page
6. Share this link with your testers

**Installation Methods:**

- **iOS:** Testers can scan the QR code or open the link on their iOS device
- **Android:** Testers can download the APK directly from the link

### Using EAS CLI to Get Build Status

Check your build status:
```bash
eas build:list
```

Get details about a specific build:
```bash
eas build:view [build-id]
```

---

## Build Profiles Explained

The `eas.json` file defines three build profiles:

### Development Profile
- **Purpose:** Testing on physical devices during development
- **iOS:** Builds for simulator
- **Android:** Creates APK for easy installation
- **Distribution:** Internal only

### Preview Profile
- **Purpose:** Sharing with testers and stakeholders
- **iOS:** Builds for physical devices
- **Android:** Creates APK for direct installation
- **Distribution:** Internal only

### Production Profile
- **Purpose:** App Store and Play Store submission
- **iOS:** Optimized for App Store submission
- **Android:** Creates AAB (App Bundle) for Play Store
- **Distribution:** Public store release

---

## Troubleshooting

### Build Fails with "Invalid Credentials"

**Solution:** Re-login to Expo
```bash
eas logout
eas login
```

### iOS Build Requires Apple Developer Account

For production iOS builds, you need an Apple Developer account. EAS will guide you through the setup process.

### Android Build Fails

**Common Issues:**
1. Check that your `app.json` has the correct `package` name
2. Ensure your package name is unique (use reverse domain notation)
3. Check build logs in the Expo dashboard for specific errors

### Build Takes Too Long

- Builds typically take 10-30 minutes depending on the platform and queue
- You can close your terminal; builds run on EAS servers
- Check build status at: `https://expo.dev/accounts/[your-username]/projects/activity-reminder-app/builds`

### Cannot Install APK on Android

**Solution:** Enable "Install from Unknown Sources" on your Android device:
1. Go to Settings > Security
2. Enable "Unknown Sources" or "Install Unknown Apps"
3. Try installing the APK again

### Getting Help

- **EAS Documentation:** [https://docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/)
- **Expo Forums:** [https://forums.expo.dev/](https://forums.expo.dev/)
- **Discord:** [https://chat.expo.dev/](https://chat.expo.dev/)

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Development builds
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview builds
eas build --profile preview --platform all

# Production builds
eas build --profile production --platform all

# List all builds
eas build:list

# View specific build
eas build:view [build-id]
```

---

## Additional Resources

- **Project Configuration:** See `eas.json` for build profiles
- **App Configuration:** See `app.json` for app settings
- **Bundle Identifiers:**
  - iOS: `com.activityreminder.app`
  - Android: `com.activityreminder.app`

---

## Next Steps

After successfully building your app:

1. **Development:** Test on physical devices to ensure all features work
2. **Preview:** Share with testers for feedback
3. **Production:** Submit to App Store and Play Store
4. **Updates:** Use EAS Update for over-the-air updates without rebuilding

For more information about EAS Update, visit: [https://docs.expo.dev/eas-update/introduction/](https://docs.expo.dev/eas-update/introduction/)
