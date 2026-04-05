import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import {
  EVENT_DATE_LINE,
  EVENT_LUMA_URL,
  EVENT_NAME,
  EVENT_NAME_SHORT,
  EVENT_VENUE_NAME,
} from '@base/core/config/event';
import { Toaster } from '@base/ui/components/sonner';
import uiCss from '@base/ui/tailwind.css?url';

import appCss from '~/styles/app.css?url';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => {
    const baseUrl = process.env.APP_BASE_URL || 'https://cursorhackathon.pebbletech.my';
    const siteTitle = `${EVENT_NAME_SHORT} — ${EVENT_NAME}`;
    const siteDescription = `${EVENT_NAME} on ${EVENT_DATE_LINE} at ${EVENT_VENUE_NAME}, Kuala Lumpur. Co-working, community, and Cursor — details and RSVP on Luma. ${EVENT_LUMA_URL}`;
    const ogImage = `${baseUrl}/cursor-logo.png`;

    return {
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        { title: siteTitle },
        {
          name: 'description',
          content: siteDescription,
        },
        {
          name: 'keywords',
          content:
            'cafe cursor, cursor, kuala lumpur, malaysia, coworking, developer meetup, AI coding, kl tech community',
        },
        {
          name: 'author',
          content: EVENT_NAME,
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: siteTitle },
        { property: 'og:description', content: siteDescription },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:alt', content: 'Cursor' },
        { property: 'og:url', content: baseUrl },
        { property: 'og:site_name', content: EVENT_NAME_SHORT },
        { property: 'og:locale', content: 'en_MY' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteTitle },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: ogImage },
        { name: 'twitter:image:alt', content: 'Cursor' },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'stylesheet', href: uiCss },
        { rel: 'canonical', href: baseUrl },
        { rel: 'icon', type: 'image/png', href: '/cursor-logo.png' },
        { rel: 'apple-touch-icon', href: '/cursor-logo.png' },
      ],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
