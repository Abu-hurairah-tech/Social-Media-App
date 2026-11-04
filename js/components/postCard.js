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
          <img src="${escapeHtml(author.avatar || 'assets/images/avatar-1.svg')}" alt="${escapeHtml(author.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${initials}</div>';" />
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
      <div class="reaction-picker-popover hidden" id="reactionPopover-${post.id}">
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
          <img src="${escapeHtml(currentUser ? currentUser.avatar : 'assets/images/avatar-1.svg')}" alt="User Avatar" />
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

      <!-- Comments List -->
      <ul class="comments-list" id="commentsList-${post.id}">
        <!-- Dynamically rendered comments -->
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

  // 1. Reactions Toggle & Popover
  if (reactionBtn && popover) {
    let hideTimeout = null;

    const showPopover = () => {
      clearTimeout(hideTimeout);
      popover.classList.remove('hidden');
    };

    const hidePopover = () => {
      hideTimeout = setTimeout(() => {
        popover.classList.add('hidden');
      }, 350);
    };

    // Long press or mouse hover shows multi-reactions popover
    reactionBtn.addEventListener('mouseenter', showPopover);
    reactionBtn.addEventListener('mouseleave', hidePopover);
    popover.addEventListener('mouseenter', showPopover);
    popover.addEventListener('mouseleave', hidePopover);

    // Direct click toggles default 'like' reaction
    reactionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        state.toggleReaction(post.id, 'like');
        refreshPostReactions(card, post.id);
      } catch (err) {
        console.error('Reaction error:', err);
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
  }

  // 2. Comments Toggle & Render
  let commentsLoaded = false;
  const renderComments = () => {
    if (!commentsList) return;
    const comments = state.getCommentsForPost(post.id);
    if (!comments || comments.length === 0) {
      commentsList.innerHTML = `<li class="font-xs text-muted text-center py-2">No peer reviews yet. Be the first to provide feedback!</li>`;
      return;
    }

    commentsList.innerHTML = comments.map((c) => {
      const commentAuthor = state.getUserById(c.authorId) || {
        name: 'Peer Scholar',
        avatar: 'assets/images/avatar-2.svg'
      };
      const cInitials = getAuthorInitials(commentAuthor.name);
      const cTime = formatRelativeTime(c.createdAt);

      return `
        <li class="comment-item" id="comment-${c.id}">
          <span class="avatar avatar-sm">
            <img src="${escapeHtml(commentAuthor.avatar || 'assets/images/avatar-2.svg')}" alt="${escapeHtml(commentAuthor.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${cInitials}</div>';" />
          </span>
          <div class="comment-bubble">
            <div class="comment-header">
              <span class="comment-author-name">${escapeHtml(commentAuthor.name)}</span>
              <time class="comment-time">${cTime}</time>
            </div>
            <p class="comment-text">${escapeHtml(c.text)}</p>
          </div>
        </li>
      `;
    }).join('');
  };

  if (commentToggleBtn && commentsSection) {
    commentToggleBtn.addEventListener('click', () => {
      const isHidden = commentsSection.classList.contains('hidden');
      if (isHidden) {
        commentsSection.classList.remove('hidden');
        if (!commentsLoaded) {
          renderComments();
          commentsLoaded = true;
        }
        if (commentInput) commentInput.focus();
      } else {
        commentsSection.classList.add('hidden');
      }
    });
  }

  // Comment submission form
  if (commentForm && commentInput) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = commentInput.value.trim();
      if (!text) return;

      try {
        state.addComment(post.id, text);
        commentInput.value = '';
        renderComments();

        // Update comment counter in UI
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

  // 3. Share Action connecting to openModal
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const postUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}#post-${post.id}`
        : `#post-${post.id}`;

      openModal({
        title: 'Share Coursework Showcase',
        content: `
          <div class="share-modal-container">
            <p class="font-sm text-secondary mb-3">
              Share <strong>${escapeHtml(post.title || 'Coursework Showcase')}</strong> with your academic network or study groups.
            </p>
            <div class="form-group mb-4">
              <label for="sharePostUrlInput" class="form-label font-xs">Direct Link:</label>
              <div class="flex items-center gap-2">
                <input type="text" id="sharePostUrlInput" class="form-control font-sm" value="${escapeHtml(postUrl)}" readonly />
                <button type="button" class="btn btn-primary" id="btnCopyShareUrl" aria-label="Copy direct share link">Copy</button>
              </div>
            </div>
            <div class="share-channels flex flex-col gap-2">
              <button type="button" class="btn btn-outline text-start justify-start gap-2" id="btnShareTimeline" aria-label="Share to my profile timeline">
                <span>&#128221;</span>
                <span>Share to My Academic Timeline</span>
              </button>
              <button type="button" class="btn btn-outline text-start justify-start gap-2" id="btnShareGroup" aria-label="Share to study group cohort">
                <span>&#128101;</span>
                <span>Share to Study Group Cohort</span>
              </button>
            </div>
          </div>
        `,
        footerButtons: [
          {
            label: 'Close',
            className: 'btn btn-secondary',
            onClick: (modal) => modal.close()
          }
        ]
      });

      // Attach copy link listener inside modal
      setTimeout(() => {
        const copyBtn = document.getElementById('btnCopyShareUrl');
        const input = document.getElementById('sharePostUrlInput');
        if (copyBtn && input) {
          copyBtn.addEventListener('click', () => {
            input.select();
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(input.value);
            }
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.replace('btn-primary', 'btn-success');
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.classList.replace('btn-success', 'btn-primary');
            }, 2000);
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
