import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
}

const variantButtonMap: Record<ConfirmVariant, 'danger' | 'primary'> = {
  danger: 'danger',
  warning: 'primary',
  info: 'primary',
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  confirmDisabled = false,
  children,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {message && <p className="text-gray-600">{message}</p>}
        {children}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variantButtonMap[variant]}
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
