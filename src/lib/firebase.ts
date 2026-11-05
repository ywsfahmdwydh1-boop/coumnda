import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, User, DepositRequest } from '../types/index.ts';

// ----------------------------------------------------
// 1. Initialize Firebase App & Firestore
// ----------------------------------------------------
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ----------------------------------------------------
// 2. Strict Error Handling (Conforming to Firebase Skill)
// ----------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('[Firestore] Error in operation:', JSON.stringify(errInfo));
}

// ----------------------------------------------------
// 3. Test Connection on Startup
// ----------------------------------------------------
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'categories', 'cat_tiktok'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline: please check your connection.');
    }
    return false;
  }
}

// Test connection non-blocking on module import
testFirestoreConnection().catch(() => {});

// ----------------------------------------------------
// 4. Real-time Snapshots for Admin Dashboard
// ----------------------------------------------------

/**
 * Real-time listener for Orders from Firestore with safety fallback
 */
export function subscribeToFirestoreOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ordersCollection = collection(db, 'orders');
  return onSnapshot(
    ordersCollection,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const ordersList: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ordersList.push({
          id: docSnap.id,
          orderNumber: data.orderNumber || `KMD-${docSnap.id.slice(-4)}`,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          username: data.username || 'عميل',
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || '',
          categoryName: data.categoryName || 'خدمات عامة',
          link: data.link || data.target || '',
          quantity: Number(data.quantity) || 1,
          charge: Number(data.charge) || 0,
          status: data.status || 'pending',
          remains: Number(data.remains) || 0,
          startCount: Number(data.startCount) || 0,
          providerOrderId: data.providerOrderId || null,
          providerStatus: data.providerStatus || 'Pending',
          errorMessage: data.errorMessage || null,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      // Sort newest first
      ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(ordersList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Users from Firestore
 */
export function subscribeToFirestoreUsers(
  onUpdate: (users: User[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const usersCollection = collection(db, 'users');
  return onSnapshot(
    usersCollection,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const usersList: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Skip explicitly removed accounts
        if (data.email === 'client@koumnd.com' || data.username === 'ahmed_vip') return;
        usersList.push({
          id: docSnap.id,
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'user',
          balance: Number(data.balance) || 0,
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort newest first
      usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(usersList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Deposits from Firestore
 */
export function subscribeToFirestoreDeposits(
  onUpdate: (deposits: DepositRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const depositsCollection = collection(db, 'deposits');
  return onSnapshot(
    depositsCollection,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const depsList: DepositRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        depsList.push({
          id: docSnap.id,
          depositNumber: data.depositNumber || `DEP-${docSnap.id.slice(-4)}`,
          userId: data.userId || '',
          username: data.username || 'عميل',
          userEmail: data.userEmail || '',
          amount: Number(data.amount) || 0,
          paymentMethodId: data.paymentMethodId || 'pm_cash_wallet_all',
          paymentMethodName: data.paymentMethodName || 'محفظة كاش المعتمدة 01556266856',
          senderAccountOrNumber: data.senderAccountOrNumber || data.senderDetails || '',
          transactionProof: data.transactionProof || '',
          referenceCode: data.referenceCode || data.transactionReference || '',
          status: data.status || 'pending',
          adminNotes: data.adminNotes || data.notes || null,
          processedBy: data.processedBy || data.reviewedBy || null,
          createdAt: data.createdAt || new Date().toISOString(),
          processedAt: data.processedAt || data.reviewedAt || null,
        });
      });
      depsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(depsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deposits');
      if (onError) onError(error);
    }
  );
}

/**
 * Persist an order to Firestore
 */
export async function persistOrderToFirestore(order: Order): Promise<boolean> {
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, { ...order, syncedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    return false;
  }
}

/**
 * Persist a user to Firestore
 */
export async function persistUserToFirestore(user: User): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, { ...user, syncedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    return false;
  }
}

/**
 * Persist a deposit request to Firestore
 */
export async function persistDepositToFirestore(deposit: DepositRequest): Promise<boolean> {
  try {
    const docRef = doc(db, 'deposits', deposit.id);
    await setDoc(docRef, { ...deposit, syncedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `deposits/${deposit.id}`);
    return false;
  }
}

// ----------------------------------------------------
// 5. Firebase Google Sign-In for Admin Real-Time ABAC
// ----------------------------------------------------
export async function signInAdminWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تسجيل الدخول بـ Google' };
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}
