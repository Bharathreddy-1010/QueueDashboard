import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Layers, Plus } from 'lucide-react';

export const CreateQueueModal = ({ isOpen, onClose, onCreateQueue }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('T');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreateQueue({
        name: name.trim(),
        description: description.trim(),
        prefix: prefix.trim().toUpperCase() || 'T',
      });
      setName('');
      setDescription('');
      setPrefix('T');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Service Queue"
      description="Configure a new queue for your team to manage and track."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Queue Name"
          placeholder="e.g. Billing Support & Returns"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          required
          autoFocus
          variant="light"
          error={error}
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Input
              label="Token Prefix"
              placeholder="e.g. B"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              maxLength={5}
              variant="light"
              helperText="E.g. T, A, VIP"
            />
          </div>
          <div className="col-span-2">
            <div className="pt-6 text-xs text-[#626868]">
              Tokens will be generated as <span className="font-mono font-bold text-[#050606]">{prefix || 'T'}001</span>, <span className="font-mono font-bold text-[#050606]">{prefix || 'T'}002</span>...
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-[#3E4343]">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Brief details about what services are provided at this queue counter..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#DDD8CE] bg-white text-[#050606] placeholder-[#8E9393] focus:border-[#050606] focus:ring-2 focus:ring-black/10 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            icon={Plus}
            isLoading={isSubmitting}
          >
            Create Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
