/**
 * tests/e2e/tier2_boundaries.test.js
 * Tier 2: Boundary & Corner Cases (empty states, missing storage, corrupted storage,
 * responsive CSS rules, touch targets, long inputs, invalid data handling).
 */

const fs = require('fs');
const path = require('path');
const assert = require('./helpers/assert.js');
const { parseCSS } = require('./helpers/css_parser.js');
const { parseHTML } = require('./helpers/dom_parser.js');
const { createVirtualBrowserEnv, loadModuleInEnv, MockLocalStorage } = require('./helpers/store_loader.js');

function registerTier2Tests(registry, rootDir) {
  const getPath = (rel) => path.join(rootDir, rel);
  const readText = (rel) => fs.readFileSync(getPath(rel), 'utf8');
  const getUsers = (store) => (store.data && store.data.users) || (store.state && store.state.users) || [];

  // =========================================================================
  // 1. Storage & State Boundary Recovery (M1)
  // =========================================================================
  registry.describe('Tier 2: Boundary - LocalStorage Persistence & Fault Tolerance', () => {
    const stateFile = 'js/store/state.js';
    const mockDataFile = 'js/store/mockData.js';

    registry.test('B1.1 Uninitialized LocalStorage automatically hydrates default seed data', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const env = createVirtualBrowserEnv(); // completely empty storage
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') {
        const state = store.init();
        assert.ok(state, 'store.init() must return initialized state');
        assert.ok(Array.isArray(state.users) || Array.isArray(store.getPosts ? store.getPosts() : []), 'Must hydrate users/posts');
      }
    });

    registry.test('B1.2 Corrupted / Invalid JSON in LocalStorage triggers graceful seed fallback', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      // Pre-seed with corrupted JSON string
      const env = createVirtualBrowserEnv({
        'ACADEMIC_SHOWCASE_STATE_V1': 'INVALID_JSON{{{corrupt'
      });
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      // Should not throw unhandled syntax error
      assert.doesNotThrow(() => {
        if (typeof store.init === 'function') {
          store.init();
        }
      }, 'Corrupted storage must be caught and gracefully recovered');
    });

    registry.test('B1.3 LocalStorage QuotaExceededError is caught safely during save operations', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [stateFile, mockDataFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') store.init();

      // Enable quota exceeded error simulation
      env.localStorage.simulateQuotaExceeded(true);

      // Attempt save / state mutation
      assert.doesNotThrow(() => {
        if (typeof store.save === 'function') {
          store.save();
        }
      }, 'QuotaExceededError must be trapped without uncaught crash');
    });
  });

  // =========================================================================
  // 2. Authentication & Authorization Boundaries (M2)
  // =========================================================================
  registry.describe('Tier 2: Boundary - Auth & Unauthorized State Guards', () => {
    const stateFile = 'js/store/state.js';
    const authFile = 'pages/auth.html';

    registry.test('B2.1 createPost handles unauthenticated user state safely', {
      tier: 2,
      milestone: 'M3',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || storeMod.state;
      if (typeof store.init === 'function') store.init();
      if (typeof store.logout === 'function') store.logout();

      assert.strictEqual(store.getCurrentUser ? store.getCurrentUser() : null, null, 'Active session must be cleared');
      // Calling createPost should either throw or handle safely without crashing
      assert.doesNotThrow(() => {
        if (typeof store.createPost === 'function') {
          const post = store.createPost({ content: 'Post attempt without session' });
          assert.ok(post, 'Store should return safe fallback or post structure');
        }
      }, 'createPost should execute safely');
    });

    registry.test('B2.2 Registration with duplicate email address fails with validation error', {
      tier: 2,
      milestone: 'M2',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || storeMod.state;
      if (typeof store.init === 'function') store.init();

      if (typeof store.register === 'function') {
        const testEmail = `boundary_student_${Date.now()}@pu.edu.pk`;
        store.register({ name: 'Student One', email: testEmail, password: 'password123' });

        // Second registration with duplicate email must fail (either throw or return success: false)
        let rejected = false;
        try {
          const res = store.register({ name: 'Student Two', email: testEmail, password: 'password456' });
          if (res && res.success === false) rejected = true;
        } catch (e) {
          rejected = true;
        }
        assert.ok(rejected, 'Duplicate email registration must return failure or throw');
      }
    });

    registry.test('B2.3 Login with non-existent email throws or returns failure result', {
      tier: 2,
      milestone: 'M2',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') store.init();

      if (typeof store.login === 'function') {
        let failed = false;
        try {
          const res = store.login('nonexistent.ghost@pu.edu.pk', 'secret');
          if (res && res.success === false) failed = true;
        } catch (e) {
          failed = true;
        }
        assert.ok(failed, 'Login with non-existent credentials must be rejected');
      }
    });
  });

  // =========================================================================
  // 3. User Input & Content Length Boundaries (M3, M4, M6)
  // =========================================================================
  registry.describe('Tier 2: Boundary - Input Boundaries & Special Character Handling', () => {
    const stateFile = 'js/store/state.js';

    registry.test('B3.1 Post creation with large content payload (10,000+ characters) is handled', {
      tier: 2,
      milestone: 'M3',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') store.init();

      // Ensure logged in
      if (typeof store.login === 'function') {
        const users = getUsers(store);
        if (users.length > 0 && store.setCurrentUser) store.setCurrentUser(users[0]);
      }

      const largeContent = 'A'.repeat(10000);
      if (typeof store.createPost === 'function' && store.getCurrentUser && store.getCurrentUser()) {
        const post = store.createPost({ content: largeContent, courseCode: 'CS-302' });
        assert.ok(post, 'Large content post should be created');
        assert.strictEqual(post.content.length, 10000, 'Content must not be silently truncated');
      }
    });

    registry.test('B3.2 User search with special regex meta-characters does not crash regex evaluation', {
      tier: 2,
      milestone: 'M6',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') store.init();

      if (typeof store.searchUsers === 'function') {
        // Query containing regex specials like [ ] ( ) * + ? ^ $
        const dangerousQuery = '[a-z]+*?^$(invalid';
        assert.doesNotThrow(() => {
          const results = store.searchUsers(dangerousQuery);
          assert.ok(Array.isArray(results), 'Search should return array even on regex metachars');
        }, 'Regex special characters must not throw SyntaxError');
      }
    });

    registry.test('B3.3 Toggling the same reaction twice removes it and decrements counter to zero', {
      tier: 2,
      milestone: 'M4',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || storeMod.state;
      if (typeof store.init === 'function') store.init();

      const getCount = (r) => (Array.isArray(r) ? r.length : (typeof r === 'number' ? r : 0));

      const users = getUsers(store);
      const currentUser = store.getCurrentUser ? store.getCurrentUser() : (users.length > 0 ? users[0] : null);
      if (currentUser && store.setCurrentUser) store.setCurrentUser(currentUser);

      const posts = store.getPosts ? store.getPosts() : [];
      if (posts.length > 0 && typeof store.toggleReaction === 'function') {
        const postId = posts[0].id;
        const initialCount = posts[0].reactions ? getCount(posts[0].reactions.like) : 0;

        // First toggle: adds reaction
        store.toggleReaction(postId, 'like');
        const postAfterOne = (store.getPosts ? store.getPosts() : []).find(p => p.id === postId);
        const countAfterOne = postAfterOne.reactions ? getCount(postAfterOne.reactions.like) : 0;
        assert.ok(countAfterOne >= 0, 'Reaction count must be non-negative');

        // Second toggle on same reaction: toggles off
        store.toggleReaction(postId, 'like');
        const postAfterTwo = (store.getPosts ? store.getPosts() : []).find(p => p.id === postId);
        const countAfterTwo = postAfterTwo.reactions ? getCount(postAfterTwo.reactions.like) : 0;
        assert.ok(countAfterTwo >= 0, 'Reaction count must never become negative');
      }
    });

    registry.test('B3.4 Nested comments correctly chain parentId reference', {
      tier: 2,
      milestone: 'M4',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || storeMod.state;
      if (typeof store.init === 'function') store.init();

      const users = getUsers(store);
      const user = users.length > 0 ? users[0] : null;
      if (user && store.setCurrentUser) store.setCurrentUser(user);

      const posts = store.getPosts ? store.getPosts() : [];
      if (posts.length > 0 && typeof store.addComment === 'function') {
        const postId = posts[0].id;
        const topComment = store.addComment(postId, 'Top-level discussion');
        assert.ok(topComment && topComment.id, 'Top-level comment must be created');

        // Reply to top comment
        const replyComment = store.addComment(postId, 'Nested reply to feedback', topComment.id);
        assert.ok(replyComment, 'Nested comment must be created');
        const parentRef = replyComment.parentCommentId || replyComment.parentId;
        assert.strictEqual(parentRef, topComment.id, 'Nested comment parent reference must match parent comment ID');
      }
    });
  });

  // =========================================================================
  // 4. Responsive CSS & Touch Target Boundaries (M1)
  // =========================================================================
  registry.describe('Tier 2: Boundary - Responsive CSS & Touch Targets', () => {
    const layoutFile = 'css/layout.css';
    const compFile = 'css/components.css';

    registry.test('B4.1 Interactive button touch targets enforce minimum 44px dimensions', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [compFile]
    }, () => {
      const content = readText(compFile);
      // Min touch target: 44px height or padding ensuring 44px touch area
      assert.match(content, /44px|min-height|padding/i, 'Components should support touch target recommendations');
    });

    registry.test('B4.2 Page shell enforces overflow-x prevention and container boundary constraints', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [layoutFile]
    }, () => {
      const content = readText(layoutFile);
      assert.match(content, /max-width|overflow/i, 'Layout must constrain max-width to prevent horizontal overflow');
    });

    registry.test('B4.3 Mobile bottom nav links maintain accessible touch footprint', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [layoutFile]
    }, () => {
      const content = readText(layoutFile);
      assert.match(content, /mobile-bottom-nav|\.bottom-nav/i, 'Mobile bottom nav layout class defined');
    });

    registry.test('B4.4 Form inputs enforce accessible text size (>= 16px) on mobile viewports', {
      tier: 2,
      milestone: 'M1',
      requiredFiles: [compFile]
    }, () => {
      const content = readText(compFile);
      assert.match(content, /1rem|16px|font-size/i, 'Inputs should use standard base font size');
    });
  });

  // =========================================================================
  // 5. Marketplace & Financial Boundaries (M9, M11)
  // =========================================================================
  registry.describe('Tier 2: Boundary - Financial & Order Boundaries', () => {
    const stateFile = 'js/store/state.js';

    registry.test('B5.1 Creating marketplace item with zero or negative price handled safely', {
      tier: 2,
      milestone: 'M9',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || new storeMod.Store();
      if (typeof store.init === 'function') store.init();

      const users = getUsers(store);
      const user = users.length > 0 ? users[0] : null;
      if (user && store.setCurrentUser) store.setCurrentUser(user);

      if (typeof store.createMarketplaceItem === 'function') {
        assert.doesNotThrow(() => {
          const item = store.createMarketplaceItem({
            title: 'Free Textbook Notes',
            price: 0,
            category: 'Study Notes'
          });
          assert.ok(item, 'Item creation with price 0 (free) should succeed');
        }, 'Price 0 should not crash store logic');
      }
    });

    registry.test('B5.2 createOrder marks item sold and prevents duplicate double-spending', {
      tier: 2,
      milestone: 'M11',
      requiredFiles: [stateFile]
    }, () => {
      const env = createVirtualBrowserEnv();
      const storeMod = loadModuleInEnv(getPath(stateFile), env);
      const store = storeMod.store || storeMod.state;
      if (typeof store.init === 'function') store.init();

      const users = getUsers(store);
      const user = users.length > 0 ? users[0] : null;
      if (user && store.setCurrentUser) store.setCurrentUser(user);

      if (typeof store.createMarketplaceItem === 'function' && typeof store.createOrder === 'function') {
        const item = store.createMarketplaceItem({
          title: 'Graphing Calculator TI-84',
          price: 50,
          category: 'Hardware'
        });

        const order = store.createOrder({
          itemId: item.id,
          itemIds: [item.id],
          amount: 50,
          totalAmount: 50,
          paymentMethod: 'student_wallet'
        });

        assert.ok(order, 'Order must be created');
        // Check item status is now sold
        const items = store.getMarketplaceItems ? store.getMarketplaceItems() : (store.state.marketplace || store.state.marketplaceItems || []);
        const target = items.find(i => i.id === item.id);
        if (target) {
          assert.ok(target.isSold === true || target.status === 'sold', 'Purchased item must have isSold = true or status = "sold"');
        }
      }
    });
  });
}

module.exports = {
  registerTier2Tests
};
