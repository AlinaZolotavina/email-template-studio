import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from './app/App';
import { getBrowserSessionStorage } from './app/persistence/sessionStorageAdapter';
import { createAppStore } from './app/store';
import './styles/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

const store = createAppStore({ storage: getBrowserSessionStorage() });

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
