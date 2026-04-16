import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import App from './App';

// Pre-load EUI icons eagerly to prevent ChunkLoadError during client-side navigation
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';
// @ts-ignore
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross';
// @ts-ignore
import { icon as pencil } from '@elastic/eui/es/components/icon/assets/pencil';
// @ts-ignore
import { icon as documentation } from '@elastic/eui/es/components/icon/assets/documentation';
// @ts-ignore
import { icon as popout } from '@elastic/eui/es/components/icon/assets/popout';
// @ts-ignore
import { icon as casesApp } from '@elastic/eui/es/components/icon/assets/app_cases';
// @ts-ignore
import { icon as tokenField } from '@elastic/eui/es/components/icon/assets/token_field';
// @ts-ignore
import { icon as copy } from '@elastic/eui/es/components/icon/assets/copy';
// @ts-ignore
import { icon as refresh } from '@elastic/eui/es/components/icon/assets/refresh';
// @ts-ignore
import { icon as check } from '@elastic/eui/es/components/icon/assets/check';
// @ts-ignore
import { icon as sparkles } from '@elastic/eui/es/components/icon/assets/sparkles';
// @ts-ignore
import { icon as discuss } from '@elastic/eui/es/components/icon/assets/comment';
// @ts-ignore
import { icon as boxesHorizontal } from '@elastic/eui/es/components/icon/assets/boxes_horizontal';
// @ts-ignore
import { icon as dashboardApp } from '@elastic/eui/es/components/icon/assets/app_dashboard';
// @ts-ignore
import { icon as clock } from '@elastic/eui/es/components/icon/assets/clock';
// @ts-ignore
import { icon as thumbsUp } from '@elastic/eui/es/components/icon/assets/thumb_up';
// @ts-ignore
import { icon as thumbsDown } from '@elastic/eui/es/components/icon/assets/thumb_down';
// @ts-ignore
import { icon as checkInCircleFilled } from '@elastic/eui/es/components/icon/assets/check_circle_fill';

appendIconComponentCache({
  cross, pencil, documentation, popout, casesApp, tokenField,
  copy, refresh, check, sparkles, discuss, boxesHorizontal,
  dashboardApp, clock, thumbsUp, thumbsDown, checkInCircleFilled,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <BrowserRouter>
    <QueryParamProvider adapter={ReactRouter6Adapter}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </QueryParamProvider>
  </BrowserRouter>
);