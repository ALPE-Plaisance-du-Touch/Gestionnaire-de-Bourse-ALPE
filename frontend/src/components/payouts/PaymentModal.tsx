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
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{payout.depositorName}</span>
            {' '} - Liste n&deg;{payout.listNumber}
          </p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {Number(payout.netAmount).toFixed(2)} EUR
          </p>
        </div>

        {/* Payment method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de paiement
          </label>
          <div className="flex gap-3">
            {([
              { value: 'cash', label: 'Especes' },
              { value: 'check', label: 'Cheque' },
              { value: 'transfer', label: 'Virement' },
            ] as const).map((method) => (
              <label
                key={method.value}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === method.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
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
            <label htmlFor="checkNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Numero de cheque <span className="text-red-500">*</span>
            </label>
            <input
              id="checkNumber"
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="N de cheque"
              required
            />
          </div>
        )}

        {/* Transfer date (required for transfer) */}
        {paymentMethod === 'transfer' && (
          <div className="mb-4">
            <label htmlFor="transferRef" className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Date du virement <span className="text-red-500">*</span>
            </label>
            <input
              id="transferRef"
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Reference ou date du virement"
              required
            />
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            id="paymentNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Notes supplementaires..."
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
