import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { ParticipantStatusCodes, ParticipantTypeCodes, UserRoleCodes } from '../config/constant';

export const UsersTable = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    role: text('role', { enum: UserRoleCodes }).default('participant').notNull(),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    lumaId: text('luma_id'),
    participantType: text('participant_type', { enum: ParticipantTypeCodes }).default('regular').notNull(),
    status: text('status', { enum: ParticipantStatusCodes }).default('registered').notNull(),
    checkedInAt: timestamp('checked_in_at'),
    checkedInBy: text('checked_in_by'),
    qrCodeValue: text('qr_code_value'),
    welcomeEmailSentAt: timestamp('welcome_email_sent_at'),
  },
  (table) => [
    index('users_luma_id_idx').on(table.lumaId),
    index('users_status_idx').on(table.status),
    index('users_role_idx').on(table.role),
    index('users_participant_type_idx').on(table.participantType),
  ]
);

export const SessionsTable = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)]
);

export const AccountsTable = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)]
);

export const VerificationsTable = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
