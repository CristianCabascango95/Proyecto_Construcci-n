// frontend/src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage'; // Lo crearemos en el siguiente paso
import GoogleCallbackPage from './pages/GoogleCallbackPage'; // Asegúrate de importar esto

// Componente de Ruta Protegida (para evitar acceso sin login)
const ProtectedRoute = ({ children }) => {
    // **AQUÍ VA LA LÓGICA REAL DE FIREBASE PARA VER SI HAY UN USUARIO ACTIVO**
    const isAuthenticated = true; // CAMBIAR POR LA LÓGICA REAL DE FIREBASE AUTH
    
    return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/google-callback" element={< DashboardPage/>} />
        {/* Ruta del Dashboard Protegida */}
        <Route path="/dashboard" element={
            <ProtectedRoute>
                <DashboardPage />
            </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;