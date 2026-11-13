/**
 * Global Application Bootstrap & Shared Component Facade
 * Re-exports store singleton and core UI module helpers for multi-page orchestration.
 */
import { state, store, Store } from './store/state.js';
import { initTheme, toggleTheme, renderNavbar } from './components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from './components/sidebar.js';
import { openModal } from './components/modal.js';
import { renderPostCard, escapeHtml, formatRelativeTime } from './components/postCard.js';

export function bootstrapShell({ basePath = '', activePage = 'feed' } = {}) {
  initTheme();

  const currentUser = state.getCurrentUser();
  if (!currentUser) return null;

  const navbarMount = document.getElementById('navbarMount');
  const sidebarMount = document.getElementById('sidebarMount');
  const mobileNavMount = document.getElementById('mobileNavMount');

  if (navbarMount) renderNavbar(navbarMount, { basePath, activePage });
  if (sidebarMount) renderSidebar(sidebarMount, { basePath, activePage });
  if (mobileNavMount) renderMobileBottomNav(mobileNavMount, { basePath, activePage });

  return currentUser;
}

export {
  state,
  store,
  Store,
  initTheme,
  toggleTheme,
  renderNavbar,
  renderSidebar,
  renderMobileBottomNav,
  openModal,
  renderPostCard,
  escapeHtml,
  formatRelativeTime
};
