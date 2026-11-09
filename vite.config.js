import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
    base: './',
    plugins: process.env.NO_SSL ? [] : [basicSsl()],
    server: { host: true },
    preview: { host: true },
});
