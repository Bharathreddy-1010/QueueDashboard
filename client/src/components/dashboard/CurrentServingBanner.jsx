import React from 'react';
import { Button } from '../common/Button';
import { LiveTimerDisplay } from '../../hooks/useLiveTimer';
import { UserCheck, Clock, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

export const CurrentServingBanner = ({
  token,
  waitingCount = 0,
  onServeNext,
  onComplete,
  onCancel,
  isServingLoading = false,
  isCompleteLoading = false,
}) => {
  if (!token) {
    return (
      <div className="bg-[#131616] border border-[#272D2D] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#0D0F0F] border border-[#272D2D] text-[#C8FF00] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#F5F3EF]">Service Counter Ready</h4>
            <p className="text-xs text-[#8E9393] mt-0.5">
              {waitingCount > 0
                ? `${waitingCount} customer${waitingCount === 1 ? '' : 's'} waiting in line to be served.`
                : 'No customers currently waiting in line.'}
            </p>
          </div>
        </div>

        <Button
          variant="accent"
          size="lg"
          icon={ArrowRight}
          onClick={onServeNext}
          isLoading={isServingLoading}
          disabled={waitingCount === 0 || isServingLoading}
          className="w-full sm:w-auto glow-accent"
        >
          Serve Next Customer
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#131616] border-2 border-[#00C8FF]/40 rounded-2xl p-6 shadow-soft relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#00C8FF]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Currently Serving
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#8E9393] font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Elapsed:</span>
                <span className="text-[#F5F3EF] font-semibold">
                  <LiveTimerDisplay startTime={token.calledAt} />
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-[#F5F3EF] tracking-tight">
                {token.tokenNumber}
              </span>
              <h3 className="text-xl font-bold text-[#F5F3EF]">{token.customerName}</h3>
              {token.phoneNumber && (
                <span className="text-xs text-[#8E9393] hidden sm:inline">
                  {token.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            size="md"
            icon={XCircle}
            onClick={() => onCancel(token)}
            disabled={isCompleteLoading}
          >
            Cancel Token
          </Button>

          <Button
            variant="accent"
            size="md"
            icon={CheckCircle2}
            onClick={() => onComplete(token)}
            isLoading={isCompleteLoading}
            className="glow-accent"
          >
            Mark Completed
          </Button>

          {waitingCount > 0 && (
            <Button
              variant="outline"
              size="md"
              icon={ArrowRight}
              onClick={onServeNext}
              isLoading={isServingLoading}
              title="Finish current and serve next customer"
            >
              Serve Next ({waitingCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
