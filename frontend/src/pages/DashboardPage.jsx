import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://backend-google-auth-h2us.onrender.com/api';
// ---------- Funciones API ----------
const postApi = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  return response.json();
};

const exchangeCodeForTokens = async (code) =>
  await postApi('/auth/google/callback', { code });

const fetchDriveFiles = async (accessToken) =>
  await postApi('/drive/files', { accessToken });

const fetchCalendarEvents = async (accessToken) =>
  await postApi('/calendar/events', { accessToken });

const logoutUser = async () => {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_user_email');
  return Promise.resolve({ success: true });
};

// ---------- Componente Principal ----------
const DashboardPage = () => {
  const navigate = useNavigate();
  const [driveFiles, setDriveFiles] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // --- Cargar token/email y manejar callback ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const storedToken = localStorage.getItem('google_access_token');
    const storedEmail = localStorage.getItem('google_user_email');

    if (storedToken) setAccessToken(storedToken);
    if (storedEmail) setUserEmail(storedEmail);

    if (code && window.location.pathname === '/google-callback') {
      setIsConnecting(true);
      exchangeCodeForTokens(code)
        .then((data) => {
          setAccessToken(data.accessToken);
          localStorage.setItem('google_access_token', data.accessToken);
          if (data.userEmail) {
            setUserEmail(data.userEmail);
            localStorage.setItem('google_user_email', data.userEmail);
          }
        })
        .catch((err) => setError(`Error al conectar: ${err.message}`))
        .finally(() => setIsConnecting(false));
    }
  }, [navigate]);

  // --- Logout ---
  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  // --- OAuth ---
  const handleConnectGoogle = () => {
    const client_id = '1057271165611-jh8tt14a56v5818kutabgova9jrlmkc7.apps.googleusercontent.com';
    const redirect_uri = 'http://localhost:5173/google-callback';
    //const redirect_uri = 'https://backend-google-auth-h2us.onrender.com';

    const scope =
      'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(
      redirect_uri
    )}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  // --- Cargar archivos Drive ---
  const handleViewDrive = async () => {
    try {
      const data = await fetchDriveFiles(accessToken);
      setDriveFiles(data.files || []);
    } catch (error) {
      setError(`Error al cargar Drive: ${error.message}`);
    }
  };

  // --- Cargar eventos Calendar ---
  const handleViewCalendar = async () => {
    try {
      const data = await fetchCalendarEvents(accessToken);
      setCalendarEvents(data.events || []);
    } catch (error) {
      setError(`Error al cargar Calendar: ${error.message}`);
    }
  };

  const isConnected = !!accessToken;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title"> Dashboard</h2>

     

      <p className="dashboard-welcome">
        Bienvenido <br></br>{/* --- <span className="email-text">{userEmail || 'No identificado'}</span> <br />--- */}
        Estado:{" "}
        <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '✅ Conectado' : '❌ Desconectado'}
        </span>
      </p>

      <div className="button-group">
        <button
          onClick={handleConnectGoogle}
          disabled={isConnected || isConnecting}
          className="google-btn connect-btn"
        >
          {isConnecting ? 'Conectando...' : '🔗 Conectar con Google'}
        </button>

        <button
          onClick={handleViewDrive}
          disabled={!isConnected}
          className="google-btn drive-btn"
        >
          📂 Ver Archivos de Drive
        </button>

        <button
          onClick={handleViewCalendar}
          disabled={!isConnected}
          className="google-btn calendar-btn"
        >
          📅 Ver Agenda de Calendar
        </button>
      </div>

      {/* --- Archivos Drive --- */}
      <div className="section">
        <h3>Archivos Recientes de Drive ({driveFiles.length})</h3>
        <div className="file-grid">
          {driveFiles.length > 0 ? (
            driveFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-preview">
                  {file.mimeType.includes('image') ? (
                    <img src={file.thumbnailLink || '/file-icon.png'} alt={file.name} />
                  ) : (
                    <img src="/file-icon.png" alt="Archivo" />
                  )}
                </div>
                <div className="file-info">
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                  <p className="file-type">{file.mimeType.split('.').pop()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-text">No se han cargado archivos aún.</p>
          )}
        </div>
      </div>

      {/* --- Eventos --- */}
      <div className="section">
        <h3>Eventos Agendados ({calendarEvents.length})</h3>
        <ul className="event-list">
          {calendarEvents.length > 0 ? (
            calendarEvents.map((e) => (
              <li key={e.id}>
                <strong>{e.summary}</strong> —{' '}
                <span>{new Date(e.start?.dateTime || e.start?.date).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <p className="empty-text">No hay eventos cargados.</p>
          )}
        </ul>
      </div>

      <button onClick={handleLogout} className="logout-btn">
        Cerrar Sesión
      </button>

      <p className="status-text">Universidad de las fuerzas Armadas ESPE_LATACUNGA </p>
    </div>
  );
};

export default DashboardPage;
