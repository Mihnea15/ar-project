import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is required on phones for the camera, GPS and motion sensors,
// so the dev server uses a self-signed certificate and listens on the LAN.
// Set NO_SSL=1 for plain HTTP on the laptop (localhost is already a secure context).
export default defineConfig({
    base: './',
    plugins: process.env.NO_SSL ? [] : [basicSsl()],
    server: { host: true },
    preview: { host: true },
});
