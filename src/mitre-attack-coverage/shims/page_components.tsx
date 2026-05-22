/**
 * STUB: replaces Kibana page-wrapper/header components and route spy.
 */
import React from 'react';
import { EuiPageBody, EuiPageSection } from '@elastic/eui';

export const SecuritySolutionPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EuiPageBody>
    <EuiPageSection>{children}</EuiPageSection>
  </EuiPageBody>
);

export const SpyRoute: React.FC<{ pageName?: string }> = () => null;

export const HeaderPage: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
    {subtitle && <p style={{ color: '#69707D', marginTop: 4 }}>{subtitle}</p>}
    {children}
  </div>
);

export const CoverageOverviewLink: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <a href="https://www.elastic.co/guide/en/security/current/coverage-overview.html" target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);
