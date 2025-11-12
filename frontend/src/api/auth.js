// frontend/src/api/auth.js

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    signOut 
} from "firebase/auth";
import { auth } from "../firebase/config";

// Usamos EXPORT CONST para exportaciones nombradas
// 1. Crear Cuenta
export const registerUser = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
};

// 2. Iniciar Sesión (¡Verifica que el nombre sea correcto!)
export const loginUser = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

// 3. Recuperar Contraseña
export const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email); 
};

// 4. Cerrar Sesión
export const logoutUser = async () => {


    // 1. Limpiar el token de Google (ya se hace en el Dashboard, pero se incluye por robustez)
    localStorage.removeItem('google_access_token');
    
    // 2. Aquí iría una llamada a tu backend si necesitas invalidar la sesión de usuario
    // Ejemplo:
    // await fetch('http://localhost:5000/api/logout', { method: 'POST' });
    
    // Devolvemos una promesa resuelta para simular el éxito
    return Promise.resolve({ success: true, message: "Sesión cerrada localmente." });
};