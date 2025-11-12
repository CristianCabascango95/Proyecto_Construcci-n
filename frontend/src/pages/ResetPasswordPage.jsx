// frontend/src/pages/ResetPasswordPage.jsx

import React, { useState } from 'react';
import { resetPassword } from '../api/auth';
import { Link } from 'react-router-dom'; // Importamos Link

const ResetPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Limpiar mensajes anteriores
        try {
            await resetPassword(email);
            setMessage("✅ Se ha enviado un correo electrónico de recuperación a " + email);
        } catch (error) {
            setMessage("❌ Error: " + error.message);
        }
    };

    // Determinamos la clase CSS del mensaje
    const messageClass = message.startsWith('✅') ? 'success-message' : 'error-message';

    return (
        <div className="auth-container">
            <h2 className="auth-title">Recuperar Contraseña</h2>
            <p className="auth-instruction">Ingresa tu correo electrónico para recibir el enlace de recuperación.</p>
            
            <form onSubmit={handleSubmit} className="auth-form-inline">
                <input 
                    type="email" 
                    placeholder="Tu correo electrónico" 
                    className="auth-input full-width-input" // Usaremos una clase modificadora para este input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <button type="submit" className="auth-button small-button">
                    Enviar Enlace
                </button>
            </form>

            {/* Mostramos mensajes de éxito/error */}
            {message && <p className={messageClass}>{message}</p>}
            
            <div className="auth-links">
                {/* Enlace para volver al Login */}
                <p><Link to="/" className="auth-link bold-link">Volver a Iniciar Sesión</Link></p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;