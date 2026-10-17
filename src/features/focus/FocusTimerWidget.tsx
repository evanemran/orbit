import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { formatDurationMs } from '@/lib/formatting/utils';
import { FocusMode } from '@/types';

export const FocusTimerWidget: React.FC = () => {
  const focusTimer = useDashboardStore((s) => s.focusTimer);
  const startFocusTimer = useDashboardStore((s) => s.startFocusTimer);
  const pauseFocusTimer = useDashboardStore((s) => s.pauseFocusTimer);
  const resetFocusTimer = useDashboardStore((s) => s.resetFocusTimer);
  const switchFocusMode = useDashboardStore((s) => s.switchFocusMode);
  const updateFocusDurations = useDashboardStore((s) => s.updateFocusDurations);
  const syncFocusTimerWithNow = useDashboardStore((s) => s.syncFocusTimerWithNow);

  const [now, setNow] = useState(() => Date.now());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [focusInput, setFocusInput] = useState(focusTimer.focusMinutes);
  const [shortInput, setShortInput] = useState(focusTimer.shortBreakMinutes);
  const [longInput, setLongInput] = useState(focusTimer.longBreakMinutes);

  useEffect(() => {
    syncFocusTimerWithNow(Date.now());
    if (!focusTimer.isRunning) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      syncFocusTimerWithNow(current);
    }, 250);

    return () => clearInterval(interval);
  }, [focusTimer.isRunning, focusTimer.targetEndTime, syncFocusTimerWithNow]);

  const remainingMs =
    focusTimer.isRunning && focusTimer.targetEndTime
      ? Math.max(0, focusTimer.targetEndTime - now)
      : focusTimer.remainingMsOnPause;

  const totalModeMs =
    (focusTimer.mode === 'focus'
      ? focusTimer.focusMinutes
      : focusTimer.mode === 'shortBreak'
      ? focusTimer.shortBreakMinutes
      : focusTimer.longBreakMinutes) *
    60 *
    1000;

  const progressPct =
    totalModeMs > 0
      ? Math.min(100, Math.max(0, ((totalModeMs - remainingMs) / totalModeMs) * 100))
      : 0;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateFocusDurations(
      Number(focusInput) || 25,
      Number(shortInput) || 5,
      Number(longInput) || 15
    );
    setIsConfiguring(false);
  };

  const modes: Array<{ id: FocusMode; label: string }> = [
    { id: 'focus', label: 'Focus' },
    { id: 'shortBreak', label: 'Short Break' },
    { id: 'longBreak', label: 'Long Break' },
  ];

  return (
    <div className="space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-orbit-secondary/80 p-1 rounded-orbit-sm">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchFocusMode(m.id)}
              className={`px-2 py-0.5 text-[11px] rounded-xs transition-colors ${
                focusTimer.mode === m.id
                  ? 'bg-orbit-accent text-slate-950 font-medium'
                  : 'text-orbit-muted hover:text-orbit-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setFocusInput(focusTimer.focusMinutes);
            setShortInput(focusTimer.shortBreakMinutes);
            setLongInput(focusTimer.longBreakMinutes);
            setIsConfiguring((v) => !v);
          }}
          title="Customize timer durations"
          aria-label="Configure timer durations"
          className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isConfiguring ? (
        <form
          onSubmit={handleSaveConfig}
          className="p-2.5 rounded-orbit-sm bg-orbit-secondary/70 border border-orbit-border space-y-2"
        >
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <label className="space-y-1">
              <span className="text-orbit-muted block">Focus (m)</span>
              <input
                type="number"
                min={1}
                max={120}
                value={focusInput}
                onChange={(e) => setFocusInput(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
              />
            </label>
            <label className="space-y-1">
              <span className="text-orbit-muted block">Short (m)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={shortInput}
                onChange={(e) => setShortInput(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
              />
            </label>
            <label className="space-y-1">
              <span className="text-orbit-muted block">Long (m)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={longInput}
                onChange={(e) => setLongInput(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-xs bg-orbit-main border border-orbit-border text-orbit-text"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-medium rounded-xs bg-orbit-accent text-slate-950"
            >
              Apply Durations
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Timer Display */}
          <div className="text-center py-2 space-y-2">
            <div
              data-testid="focus-timer-display"
              className="text-3xl font-semibold tracking-tight text-orbit-text tabular-nums"
            >
              {formatDurationMs(remainingMs)}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-orbit-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-orbit-accent transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-orbit-muted tabular-nums">
              Sessions: {focusTimer.completedSessions}
            </span>

            <div className="flex items-center gap-1.5">
              {focusTimer.isRunning ? (
                <button
                  type="button"
                  onClick={pauseFocusTimer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startFocusTimer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90 transition-opacity"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {remainingMs < totalModeMs ? 'Resume' : 'Start'}
                </button>
              )}

              <button
                type="button"
                onClick={resetFocusTimer}
                title="Reset timer"
                aria-label="Reset focus timer"
                className="p-1.5 rounded-orbit-sm bg-orbit-secondary text-orbit-muted hover:text-orbit-text transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
