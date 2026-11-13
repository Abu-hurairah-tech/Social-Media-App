/**
 * Academic Coursework Showcase — Chat Messenger Controller
 * js/pages/chat.js
 */

import { renderNavbar, initTheme } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { escapeHtml, formatRelativeTime, getAuthorInitials } from '../components/postCard.js';
import { state } from '../store/state.js';

let activeRoomId = null;
let searchFilter = '';

document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});

export function initChatPage() {
  initTheme();

  const navbarMount = document.getElementById('navbarMount');
  if (navbarMount) renderNavbar(navbarMount, { basePath: '../', activePage: 'chat' });

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) renderSidebar(sidebarMount, { basePath: '../', activePage: 'chat' });

  const mobileNavMount = document.getElementById('mobileNavMount');
  if (mobileNavMount) renderMobileBottomNav(mobileNavMount, { basePath: '../', activePage: 'chat' });

  if (!state.getCurrentUser() && state.data.users.length > 0) {
    state.setCurrentUser(state.data.users[0].id);
  }

  // Handle ?userId= / ?peer= / ?roomId= query params
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetUserId = params ? (params.get('userId') || params.get('peer')) : null;
  const targetRoomId = params ? params.get('roomId') : null;

  if (targetUserId && typeof state.startOrGetConversation === 'function') {
    const room = state.startOrGetConversation(targetUserId);
    if (room) activeRoomId = room.id;
  } else if (targetRoomId) {
    activeRoomId = targetRoomId;
  }

  const conversations = state.getConversations();
  if (!activeRoomId && conversations.length > 0) {
    activeRoomId = conversations[0].id;
  }

  populateNewChatPeerSelect();
  setupChatListeners();
  renderChatUI();

  state.subscribe('messages:sent', () => renderChatUI());
  state.subscribe('conversations:updated', () => renderConversationsList());
}

function getPeerFromRoom(room) {
  const currentUser = state.getCurrentUser() || state.data.users[0];
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const peerId = (room.participants || []).find((id) => id !== currentUserId) || currentUserId;
  return state.getUserById(peerId) || {
    id: peerId,
    name: room.name || 'Study Peer',
    major: 'Computer Science',
    avatar: 'assets/images/avatar-2.svg',
    headline: 'Campus Network Scholar'
  };
}

function resolveAvatar(avatarPath) {
  if (!avatarPath) return '../assets/images/avatar-2.svg';
  if (/^(https?:|data:|\/|\.\.)/i.test(avatarPath)) return avatarPath;
  return `../${avatarPath}`;
}

function populateNewChatPeerSelect() {
  const select = document.getElementById('chatNewPeerSelect');
  if (!select) return;

  const currentUser = state.getCurrentUser() || state.data.users[0];
  const peers = state.data.users.filter((u) => !currentUser || u.id !== currentUser.id);
  select.innerHTML = `<option value="">+ Start new study chat...</option>` +
    peers.map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.major || 'Computing')})</option>`).join('');
}

function setupChatListeners() {
  const searchInput = document.getElementById('chatSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchFilter = searchInput.value.trim().toLowerCase();
      renderConversationsList();
    });
  }

  const newPeerSelect = document.getElementById('chatNewPeerSelect');
  if (newPeerSelect) {
    newPeerSelect.addEventListener('change', () => {
      const peerId = newPeerSelect.value;
      if (!peerId) return;
      const room = state.startOrGetConversation(peerId);
      if (room) {
        activeRoomId = room.id;
        openMobileThread();
        renderChatUI();
      }
      newPeerSelect.value = '';
    });
  }

  const backBtn = document.getElementById('btnChatBackToList');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const workspace = document.getElementById('chatWorkspace');
      if (workspace) workspace.classList.remove('mobile-thread-active');
    });
  }

  const composerForm = document.getElementById('chatComposerForm');
  const messageInput = document.getElementById('chat-message-input');
  if (composerForm && messageInput) {
    composerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text || !activeRoomId) return;

      try {
        state.sendMessage(activeRoomId, text);
        messageInput.value = '';
        renderChatUI();
        triggerSimulatedReply(activeRoomId, text);
      } catch (err) {
        console.error('Send message error:', err);
      }
    });
  }

  document.querySelectorAll('#chatQuickPrompts .quick-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (messageInput) {
        messageInput.value = chip.dataset.prompt || '';
        messageInput.focus();
      }
    });
  });
}

function openMobileThread() {
  const workspace = document.getElementById('chatWorkspace');
  if (workspace) workspace.classList.add('mobile-thread-active');
}

function renderChatUI() {
  renderConversationsList();
  renderActiveThread();
}

function renderConversationsList() {
  const listEl = document.getElementById('conversations-list');
  const unreadBadge = document.getElementById('chatTotalUnreadBadge');
  if (!listEl) return;

  let conversations = state.getConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  if (unreadBadge) unreadBadge.textContent = `${totalUnread} Unread`;

  if (searchFilter) {
    conversations = conversations.filter((c) => {
      const peer = getPeerFromRoom(c);
      return (peer.name && peer.name.toLowerCase().includes(searchFilter)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(searchFilter));
    });
  }

  if (conversations.length === 0) {
    listEl.innerHTML = `<div class="p-4 text-center font-xs text-muted">No conversations found.</div>`;
    return;
  }

  listEl.innerHTML = conversations.map((room) => {
    const peer = getPeerFromRoom(room);
    const isActive = room.id === activeRoomId;
    const initials = getAuthorInitials(peer.name);
    const timeLabel = formatRelativeTime(room.lastMessageTimestamp);
    const snippet = room.lastMessageSnippet || room.lastMessage || 'No messages yet';

    return `
      <button type="button" class="conversation-item ${isActive ? 'active' : ''}" data-room-id="${escapeHtml(room.id)}" role="listitem">
        <span class="avatar avatar-md">
          <img src="${escapeHtml(resolveAvatar(peer.avatar))}" alt="${escapeHtml(peer.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
          <span class="avatar-status online"></span>
        </span>
        <div class="conversation-meta">
          <div class="conversation-top-row">
            <span class="conversation-name">${escapeHtml(peer.name)}</span>
            <span class="conversation-time">${escapeHtml(timeLabel)}</span>
          </div>
          <div class="conversation-snippet-row">
            <span class="conversation-snippet">${escapeHtml(snippet)}</span>
            ${room.unreadCount > 0 ? `<span class="badge badge-primary badge-xs">${room.unreadCount}</span>` : ''}
          </div>
        </div>
      </button>
    `;
  }).join('');

  listEl.querySelectorAll('.conversation-item').forEach((item) => {
    item.addEventListener('click', () => {
      activeRoomId = item.dataset.roomId;
      state.markConversationRead(activeRoomId);
      openMobileThread();
      renderChatUI();
    });
  });
}

function renderActiveThread() {
  const threadEl = document.getElementById('chat-message-thread');
  const peerInfoEl = document.getElementById('chatActivePeerInfo');
  const viewProfileBtn = document.getElementById('btnChatViewProfile');
  const rightInfoBody = document.getElementById('chatPeerInfoBody');
  if (!threadEl) return;

  const conversations = state.getConversations();
  const activeRoom = conversations.find((c) => c.id === activeRoomId) || conversations[0];
  if (!activeRoom) {
    threadEl.innerHTML = `<div class="p-6 text-center text-muted font-sm">Select a peer to start messaging.</div>`;
    return;
  }
  activeRoomId = activeRoom.id;

  const peer = getPeerFromRoom(activeRoom);
  const currentUser = state.getCurrentUser() || state.data.users[0];
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const initials = getAuthorInitials(peer.name);

  if (peerInfoEl) {
    peerInfoEl.innerHTML = `
      <span class="avatar avatar-sm">
        <img src="${escapeHtml(resolveAvatar(peer.avatar))}" alt="${escapeHtml(peer.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
        <span class="avatar-status online"></span>
      </span>
      <div class="flex flex-col">
        <strong class="font-sm">${escapeHtml(peer.name)}</strong>
        <span class="font-xs text-muted">${escapeHtml(peer.major || 'Computer Science')} &bull; Online</span>
      </div>
    `;
  }

  if (viewProfileBtn) {
    viewProfileBtn.href = `profile.html?userId=${encodeURIComponent(peer.id)}`;
  }

  if (rightInfoBody) {
    const courses = Array.isArray(peer.courses) ? peer.courses : [];
    rightInfoBody.innerHTML = `
      <div class="flex flex-col items-center text-center gap-2 mb-4">
        <span class="avatar avatar-lg">
          <img src="${escapeHtml(resolveAvatar(peer.avatar))}" alt="${escapeHtml(peer.name)}" />
        </span>
        <strong class="font-base">${escapeHtml(peer.name)}</strong>
        <span class="font-xs text-secondary">${escapeHtml(peer.headline || peer.major || '')}</span>
        <span class="badge badge-course badge-xs">${escapeHtml(peer.studentId || 'PU Scholar')}</span>
      </div>
      <div class="font-xs font-weight-semibold text-muted mb-2">Shared Academic Courses</div>
      <div class="flex flex-wrap gap-1">
        ${courses.map((c) => `<span class="badge badge-secondary badge-xs">${escapeHtml(c)}</span>`).join('')}
      </div>
    `;
  }

  const messages = state.getMessages(activeRoom.id);
  if (messages.length === 0) {
    threadEl.innerHTML = `
      <div class="p-6 text-center text-muted font-sm">
        Start collaborating with ${escapeHtml(peer.name)} on coursework and projects!
      </div>
    `;
    return;
  }

  threadEl.innerHTML = messages.map((m) => {
    const isOutgoing = m.senderId === currentUserId;
    const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="message-row ${isOutgoing ? 'outgoing' : 'incoming'}">
        <div class="message-bubble">
          <div>${escapeHtml(m.text)}</div>
          <span class="message-timestamp">${escapeHtml(timeStr)}</span>
        </div>
      </div>
    `;
  }).join('');

  threadEl.scrollTop = threadEl.scrollHeight;
}

function triggerSimulatedReply(roomId, userText) {
  const typingEl = document.getElementById('chatTypingIndicator');
  const typingLabel = document.getElementById('typingPeerLabel');
  const room = state.getConversations().find((c) => c.id === roomId);
  if (!room) return;
  const peer = getPeerFromRoom(room);

  if (typingEl && typingLabel) {
    typingLabel.textContent = `${peer.name} is typing...`;
    typingEl.classList.remove('hidden');
  }

  setTimeout(() => {
    if (typingEl) typingEl.classList.add('hidden');
    const lower = userText.toLowerCase();
    let replyText = `Sounds great! Let's sync up on our ${peer.courses?.[0] || 'coursework'} notes shortly.`;
    if (lower.includes('notes') || lower.includes('lab')) {
      replyText = `Just shared the latest lab benchmark PDF and code walkthrough in our study group!`;
    } else if (lower.includes('assignment') || lower.includes('review')) {
      replyText = `I'm reviewing the architecture right now—happy to pair-review before the deadline.`;
    } else if (lower.includes('session') || lower.includes('meet')) {
      replyText = `Count me in! Let's meet at the Science Center Study Commons at 3 PM.`;
    }

    const now = new Date().toISOString();
    const replyMsg = {
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      conversationId: roomId,
      senderId: peer.id,
      text: replyText,
      timestamp: now
    };
    state.data.messages.push(replyMsg);
    room.lastMessage = replyText;
    room.lastMessageSnippet = replyText;
    room.lastMessageTimestamp = now;
    state.saveState();
    renderChatUI();
  }, 750);
}
