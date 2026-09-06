/**
 * Shared fixtures for tests.
 *
 * The user literals these replace were written in snake_case — the shape the API
 * puts on the wire. The Axios interceptor converts to camelCase before any
 * component sees it, so those fixtures described a payload the app never
 * receives, and the type checker had no way to say so while they stayed
 * untyped.
 */
import type { Edition, LoginResponse, User } from '@/types';

export const baseUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: null,
  address: null,
  role: 'depositor',
  isActive: true,
  isVerified: true,
  isLocalResident: false,
  isTester: false,
  createdAt: '2024-01-01T10:00:00Z',
  lastLoginAt: null,
};

export const baseLoginResponse: LoginResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'bearer',
  expiresIn: 3600,
  user: baseUser,
};

/**
 * A complete Edition. The literals this replaces predated the module toggles and
 * the Billetweb columns, and each new field on the type broke them one more time.
 * Spread it and override only what the test is actually about.
 */
export const baseEdition: Edition = {
  id: '1',
  name: 'Bourse Printemps 2025',
  description: 'Édition de printemps',
  location: 'Salle des fêtes',
  status: 'draft',
  startDatetime: '2025-03-15T09:00:00Z',
  endDatetime: '2025-03-16T18:00:00Z',
  declarationDeadline: null,
  depositStartDatetime: null,
  depositEndDatetime: null,
  retrievalStartDatetime: null,
  retrievalEndDatetime: null,
  commissionRate: null,
  createdAt: '2025-01-15T10:00:00Z',
  createdBy: {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
  },
  billetwebEventId: null,
  lastBilletwebSync: null,
  closedAt: null,
  closedBy: null,
  archivedAt: null,
  isTraining: false,
  labelsEnabled: true,
  depositReviewEnabled: true,
  salesEnabled: true,
  payoutsEnabled: true,
  depositSlotsEnabled: true,
  ticketsEnabled: true,
  specialListsEnabled: true,
  offlineSalesEnabled: true,
  privateSchoolSaleEnabled: false,
  registrationMode: 'manual',
};
