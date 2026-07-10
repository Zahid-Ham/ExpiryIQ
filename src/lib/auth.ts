import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";
import { app } from "./firebase";

// Initialize Firebase Auth
const auth: Auth = getAuth(app);

export { auth };

/**
 * Signs in a user with email and password.
 */
export async function logInUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Creates a new user account with email and password.
 */
export async function signUpUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out the currently authenticated user.
 */
export async function logOutUser() {
  return signOut(auth);
}

/**
 * Sends a password reset email.
 */
export async function resetUserPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Subscribes to changes in the user's authentication state.
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
