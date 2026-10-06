# ManammCare Backend API

Production-ready Node.js & Express REST API for the ManammCare platform, fully compatible with **Hostinger Node.js hosting** (Node.js 18.x, 20.x, and 22.x LTS).

---

## 🚀 Features

- **Hostinger Compatible**: Configured with dynamic port handling (`process.env.PORT`), native ES modules, and graceful shutdown.
- **Security**: Hardened with [Helmet](https://helmetjs.github.io/) headers and configurable [CORS](https://expressjs.com/en/resources/middleware/cors.html).
- **Lightweight & Clean**: Zero high-severity vulnerabilities, no heavy unnecessary dependencies.
- **Ready-to-use Endpoints**: Health monitoring, contact forms, and appointment booking endpoints.
- **LiteSpeed / Apache Ready**: Includes [.htaccess](file:///d:/Nithbyte%20Projects/manammcare_backend/.htaccess) for Hostinger's LiteSpeed/Passenger environment.

---

## 📁 Project Structure

```
manammcare_backend/
├── .htaccess                  # Hostinger LiteSpeed / Apache routing config
├── .env.example               # Template environment variables
├── .env                       # Local environment variables
├── .gitignore                 # Git ignore rules (node_modules, .env, etc.)
├── package.json               # Dependencies & scripts (Node >= 18)
├── server.js                  # Application entry point (Hostinger startup file)
└── src/
    ├── app.js                 # Express app configuration & middlewares
    ├── controllers/
    │   ├── appointmentController.js  # Booking requests
    │   ├── contactController.js      # Contact messages
    │   └── healthController.js       # Healthcheck & server stats
    ├── middleware/
    │   └── errorHandler.js    # 404 & global error handlers
    └── routes/
        └── api.routes.js      # API route definitions
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js version **18.x, 20.x, or 22.x**
- npm 9+

### Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (with native watch mode):
   ```bash
   npm run dev
   ```

3. Start production server:
   ```bash
   npm start
   ```

Server will start on `http://localhost:5000`.

---

## 🌐 Deploying to Hostinger (Step-by-Step)

Hostinger supports Node.js applications via **hPanel** (Cloud & Web Hosting plans with Node.js support) or Hostinger VPS.

### Option A: Hostinger hPanel (Shared / Cloud Hosting)

1. **Upload Files**:
   - Upload the backend files to your target directory on Hostinger (e.g., `public_html/api` or a subdomain folder like `backend.manammcare.com`).
   - *Note: Do not upload the `node_modules` folder; install them directly on the server.*

2. **Configure Node.js in hPanel**:
   - Log in to **Hostinger hPanel**.
   - Navigate to **Websites** → Click **Manage** next to your domain.
   - Go to **Advanced** → **Node.js** (or search "Node.js").
   - Click **Create Application** (or manage existing):
     - **Node.js version**: Choose **20.x** (or **18.x** / **22.x**)
     - **Application mode**: `Production`
     - **Application root**: Select the folder where your files are uploaded (e.g. `public_html/api`)
     - **Application startup file**: `server.js`

3. **Install Dependencies**:
   - In the hPanel Node.js section, click **Run NPM Install** (or access Hostinger SSH and run `npm install --omit=dev`).

4. **Environment Variables**:
   - Add environment variables in hPanel or create a `.env` file in the application root:
     ```env
     PORT=5000
     NODE_ENV=production
     CLIENT_URL=https://manammcare.com,https://www.manammcare.com
     ```

5. **Start the Application**:
   - Click **Restart Application** or **Start Application**.
   - Test by opening `https://your-domain.com/api/v1/health`.

---

### Option B: Hostinger VPS (with PM2 & Nginx)

If using Hostinger VPS:
```bash
# Clone and install
git clone https://github.com/nithbyte/manammcare_backend.git
cd manammcare_backend
npm install --omit=dev

# Start with PM2
pm2 start server.js --name "manammcare-backend"
pm2 save
pm2 startup
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and welcome |
| `GET` | `/api/v1/health` | Healthcheck (uptime, node version, memory usage) |
| `POST` | `/api/v1/contact` | Submit contact / inquiry form |
| `POST` | `/api/v1/appointments` | Book appointment request |

---

## 🔗 Connecting with `manammcare_website`

In your frontend application (`manammcare_website`):

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Example: Submit contact form
export const sendContactMessage = async (data) => {
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};
```
