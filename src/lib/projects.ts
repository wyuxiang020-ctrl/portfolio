import type { CollectionEntry } from 'astro:content';

// Sort by the latest year shown; preserve the original range in the UI.
// Existing editorial order is a stable tie-breaker, not an invented month.
export function compareProjectsByYear(a: CollectionEntry<'projects'>, b: CollectionEntry<'projects'>) {
  const years = (project: CollectionEntry<'projects'>) => project.data.year.match(/\d{4}/g)?.map(Number) ?? [0];
  const aYears = years(a), bYears = years(b);
  return Math.max(...bYears) - Math.max(...aYears)
    || Math.min(...bYears) - Math.min(...aYears)
    || a.data.order - b.data.order
    || a.id.localeCompare(b.id);
}
