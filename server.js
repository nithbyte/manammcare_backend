import 'dotenv/config';
import app from './src/app.js';

// Hostinger passes PORT dynamically, fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(` ManammCare Backend API Server`);
  console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(` Node Version: ${process.version}`);
  console.log(` Listening on: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(` Healthcheck : http://localhost:${PORT}/api/v1/health`);
  console.log(`===============================================`);
});

// Graceful shutdown handling for Hostinger / PM2 / Passenger
const handleGracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default server;
