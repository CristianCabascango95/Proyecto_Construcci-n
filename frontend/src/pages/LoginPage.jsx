import React, { useState } from 'react';
import { loginUser } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            navigate('/dashboard');
        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    };

    return (
        <div className="auth-container">
            {/* Imagen encima del título */}
            <img 
                src="/ESPE.png" // usa el nombre de tu archivo
                alt="Logo" 
                className="auth-logo"
            />

            <h2 className="auth-title">Iniciar Sesión</h2>
            
            <form onSubmit={handleSubmit} className="auth-form">
                <input 
                    type="email" 
                    placeholder="Correo Electrónico"
                    className="auth-input"
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />

                <input 
                    type="password" 
                    placeholder="Contraseña"
                    className="auth-input"
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                
                <button type="submit" className="auth-button">
                    Iniciar Sesión
                </button>
            </form>
            
            <div className="auth-links">
                <p>¿Olvidaste tu contraseña? <Link to="/reset" className="auth-link">Recuperar Contraseña</Link></p>
                <p>¿No tienes cuenta? <Link to="/register" className="auth-link bold-link">Crear Cuenta</Link></p>
            </div>
        </div>
    );
};

export default LoginPage;
