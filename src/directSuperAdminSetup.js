import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";

// Direct superadmin setup function
export const setupSuperAdmin = async () => {
  const SUPERADMIN_EMAIL = "superadmin@gov.kg";
  const SUPERADMIN_PASSWORD = "SuperAdmin123!";
  
  try {
    console.log("Step 1: Creating Firebase Auth user...");
    
    // Create the Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      SUPERADMIN_EMAIL, 
      SUPERADMIN_PASSWORD
    );
    
    console.log("Step 2: User created with UID:", userCredential.user.uid);

    // Update the display name
    await updateProfile(userCredential.user, {
      displayName: "Super Administrator"
    });
    
    console.log("Step 3: Display name updated");

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
    
    console.log("Step 4: Firestore document created");
    
    console.log("✅ Superadmin setup complete!");
    console.log("Email:", SUPERADMIN_EMAIL);
    console.log("Password:", SUPERADMIN_PASSWORD);
    
    return {
      success: true,
      message: "Superadmin created successfully!",
      credentials: {
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD
      }
    };
    
  } catch (error) {
    console.error("❌ Error in setupSuperAdmin:", error);
    
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: true,
        message: "Superadmin already exists!",
        credentials: {
          email: SUPERADMIN_EMAIL,
          password: SUPERADMIN_PASSWORD
        }
      };
    }
    
    return {
      success: false,
      message: error.message,
      error: error.code
    };
  }
};

// Test superadmin login
export const testSuperAdminLogin = async () => {
  const SUPERADMIN_EMAIL = "superadmin@gov.kg";
  const SUPERADMIN_PASSWORD = "SuperAdmin123!";
  
  try {
    console.log("Testing superadmin login...");
    const userCredential = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Superadmin login successful!");
    console.log("User:", userCredential.user);
    return {
      success: true,
      message: "Login successful!",
      user: userCredential.user
    };
  } catch (error) {
    console.error("❌ Login failed:", error);
    return {
      success: false,
      message: error.message,
      error: error.code
    };
  }
};
