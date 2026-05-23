import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <Toaster position="top-right" toastOptions={{ style: { background:'#161b27', color:'#e8eaf6', border:'1px solid #2a3350' }}} />
  </BrowserRouter>
);
