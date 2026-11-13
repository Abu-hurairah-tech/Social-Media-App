import { state } from '../store/state.js';
import { initTheme, renderNavbar } from '../components/navbar.js';
import { renderSidebar, renderMobileBottomNav } from '../components/sidebar.js';
import { escapeHtml } from '../components/postCard.js';

function ensureAuthenticated() {
  const user = state.getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return null;
  }
  return user;
}

function renderKpis(campaigns) {
  const totalImpressions = campaigns.reduce((sum, ad) => sum + (Number(ad.impressions) || 0), 0);
  const totalClicks = campaigns.reduce((sum, ad) => sum + (Number(ad.clicks) || 0), 0);
  const totalSpent = campaigns.reduce((sum, ad) => sum + (Number(ad.budgetSpent) || 0), 0);
  const totalBudget = campaigns.reduce((sum, ad) => sum + (Number(ad.budgetTotal) || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  const impEl = document.getElementById('kpiImpressions');
  const clicksEl = document.getElementById('kpiClicks');
  const ctrEl = document.getElementById('kpiCtr');
  const spendEl = document.getElementById('kpiSpend');
  const allocEl = document.getElementById('kpiBudgetAllocated');

  if (impEl) impEl.textContent = totalImpressions.toLocaleString();
  if (clicksEl) clicksEl.textContent = totalClicks.toLocaleString();
  if (ctrEl) ctrEl.textContent = `${ctr}% CTR`;
  if (spendEl) spendEl.textContent = `$${totalSpent.toFixed(2)}`;
  if (allocEl) allocEl.textContent = `of $${totalBudget.toFixed(2)} budget`;
}

function renderCampaigns() {
  const campaigns = state.getAdCampaigns();
  renderKpis(campaigns);

  const countEl = document.getElementById('campaignsCountLabel');
  if (countEl) {
    countEl.textContent = `${campaigns.length} ${campaigns.length === 1 ? 'campaign' : 'campaigns'}`;
  }

  const listEl = document.getElementById('campaignsList');
  if (!listEl) return;

  if (campaigns.length === 0) {
    listEl.innerHTML = `
      <p class="font-sm text-secondary">No active ad campaigns yet. Use the form above to launch one.</p>
    `;
    return;
  }

  listEl.innerHTML = campaigns.map((ad) => {
    const budgetTotal = Number(ad.budgetTotal || 0).toFixed(2);
    const budgetSpent = Number(ad.budgetSpent || 0).toFixed(2);
    const impressions = Number(ad.impressions || 0);
    const clicks = Number(ad.clicks || 0);

    return `
      <article class="campaign-row" data-ad-id="${escapeHtml(ad.id)}">
        <div class="campaign-row-main">
          <div class="flex items-center gap-2 mb-1">
            <span class="badge ${ad.status === 'active' ? 'badge-success' : 'badge-secondary'}">
              ${escapeHtml(ad.status || 'active')}
            </span>
            <span class="font-xs text-muted">${escapeHtml(ad.sponsorName || 'University Sponsor')}</span>
          </div>
          <h3 class="font-md font-weight-semibold">${escapeHtml(ad.title)}</h3>
          <p class="font-xs text-secondary mt-1">${escapeHtml(ad.tagline || 'Sponsored academic announcement')}</p>
        </div>

        <div class="campaign-stats font-xs">
          <div class="campaign-stat-item">
            <span class="text-muted">Impressions</span>
            <strong>${impressions.toLocaleString()}</strong>
          </div>
          <div class="campaign-stat-item">
            <span class="text-muted">Clicks</span>
            <strong>${clicks.toLocaleString()}</strong>
          </div>
          <div class="campaign-stat-item">
            <span class="text-muted">Spend / Budget</span>
            <strong>$${budgetSpent} / $${budgetTotal}</strong>
          </div>
        </div>

        <div class="campaign-actions">
          <button type="button" class="btn btn-secondary btn-sm js-sim-click" data-ad-id="${escapeHtml(ad.id)}">
            Simulate Click
          </button>
          <a href="checkout.html?type=ad&adId=${encodeURIComponent(ad.id)}" class="btn btn-outline-primary btn-sm">
            Boost / Fund
          </a>
        </div>
      </article>
    `;
  }).join('');
}

function updateLivePreview() {
  const title = document.getElementById('adTitleInput')?.value.trim() || 'Your Campaign Headline Appears Here';
  const sponsor = document.getElementById('adSponsorInput')?.value.trim() || 'ACM Student Chapter';
  const tagline = document.getElementById('adTaglineInput')?.value.trim() || 'Start typing in the campaign builder to preview how students will see your sponsored card in their feed.';
  const audience = document.getElementById('adAudienceInput')?.value || 'All Students';
  const placement = document.getElementById('adPlacementInput')?.value || 'feed';
  const budget = Math.max(10, parseFloat(document.getElementById('adBudgetInput')?.value) || 150);
  const days = Math.max(1, parseInt(document.getElementById('adDurationInput')?.value, 10) || 14);

  const titleEl = document.getElementById('previewAdTitle');
  const sponsorEl = document.getElementById('previewSponsorName');
  const taglineEl = document.getElementById('previewAdTagline');
  const audienceEl = document.getElementById('previewAudience');
  const placementEl = document.getElementById('previewPlacementBadge');
  const estEl = document.getElementById('adEstimatorBox');

  if (titleEl) titleEl.textContent = title;
  if (sponsorEl) sponsorEl.textContent = sponsor;
  if (taglineEl) taglineEl.textContent = tagline;
  if (audienceEl) audienceEl.textContent = `Target: ${audience}`;
  if (placementEl) placementEl.textContent = placement === 'all' ? 'Feed & Sidebar' : 'Feed Placement';
  if (estEl) {
    const minImp = Math.round(budget * 25);
    const maxImp = Math.round(budget * 35);
    const daily = (budget / days).toFixed(2);
    estEl.innerHTML = `Estimated reach: <strong>${minImp.toLocaleString()}–${maxImp.toLocaleString()}</strong> impressions (~$${daily}/day)`;
  }
}

function bindEvents() {
  const form = document.getElementById('ad-campaign-form');
  if (form) {
    form.addEventListener('input', updateLivePreview);
    form.addEventListener('change', updateLivePreview);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('adTitleInput').value.trim();
      const sponsorName = document.getElementById('adSponsorInput').value.trim();
      const tagline = document.getElementById('adTaglineInput').value.trim();
      const targetAudience = document.getElementById('adAudienceInput').value;
      const placement = document.getElementById('adPlacementInput').value;
      const budgetTotal = parseFloat(document.getElementById('adBudgetInput').value) || 100;
      const feedback = document.getElementById('adFormFeedback');

      if (!title || !sponsorName || !tagline) {
        if (feedback) {
          feedback.textContent = 'Please complete headline, sponsor, and tagline fields.';
          feedback.className = 'font-xs text-danger mb-3';
        }
        return;
      }

      state.createAdCampaign({
        title,
        sponsorName,
        tagline,
        targetAudience,
        placement,
        budgetTotal,
        ctaText: 'Learn More',
        ctaLink: 'pages/ads-manager.html',
        badge: 'Sponsored'
      });

      form.reset();
      updateLivePreview();
      renderCampaigns();

      if (feedback) {
        feedback.textContent = `Campaign "${title}" launched and live in feed!`;
        feedback.className = 'font-xs text-success mb-3';
      }
    });
  }

  const listEl = document.getElementById('campaignsList');
  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.js-sim-click');
      if (!btn) return;
      const adId = btn.dataset.adId;
      state.recordAdImpression(adId);
      state.recordAdClick(adId);
      renderCampaigns();
    });
  }

  state.subscribe('ads:updated', renderCampaigns);
}

function initAdsPage() {
  initTheme();
  if (!ensureAuthenticated()) return;

  renderNavbar(document.getElementById('navbarMount'), {
    basePath: '../',
    activePage: 'ads'
  });
  renderSidebar(document.getElementById('sidebarMount'), {
    basePath: '../',
    activePage: 'ads'
  });
  renderMobileBottomNav(document.getElementById('mobileNavMount'), {
    basePath: '../',
    activePage: 'ads'
  });

  bindEvents();
  updateLivePreview();
  renderCampaigns();
}

document.addEventListener('DOMContentLoaded', initAdsPage);
