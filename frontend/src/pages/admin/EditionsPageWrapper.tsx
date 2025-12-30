import { useState } from 'react';
import { EditionsListPage } from './EditionsListPage';
import { EditionCreateModal } from '@/components/editions';
import type { Edition } from '@/types';

/**
 * Wrapper component that combines EditionsListPage with modals.
 */
export function EditionsPageWrapper() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [_editionToEdit, setEditionToEdit] = useState<Edition | null>(null);

  const handleEditClick = (edition: Edition) => {
    // TODO: Implement edit modal in US-007
    setEditionToEdit(edition);
    console.log('Edit edition:', edition.id);
  };

  return (
    <>
      <EditionsListPage
        onCreateClick={() => setIsCreateModalOpen(true)}
        onEditClick={handleEditClick}
      />

      <EditionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
