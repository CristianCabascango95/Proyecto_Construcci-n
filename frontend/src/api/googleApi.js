// URL base de tu servidor backend.
const API_BASE_URL = 'http://localhost:5000/api'; 

/**
 * Función para hacer fetch y manejar la respuesta JSON.
 * @param {string} endpoint - La ruta del API.
 * @param {Object} data - Datos a enviar en el body (incluye el accessToken).
 * @returns {Promise<Object>} - El objeto JSON de respuesta del servidor.
 */
const postApi = async (endpoint, data) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        // Si la respuesta no es 2xx, el servidor ha devuelto un error (probablemente 401 o 500)
        if (!response.ok) {
            // Intentar leer el JSON de error
            let errorData = {};
            try {
                // El backend (server.js) asegura que siempre devuelve JSON en caso de error
                errorData = await response.json(); 
            } catch (e) {
                // Si falla al leer JSON, lanzamos un error que no sea 'Unexpected end of JSON input'
                throw new Error(`Error en el servidor: Fallo al leer respuesta JSON. Status: ${response.status}`);
            }
            // Lanzar el error con el mensaje legible del backend
            const errorMessage = errorData.error || `Error ${response.status}: Respuesta no válida.`;
            throw new Error(errorMessage);
        }

        // Si es exitoso, devolver el JSON
        return response.json();

    } catch (error) {
        // Relanzar el error para que DashboardPage.jsx lo capture
        throw new Error(error.message);
    }
};

/**
 * Intercambia el código de autorización de Google por Access y Refresh Tokens.
 * @param {string} code - El código de autorización recibido de Google.
 * @returns {Promise<Object>} - { accessToken, expiryDate }
 */
export const exchangeCodeForTokens = async (code) => {
    // Llama al endpoint del backend /api/auth/google/callback
    const data = await postApi('/auth/google/callback', { code });
    return data;
};

/**
 * Obtiene la lista de archivos de Google Drive.
 * @param {string} accessToken - Token de acceso actual.
 * @returns {Promise<Object>} - { files: [...], newAccessToken?: string }
 */
export const fetchDriveFiles = async (accessToken) => {
    // Llama al endpoint del backend /api/drive/files
    const data = await postApi('/drive/files', { accessToken });
    // Si el backend refrescó el token, vendrá en la respuesta
    return { files: data.files, newAccessToken: data.newAccessToken }; 
};

/**
 * Obtiene los eventos de Google Calendar.
 * @param {string} accessToken - Token de acceso actual.
 * @returns {Promise<Object>} - { events: [...], newAccessToken?: string }
 */
export const fetchCalendarEvents = async (accessToken) => {
    // Llama al endpoint del backend /api/calendar/events
    const data = await postApi('/calendar/events', { accessToken });
    // Si el backend refrescó el token, vendrá en la respuesta
    return { events: data.events, newAccessToken: data.newAccessToken };
};