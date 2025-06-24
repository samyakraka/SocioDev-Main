import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

export async function followUser(currentUid: string, targetUid: string) {
  if (currentUid === targetUid) return;
  // Add target to current user's following, and current to target's followers
  await updateDoc(doc(db, "users", currentUid), {
    following: arrayUnion(targetUid),
  });
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayUnion(currentUid),
  });
}

export async function unfollowUser(currentUid: string, targetUid: string) {
  if (currentUid === targetUid) return;
  await updateDoc(doc(db, "users", currentUid), {
    following: arrayRemove(targetUid),
  });
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayRemove(currentUid),
  });
}

export async function getUserById(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}
