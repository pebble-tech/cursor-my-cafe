import { createServerFn } from '@tanstack/react-start';

import { UsersTable } from '@base/core/auth/schema';
import { verifyQRCodeValue } from '@base/core/business.server/events/events';
import {
  CheckinRecordsTable,
  CheckinTypeTicketTypesTable,
  CheckinTypesTable,
  CodesTable,
  CreditTypesTable,
  TicketTypesTable,
} from '@base/core/business.server/events/schemas/schema';
import {
  CheckinTypeCategoryEnum,
  CodeStatusEnum,
  ParticipantStatusEnum,
  ParticipantTypeEnum,
} from '@base/core/config/constant';
import { and, asc, count, db, eq, isNull, sql } from '@base/core/drizzle.server';
import { sendCheckinConfirmationEmail } from '@base/core/email/templates/checkin-confirmation';
import { logError, logInfo, logWarning } from '@base/core/utils/logging';

import { requireOpsOrAdmin } from '~/apis/auth';

export type ProcessCheckinResult =
  | {
      success: true;
      participant: {
        id: string;
        name: string;
        email: string;
        participantType: string;
        qrCodeValue: string | null;
      };
      codesAssigned: number;
      assignedCodes: Array<{
        creditType: {
          id: string;
          name: string;
          displayName: string;
          emailInstructions: string | null;
        };
        code: {
          id: string;
          codeValue: string;
          redeemUrl: string | null;
        };
      }>;
      isVip: boolean;
      isFirstAttendance: boolean;
    }
  | {
      success: false;
      error: string;
      ineligible?: boolean;
      checkinTypeName?: string;
      participantTicketTypeName?: string | null;
      participant?: {
        id: string;
        name: string;
        email: string;
        participantType: string;
      };
      existingCheckinTime?: Date;
    };

export const processCheckin = createServerFn({ method: 'POST' })
  .validator((data: { qrValue: string; checkinTypeId: string }) => {
    if (!data.qrValue || typeof data.qrValue !== 'string') {
      throw new Error('QR value is required');
    }
    if (!data.checkinTypeId || typeof data.checkinTypeId !== 'string') {
      throw new Error('Check-in type ID is required');
    }
    return data;
  })
  .handler(async ({ data }): Promise<ProcessCheckinResult> => {
    const session = await requireOpsOrAdmin();
    const { qrValue, checkinTypeId } = data;

    const qrVerification = verifyQRCodeValue(qrValue);
    if (!qrVerification.valid) {
      return { success: false, error: 'Invalid QR code' };
    }

    const participantId = qrVerification.participantId;

    const participant = await db.query.users.findFirst({
      where: eq(UsersTable.id, participantId),
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    const checkinType = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.id, checkinTypeId),
    });

    if (!checkinType || !checkinType.isActive) {
      return { success: false, error: 'Check-in type not found or inactive' };
    }

    const existingCheckin = await db.query.checkinRecords.findFirst({
      where: and(
        eq(CheckinRecordsTable.checkinTypeId, checkinTypeId),
        eq(CheckinRecordsTable.participantId, participantId)
      ),
    });

    if (existingCheckin) {
      return {
        success: false,
        error: 'Already checked in',
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          participantType: participant.participantType,
        },
        existingCheckinTime: existingCheckin.checkedInAt,
      };
    }

    const allowedLinks = await db
      .select({ ticketTypeId: CheckinTypeTicketTypesTable.ticketTypeId })
      .from(CheckinTypeTicketTypesTable)
      .where(eq(CheckinTypeTicketTypesTable.checkinTypeId, checkinTypeId));

    if (allowedLinks.length > 0) {
      const allowedIds = new Set(allowedLinks.map((l) => l.ticketTypeId));
      const participantTicketId = participant.ticketTypeId;
      if (!participantTicketId || !allowedIds.has(participantTicketId)) {
        let participantTicketTypeName: string | null = null;
        if (participantTicketId) {
          const tt = await db.query.ticketTypes.findFirst({
            where: eq(TicketTypesTable.id, participantTicketId),
          });
          participantTicketTypeName = tt?.name ?? null;
        }

        return {
          success: false,
          error: `This ticket is not eligible for ${checkinType.name}`,
          ineligible: true,
          checkinTypeName: checkinType.name,
          participantTicketTypeName,
          participant: {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            participantType: participant.participantType,
          },
        };
      }
    }

    const isFirstAttendance =
      checkinType.type === CheckinTypeCategoryEnum.attendance &&
      participant.status === ParticipantStatusEnum.registered;

    const isVip = participant.participantType === ParticipantTypeEnum.vip;

    let codesAssigned = 0;
    const assignedCodes: Array<{
      creditType: typeof CreditTypesTable.$inferSelect;
      code: typeof CodesTable.$inferSelect;
    }> = [];

    if (isFirstAttendance && !isVip) {
      await db.transaction(async (tx) => {
        const activeCreditTypes = await tx
          .select()
          .from(CreditTypesTable)
          .where(eq(CreditTypesTable.isActive, true))
          .orderBy(asc(CreditTypesTable.displayOrder));

        for (const creditType of activeCreditTypes) {
          const [code] = await tx
            .select()
            .from(CodesTable)
            .where(
              and(
                eq(CodesTable.creditTypeId, creditType.id),
                eq(CodesTable.status, CodeStatusEnum.unassigned),
                isNull(CodesTable.assignedTo)
              )
            )
            .limit(1)
            .for('update', { skipLocked: true });

          if (code) {
            await tx
              .update(CodesTable)
              .set({
                assignedTo: participantId,
                assignedAt: new Date(),
                status: CodeStatusEnum.available,
              })
              .where(eq(CodesTable.id, code.id));

            assignedCodes.push({ creditType, code });
            codesAssigned++;
          } else {
            logWarning('Code pool exhausted', {
              creditTypeId: creditType.id,
              creditTypeName: creditType.name,
              participantId,
            });
          }
        }

        if (isFirstAttendance) {
          await tx
            .update(UsersTable)
            .set({
              status: ParticipantStatusEnum.checked_in,
              checkedInAt: new Date(),
              checkedInBy: session.user.id,
            })
            .where(eq(UsersTable.id, participantId));
        }
      });
    } else if (isFirstAttendance && isVip) {
      await db.transaction(async (tx) => {
        await tx
          .update(UsersTable)
          .set({
            status: ParticipantStatusEnum.checked_in,
            checkedInAt: new Date(),
            checkedInBy: session.user.id,
          })
          .where(eq(UsersTable.id, participantId));
      });
    }

    await db.insert(CheckinRecordsTable).values({
      checkinTypeId,
      participantId,
      checkedInBy: session.user.id,
    });

    logInfo('Check-in processed', {
      participantId,
      checkinTypeId,
      checkinTypeName: checkinType.name,
      codesAssigned,
      isVip,
      isFirstAttendance,
      checkedInBy: session.user.id,
    });

    const assignedCodesData = assignedCodes.map(({ creditType, code }) => ({
      creditType: {
        id: creditType.id,
        name: creditType.name,
        displayName: creditType.displayName,
        emailInstructions: creditType.emailInstructions,
      },
      code: {
        id: code.id,
        codeValue: code.codeValue,
        redeemUrl: code.redeemUrl,
      },
    }));

    if (isFirstAttendance && !isVip && participant.qrCodeValue && assignedCodes.length > 0) {
      const emailResult = await sendCheckinConfirmationEmail({
        to: participant.email,
        name: participant.name,
        qrCodeValue: participant.qrCodeValue,
        assignedCodes: assignedCodesData,
      });

      if (!emailResult.success) {
        logError('Failed to send check-in confirmation email', {
          participantId,
          email: participant.email,
          error: emailResult.error,
        });
      } else {
        logInfo('Check-in confirmation email sent', {
          participantId,
          email: participant.email,
          messageId: emailResult.messageId,
        });
      }
    }

    return {
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        participantType: participant.participantType,
        qrCodeValue: participant.qrCodeValue,
      },
      codesAssigned,
      assignedCodes: assignedCodesData,
      isVip,
      isFirstAttendance,
    };
  });

export type GuestStatusResult =
  | {
      success: true;
      participant: {
        id: string;
        name: string;
        email: string;
        participantType: string;
        ticketTypeName: string | null;
      };
      checkinStatuses: Array<{
        checkinTypeId: string;
        checkinTypeName: string;
        checkedInAt: Date | null;
      }>;
    }
  | {
      success: false;
      error: string;
    };

export const getGuestStatus = createServerFn({ method: 'POST' })
  .validator((data: { qrValue: string }) => {
    if (!data.qrValue || typeof data.qrValue !== 'string') {
      throw new Error('QR value is required');
    }
    return data;
  })
  .handler(async ({ data }): Promise<GuestStatusResult> => {
    await requireOpsOrAdmin();
    const { qrValue } = data;

    const qrVerification = verifyQRCodeValue(qrValue);
    if (!qrVerification.valid) {
      return { success: false, error: 'Invalid QR code' };
    }

    const participantId = qrVerification.participantId;

    const participant = await db.query.users.findFirst({
      where: eq(UsersTable.id, participantId),
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    let ticketTypeName: string | null = null;
    if (participant.ticketTypeId) {
      const tt = await db.query.ticketTypes.findFirst({
        where: eq(TicketTypesTable.id, participant.ticketTypeId),
      });
      ticketTypeName = tt?.name ?? null;
    }

    const checkinTypes = await db
      .select()
      .from(CheckinTypesTable)
      .where(eq(CheckinTypesTable.isActive, true))
      .orderBy(asc(CheckinTypesTable.displayOrder));

    const checkinRecords = await db.query.checkinRecords.findMany({
      where: eq(CheckinRecordsTable.participantId, participantId),
    });

    const recordsMap = new Map(checkinRecords.map((record) => [record.checkinTypeId, record.checkedInAt]));

    const checkinStatuses = checkinTypes.map((type) => ({
      checkinTypeId: type.id,
      checkinTypeName: type.name,
      checkedInAt: recordsMap.get(type.id) || null,
    }));

    return {
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        participantType: participant.participantType,
        ticketTypeName,
      },
      checkinStatuses,
    };
  });

export const getCheckinCount = createServerFn({ method: 'POST' })
  .validator((data: { checkinTypeId: string }) => {
    if (!data.checkinTypeId || typeof data.checkinTypeId !== 'string') {
      throw new Error('Check-in type ID is required');
    }
    return data;
  })
  .handler(async ({ data }) => {
    await requireOpsOrAdmin();
    const { checkinTypeId } = data;

    const [result] = await db
      .select({ count: count() })
      .from(CheckinRecordsTable)
      .where(eq(CheckinRecordsTable.checkinTypeId, checkinTypeId));

    return { count: result?.count ?? 0 };
  });

type RecentScan = {
  participantId: string;
  participantName: string;
  participantType: string;
  checkinTypeId: string;
  checkinTypeName: string;
  checkedInAt: Date;
  isDuplicate: boolean;
};

export const getRecentScans = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    scans: RecentScan[];
  }> => {
    const session = await requireOpsOrAdmin();

    const records = await db
      .select({
        participantId: CheckinRecordsTable.participantId,
        participantName: UsersTable.name,
        participantType: UsersTable.participantType,
        checkinTypeId: CheckinRecordsTable.checkinTypeId,
        checkinTypeName: CheckinTypesTable.name,
        checkedInAt: CheckinRecordsTable.checkedInAt,
      })
      .from(CheckinRecordsTable)
      .innerJoin(UsersTable, eq(CheckinRecordsTable.participantId, UsersTable.id))
      .innerJoin(CheckinTypesTable, eq(CheckinRecordsTable.checkinTypeId, CheckinTypesTable.id))
      .where(eq(CheckinRecordsTable.checkedInBy, session.user.id))
      .orderBy(sql`${CheckinRecordsTable.checkedInAt} DESC`)
      .limit(10);

    const scans: RecentScan[] = records.map((record) => ({
      participantId: record.participantId,
      participantName: record.participantName,
      participantType: record.participantType,
      checkinTypeId: record.checkinTypeId,
      checkinTypeName: record.checkinTypeName,
      checkedInAt: record.checkedInAt,
      isDuplicate: false,
    }));

    return { scans };
  }
);
