/**
 * Academic Coursework Showcase — Groups Page Controller
 * js/pages/groups.js
 */

import { renderNavbar, initTheme } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { openModal } from '../components/modal.js';
import { renderPostCard, escapeHtml, getAuthorInitials } from '../components/postCard.js';
import { state } from '../store/state.js';

let searchQuery = '';
let categoryFilter = 'All';
let activeGroupId = null;

document.addEventListener('DOMContentLoaded', () => {
  initGroupsPage();
});

export function initGroupsPage() {
  initTheme();

  const navbarMount = document.getElementById('navbarMount');
  if (navbarMount) renderNavbar(navbarMount, { basePath: '../', activePage: 'groups' });

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) renderSidebar(sidebarMount, { basePath: '../', activePage: 'groups' });

  const mobileNavMount = document.getElementById('mobileNavMount');
  if (mobileNavMount) renderMobileBottomNav(mobileNavMount, { basePath: '../', activePage: 'groups' });

  if (!state.getCurrentUser() && state.data.users.length > 0) {
    state.setCurrentUser(state.data.users[0].id);
  }

  const groups = state.getGroups();
  if (groups.length > 0) {
    activeGroupId = groups[0].id;
  }

  setupListeners();
  renderAllGroupsViews();

  state.subscribe('groups:updated', () => renderAllGroupsViews());
  state.subscribe('posts:created', () => renderActiveGroupFeed());
  state.subscribe('posts:updated', () => renderActiveGroupFeed());
}

function resolveMedia(path) {
  if (!path) return '../assets/images/cover-default.svg';
  if (/^(https?:|data:|\/|\.\.)/i.test(path)) return path;
  return `../${path}`;
}

function setupListeners() {
  const searchInput = document.getElementById('groupsSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderAllGroupsViews();
    });
  }

  const pills = document.querySelectorAll('#groupsCategoryPills .filter-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      categoryFilter = pill.dataset.category || 'All';
      pills.forEach((p) => p.classList.toggle('active', p === pill));
      renderAllGroupsViews();
    });
  });

  const createBtn = document.getElementById('btnCreateGroup');
  if (createBtn) {
    createBtn.addEventListener('click', () => openCreateGroupModal());
  }

  const groupPostForm = document.getElementById('groupPostForm');
  if (groupPostForm) {
    groupPostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeGroupId) return;

      const titleInput = document.getElementById('groupPostTitleInput');
      const contentInput = document.getElementById('groupPostContentInput');
      const content = contentInput ? contentInput.value.trim() : '';
      if (!content) {
        contentInput?.focus();
        return;
      }

      const group = state.getGroupById(activeGroupId);
      const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : `${group ? group.name : 'Group'} Discussion`;
      state.createPost({
        title,
        content,
        courseCode: group ? group.code : 'GEN101',
        groupId: activeGroupId,
        tags: [`#${group ? group.code : 'Group'}`, '#StudyGroup']
      });
      if (group) {
        group.postCount = (group.postCount || 0) + 1;
        state.saveState();
      }
      groupPostForm.reset();
      renderAllGroupsViews();
    });
  }
}

function renderAllGroupsViews() {
  const currentUser = state.getCurrentUser() || state.data.users[0];
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const allGroups = state.getGroups();

  let filtered = allGroups;
  if (categoryFilter !== 'All') {
    filtered = filtered.filter((g) => (g.category || '').toLowerCase() === categoryFilter.toLowerCase());
  }
  if (searchQuery) {
    filtered = filtered.filter((g) =>
      (g.name && g.name.toLowerCase().includes(searchQuery)) ||
      (g.code && g.code.toLowerCase().includes(searchQuery)) ||
      (g.description && g.description.toLowerCase().includes(searchQuery))
    );
  }

  const joined = filtered.filter((g) => Array.isArray(g.members) && g.members.includes(currentUserId));
  const discover = filtered;

  const joinedBadge = document.getElementById('joinedGroupsCountBadge');
  if (joinedBadge) joinedBadge.textContent = `${joined.length} Joined`;

  const discoverLabel = document.getElementById('discoverGroupsCountLabel');
  if (discoverLabel) discoverLabel.textContent = `${discover.length} group${discover.length === 1 ? '' : 's'}`;

  renderGroupCardsGrid('my-groups-grid', joined, currentUserId, 'You have not joined any groups matching this filter.');
  renderGroupCardsGrid('groups-directory', discover, currentUserId, 'No study groups match your search criteria.');
  renderActiveGroupFeed();
}

function renderGroupCardsGrid(containerId, groups, currentUserId, emptyText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (groups.length === 0) {
    container.innerHTML = `
      <div class="card p-5 text-center" style="grid-column: 1 / -1;">
        <p class="font-sm text-secondary">${escapeHtml(emptyText)}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = groups.map((group) => {
    const isMember = Array.isArray(group.members) && group.members.includes(currentUserId);
    const memberCount = Array.isArray(group.members) ? group.members.length : 1;
    const isSelected = group.id === activeGroupId;

    return `
      <article class="card group-card ${isSelected ? 'active-group' : ''}" data-group-id="${escapeHtml(group.id)}">
        <div class="group-card-banner">
          <img src="${escapeHtml(resolveMedia(group.banner))}" alt="${escapeHtml(group.name)}" />
          <span class="badge badge-primary badge-xs group-card-category">${escapeHtml(group.category || 'Academic')}</span>
        </div>
        <div class="group-card-body">
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-course badge-xs">${escapeHtml(group.code || 'GRP')}</span>
            <span class="font-xs text-muted">${memberCount} members</span>
          </div>
          <h3 class="group-card-title">${escapeHtml(group.name)}</h3>
          <p class="group-card-desc">${escapeHtml(group.description || '')}</p>
          <div class="group-card-meta">
            <span>${group.postCount || 0} discussions</span>
            <span>${isMember ? 'Member' : 'Open Cohort'}</span>
          </div>
          <div class="group-card-actions">
            <button type="button" class="btn ${isMember ? 'btn-outline' : 'btn-primary'} btn-sm btn-toggle-membership" data-group-id="${escapeHtml(group.id)}">
              ${isMember ? 'Joined' : 'Join Group'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-open-group-feed" data-group-id="${escapeHtml(group.id)}">
              Open Feed
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.btn-toggle-membership').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.toggleGroupMembership(btn.dataset.groupId);
    });
  });

  container.querySelectorAll('.btn-open-group-feed').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeGroupId = btn.dataset.groupId;
      renderAllGroupsViews();
      const feedSection = document.getElementById('singleGroupFeedSection');
      if (feedSection && typeof feedSection.scrollIntoView === 'function') {
        feedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function renderActiveGroupFeed() {
  const bannerCard = document.getElementById('activeGroupBannerCard');
  const postsStream = document.getElementById('group-posts-stream');
  const composerTitle = document.getElementById('groupComposerTitle');
  const composerCodeHint = document.getElementById('groupComposerCodeHint');
  const membersWidget = document.getElementById('groupMembersWidget');

  const group = activeGroupId ? state.getGroupById(activeGroupId) : state.getGroups()[0];
  if (!group) return;
  activeGroupId = group.id;

  const currentUser = state.getCurrentUser() || state.data.users[0];
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const isMember = Array.isArray(group.members) && group.members.includes(currentUserId);

  if (bannerCard) {
    bannerCard.innerHTML = `
      <div class="group-detail-cover">
        <img src="${escapeHtml(resolveMedia(group.banner))}" alt="${escapeHtml(group.name)}" />
      </div>
      <div class="group-detail-content">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="badge badge-course badge-xs">${escapeHtml(group.code || 'GRP')}</span>
            <span class="badge badge-secondary badge-xs">${escapeHtml(group.category || 'Academic')}</span>
          </div>
          <h3 class="font-lg font-weight-bold">${escapeHtml(group.name)}</h3>
          <p class="font-sm text-secondary mt-1">${escapeHtml(group.description || '')}</p>
        </div>
        <button type="button" id="btnActiveGroupJoinToggle" class="btn ${isMember ? 'btn-outline' : 'btn-primary'} btn-sm">
          ${isMember ? 'Leave Group' : 'Join Group'}
        </button>
      </div>
    `;

    const toggleBtn = document.getElementById('btnActiveGroupJoinToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => state.toggleGroupMembership(group.id));
    }
  }

  if (composerTitle) composerTitle.textContent = `Post inside ${group.name}`;
  if (composerCodeHint) composerCodeHint.textContent = `${group.code} Discussion`;

  if (membersWidget) {
    const memberUsers = (group.members || []).map((id) => state.getUserById(id)).filter(Boolean);
    membersWidget.innerHTML = memberUsers.length === 0
      ? `<p class="font-xs text-muted">No members yet.</p>`
      : memberUsers.map((m) => {
          const initials = getAuthorInitials(m.name);
          return `
            <div class="flex items-center gap-2 py-2">
              <span class="avatar avatar-xs">
                <img src="${escapeHtml(resolveMedia(m.avatar))}" alt="${escapeHtml(m.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
              </span>
              <div class="flex flex-col">
                <a href="profile.html?userId=${escapeHtml(m.id)}" class="font-xs font-weight-semibold text-primary">${escapeHtml(m.name)}</a>
                <span class="font-xs text-muted">${escapeHtml(m.major || 'Scholar')}</span>
              </div>
            </div>
          `;
        }).join('');
  }

  if (postsStream) {
    const groupPosts = state.getGroupPosts(group.id);
    postsStream.innerHTML = '';
    if (groupPosts.length === 0) {
      postsStream.innerHTML = `
        <div class="card p-6 text-center">
          <h4 class="font-base font-weight-semibold">No Group Discussions Yet</h4>
          <p class="font-sm text-secondary mt-1">Be the first member of ${escapeHtml(group.name)} to start a thread above!</p>
        </div>
      `;
    } else {
      groupPosts.forEach((post) => {
        postsStream.appendChild(renderPostCard(post, { basePath: '../' }));
      });
    }
  }
}

function openCreateGroupModal() {
  openModal({
    title: 'Create Academic Study Group',
    content: `
      <form id="createGroupModalForm" class="create-group-form">
        <div>
          <label for="newGroupName" class="form-label font-xs">Group Name</label>
          <input type="text" id="newGroupName" class="form-control form-control-sm" placeholder="e.g. Cloud Architecture & .NET Lab" required />
        </div>
        <div>
          <label for="newGroupCode" class="form-label font-xs">Course / Cohort Code</label>
          <input type="text" id="newGroupCode" class="form-control form-control-sm" placeholder="e.g. CS-NET-05" required />
        </div>
        <div>
          <label for="newGroupCategory" class="form-label font-xs">Category</label>
          <select id="newGroupCategory" class="form-control form-control-sm">
            <option value="Academic">Academic</option>
            <option value="Research">Research</option>
            <option value="Coursework">Coursework</option>
            <option value="Club">Club</option>
          </select>
        </div>
        <div>
          <label for="newGroupDesc" class="form-label font-xs">Description</label>
          <textarea id="newGroupDesc" class="form-control form-control-sm" rows="3" placeholder="What will this group collaborate on?"></textarea>
        </div>
      </form>
    `,
    footerButtons: [
      {
        label: 'Cancel',
        className: 'btn btn-ghost btn-sm',
        onClick: (m) => m.close()
      },
      {
        label: 'Create Group',
        className: 'btn btn-primary btn-sm',
        onClick: (m) => {
          const nameEl = document.getElementById('newGroupName');
          const name = nameEl ? nameEl.value.trim() : '';
          if (!name) {
            nameEl?.focus();
            return;
          }
          const created = state.createGroup({
            name,
            code: document.getElementById('newGroupCode')?.value.trim() || 'STUDY-01',
            category: document.getElementById('newGroupCategory')?.value || 'Academic',
            description: document.getElementById('newGroupDesc')?.value.trim() || 'Student study group.'
          });
          activeGroupId = created.id;
          m.close();
          renderAllGroupsViews();
        }
      }
    ]
  });
}
