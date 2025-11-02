import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ElectionApp from './ElectionApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ElectionApp />
  </React.StrictMode>
);
