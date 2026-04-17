'use client';

import { useState, useTransition } from 'react';
import { suspendUser, unsuspendUser, resetUserPassword } from '../actions';

interface Props {
  userId: string;
  isBanned: boolean;
}

export default function UserActions({ userId, isBanned }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSuspend() {
    if (!reason.trim()) {
      alert('Please provide a reason.');
      return;
    }
    startTransition(async () => {
      try {
        await suspendUser(userId, reason.trim());
        alert('User suspended.');
        setShowModal(false);
        setReason('');
      } catch (e: any) {
        alert(`Error: ${e.message || e}`);
      }
    });
  }

  function handleUnsuspend() {
    if (!confirm('Unsuspend this user?')) return;
    startTransition(async () => {
      try {
        await unsuspendUser(userId);
        alert('User unsuspended.');
      } catch (e: any) {
        alert(`Error: ${e.message || e}`);
      }
    });
  }

  function handleResetPassword() {
    if (!confirm('Send password reset link to this user?')) return;
    startTransition(async () => {
      try {
        await resetUserPassword(userId);
        alert('Password reset link generated (check audit log / user email).');
      } catch (e: any) {
        alert(`Error: ${e.message || e}`);
      }
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Actions</h2>
            <p className="text-xs text-gray-500">Moderation and account tools</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isBanned ? (
              <button
                type="button"
                onClick={handleUnsuspend}
                disabled={pending}
                className="text-xs px-3 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
              >
                Unsuspend User
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={pending}
                className="text-xs px-3 py-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                Suspend User
              </button>
            )}
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={pending}
              className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Send Password Reset
            </button>
          </div>
        </div>
        {isBanned && (
          <p className="text-xs text-red-600 mt-3">This account is currently suspended.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-2">Suspend User</h3>
            <p className="text-sm text-gray-500 mb-4">
              Provide a reason (stored in audit log).
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="Reason for suspension..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                }}
                disabled={pending}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                disabled={pending}
                className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {pending ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
