import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import i18n from './i18n';
import './index.css';

// Initialize i18n
i18n.init((err, t) => {
  if (err) console.error('i18n initialization error:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);