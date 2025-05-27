import { useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUserProfile } from '../firebase/auth';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Auth state changed - user is logged in:', firebaseUser.email);
          // Get user profile with approval status
          const userProfile = await getCurrentUserProfile(firebaseUser);
          console.log('User profile loaded:', userProfile);
          setUser(userProfile);
        } else {
          console.log('Auth state changed - user logged out');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
