// This file is the entrypoint used for local development and for a
// traditional, always-on host such as Render. It takes the portable Express
// app defined in app.ts and adds the two things that only make sense for a
// persistent server: serving the compiled frontend (or Vite's dev middleware
// locally) and actually listening on a port.
//
// Vercel uses a separate, much smaller entrypoint at api/index.ts instead,
// since Vercel runs the app as serverless functions rather than a long lived
// process, and handles static file serving itself rather than through Express.
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import app from './app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configure Vite or Static Assets serving based on Node environment
const resolveStaticAndStart = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IdeaCaprice server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
};

resolveStaticAndStart();
