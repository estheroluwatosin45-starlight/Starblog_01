import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Smoothly fade out and remove preloader once mounted
const preloader = document.getElementById('preloader');
if (preloader) {
  setTimeout(() => {
    preloader.style.opacity = '0';
    preloader.style.visibility = 'hidden';
    setTimeout(() => {
      preloader.remove();
    }, 500); // Wait for transition to finish before removing from DOM
  }, 200); // Tiny delay for smooth visual transition
}
