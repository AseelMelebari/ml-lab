import { lazy, Suspense, type ReactNode } from 'react';
import { Spinner } from './components/ui/primitives';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import HomePage from './pages/HomePage';

const FundamentalsPage = lazy(() => import('./pages/FundamentalsPage'));
const FundamentalPage = lazy(() => import('./pages/FundamentalPage'));
const ParadigmsPage = lazy(() => import('./pages/ParadigmsPage'));
const ParadigmPage = lazy(() => import('./pages/ParadigmPage'));
const AlgorithmsPage = lazy(() => import('./pages/AlgorithmsPage'));
const AlgorithmPage = lazy(() => import('./pages/AlgorithmPage'));
const LabsPage = lazy(() => import('./pages/LabsPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const InstructorPage = lazy(() => import('./pages/InstructorPage'));
const InstructorDemoPage = lazy(() => import('./pages/InstructorDemoPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/instructor/:id" element={<SuspenseWrap><InstructorDemoPage /></SuspenseWrap>} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/learn" element={<FundamentalsPage />} />
        <Route path="/learn/:id" element={<FundamentalPage />} />
        <Route path="/paradigms" element={<ParadigmsPage />} />
        <Route path="/paradigms/:id" element={<ParadigmPage />} />
        <Route path="/algorithms" element={<AlgorithmsPage />} />
        <Route path="/algorithms/:id" element={<AlgorithmPage />} />
        <Route path="/labs" element={<LabsPage />} />
        <Route path="/labs/:id" element={<LabPage />} />
        <Route path="/evaluation" element={<EvaluationPage />} />
        <Route path="/evaluation/:section" element={<EvaluationPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/instructor" element={<InstructorPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function SuspenseWrap({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
