import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MainChatbot from './MainChatbot';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MainChatbot />
  </React.StrictMode>
);