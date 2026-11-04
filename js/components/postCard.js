/**
 * Academic Coursework Showcase — Post Card UI Component
 * js/components/postCard.js
 *
 * Renders individual coursework showcase post cards with author meta,
 * subject badges, syntax-highlighted code snippets, media attachments,
 * multi-reactions bar (like, heart/love, celebrate, idea, thinking),
 * interactive action tray, nested comments, and post share modal.
 */

import { state } from '../store/state.js';
import { openModal } from './modal.js';

export const createModal = openModal;

/**
 * HTML-escape helper preventing XSS in user-authored posts and comments
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats ISO timestamp to human-friendly relative time string
 * @param {string} isoString
 * @returns {string}
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const now = new Date();
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Computes author initials fallback when avatar image is unavailable
 * @param {string} name
 * @returns {string}
 */
export function getAuthorInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || 'U').toUpperCase();
}

/**
 * Returns specialized badge color class by coursework department/prefix
 * @param {string} courseCode
 * @returns {string}
 */
export function getCourseCategoryBadgeClass(courseCode = '') {
  const code = String(courseCode).toUpperCase();
  if (code.startsWith('CS') || code.startsWith('SEC')) return 'badge-course-cs';
  if (code.startsWith('MATH') || code.startsWith('STAT')) return 'badge-course-math';
  if (code.startsWith('AI') || code.startsWith('ROB') || code.startsWith('BIO')) return 'badge-course-engineering';
  if (code.startsWith('WT') || code.startsWith('SE') || code.startsWith('DES')) return 'badge-course-design';
  return 'badge-course-cs';
}

/**
 * Renders a single post card article DOM element
 * @param {Object} post - Coursework post entity from state store
 * @param {Object} options - Configuration overrides
 * @returns {HTMLElement} <article class="card post-card">
 */
export function renderPostCard(post, options = {}) {
  if (!post || typeof post !== 'object') {
    const placeholder = document.createElement('article');
    placeholder.className = 'card post-card';
    placeholder.textContent = 'Post unavailable';
    return placeholder;
  }

  const currentUser = state.getCurrentUser();
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const author = state.getUserById(post.authorId) || {
    name: 'Student Scholar',
    major: 'Computer Science',
    semester: 'Fall 2026',
    avatar: 'assets/images/avatar-1.svg'
  };

  const card = document.createElement('article');
  card.className = 'card post-card';
  card.id = `post-${post.id}`;
  card.dataset.postId = post.id;

  // Safe reaction extraction
  const reactions = post.reactions || { like: [], heart: [], celebrate: [], idea: [], thinking: [] };
  const getReactionCount = (key) => (Array.isArray(reactions[key]) ? reactions[key].length : 0);
  const userHasReacted = (key) => Array.isArray(reactions[key]) && reactions[key].includes(currentUserId);

  const likeCount = getReactionCount('like');
  const heartCount = getReactionCount('heart');
  const celebrateCount = getReactionCount('celebrate');
  const ideaCount = getReactionCount('idea');
  const thinkingCount = getReactionCount('thinking');
  const totalReactions = likeCount + heartCount + celebrateCount + ideaCount + thinkingCount;

  const commentsCount = typeof post.commentsCount === 'number' ? post.commentsCount : 0;
  const sharesCount = typeof post.sharesCount === 'number' ? post.sharesCount : 0;

  // Author details & initials fallback
  const initials = getAuthorInitials(author.name);
  const courseClass = getCourseCategoryBadgeClass(post.courseCode);
  const relativeTime = formatRelativeTime(post.createdAt);

  // Tags rendering
  const tagsHtml = Array.isArray(post.tags) && post.tags.length > 0
    ? `<div class="post-tags">
        ${post.tags.map((t) => `<span class="post-tag">${escapeHtml(t)}</span>`).join('')}
       </div>`
    : '';

  // Code snippet rendering
  const codeSnippetHtml = post.codeSnippet
    ? `<div class="post-code-wrapper">
        <div class="post-code-header">
          <div class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>Showcase Code Implementation</span>
          </div>
          <span class="font-mono font-xs text-muted">Coursework Snippet</span>
        </div>
        <pre class="post-code-block"><code>${escapeHtml(post.codeSnippet)}</code></pre>
       </div>`
    : '';

  // Media preview rendering
  const mediaSrc = post.media || post.mediaUrl || '';
  const mediaHtml = mediaSrc
    ? `<div class="post-media-container">
        <img src="${escapeHtml(mediaSrc)}" alt="Showcase coursework artifact" class="post-media-image" loading="lazy" />
       </div>`
    : '';

  // Reaction chip icons
  const reactionChipsHtml = `
    <div class="post-reaction-chips">
      ${likeCount > 0 ? `<span class="reaction-chip" title="Like">&#128077; ${likeCount}</span>` : ''}
      ${heartCount > 0 ? `<span class="reaction-chip" title="Love">&#10084;&#65039; ${heartCount}</span>` : ''}
      ${celebrateCount > 0 ? `<span class="reaction-chip" title="Celebrate">&#127881; ${celebrateCount}</span>` : ''}
      ${ideaCount > 0 ? `<span class="reaction-chip" title="Insightful">&#128161; ${ideaCount}</span>` : ''}
      ${thinkingCount > 0 ? `<span class="reaction-chip" title="Curious">&#129300; ${thinkingCount}</span>` : ''}
      ${totalReactions === 0 ? '<span class="font-xs text-muted">Be the first to react</span>' : ''}
    </div>
  `;

  // Determine active reaction user state
  const isLiked = userHasReacted('like') || userHasReacted('heart') || userHasReacted('celebrate') || userHasReacted('idea') || userHasReacted('thinking');

  card.innerHTML = `
    <!-- Header: Author Avatar, Academic Semester, Coursework Pill, Timestamp -->
    <header class="post-header">
      <div class="post-author-box">
        <span class="avatar avatar-md">
          <img src="${escapeHtml(author.avatar || 'assets/images/avatar-1.svg')}" alt="${escapeHtml(author.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
        </span>
        <div class="post-author-details">
          <div class="post-author-name-row">
            <a href="pages/profile.html?userId=${escapeHtml(author.id)}" class="post-author-name">${escapeHtml(author.name)}</a>
            <span class="badge badge-secondary badge-xs">${escapeHtml(author.major || 'Computing')} &bull; ${escapeHtml(author.semester || 'Fall 2026')}</span>
          </div>
          <div class="post-meta-badges">
            <span class="badge badge-course ${courseClass} badge-xs">${escapeHtml(post.courseCode || 'GEN101')}</span>
            <span class="text-muted">&bull;</span>
            <time class="post-timestamp" datetime="${escapeHtml(post.createdAt)}">${relativeTime}</time>
          </div>
        </div>
      </div>
      <div class="post-header-options">
        <button type="button" class="btn btn-ghost btn-icon-sm btn-post-options" aria-label="Post options menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
    </header>

    <!-- Post Body: Title, Content Text, Code Snippets, Media Attachments, Tags -->
    <div class="post-body">
      ${post.title ? `<h3 class="post-title">${escapeHtml(post.title)}</h3>` : ''}
      <p class="post-text">${escapeHtml(post.content)}</p>
      ${codeSnippetHtml}
      ${mediaHtml}
      ${tagsHtml}
    </div>

    <!-- Reaction & Discussion Counters Summary Bar -->
    <div class="post-reactions-summary">
      <div class="reactions-summary-left">
        ${reactionChipsHtml}
      </div>
      <div class="post-counters font-xs text-muted">
        <span class="counter-comments" id="counter-comments-${post.id}">${commentsCount} comments</span>
        <span>&bull;</span>
        <span class="counter-shares" id="counter-shares-${post.id}">${sharesCount} shares</span>
      </div>
    </div>

    <!-- Interactive Action Tray: Multi-Reactions Bar, Comment Toggle, Share Modal -->
    <div class="post-action-tray">
      <!-- Reaction Picker Popover (Hidden by default) -->
      <div class="reactions-popover reaction-picker-popover hidden" id="reactionPopover-${post.id}" role="toolbar" aria-label="Coursework reactions">
        <button type="button" class="reaction-picker-btn" data-reaction="like" aria-label="React with Like" title="Like">&#128077;</button>
        <button type="button" class="reaction-picker-btn" data-reaction="heart" aria-label="React with Love" title="Love">&#10084;&#65039;</button>
        <button type="button" class="reaction-picker-btn" data-reaction="celebrate" aria-label="React with Celebrate" title="Celebrate">&#127881;</button>
        <button type="button" class="reaction-picker-btn" data-reaction="idea" aria-label="React with Insightful" title="Insightful">&#128161;</button>
        <button type="button" class="reaction-picker-btn" data-reaction="thinking" aria-label="React with Curious" title="Curious">&#129300;</button>
      </div>

      <!-- Main Action Buttons -->
      <button type="button" class="post-action-btn btn-reaction-toggle ${isLiked ? 'active' : ''}" aria-label="Like or react to post" id="btnReaction-${post.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        <span class="reaction-btn-label">${isLiked ? 'Reacted' : 'Like'}</span>
      </button>

      <button type="button" class="post-action-btn btn-comment-toggle" aria-label="Toggle comments for post" id="btnCommentToggle-${post.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Comment</span>
      </button>

      <button type="button" class="post-action-btn btn-share-post" aria-label="Open post share modal" id="btnShare-${post.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>
    </div>

    <!-- Comments Section Container (Toggled via Comment button) -->
    <section class="post-comments-section hidden" id="commentsSection-${post.id}" aria-label="Coursework peer reviews and comments">
      <!-- Comment Composer Input -->
      <form class="comment-composer-form" id="commentForm-${post.id}">
        <span class="avatar avatar-sm">
          <img src="${escapeHtml(currentUser ? currentUser.avatar : 'assets/images/avatar-1.svg')}" alt="User Avatar" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(getAuthorInitials(currentUser ? currentUser.name : 'User'))}</div>';" />
        </span>
        <input
          type="text"
          class="comment-input"
          id="commentInput-${post.id}"
          placeholder="Write academic feedback, peer review, or ask a question..."
          aria-label="Add peer comment on coursework"
          required
        />
        <button type="submit" class="btn btn-primary btn-comment-submit" aria-label="Submit comment">
          <span>Reply</span>
        </button>
      </form>

      <!-- Comments List (Threaded & Nested) -->
      <ul class="comments-list" id="commentsList-${post.id}">
        <!-- Dynamically rendered nested comments -->
      </ul>
    </section>
  `;

  // Attach interactive behavior
  attachPostCardListeners(card, post);

  return card;
}

/**
 * Attaches event listeners for reactions, comments, and sharing
 * @param {HTMLElement} card
 * @param {Object} post
 */
function attachPostCardListeners(card, post) {
  const reactionBtn = card.querySelector(`#btnReaction-${post.id}`);
  const popover = card.querySelector(`#reactionPopover-${post.id}`);
  const commentToggleBtn = card.querySelector(`#btnCommentToggle-${post.id}`);
  const commentsSection = card.querySelector(`#commentsSection-${post.id}`);
  const commentForm = card.querySelector(`#commentForm-${post.id}`);
  const commentInput = card.querySelector(`#commentInput-${post.id}`);
  const commentsList = card.querySelector(`#commentsList-${post.id}`);
  const shareBtn = card.querySelector(`#btnShare-${post.id}`);

  // 1. Reactions Toggle & Multi-Reactions Popover
  if (reactionBtn && popover) {
    let hideTimeout = null;

    const showPopover = () => {
      clearTimeout(hideTimeout);
      popover.classList.remove('hidden');
    };

    const hidePopover = () => {
      hideTimeout = setTimeout(() => {
        popover.classList.add('hidden');
      }, 300);
    };

    // Hover triggers
    reactionBtn.addEventListener('mouseenter', showPopover);
    reactionBtn.addEventListener('mouseleave', hidePopover);
    popover.addEventListener('mouseenter', showPopover);
    popover.addEventListener('mouseleave', hidePopover);

    // Direct click trigger: displays popover if hidden, otherwise toggles default reaction
    reactionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popover.classList.contains('hidden')) {
        showPopover();
      } else {
        try {
          state.toggleReaction(post.id, 'like');
          refreshPostReactions(card, post.id);
          popover.classList.add('hidden');
        } catch (err) {
          console.error('Reaction toggle error:', err);
        }
      }
    });

    // Multi-reactions button click
    popover.querySelectorAll('.reaction-picker-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reactionType = btn.dataset.reaction || 'like';
        try {
          state.toggleReaction(post.id, reactionType);
          popover.classList.add('hidden');
          refreshPostReactions(card, post.id);
        } catch (err) {
          console.error('Multi-reaction error:', err);
        }
      });
    });

    // Close popover when clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!card.contains(e.target)) {
        popover.classList.add('hidden');
      }
    });
  }

  // 2. Threaded Nested Comments Rendering & Handlers
  function renderCommentItem(c, isReply = false) {
    const commentAuthor = state.getUserById(c.authorId) || {
      name: 'Peer Scholar',
      avatar: 'assets/images/avatar-2.svg',
      major: 'Scholar'
    };
    const cInitials = getAuthorInitials(commentAuthor.name);
    const cTime = formatRelativeTime(c.createdAt);
    const avatarClass = isReply ? 'avatar-xs' : 'avatar-sm';

    return `
      <div class="comment-item ${isReply ? 'is-reply' : 'is-root'}" id="comment-${c.id}" data-comment-id="${c.id}">
        <span class="avatar ${avatarClass}">
          <img src="${escapeHtml(commentAuthor.avatar || 'assets/images/avatar-2.svg')}" alt="${escapeHtml(commentAuthor.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(cInitials)}</div>';" />
        </span>
        <div class="comment-bubble">
          <div class="comment-header">
            <div class="comment-header-left">
              <span class="comment-author-name">${escapeHtml(commentAuthor.name)}</span>
              ${commentAuthor.major ? `<span class="comment-author-meta text-muted font-xs">&bull; ${escapeHtml(commentAuthor.major)}</span>` : ''}
            </div>
            <time class="comment-time" datetime="${escapeHtml(c.createdAt || '')}">${cTime}</time>
          </div>
          <p class="comment-text">${escapeHtml(c.text)}</p>
          <div class="comment-actions">
            <button type="button" class="btn-comment-reply" data-comment-id="${c.id}" aria-label="Reply to comment by ${escapeHtml(commentAuthor.name)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 17 4 12 9 7"></polyline>
                <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
              </svg>
              <span>Reply</span>
            </button>
          </div>
          <!-- Inline Reply Composer Targeting parentCommentId: comment.id -->
          <div class="comment-reply-composer hidden" id="replyComposer-${c.id}">
            <form class="reply-composer-form" data-parent-id="${c.id}">
              <input
                type="text"
                class="comment-input reply-input"
                placeholder="Write a reply to ${escapeHtml(commentAuthor.name)}..."
                aria-label="Write reply to ${escapeHtml(commentAuthor.name)}"
                required
              />
              <div class="reply-composer-actions">
                <button type="button" class="btn btn-ghost btn-sm btn-reply-cancel" data-comment-id="${c.id}">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm btn-reply-submit">Reply</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  const renderComments = () => {
    if (!commentsList) return;
    const comments = state.getCommentsForPost(post.id) || [];
    if (comments.length === 0) {
      commentsList.innerHTML = `<li class="font-xs text-muted text-center py-3">No peer reviews yet. Be the first to provide feedback!</li>`;
      return;
    }

    const allIds = new Set(comments.map((c) => c.id));
    const rootComments = comments.filter((c) => {
      const pId = c.parentCommentId || c.parentId;
      return !pId || !allIds.has(pId);
    });
    const getReplies = (parentId) => comments.filter((c) => (c.parentCommentId === parentId || c.parentId === parentId));

    function renderRepliesRecursively(parentId) {
      const children = getReplies(parentId);
      if (!children.length) return '';
      return children.map((child) => {
        return renderCommentItem(child, true) + renderRepliesRecursively(child.id);
      }).join('');
    }

    commentsList.innerHTML = rootComments.map((root) => {
      const repliesHtml = renderRepliesRecursively(root.id);
      return `
        <li class="comment-thread" id="thread-${root.id}">
          ${renderCommentItem(root, false)}
          ${repliesHtml ? `<div class="comment-replies-list">${repliesHtml}</div>` : '<div class="comment-replies-list"></div>'}
        </li>
      `;
    }).join('');

    // Attach "Reply" button click listener to show inline reply composer
    commentsList.querySelectorAll('.btn-comment-reply').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const commentId = btn.dataset.commentId;
        const composer = commentsList.querySelector(`#replyComposer-${commentId}`);
        if (composer) {
          const wasHidden = composer.classList.contains('hidden');
          commentsList.querySelectorAll('.comment-reply-composer').forEach((c) => c.classList.add('hidden'));
          if (wasHidden) {
            composer.classList.remove('hidden');
            const input = composer.querySelector('.reply-input');
            if (input) input.focus();
          }
        }
      });
    });

    // Attach Cancel button handler
    commentsList.querySelectorAll('.btn-reply-cancel').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const commentId = btn.dataset.commentId;
        const composer = commentsList.querySelector(`#replyComposer-${commentId}`);
        if (composer) composer.classList.add('hidden');
      });
    });

    // Attach submit handler on inline reply forms
    commentsList.querySelectorAll('.reply-composer-form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const parentId = form.dataset.parentId;
        const input = form.querySelector('.reply-input');
        const replyText = input ? input.value.trim() : '';
        if (!replyText) return;

        try {
          state.addComment(post.id, replyText, parentId);
          renderComments(); // Re-render without collapsing comments section

          const updatedPost = state.getPostById(post.id);
          const countSpan = card.querySelector(`#counter-comments-${post.id}`);
          if (countSpan && updatedPost) {
            countSpan.textContent = `${updatedPost.commentsCount || 0} comments`;
          }
        } catch (err) {
          console.error('Nested reply submission error:', err);
        }
      });
    });
  };

  // Toggle comments section
  if (commentToggleBtn && commentsSection) {
    commentToggleBtn.addEventListener('click', () => {
      const isHidden = commentsSection.classList.contains('hidden');
      if (isHidden) {
        commentsSection.classList.remove('hidden');
        renderComments();
        if (commentInput) commentInput.focus();
      } else {
        commentsSection.classList.add('hidden');
      }
    });
  }

  // Top-level comment submission form
  if (commentForm && commentInput) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = commentInput.value.trim();
      if (!text) return;

      try {
        state.addComment(post.id, text, null);
        commentInput.value = '';
        renderComments(); // Re-render without collapsing

        const updatedPost = state.getPostById(post.id);
        const countSpan = card.querySelector(`#counter-comments-${post.id}`);
        if (countSpan && updatedPost) {
          countSpan.textContent = `${updatedPost.commentsCount || 0} comments`;
        }
      } catch (err) {
        console.error('Comment addition error:', err);
      }
    });
  }

  // 3. Post Share Modal via createModal
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const groups = typeof state.getGroups === 'function' ? state.getGroups() : [];
      const courseClass = getCourseCategoryBadgeClass(post.courseCode);
      const postUrl = typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}#post-${post.id}`
        : `https://showcase.university.edu/feed#post-${post.id}`;

      const groupOptionsHtml = groups.length > 0
        ? groups.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.name)} (${escapeHtml(g.code || 'GROUP')})</option>`).join('')
        : '<option value="" disabled>No active study groups available</option>';

      const modal = createModal({
        title: 'Share Coursework Showcase',
        content: `
          <div class="share-modal-container">
            <div class="share-post-preview mb-3">
              <span class="badge ${courseClass} badge-xs">${escapeHtml(post.courseCode || 'Coursework')}</span>
              <h4 class="font-sm font-bold text-primary mt-1">${escapeHtml(post.title || 'Coursework Showcase')}</h4>
              <p class="font-xs text-secondary mt-1">${escapeHtml(post.content || '')}</p>
            </div>

            <!-- Option 1: Share to Feed (with quote thought) -->
            <div class="share-option-card mb-3">
              <div class="share-option-header">
                <span class="share-option-icon">&#128221;</span>
                <strong class="font-sm text-primary">Share to Feed</strong>
              </div>
              <p class="font-xs text-muted mb-2">Quote this showcase onto your feed with academic commentary.</p>
              <textarea
                id="shareQuoteInput"
                class="form-control font-sm share-quote-input"
                rows="2"
                placeholder="Add your thoughts or review notes (optional)..."
                aria-label="Add quote thoughts for post"
              ></textarea>
              <div class="flex justify-end mt-2">
                <button type="button" class="btn btn-primary btn-sm btn-share-feed" id="btnConfirmShareFeed">
                  Share to Feed
                </button>
              </div>
            </div>

            <!-- Option 2: Share to Study Group -->
            <div class="share-option-card mb-3">
              <div class="share-option-header">
                <span class="share-option-icon">&#128101;</span>
                <strong class="font-sm text-primary">Share to Study Group</strong>
              </div>
              <p class="font-xs text-muted mb-2">Share directly with your group members and study cohort.</p>
              <div class="flex items-center gap-2">
                <select id="shareGroupSelect" class="form-control font-sm share-group-select" aria-label="Select study group" ${groups.length === 0 ? 'disabled' : ''}>
                  ${groupOptionsHtml}
                </select>
                <button type="button" class="btn btn-secondary btn-sm btn-share-group" id="btnConfirmShareGroup" ${groups.length === 0 ? 'disabled' : ''}>
                  Share to Group
                </button>
              </div>
            </div>

            <!-- Option 3: Copy Direct Link -->
            <div class="share-option-card">
              <div class="share-option-header">
                <span class="share-option-icon">&#128279;</span>
                <strong class="font-sm text-primary">Direct Showcase Link</strong>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  id="sharePostUrlInput"
                  class="form-control font-sm share-url-input"
                  value="${escapeHtml(postUrl)}"
                  readonly
                  aria-label="Direct post link"
                />
                <button type="button" class="btn btn-secondary btn-sm btn-copy-link" id="btnCopyShareUrl" aria-label="Copy direct share link">
                  Copy Link
                </button>
              </div>
              <div class="copy-feedback-msg font-xs text-success hidden mt-1" id="shareCopyFeedback">Copied to clipboard!</div>
            </div>
          </div>
        `,
        footerButtons: [
          {
            label: 'Close',
            className: 'btn btn-ghost',
            onClick: (m) => m.close()
          }
        ]
      });

      // Attach modal interactive listeners
      setTimeout(() => {
        const copyBtn = document.getElementById('btnCopyShareUrl');
        const urlInput = document.getElementById('sharePostUrlInput');
        const feedbackMsg = document.getElementById('shareCopyFeedback');
        const shareFeedBtn = document.getElementById('btnConfirmShareFeed');
        const shareGroupBtn = document.getElementById('btnConfirmShareGroup');
        const quoteInput = document.getElementById('shareQuoteInput');
        const groupSelect = document.getElementById('shareGroupSelect');

        // Copy direct link action
        if (copyBtn && urlInput) {
          copyBtn.addEventListener('click', () => {
            urlInput.select();
            let success = false;
            if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(urlInput.value).catch(() => {});
              success = true;
            }
            if (!success && typeof document !== 'undefined' && document.execCommand) {
              try {
                document.execCommand('copy');
                success = true;
              } catch (e) {}
            }
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied to clipboard!';
            copyBtn.classList.add('btn-success');
            if (feedbackMsg) feedbackMsg.classList.remove('hidden');

            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.classList.remove('btn-success');
              if (feedbackMsg) feedbackMsg.classList.add('hidden');
            }, 2000);
          });
        }

        // Share to Feed action
        if (shareFeedBtn) {
          shareFeedBtn.addEventListener('click', () => {
            const quoteText = quoteInput ? quoteInput.value.trim() : '';
            try {
              state.sharePost(post.id, { type: 'feed', quote: quoteText });
              const updated = state.getPostById(post.id);
              const countSpan = card.querySelector(`#counter-shares-${post.id}`);
              if (countSpan && updated) {
                countSpan.textContent = `${updated.sharesCount || 0} shares`;
              }
              shareFeedBtn.textContent = 'Shared to Feed!';
              shareFeedBtn.classList.add('btn-success');
              setTimeout(() => modal.close(), 600);
            } catch (err) {
              console.error('Share to feed error:', err);
            }
          });
        }

        // Share to Study Group action
        if (shareGroupBtn && groupSelect) {
          shareGroupBtn.addEventListener('click', () => {
            const selectedGroupId = groupSelect.value;
            if (!selectedGroupId) return;
            const quoteText = quoteInput ? quoteInput.value.trim() : '';
            try {
              state.sharePost(post.id, { type: 'group', groupId: selectedGroupId, quote: quoteText });
              const updated = state.getPostById(post.id);
              const countSpan = card.querySelector(`#counter-shares-${post.id}`);
              if (countSpan && updated) {
                countSpan.textContent = `${updated.sharesCount || 0} shares`;
              }
              shareGroupBtn.textContent = 'Shared to Group!';
              shareGroupBtn.classList.add('btn-success');
              setTimeout(() => modal.close(), 600);
            } catch (err) {
              console.error('Share to group error:', err);
            }
          });
        }
      }, 50);
    });
  }
}

/**
 * Dynamically refreshes post reaction summary bar and reaction button active state
 * @param {HTMLElement} card
 * @param {string} postId
 */
function refreshPostReactions(card, postId) {
  const post = state.getPostById(postId);
  if (!post) return;

  const currentUser = state.getCurrentUser();
  const currentUserId = currentUser ? currentUser.id : 'u1';
  const reactions = post.reactions || { like: [], heart: [], celebrate: [], idea: [], thinking: [] };

  const getReactionCount = (key) => (Array.isArray(reactions[key]) ? reactions[key].length : 0);
  const userHasReacted = (key) => Array.isArray(reactions[key]) && reactions[key].includes(currentUserId);

  const likeCount = getReactionCount('like');
  const heartCount = getReactionCount('heart');
  const celebrateCount = getReactionCount('celebrate');
  const ideaCount = getReactionCount('idea');
  const thinkingCount = getReactionCount('thinking');

  const summaryContainer = card.querySelector('.reactions-summary-left');
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="post-reaction-chips">
        ${likeCount > 0 ? `<span class="reaction-chip" title="Like">&#128077; ${likeCount}</span>` : ''}
        ${heartCount > 0 ? `<span class="reaction-chip" title="Love">&#10084;&#65039; ${heartCount}</span>` : ''}
        ${celebrateCount > 0 ? `<span class="reaction-chip" title="Celebrate">&#127881; ${celebrateCount}</span>` : ''}
        ${ideaCount > 0 ? `<span class="reaction-chip" title="Insightful">&#128161; ${ideaCount}</span>` : ''}
        ${thinkingCount > 0 ? `<span class="reaction-chip" title="Curious">&#129300; ${thinkingCount}</span>` : ''}
        ${(likeCount + heartCount + celebrateCount + ideaCount + thinkingCount) === 0 ? '<span class="font-xs text-muted">Be the first to react</span>' : ''}
      </div>
    `;
  }

  const reactionBtn = card.querySelector(`#btnReaction-${postId}`);
  const isLiked = userHasReacted('like') || userHasReacted('heart') || userHasReacted('celebrate') || userHasReacted('idea') || userHasReacted('thinking');
  if (reactionBtn) {
    if (isLiked) {
      reactionBtn.classList.add('active');
      const label = reactionBtn.querySelector('.reaction-btn-label');
      if (label) label.textContent = 'Reacted';
    } else {
      reactionBtn.classList.remove('active');
      const label = reactionBtn.querySelector('.reaction-btn-label');
      if (label) label.textContent = 'Like';
    }
  }
}
