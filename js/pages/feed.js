/**
 * Academic Coursework Showcase — Feed Page Controller
 * js/pages/feed.js
 *
 * Coordinates index.html view: renders navbar, sidebar, mobile navigation,
 * handles post creation, feed filtering (All, Enrolled, Top Rated, Projects),
 * mounts postCard components, subscribes to reactive PubSub state changes,
 * and populates campus widgets (deadlines, study groups, sponsored ads, peers).
 */

import { renderNavbar } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { openModal as createModal, openModal } from '../components/modal.js';
import { renderPostCard } from '../components/postCard.js';
import { state } from '../store/state.js';

let currentFilter = 'all';
let attachedMedia = null;

/**
 * Initializes page after DOM content is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  initFeedPage();
});

/**
 * Main initialization routine
 */
export function initFeedPage() {
  // 1. Mount Global Navigation Bar & Sidebar
  const navbarMount = document.getElementById('navbarMount');
  if (navbarMount) {
    renderNavbar(navbarMount, { basePath: '' });
  }

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) {
    renderSidebar(sidebarMount, { basePath: '', activePage: 'feed' });
  }

  const mobileNavMount = document.getElementById('mobileNavMount');
  if (mobileNavMount) {
    renderMobileBottomNav(mobileNavMount, { basePath: '', activePage: 'feed' });
  }

  // 2. Ensure Active User Session
  let currentUser = state.getCurrentUser();
  if (!currentUser) {
    const users = (state.data && Array.isArray(state.data.users)) ? state.data.users : [];
    const defaultUser = users.find((u) => u.id === 'u1') || users[0];
    if (defaultUser) {
      state.setCurrentUser(defaultUser.id);
      currentUser = state.getCurrentUser();
    }
  }

  // 3. Update Composer Author Avatar & Name
  updateComposerAuthorInfo(currentUser);

  // 4. Check URL Search Parameters for initial filter (e.g. ?filter=CS501)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const filterParam = urlParams ? urlParams.get('filter') : null;
  if (filterParam) {
    currentFilter = filterParam;
  }

  // 5. Initial Feed Stream Rendering
  renderFeed();

  // 6. Setup Composer Event Listeners
  setupComposerListeners();

  // 7. Setup Filter Tabs Listeners
  setupFilterTabsListeners();

  // 8. Populate Campus Aside Widgets
  renderStudyGroupsWidget();
  renderSponsoredWidget();
  renderOnlinePeersWidget();

  // 9. Subscribe to Reactive State Bus Events
  setupStateSubscriptions();
}

/**
 * Updates composer card with current user info
 * @param {Object} user
 */
function updateComposerAuthorInfo(user) {
  if (!user) return;
  const avatarImg = document.getElementById('composerAvatar');
  const nameEl = document.getElementById('composerUserName');
  const metaEl = document.getElementById('composerUserMeta');

  if (avatarImg && user.avatar) {
    avatarImg.src = user.avatar;
    avatarImg.alt = user.name || 'User avatar';
  }
  if (nameEl && user.name) {
    nameEl.textContent = user.name;
  }
  if (metaEl) {
    metaEl.textContent = `${user.major || 'Computer Science'} • ${user.semester || 'Fall 2026'}`;
  }
}

/**
 * Renders feed posts into #feed-posts-container according to current active filter
 */
export function renderFeed() {
  const container = document.getElementById('feed-posts-container');
  if (!container) return;

  const currentUser = state.getCurrentUser();
  let posts = state.getPosts();

  // Filter application
  if (currentFilter === 'enrolled') {
    const enrolledCourses = (currentUser && Array.isArray(currentUser.courses)) ? currentUser.courses : ['CS501', 'WT301', 'CS201'];
    posts = posts.filter((p) => {
      return enrolledCourses.some((c) => p.courseCode && p.courseCode.toUpperCase().includes(c.toUpperCase()));
    });
  } else if (currentFilter === 'top') {
    posts = [...posts].sort((a, b) => {
      const getScore = (p) => {
        const r = p.reactions || {};
        const countR = (Array.isArray(r.like) ? r.like.length : 0) +
                       (Array.isArray(r.heart) ? r.heart.length : 0) +
                       (Array.isArray(r.celebrate) ? r.celebrate.length : 0) +
                       (Array.isArray(r.idea) ? r.idea.length : 0);
        const countC = typeof p.commentsCount === 'number' ? p.commentsCount : 0;
        return countR * 2 + countC * 3;
      };
      return getScore(b) - getScore(a);
    });
  } else if (currentFilter === 'projects') {
    posts = posts.filter((p) => {
      const hasMedia = Boolean(p.media || p.mediaUrl);
      const hasCode = Boolean(p.codeSnippet);
      const hasProjectTag = Array.isArray(p.tags) && p.tags.some((t) => /project|showcase|thesis|demo|system/i.test(t));
      return hasMedia || hasCode || hasProjectTag;
    });
  } else if (currentFilter !== 'all') {
    // Specific subject filter passed from sidebar tag or URL query (e.g. 'CS501')
    const query = currentFilter.toLowerCase().replace('#', '');
    posts = posts.filter((p) => {
      const matchCourse = p.courseCode && p.courseCode.toLowerCase().includes(query);
      const matchTags = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(query));
      return matchCourse || matchTags;
    });
  }

  // Clear previous posts
  container.innerHTML = '';

  // Render Empty State if no posts match filter
  if (!posts || posts.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-feed-card card';
    emptyState.innerHTML = `
      <div class="empty-icon font-3xl">&#128218;</div>
      <h3 class="font-base font-weight-semibold">No Coursework Showcases Found</h3>
      <p class="font-sm text-secondary">
        No academic posts currently match the "<strong>${escapeHtml(currentFilter)}</strong>" filter criteria.
      </p>
      <button type="button" class="btn btn-outline-primary btn-sm mt-2" id="btnResetFilter" aria-label="Reset feed filter">
        Show All Coursework
      </button>
    `;
    container.appendChild(emptyState);

    const resetBtn = emptyState.querySelector('#btnResetFilter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFilter = 'all';
        updateFilterTabsUI('all');
        renderFeed();
      });
    }
    return;
  }

  const activeAds = typeof state.getActiveAds === 'function' ? state.getActiveAds('feed') : state.getAdCampaigns();
  const inlineAd = activeAds && activeAds.length > 0 ? activeAds[0] : null;

  // Render each post using renderPostCard
  posts.forEach((post, index) => {
    const cardEl = renderPostCard(post);
    container.appendChild(cardEl);

    if (inlineAd && index === 1) {
      const adEl = document.createElement('article');
      adEl.className = 'card post-card sponsored-feed-card';
      adEl.dataset.adId = inlineAd.id;
      adEl.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="badge badge-primary">${escapeHtml(inlineAd.badge || 'Sponsored')}</span>
          <span class="font-xs text-muted">${escapeHtml(inlineAd.sponsorName || 'Campus Sponsor')}</span>
        </div>
        <h3 class="font-md font-weight-semibold">${escapeHtml(inlineAd.title)}</h3>
        <p class="font-sm text-secondary mt-1">${escapeHtml(inlineAd.tagline || '')}</p>
        <div class="flex items-center justify-between mt-3">
          <span class="font-xs text-muted">Target: ${escapeHtml(inlineAd.targetAudience || 'All Students')}</span>
          <a href="${inlineAd.ctaLink && inlineAd.ctaLink !== '#' ? escapeHtml(inlineAd.ctaLink) : 'pages/ads-manager.html'}" class="btn btn-outline-primary btn-xs js-inline-ad-cta" data-ad-id="${escapeHtml(inlineAd.id)}">
            ${escapeHtml(inlineAd.ctaText || 'Learn More')}
          </a>
        </div>
      `;
      if (typeof state.recordAdImpression === 'function') {
        state.recordAdImpression(inlineAd.id);
      }
      const ctaLink = adEl.querySelector('.js-inline-ad-cta');
      if (ctaLink && typeof state.recordAdClick === 'function') {
        ctaLink.addEventListener('click', () => state.recordAdClick(inlineAd.id));
      }
      container.appendChild(adEl);
    }
  });
}

/**
 * Configures listeners for composer creation form and media/code tools
 */
function setupComposerListeners() {
  const composerForm = document.getElementById('post-composer-form');
  const contentTextarea = document.getElementById('composerContent');
  const courseCodeSelect = document.getElementById('composerCourseCode');
  const titleInput = document.getElementById('composerTitle');
  const codeSnippetContainer = document.getElementById('composerCodeSnippetContainer');
  const codeSnippetTextarea = document.getElementById('composerCodeInput');
  const btnToggleCode = document.getElementById('btnToggleCode');
  const btnCloseCode = document.getElementById('btnCloseCodeSnippet');
  const btnToggleMedia = document.getElementById('btnToggleMedia');
  const mediaPreviewContainer = document.getElementById('composerMediaPreviewContainer');
  const mediaLabel = document.getElementById('composerMediaLabel');
  const btnRemoveMedia = document.getElementById('btnRemoveMedia');

  // 1. Toggle Code Snippet Container
  if (btnToggleCode && codeSnippetContainer) {
    btnToggleCode.addEventListener('click', () => {
      codeSnippetContainer.classList.toggle('hidden');
      if (!codeSnippetContainer.classList.contains('hidden') && codeSnippetTextarea) {
        codeSnippetTextarea.focus();
      }
    });
  }

  if (btnCloseCode && codeSnippetContainer) {
    btnCloseCode.addEventListener('click', () => {
      codeSnippetContainer.classList.add('hidden');
      if (codeSnippetTextarea) codeSnippetTextarea.value = '';
    });
  }

  // 2. Toggle Media Attachment
  if (btnToggleMedia && mediaPreviewContainer) {
    btnToggleMedia.addEventListener('click', () => {
      // Rotate mock showcase media artifacts
      const mockImages = [
        'assets/images/project-1.svg',
        'assets/images/project-2.svg',
        'assets/images/cover-default.svg'
      ];
      attachedMedia = mockImages[Math.floor(Math.random() * mockImages.length)];
      if (mediaLabel) mediaLabel.textContent = `Attached: ${attachedMedia}`;
      mediaPreviewContainer.classList.remove('hidden');
    });
  }

  if (btnRemoveMedia && mediaPreviewContainer) {
    btnRemoveMedia.addEventListener('click', () => {
      attachedMedia = null;
      mediaPreviewContainer.classList.add('hidden');
    });
  }

  // 3. Form Submit Handler
  if (composerForm) {
    composerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const content = contentTextarea ? contentTextarea.value.trim() : '';
      if (!content) {
        contentTextarea?.focus();
        return;
      }

      const courseCode = courseCodeSelect ? courseCodeSelect.value : 'CS501';
      const title = titleInput ? titleInput.value.trim() : '';
      const codeSnippet = (codeSnippetContainer && !codeSnippetContainer.classList.contains('hidden') && codeSnippetTextarea)
        ? codeSnippetTextarea.value.trim()
        : '';
      const currentUser = state.getCurrentUser();

      // Construct tags array
      const tags = [`#${courseCode}`, '#AcademicShowcase'];
      if (title) {
        const cleanTitleTag = title.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanTitleTag) tags.push(`#${cleanTitleTag.slice(0, 15)}`);
      }
      if (codeSnippet) {
        tags.push('#CodeSnippet');
      }

      // Create post via state store
      try {
        state.createPost({
          content,
          title: title || `${courseCode} Coursework Showcase`,
          courseCode,
          codeSnippet,
          media: attachedMedia || '',
          tags,
          authorId: currentUser ? currentUser.id : 'u1'
        });

        // Reset composer form
        composerForm.reset();
        attachedMedia = null;
        if (codeSnippetContainer) codeSnippetContainer.classList.add('hidden');
        if (mediaPreviewContainer) mediaPreviewContainer.classList.add('hidden');

        // Refresh feed view
        renderFeed();
      } catch (err) {
        console.error('Post creation failed:', err);
      }
    });
  }
}

/**
 * Attaches filter tabs click listeners
 */
function setupFilterTabsListeners() {
  const tabs = document.querySelectorAll('.feed-filter-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = tab.dataset.filter || 'all';
      currentFilter = filter;
      updateFilterTabsUI(filter);
      renderFeed();
    });
  });
}

/**
 * Updates UI active class for filter navigation tabs
 * @param {string} filter
 */
function updateFilterTabsUI(filter) {
  const tabs = document.querySelectorAll('.feed-filter-tab');
  tabs.forEach((tab) => {
    if (tab.dataset.filter === filter) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

/**
 * Subscribes to state PubSub events for reactive UI updates
 */
function setupStateSubscriptions() {
  state.subscribe('posts:created', () => {
    renderFeed();
  });

  state.subscribe('posts:updated', () => {
    renderFeed();
  });

  state.subscribe('state:posts', () => {
    renderFeed();
  });

  state.subscribe('reaction:toggled', () => {
    // Post reactions update directly inside postCard component, but keep feed synchronized
  });

  state.subscribe('auth:changed', (newUser) => {
    updateComposerAuthorInfo(newUser);
    renderFeed();
    renderOnlinePeersWidget();
  });
}

/**
 * Populates Suggested Study Groups card in right aside
 */
function renderStudyGroupsWidget() {
  const mount = document.getElementById('studyGroupsList');
  if (!mount) return;

  const groups = state.getGroups();
  if (!groups || groups.length === 0) {
    mount.innerHTML = `<span class="font-xs text-muted">No suggested groups available.</span>`;
    return;
  }

  const currentUser = state.getCurrentUser();
  const currentUserId = currentUser ? currentUser.id : 'u1';

  mount.innerHTML = `
    <ul class="study-groups-list">
      ${groups.slice(0, 3).map((g) => {
        const isMember = Array.isArray(g.members) && g.members.includes(currentUserId);
        const memberCount = Array.isArray(g.members) ? g.members.length : 1;
        return `
          <li class="study-group-item" id="group-item-${g.id}">
            <div class="study-group-meta">
              <span class="font-sm font-weight-medium">${escapeHtml(g.name)}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge badge-course badge-course-engineering badge-xs">${escapeHtml(g.code || 'GRP')}</span>
                <span class="font-xs text-muted">${memberCount} members</span>
              </div>
            </div>
            <button
              type="button"
              class="btn ${isMember ? 'btn-outline' : 'btn-outline-primary'} btn-xs btn-join-group"
              data-group-id="${g.id}"
              aria-label="${isMember ? 'Leave' : 'Join'} ${escapeHtml(g.name)}"
            >
              ${isMember ? 'Joined' : 'Join'}
            </button>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  // Attach join/leave toggle listeners
  mount.querySelectorAll('.btn-join-group').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.groupId;
      state.toggleGroupMembership(groupId);
      renderStudyGroupsWidget();
    });
  });
}

/**
 * Populates Sponsored Academic Placement widget in right aside
 */
function renderSponsoredWidget() {
  const mount = document.getElementById('sponsoredPlacementBody');
  if (!mount) return;

  const campaigns = typeof state.getActiveAds === 'function' ? state.getActiveAds('feed') : state.getAdCampaigns();
  const activeAd = (campaigns && campaigns.length > 0)
    ? campaigns[0]
    : {
        id: null,
        title: 'Annual Computing Research Symposium 2026',
        sponsorName: 'Pacific University CS Dept',
        tagline: 'Submit coursework demos & software prototypes. Grants up to $5,000 for top undergraduate projects.',
        badge: 'Symposium Placement',
        ctaLink: 'pages/ads-manager.html'
      };

  if (activeAd.id && typeof state.recordAdImpression === 'function') {
    state.recordAdImpression(activeAd.id);
  }

  mount.innerHTML = `
    <div class="sponsored-content">
      <div class="sponsored-image-wrapper">
        <img src="assets/images/cover-default.svg" alt="${escapeHtml(activeAd.title)}" class="sponsored-image" />
      </div>
      <h4 class="sponsored-title font-sm font-weight-semibold mt-2">${escapeHtml(activeAd.title)}</h4>
      <p class="sponsored-tagline font-xs text-secondary mt-1">${escapeHtml(activeAd.tagline)}</p>
      <div class="flex items-center justify-between mt-3">
        <span class="font-xs text-muted">${escapeHtml(activeAd.sponsorName)}</span>
        <a href="${activeAd.ctaLink && activeAd.ctaLink !== '#' ? activeAd.ctaLink : 'pages/ads-manager.html'}" id="sponsoredWidgetCta" class="btn btn-outline-primary btn-xs" aria-label="Learn more about ${escapeHtml(activeAd.title)}">
          ${escapeHtml(activeAd.ctaText || 'Learn More')}
        </a>
      </div>
    </div>
  `;

  const cta = document.getElementById('sponsoredWidgetCta');
  if (cta && activeAd.id && typeof state.recordAdClick === 'function') {
    cta.addEventListener('click', () => state.recordAdClick(activeAd.id));
  }
}

/**
 * Populates Online Cohort Peers widget in right aside
 */
function renderOnlinePeersWidget() {
  const mount = document.getElementById('peersListBody');
  if (!mount) return;

  const currentUser = state.getCurrentUser();
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const allUsers = (state.data && Array.isArray(state.data.users)) ? state.data.users : [];
  const peers = allUsers.filter((u) => u.id !== currentUserId).slice(0, 4);

  if (peers.length === 0) {
    mount.innerHTML = `<span class="font-xs text-muted">No cohort peers online right now.</span>`;
    return;
  }

  mount.innerHTML = `
    <ul class="peers-list">
      ${peers.map((peer) => {
        return `
          <li class="peer-item" id="peer-item-${peer.id}">
            <div class="peer-info">
              <span class="avatar avatar-sm">
                <img src="${escapeHtml(peer.avatar || 'assets/images/avatar-2.svg')}" alt="${escapeHtml(peer.name)}" />
              </span>
              <div class="flex flex-col">
                <a href="pages/profile.html?userId=${escapeHtml(peer.id)}" class="font-xs font-weight-semibold text-primary">
                  ${escapeHtml(peer.name)}
                </a>
                <span class="font-xs text-muted">${escapeHtml(peer.major || 'Computer Science')}</span>
              </div>
            </div>
            <a
              href="pages/chat.html?peer=${escapeHtml(peer.id)}"
              class="btn btn-ghost btn-icon-sm btn-peer-chat"
              aria-label="Send direct study message to ${escapeHtml(peer.name)}"
              title="Message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </a>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

/**
 * Global escape HTML helper
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
