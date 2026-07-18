// Vercel entrypoint. Vercel's Node runtime runs this file as a serverless
// function for every request matched to it by vercel.json, and knows how to
// invoke an exported Express app directly, so this file only needs to hand
// back the same app.ts used locally and on Render. No app.listen call here,
// Vercel manages the actual HTTP listening itself.
import app from '../app';

export default app;
