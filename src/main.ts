import { App } from './app';

const app = new App();
app.boot().catch((e) => {
  console.error(e);
  const ui = document.getElementById('ui');
  if (ui) ui.innerHTML = `<div class="screen"><div class="card"><h2>Something went wrong</h2><p>${String((e as Error).message)}</p><p class="note">Your saved game has not been changed. Reload to try again.</p></div></div>`;
});
