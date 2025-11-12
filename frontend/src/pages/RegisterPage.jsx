// frontend/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { registerUser } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom'; // Importamos useNavigate y Link

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Inicializamos el hook de navegación

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerUser(email, password);
            
            // Redirección directa al Dashboard después del registro exitoso (como solicitaste)
            navigate('/dashboard'); 
            
        } catch (error) {
            alert("Error al registrar: " + error.message);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Crear Nueva Cuenta</h2>
            
            <form onSubmit={handleSubmit} className="auth-form">
                {/* Campo Email */}
                <input 
                    type="email" 
                    placeholder="Correo Electrónico"
                    className="auth-input"
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                
                {/* Campo Contraseña */}
                <input 
                    type="password" 
                    placeholder="Contraseña"
                    className="auth-input"
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                
                <button type="submit" className="auth-button">
                    Registrar
                </button>
            </form>

            <div className="auth-links">
                {/* Enlace para volver al Login */}
                <p>¿Ya tienes cuenta? <Link to="/" className="auth-link bold-link">Iniciar Sesión</Link></p>
            </div>
        </div>
    );
};

export default RegisterPage;