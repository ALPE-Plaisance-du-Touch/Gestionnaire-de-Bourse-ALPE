/**
 * Billetweb types.
 */

export type ListType = 'standard' | 'list_1000' | 'list_2000';

// --- Edition Depositor Types ---

export interface EditionDepositor {
  id: string;
  editionId: string;
  userId: string;
  depositSlotId: string | null;
  listType: ListType;
  billetwebOrderRef: string | null;
  billetwebSession: string | null;
  billetwebTarif: string | null;
  importedAt: string | null;
  postalCode: string | null;
  city: string | null;
  createdAt: string;
}

export interface EditionDepositorWithUser extends EditionDepositor {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userPhone: string | null;
  slotStartDatetime: string | null;
  slotEndDatetime: string | null;
}

export interface EditionDepositorsListResponse {
  items: EditionDepositorWithUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ManualDepositorCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  depositSlotId: string;
  listType?: ListType;
  postalCode?: string;
  city?: string;
}

// --- Import Log Types ---

export interface BilletwebImportLog {
  id: string;
  editionId: string;
  importedById: string;
  filename: string;
  fileSizeBytes: number;
  totalRows: number;
  rowsImported: number;
  existingDepositorsLinked: number;
  newDepositorsCreated: number;
  rowsSkippedInvalid: number;
  rowsSkippedUnpaid: number;
  rowsSkippedDuplicate: number;
  rowsSkippedAlreadyRegistered: number;
  importStartedAt: string;
  importCompletedAt: string | null;
  createdAt: string;
}

export interface BilletwebImportStats {
  totalDepositors: number;
  totalImports: number;
  totalImported: number;
  pendingInvitations: number;
  latestImport: BilletwebImportLog | null;
}
