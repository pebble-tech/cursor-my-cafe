import { drizzle } from 'drizzle-orm/node-postgres';

import { AccountsTable, SessionsTable, UsersTable, VerificationsTable } from '~/auth/schema';
import {
  CheckinRecordsTable,
  CheckinTypeTicketTypesTable,
  CheckinTypesTable,
  CodesTable,
  CreditTypesTable,
  TicketTypesTable,
  checkinRecordsRelations,
  checkinTypeTicketTypesRelations,
  checkinTypesRelations,
  codesRelations,
  creditTypesRelations,
  ticketTypesRelations,
  usersRelations,
} from '~/business.server/events/schemas/schema';
import { env } from '~/config/env';

export {
  sql,
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  count,
  like,
  ilike,
  notLike,
  asc,
  desc,
} from 'drizzle-orm';

export type { SQL } from 'drizzle-orm';

export const schema = {
  users: UsersTable,
  sessions: SessionsTable,
  accounts: AccountsTable,
  verifications: VerificationsTable,
  creditTypes: CreditTypesTable,
  codes: CodesTable,
  ticketTypes: TicketTypesTable,
  checkinTypes: CheckinTypesTable,
  checkinTypeTicketTypes: CheckinTypeTicketTypesTable,
  checkinRecords: CheckinRecordsTable,
  usersRelations,
  creditTypesRelations,
  codesRelations,
  ticketTypesRelations,
  checkinTypesRelations,
  checkinTypeTicketTypesRelations,
  checkinRecordsRelations,
};

export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: false,
});
