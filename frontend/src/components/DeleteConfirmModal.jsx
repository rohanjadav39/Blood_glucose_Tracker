import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { formatDisplayDate } from '../utils/dateHelpers';

export function DeleteConfirmModal({
  isOpen,
  onClose,
  reading,
  onConfirm,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!reading) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(reading.id);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Blood Glucose Reading"
      description="This action cannot be undone. Are you sure you want to remove this reading?"
    >
      <div className="my-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {reading.slot}
            </div>
            <div className="text-xs text-slate-500">
              {formatDisplayDate(reading.date)} •{' '}
              <span className="font-semibold text-rose-700">
                {reading.value} mg/dl
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          isLoading={isDeleting}
        >
          Delete Reading
        </Button>
      </div>
    </Dialog>
  );
}
