import { useState } from 'react';
import { EditionsListPage } from './EditionsListPage';
import { EditionCreateModal, EditionEditModal } from '@/components/editions';
import type { Edition } from '@/types';

/**
 * Wrapper component that combines EditionsListPage with modals.
 */
export function EditionsPageWrapper() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editionToEdit, setEditionToEdit] = useState<Edition | null>(null);

  const handleEditClick = (edition: Edition) => {
    setEditionToEdit(edition);
  };

  const handleEditModalClose = () => {
    setEditionToEdit(null);
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

      <EditionEditModal
        isOpen={editionToEdit !== null}
        onClose={handleEditModalClose}
        edition={editionToEdit}
      />
    </>
  );
}
