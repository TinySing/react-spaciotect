import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components';
import { BubbleStudio, EnergyPage, HomePage, MassingStudio, OptionsPage, ProjectsPage, RenderingStudio, ReportsPage, RoomsStudio, SiteAnalysisPage, SiteAnalysisReportPage } from './pages/index';

export default function App() {
  return <ToastProvider><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/site-analysis" element={<SiteAnalysisPage />} />
    <Route path="/site-analysis-report" element={<SiteAnalysisReportPage />} />
    <Route path="/options" element={<OptionsPage />} />
    <Route path="/energy" element={<EnergyPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/studio" element={<Navigate to="/studio/bubble" replace />} />
    <Route path="/studio/bubble" element={<BubbleStudio />} />
    <Route path="/studio/massing" element={<MassingStudio />} />
    <Route path="/studio/rooms" element={<RoomsStudio />} />
    <Route path="/studio/rendering" element={<RenderingStudio />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></ToastProvider>;
}
