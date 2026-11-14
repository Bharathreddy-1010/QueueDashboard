import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LiveTimerDisplay } from '../../hooks/useLiveTimer';
import {
  ChevronUp,
  ChevronDown,
  XCircle,
  Play,
  UserPlus,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

export const QueueOverviewTable = ({
  tokens = [],
  queueName,
  queueStatus,
  onMoveUp,
  onMoveDown,
  onCancel,
  onServeNext,
  onAddPerson,
  isServingLoading = false,
}) => {
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');

  return (
    <div className="bg-[#F5F3EF] text-[#050606] rounded-2xl border border-[#DDD8CE] shadow-sm overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="p-5 border-b border-[#E2DDD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-[#050606] tracking-tight">
              {queueName || 'Queue Overview'}
            </h3>
            {queueStatus && <Badge status={queueStatus} />}
          </div>
          <p className="text-xs text-[#626868] mt-0.5">
            {waitingTokens.length} customer{waitingTokens.length === 1 ? '' : 's'} waiting in line
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            onClick={onAddPerson}
          >
            Add Person
          </Button>

          <Button
            variant="accent"
            size="sm"
            icon={Play}
            onClick={onServeNext}
            isLoading={isServingLoading}
            disabled={waitingTokens.length === 0 || isServingLoading}
            className="glow-accent-sm"
          >
            Serve Next
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#ECE9E2] text-[#4A5050] text-[11px] font-bold uppercase tracking-wider border-b border-[#DDD8CE]">
            <tr>
              <th className="py-3 px-5 w-12">#</th>
              <th className="py-3 px-5">Token</th>
              <th className="py-3 px-5">Customer Name</th>
              <th className="py-3 px-5">Waiting Time</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6]">
            {waitingTokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#7A8080]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#ECE9E2] flex items-center justify-center text-[#4A5050]">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-[#050606]">Queue is clear!</p>
                    <p className="text-xs">No customers are currently waiting in line.</p>
                    <Button
                      variant="accent"
                      size="sm"
                      icon={UserPlus}
                      onClick={onAddPerson}
                      className="mt-2"
                    >
                      Add First Customer
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              waitingTokens.map((token, index) => {
                const isFirst = index === 0;
                const isLast = index === waitingTokens.length - 1;

                return (
                  <tr
                    key={token._id}
                    className="hover:bg-[#ECE9E2]/60 transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#626868]">
                      {token.position || index + 1}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-[#050606] px-2.5 py-1 rounded-lg bg-[#ECE9E2] border border-[#DDD8CE]">
                        {token.tokenNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#050606]">{token.customerName}</div>
                      {token.phoneNumber && (
                        <div className="text-[11px] text-[#7A8080]">{token.phoneNumber}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-xs text-[#050606] font-mono">
                      <div className="flex items-center gap-1.5 text-[#3A4040]">
                        <Clock className="w-3.5 h-3.5 text-[#626868]" />
                        <LiveTimerDisplay startTime={token.createdAt} />
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <Badge status={token.status} />
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => onMoveUp(token._id)}
                          disabled={isFirst}
                          title={isFirst ? 'Already at top' : 'Move up in queue'}
                          className="p-1.5 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] hover:text-[#050606] hover:bg-[#ECE9E2] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => onMoveDown(token._id)}
                          disabled={isLast}
                          title={isLast ? 'Already at bottom' : 'Move down in queue'}
                          className="p-1.5 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] hover:text-[#050606] hover:bg-[#ECE9E2] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Cancel Token */}
                        <button
                          type="button"
                          onClick={() => onCancel(token)}
                          title="Cancel token"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors ml-1"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden divide-y divide-[#E4E0D6]">
        {waitingTokens.length === 0 ? (
          <div className="py-8 text-center text-[#7A8080] p-4">
            <p className="font-semibold text-sm text-[#050606]">Queue is clear!</p>
            <p className="text-xs mt-1">No customers currently waiting.</p>
          </div>
        ) : (
          waitingTokens.map((token, index) => {
            const isFirst = index === 0;
            const isLast = index === waitingTokens.length - 1;

            return (
              <div key={token._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#626868]">
                      #{token.position || index + 1}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#050606] px-2 py-0.5 rounded bg-[#ECE9E2] border border-[#DDD8CE]">
                      {token.tokenNumber}
                    </span>
                  </div>
                  <Badge status={token.status} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#050606]">{token.customerName}</h4>
                    {token.phoneNumber && (
                      <p className="text-xs text-[#7A8080]">{token.phoneNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#3A4040]">
                    <Clock className="w-3.5 h-3.5 text-[#626868]" />
                    <LiveTimerDisplay startTime={token.createdAt} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onMoveUp(token._id)}
                    disabled={isFirst}
                    className="p-2 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMoveDown(token._id)}
                    disabled={isLast}
                    className="p-2 rounded-lg border border-[#DDD8CE] bg-white text-[#4A5050] disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onCancel(token)}
                    className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
