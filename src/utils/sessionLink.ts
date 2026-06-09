export type SessionPlatform = 'zoom' | 'teams' | 'meet' | 'webex' | 'youtube' | 'generic';

export interface ParsedSessionLink {
  url: string;
  platform: SessionPlatform;
  label: string;
  embedBlocked: boolean;
}

const PLATFORM_RULES: Array<{ platform: SessionPlatform; label: string; patterns: RegExp[]; embedBlocked?: boolean }> = [
  { platform: 'zoom', label: 'Zoom', patterns: [/zoom\.us/i, /zoom\.com/i], embedBlocked: true },
  { platform: 'teams', label: 'Microsoft Teams', patterns: [/teams\.microsoft\.com/i, /teams\.live\.com/i], embedBlocked: true },
  { platform: 'meet', label: 'Google Meet', patterns: [/meet\.google\.com/i], embedBlocked: true },
  { platform: 'webex', label: 'Webex', patterns: [/webex\.com/i], embedBlocked: true },
  { platform: 'youtube', label: 'YouTube Live', patterns: [/youtube\.com/i, /youtu\.be/i], embedBlocked: true },
];

export function normalizeSessionLink(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseSessionLink(raw: string): ParsedSessionLink | null {
  const normalized = normalizeSessionLink(raw);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    for (const rule of PLATFORM_RULES) {
      if (rule.patterns.some(pattern => pattern.test(url.hostname) || pattern.test(url.href))) {
        return {
          url: url.toString(),
          platform: rule.platform,
          label: rule.label,
          embedBlocked: rule.embedBlocked ?? true,
        };
      }
    }

    return {
      url: url.toString(),
      platform: 'generic',
      label: 'Online Session',
      embedBlocked: true,
    };
  } catch {
    return null;
  }
}

export function isValidSessionLink(raw: string): boolean {
  return parseSessionLink(raw) !== null;
}
