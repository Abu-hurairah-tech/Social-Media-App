/**
 * Academic Coursework Showcase — Authentication Page Controller
 * js/pages/auth.js
 *
 * ES6 module controlling authentication logic, client-side input validation,
 * demo credentials quick-fill, session management, and PubSub store integration.
 */

import { state, store } from '../store/state.js';

// ============================================================================
// Constants & Configuration
// ============================================================================
const REMEMBER_ME_KEY = 'academic_showcase_remembered_id';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// DOM Elements Cache
// ============================================================================
let dom = null;

function cacheDomElements() {
  dom = {
    // Tabs & Forms
    tabSignIn: document.getElementById('tabSignIn'),
    tabSignUp: document.getElementById('tabSignUp'),
    loginForm: document.getElementById('auth-form-login'),
    signupForm: document.getElementById('auth-form-signup'),
    authFormsContainer: document.getElementById('authFormsContainer'),
    btnSwitchToSignUp: document.getElementById('btnSwitchToSignUp'),
    btnSwitchToSignIn: document.getElementById('btnSwitchToSignIn'),

    // Sign In Inputs
    loginIdentifier: document.getElementById('loginIdentifier'),
    loginPassword: document.getElementById('loginPassword'),
    rememberMe: document.getElementById('rememberMe'),
    loginSubmitBtn: document.getElementById('loginSubmitBtn'),
    toggleLoginPasswordBtn: document.getElementById('toggleLoginPasswordBtn'),
    linkForgotPassword: document.getElementById('linkForgotPassword'),
    loginIdentifierError: document.getElementById('loginIdentifierError'),
    loginPasswordError: document.getElementById('loginPasswordError'),

    // Sign Up Inputs
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupMajor: document.getElementById('signupMajor'),
    signupYear: document.getElementById('signupYear'),
    signupStudentId: document.getElementById('signupStudentId'),
    signupPassword: document.getElementById('signupPassword'),
    signupPasswordConfirm: document.getElementById('signupPasswordConfirm'),
    signupTerms: document.getElementById('signupTerms'),
    signupSubmitBtn: document.getElementById('signupSubmitBtn'),
    passwordMeterContainer: document.getElementById('passwordMeterContainer'),
    meterFill: document.getElementById('meterFill'),
    meterLabel: document.getElementById('meterLabel'),

    // Sign Up Errors
    signupNameError: document.getElementById('signupNameError'),
    signupEmailError: document.getElementById('signupEmailError'),
    signupMajorError: document.getElementById('signupMajorError'),
    signupStudentIdError: document.getElementById('signupStudentIdError'),
    signupPasswordError: document.getElementById('signupPasswordError'),
    signupPasswordConfirmError: document.getElementById('signupPasswordConfirmError'),
    signupTermsError: document.getElementById('signupTermsError'),

    // Active Session Card
    activeSessionCard: document.getElementById('activeSessionCard'),
    sessionUserAvatar: document.getElementById('sessionUserAvatar'),
    sessionUserName: document.getElementById('sessionUserName'),
    sessionUserDept: document.getElementById('sessionUserDept'),
    sessionUserStudentId: document.getElementById('sessionUserStudentId'),
    sessionUserEmail: document.getElementById('sessionUserEmail'),
    btnLogoutSession: document.getElementById('btnLogoutSession'),
    btnContinueToFeed: document.getElementById('btnContinueToFeed'),

    // Alerts & Notifications
    authAlertContainer: document.getElementById('authAlertContainer'),
    authAlert: document.getElementById('authAlert'),
    authAlertIcon: document.getElementById('authAlertIcon'),
    authAlertMessage: document.getElementById('authAlertMessage'),
    authAlertClose: document.getElementById('authAlertClose'),
    authToast: document.getElementById('authToast'),
    authToastMessage: document.getElementById('authToastMessage'),

    // Theme Toggle
    authThemeToggleBtn: document.getElementById('authThemeToggleBtn')
  };
}

// ============================================================================
// UI Feedback: Alerts & Toast Notifications
// ============================================================================
export function showAlert(type, message) {
  if (!dom || !dom.authAlertContainer || !dom.authAlertMessage) return;

  dom.authAlert.className = `auth-alert ${type}`;
  dom.authAlertMessage.textContent = message;

  if (dom.authAlertIcon) {
    if (type === 'error') dom.authAlertIcon.textContent = '⚠️';
    else if (type === 'success') dom.authAlertIcon.textContent = '✅';
    else dom.authAlertIcon.textContent = 'ℹ️';
  }

  dom.authAlertContainer.style.display = 'block';
  dom.authAlertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function hideAlert() {
  if (!dom || !dom.authAlertContainer) return;
  dom.authAlertContainer.style.display = 'none';
}

let toastTimeout = null;
export function showToast(message, duration = 3200) {
  if (!dom || !dom.authToast || !dom.authToastMessage) return;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  dom.authToastMessage.textContent = message;
  dom.authToast.style.display = 'flex';

  toastTimeout = setTimeout(() => {
    if (dom.authToast) {
      dom.authToast.style.display = 'none';
    }
  }, duration);
}

// ============================================================================
// Tab Navigation Switching
// ============================================================================
export function switchTab(targetTab) {
  hideAlert();
  clearInputErrors();

  const isLogin = targetTab === 'login';

  if (dom.tabSignIn) {
    dom.tabSignIn.classList.toggle('active', isLogin);
    dom.tabSignIn.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  }

  if (dom.tabSignUp) {
    dom.tabSignUp.classList.toggle('active', !isLogin);
    dom.tabSignUp.setAttribute('aria-selected', !isLogin ? 'true' : 'false');
  }

  if (dom.loginForm) {
    dom.loginForm.style.display = isLogin ? 'flex' : 'none';
    dom.loginForm.classList.toggle('active', isLogin);
  }

  if (dom.signupForm) {
    dom.signupForm.style.display = isLogin ? 'none' : 'flex';
    dom.signupForm.classList.toggle('active', !isLogin);
  }

  // Update URL hash without jumping page
  if (typeof history !== 'undefined' && history.replaceState) {
    history.replaceState(null, '', isLogin ? '#signin' : '#signup');
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================
function setFieldError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add('is-invalid');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFieldError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove('is-invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

export function clearInputErrors() {
  if (!dom) return;
  const errorElements = [
    [dom.loginIdentifier, dom.loginIdentifierError],
    [dom.loginPassword, dom.loginPasswordError],
    [dom.signupName, dom.signupNameError],
    [dom.signupEmail, dom.signupEmailError],
    [dom.signupMajor, dom.signupMajorError],
    [dom.signupStudentId, dom.signupStudentIdError],
    [dom.signupPassword, dom.signupPasswordError],
    [dom.signupPasswordConfirm, dom.signupPasswordConfirmError],
    [dom.signupTerms, dom.signupTermsError]
  ];

  errorElements.forEach(([inputEl, errorEl]) => {
    clearFieldError(inputEl, errorEl);
  });
}

function calculatePasswordStrength(password) {
  if (!password) return { score: 0, text: 'Password strength', color: 'transparent', width: '0%' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score: 1, text: 'Weak — add numbers & capital letters', color: 'var(--color-danger)', width: '25%' };
  } else if (score <= 3) {
    return { score: 2, text: 'Moderate — consider adding symbols', color: 'var(--color-warning)', width: '60%' };
  } else {
    return { score: 3, text: 'Strong institutional password', color: 'var(--color-success)', width: '100%' };
  }
}

// ============================================================================
// Session State & Reflection
// ============================================================================
export function renderSessionState() {
  if (!dom) return;

  const currentUser = store.getCurrentUser();

  if (currentUser) {
    // User is logged in: show active session card, hide auth forms
    if (dom.sessionUserName) dom.sessionUserName.textContent = currentUser.name || 'Student Scholar';
    if (dom.sessionUserDept) {
      dom.sessionUserDept.textContent = `${currentUser.department || 'School of Computing'} • ${currentUser.major || 'Computer Science'}`;
    }
    if (dom.sessionUserStudentId) dom.sessionUserStudentId.textContent = currentUser.studentId || 'PU-STUDENT';
    if (dom.sessionUserEmail) dom.sessionUserEmail.textContent = currentUser.email || '';
    if (dom.sessionUserAvatar && currentUser.avatar) {
      // Adjust relative avatar path if needed
      dom.sessionUserAvatar.src = currentUser.avatar.startsWith('../')
        ? currentUser.avatar
        : `../${currentUser.avatar.replace(/^\//, '')}`;
    }

    if (dom.activeSessionCard) dom.activeSessionCard.style.display = 'flex';
    if (dom.authFormsContainer) dom.authFormsContainer.style.display = 'none';
  } else {
    // User is not logged in: hide active session card, show forms
    if (dom.activeSessionCard) dom.activeSessionCard.style.display = 'none';
    if (dom.authFormsContainer) dom.authFormsContainer.style.display = 'block';
  }
}

// ============================================================================
// Login Submission Handler
// ============================================================================
export async function handleLogin(e) {
  if (e) e.preventDefault();
  hideAlert();
  clearInputErrors();

  const identifier = dom.loginIdentifier ? dom.loginIdentifier.value.trim() : '';
  const password = dom.loginPassword ? dom.loginPassword.value : '';

  let isValid = true;

  if (!identifier) {
    setFieldError(dom.loginIdentifier, dom.loginIdentifierError, 'Please enter your university email or student ID.');
    isValid = false;
  }

  if (!password) {
    setFieldError(dom.loginPassword, dom.loginPasswordError, 'Please enter your password.');
    isValid = false;
  }

  if (!isValid) {
    showAlert('error', 'Please fill in all required sign in fields.');
    return;
  }

  // Attempt login via store
  const result = store.login(identifier, password);

  if (result.success) {
    // Handle Remember Me
    if (dom.rememberMe && dom.rememberMe.checked) {
      try {
        localStorage.setItem(REMEMBER_ME_KEY, identifier);
      } catch (err) {}
    } else {
      try {
        localStorage.removeItem(REMEMBER_ME_KEY);
      } catch (err) {}
    }

    showToast(`Welcome back, ${result.user.name}!`);
    renderSessionState();

    // Smooth transition to main feed after brief delay
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1200);
  } else {
    showAlert('error', result.message || 'Invalid university credentials. Please try again.');
    setFieldError(dom.loginPassword, dom.loginPasswordError, 'Check your credentials.');
  }
}

// ============================================================================
// Sign Up Submission Handler
// ============================================================================
export async function handleSignUp(e) {
  if (e) e.preventDefault();
  hideAlert();
  clearInputErrors();

  const name = dom.signupName ? dom.signupName.value.trim() : '';
  const email = dom.signupEmail ? dom.signupEmail.value.trim() : '';
  const major = dom.signupMajor ? dom.signupMajor.value : '';
  const year = dom.signupYear ? dom.signupYear.value : 'Senior';
  const studentId = dom.signupStudentId ? dom.signupStudentId.value.trim() : '';
  const password = dom.signupPassword ? dom.signupPassword.value : '';
  const confirmPassword = dom.signupPasswordConfirm ? dom.signupPasswordConfirm.value : '';
  const termsAgreed = dom.signupTerms ? dom.signupTerms.checked : false;

  let isValid = true;

  if (!name || name.length < 2) {
    setFieldError(dom.signupName, dom.signupNameError, 'Please enter your full academic name.');
    isValid = false;
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    setFieldError(dom.signupEmail, dom.signupEmailError, 'Please enter a valid university email address.');
    isValid = false;
  }

  if (!major) {
    setFieldError(dom.signupMajor, dom.signupMajorError, 'Please select your academic major/department.');
    isValid = false;
  }

  if (!password || password.length < 6) {
    setFieldError(dom.signupPassword, dom.signupPasswordError, 'Password must be at least 6 characters.');
    isValid = false;
  }

  if (password !== confirmPassword) {
    setFieldError(dom.signupPasswordConfirm, dom.signupPasswordConfirmError, 'Passwords do not match.');
    isValid = false;
  }

  if (!termsAgreed) {
    setFieldError(dom.signupTerms, dom.signupTermsError, 'You must accept the Academic Integrity Terms.');
    isValid = false;
  }

  if (!isValid) {
    showAlert('error', 'Please resolve the highlighted validation errors above.');
    return;
  }

  // Construct new user entity DTO
  const newUserData = {
    name,
    email,
    major,
    year,
    studentId: studentId || `PU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    password,
    avatar: 'assets/images/avatar-1.svg',
    coverImage: 'assets/images/cover-default.svg'
  };

  const result = store.register(newUserData);

  if (result.success) {
    showAlert('success', `Welcome to Academic Showcase, ${result.user.name}! Account registered successfully.`);
    showToast(`Account created for ${result.user.name}`);
    renderSessionState();

    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1400);
  } else {
    showAlert('error', result.message || 'Registration failed. An account with this email may already exist.');
    setFieldError(dom.signupEmail, dom.signupEmailError, result.message);
  }
}

// ============================================================================
// Demo Quick-Fill Profiles
// ============================================================================
export function setupDemoAccounts() {
  const demoChips = document.querySelectorAll('.demo-user-chip');
  demoChips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const email = chip.getAttribute('data-email');
      const pass = chip.getAttribute('data-pass');

      if (!email || !pass) return;

      switchTab('login');

      if (dom.loginIdentifier) {
        dom.loginIdentifier.value = email;
        dom.loginIdentifier.classList.remove('is-invalid');
      }

      if (dom.loginPassword) {
        dom.loginPassword.value = pass;
        dom.loginPassword.classList.remove('is-invalid');
      }

      hideAlert();
      showToast(`Selected demo profile: ${email}`);
    });
  });
}

// ============================================================================
// Password Visibility & Strength Meter Listeners
// ============================================================================
function setupPasswordControls() {
  if (dom.toggleLoginPasswordBtn && dom.loginPassword) {
    dom.toggleLoginPasswordBtn.addEventListener('click', () => {
      const isPassword = dom.loginPassword.getAttribute('type') === 'password';
      dom.loginPassword.setAttribute('type', isPassword ? 'text' : 'password');
      const eyeOpen = dom.toggleLoginPasswordBtn.querySelector('.eye-open');
      const eyeClosed = dom.toggleLoginPasswordBtn.querySelector('.eye-closed');
      if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : 'block';
      if (eyeClosed) eyeClosed.style.display = isPassword ? 'block' : 'none';
    });
  }

  if (dom.signupPassword && dom.passwordMeterContainer) {
    dom.signupPassword.addEventListener('input', () => {
      const val = dom.signupPassword.value;
      if (!val) {
        dom.passwordMeterContainer.classList.remove('show');
        return;
      }
      dom.passwordMeterContainer.classList.add('show');
      const strength = calculatePasswordStrength(val);
      if (dom.meterFill) {
        dom.meterFill.style.width = strength.width;
        dom.meterFill.style.backgroundColor = strength.color;
      }
      if (dom.meterLabel) {
        dom.meterLabel.textContent = strength.text;
      }
    });
  }
}

// ============================================================================
// Theme Toggle Helper
// ============================================================================
function setupThemeToggle() {
  if (!dom.authThemeToggleBtn) return;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  };

  const getSavedTheme = () => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  applyTheme(getSavedTheme());

  dom.authThemeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

// ============================================================================
// Initialization
// ============================================================================
export function initAuthPage() {
  cacheDomElements();
  if (!dom) return;

  // Setup tabs
  if (dom.tabSignIn) dom.tabSignIn.addEventListener('click', () => switchTab('login'));
  if (dom.tabSignUp) dom.tabSignUp.addEventListener('click', () => switchTab('signup'));
  if (dom.btnSwitchToSignUp) dom.btnSwitchToSignUp.addEventListener('click', () => switchTab('signup'));
  if (dom.btnSwitchToSignIn) dom.btnSwitchToSignIn.addEventListener('click', () => switchTab('login'));

  // Setup form submissions
  if (dom.loginForm) dom.loginForm.addEventListener('submit', handleLogin);
  if (dom.signupForm) dom.signupForm.addEventListener('submit', handleSignUp);

  // Setup demo quick-fill
  setupDemoAccounts();

  // Setup password helpers
  setupPasswordControls();

  // Setup theme toggle
  setupThemeToggle();

  // Alert dismiss
  if (dom.authAlertClose) {
    dom.authAlertClose.addEventListener('click', hideAlert);
  }

  // Forgot password placeholder
  if (dom.linkForgotPassword) {
    dom.linkForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('info', 'Institutional password resets are coordinated with Campus IT Services (cs-support@univ.edu). Use demo logins for evaluation.');
    });
  }

  // Logout button on active session card
  if (dom.btnLogoutSession) {
    dom.btnLogoutSession.addEventListener('click', () => {
      store.logout();
      showToast('You have been signed out.');
      renderSessionState();
      switchTab('login');
    });
  }

  // Load remembered user email if any
  try {
    const rememberedId = localStorage.getItem(REMEMBER_ME_KEY);
    if (rememberedId && dom.loginIdentifier) {
      dom.loginIdentifier.value = rememberedId;
      if (dom.rememberMe) dom.rememberMe.checked = true;
    }
  } catch (e) {}

  // Subscribe to Auth state changes from store
  if (typeof store.onAuthChange === 'function') {
    store.onAuthChange(() => renderSessionState());
  } else if (typeof store.subscribe === 'function') {
    store.subscribe('auth:changed', () => renderSessionState());
  }

  // Initial tab check from URL hash
  if (window.location.hash === '#signup') {
    switchTab('signup');
  } else {
    switchTab('login');
  }

  // Render session state (reflect existing logged-in user or show login form)
  renderSessionState();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthPage);
  } else {
    initAuthPage();
  }
}
