import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import type { PayoutResponse } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: PayoutResponse | null;
  onConfirm: (paymentMethod: string, paymentReference: string | null, notes: string | null) => void;
  isLoading: boolean;
}

export function PaymentModal({ isOpen, onClose, payout, onConfirm, isLoading }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'transfer'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      paymentMethod,
      paymentReference || null,
      notes || null,
    );
  };

  const handleClose = () => {
    setPaymentMethod('cash');
    setPaymentReference('');
    setNotes('');
    onClose();
  };

  if (!payout) return null;

  const isCheckMissingRef = paymentMethod === 'check' && !paymentReference.trim();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enregistrer le paiement" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Depositor & amount summary */}
        <div className="mb-6 bg-primary/10 rounded-lg p-4">
          <p className="text-sm text-primary-dark">
            <span className="font-semibold">{payout.depositorName}</span>
            {' '} - Liste n&deg;{payout.listNumber}
          </p>
          <p className="text-2xl font-bold text-primary-dark mt-1">
            {Number(payout.netAmount).toFixed(2)} EUR
          </p>
        </div>

        {/* Payment method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-bark-light mb-2">
            Mode de paiement
          </label>
          <div className="flex gap-3">
            {([
              { value: 'cash', label: 'Espèces' },
              { value: 'check', label: 'Chèque' },
              { value: 'transfer', label: 'Virement' },
            ] as const).map((method) => (
              <label
                key={method.value}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === method.value
                    ? 'border-primary bg-primary/10 text-primary-dark'
                    : 'border-sand hover:bg-cream'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Check number (required for check) */}
        {paymentMethod === 'check' && (
          <div className="mb-4">
            <label htmlFor="checkNumber" className="block text-sm font-medium text-bark-light mb-1">
              Numéro de chèque <span className="text-error">*</span>
            </label>
            <input
              id="checkNumber"
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-md border border-sand px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="N° de chèque"
              required
            />
          </div>
        )}

        {/* Transfer date (required for transfer) */}
        {paymentMethod === 'transfer' && (
          <div className="mb-4">
            <label htmlFor="transferRef" className="block text-sm font-medium text-bark-light mb-1">
              Référence / Date du virement <span className="text-error">*</span>
            </label>
            <input
              id="transferRef"
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-md border border-sand px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Référence ou date du virement"
              required
            />
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="paymentNotes" className="block text-sm font-medium text-bark-light mb-1">
            Notes (optionnel)
          </label>
          <textarea
            id="paymentNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-sand px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Notes supplémentaires..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading || isCheckMissingRef}>
            {isLoading ? 'Enregistrement...' : 'Confirmer le paiement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
