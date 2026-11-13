/**
 * Academic Coursework Showcase — Friends & Search Page Controller
 * js/pages/friends.js
 */

import { renderNavbar, initTheme } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { escapeHtml, getAuthorInitials } from '../components/postCard.js';
import { state } from '../store/state.js';

let searchQuery = '';
let selectedMajor = 'All';

document.addEventListener('DOMContentLoaded', () => {
  initFriendsPage();
});

export function initFriendsPage() {
  initTheme();

  const navbarMount = document.getElementById('navbarMount');
  if (navbarMount) renderNavbar(navbarMount, { basePath: '../', activePage: 'friends' });

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) renderSidebar(sidebarMount, { basePath: '../', activePage: 'friends' });

  const mobileNavMount = document.getElementById('mobileNavMount');
  if (mobileNavMount) renderMobileBottomNav(mobileNavMount, { basePath: '../', activePage: 'friends' });

  // Ensure active session
  if (!state.getCurrentUser() && state.data.users.length > 0) {
    state.setCurrentUser(state.data.users[0].id);
  }

  // Read query parameter ?q=
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const qParam = params ? params.get('q') : '';
  if (qParam) {
    searchQuery = qParam;
    const searchInput = document.getElementById('friends-search-input');
    if (searchInput) searchInput.value = qParam;
  }

  setupSearchAndFilterListeners();
  renderAllFriendsViews();

  state.subscribe('friendRequests:updated', () => renderAllFriendsViews());
  state.subscribe('friends:updated', () => renderAllFriendsViews());
  state.subscribe('auth:changed', () => renderAllFriendsViews());
}

function setupSearchAndFilterListeners() {
  const searchInput = document.getElementById('friends-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderAllFriendsViews();
    });
  }

  const pills = document.querySelectorAll('#departmentFilterPills .filter-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      selectedMajor = pill.dataset.major || 'All';
      pills.forEach((p) => p.classList.toggle('active', p === pill));
      renderAllFriendsViews();
    });
  });
}

function getMutualCount(userA, userB) {
  const friendsA = Array.isArray(userA?.friends) ? userA.friends : [];
  const friendsB = Array.isArray(userB?.friends) ? userB.friends : [];
  return friendsA.filter((id) => friendsB.includes(id)).length;
}

function resolveAvatar(avatarPath) {
  if (!avatarPath) return '../assets/images/avatar-1.svg';
  if (/^(https?:|data:|\/|\.\.)/i.test(avatarPath)) return avatarPath;
  return `../${avatarPath}`;
}

function renderAllFriendsViews() {
  const currentUser = state.getCurrentUser() || state.data.users[0];
  if (!currentUser) return;

  renderIncomingRequests(currentUser);
  renderDirectoryAndFriends(currentUser);
  renderRightWidgets(currentUser);
}

function renderIncomingRequests(currentUser) {
  const container = document.getElementById('friend-requests-container');
  const badge = document.getElementById('requestsCountBadge');
  if (!container) return;

  const { incoming } = state.getFriendRequests();
  if (badge) badge.textContent = `${incoming.length} Pending`;

  if (incoming.length === 0) {
    container.innerHTML = `
      <div class="card p-5 text-center" style="grid-column: 1 / -1;">
        <p class="font-sm text-secondary">No pending incoming friend requests right now.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = incoming.map((req) => {
    const sender = state.getUserById(req.senderId);
    if (!sender) return '';
    const mutual = getMutualCount(currentUser, sender);
    const initials = getAuthorInitials(sender.name);

    return `
      <article class="card friend-request-card" data-request-id="${escapeHtml(req.id)}">
        <div class="peer-card-top">
          <span class="avatar avatar-md">
            <img src="${escapeHtml(resolveAvatar(sender.avatar))}" alt="${escapeHtml(sender.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
          </span>
          <div class="peer-card-meta">
            <a href="profile.html?userId=${escapeHtml(sender.id)}" class="peer-card-name">${escapeHtml(sender.name)}</a>
            <p class="peer-card-headline">${escapeHtml(sender.headline || sender.major || 'Student Scholar')}</p>
            <div class="peer-badges-row">
              <span class="badge badge-primary badge-xs">${escapeHtml(sender.major || 'Computing')}</span>
              <span class="badge badge-secondary badge-xs">${escapeHtml(sender.year || 'Scholar')}</span>
            </div>
          </div>
        </div>
        <div class="peer-mutual-info">
          <span>${mutual} mutual study peer${mutual === 1 ? '' : 's'}</span>
          <span>${escapeHtml(sender.studentId || '')}</span>
        </div>
        <div class="peer-card-actions">
          <button type="button" class="btn btn-primary btn-sm btn-accept-request" data-request-id="${escapeHtml(req.id)}">Confirm</button>
          <button type="button" class="btn btn-outline btn-sm btn-decline-request" data-request-id="${escapeHtml(req.id)}">Decline</button>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.btn-accept-request').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.respondFriendRequest(btn.dataset.requestId, 'accept');
    });
  });

  container.querySelectorAll('.btn-decline-request').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.respondFriendRequest(btn.dataset.requestId, 'decline');
    });
  });
}

function renderDirectoryAndFriends(currentUser) {
  const suggestedGrid = document.getElementById('suggested-peers-grid');
  const connectedGrid = document.getElementById('all-friends-grid');
  const totalBadge = document.getElementById('friendsTotalCountBadge');
  const suggestedLabel = document.getElementById('suggestedCountLabel');
  const connectedLabel = document.getElementById('connectedCountLabel');

  let matchedUsers = state.searchUsers(searchQuery).filter((u) => u.id !== currentUser.id);
  if (selectedMajor !== 'All') {
    matchedUsers = matchedUsers.filter((u) => (u.major || '').toLowerCase() === selectedMajor.toLowerCase());
  }

  const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];
  const connectedPeers = matchedUsers.filter((u) => friendIds.includes(u.id));
  const discoverPeers = matchedUsers.filter((u) => !friendIds.includes(u.id));

  const { incoming, outgoing } = state.getFriendRequests();
  const outgoingTargetIds = new Set(outgoing.map((r) => r.receiverId));
  const incomingSenderIds = new Set(incoming.map((r) => r.senderId));

  if (totalBadge) totalBadge.textContent = `${friendIds.length} Connected`;
  if (suggestedLabel) suggestedLabel.textContent = `${discoverPeers.length} student${discoverPeers.length === 1 ? '' : 's'} found`;
  if (connectedLabel) connectedLabel.textContent = `${connectedPeers.length} connected`;

  if (suggestedGrid) {
    if (discoverPeers.length === 0) {
      suggestedGrid.innerHTML = `
        <div class="card p-5 text-center" style="grid-column: 1 / -1;">
          <p class="font-sm text-secondary">No additional peers match your current search or major filter.</p>
        </div>
      `;
    } else {
      suggestedGrid.innerHTML = discoverPeers.map((peer) => {
        const mutual = getMutualCount(currentUser, peer);
        const initials = getAuthorInitials(peer.name);
        const isOutgoing = outgoingTargetIds.has(peer.id);
        const isIncoming = incomingSenderIds.has(peer.id);

        let actionHtml = `<button type="button" class="btn btn-primary btn-sm btn-send-request" data-user-id="${escapeHtml(peer.id)}">Add Study Peer</button>`;
        if (isOutgoing) {
          actionHtml = `<button type="button" class="btn btn-secondary btn-sm" disabled>Request Sent</button>`;
        } else if (isIncoming) {
          actionHtml = `<a href="#friendRequestsSection" class="btn btn-outline-primary btn-sm">Respond Above</a>`;
        }

        return `
          <article class="card peer-card">
            <div class="peer-card-top">
              <span class="avatar avatar-md">
                <img src="${escapeHtml(resolveAvatar(peer.avatar))}" alt="${escapeHtml(peer.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
              </span>
              <div class="peer-card-meta">
                <a href="profile.html?userId=${escapeHtml(peer.id)}" class="peer-card-name">${escapeHtml(peer.name)}</a>
                <p class="peer-card-headline">${escapeHtml(peer.headline || peer.major || 'Student Scholar')}</p>
                <div class="peer-badges-row">
                  <span class="badge badge-primary badge-xs">${escapeHtml(peer.major || 'Computing')}</span>
                  <span class="badge badge-course badge-xs">${escapeHtml((peer.courses && peer.courses[0]) || 'CS501')}</span>
                </div>
              </div>
            </div>
            <div class="peer-mutual-info">
              <span>${mutual} mutual peer${mutual === 1 ? '' : 's'}</span>
              <span>GPA ${escapeHtml(peer.gpa || '3.8')}</span>
            </div>
            <div class="peer-card-actions">
              ${actionHtml}
              <a href="profile.html?userId=${escapeHtml(peer.id)}" class="btn btn-outline btn-sm">Profile</a>
            </div>
          </article>
        `;
      }).join('');

      suggestedGrid.querySelectorAll('.btn-send-request').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.sendFriendRequest(btn.dataset.userId);
        });
      });
    }
  }

  if (connectedGrid) {
    if (connectedPeers.length === 0) {
      connectedGrid.innerHTML = `
        <div class="card p-5 text-center" style="grid-column: 1 / -1;">
          <p class="font-sm text-secondary">No connected peers match your current filter.</p>
        </div>
      `;
    } else {
      connectedGrid.innerHTML = connectedPeers.map((peer) => {
        const mutual = getMutualCount(currentUser, peer);
        const initials = getAuthorInitials(peer.name);

        return `
          <article class="card peer-card">
            <div class="peer-card-top">
              <span class="avatar avatar-md">
                <img src="${escapeHtml(resolveAvatar(peer.avatar))}" alt="${escapeHtml(peer.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
                <span class="avatar-status online"></span>
              </span>
              <div class="peer-card-meta">
                <a href="profile.html?userId=${escapeHtml(peer.id)}" class="peer-card-name">${escapeHtml(peer.name)}</a>
                <p class="peer-card-headline">${escapeHtml(peer.headline || peer.major || 'Student Scholar')}</p>
                <div class="peer-badges-row">
                  <span class="badge badge-accent badge-xs">Connected</span>
                  <span class="badge badge-secondary badge-xs">${escapeHtml(peer.major || 'Computing')}</span>
                </div>
              </div>
            </div>
            <div class="peer-mutual-info">
              <span>${mutual} mutual peer${mutual === 1 ? '' : 's'}</span>
              <span>${escapeHtml(peer.semester || 'Fall 2026')}</span>
            </div>
            <div class="peer-card-actions">
              <a href="chat.html?userId=${escapeHtml(peer.id)}" class="btn btn-primary btn-sm">Message</a>
              <button type="button" class="btn btn-outline btn-sm btn-remove-friend" data-user-id="${escapeHtml(peer.id)}">Remove</button>
            </div>
          </article>
        `;
      }).join('');

      connectedGrid.querySelectorAll('.btn-remove-friend').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.removeFriend(btn.dataset.userId);
        });
      });
    }
  }
}

function renderRightWidgets(currentUser) {
  const summaryEl = document.getElementById('networkSummaryWidget');
  const outgoingEl = document.getElementById('outgoingRequestsWidget');
  const friends = state.getFriends(currentUser.id);
  const { incoming, outgoing } = state.getFriendRequests();

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="network-stats-list">
        <div class="network-stat-row">
          <span class="text-secondary">Connected Peers</span>
          <strong>${friends.length}</strong>
        </div>
        <div class="network-stat-row">
          <span class="text-secondary">Incoming Requests</span>
          <strong>${incoming.length}</strong>
        </div>
        <div class="network-stat-row">
          <span class="text-secondary">Outgoing Sent</span>
          <strong>${outgoing.length}</strong>
        </div>
        <div class="network-stat-row">
          <span class="text-secondary">Total Campus Users</span>
          <strong>${state.data.users.length}</strong>
        </div>
      </div>
    `;
  }

  if (outgoingEl) {
    if (!outgoing.length) {
      outgoingEl.innerHTML = `<p class="font-xs text-muted">No pending outgoing friend requests.</p>`;
    } else {
      outgoingEl.innerHTML = outgoing.map((req) => {
        const receiver = state.getUserById(req.receiverId);
        if (!receiver) return '';
        return `
          <div class="flex items-center justify-between gap-2 py-2">
            <a href="profile.html?userId=${escapeHtml(receiver.id)}" class="font-xs font-weight-semibold text-primary">${escapeHtml(receiver.name)}</a>
            <span class="badge badge-secondary badge-xs">Pending</span>
          </div>
        `;
      }).join('');
    }
  }
}
