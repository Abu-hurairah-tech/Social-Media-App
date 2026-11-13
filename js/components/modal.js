/**
 * Academic Coursework Showcase — Accessible Reusable Modal Dialog Component
 * js/components/modal.js
 *
 * Implements accessible modal dialog with backdrop overlay, focus management,
 * keyboard trapping (Tab/Shift+Tab), ESC dismissal, and click-outside dismissal.
 */

let modalCounter = 0;
const activeModals = [];

export function openModal(options = {}) {
  const {
    title = 'Dialog',
    content = '',
    footerButtons = [],
    size = 'md',
    onClose = null
  } = options;

  modalCounter++;
  const modalId = `modal-${modalCounter}`;
  const titleId = `modal-title-${modalCounter}`;

  // Preserve the element that triggered the modal for focus restoration
  const previousActiveElement = typeof document !== 'undefined' ? document.activeElement : null;

  // Build backdrop wrapper
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = modalId;
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', titleId);

  // Build dialog container
  const dialog = document.createElement('div');
  dialog.className = `modal-dialog modal-dialog-${size}`;

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h3 class="modal-title" id="${titleId}">${escapeHtml(title)}</h3>
    <button class="modal-close" aria-label="Close dialog" title="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  `;

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  // Footer (optional)
  let footer = null;
  if (footerButtons && footerButtons.length > 0) {
    footer = document.createElement('div');
    footer.className = 'modal-footer';

    footerButtons.forEach((btnConfig) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = btnConfig.className || 'btn btn-secondary';
      btn.textContent = btnConfig.label || 'Action';
      btn.addEventListener('click', () => {
        if (typeof btnConfig.onClick === 'function') {
          btnConfig.onClick(modalInstance);
        } else {
          modalInstance.close();
        }
      });
      footer.appendChild(btn);
    });
  }

  dialog.appendChild(header);
  dialog.appendChild(body);
  if (footer) {
    dialog.appendChild(footer);
  }
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  // Add body lock
  document.body.classList.add('modal-open');

  // Modal instance object
  const modalInstance = {
    id: modalId,
    element: backdrop,
    dialog,
    body,
    close: () => closeModal(modalInstance, previousActiveElement, onClose)
  };

  // Close button click listener
  const closeBtn = header.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modalInstance.close());
  }

  // Click on backdrop to dismiss
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      modalInstance.close();
    }
  });

  // Keyboard navigation & focus management
  const keydownHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      modalInstance.close();
      return;
    }

    if (e.key === 'Tab') {
      trapFocus(dialog, e);
    }
  };

  modalInstance._keydownHandler = keydownHandler;
  document.addEventListener('keydown', keydownHandler);

  activeModals.push(modalInstance);

  // Trigger animation & initial focus
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    focusInitialElement(dialog, closeBtn);
  });

  return modalInstance;
}

function closeModal(modalInstance, previousActiveElement, onClose) {
  const { element, _keydownHandler } = modalInstance;
  if (!element || !element.parentNode) return;

  element.classList.remove('open');
  if (_keydownHandler) {
    document.removeEventListener('keydown', _keydownHandler);
  }

  const idx = activeModals.indexOf(modalInstance);
  if (idx > -1) {
    activeModals.splice(idx, 1);
  }

  if (activeModals.length === 0) {
    document.body.classList.remove('modal-open');
  }

  // Wait for transition before removing from DOM
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  }, 250);
}

export function closeAllModals() {
  while (activeModals.length > 0) {
    const modal = activeModals.pop();
    modal.close();
  }
}

function focusInitialElement(dialog, defaultBtn) {
  const focusables = getFocusableElements(dialog);
  if (focusables.length > 0) {
    // Prefer the first form input if available, otherwise first focusable
    const firstInput = focusables.find((el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
    if (firstInput) {
      firstInput.focus();
      return;
    }
    focusables[0].focus();
  } else if (defaultBtn) {
    defaultBtn.focus();
  }
}

function trapFocus(dialog, e) {
  const focusables = getFocusableElements(dialog);
  if (focusables.length === 0) {
    e.preventDefault();
    return;
  }

  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
}

function getFocusableElements(container) {
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)).filter((el) => {
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
