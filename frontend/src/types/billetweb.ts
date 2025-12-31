/**
 * Billetweb import types.
 */

export type ListType = 'standard' | 'list_1000' | 'list_2000';

// --- Preview Types ---

export interface BilletwebRowError {
  rowNumber: number;
  email: string | null;
  errorType: string;
  errorMessage: string;
  fieldName: string | null;
  fieldValue: string | null;
}

export interface BilletwebPreviewStats {
  totalRows: number;
  rowsUnpaidInvalid: number;
  rowsToProcess: number;
  existingDepositors: number;
  newDepositors: number;
  duplicatesInFile: number;
  alreadyRegistered: number;
  errorsCount: number;
}

export interface BilletwebPreviewResponse {
  stats: BilletwebPreviewStats;
  errors: BilletwebRowError[];
  warnings: string[];
  canImport: boolean;
  availableSlots: string[];
}

// --- Import Types ---

export interface BilletwebImportResult {
  importLogId: string;
  existingDepositorsLinked: number;
  newDepositorsCreated: number;
  invitationsSent: number;
  notificationsSent: number;
  rowsSkipped: number;
}

export interface BilletwebImportResponse {
  success: boolean;
  message: string;
  result: BilletwebImportResult;
}

export interface BilletwebImportOptions {
  ignoreErrors?: boolean;
  sendEmails?: boolean;
}

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
  latestImport: BilletwebImportLog | null;
}
