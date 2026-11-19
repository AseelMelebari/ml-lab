import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppShell } from './components/layout/AppShell';
import { AppRoutes } from './routes';

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

export { AppShell, Route, Routes, lazy };
