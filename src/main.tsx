import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The plain HTML/CSS loader in index.html exists only to avoid a flash of
// blank content before this script and the stylesheet finish loading on a
// slow mobile connection. Once React has actually mounted the real app onto
// #root, this placeholder has done its job and should disappear.
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  initialLoader.style.transition = 'opacity 0.25s ease';
  initialLoader.style.opacity = '0';
  setTimeout(() => initialLoader.remove(), 250);
}
