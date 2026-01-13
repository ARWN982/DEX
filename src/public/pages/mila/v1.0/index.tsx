import React from 'react';
import { EmptyState } from '../../../components/shared/EmptyState';

const Mila: React.FC = () => {
  return <EmptyState pageName="mila" versionId="1.0" />;
};

// Mark this component as using EmptyState (for header visibility)
(Mila as any).isEmptyState = true;

export default Mila;
