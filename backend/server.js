const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🔑 CLAVE: Almacenamiento temporal del Refresh Token en memoria para la sesión del servidor.
// En producción, esto se guardaría en una base de datos segura (como Firestore).
let savedRefreshToken = null; 

// Configuración de Middlewares
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://frontend-google-auth.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200

}));
app.options("*", cors());

app.use(bodyParser.json());

// --- 1. CONFIGURACIÓN DE OAUTH2 ---

// Inicializamos el cliente de Google OAuth2 con las credenciales del .env
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // La URI de redirección debe coincidir exactamente con la configurada en Google Cloud
    // y la que el frontend usa para el flujo de autenticación.
    process.env.GOOGLE_REDIRECT_URI 
);

// --- 2. ENDPOINT PARA INTERCAMBIAR CÓDIGO POR TOKENS ---

app.post('/api/auth/google/callback', async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Falta el código de autorización.' });
    }

    try {
        // Intercambio del código por Tokens (Access Token y Refresh Token)
        const { tokens } = await oauth2Client.getToken(code);
        
        // 🚨 PASO CRUCIAL PARA LA PERMANENCIA: Guardamos el Refresh Token
        if (tokens.refresh_token) {
            savedRefreshToken = tokens.refresh_token; 
            console.log('🔑 Refresh Token guardado en memoria. Conexión "permanente" establecida.');
        }

        // Devolvemos el Access Token al frontend para que haga las llamadas iniciales
        res.json({
            accessToken: tokens.access_token,
            expiryDate: tokens.expiry_date,
            // Opcional: Puedes devolver el email del usuario si usaste el scope 'email'
        });

    } catch (error) {
        console.error('Error al intercambiar código por tokens:', error.message);
        // Devolvemos un error legible que el frontend pueda interpretar como JSON
        res.status(500).json({ error: 'Fallo el intercambio de tokens con Google: ' + error.message });
    }
});


// --- LÓGICA DE REINTENTO Y REFRESCO DE TOKENS (Aplicado a Drive y Calendar) ---

/**
 * Función genérica para manejar la llamada a la API y el refresco de tokens.
 */
const callGoogleApi = async (req, res, apiCallFn) => {
    const { accessToken } = req.body; 

    if (!accessToken) {
        // Devolvemos el error inmediatamente, el frontend lo manejará.
        res.status(401).json({ error: 'No se proporcionó Access Token.' });
        return;
    }

    // Función auxiliar para reintentar la llamada después del refresco
    const attemptCall = async (tokenToUse) => {
        oauth2Client.setCredentials({ access_token: tokenToUse });
        return apiCallFn(oauth2Client);
    };

    try {
        // 1. Intento inicial de la llamada con el token actual
        const apiResponse = await attemptCall(accessToken);
        return apiResponse;
        
    } catch (error) {
        // Manejo específico para errores de Gaxios (errores de la API de Google)
        const errorMessage = error.response?.data?.error_description || error.message;

        // 2. Si falla con error de token expirado (generalmente 401 GaxiosError)
        if (savedRefreshToken && errorMessage.includes('401') || errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('invalid')) {
            console.log('Access Token expirado. Intentando refrescar...');
            
            try {
                // 3. Refrescar el token
                oauth2Client.setCredentials({ refresh_token: savedRefreshToken });
                const { credentials } = await oauth2Client.refreshAccessToken();

                // 4. Reintentar la llamada con el nuevo Access Token
                console.log('Token refrescado. Reintentando la llamada a la API...');
                const newApiResponse = await attemptCall(credentials.access_token);
                
                // 5. Devolvemos el nuevo token y la respuesta de la API al frontend
                return {
                    data: newApiResponse.data,
                    newAccessToken: credentials.access_token
                };

            } catch (refreshError) {
                const refreshErrorMessage = refreshError.response?.data?.error_description || refreshError.message;
                console.error('Fallo el refresco de tokens:', refreshErrorMessage);
                // Lanzamos un error específico para el frontend
                throw new Error(`REFRESH_FAILED: ${refreshErrorMessage}`); 
            }
        }
        
        // Si el error no es de expiración o no tenemos Refresh Token
        console.error('Error al obtener datos de Google:', errorMessage);
        // Lanzamos un error genérico para el frontend
        throw new Error(`API_CALL_FAILED: ${errorMessage}`);
    }
};


// --- 3. ENDPOINT PARA OBTENER ARCHIVOS DE DRIVE ---

app.post('/api/drive/files', async (req, res) => {
    // Definición de la función que llama a la API de Drive
    const driveApiCall = async (authClient) => {
        const drive = google.drive({ version: 'v3', auth: authClient });
        return drive.files.list({
            q: "trashed=false", // Eliminada la restricción de 'root' in parents para más archivos de prueba.
            fields: 'files(id, name, mimeType, webViewLink)',
            pageSize: 10,
        });
    };

    try {
        const result = await callGoogleApi(req, res, driveApiCall);
        
        if (!result) return; // callGoogleApi ya envió la respuesta de error si faltaba el token
        
        if (result.newAccessToken) {
            // Caso 1: Token fue refrescado. Devolvemos los archivos y el nuevo token.
            return res.json({ files: result.data.files, newAccessToken: result.newAccessToken });
        } else {
            // Caso 2: Llamada exitosa a la primera. Devolvemos solo los archivos.
            return res.json({ files: result.data.files });
        }

    } catch (error) {
        // Errores manejados por callGoogleApi
        if (error.message.startsWith('REFRESH_FAILED')) {
            return res.status(401).json({ error: 'Fallo el refresco. Vuelve a conectar.', details: error.message });
        }
        return res.status(401).json({ error: 'Token inválido o expirado. Necesita ser refrescado.', details: error.message });
    }
});


// --- 4. ENDPOINT PARA OBTENER EVENTOS DE CALENDAR ---

app.post('/api/calendar/events', async (req, res) => {
    // Definición de la función que llama a la API de Calendar
    const calendarApiCall = async (authClient) => {
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); 

        return calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 5
        });
    };

    try {
        const result = await callGoogleApi(req, res, calendarApiCall);

        if (!result) return; // callGoogleApi ya envió la respuesta de error si faltaba el token

        if (result.newAccessToken) {
            // Caso 1: Token fue refrescado. Devolvemos los eventos y el nuevo token.
            return res.json({ events: result.data.items, newAccessToken: result.newAccessToken });
        } else {
            // Caso 2: Llamada exitosa a la primera. Devolvemos solo los eventos.
            return res.json({ events: result.data.items });
        }
        
    } catch (error) {
        // Errores manejados por callGoogleApi
        if (error.message.startsWith('REFRESH_FAILED')) {
            return res.status(401).json({ error: 'Fallo el refresco. Vuelve a conectar.', details: error.message });
        }
        return res.status(401).json({ error: 'Token inválido o expirado. Necesita ser refrescado.', details: error.message });
    }
});

app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente 🚀");
});
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});