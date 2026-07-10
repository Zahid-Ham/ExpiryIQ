import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  QueryConstraint,
  DocumentData,
  Firestore,
  writeBatch,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { app } from "./firebase";

// Initialize Firestore
const db: Firestore = getFirestore(app);

export { db };

/**
 * Server timestamp helper
 */
export function getTimestamp() {
  return serverTimestamp();
}

/**
 * Convert Firestore timestamp to JS Date helper
 */
export function toDate(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  const tsObj = timestamp as { seconds?: number; nanoseconds?: number };
  if (tsObj.seconds !== undefined) {
    return new Timestamp(tsObj.seconds, tsObj.nanoseconds || 0).toDate();
  }
  return new Date(timestamp as string | number);
}

/**
 * Fetches a single document from Firestore.
 */
export async function getDocument(path: string, ...pathSegments: string[]) {
  const docRef = doc(db, path, ...pathSegments);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

/**
 * Sets (creates or overwrites) a document in Firestore.
 */
export async function setDocument(path: string, data: DocumentData, ...pathSegments: string[]) {
  const docRef = doc(db, path, ...pathSegments);
  return setDoc(docRef, {
    ...data,
    updatedAt: getTimestamp()
  }, { merge: true });
}

/**
 * Updates specific fields of an existing document in Firestore.
 */
export async function updateDocument(path: string, data: DocumentData, ...pathSegments: string[]) {
  const docRef = doc(db, path, ...pathSegments);
  return updateDoc(docRef, {
    ...data,
    updatedAt: getTimestamp()
  });
}

/**
 * Deletes a document from Firestore.
 */
export async function deleteDocument(path: string, ...pathSegments: string[]) {
  const docRef = doc(db, path, ...pathSegments);
  return deleteDoc(docRef);
}

/**
 * Queries a collection and retrieves documents based on constraints.
 */
export async function queryCollection(collectionPath: string, ...constraints: QueryConstraint[]) {
  const q = query(collection(db, collectionPath), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Advanced paginated query interface
 */
export interface QueryOptions {
  filters?: { field: string; operator: "<" | "<=" | "==" | ">" | ">=" | "array-contains" | "in" | "array-contains-any"; value: unknown }[]
  sorts?: { field: string; direction?: "asc" | "desc" }[]
  pageSize?: number
  lastVisible?: QueryDocumentSnapshot<DocumentData>
}

/**
 * Retrieves a paginated, sorted, and filtered query result with the last visible snapshot.
 */
export async function queryCollectionPaged(collectionPath: string, options: QueryOptions) {
  const constraints: QueryConstraint[] = [];

  // 1. Filtering
  if (options.filters) {
    options.filters.forEach((filter) => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });
  }

  // 2. Sorting
  if (options.sorts) {
    options.sorts.forEach((sort) => {
      constraints.push(orderBy(sort.field, sort.direction || "asc"));
    });
  }

  // 3. Pagination limits
  if (options.pageSize) {
    constraints.push(limit(options.pageSize));
  }

  // 4. Cursor positioning
  if (options.lastVisible) {
    constraints.push(startAfter(options.lastVisible));
  }

  const q = query(collection(db, collectionPath), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const documents = querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  return {
    documents,
    lastVisible: lastDoc,
    hasMore: options.pageSize ? querySnapshot.docs.length === options.pageSize : false
  };
}

/**
 * Executes a batch update for multiple document writes.
 */
export async function executeBatch(
  operations: {
    type: "set" | "update" | "delete"
    collectionPath: string
    docId: string
    data?: DocumentData
  }[]
) {
  const batch = writeBatch(db);

  operations.forEach((op) => {
    const docRef = doc(db, op.collectionPath, op.docId);
    if (op.type === "set") {
      batch.set(docRef, {
        ...(op.data || {}),
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      }, { merge: true });
    } else if (op.type === "update") {
      batch.update(docRef, {
        ...(op.data || {}),
        updatedAt: getTimestamp()
      });
    } else if (op.type === "delete") {
      batch.delete(docRef);
    }
  });

  return batch.commit();
}
