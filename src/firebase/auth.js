import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "./config";
import { createUserProfile, getUserProfile } from "./firestore";

// Hardcoded superadmin credentials
const SUPERADMIN_EMAIL = "superadmin@gov.kg";
const SUPERADMIN_PASSWORD = "SuperAdmin123!";

// Sign up with email and password
export const signUpUser = async (email, password, displayName = null) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name if provided
  if (displayName) {
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
  }

  // Create user profile in Firestore (pending approval)
  await createUserProfile(userCredential.user.uid, {
    email: userCredential.user.email,
    displayName: displayName || '',
    uid: userCredential.user.uid
  });

  return userCredential.user;
};

// Sign in with email and password
export const signInUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Check if user is superadmin
  if (email === SUPERADMIN_EMAIL) {
    return userCredential.user;
  }
  
  // Check if regular user is approved
  const userProfile = await getUserProfile(userCredential.user.uid);
  if (!userProfile || !userProfile.isApproved) {
    await signOut(auth);
    throw new Error('Your account is pending approval from the administrator.');
  }
  
  return userCredential.user;
};

// Sign out
export const signOutUser = async () => {
  await signOut(auth);
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user is superadmin
export const isSuperAdmin = (email) => {
  return email === SUPERADMIN_EMAIL;
};

// Get current user with profile data
export const getCurrentUserProfile = async (user) => {
  if (!user) return null;
  
  if (isSuperAdmin(user.email)) {
    return {
      ...user,
      role: 'superadmin',
      isApproved: true
    };
  }
  
  const userProfile = await getUserProfile(user.uid);
  return userProfile ? { ...user, ...userProfile } : null;
};
