import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CalendarDays, MapPin } from 'lucide-react';

import { UserRoleEnum } from '@base/core/config/constant';
import {
  EVENT_DATE_LINE,
  EVENT_LUMA_URL,
  EVENT_NAME,
  EVENT_NAME_SHORT,
  EVENT_VENUE_SINGLE_LINE,
} from '@base/core/config/event';
import { Button } from '@base/ui/components/button';

import { getServerSession, type User } from '~/apis/auth';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: `${EVENT_NAME_SHORT} — ${EVENT_NAME}` }],
  }),
  beforeLoad: async () => {
    const session = await getServerSession();
    return { session };
  },
  component: IndexComponent,
});

function IndexComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  const user = session?.user as User | undefined;
  const isAdmin = user?.role === UserRoleEnum.admin;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black">
            <img src="/cursor-logo.png" alt="Cursor" className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{EVENT_NAME}</h1>
        </div>

        <div className="space-y-3 text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <CalendarDays className="h-5 w-5 shrink-0" />
            <span className="text-lg">{EVENT_DATE_LINE}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5 shrink-0" />
            <span className="text-lg">{EVENT_VENUE_SINGLE_LINE}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 pt-4">
          <Button size="lg" variant="outline" className="w-full max-w-xs text-base" asChild>
            <a href={EVENT_LUMA_URL} target="_blank" rel="noopener noreferrer">
              Event on Luma
            </a>
          </Button>

          {!user && (
            <Button size="lg" className="w-full max-w-xs text-base" onClick={() => navigate({ to: '/login' })}>
              Login
            </Button>
          )}

          {user && isAdmin && (
            <>
              <Button size="lg" className="w-full max-w-xs text-base" onClick={() => navigate({ to: '/admin' })}>
                Admin Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full max-w-xs text-base"
                onClick={() => navigate({ to: '/ops' })}
              >
                Ops Dashboard
              </Button>
            </>
          )}

          {user && user.role === UserRoleEnum.participant && (
            <Button size="lg" className="w-full max-w-xs text-base" onClick={() => navigate({ to: '/dashboard' })}>
              Go to Dashboard
            </Button>
          )}

          {user && user.role === UserRoleEnum.ops && (
            <Button size="lg" className="w-full max-w-xs text-base" onClick={() => navigate({ to: '/ops' })}>
              Ops Dashboard
            </Button>
          )}
        </div>

        <WelcomeMessage userName={user?.name} />
      </div>
    </div>
  );
}

function WelcomeMessage({ userName }: { userName?: string }) {
  if (!userName) {
    return <p className="text-sm text-gray-500">Sign in to access your participant dashboard</p>;
  }

  return (
    <p className="text-sm text-gray-500">
      Welcome back, <span className="font-medium text-gray-700">{userName}</span>
    </p>
  );
}
