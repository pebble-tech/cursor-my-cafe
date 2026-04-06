import { relations } from 'drizzle-orm';

import { UsersTable } from '../../../auth/schema';
import {
  CheckinTypeCategoryCodes,
  CheckinTypeCategoryEnum,
  CodeStatusCodes,
  CodeStatusEnum,
  type CheckinTypeCategory,
  type CodeStatus,
} from '../../../config/constant';
import {
  CheckinTypeTicketTypesTable,
  type CheckinTypeTicketType,
  type NewCheckinTypeTicketType,
} from './checkin-type-ticket-types.sql';
import { CheckinRecordsTable, type CheckinRecord, type NewCheckinRecord } from './checkin-records.sql';
import { CheckinTypesTable, type CheckinType, type NewCheckinType } from './checkin-types.sql';
import { CodesTable, type Code, type NewCode } from './codes.sql';
import { CreditTypesTable, type CreditType, type NewCreditType } from './credit-types.sql';
import { TicketTypesTable, type NewTicketType, type TicketType } from './ticket-types.sql';

export const usersRelations = relations(UsersTable, ({ many, one }) => ({
  assignedCodes: many(CodesTable, { relationName: 'assignedCodes' }),
  checkinRecords: many(CheckinRecordsTable, { relationName: 'participantCheckins' }),
  processedCheckins: many(CheckinRecordsTable, { relationName: 'processedByCheckins' }),
  checkedInByUser: one(UsersTable, {
    fields: [UsersTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'checkedInByUser',
  }),
  ticketType: one(TicketTypesTable, {
    fields: [UsersTable.ticketTypeId],
    references: [TicketTypesTable.id],
  }),
}));

export const creditTypesRelations = relations(CreditTypesTable, ({ many }) => ({
  codes: many(CodesTable),
}));

export const codesRelations = relations(CodesTable, ({ one }) => ({
  creditType: one(CreditTypesTable, {
    fields: [CodesTable.creditTypeId],
    references: [CreditTypesTable.id],
  }),
  assignedToUser: one(UsersTable, {
    fields: [CodesTable.assignedTo],
    references: [UsersTable.id],
    relationName: 'assignedCodes',
  }),
}));

export const ticketTypesRelations = relations(TicketTypesTable, ({ many }) => ({
  checkinTypeLinks: many(CheckinTypeTicketTypesTable),
}));

export const checkinTypeTicketTypesRelations = relations(CheckinTypeTicketTypesTable, ({ one }) => ({
  checkinType: one(CheckinTypesTable, {
    fields: [CheckinTypeTicketTypesTable.checkinTypeId],
    references: [CheckinTypesTable.id],
  }),
  ticketType: one(TicketTypesTable, {
    fields: [CheckinTypeTicketTypesTable.ticketTypeId],
    references: [TicketTypesTable.id],
  }),
}));

export const checkinTypesRelations = relations(CheckinTypesTable, ({ many }) => ({
  checkinRecords: many(CheckinRecordsTable),
  ticketTypeLinks: many(CheckinTypeTicketTypesTable),
}));

export const checkinRecordsRelations = relations(CheckinRecordsTable, ({ one }) => ({
  checkinType: one(CheckinTypesTable, {
    fields: [CheckinRecordsTable.checkinTypeId],
    references: [CheckinTypesTable.id],
  }),
  participant: one(UsersTable, {
    fields: [CheckinRecordsTable.participantId],
    references: [UsersTable.id],
    relationName: 'participantCheckins',
  }),
  processedBy: one(UsersTable, {
    fields: [CheckinRecordsTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'processedByCheckins',
  }),
}));

export { CreditTypesTable, type CreditType, type NewCreditType };
export { CodesTable, CodeStatusCodes, CodeStatusEnum, type Code, type NewCode, type CodeStatus };
export {
  CheckinTypesTable,
  CheckinTypeCategoryCodes,
  CheckinTypeCategoryEnum,
  type CheckinType,
  type NewCheckinType,
  type CheckinTypeCategory,
};
export { CheckinRecordsTable, type CheckinRecord, type NewCheckinRecord };
export {
  TicketTypesTable,
  type TicketType,
  type NewTicketType,
};
export {
  CheckinTypeTicketTypesTable,
  type CheckinTypeTicketType,
  type NewCheckinTypeTicketType,
};
