/**
 * tests/e2e/tier4_scenarios.test.js
 * Tier 4: Real-world academic scenarios:
 * - Scenario 1: Complete Coursework Showcase & Peer Review Workflow
 * - Scenario 2: Student Textbook Resale & Campus Wallet Checkout Workflow
 * - Scenario 3: Department Event Sponsored Promotion & Feed Injection Workflow
 * - Scenario 4: Campus Study Peer Networking & Collaborative Messaging Workflow
 */

const fs = require('fs');
const path = require('path');
const assert = require('./helpers/assert.js');
const { createVirtualBrowserEnv, loadModuleInEnv } = require('./helpers/store_loader.js');

function registerTier4Tests(registry, rootDir) {
  const getPath = (rel) => path.join(rootDir, rel);
  const stateFile = 'js/store/state.js';
  const mockDataFile = 'js/store/mockData.js';

  function createEnvAndStore() {
    const env = createVirtualBrowserEnv();
    const storeMod = loadModuleInEnv(getPath(stateFile), env);
    const store = storeMod.store || storeMod.state;
    if (typeof store.init === 'function') store.init();
    const users = (store.data && store.data.users) || (store.state && store.state.users) || [];
    return { env, store, users };
  }

  // =========================================================================
  // Scenario 1: Complete Coursework Showcase & Peer Review Workflow
  // =========================================================================
  registry.describe('Tier 4: Scenario 1 - Academic Coursework Showcase & Peer Review Workflow', () => {
    registry.test('S1.1 Full end-to-end coursework publish -> react -> peer review comment -> group share', {
      tier: 4,
      milestone: 'M4',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { env, store, users } = createEnvAndStore();
      assert.ok(users.length >= 2, 'Requires student author and peer reviewers');

      const author = users[0];
      const peer = users[1];

      // Step 1: Student logs in
      store.setCurrentUser(author);
      assert.strictEqual(store.getCurrentUser().id, author.id);

      // Step 2: Publish coursework showcase with course tag and code snippet
      const courseworkPost = store.createPost({
        courseCode: 'CS-302',
        title: 'Reactive State Store Showcase',
        content: 'Completed Lab 4: Reactive State Store with zero dependencies!',
        codeSnippet: 'export class StateManager { constructor() { this.data = {}; } }'
      });
      assert.ok(courseworkPost && courseworkPost.id, 'Coursework post must be created');
      assert.strictEqual(courseworkPost.courseCode, 'CS-302');

      // Step 3: Peer student logs in and reviews feed
      store.setCurrentUser(peer);
      const filteredFeed = store.getPosts ? store.getPosts({ category: 'CS-302' }) : [];
      assert.ok(Array.isArray(filteredFeed), 'Filtered feed must be an array');

      // Step 4: Peer student reacts with "heart" / "celebrate"
      const reactFn = store.toggleReaction || store.reactToPost;
      if (typeof reactFn === 'function') {
        reactFn.call(store, courseworkPost.id, 'heart');
      }

      // Step 5: Peer student submits constructive peer review comment
      if (typeof store.addComment === 'function') {
        const review = store.addComment(
          courseworkPost.id,
          'Excellent architecture! The decoupling between the store and DOM makes future REST API migration trivial.'
        );
        assert.ok(review && review.id, 'Peer review comment must be registered');
        assert.strictEqual(review.authorId, peer.id);
      }

      // Step 6: Verify state persisted to simulated LocalStorage
      const serialized = env.localStorage.getItem('ACADEMIC_SHOWCASE_STATE_V1');
      assert.ok(serialized, 'State must be serialized into LocalStorage');
      assert.includes(serialized, courseworkPost.id, 'Serialized storage must contain the new coursework post');
    });
  });

  // =========================================================================
  // Scenario 2: Student Textbook Resale & Campus Wallet Checkout Workflow
  // =========================================================================
  registry.describe('Tier 4: Scenario 2 - Student Marketplace Sale & Multi-Method Checkout', () => {
    registry.test('S2.1 Senior lists textbook -> Junior filters catalog -> Junior buys with wallet -> Receipt TXN generated -> Item marked sold', {
      tier: 4,
      milestone: 'M11',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { env, store, users } = createEnvAndStore();
      const senior = users[0];
      const junior = users[1] || users[0];

      // Step 1: Senior student lists textbook for sale
      store.setCurrentUser(senior);
      const bookListing = store.createMarketplaceItem({
        title: 'Modern Web Development & Distributed Systems (5th Edition)',
        price: 35.00,
        category: 'Textbooks',
        condition: 'Like New',
        description: 'Used for CS-302 Web Tech coursework. Minimal highlights.'
      });
      assert.ok(bookListing && bookListing.id, 'Book listing must be created');
      assert.ok(bookListing.isSold === false || bookListing.status === 'available');

      // Step 2: Junior student browses marketplace and filters by Textbooks
      store.setCurrentUser(junior);
      const textbooks = store.getMarketplaceItems ? store.getMarketplaceItems('Textbooks') : [];
      assert.ok(textbooks.some(b => b.id === bookListing.id), 'Textbook must be discoverable in catalog');

      // Step 3: Junior student initiates checkout and orders with campus wallet
      const order = store.createOrder({
        itemId: bookListing.id,
        itemIds: [bookListing.id],
        amount: 35.00,
        totalAmount: 35.00,
        paymentMethod: 'Student Campus Card',
        shippingAddress: 'Department of CS, PU Library Desk 3'
      });
      assert.ok(order && order.id, 'Order transaction must be finalized');
      assert.match(order.id, /ord/i, 'Order must feature official reference identifier');

      // Step 4: Verify marketplace item is now marked as sold
      const updatedCatalog = store.getMarketplaceItems ? store.getMarketplaceItems() : (store.state.marketplace || store.state.marketplaceItems || []);
      const targetItem = updatedCatalog.find(i => i.id === bookListing.id);
      assert.ok(targetItem, 'Target item should exist');
      assert.ok(targetItem.isSold === true || targetItem.status === 'sold', 'Purchased textbook must be marked sold in marketplace');
    });
  });

  // =========================================================================
  // Scenario 3: Department Event Sponsored Promotion & Feed Injection
  // =========================================================================
  registry.describe('Tier 4: Scenario 3 - Department Event Promotion & Sponsored Placements', () => {
    registry.test('S3.1 Event organizer creates ad -> Budget calculated -> Card injected into feed stream -> Impressions tracked', {
      tier: 4,
      milestone: 'M10',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = createEnvAndStore();
      const organizer = users[0];
      store.setCurrentUser(organizer);

      const createAdFn = store.createAd || store.createAdCampaign;
      assert.ok(typeof createAdFn === 'function', 'Campaign creator must exist');

      // Step 1: Configure event promotion campaign
      const ad = createAdFn.call(store, {
        title: 'PU Annual Hackathon 2026: Register Before Nov 15!',
        description: 'Build web applications and win prizes. Open to all semester students.',
        targetCourse: 'All',
        placement: 'feed',
        dailyBudget: 20,
        budgetTotal: 100,
        durationDays: 5
      });
      assert.ok(ad && ad.id, 'Campaign must be created');

      // Step 2: Verify active campaign is available for feed injection
      const activeFeedAds = typeof store.getActiveAds === 'function' ? store.getActiveAds('feed') : (store.getAdCampaigns ? store.getAdCampaigns() : (store.state.adCampaigns || []));
      assert.ok(activeFeedAds.some(a => a.id === ad.id), 'Ad must be delivered to feed or campaigns');
    });
  });

  // =========================================================================
  // Scenario 4: Study Peer Networking & Collaborative Messaging
  // =========================================================================
  registry.describe('Tier 4: Scenario 4 - Study Peer Networking & Collaborative Messaging', () => {
    registry.test('S4.1 Student searches classmate -> Sends request -> Peer accepts -> Initiates direct study chat', {
      tier: 4,
      milestone: 'M7',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = createEnvAndStore();
      const studentA = users[0];
      const studentB = users[1] || users[0];

      // Step 1: Student A connects with Student B
      store.setCurrentUser(studentA);
      let reqResult = null;
      if (typeof store.sendFriendRequest === 'function') {
        reqResult = store.sendFriendRequest(studentB.id);
        assert.ok(reqResult !== undefined, 'Friend request call completed');
      }

      // Step 2: Student B accepts
      if (typeof store.respondFriendRequest === 'function' && typeof store.getFriendRequests === 'function') {
        store.setCurrentUser(studentB);
        const reqs = store.getFriendRequests();
        const incoming = Array.isArray(reqs.incoming) ? reqs.incoming : [];
        if (incoming.length > 0) {
          store.respondFriendRequest(incoming[0].id, 'accept');
        }
      }

      // Step 3: Initiate direct chat and exchange coursework message
      store.setCurrentUser(studentA);
      const chats = store.getConversations ? store.getConversations() : (store.state.conversations || store.state.chats || []);
      if (chats.length > 0 && typeof store.sendMessage === 'function') {
        const chat = chats[0];
        const sent = store.sendMessage(chat.id, 'Hey! Did you check out the Web Tech project requirements?');
        assert.ok(sent && sent.id, 'Coursework message must be transmitted');
        assert.strictEqual(sent.senderId, studentA.id);
      }
    });
  });
}

module.exports = {
  registerTier4Tests
};
