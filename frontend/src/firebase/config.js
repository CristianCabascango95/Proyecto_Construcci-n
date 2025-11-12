// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGDDmKZRfnrjKUu9L17Ie2JTnawCaC24c",
  authDomain: "login-espe.firebaseapp.com",
  projectId: "login-espe",
  storageBucket: "login-espe.appspot.com",
  messagingSenderId: "1057271165611",
  appId: "1:1057271165611:web:0d8e761528e34e17febdee",
  measurementId: "G-QKZ62P78QQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
