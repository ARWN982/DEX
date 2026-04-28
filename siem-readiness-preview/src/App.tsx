import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SiemReadinessPage from './SiemReadinessPage';

export default function App() {
  return (
    <MemoryRouter initialEntries={['/siem-readiness']}>
      <SiemReadinessPage />
    </MemoryRouter>
  );
}
