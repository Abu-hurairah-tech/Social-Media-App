/**
 * Academic Coursework Showcase — User Profile Page Controller
 * js/pages/profile.js
 *
 * Manages profile viewing (own profile or ?userId= peer profile),
 * tab switching (Timeline, Project Showcases, Academic About, Cohort Peers),
 * timeline post filtering and creation, Edit Profile modal, and reactive updates.
 */

import { renderNavbar, initTheme } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { openModal } from '../components/modal.js';
import { renderPostCard, escapeHtml, getAuthorInitials } from '../components/postCard.js';
import { state } from '../store/state.js';

let activeProfileUserId = 'u1';
let activeTab = 'timeline';

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();
});

export function initProfilePage() {
  initTheme();

  // 1. Mount Global Shell Components with '../' base path for pages/ subdirectory
  const navbarMount = document.getElementById('navbarMount');
  if (navbarMount) {
    renderNavbar(navbarMount, { basePath: '../', activePage: 'profile' });
  }

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) {
    renderSidebar(sidebarMount, { basePath: '../', activePage: 'profile' });
  }

  const mobileNavMount = document.getElementById('mobileNavMount');
  if (mobileNavMount) {
    renderMobileBottomNav(mobileNavMount, { basePath: '../', activePage: 'profile' });
  }

  // 2. Resolve target profile user from URL (?userId= or ?id=) or current session
  let currentUser = state.getCurrentUser();
  if (!currentUser) {
    const users = (state.data && Array.isArray(state.data.users)) ? state.data.users : [];
    const defaultUser = users.find((u) => u.id === 'u1') || users[0];
    if (defaultUser) {
      state.setCurrentUser(defaultUser.id);
      currentUser = state.getCurrentUser();
    }
  }

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const requestedUserId = params ? (params.get('userId') || params.get('id')) : null;
  const requestedUser = requestedUserId ? state.getUserById(requestedUserId) : null;
  activeProfileUserId = requestedUser ? requestedUser.id : (currentUser ? currentUser.id : 'u1');

  // 3. Initial Render
  renderAllProfileSections();

  // 4. Attach Listeners
  setupPeerSwitcher();
  setupTabListeners();
  setupProfileActionListeners();
  setupQuickPostForm();
  setupStateSubscriptions();
}

function getTargetUser() {
  return state.getUserById(activeProfileUserId) || state.getCurrentUser() || state.data.users[0];
}

function isOwnProfile() {
  const currentUser = state.getCurrentUser();
  const targetUser = getTargetUser();
  return Boolean(currentUser && targetUser && currentUser.id === targetUser.id);
}

function renderAllProfileSections() {
  const user = getTargetUser();
  if (!user) return;

  renderPeerSwitcherState(user.id);
  renderProfileHeader(user);
  renderRightRailWidgets(user);
  renderActiveTabContent(user);
}

function renderPeerSwitcherState(selectedId) {
  const pills = document.querySelectorAll('#peerSwitcherList .peer-pill');
  pills.forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.userId === selectedId);
  });
}

function renderProfileHeader(user) {
  const userPosts = state.getPosts({ userId: user.id });
  const projectPosts = userPosts.filter((p) => Boolean(p.media || p.mediaUrl || p.codeSnippet));
  const friends = state.getFriends(user.id);
  const ownProfile = isOwnProfile();

  const coverImg = document.getElementById('profileCoverImg');
  if (coverImg) {
    const coverPath = user.coverImage || 'assets/images/cover-default.svg';
    coverImg.src = coverPath.startsWith('..') || coverPath.startsWith('http') ? coverPath : `../${coverPath}`;
    coverImg.alt = `${user.name} cover banner`;
  }

  const avatarImg = document.getElementById('profileAvatarImg');
  if (avatarImg) {
    const avatarPath = user.avatar || 'assets/images/avatar-1.svg';
    avatarImg.src = avatarPath.startsWith('..') || avatarPath.startsWith('http') ? avatarPath : `../${avatarPath}`;
    avatarImg.alt = user.name;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('profileUniversityBadge', user.university || 'Pacific University');
  setText('profileName', user.name || 'Student Scholar');
  setText('profileYearBadge', user.year || 'Scholar');
  setText('profileHeadline', user.headline || `${user.major || 'Computer Science'} Student`);
  setText('profileMajorBadge', user.major || 'Computer Science');
  setText('profileSemesterBadge', user.semester || 'Fall 2026');
  setText('profileStudentIdBadge', user.studentId || 'PU-2026-001');
  setText('profileLocation', user.location || 'University Campus');
  setText('profileBio', user.bio || 'Academic Coursework Showcase member.');

  // Stats Bar
  setText('statPostsCount', String(userPosts.length));
  setText('statProjectsCount', String(projectPosts.length || userPosts.length));
  setText('statFriendsCount', String(friends.length));
  setText('statGpaValue', user.gpa || '3.80');

  // Action Buttons
  const editBtn = document.getElementById('btnEditProfile');
  const coverEditBtn = document.getElementById('btnEditCover');
  const friendActionBtn = document.getElementById('btnProfileFriendAction');
  const msgBtn = document.getElementById('btnProfileMessage');
  const quickComposer = document.getElementById('profileQuickComposerCard');

  if (editBtn) editBtn.classList.toggle('hidden', !ownProfile);
  if (coverEditBtn) coverEditBtn.classList.toggle('hidden', !ownProfile);
  if (quickComposer) quickComposer.classList.toggle('hidden', !ownProfile);

  if (ownProfile) {
    if (friendActionBtn) friendActionBtn.classList.add('hidden');
    if (msgBtn) msgBtn.classList.add('hidden');
    const composerAvatar = document.getElementById('profileComposerAvatar');
    if (composerAvatar) {
      const av = user.avatar || 'assets/images/avatar-1.svg';
      composerAvatar.src = av.startsWith('..') ? av : `../${av}`;
    }
  } else {
    if (msgBtn) {
      msgBtn.classList.remove('hidden');
      msgBtn.href = `chat.html?userId=${encodeURIComponent(user.id)}`;
    }
    if (friendActionBtn) {
      friendActionBtn.classList.remove('hidden');
      const currentUser = state.getCurrentUser();
      const isFriend = currentUser && Array.isArray(currentUser.friends) && currentUser.friends.includes(user.id);
      const reqs = state.getFriendRequests();
      const hasOutgoing = reqs.outgoing && reqs.outgoing.some((r) => r.receiverId === user.id);

      if (isFriend) {
        friendActionBtn.textContent = 'Connected Peer';
        friendActionBtn.disabled = true;
      } else if (hasOutgoing) {
        friendActionBtn.textContent = 'Request Sent';
        friendActionBtn.disabled = true;
      } else {
        friendActionBtn.textContent = 'Add Study Peer';
        friendActionBtn.disabled = false;
      }
    }
  }
}

function renderActiveTabContent(user) {
  const panels = {
    timeline: document.getElementById('profileTabTimeline'),
    projects: document.getElementById('profileTabProjects'),
    about: document.getElementById('profileTabAbout'),
    friends: document.getElementById('profileTabFriends')
  };

  Object.entries(panels).forEach(([key, panel]) => {
    if (panel) panel.classList.toggle('hidden', key !== activeTab);
  });

  if (activeTab === 'timeline') renderTimelineTab(user);
  if (activeTab === 'projects') renderProjectsTab(user);
  if (activeTab === 'about') renderAboutTab(user);
  if (activeTab === 'friends') renderFriendsTab(user);
}

function renderTimelineTab(user) {
  const stream = document.getElementById('profile-timeline-stream');
  if (!stream) return;

  const posts = state.getPosts({ userId: user.id });
  stream.innerHTML = '';

  if (!posts.length) {
    stream.innerHTML = `
      <div class="card p-6 text-center">
        <h3 class="font-base font-weight-semibold">No Timeline Posts Yet</h3>
        <p class="font-sm text-secondary mt-1">${escapeHtml(user.name)} hasn't published any coursework showcases yet.</p>
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    stream.appendChild(renderPostCard(post, { basePath: '../' }));
  });
}

function renderProjectsTab(user) {
  const grid = document.getElementById('profile-projects-grid');
  if (!grid) return;

  const posts = state.getPosts({ userId: user.id });
  if (!posts.length) {
    grid.innerHTML = `
      <div class="card p-6 text-center" style="grid-column: 1 / -1;">
        <h3 class="font-base font-weight-semibold">No Project Showcases</h3>
        <p class="font-sm text-secondary mt-1">Coursework artifacts and code projects will appear here.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.map((post) => {
    const thumbSrc = post.media || post.mediaUrl || 'assets/images/project-1.svg';
    const resolvedThumb = thumbSrc.startsWith('..') || thumbSrc.startsWith('http') ? thumbSrc : `../${thumbSrc}`;
    const totalReactions = post.reactions
      ? Object.values(post.reactions).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      : 0;

    return `
      <article class="card project-showcase-card">
        <div class="project-showcase-thumb">
          <img src="${escapeHtml(resolvedThumb)}" alt="${escapeHtml(post.title || 'Project Showcase')}" />
        </div>
        <div class="project-showcase-body">
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-course badge-xs">${escapeHtml(post.courseCode || 'GEN101')}</span>
            <span class="font-xs text-muted">${escapeHtml(new Date(post.createdAt).toLocaleDateString())}</span>
          </div>
          <h3 class="project-showcase-title">${escapeHtml(post.title || 'Coursework Showcase')}</h3>
          <p class="project-showcase-desc">${escapeHtml(post.content || '')}</p>
          <div class="project-showcase-footer">
            <span>${totalReactions} reactions</span>
            <span>${post.commentsCount || 0} comments</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderAboutTab(user) {
  const container = document.getElementById('profile-about-content');
  if (!container) return;

  const skills = Array.isArray(user.skills) ? user.skills : [];
  const courses = Array.isArray(user.courses) ? user.courses : [];

  container.innerHTML = `
    <div class="card about-section-card full-span">
      <h3 class="font-base font-weight-bold">Academic Biography</h3>
      <p class="font-sm text-secondary">${escapeHtml(user.bio || 'No biography added yet.')}</p>
    </div>

    <div class="card about-section-card">
      <h3 class="font-base font-weight-bold">University Credentials</h3>
      <div class="about-detail-list">
        <div class="about-detail-item">
          <span class="about-detail-label">University</span>
          <span class="about-detail-value">${escapeHtml(user.university || 'Pacific University')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Department</span>
          <span class="about-detail-value">${escapeHtml(user.department || 'School of Computing')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Major</span>
          <span class="about-detail-value">${escapeHtml(user.major || 'Computer Science')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Academic Year</span>
          <span class="about-detail-value">${escapeHtml(user.year || 'Senior')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Student ID</span>
          <span class="about-detail-value">${escapeHtml(user.studentId || 'PU-2026-001')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Cumulative GPA</span>
          <span class="about-detail-value">${escapeHtml(user.gpa || '3.80')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Lab / Location</span>
          <span class="about-detail-value">${escapeHtml(user.location || 'Campus Science Center')}</span>
        </div>
      </div>
    </div>

    <div class="card about-section-card">
      <h3 class="font-base font-weight-bold">Skills &amp; Enrolled Courses</h3>
      <div>
        <div class="font-xs font-weight-semibold text-muted mb-2">Technical Competencies</div>
        <div class="skills-cloud">
          ${skills.length
            ? skills.map((s) => `<span class="badge badge-secondary">${escapeHtml(s)}</span>`).join('')
            : '<span class="font-xs text-muted">No skills listed</span>'}
        </div>
      </div>
      <div class="mt-2">
        <div class="font-xs font-weight-semibold text-muted mb-2">Active Courses (${escapeHtml(user.semester || 'Fall 2026')})</div>
        <div class="skills-cloud">
          ${courses.length
            ? courses.map((c) => `<span class="badge badge-course">${escapeHtml(c)}</span>`).join('')
            : '<span class="font-xs text-muted">No courses listed</span>'}
        </div>
      </div>
    </div>
  `;
}

function renderFriendsTab(user) {
  const grid = document.getElementById('profile-friends-grid');
  if (!grid) return;

  const friends = state.getFriends(user.id);
  if (!friends.length) {
    grid.innerHTML = `
      <div class="card p-6 text-center" style="grid-column: 1 / -1;">
        <h3 class="font-base font-weight-semibold">No Study Peers Connected</h3>
        <p class="font-sm text-secondary mt-1">Visit the <a href="friends.html" class="text-primary">Friends Directory</a> to connect with classmates.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = friends.map((friend) => {
    const avatarPath = friend.avatar || 'assets/images/avatar-2.svg';
    const resolvedAvatar = avatarPath.startsWith('..') || avatarPath.startsWith('http') ? avatarPath : `../${avatarPath}`;
    const initials = getAuthorInitials(friend.name);

    return `
      <div class="card profile-friend-card">
        <span class="avatar avatar-md">
          <img src="${escapeHtml(resolvedAvatar)}" alt="${escapeHtml(friend.name)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-fallback\\'>${escapeHtml(initials)}</div>';" />
        </span>
        <div class="profile-friend-info">
          <a href="profile.html?userId=${escapeHtml(friend.id)}" class="profile-friend-name">${escapeHtml(friend.name)}</a>
          <div class="font-xs text-muted">${escapeHtml(friend.major || 'Computer Science')} &bull; ${escapeHtml(friend.year || 'Scholar')}</div>
          <div class="profile-friend-actions">
            <a href="profile.html?userId=${escapeHtml(friend.id)}" class="btn btn-outline-primary btn-xs">View Profile</a>
            <a href="chat.html?userId=${escapeHtml(friend.id)}" class="btn btn-secondary btn-xs">Message</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRightRailWidgets(user) {
  const credBody = document.getElementById('profileCredentialsBody');
  if (credBody) {
    credBody.innerHTML = `
      <div class="about-detail-list">
        <div class="about-detail-item">
          <span class="about-detail-label">Department</span>
          <span class="about-detail-value">${escapeHtml(user.department || 'School of Computing')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">Semester</span>
          <span class="about-detail-value">${escapeHtml(user.semester || 'Fall 2026')}</span>
        </div>
        <div class="about-detail-item">
          <span class="about-detail-label">GPA</span>
          <span class="about-detail-value">${escapeHtml(user.gpa || '3.80')}</span>
        </div>
      </div>
    `;
  }

  const skillsBody = document.getElementById('profileSkillsBody');
  if (skillsBody) {
    const skills = Array.isArray(user.skills) ? user.skills : [];
    skillsBody.innerHTML = `<div class="skills-cloud">${
      skills.length
        ? skills.map((s) => `<span class="badge badge-secondary badge-xs">${escapeHtml(s)}</span>`).join('')
        : '<span class="font-xs text-muted">No skills added</span>'
    }</div>`;
  }

  const coursesBody = document.getElementById('profileCoursesBody');
  if (coursesBody) {
    const courses = Array.isArray(user.courses) ? user.courses : [];
    coursesBody.innerHTML = `<div class="skills-cloud">${
      courses.length
        ? courses.map((c) => `<a href="../index.html?filter=${encodeURIComponent(c)}" class="badge badge-course badge-xs">${escapeHtml(c)}</a>`).join('')
        : '<span class="font-xs text-muted">No enrolled courses</span>'
    }</div>`;
  }
}

function setupPeerSwitcher() {
  const pills = document.querySelectorAll('#peerSwitcherList .peer-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const targetId = pill.dataset.userId;
      if (targetId && state.getUserById(targetId)) {
        activeProfileUserId = targetId;
        renderAllProfileSections();
      }
    });
  });
}

function setupTabListeners() {
  const tabBtns = document.querySelectorAll('#profileTabs .profile-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = btn.dataset.tab || 'timeline';
      activeTab = nextTab;

      tabBtns.forEach((b) => {
        const isSelected = b.dataset.tab === nextTab;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });

      renderActiveTabContent(getTargetUser());
    });
  });
}

function setupProfileActionListeners() {
  const editBtn = document.getElementById('btnEditProfile');
  const coverEditBtn = document.getElementById('btnEditCover');
  const friendActionBtn = document.getElementById('btnProfileFriendAction');

  if (editBtn) {
    editBtn.addEventListener('click', () => openEditProfileModal());
  }
  if (coverEditBtn) {
    coverEditBtn.addEventListener('click', () => openEditProfileModal());
  }

  if (friendActionBtn) {
    friendActionBtn.addEventListener('click', () => {
      const target = getTargetUser();
      if (!target) return;
      const sent = state.sendFriendRequest(target.id);
      if (sent) {
        friendActionBtn.textContent = 'Request Sent';
        friendActionBtn.disabled = true;
      }
    });
  }
}

export function openEditProfileModal() {
  const user = getTargetUser();
  if (!user) return;

  const modal = openModal({
    title: 'Edit Academic Profile',
    content: `
      <form id="editProfileForm" class="edit-profile-form">
        <div class="edit-profile-row">
          <div class="edit-profile-field">
            <label for="editProfileName" class="form-label font-xs">Full Name</label>
            <input type="text" id="editProfileName" class="form-control form-control-sm" value="${escapeHtml(user.name || '')}" required />
          </div>
          <div class="edit-profile-field">
            <label for="editProfileHeadline" class="form-label font-xs">Academic Headline</label>
            <input type="text" id="editProfileHeadline" class="form-control form-control-sm" value="${escapeHtml(user.headline || '')}" />
          </div>
        </div>

        <div class="edit-profile-row">
          <div class="edit-profile-field">
            <label for="editProfileMajor" class="form-label font-xs">Major</label>
            <input type="text" id="editProfileMajor" class="form-control form-control-sm" value="${escapeHtml(user.major || '')}" />
          </div>
          <div class="edit-profile-field">
            <label for="editProfileDepartment" class="form-label font-xs">Department</label>
            <input type="text" id="editProfileDepartment" class="form-control form-control-sm" value="${escapeHtml(user.department || '')}" />
          </div>
        </div>

        <div class="edit-profile-row">
          <div class="edit-profile-field">
            <label for="editProfileYear" class="form-label font-xs">Academic Year</label>
            <input type="text" id="editProfileYear" class="form-control form-control-sm" value="${escapeHtml(user.year || '')}" />
          </div>
          <div class="edit-profile-field">
            <label for="editProfileGpa" class="form-label font-xs">Cumulative GPA</label>
            <input type="text" id="editProfileGpa" class="form-control form-control-sm" value="${escapeHtml(user.gpa || '')}" />
          </div>
        </div>

        <div class="edit-profile-field">
          <label for="editProfileLocation" class="form-label font-xs">Campus Lab / Location</label>
          <input type="text" id="editProfileLocation" class="form-control form-control-sm" value="${escapeHtml(user.location || '')}" />
        </div>

        <div class="edit-profile-field">
          <label for="editProfileBio" class="form-label font-xs">Academic Biography</label>
          <textarea id="editProfileBio" class="form-control form-control-sm" rows="3">${escapeHtml(user.bio || '')}</textarea>
        </div>

        <div class="edit-profile-row">
          <div class="edit-profile-field">
            <label for="editProfileSkills" class="form-label font-xs">Skills (comma-separated)</label>
            <input type="text" id="editProfileSkills" class="form-control form-control-sm" value="${escapeHtml((user.skills || []).join(', '))}" />
          </div>
          <div class="edit-profile-field">
            <label for="editProfileCourses" class="form-label font-xs">Courses (comma-separated)</label>
            <input type="text" id="editProfileCourses" class="form-control form-control-sm" value="${escapeHtml((user.courses || []).join(', '))}" />
          </div>
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
        label: 'Save Changes',
        className: 'btn btn-primary btn-sm',
        onClick: (m) => {
          const nameInput = document.getElementById('editProfileName');
          const nameVal = nameInput ? nameInput.value.trim() : '';
          if (!nameVal) {
            nameInput?.focus();
            return;
          }

          const parseCsv = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.split(',').map((s) => s.trim()).filter(Boolean) : [];
          };

          const updates = {
            name: nameVal,
            headline: document.getElementById('editProfileHeadline')?.value.trim() || user.headline,
            major: document.getElementById('editProfileMajor')?.value.trim() || user.major,
            department: document.getElementById('editProfileDepartment')?.value.trim() || user.department,
            year: document.getElementById('editProfileYear')?.value.trim() || user.year,
            gpa: document.getElementById('editProfileGpa')?.value.trim() || user.gpa,
            location: document.getElementById('editProfileLocation')?.value.trim() || user.location,
            bio: document.getElementById('editProfileBio')?.value.trim() || user.bio,
            skills: parseCsv('editProfileSkills'),
            courses: parseCsv('editProfileCourses')
          };

          state.updateProfile(user.id, updates);
          m.close();
          renderAllProfileSections();

          const navbarMount = document.getElementById('navbarMount');
          if (navbarMount) renderNavbar(navbarMount, { basePath: '../', activePage: 'profile' });
          const sidebarMount = document.getElementById('sidebarMount');
          if (sidebarMount) renderSidebar(sidebarMount, { basePath: '../', activePage: 'profile' });
        }
      }
    ]
  });

  return modal;
}

function setupQuickPostForm() {
  const form = document.getElementById('profileQuickPostForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('profilePostTitle');
    const contentEl = document.getElementById('profilePostContent');
    const courseEl = document.getElementById('profilePostCourse');

    const content = contentEl ? contentEl.value.trim() : '';
    if (!content) {
      contentEl?.focus();
      return;
    }

    const courseCode = courseEl ? courseEl.value : 'CS501';
    const title = titleEl && titleEl.value.trim() ? titleEl.value.trim() : `${courseCode} Coursework Update`;

    state.createPost({
      title,
      content,
      courseCode,
      tags: [`#${courseCode}`, '#ProfileShowcase']
    });

    form.reset();
    renderAllProfileSections();
  });
}

function setupStateSubscriptions() {
  state.subscribe('user:updated', () => renderAllProfileSections());
  state.subscribe('posts:created', () => renderAllProfileSections());
  state.subscribe('posts:updated', () => {
    if (activeTab === 'timeline') renderTimelineTab(getTargetUser());
  });
  state.subscribe('friends:updated', () => renderAllProfileSections());
}
