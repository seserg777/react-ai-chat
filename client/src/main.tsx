import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import { App } from './App';
import { AppThemeProvider } from './AppThemeProvider';

createRoot(document.getElementById('root')!).render(
  <AppThemeProvider>
    <App />
  </AppThemeProvider>,
);
