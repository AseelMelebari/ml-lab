import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

const LabPage = lazy(() => import('./pages/LabPage'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/labs/:id" element={<LabPage />} />
      </Route>
    </Routes>
  );
}
