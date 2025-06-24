import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getUserProfile, UserProfile } from "../services/authService";
import { getUserBookmarks } from "../services/articleService";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
  bookmarks: string[];
  refreshBookmarks: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isLoading: true,
  refreshUserProfile: async () => {},
  bookmarks: [],
  refreshBookmarks: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
  };

  const fetchBookmarks = async (userId: string) => {
    try {
      const bms = await getUserBookmarks(userId);
      setBookmarks(bms);
    } catch (error) {
      setBookmarks([]);
    }
  };

  const refreshBookmarks = async () => {
    if (user?.uid) {
      await fetchBookmarks(user.uid);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log(
        "Auth state changed:",
        authUser ? "User logged in" : "No user"
      );
      setUser(authUser);

      if (authUser) {
        // Fetch additional user data from Firestore
        await fetchUserProfile(authUser.uid);
        await fetchBookmarks(authUser.uid);
      } else {
        setUserProfile(null);
        setBookmarks([]);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        refreshUserProfile,
        bookmarks,
        refreshBookmarks,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
