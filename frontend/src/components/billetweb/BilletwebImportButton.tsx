import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BilletwebImportModal } from './BilletwebImportModal';
import type { Edition } from '@/types';

interface BilletwebImportButtonProps {
  edition: Edition;
  importCount?: number;
  onImportSuccess?: () => void;
}

export function BilletwebImportButton({
  edition,
  importCount = 0,
  onImportSuccess,
}: BilletwebImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show button for configured editions
  if (edition.status !== 'configured') {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        leftIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        }
      >
        Importer CSV
      </Button>
      {importCount > 0 && (
        <span className="text-sm text-gray-500">
          {importCount} inscription(s) deja importee(s)
        </span>
      )}

      <BilletwebImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editionId={edition.id}
        editionName={edition.name}
        onImportSuccess={onImportSuccess}
      />
    </>
  );
}
