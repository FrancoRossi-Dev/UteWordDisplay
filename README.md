# Como me siento hoy

App interactiva en tiempo real para eventos y cursos. Los participantes escanean un QR con su teléfono y sus respuestas aparecen en pantalla al instante.

## Pantallas

Hay dos modos de uso, accesibles desde el hub central (`/`):

### 😊 ¿Cómo me siento hoy? — `/emocion`
Los participantes escanean el QR y eligen una emoción. Los íconos aparecen orbitando en la pantalla grande en tiempo real.

- **Pantalla grande:** `/emocion`
- **Formulario móvil:** `/submit`

### 📊 Retroalimentación del curso — `/feedback`
Al final del curso, los participantes califican su experiencia del 1 al 5 y dejan un comentario opcional. La pantalla muestra un velocímetro con el promedio y los comentarios flotan como burbujas.

- **Pantalla grande:** `/feedback`
- **Formulario móvil:** `/feedback/submit`

Los comentarios de la última hora se muestran de forma continua. Las respuestas anteriores a 60 minutos se ignoran automáticamente.

## Stack

- **Frontend:** React + Vite
- **Sincronización en tiempo real:** Firebase Realtime Database
- **Deploy:** Netlify
- **QR:** `qrcode.react`
- **Estilos:** CSS plano (sin framework)

## Configuración local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd como-me-siento-hoy
npm install
```

### 2. Crear el proyecto en Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear un proyecto nuevo
3. Activar **Realtime Database** → crear en modo test
4. En **Configuración del proyecto → General → Tus apps**, registrar una app web y copiar el objeto `firebaseConfig`

### 3. Variables de entorno

Crear `.env.local` en la raíz del proyecto (ya está en `.gitignore`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Ver `.env.example` como referencia.

### 4. Correr en desarrollo

```bash
npm run dev       # servidor local en localhost:5173
npm run build     # build de producción → dist/
npm run preview   # previsualizar el build en localhost:4173
```

## Deploy en Netlify

1. Subir el repo a GitHub
2. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
3. Conectar el repo. Netlify detecta Vite automáticamente:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. En **Site Settings → Environment Variables**, agregar las mismas variables de `.env.local`
5. Hacer redeploy

El archivo `public/_redirects` ya tiene la regla `/* /index.html 200` necesaria para que el ruteo de React funcione en Netlify.

## Modelo de datos en Firebase

```
words/
  latest/               ← emoción más reciente (se sobreescribe)
    emotionId: "emotion_3"
    ts: 1718000000000

feedback/
  responses/
    {id}/               ← cada respuesta de feedback
      score: 4          ← número del 1 al 5
      comment: "Muy bueno"
      ts: 1718000000000
```

## Rutas completas

| Path | Componente | Uso |
|------|------------|-----|
| `/` | `Hub` | Selector de pantalla (para el facilitador) |
| `/emocion` | `Display` | Pantalla grande — emociones orbitando |
| `/submit` | `Form` | Formulario móvil — elegir emoción |
| `/feedback` | `FeedbackDisplay` | Pantalla grande — velocímetro + burbujas |
| `/feedback/submit` | `FeedbackForm` | Formulario móvil — calificación y comentario |

## Notas

- El QR se genera en tiempo de ejecución con `window.location.origin`, sin URL hardcodeada.
- No hay backend — Firebase maneja toda la sincronización vía `onValue` / `onChildAdded`.
- Las animaciones son CSS puro, sin librería de animaciones.
