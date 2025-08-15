import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './styles/reset.css';
import './styles/os-specific.css';
import './index.css';
import App from './App';
import { store } from './store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Determine basename based on environment
// Use /taskscheduler for production (GitHub Pages), empty string for local development
const basename = process.env.NODE_ENV === 'production' ? '/taskscheduler' : '';

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
); 