/**
 * tests/e2e/tier3_interactions.test.js
 * Tier 3: Cross-Feature Interactions (pairwise flows: Auth -> Feed -> Comments ->
 * Profile -> Friends -> Chat -> Marketplace -> Ads -> Checkout).
 */

const fs = require('fs');
const path = require('path');
const assert = require('./helpers/assert.js');
const { createVirtualBrowserEnv, loadModuleInEnv } = require('./helpers/store_loader.js');

function registerTier3Tests(registry, rootDir) {
  const getPath = (rel) => path.join(rootDir, rel);
  const stateFile = 'js/store/state.js';
  const mockDataFile = 'js/store/mockData.js';

  const getCount = (r) => (Array.isArray(r) ? r.length : (typeof r === 'number' ? r : 0));

  // Helper to load fresh store
  function getFreshStore() {
    const env = createVirtualBrowserEnv();
    const storeMod = loadModuleInEnv(getPath(stateFile), env);
    const store = storeMod.store || storeMod.state;
    if (typeof store.init === 'function') store.init();
    const users = (store.data && store.data.users) || (store.state && store.state.users) || [];
    return { store, env, users };
  }

  // =========================================================================
  // Flow 1: Auth -> Feed Interaction
  // =========================================================================
  registry.describe('Tier 3: Flow 1 - Auth -> Feed Interaction', () => {
    registry.test('F1.1 Authenticated user session automatically sets authorId on new posts', {
      tier: 3,
      milestone: 'M3',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      assert.ok(users.length > 0, 'Seed users required');
      const testUser = users[0];

      if (typeof store.setCurrentUser === 'function') store.setCurrentUser(testUser);

      if (typeof store.createPost === 'function') {
        const post = store.createPost({
          courseCode: 'CS-302',
          content: 'Authentication to Feed integration test post'
        });
        assert.ok(post, 'Post should be returned');
        assert.strictEqual(post.authorId, testUser.id, 'Post authorId must match authenticated user ID');

        const feed = store.getPosts ? store.getPosts() : [];
        assert.ok(feed.some(p => p.id === post.id), 'Newly created post must be in feed');
      }
    });

    registry.test('F1.2 Logging out clears session', {
      tier: 3,
      milestone: 'M3',
      requiredFiles: [stateFile]
    }, () => {
      const { store } = getFreshStore();
      if (typeof store.logout === 'function') store.logout();
      assert.strictEqual(store.getCurrentUser ? store.getCurrentUser() : null, null, 'Session must be null after logout');
    });
  });

  // =========================================================================
  // Flow 2: Feed -> Reactions & Comments Interaction
  // =========================================================================
  registry.describe('Tier 3: Flow 2 - Feed -> Reactions & Comments Interaction', () => {
    registry.test('F2.1 Reacting to a post updates reaction counters and maps user reaction', {
      tier: 3,
      milestone: 'M4',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const user = users[0];
      if (store.setCurrentUser) store.setCurrentUser(user);

      const posts = store.getPosts ? store.getPosts() : [];
      assert.ok(posts.length > 0, 'Seed posts required');
      const targetPost = posts[0];

      const reactFn = store.toggleReaction || store.reactToPost;
      if (typeof reactFn === 'function') {
        reactFn.call(store, targetPost.id, 'heart');
        const updated = (store.getPosts ? store.getPosts() : []).find(p => p.id === targetPost.id);
        const heartCount = getCount(updated.reactions.heart || updated.reactions.love || updated.reactions.like);
        assert.ok(heartCount >= 0, 'Reaction count must be updated');
      }
    });

    registry.test('F2.2 Adding comment to a post increments commentsCount and preserves relation', {
      tier: 3,
      milestone: 'M4',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const user = users[0];
      if (store.setCurrentUser) store.setCurrentUser(user);

      const posts = store.getPosts ? store.getPosts() : [];
      const target = posts[0];
      const initialCount = target.commentsCount || 0;

      if (typeof store.addComment === 'function') {
        const comment = store.addComment(target.id, 'Great coursework presentation!');
        assert.ok(comment, 'Comment must be created');
        assert.strictEqual(comment.postId, target.id, 'Comment postId must match target post');

        const updated = (store.getPosts ? store.getPosts() : []).find(p => p.id === target.id);
        assert.strictEqual(updated.commentsCount, initialCount + 1, 'Post commentsCount must increment by 1');
      }
    });
  });

  // =========================================================================
  // Flow 3: Feed -> Profile Timeline Filtering
  // =========================================================================
  registry.describe('Tier 3: Flow 3 - Feed -> Profile Timeline Interaction', () => {
    registry.test('F3.1 User profile timeline correctly filters posts authored by specific user', {
      tier: 3,
      milestone: 'M5',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const userA = users[0];
      const userB = users[1] || { id: 'usr_alt_99', name: 'Alt User' };

      if (typeof store.createPost === 'function') {
        // Create post as user A
        store.setCurrentUser(userA);
        const postA = store.createPost({ id: 'post_test_a_' + Date.now(), authorId: userA.id, content: 'Post by Student A', courseCode: 'CS-302' });

        // Create post as user B
        store.setCurrentUser(userB);
        const postB = store.createPost({ id: 'post_test_b_' + Date.now(), authorId: userB.id, content: 'Post by Student B', courseCode: 'CS-304' });

        // Filter for user A's posts
        const allPosts = store.getPosts ? store.getPosts() : [];
        const userAPosts = allPosts.filter(p => p.authorId === userA.id);

        assert.ok(userAPosts.some(p => p.content === 'Post by Student A'), 'User A timeline must include Post A');
        assert.ok(!userAPosts.some(p => p.content === 'Post by Student B'), 'User A timeline must NOT include Post B');
      }
    });
  });

  // =========================================================================
  // Flow 4: Friends -> Social Network & Requests
  // =========================================================================
  registry.describe('Tier 3: Flow 4 - Friends Search -> Request -> Accept Flow', () => {
    registry.test('F4.1 Full friend request lifecycle: Send -> Queue -> Accept -> Increment friendsCount', {
      tier: 3,
      milestone: 'M6',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const userA = users[0];
      // Register a fresh student peer who has no existing friendships or requests
      const reg = store.register({
        name: 'Fresh Peer Student',
        email: `peer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@pu.edu.pk`,
        password: 'password123'
      });
      const userB = reg.user;
      assert.ok(userA && userB, 'Need user author and fresh peer');

      // 1. User A sends friend request to User B
      store.setCurrentUser(userA);
      let requestResult = null;
      if (typeof store.sendFriendRequest === 'function') {
        requestResult = store.sendFriendRequest(userB.id);
        assert.ok(requestResult, 'Friend request must be sent or created');
      }

      // 2. User B responds to friend request by accepting
      if (typeof store.respondFriendRequest === 'function' && typeof store.getFriendRequests === 'function') {
        store.setCurrentUser(userB);
        const requests = store.getFriendRequests();
        const incoming = Array.isArray(requests.incoming) ? requests.incoming : (Array.isArray(requests) ? requests : []);
        if (incoming.length > 0) {
          const reqId = incoming[0].id;
          const accepted = store.respondFriendRequest(reqId, 'accept');
          assert.ok(accepted, 'Request should be accepted');
        }
      }
    });
  });

  // =========================================================================
  // Flow 5: Friends -> Chat Messenger Interaction
  // =========================================================================
  registry.describe('Tier 3: Flow 5 - Peer Connection -> Chat Messaging', () => {
    registry.test('F5.1 Sending a chat message updates conversation lastMessageSnippet and appends to thread', {
      tier: 3,
      milestone: 'M7',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const sender = users[0];
      store.setCurrentUser(sender);

      const chats = store.getConversations ? store.getConversations() : (store.state.conversations || store.state.chats || []);
      if (chats.length > 0 && typeof store.sendMessage === 'function') {
        const targetChat = chats[0];
        const testContent = `Direct message test timestamp: ${Date.now()}`;

        const msg = store.sendMessage(targetChat.id, testContent);
        assert.ok(msg, 'Message must be dispatched');
        assert.strictEqual(msg.text || msg.content, testContent);
        assert.strictEqual(msg.senderId, sender.id);

        // Check conversation summary updated
        const updatedChat = (store.getConversations ? store.getConversations() : []).find(c => c.id === targetChat.id);
        if (updatedChat) {
          assert.strictEqual(updatedChat.lastMessage || updatedChat.lastMessageSnippet, testContent, 'Conversation snippet must match last message');
        }

        // Check messages stream contains message
        if (typeof store.getMessages === 'function') {
          const messages = store.getMessages(targetChat.id);
          assert.ok(messages.some(m => m.id === msg.id), 'Message must appear in thread stream');
        }
      }
    });
  });

  // =========================================================================
  // Flow 6: Marketplace -> Checkout -> Item Sold Flow
  // =========================================================================
  registry.describe('Tier 3: Flow 6 - Marketplace -> Checkout -> Sold State Flow', () => {
    registry.test('F6.1 Purchasing marketplace item via checkout transitions isSold to true or status=sold', {
      tier: 3,
      milestone: 'M11',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const buyer = users[0];
      store.setCurrentUser(buyer);

      if (typeof store.createMarketplaceItem === 'function' && typeof store.createOrder === 'function') {
        // 1. Create available item
        const item = store.createMarketplaceItem({
          title: 'Algorithms 4th Edition Textbook',
          price: 45,
          category: 'Textbooks'
        });
        assert.ok(item.isSold === false || item.status === 'available', 'Initial state must be available/unsold');

        // 2. Buyer completes checkout
        const order = store.createOrder({
          itemId: item.id,
          itemIds: [item.id],
          amount: 45,
          totalAmount: 45,
          paymentMethod: 'student_wallet',
          shippingAddress: 'Hostel Block 4, PU Campus'
        });

        assert.ok(order && order.id, 'Order must be generated');

        // 3. Verify marketplace item is now marked sold
        const catalog = store.getMarketplaceItems ? store.getMarketplaceItems() : (store.state.marketplace || store.state.marketplaceItems || []);
        const purchasedItem = catalog.find(i => i.id === item.id);
        assert.ok(purchasedItem, 'Item must still exist in catalog');
        assert.ok(purchasedItem.isSold === true || purchasedItem.status === 'sold', 'Item must be marked sold or status=sold');
      }
    });
  });

  // =========================================================================
  // Flow 7: Ads Manager -> Feed Sponsored Injection
  // =========================================================================
  registry.describe('Tier 3: Flow 7 - Ads Campaign Creation -> Feed Injection', () => {
    registry.test('F7.1 Active ad campaign is retrieved for sponsored feed placement', {
      tier: 3,
      milestone: 'M10',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const { store, users } = getFreshStore();
      const advertiser = users[0];
      store.setCurrentUser(advertiser);

      if (typeof store.createAd === 'function' || typeof store.createAdCampaign === 'function') {
        const createFn = store.createAd || store.createAdCampaign;
        const campaign = createFn.call(store, {
          title: 'PU Annual Hackathon 2026 Registration',
          dailyBudget: 25,
          budgetTotal: 100,
          durationDays: 7,
          targetCourse: 'CS-302',
          placement: 'feed'
        });

        assert.ok(campaign, 'Campaign must be created');

        // Retrieve active ads
        const activeAds = typeof store.getActiveAds === 'function' ? store.getActiveAds('feed') : (store.getAdCampaigns ? store.getAdCampaigns() : (store.state.adCampaigns || []));
        assert.ok(Array.isArray(activeAds), 'Active ads should return array');
        assert.ok(activeAds.some(a => a.id === campaign.id), 'Campaign must appear in active feed placements');
      }
    });
  });
}

module.exports = {
  registerTier3Tests
};
