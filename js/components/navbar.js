/**
 * Academic Coursework Showcase — Global Responsive Navigation Bar
 * js/components/navbar.js
 */

import { state } from '../store/state.js';

export function getBasePath() {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (path.includes('/pages/')) {
    return '../';
  }
  return '';
}

export function initTheme() {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', next);
  }
  return next;
}

export function renderNavbar(mountElement, options = {}) {
  if (!mountElement) return;

  const base = options.basePath !== undefined ? options.basePath : getBasePath();
  const currentUser = state.getCurrentUser();
  const currentTheme = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';

  // Compute unread messages count
  const conversations = state.getConversations();
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Compute pending friend requests count
  const { incoming } = state.getFriendRequests();
  const pendingRequestsCount = incoming ? incoming.length : 0;

  mountElement.innerHTML = `
    <header class="navbar" role="banner">
      <div class="navbar-container">
        <!-- Left: Brand & Mobile Hamburger Toggle -->
        <div class="navbar-left">
          <button class="navbar-toggle-btn show-mobile" id="navDrawerBtn" aria-label="Open Navigation Drawer">
            <svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
          <a href="${base}index.html" class="navbar-brand">
            <div class="navbar-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
              </svg>
            </div>
            <div class="navbar-brand-text">
              <span class="brand-title">AcademicShowcase</span>
              <span class="badge badge-primary badge-xs">Campus Network</span>
            </div>
          </a>
        </div>

        <!-- Center: Search Input Bar -->
        <div class="navbar-center">
          <form class="navbar-search" id="navbarSearchForm" role="search">
            <div class="input-group">
              <span class="input-group-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
              <input
                type="search"
                class="form-control navbar-search-input"
                id="globalSearchInput"
                placeholder="Search coursework (#CS501), projects, peers..."
                aria-label="Search coursework and peers"
                autocomplete="off"
              />
            </div>
            <div class="navbar-search-dropdown hidden" id="navbarSearchDropdown" role="listbox" aria-label="Search suggestions"></div>
          </form>
        </div>

        <!-- Right: Action Icons, Theme Switcher & User Dropdown -->
        <div class="navbar-right">
          <!-- Theme Switcher -->
          <button class="btn btn-ghost btn-icon" id="themeToggleBtn" aria-label="Toggle Light and Dark Mode" title="Toggle theme">
            <span class="theme-icon-container">
              ${currentTheme === 'dark'
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                  </svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>`}
            </span>
          </button>

          <!-- Chat Messages -->
          <a href="${base}pages/chat.html" class="btn btn-ghost btn-icon action-btn-badge" aria-label="Messages" title="Messenger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            ${totalUnreadMessages > 0 ? `<span class="nav-badge" id="chatBadge">${totalUnreadMessages}</span>` : ''}
          </a>

          <!-- Friend Requests / Notifications -->
          <a href="${base}pages/friends.html" class="btn btn-ghost btn-icon action-btn-badge" aria-label="Notifications" title="Friend Requests">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            ${pendingRequestsCount > 0 ? `<span class="nav-badge badge-warning" id="notifBadge">${pendingRequestsCount}</span>` : ''}
          </a>

          <!-- Marketplace Cart -->
          <a href="${base}pages/checkout.html" class="btn btn-ghost btn-icon hide-mobile" aria-label="Marketplace Cart" title="Checkout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </a>

          <!-- User Profile Dropdown -->
          <div class="dropdown" id="userProfileDropdown">
            <button class="user-avatar-btn" id="userMenuBtn" aria-expanded="false" aria-haspopup="true" aria-label="User Profile Menu">
              <span class="avatar avatar-sm">
                <img src="${base}${currentUser ? currentUser.avatar : 'assets/images/avatar-1.svg'}" alt="${currentUser ? currentUser.name : 'User'}" />
                <span class="avatar-status online"></span>
              </span>
            </button>
            <div class="dropdown-menu" id="userMenuDropdown" role="menu">
              <div class="user-dropdown-header">
                <strong>${currentUser ? currentUser.name : 'Student Scholar'}</strong>
                <span class="user-dropdown-sub">${currentUser ? currentUser.major : 'Computer Science'}</span>
                <span class="badge badge-course badge-xs">${currentUser ? currentUser.studentId : 'PU-2023-CS042'}</span>
              </div>
              <div class="dropdown-divider"></div>
              <a href="${base}pages/profile.html" class="dropdown-item" role="menuitem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>My Profile</span>
              </a>
              <a href="${base}pages/marketplace.html" class="dropdown-item" role="menuitem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <span>Marketplace</span>
              </a>
              <a href="${base}pages/ads-manager.html" class="dropdown-item" role="menuitem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m3 11 18-5v12L3 14v-3z"></path>
                </svg>
                <span>Ads Manager</span>
              </a>
              <div class="dropdown-divider"></div>
              <a href="${base}pages/auth.html" class="dropdown-item" role="menuitem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Switch Account / Sign In</span>
              </a>
              <button class="dropdown-item text-danger" id="logoutBtn" role="menuitem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;

  // Attach navbar styling dynamically if not already applied
  attachNavbarStyles();

  // Attach Event Listeners
  attachNavbarListeners(mountElement, base);
}

function attachNavbarListeners(mountElement, base) {
  // Mobile drawer button toggle
  const drawerBtn = mountElement.querySelector('#navDrawerBtn');
  if (drawerBtn) {
    drawerBtn.addEventListener('click', () => {
      document.body.classList.toggle('drawer-open');
    });
  }

  // Theme toggle button
  const themeBtn = mountElement.querySelector('#themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      const iconContainer = themeBtn.querySelector('.theme-icon-container');
      if (iconContainer) {
        iconContainer.innerHTML = newTheme === 'dark'
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
            </svg>`;
      }
    });
  }

  // Global search form submit & live user search autocomplete
  const searchForm = mountElement.querySelector('#navbarSearchForm');
  const searchInput = mountElement.querySelector('#globalSearchInput');
  const searchDropdown = mountElement.querySelector('#navbarSearchDropdown');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `${base}pages/friends.html?q=${encodeURIComponent(query)}`;
      }
    });

    if (searchDropdown) {
      const esc = (str) => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (!q) {
          searchDropdown.classList.add('hidden');
          searchDropdown.innerHTML = '';
          return;
        }
        const matches = typeof state.searchUsers === 'function' ? state.searchUsers(q).slice(0, 5) : [];
        if (matches.length === 0) {
          searchDropdown.innerHTML = `
            <div class="search-dropdown-empty">No peers matching "${esc(q)}"</div>
            <a href="${base}pages/friends.html?q=${encodeURIComponent(q)}" class="search-dropdown-footer">Search full directory &rarr;</a>
          `;
        } else {
          searchDropdown.innerHTML = `
            ${matches.map((u) => {
              const av = u.avatar && !u.avatar.startsWith('http') && !u.avatar.startsWith('..') ? `${base}${u.avatar}` : (u.avatar || `${base}assets/images/avatar-1.svg`);
              return `
                <a href="${base}pages/profile.html?userId=${esc(u.id)}" class="search-dropdown-item" role="option">
                  <span class="avatar avatar-xs"><img src="${esc(av)}" alt="${esc(u.name)}" /></span>
                  <div class="search-dropdown-meta">
                    <span class="search-dropdown-name">${esc(u.name)}</span>
                    <span class="search-dropdown-sub">${esc(u.major || 'Computer Science')} &bull; ${esc(u.studentId || '')}</span>
                  </div>
                </a>
              `;
            }).join('')}
            <a href="${base}pages/friends.html?q=${encodeURIComponent(q)}" class="search-dropdown-footer">See all results for "${esc(q)}" &rarr;</a>
          `;
        }
        searchDropdown.classList.remove('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
          searchDropdown.classList.add('hidden');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchDropdown.classList.add('hidden');
        }
      });
    }
  }

  // User Dropdown toggle
  const userBtn = mountElement.querySelector('#userMenuBtn');
  const dropdownParent = mountElement.querySelector('#userProfileDropdown');
  if (userBtn && dropdownParent) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownParent.classList.toggle('open');
      const expanded = dropdownParent.classList.contains('open');
      userBtn.setAttribute('aria-expanded', expanded);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdownParent.contains(e.target)) {
        dropdownParent.classList.remove('open');
        userBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownParent.classList.contains('open')) {
        dropdownParent.classList.remove('open');
        userBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Logout action
  const logoutBtn = mountElement.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.logout();
      window.location.href = `${base}pages/auth.html`;
    });
  }
}

function attachNavbarStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('navbar-inline-styles')) return;

  const style = document.createElement('style');
  style.id = 'navbar-inline-styles';
  style.textContent = `
    .navbar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      height: var(--navbar-height);
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      z-index: var(--z-index-sticky);
      box-shadow: var(--shadow-xs);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      max-width: var(--max-content-width);
      margin: 0 auto;
      padding: 0 var(--space-4);
      gap: var(--space-4);
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .navbar-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      color: var(--text-primary);
      border-radius: var(--radius-md);
    }
    .navbar-toggle-btn:hover {
      background-color: var(--bg-surface-hover);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--text-primary);
    }
    .navbar-brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background-color: var(--color-primary);
      color: #ffffff;
    }
    .navbar-brand-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .brand-title {
      font-size: var(--font-base);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.3px;
    }
    .navbar-center {
      flex: 1;
      max-width: 520px;
    }
    .navbar-search {
      width: 100%;
      position: relative;
    }
    .navbar-search-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-index-dropdown);
      overflow: hidden;
    }
    .navbar-search-dropdown.hidden {
      display: none;
    }
    .search-dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      text-decoration: none;
      color: var(--text-primary);
      transition: background-color var(--transition-fast);
    }
    .search-dropdown-item:hover {
      background-color: var(--bg-surface-hover);
    }
    .search-dropdown-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .search-dropdown-name {
      font-size: var(--font-sm);
      font-weight: var(--font-weight-semibold);
    }
    .search-dropdown-sub {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }
    .search-dropdown-empty {
      padding: var(--space-3);
      font-size: var(--font-xs);
      color: var(--text-muted);
      text-align: center;
    }
    .search-dropdown-footer {
      display: block;
      padding: var(--space-2) var(--space-3);
      border-top: 1px solid var(--border-color-light);
      font-size: var(--font-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
      text-align: center;
      text-decoration: none;
      background-color: var(--bg-surface-subtle);
    }
    .search-dropdown-footer:hover {
      background-color: var(--bg-surface-hover);
    }
    .navbar-search-input {
      border-radius: var(--radius-full);
      background-color: var(--bg-surface-subtle);
      border-color: var(--border-color);
    }
    .navbar-right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .action-btn-badge {
      position: relative;
    }
    .nav-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: var(--color-danger);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      height: 18px;
      min-width: 18px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid var(--bg-surface);
    }
    .user-avatar-btn {
      padding: 2px;
      border-radius: var(--radius-full);
      cursor: pointer;
    }
    .user-dropdown-header {
      padding: var(--space-3) var(--space-4);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-dropdown-sub {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }
    .badge-xs {
      font-size: 10px;
      padding: 1px 6px;
    }
    .text-danger {
      color: var(--color-danger) !important;
    }
    .text-danger:hover {
      background-color: var(--color-danger-50) !important;
    }
    @media (max-width: 768px) {
      .navbar-center {
        display: none;
      }
      .brand-title {
        font-size: var(--font-sm);
      }
      .navbar-container {
        padding: 0 var(--space-2);
        gap: var(--space-2);
      }
      .navbar-left {
        gap: var(--space-2);
        min-width: 0;
        flex: 1 1 auto;
      }
      .navbar-right {
        gap: 2px;
        flex-shrink: 0;
      }
      .navbar-right .btn-icon {
        width: 44px;
        height: 44px;
      }
    }
    @media (max-width: 480px) {
      .navbar-brand-text {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}
