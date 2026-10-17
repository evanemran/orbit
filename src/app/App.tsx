import React, { useEffect } from 'react';
import { AppProviders } from '@/app/providers';
import { BackgroundLayer } from '@/components/layout/BackgroundLayer';
import { TopNav } from '@/components/layout/TopNav';
import { GreetingClock } from '@/features/dashboard/GreetingClock';
import { UniversalSearch } from '@/features/search/UniversalSearch';
import { QuickLinksGrid } from '@/features/shortcuts/QuickLinksGrid';
import { WidgetCanvas } from '@/features/widgets/WidgetCanvas';
import { WidgetLibraryDrawer } from '@/features/widgets/WidgetLibraryDrawer';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { CommandPalette } from '@/features/command-palette/CommandPalette';
import { ShortcutsHelpModal } from '@/features/command-palette/ShortcutsHelpModal';
import { OnboardingModal } from '@/features/onboarding/OnboardingModal';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';

export const App: React.FC = () => {
  const hydrateSettings = useSettingsStore((s) => s.hydrateSettings);
  const settingsHydrated = useSettingsStore((s) => s.isHydrated);
  const searchBarPlacement = useSettingsStore(
    (s) => s.settings.searchBarPlacement
  );
  const density = useSettingsStore((s) => s.settings.density);

  const hydrateDashboard = useDashboardStore((s) => s.hydrateDashboard);
  const dashboardHydrated = useDashboardStore((s) => s.isHydrated);

  useEffect(() => {
    void hydrateSettings();
    void hydrateDashboard();
  }, [hydrateSettings, hydrateDashboard]);

  const verticalGap = density === 'compact' ? 'space-y-5' : 'space-y-7';

  return (
    <AppProviders>
      <div className="min-h-screen flex flex-col relative text-orbit-text">
        <BackgroundLayer />
        <TopNav />

        <main
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-12 ${verticalGap}`}
        >
          {!settingsHydrated && !dashboardHydrated ? (
            <div className="space-y-6 py-10 animate-pulse">
              <div className="h-14 w-64 mx-auto rounded-orbit bg-orbit-card/60" />
              <div className="h-12 max-w-2xl mx-auto rounded-orbit bg-orbit-card/60" />
            </div>
          ) : (
            <>
              {searchBarPlacement === 'top' ? (
                <>
                  <UniversalSearch />
                  <GreetingClock />
                </>
              ) : (
                <>
                  <GreetingClock />
                  <UniversalSearch />
                </>
              )}

              <QuickLinksGrid />
              <WidgetCanvas />
            </>
          )}
        </main>

        {/* Modals, Drawers & Overlays */}
        <WidgetLibraryDrawer />
        <SettingsModal />
        <CommandPalette />
        <ShortcutsHelpModal />
        <OnboardingModal />
        <ToastContainer />
      </div>
    </AppProviders>
  );
};

export default App;
