/**
 * Academic Coursework Showcase — Navigation Sidebar & Mobile Drawer Component
 * js/components/sidebar.js
 */

import { state } from '../store/state.js';
import { getBasePath } from './navbar.js';

export function renderSidebar(mountElement, options = {}) {
  if (!mountElement) return;

  const base = options.basePath !== undefined ? options.basePath : getBasePath();
  const activePage = options.activePage || 'feed';
  const currentUser = state.getCurrentUser();

  mountElement.innerHTML = `
    <nav class="sidebar-nav" aria-label="Main Navigation">
      <!-- Mobile Drawer Header -->
      <div class="sidebar-drawer-header show-mobile">
        <div class="flex items-center gap-2">
          <span class="avatar avatar-sm">
            <img src="${base}${currentUser ? currentUser.avatar : 'assets/images/avatar-1.svg'}" alt="${currentUser ? currentUser.name : 'User'}" />
          </span>
          <div class="flex flex-col">
            <strong class="font-sm">${currentUser ? currentUser.name : 'Student Scholar'}</strong>
            <span class="font-xs text-muted">${currentUser ? currentUser.major : 'Computer Science'}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon-sm" id="sidebarCloseBtn" aria-label="Close Navigation Drawer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Navigation</div>
        <ul class="sidebar-menu">
          <li>
            <a href="${base}index.html" class="sidebar-link ${activePage === 'feed' ? 'active' : ''}" data-nav="feed">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </span>
              <span class="sidebar-label">Feed &amp; Wall</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/profile.html" class="sidebar-link ${activePage === 'profile' ? 'active' : ''}" data-nav="profile">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span class="sidebar-label">User Profile</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/friends.html" class="sidebar-link ${activePage === 'friends' ? 'active' : ''}" data-nav="friends">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span class="sidebar-label">Friends &amp; Search</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/chat.html" class="sidebar-link ${activePage === 'chat' ? 'active' : ''}" data-nav="chat">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span class="sidebar-label">Chat Messenger</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/groups.html" class="sidebar-link ${activePage === 'groups' ? 'active' : ''}" data-nav="groups">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span class="sidebar-label">Academic Groups</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/marketplace.html" class="sidebar-link ${activePage === 'marketplace' ? 'active' : ''}" data-nav="marketplace">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  <path d="M2 9h20"></path>
                </svg>
              </span>
              <span class="sidebar-label">Marketplace</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/ads-manager.html" class="sidebar-link ${activePage === 'ads' ? 'active' : ''}" data-nav="ads">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m3 11 18-5v12L3 14v-3z"></path>
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                </svg>
              </span>
              <span class="sidebar-label">Ads Manager</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/checkout.html" class="sidebar-link ${activePage === 'checkout' ? 'active' : ''}" data-nav="checkout">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
              </span>
              <span class="sidebar-label">Checkout</span>
            </a>
          </li>
          <li>
            <a href="${base}pages/auth.html" class="sidebar-link ${activePage === 'auth' ? 'active' : ''}" data-nav="auth">
              <span class="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </span>
              <span class="sidebar-label">Sign In / Switch</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Coursework Subject Tags -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Coursework Tags</div>
        <div class="coursework-tag-cloud">
          <a href="${base}index.html?filter=CS501" class="badge badge-course coursework-tag">#CS501</a>
          <a href="${base}index.html?filter=AI602" class="badge badge-course coursework-tag">#AI602</a>
          <a href="${base}index.html?filter=WT301" class="badge badge-course coursework-tag">#WT301</a>
          <a href="${base}index.html?filter=BIO420" class="badge badge-course coursework-tag">#BIO420</a>
          <a href="${base}index.html?filter=SEC550" class="badge badge-course coursework-tag">#SEC550</a>
          <a href="${base}index.html?filter=ROB401" class="badge badge-course coursework-tag">#ROB401</a>
          <a href="${base}index.html?filter=Thesis" class="badge badge-secondary coursework-tag">#Thesis</a>
          <a href="${base}index.html?filter=MachineLearning" class="badge badge-accent coursework-tag">#MachineLearning</a>
        </div>
      </div>

      <!-- Campus Footer Note -->
      <div class="sidebar-footer">
        <p class="font-xs text-muted">
          Academic Coursework Showcase &copy; 2026<br/>
          Zero-Dependency Vanilla Frontend
        </p>
      </div>
    </nav>
  `;

  // Attach backdrop and drawer dismissal listeners
  ensureBackdrop();
  attachSidebarListeners(mountElement);
  attachSidebarStyles();
}

export function renderMobileBottomNav(mountElement, options = {}) {
  if (!mountElement) return;

  const base = options.basePath !== undefined ? options.basePath : getBasePath();
  const activePage = options.activePage || 'feed';

  mountElement.innerHTML = `
    <nav class="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <a href="${base}index.html" class="mobile-bottom-nav-item ${activePage === 'feed' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Feed</span>
      </a>
      <a href="${base}pages/friends.html" class="mobile-bottom-nav-item ${activePage === 'friends' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Friends</span>
      </a>
      <a href="${base}pages/chat.html" class="mobile-bottom-nav-item ${activePage === 'chat' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Chat</span>
      </a>
      <a href="${base}pages/groups.html" class="mobile-bottom-nav-item ${activePage === 'groups' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Groups</span>
      </a>
      <a href="${base}pages/profile.html" class="mobile-bottom-nav-item ${activePage === 'profile' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Profile</span>
      </a>
    </nav>
  `;
}

function ensureBackdrop() {
  if (typeof document === 'undefined') return;
  let backdrop = document.querySelector('.drawer-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.addEventListener('click', () => {
      document.body.classList.remove('drawer-open');
    });
    document.body.appendChild(backdrop);
  }
}

function attachSidebarListeners(mountElement) {
  const closeBtn = mountElement.querySelector('#sidebarCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.classList.remove('drawer-open');
    });
  }

  // Close drawer on navigating to another page if clicked on mobile
  const links = mountElement.querySelectorAll('.sidebar-link');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('drawer-open');
    });
  });
}

function attachSidebarStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sidebar-inline-styles')) return;

  const style = document.createElement('style');
  style.id = 'sidebar-inline-styles';
  style.textContent = `
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    .sidebar-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-color);
      margin-bottom: var(--space-2);
    }
    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .sidebar-section-title {
      font-size: var(--font-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0 var(--space-3);
      margin-bottom: var(--space-1);
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 0.625rem var(--space-3);
      font-size: var(--font-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast), color var(--transition-fast);
      text-decoration: none;
    }
    .sidebar-link:hover {
      background-color: var(--bg-surface-hover);
      color: var(--color-primary);
    }
    .sidebar-link.active {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
    .sidebar-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
    }
    .coursework-tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0 var(--space-2);
    }
    .coursework-tag {
      text-decoration: none;
      transition: transform var(--transition-fast);
    }
    .coursework-tag:hover {
      transform: translateY(-1px);
    }
    .sidebar-footer {
      margin-top: auto;
      padding: var(--space-4) var(--space-2) 0;
      border-top: 1px solid var(--border-color-light);
    }
  `;
  document.head.appendChild(style);
}
