import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage
} from "firebase/storage";
import { app } from "./firebase";

// Initialize Firebase Storage
const storage: FirebaseStorage = getStorage(app);

export { storage };

/**
 * Uploads a file (Blob or File) to a specified path in Firebase Storage.
 */
export async function uploadFile(path: string, file: Blob | Uint8Array | ArrayBuffer) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/**
 * Retrieves the public download URL of a file from Firebase Storage.
 */
export async function getFileDownloadUrl(path: string) {
  const fileRef = ref(storage, path);
  return getDownloadURL(fileRef);
}

/**
 * Deletes a file from Firebase Storage.
 */
export async function deleteFile(path: string) {
  const fileRef = ref(storage, path);
  return deleteObject(fileRef);
}
