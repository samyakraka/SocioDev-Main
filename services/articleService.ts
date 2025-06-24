import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: { seconds: number; nanoseconds: number };
  savedCount: number;
  author: {
    uid: string;
    username: string;
    email: string;
  };
  imageBase64?: string; // <-- Add this for base64 image
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const docSnap = await getDoc(doc(db, "articles", id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

export async function fetchArticles(): Promise<Article[]> {
  const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article));
}

export async function fetchTrendingArticles(): Promise<Article[]> {
  const q = query(
    collection(db, "articles"),
    orderBy("savedCount", "desc"),
    limit(10)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article));
}

export async function addBookmark(userId: string, articleId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    bookmarks: arrayUnion(articleId),
  });
  const articleRef = doc(db, "articles", articleId);
  await updateDoc(articleRef, {
    savedCount: (await getDoc(articleRef)).data()?.savedCount + 1 || 1,
  });
}

export async function removeBookmark(userId: string, articleId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    bookmarks: arrayRemove(articleId),
  });
  const articleRef = doc(db, "articles", articleId);
  const current = (await getDoc(articleRef)).data()?.savedCount || 1;
  await updateDoc(articleRef, {
    savedCount: Math.max(current - 1, 0),
  });
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return [];
  return userDoc.data()?.bookmarks || [];
}

export async function fetchArticlesByIds(ids: string[]): Promise<Article[]> {
  if (!ids.length) return [];
  const articles: Article[] = [];
  for (const id of ids) {
    const docSnap = await getDoc(doc(db, "articles", id));
    if (docSnap.exists()) {
      articles.push({ id: docSnap.id, ...docSnap.data() } as Article);
    }
  }
  return articles;
}
