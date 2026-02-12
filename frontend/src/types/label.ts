/**
 * Label generation types.
 */

export type LabelGenerationMode = 'slot' | 'selection' | 'individual' | 'complete';

export interface LabelGenerationRequest {
  mode: LabelGenerationMode;
  slotId?: string;
  depositorIds?: string[];
}

export interface LabelStats {
  totalDepositors: number;
  totalLists: number;
  totalLabels: number;
  labelsGenerated: number;
  labelsPending: number;
}
