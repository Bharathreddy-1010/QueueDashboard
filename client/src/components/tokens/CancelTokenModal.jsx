import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';

export const CancelTokenModal = ({ isOpen, onClose, token, onConfirmCancel }) => {
  const [reason, setReason] = useState('Customer had to leave');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmCancel(token._id, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Queue Token"
      description="This action will remove the customer from the active queue."
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Cancel Confirmation</span>
          </div>
          <p>
            Are you sure you want to cancel token{' '}
            <strong className="font-mono text-sm text-rose-900 font-extrabold">{token.tokenNumber}</strong> for{' '}
            <strong>{token.customerName}</strong>?
          </p>
        </div>

        <Input
          label="Cancellation Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer requested cancellation, no-show, etc."
          variant="light"
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Keep Token
          </Button>
          <Button
            variant="dangerSolid"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
