import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

import { auth } from '@base/core/auth/auth';
import { UsersTable } from '@base/core/auth/schema';
import { CodesTable } from '@base/core/business.server/events/schemas/schema';
import { db, eq } from '@base/core/drizzle.server';

export const getParticipantDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error('No request context');

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error('Unauthorized');

  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: eq(UsersTable.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      status: true,
      qrCodeValue: true,
      checkedInAt: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const credits = await db.query.codes.findMany({
    where: eq(CodesTable.assignedTo, userId),
    with: {
      creditType: true,
    },
  });

  const sortedCredits = credits.sort((a, b) => (a.creditType?.displayOrder ?? 0) - (b.creditType?.displayOrder ?? 0));

  return {
    user,
    credits: sortedCredits,
  };
});

export const markCreditRedeemed = createServerFn({ method: 'POST' })
  .validator((data: { codeId: string; redeemed: boolean }) => data)
  .handler(async ({ data }) => {
    const request = getWebRequest();
    if (!request) throw new Error('No request context');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error('Unauthorized');

    const userId = session.user.id;

    const code = await db.query.codes.findFirst({
      where: eq(CodesTable.id, data.codeId),
    });

    if (!code || code.assignedTo !== userId) {
      throw new Error('Code not found or not assigned to you');
    }

    await db
      .update(CodesTable)
      .set({
        redeemedAt: data.redeemed ? new Date() : null,
      })
      .where(eq(CodesTable.id, data.codeId));

    return { success: true };
  });
