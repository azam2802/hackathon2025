import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";

// Superadmin credentials
const SUPERADMIN_EMAIL = "superadmin@gov.kg";
const SUPERADMIN_PASSWORD = "SuperAdmin123!";

export const createSuperAdmin = async () => {
  try {
    console.log("Creating superadmin account...");
    
    // Create the Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      SUPERADMIN_EMAIL, 
      SUPERADMIN_PASSWORD
    );

    // Update the display name
    await updateProfile(userCredential.user, {
      displayName: "Super Administrator"
    });

    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      email: SUPERADMIN_EMAIL,
      displayName: "Super Administrator",
      uid: userCredential.user.uid,
      role: 'superadmin',
      isApproved: true,
      createdAt: new Date()
    });

    console.log("Superadmin account created successfully!");
    console.log("Email:", SUPERADMIN_EMAIL);
    console.log("Password:", SUPERADMIN_PASSWORD);
    
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Superadmin account already exists.");
    } else {
      console.error("Error creating superadmin:", error.message);
    }
    throw error;
  }
};
