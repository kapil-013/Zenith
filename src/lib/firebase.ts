import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfYjpNm5ckWGydMShTgKK6wMWr_NKrbvI",
  authDomain: "zenith-a6ada.firebaseapp.com",
  projectId: "zenith-a6ada",
  storageBucket: "zenith-a6ada.firebasestorage.app",
  messagingSenderId: "857996566379",
  appId: "1:857996566379:web:c908799bff62be0a42f62e",
  measurementId: "G-CHFJRKPCV6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-zenith-a4e5dd9f-7c11-46ac-a8ac-4777cb65f044");
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
