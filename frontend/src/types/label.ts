/**
 * Label generation types.
 */

export type LabelGenerationMode = 'slot' | 'selection' | 'individual' | 'complete';

export interface LabelGenerationRequest {
  mode: LabelGenerationMode;
  slotId?: string;
  depositorIds?: string[];
}

export interface LabelDepositor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface LabelStats {
  totalDepositors: number;
  totalLists: number;
  totalLabels: number;
  labelsGenerated: number;
  labelsPending: number;
}
