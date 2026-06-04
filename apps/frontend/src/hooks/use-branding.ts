'use client';

import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';

export interface Branding {
  schoolName: string;
  logoUrl: string | null;
}

// Module-level cache so we fetch the public settings only once per page load.
let cache: Branding | null = null;
let inflight: Promise<Branding> | null = null;

async function load(): Promise<Branding> {
  if (cache) return cache;
  if (!inflight) {
    inflight = settingsService
      .get()
      .then((s) => {
        cache = { schoolName: s.schoolName || 'School ERP', logoUrl: s.logoUrl || null };
        return cache;
      })
      .catch(() => ({ schoolName: 'School ERP', logoUrl: null }));
  }
  return inflight;
}

/** Returns the school name + logo (or null while loading). Public endpoint, no auth needed. */
export function useBranding(): Branding | null {
  const [branding, setBranding] = useState<Branding | null>(cache);

  useEffect(() => {
    let active = true;
    load().then((b) => {
      if (active) setBranding(b);
    });
    return () => {
      active = false;
    };
  }, []);

  return branding;
}
