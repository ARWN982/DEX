import React from 'react';
import { EmptyState } from '../../../components/shared/EmptyState';

const Rafa: React.FC = () => {
  return <EmptyState pageName="rafa" versionId="1.0" />;
};

// Mark this component as using EmptyState (for header visibility)
(Rafa as any).isEmptyState = true;

export default Rafa;
