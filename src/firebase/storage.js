import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

// Upload a file to Firebase Storage
export const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// Delete a file from Firebase Storage
export const deleteFile = async (path) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Get download URL for a file
export const getFileURL = async (path) => {
  const storageRef = ref(storage, path);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
