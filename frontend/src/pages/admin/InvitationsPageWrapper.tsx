import { useState } from 'react';
import { InvitationsPage } from './InvitationsPage';
import { InvitationCreateModal, BulkInvitationModal } from '@/components/invitations';

/**
 * Wrapper component that combines InvitationsPage with modals.
 */
export function InvitationsPageWrapper() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  return (
    <>
      <InvitationsPage
        onCreateClick={() => setIsCreateModalOpen(true)}
        onBulkCreateClick={() => setIsBulkModalOpen(true)}
      />

      <InvitationCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BulkInvitationModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </>
  );
}
