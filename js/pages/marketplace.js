import { state } from '../store/state.js';
import { initTheme, renderNavbar } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { openModal } from '../components/modal.js';
import { escapeHtml, formatRelativeTime } from '../components/postCard.js';

let activeCategory = 'All';
let searchQuery = '';
let hideSoldOnly = false;

function ensureAuthenticated() {
  const user = state.getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function resolveMediaPath(path) {
  if (!path) return '../assets/images/project-1.svg';
  if (/^(https?:\/\/|data:|\.\.\/|\/)/i.test(path)) return path;
  return `../${path}`;
}

function getFilteredListings() {
  const all = state.getMarketplaceItems();
  const q = searchQuery.trim().toLowerCase();

  return all.filter((item) => {
    const isSold = item.isSold === true || item.status === 'sold';
    if (hideSoldOnly && isSold) return false;

    if (activeCategory !== 'All' && (item.category || '').toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }

    if (q) {
      const hay = `${item.title || ''} ${item.courseCode || ''} ${item.category || ''} ${item.sellerName || ''} ${item.description || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

function renderMarketplaceGrid() {
  const grid = document.getElementById('marketplace-grid');
  const countLabel = document.getElementById('listingCountLabel');
  if (!grid) return;

  const items = getFilteredListings();
  if (countLabel) {
    countLabel.textContent = `${items.length} ${items.length === 1 ? 'listing' : 'listings'} found`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="card marketplace-empty">
        <h2 class="font-md font-weight-semibold">No matching academic items</h2>
        <p class="font-sm text-secondary mt-2">
          Try clearing your search or list your own textbook, hardware kit, or study guide.
        </p>
        <button type="button" class="btn btn-primary mt-4" id="emptyCreateListingBtn">+ Sell Item</button>
      </div>
    `;
    const emptyBtn = document.getElementById('emptyCreateListingBtn');
    if (emptyBtn) emptyBtn.addEventListener('click', openCreateListingModal);
    return;
  }

  grid.innerHTML = items.map((item) => {
    const isSold = item.isSold === true || item.status === 'sold';
    const formattedPrice = Number(item.price || 0).toFixed(2);
    return `
      <article class="card product-card ${isSold ? 'is-sold' : ''}" data-item-id="${escapeHtml(item.id)}">
        <div class="product-media">
          <img src="${escapeHtml(resolveMediaPath(item.image))}" alt="${escapeHtml(item.title)}" />
          <span class="product-price-badge">$${formattedPrice}</span>
          <span class="product-status-badge ${isSold ? 'product-status-badge--sold' : 'product-status-badge--available'}">
            ${isSold ? 'Sold' : 'Available'}
          </span>
        </div>

        <div class="product-body">
          <div class="product-meta-row">
            <span class="product-course-pill">${escapeHtml(item.courseCode || 'GEN101')}</span>
            <span class="font-xs text-muted">${escapeHtml(item.category || 'Textbooks')} • ${escapeHtml(item.condition || 'Good')}</span>
          </div>

          <h2 class="product-title">${escapeHtml(item.title)}</h2>
          <p class="product-description">${escapeHtml(item.description || 'Verified student academic resource.')}</p>

          <div class="product-seller-row">
            <span>Seller: <strong>${escapeHtml(item.sellerName || 'Student')}</strong></span>
            <span>${formatRelativeTime(item.createdAt)}</span>
          </div>

          <div class="product-actions">
            <button type="button" class="btn btn-secondary btn-sm js-view-item" data-item-id="${escapeHtml(item.id)}">
              Details
            </button>
            ${isSold
              ? `<button type="button" class="btn btn-outline btn-sm" disabled>Sold Out</button>`
              : `<a href="checkout.html?type=marketplace&itemId=${encodeURIComponent(item.id)}" class="btn btn-primary btn-sm">Buy Now</a>`}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openProductDetailModal(itemId) {
  const item = state.getMarketplaceItems().find((i) => i.id === itemId);
  if (!item) return;

  const currentUser = state.getCurrentUser();
  const isSold = item.isSold === true || item.status === 'sold';
  const isSeller = currentUser && item.sellerId === currentUser.id;
  const formattedPrice = Number(item.price || 0).toFixed(2);

  const wrapper = document.createElement('div');
  wrapper.className = 'product-detail-modal';
  wrapper.innerHTML = `
    <img src="${escapeHtml(resolveMediaPath(item.image))}" alt="${escapeHtml(item.title)}" class="product-detail-img" />
    <div>
      <div class="flex items-center justify-between gap-2">
        <span class="product-course-pill">${escapeHtml(item.courseCode || 'GEN101')}</span>
        <span class="font-lg font-weight-bold text-primary">$${formattedPrice}</span>
      </div>
      <h3 class="font-lg font-weight-bold mt-2">${escapeHtml(item.title)}</h3>
      <p class="font-sm text-secondary mt-2">${escapeHtml(item.description || 'No additional description provided.')}</p>
    </div>

    <div class="product-detail-specs font-xs">
      <div><strong>Category:</strong> ${escapeHtml(item.category || 'Textbooks')}</div>
      <div><strong>Condition:</strong> ${escapeHtml(item.condition || 'Good')}</div>
      <div><strong>Seller:</strong> ${escapeHtml(item.sellerName || 'Student')}</div>
      <div><strong>Status:</strong> ${isSold ? 'Sold' : 'Available'}</div>
    </div>
  `;

  const footerButtons = [
    {
      label: 'Close',
      className: 'btn btn-secondary',
      onClick: (m) => m.close()
    }
  ];

  if (!isSeller && item.sellerId) {
    footerButtons.push({
      label: 'Message Seller',
      className: 'btn btn-outline-primary',
      onClick: (m) => {
        if (typeof state.startOrGetConversation === 'function') {
          const conv = state.startOrGetConversation(item.sellerId);
          m.close();
          window.location.href = conv ? `chat.html?convId=${encodeURIComponent(conv.id)}` : 'chat.html';
        } else {
          m.close();
          window.location.href = 'chat.html';
        }
      }
    });
  }

  if (isSeller) {
    footerButtons.push({
      label: isSold ? 'Mark Available' : 'Mark as Sold',
      className: 'btn btn-outline-primary',
      onClick: (m) => {
        state.updateProductStatus(item.id, isSold ? 'available' : 'sold');
        m.close();
        renderMarketplaceGrid();
      }
    });
  }

  if (!isSold) {
    footerButtons.push({
      label: `Buy Now ($${formattedPrice})`,
      className: 'btn btn-primary',
      onClick: () => {
        window.location.href = `checkout.html?type=marketplace&itemId=${encodeURIComponent(item.id)}`;
      }
    });
  }

  openModal({
    title: 'Listing Details',
    content: wrapper,
    footerButtons
  });
}

function openCreateListingModal() {
  const form = document.createElement('form');
  form.id = 'createListingForm';
  form.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="listingTitle">Item Title</label>
      <input type="text" id="listingTitle" class="form-input" required placeholder="e.g., Operating Systems Concepts (10th Ed)" />
    </div>

    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label" for="listingCategory">Category</label>
        <select id="listingCategory" class="form-input">
          <option value="Textbooks">Textbooks</option>
          <option value="Hardware">Hardware</option>
          <option value="Notes">Notes</option>
          <option value="Software">Software</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="listingPrice">Price (USD)</label>
        <input type="number" id="listingPrice" class="form-input" min="0" step="0.01" required placeholder="25.00" />
      </div>
    </div>

    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label" for="listingCourseCode">Course Code</label>
        <input type="text" id="listingCourseCode" class="form-input" placeholder="CS301" />
      </div>

      <div class="form-group">
        <label class="form-label" for="listingCondition">Condition</label>
        <select id="listingCondition" class="form-input">
          <option value="Like New">Like New</option>
          <option value="Good" selected>Good</option>
          <option value="Fair">Fair</option>
          <option value="Digital PDF">Digital PDF</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="listingDescription">Description</label>
      <textarea id="listingDescription" class="form-input" rows="3" placeholder="Include highlights, edition details, or pickup location on campus..."></textarea>
    </div>

    <p id="listingError" class="font-xs text-danger hidden" role="alert"></p>
  `;

  openModal({
    title: 'Create Marketplace Listing',
    content: form,
    footerButtons: [
      {
        label: 'Cancel',
        className: 'btn btn-secondary',
        onClick: (m) => m.close()
      },
      {
        label: 'Publish Listing',
        className: 'btn btn-primary',
        onClick: (m) => {
          const title = form.querySelector('#listingTitle').value.trim();
          const category = form.querySelector('#listingCategory').value;
          const price = parseFloat(form.querySelector('#listingPrice').value);
          const courseCode = form.querySelector('#listingCourseCode').value.trim() || 'GEN101';
          const condition = form.querySelector('#listingCondition').value;
          const description = form.querySelector('#listingDescription').value.trim();
          const err = form.querySelector('#listingError');

          if (!title) {
            err.textContent = 'Please provide an item title.';
            err.classList.remove('hidden');
            return;
          }
          if (Number.isNaN(price) || price < 0) {
            err.textContent = 'Please enter a valid non-negative price.';
            err.classList.remove('hidden');
            return;
          }

          state.createMarketplaceItem({
            title,
            category,
            price,
            courseCode,
            condition,
            description,
            image: category === 'Hardware' ? 'assets/images/project-2.svg' : 'assets/images/project-1.svg'
          });
          m.close();
          renderMarketplaceGrid();
        }
      }
    ]
  });
}

function bindEvents() {
  const createBtn = document.getElementById('createListingBtn');
  if (createBtn) {
    createBtn.addEventListener('click', openCreateListingModal);
  }

  const searchInput = document.getElementById('marketplaceSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      renderMarketplaceGrid();
    });
  }

  const hideSoldCheckbox = document.getElementById('hideSoldCheckbox');
  if (hideSoldCheckbox) {
    hideSoldCheckbox.addEventListener('change', (e) => {
      hideSoldOnly = Boolean(e.target.checked);
      renderMarketplaceGrid();
    });
  }

  const filtersContainer = document.querySelector('.marketplace-filters');
  if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      activeCategory = btn.dataset.category || 'All';
      filtersContainer.querySelectorAll('.filter-chip').forEach((chip) => {
        const isCurrent = chip === btn;
        chip.classList.toggle('is-active', isCurrent);
        chip.setAttribute('aria-selected', String(isCurrent));
      });
      renderMarketplaceGrid();
    });
  }

  const grid = document.getElementById('marketplace-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.js-view-item');
      if (viewBtn) {
        openProductDetailModal(viewBtn.dataset.itemId);
      }
    });
  }

  state.subscribe('marketplace:updated', renderMarketplaceGrid);
}

function initMarketplacePage() {
  initTheme();
  if (!ensureAuthenticated()) return;

  renderNavbar(document.getElementById('navbarMount'), {
    basePath: '../',
    activePage: 'marketplace'
  });
  renderSidebar(document.getElementById('sidebarMount'), {
    basePath: '../',
    activePage: 'marketplace'
  });
  renderMobileBottomNav(document.getElementById('mobileNavMount'), {
    basePath: '../',
    activePage: 'marketplace'
  });

  bindEvents();
  renderMarketplaceGrid();
}

document.addEventListener('DOMContentLoaded', initMarketplacePage);
