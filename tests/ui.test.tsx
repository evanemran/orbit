import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '@/app/App';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';

describe('Orbit Dashboard UI, Keyboard Navigation & Empty States', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await useDashboardStore.getState().resetDashboardData();
    await useSettingsStore.getState().resetSettings();
    await useSettingsStore.getState().updateSettings({ onboardingCompleted: true });
  });

  it('renders greeting, clock, universal search, quick links, and active widgets', () => {
    render(<App />);
    expect(screen.getByLabelText('Universal Search')).toBeInTheDocument();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Workspace Canvas')).toBeInTheDocument();
  });

  it('supports global keyboard shortcuts (?, Ctrl+K, Escape) without intercepting text inputs', () => {
    render(<App />);

    // Press '?' to open Keyboard Shortcuts modal
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Press 'Escape' to close modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();

    // Press Ctrl+K to open Command Palette
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByLabelText('Command Palette Search')).toBeInTheDocument();

    // Close Command Palette with Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('Command Palette Search')).not.toBeInTheDocument();
  });

  it('renders helpful empty states when shortcuts or widgets are cleared', () => {
    useDashboardStore.setState({ shortcuts: [], widgets: [] });
    render(<App />);

    expect(
      screen.getByText('Your quick-links orbit is empty')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No active widgets on your canvas')
    ).toBeInTheDocument();
  });
});
