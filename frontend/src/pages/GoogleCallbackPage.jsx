// frontend/src/pages/GoogleCallbackPage.jsx (Actualizado)

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const GoogleCallbackPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Iniciando intercambio de tokens...");

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        const exchangeCodeForTokens = async (authCode) => {
            try {
                setStatus("Conectando con el backend para obtener tokens...");
                
                // Llama a tu backend para intercambiar el código (¡Esto es el paso clave!)
                const response = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: authCode }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Fallo el intercambio de tokens.');
                }

                const data = await response.json();

                // 🔑 Almacenamos el Access Token REAL que nos dio el backend.
                localStorage.setItem('google_access_token', data.accessToken);
                // Opcional: Almacenar el Refresh Token para refresco automático (más avanzado)
                // localStorage.setItem('google_refresh_token', data.refreshToken); 
                
                setStatus("✅ Conexión completa. Redirigiendo al Dashboard.");
                
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);

            } catch (error) {
                setStatus(`❌ Error grave: ${error.message}.`);
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        };

        if (code) {
            exchangeCodeForTokens(code);
        } else {
            setStatus("Error: Código de autorización no encontrado.");
            setTimeout(() => navigate('/dashboard'), 3000);
        }

    }, [navigate]);

    return (
        <div className="auth-container">
            <h2 className="auth-title">Conexión con Google</h2>
            <p className="status-text">{status}</p>
        </div>
    );
};

export default GoogleCallbackPage;