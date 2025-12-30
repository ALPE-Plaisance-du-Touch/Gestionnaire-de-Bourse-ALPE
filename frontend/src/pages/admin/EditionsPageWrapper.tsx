import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditionsListPage } from './EditionsListPage';
import { EditionCreateModal } from '@/components/editions';
import type { Edition } from '@/types';

/**
 * Wrapper component that combines EditionsListPage with create modal.
 * Edit functionality uses dedicated EditionDetailPage via navigation.
 */
export function EditionsPageWrapper() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleEditClick = (edition: Edition) => {
    navigate(`/editions/${edition.id}`);
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
