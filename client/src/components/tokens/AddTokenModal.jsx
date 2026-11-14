import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { UserPlus, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export const AddTokenModal = ({ isOpen, onClose, onAddToken, queueName }) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddToken({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setCustomerName('');
      setPhoneNumber('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue token');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Person to Queue"
      description={queueName ? `Adding to ${queueName}` : 'Issue a new queue token number'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Customer Name"
          placeholder="e.g. Rahul Sharma"
          icon={User}
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (error) setError('');
          }}
          required
          autoFocus
          variant="light"
          error={error}
        />

        <Input
          label="Phone Number (Optional)"
          placeholder="e.g. +1 (555) 012-3456"
          icon={Phone}
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          variant="light"
          helperText="SMS notifications can be delivered if phone is provided"
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            icon={UserPlus}
            isLoading={isSubmitting}
          >
            Issue Token
          </Button>
        </div>
      </form>
    </Modal>
  );
};
