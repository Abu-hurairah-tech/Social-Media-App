import { state } from '../store/state.js';
import { initTheme, renderNavbar } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { escapeHtml, formatRelativeTime } from '../components/postCard.js';

let selectedTarget = { type: 'marketplace', id: null, title: 'Academic Resource', amount: 0 };

function ensureAuthenticated() {
  const user = state.getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return null;
  }
  return user;
}

function populateTargetOptions() {
  const select = document.getElementById('checkoutTargetSelect');
  if (!select) return;

  const params = new URLSearchParams(window.location.search);
  const queryType = params.get('type');
  const queryItemId = params.get('itemId');
  const queryAdId = params.get('adId');

  const availableItems = state.getMarketplaceItems().filter((item) => !item.isSold && item.status !== 'sold');
  const campaigns = state.getAdCampaigns();

  const options = [];
  availableItems.forEach((item) => {
    options.push({
      key: `marketplace:${item.id}`,
      type: 'marketplace',
      id: item.id,
      title: item.title,
      amount: Number(item.price || 0),
      label: `[Marketplace] ${item.title} — $${Number(item.price || 0).toFixed(2)}`
    });
  });

  campaigns.forEach((ad) => {
    options.push({
      key: `ad:${ad.id}`,
      type: 'ad',
      id: ad.id,
      title: `Ad Boost: ${ad.title}`,
      amount: 50,
      label: `[Ad Boost] ${ad.title} — $50.00`
    });
  });

  if (options.length === 0) {
    options.push({
      key: 'ad:new',
      type: 'ad',
      id: null,
      title: 'Sponsored Campus Promotion Credit',
      amount: 50,
      label: '[Campus Credit] Sponsored Promotion Pack — $50.00'
    });
  }

  select.innerHTML = options.map((opt) => (
    `<option value="${escapeHtml(opt.key)}">${escapeHtml(opt.label)}</option>`
  )).join('');

  let preferred = options[0];
  if (queryItemId) {
    preferred = options.find((o) => o.key === `marketplace:${queryItemId}`) || preferred;
  } else if (queryAdId) {
    preferred = options.find((o) => o.key === `ad:${queryAdId}`) || preferred;
  } else if (queryType === 'ad') {
    preferred = options.find((o) => o.type === 'ad') || preferred;
  }

  select.value = preferred.key;
  selectedTarget = preferred;
  renderOrderSummary();
}

function renderOrderSummary() {
  const summaryBody = document.getElementById('orderSummaryBody');
  if (!summaryBody) return;

  const subtotal = Number(selectedTarget.amount || 0);
  const platformFee = 0;
  const total = subtotal + platformFee;

  summaryBody.innerHTML = `
    <div class="order-summary-row">
      <span>Selected Item</span>
      <strong>${escapeHtml(selectedTarget.title)}</strong>
    </div>
    <div class="order-summary-row">
      <span>Order Type</span>
      <span>${selectedTarget.type === 'ad' ? 'Sponsored Campaign Funding' : 'Peer Marketplace Order'}</span>
    </div>
    <div class="order-summary-row">
      <span>Subtotal</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
    <div class="order-summary-row">
      <span>Student Platform Fee</span>
      <span>$0.00 (Waived)</span>
    </div>
    <div class="order-summary-total">
      <span>Total Due</span>
      <span class="text-primary">$${total.toFixed(2)}</span>
    </div>
  `;
}

function renderOrderHistory() {
  const container = document.getElementById('orderHistoryList');
  if (!container) return;

  const orders = state.getOrders();
  if (!orders || orders.length === 0) {
    container.innerHTML = `<p class="font-xs text-secondary">No completed orders yet.</p>`;
    return;
  }

  container.innerHTML = orders.slice(0, 6).map((order) => `
    <article class="order-history-item">
      <div class="flex items-center justify-between gap-2">
        <strong class="font-xs">${escapeHtml(order.itemTitle || 'Campus Order')}</strong>
        <span class="font-xs font-weight-bold text-primary">$${Number(order.amount || 0).toFixed(2)}</span>
      </div>
      <div class="flex items-center justify-between gap-2 mt-1 font-xs text-muted">
        <span>${escapeHtml(order.transactionId || order.id)} • ${escapeHtml(order.paymentMethod || 'Card')}</span>
        <span>${formatRelativeTime(order.createdAt)}</span>
      </div>
    </article>
  `).join('');
}

function syncSelectedOptionFromSelect() {
  const select = document.getElementById('checkoutTargetSelect');
  if (!select) return;
  const [type, id] = (select.value || '').split(':');

  if (type === 'marketplace') {
    const item = state.getMarketplaceItems().find((i) => i.id === id);
    if (item) {
      selectedTarget = { type: 'marketplace', id: item.id, title: item.title, amount: Number(item.price || 0) };
    }
  } else {
    const ad = state.getAdCampaigns().find((a) => a.id === id);
    selectedTarget = {
      type: 'ad',
      id: ad ? ad.id : null,
      title: ad ? `Ad Boost: ${ad.title}` : 'Sponsored Campus Promotion Credit',
      amount: 50
    };
  }
  renderOrderSummary();
}

function updateCardPreview() {
  const holder = document.getElementById('cardHolderInput')?.value.trim() || 'STUDENT MEMBER';
  const rawNum = (document.getElementById('cardNumberInput')?.value || '').replace(/\D/g, '');
  const formattedNum = rawNum
    ? rawNum.replace(/(.{4})/g, '$1 ').trim()
    : '4532 •••• •••• 8842';
  const expiry = document.getElementById('cardExpiryInput')?.value.trim() || '08/28';

  const numEl = document.getElementById('previewCardNumber');
  const holderEl = document.getElementById('previewCardHolder');
  const expEl = document.getElementById('previewCardExpiry');

  if (numEl) numEl.textContent = formattedNum;
  if (holderEl) holderEl.textContent = holder.toUpperCase();
  if (expEl) expEl.textContent = expiry;
}

function bindEvents() {
  const targetSelect = document.getElementById('checkoutTargetSelect');
  if (targetSelect) {
    targetSelect.addEventListener('change', syncSelectedOptionFromSelect);
  }

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.payment-method-option').forEach((lbl) => {
        lbl.classList.toggle('is-selected', lbl.contains(e.target));
      });
      const isWallet = e.target.value === 'Student Wallet';
      document.getElementById('cardPaymentSection')?.classList.toggle('hidden', isWallet);
      document.getElementById('walletPaymentSection')?.classList.toggle('hidden', !isWallet);
    });
  });

  ['cardHolderInput', 'cardNumberInput', 'cardExpiryInput'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', updateCardPreview);
  });

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errEl = document.getElementById('checkoutError');
      const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
      const paymentMethod = selectedRadio ? selectedRadio.value : 'Credit/Debit Card';
      const deliveryType = document.getElementById('deliveryTypeSelect')?.value || 'Campus Pickup';

      if (paymentMethod === 'Credit/Debit Card') {
        const cardNum = (document.getElementById('cardNumberInput')?.value || '').replace(/\D/g, '');
        const cvv = (document.getElementById('cardCvvInput')?.value || '').replace(/\D/g, '');
        if (cardNum.length > 0 && cardNum.length < 12) {
          if (errEl) {
            errEl.textContent = 'Please enter a valid card number (or switch to Student Wallet).';
            errEl.classList.remove('hidden');
          }
          return;
        }
        if (cvv.length > 0 && cvv.length < 3) {
          if (errEl) {
            errEl.textContent = 'CVV must be 3 or 4 digits.';
            errEl.classList.remove('hidden');
          }
          return;
        }
      }

      if (errEl) errEl.classList.add('hidden');

      const order = state.createOrder({
        itemId: selectedTarget.type === 'marketplace' ? selectedTarget.id : null,
        adId: selectedTarget.type === 'ad' ? selectedTarget.id : null,
        itemTitle: selectedTarget.title,
        amount: selectedTarget.amount,
        paymentMethod,
        deliveryType
      });

      document.getElementById('receiptTxnId').textContent = order.transactionId || order.id;
      document.getElementById('receiptOrderId').textContent = order.id;
      document.getElementById('receiptItemTitle').textContent = order.itemTitle;
      document.getElementById('receiptMethod').textContent = order.paymentMethod;
      document.getElementById('receiptAmount').textContent = `$${Number(order.amount || 0).toFixed(2)}`;

      form.classList.add('hidden');
      document.getElementById('orderReceiptCard')?.classList.remove('hidden');

      populateTargetOptions();
      renderOrderHistory();
    });
  }
}

function initCheckoutPage() {
  initTheme();
  const user = ensureAuthenticated();
  if (!user) return;

  const holderInput = document.getElementById('cardHolderInput');
  if (holderInput && !holderInput.value) {
    holderInput.value = user.name || 'Student Member';
  }

  renderNavbar(document.getElementById('navbarMount'), {
    basePath: '../',
    activePage: 'checkout'
  });
  renderSidebar(document.getElementById('sidebarMount'), {
    basePath: '../',
    activePage: 'checkout'
  });
  renderMobileBottomNav(document.getElementById('mobileNavMount'), {
    basePath: '../',
    activePage: 'checkout'
  });

  populateTargetOptions();
  updateCardPreview();
  renderOrderHistory();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', initCheckoutPage);
