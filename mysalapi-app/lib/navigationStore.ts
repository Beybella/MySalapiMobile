// Simple global store for cross-tab navigation intent
// Works around Expo Router's unreliable param handling for bottom tabs

type RecordsNav = {
  tab?: 'personal' | 'pautang' | 'ambagan';
  sub?: 'expenses' | 'bills' | 'given' | 'owed';
};

let pendingRecordsNav: RecordsNav | null = null;

export function setPendingRecordsNav(nav: RecordsNav) {
  pendingRecordsNav = nav;
}

export function consumePendingRecordsNav(): RecordsNav | null {
  const nav = pendingRecordsNav;
  pendingRecordsNav = null;
  return nav;
}
