// Small inline icons (original SVG). Always paired with words in the UI.
const svg = (body: string) => `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="#1e1626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICON = {
  cash: svg('<rect x="2" y="5" width="16" height="10" rx="2" fill="#f2c94c"/><circle cx="10" cy="10" r="2.5"/>'),
  hire: svg('<circle cx="8" cy="6" r="3" fill="#5ff0d4"/><path d="M2 17c0-4 3-6 6-6s6 2 6 6" fill="#5ff0d4"/><path d="M16 5v6M13 8h6"/>'),
  upgrade: svg('<path d="M4 11l6-6 6 6M4 16l6-6 6 6"/>'),
  wrench: svg('<path d="M13 3a4 4 0 0 0-4 5L3 14l3 3 6-6a4 4 0 0 0 5-4l-2 2-3-1-1-3z" fill="#c4733b"/>'),
  box: svg('<path d="M3 6l7-3 7 3v8l-7 3-7-3z" fill="#e9d8ad"/><path d="M3 6l7 3 7-3M10 9v8"/>'),
  build: svg('<rect x="3" y="9" width="14" height="5" fill="#a8714a"/><path d="M5 14v3M15 14v3M10 3v4M8 5h4"/>'),
  clock: svg('<circle cx="10" cy="10" r="7" fill="#f4e8c8"/><path d="M10 6v4l3 2"/>'),
  trolley: svg('<path d="M3 4h3l2 9h8"/><circle cx="9" cy="16" r="1.5"/><circle cx="15" cy="16" r="1.5"/><rect x="8" y="6" width="8" height="5" fill="#e9d8ad"/>'),
  alert: svg('<path d="M10 2l8 15H2z" fill="#f2c94c"/><path d="M10 8v4M10 15v.1"/>'),
  door: svg('<rect x="5" y="2" width="10" height="16" fill="#a8714a"/><circle cx="12" cy="10" r="1"/>'),
  key: svg('<circle cx="6" cy="10" r="3.5" fill="#f2c94c"/><path d="M9.5 10H18M15 10v3M17 10v2"/>'),
  shelf: svg('<path d="M3 3v14M17 3v14M3 7h14M3 12h14M3 17h14"/>'),
  pause: svg('<path d="M7 4v12M13 4v12"/>'),
  chart: svg('<path d="M3 17h14"/><rect x="4" y="9" width="3" height="7" fill="#5ff0d4"/><rect x="9" y="5" width="3" height="11" fill="#f2c94c"/><rect x="14" y="11" width="3" height="5" fill="#c4733b"/>'),
  close: svg('<path d="M5 5l10 10M15 5L5 15"/>'),
  blank: svg('<rect x="4" y="5" width="12" height="10" rx="1" fill="#8e85a8"/>'),
  sleeve: svg('<rect x="4" y="5" width="12" height="10" rx="1" fill="#f3e7c9"/><path d="M4 10h12"/>'),
  person: svg('<circle cx="10" cy="6" r="3"/><path d="M4 17c0-4 3-6 6-6s6 2 6 6"/>')
};
