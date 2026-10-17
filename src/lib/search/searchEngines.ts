import { SearchEngineId } from '@/types';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

export interface SearchEngineConfig {
  id: SearchEngineId;
  name: string;
  urlTemplate: string;
  placeholder: string;
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngineConfig> = {
  google: {
    id: 'google',
    name: 'Google',
    urlTemplate: 'https://www.google.com/search?q={query}',
    placeholder: 'Search Google or type a command...',
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q={query}',
    placeholder: 'Search DuckDuckGo privately or find notes...',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    urlTemplate: 'https://www.bing.com/search?q={query}',
    placeholder: 'Search Bing or local workspace...',
  },
  brave: {
    id: 'brave',
    name: 'Brave',
    urlTemplate: 'https://search.brave.com/search?q={query}',
    placeholder: 'Search Brave or jump to a shortcut...',
  },
  custom: {
    id: 'custom',
    name: 'Custom Engine',
    urlTemplate: 'https://www.google.com/search?q={query}',
    placeholder: 'Search custom engine or local items...',
  },
};

/**
 * Safely constructs a search URL from a query and engine selection.
 * Never executes javascript: or unsafe templates.
 */
export function buildSearchUrl(
  query: string,
  engineId: SearchEngineId,
  customTemplate?: string
): string {
  const trimmed = query.trim();
  if (!trimmed) return 'https://www.google.com';

  const encoded = encodeURIComponent(trimmed);
  let template = SEARCH_ENGINES[engineId]?.urlTemplate || SEARCH_ENGINES.google.urlTemplate;

  if (engineId === 'custom' && customTemplate && customTemplate.trim()) {
    const candidateTemplate = customTemplate.trim();
    const testUrl = candidateTemplate.replace('{query}', 'test');
    const validated = validateAndNormalizeUrl(testUrl);
    if (validated.isValid) {
      template = candidateTemplate.startsWith('http://') || candidateTemplate.startsWith('https://')
        ? candidateTemplate
        : `https://${candidateTemplate}`;
    }
  }

  if (template.includes('{query}')) {
    return template.replace('{query}', encoded);
  }

  return `${template}${encoded}`;
}
