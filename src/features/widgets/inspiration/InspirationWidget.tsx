import React, { useState } from 'react';
import { Sparkles, RefreshCw, Heart, Edit3 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';

export const InspirationWidget: React.FC = () => {
  const quotes = useDashboardStore((s) => s.quotes);
  const activeQuoteIndex = useDashboardStore((s) => s.activeQuoteIndex);
  const customMotto = useDashboardStore((s) => s.customMotto);
  const nextQuote = useDashboardStore((s) => s.nextQuote);
  const toggleQuoteFavorite = useDashboardStore((s) => s.toggleQuoteFavorite);
  const setCustomMotto = useDashboardStore((s) => s.setCustomMotto);

  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [mottoDraft, setMottoDraft] = useState(customMotto);

  const currentQuote = quotes[activeQuoteIndex % Math.max(1, quotes.length)] || quotes[0];

  const handleSaveMotto = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomMotto(mottoDraft.trim());
    setIsEditingMotto(false);
  };

  return (
    <div className="space-y-3">
      {isEditingMotto ? (
        <form onSubmit={handleSaveMotto} className="space-y-2">
          <label className="block text-[11px] text-orbit-muted">
            Set a personal daily focus mantra (leave blank for curated quotes):
          </label>
          <input
            type="text"
            value={mottoDraft}
            onChange={(e) => setMottoDraft(e.target.value)}
            placeholder="e.g. Ship calmly and deliberately."
            className="w-full px-2.5 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text focus:outline-none focus:border-orbit-accent"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditingMotto(false)}
              className="px-2 py-1 text-xs text-orbit-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-medium rounded-orbit-sm bg-orbit-accent text-slate-950"
            >
              Save
            </button>
          </div>
        </form>
      ) : customMotto ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orbit-accent shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-orbit-text italic leading-relaxed">
              “{customMotto}”
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-orbit-muted">
            <span>Personal Mantra</span>
            <button
              type="button"
              onClick={() => {
                setMottoDraft(customMotto);
                setIsEditingMotto(true);
              }}
              className="inline-flex items-center gap-1 hover:text-orbit-text"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
      ) : currentQuote ? (
        <div className="space-y-2.5">
          <blockquote className="text-xs sm:text-sm text-orbit-text leading-relaxed italic">
            “{currentQuote.text}”
          </blockquote>

          <div className="flex items-center justify-between text-[11px] text-orbit-muted pt-1">
            <span>— {currentQuote.author}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleQuoteFavorite(currentQuote.id)}
                title="Favorite quote"
                aria-label="Favorite quote"
                className={`p-1 rounded-xs transition-colors ${
                  currentQuote.favorited
                    ? 'text-rose-400'
                    : 'text-orbit-muted hover:text-orbit-text'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${currentQuote.favorited ? 'fill-current' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={nextQuote}
                title="Next quote"
                aria-label="Next quote"
                className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMottoDraft(customMotto);
                  setIsEditingMotto(true);
                }}
                title="Set custom mantra"
                aria-label="Set custom mantra"
                className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
