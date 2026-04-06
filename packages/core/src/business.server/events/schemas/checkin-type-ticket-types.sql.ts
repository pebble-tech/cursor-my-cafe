import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

import { cuidId, timestamps } from '../../../drizzle.server/types';
import { CheckinTypesTable } from './checkin-types.sql';
import { TicketTypesTable } from './ticket-types.sql';

export const CheckinTypeTicketTypesTable = pgTable(
  'checkin_type_ticket_types',
  {
    id: cuidId('id'),
    checkinTypeId: text('checkin_type_id')
      .notNull()
      .references(() => CheckinTypesTable.id, { onDelete: 'cascade' }),
    ticketTypeId: text('ticket_type_id')
      .notNull()
      .references(() => TicketTypesTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [uniqueIndex('checkin_type_ticket_types_pair_unique').on(table.checkinTypeId, table.ticketTypeId)]
);

export type CheckinTypeTicketType = typeof CheckinTypeTicketTypesTable.$inferSelect;
export type NewCheckinTypeTicketType = typeof CheckinTypeTicketTypesTable.$inferInsert;
