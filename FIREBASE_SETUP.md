# Firebase Integration Guide

## Overview
This project now includes a complete Firebase integration with authentication, Firestore database, and storage capabilities.

## File Structure

```
src/
├── firebase/
│   ├── config.js          # Firebase configuration
│   ├── auth.js            # Authentication functions
│   ├── firestore.js       # Firestore database functions
│   ├── storage.js         # Firebase Storage functions
│   └── index.js           # Export all Firebase functions
├── contexts/
│   ├── AuthContext.jsx    # Auth provider component
│   └── AuthContextDefinition.js # Auth context definition
├── hooks/
│   └── useAuth.js         # Authentication hook
└── Components/
    └── FirebaseExample/   # Example component demonstrating Firebase usage
```

## Setup Instructions

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Email/Password
4. Create a Firestore database in test mode
5. Get your Firebase configuration

### 2. Environment Variables
Update your `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyB9mTf-oA9LeJ_6b-Pv0eofKceAgep9z-I
VITE_FIREBASE_AUTH_DOMAIN=publicpulse-2025.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=publicpulse-2025
VITE_FIREBASE_STORAGE_BUCKET=publicpulse-2025.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=739844766362
VITE_FIREBASE_APP_ID=1:739844766362:web:3c766417451d430e30fd23

```

## Usage Examples

### Authentication
```javascript
import { signUpUser, signInUser, signOutUser } from '../firebase/auth';
import { useAuth } from '../Hooks/useAuth';

// In your component
const { user } = useAuth();

// Sign up
await signUpUser('email@example.com', 'password', 'Display Name');

// Sign in
await signInUser('email@example.com', 'password');

// Sign out
await signOutUser();
```

### Firestore Database
```javascript
import { createDocument, getDocuments, updateDocument } from '../firebase/firestore';

// Create document
const docId = await createDocument('collection-name', {
  title: 'Document Title',
  content: 'Document content'
});

// Get documents
const documents = await getDocuments('collection-name');

// Update document
await updateDocument('collection-name', docId, { title: 'New Title' });
```

### File Storage
```javascript
import { uploadFile, getFileURL } from '../firebase/storage';

// Upload file
const downloadURL = await uploadFile(file, 'path/to/file');

// Get file URL
const url = await getFileURL('path/to/file');
```

## Testing
Visit `/firebase-example` in your app to test the Firebase integration with a working example component.

## Security Notes
- Never commit your `.env` file to version control
- Use Firebase Security Rules to protect your data
- Consider enabling App Check for production apps
