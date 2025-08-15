# TAJ Electronics Mobile CRM

A React Native mobile application for TAJ Electronics CRM system with push notifications and offline capabilities.

## Features

- 📱 Native mobile experience
- 🔔 Push notifications for alerts
- 📊 Real-time dashboard
- 📋 Receipt management
- 🔧 Service request tracking
- 📞 Direct calling and WhatsApp integration
- 🔍 QR code scanning for quick tracking
- 📍 Location services for service engineers

## Setup Instructions

### Prerequisites

1. Install Node.js (v18 or later)
2. Install Expo CLI: `npm install -g @expo/cli`
3. Install EAS CLI: `npm install -g eas-cli`

### Development Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code with Expo Go app (Android) or Camera app (iOS)

### Building APK

1. Login to Expo:
   ```bash
   eas login
   ```

2. Configure the project:
   ```bash
   eas build:configure
   ```

3. Build APK for Android:
   ```bash
   eas build --platform android --profile preview
   ```

4. Download the APK from the Expo dashboard

### Production Build

For production release:
```bash
eas build --platform android --profile production
```

## Configuration

### API Endpoint

Update the API URL in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-server-domain.com"
    }
  }
}
```

### Push Notifications

1. Configure Firebase for Android push notifications
2. Add your Firebase configuration to `app.json`
3. Update the notification service with your server endpoints

## App Structure

```
mobile/
├── src/
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── services/         # API and notification services
│   ├── theme/           # App theme and styling
│   └── utils/           # Utility functions
├── assets/              # Images and icons
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

## Key Features

### Dashboard
- Real-time stats display
- Quick action buttons
- Recent activity feed
- Role-based navigation

### Receipt Management
- Create new receipts
- View all receipts
- Search and filter
- Direct customer communication

### Service Tracking
- Track repair status
- Progress visualization
- Customer information display
- Real-time updates

### Notifications
- Push notifications for status updates
- In-app notification center
- Alert badges for urgent items
- Sound and vibration alerts

## Deployment

### Internal Testing
```bash
eas build --platform android --profile preview
```

### Play Store Release
```bash
eas build --platform android --profile production
eas submit --platform android
```

## Support

For technical support:
- Email: support@tajelectronics.com
- Phone: +91 98765 43210

## License

© 2025 TAJ Electronics. All rights reserved.