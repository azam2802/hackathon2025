import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "./config";

// Create a new document
export const createDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

// Get a single document by ID
export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

// Get all documents from a collection
export const getDocuments = async (collectionName, queries = []) => {
  let q = collection(db, collectionName);

  // Apply queries if provided
  if (queries.length > 0) {
    q = query(q, ...queries);
  }

  const querySnapshot = await getDocs(q);
  const documents = [];

  querySnapshot.forEach((doc) => {
    documents.push({ id: doc.id, ...doc.data() });
  });

  return documents;
};

// Update a document
export const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
};
export const deleteDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

// User management functions
export const createUserProfile = async (uid, userData) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...userData,
      createdAt: new Date(),
      isApproved: false,
      role: 'user'
    });
    console.log('User profile created successfully:', uid);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

export const getUserProfile = async (uid) => {
  try {
    const profile = await getDocument('users', uid);
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

export const getPendingUsers = async () => {
  try {
    console.log('Fetching pending users...');
    
    // Use a simpler query that doesn't require a composite index
    // Just get users where isApproved is false
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("isApproved", "==", false));
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    const pendingUsers = [];
    
    // Filter out superadmins client-side
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role !== 'superadmin') {
        pendingUsers.push({ id: doc.id, ...userData });
      }
    });
    
    console.log('Pending users found:', pendingUsers.length);
    return pendingUsers;
  } catch (error) {
    console.error('Error getting pending users:', error);
    throw new Error('Failed to get pending users');
  }
};

export const approveUser = async (uid) => {
  try {
    await updateDocument('users', uid, { isApproved: true });
    console.log('User approved successfully:', uid);
  } catch (error) {
    console.error('Error approving user:', error);
    throw new Error('Failed to approve user');
  }
};

export const rejectUser = async (uid) => {
  try {
    await deleteDocument('users', uid);
    console.log('User rejected and deleted:', uid);
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw new Error('Failed to reject user');
  }
};
