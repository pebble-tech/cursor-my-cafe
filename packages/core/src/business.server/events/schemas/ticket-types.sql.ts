import { boolean, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

import { cuidId, timestamps } from '../../../drizzle.server/types';

export const TicketTypesTable = pgTable(
  'ticket_types',
  {
    id: cuidId('id'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    lumaTicketTypeId: text('luma_ticket_type_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ticket_types_code_unique').on(table.code),
    uniqueIndex('ticket_types_luma_ticket_type_id_unique').on(table.lumaTicketTypeId),
    index('ticket_types_is_active_idx').on(table.isActive),
  ]
);

export type TicketType = typeof TicketTypesTable.$inferSelect;
export type NewTicketType = typeof TicketTypesTable.$inferInsert;
