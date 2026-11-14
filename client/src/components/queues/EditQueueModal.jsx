import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Save } from 'lucide-react';

export const EditQueueModal = ({ isOpen, onClose, queue, onUpdateQueue }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [prefix, setPrefix] = useState('T');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (queue) {
      setName(queue.name || '');
      setDescription(queue.description || '');
      setStatus(queue.status || 'ACTIVE');
      setPrefix(queue.prefix || 'T');
    }
  }, [queue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateQueue(queue._id, {
        name: name.trim(),
        description: description.trim(),
        status,
        prefix: prefix.trim().toUpperCase(),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!queue) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Queue Settings"
      description={`Update settings for ${queue.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Queue Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          required
          variant="light"
          error={error}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Token Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            maxLength={5}
            variant="light"
          />

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-[#3E4343]">
              Queue Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#DDD8CE] bg-white text-[#050606] focus:border-[#050606] focus:ring-2 focus:ring-black/10 outline-none transition-colors"
            >
              <option value="ACTIVE">ACTIVE (Accepting)</option>
              <option value="INACTIVE">INACTIVE (Paused)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-[#3E4343]">
            Description
          </label>
          <textarea
            rows={3}
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
            icon={Save}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
