import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKspslZY5hv0A8Z7tif1jhwnwUB5BTzOE",
  authDomain: "lunar-expanse-r7z9n.firebaseapp.com",
  projectId: "lunar-expanse-r7z9n",
  storageBucket: "lunar-expanse-r7z9n.firebasestorage.app",
  messagingSenderId: "363682641651",
  appId: "1:363682641651:web:53f8801100102fe0072986",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-a4e5dd9f-7c11-46ac-a8ac-4777cb65f044");
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
