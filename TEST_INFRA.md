# Testing Infrastructure — Academic Coursework Showcase Social Media Platform

This document describes the automated opaque-box End-to-End (E2E) testing framework designed for the client-side academic coursework showcase web application.

---

## 1. Architecture Overview

The testing framework is built entirely with zero external runtime dependencies, executing on standard Node.js (v20+). It is strictly opaque-box and requirement-driven, testing static DOM and CSS structure, interactive ES6 module state transitions, responsive CSS design rules, and Git repository branch integrity according to `PROJECT.md` and `ORIGINAL_REQUEST.md`.

```
tests/e2e/
├── test_runner.js               # Master CLI entrypoint
├── helpers/
│   ├── assert.js                # Zero-dependency assertion engine
│   ├── dom_parser.js            # Fast HTML / DOM tokenizer & query selector
│   ├── css_parser.js            # CSS token & media query parser
│   ├── store_loader.js          # Virtual browser environment, MockLocalStorage & ESM transformer
│   ├── git_helper.js            # Git repository & branch structure inspector
│   └── harness.js               # Test registry, suite runner, and colored reporter
├── tier1_features.test.js       # Tier 1: 135 Feature coverage tests (27 features, M0-M11)
├── tier2_boundaries.test.js     # Tier 2: 16 Boundary & corner case tests
├── tier3_interactions.test.js   # Tier 3: 9 Cross-feature interaction flow tests
└── tier4_scenarios.test.js      # Tier 4: 4 Real-world academic workflow scenarios
```

---

## 2. Helper Subsystems

### 2.1. Assertion Engine (`tests/e2e/helpers/assert.js`)
Provides deterministic assertions with human-readable error messages:
- `assert.ok(value, msg)`: Truthiness assertion.
- `assert.strictEqual(actual, expected, msg)`: Strict reference/primitive equality (`===`).
- `assert.notStrictEqual(actual, expected, msg)`: Strict inequality (`!==`).
- `assert.deepStrictEqual(actual, expected, msg)`: Recursive deep object and array equality.
- `assert.match(string, regex, msg)`: Regular expression pattern matcher.
- `assert.includes(haystack, needle, msg)`: Substring or array element containment check.
- `assert.throws(fn, errLike, msg)`: Exception validation.
- `assert.rejects(asyncFn, errLike, msg)`: Promise rejection validation.
- `assert.doesNotThrow(fn, msg)`: Asserts code block executes without throwing errors.

### 2.2. DOM Parser & HTML Query Engine (`tests/e2e/helpers/dom_parser.js`)
Lightweight, resilient HTML tokenizer capable of parsing standard HTML5 view files:
- `hasDoctype(html)`: Validates HTML5 doctype declaration.
- `hasMetaViewport(html)`: Validates `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- `getTitle(html)`: Extracts `<title>` tag content.
- `getElementById(html, id)`: Queries single elements by id attribute.
- `getElementsByClassName(html, className)`: Queries elements by CSS class.
- `getElementsByTagName(html, tagName)`: Queries elements by HTML tag.
- `getStyleSheets(html)`: Extracts `<link rel="stylesheet">` href references.
- `getScriptModules(html)`: Extracts `<script type="module">` src references.

### 2.3. CSS Token & Media Query Parser (`tests/e2e/helpers/css_parser.js`)
Evaluates CSS stylesheets without headless browser overhead:
- Extracts `:root` CSS custom properties (colors, typography, spacing, elevations).
- Extracts `[data-theme="dark"]` overrides to verify complete dark mode coverage.
- Tokenizes `@media` blocks to inspect responsive breakpoint boundaries (`max-width: 768px`, `min-width: 1024px`, etc.).
- Verifies touch target dimensions (`min-height: 44px`) and layout properties (`display: grid`, `position: sticky`).

### 2.4. Store Loader & Virtual Browser Sandbox (`tests/e2e/helpers/store_loader.js`)
Because the application runs in client-side ES6 modules and relies on `localStorage`, the store loader provides:
- `MockLocalStorage`: Full `Storage` API implementation (`getItem`, `setItem`, `removeItem`, `clear`, `key`, `length`).
  - Supports error injection via `simulateQuotaExceeded(true)` to test `QuotaExceededError` handling.
  - Supports `simulateReadError(true)` and corrupted JSON payload testing.
- `createVirtualBrowserEnv(initialStorage)`: Provides sandboxed `window`, `document` (DOM stubs), `localStorage`, and event dispatching.
- `transformEsmToSandbox(source, filePath)`: In-memory AST/regex transformer translating ES6 `import` / `export` statements into Node.js VM compatible execution blocks, resolving relative imports cleanly.

### 2.5. Git Repository Inspector (`tests/e2e/helpers/git_helper.js`)
Validates repository branching strategy directly via the `git` CLI:
- Verifies initialization of `main` and `develop` branches.
- Verifies sequential feature branches (e.g. `feat/core-layout-store`).
- Checks commit history and confirms baseline commits.

---

## 3. The 4 Testing Tiers

### Tier 1: Feature Coverage (135 tests)
Provides exhaustive verification (>= 5 test cases per feature) across all 27 core features:
- **Feature 1**: Git Repository & Baseline Setup (`.gitignore`, `README.md`, `main`, `develop`, feature branch, initial commit).
- **Feature 2**: Design Tokens & Theme Variables (`css/variables.css` colors, typography, spacing, radius, dark mode).
- **Feature 3**: CSS Reset & Base Normalization (`css/reset.css` box-sizing, margin resets, media fluidness, form normalization).
- **Feature 4**: Core Layout Grid & Breakpoints (`css/layout.css` app container, sticky sidebar, tablet and mobile breakpoints).
- **Feature 5**: Reusable UI Components Styling (`css/components.css` buttons, cards, avatars, modal dialog, badges/tabs).
- **Feature 6**: Navbar Component (`js/components/navbar.js` brand logo, search input, notification bell, mobile toggle).
- **Feature 7**: Sidebar Component (`js/components/sidebar.js` profile card, navigation links, active states, mobile drawer).
- **Feature 8**: Modal Dialog Component (`js/components/modal.js` open/close, backdrop click, escape key handling).
- **Feature 9**: Post Card Component (`js/components/postCard.js` author badge, course tags, reaction buttons, comments section).
- **Feature 10**: Seed Mock Data Store (`js/store/mockData.js` students, coursework posts, marketplace products, groups, ads).
- **Feature 11**: State Store Auth & Session (`js/store/state.js` user registration, login, logout, session persistence).
- **Feature 12**: State Store Coursework Posts (`js/store/state.js` createPost, getPosts, filterByCourse, pagination).
- **Feature 13**: State Store Social Reactions & Comments (`js/store/state.js` toggleReaction, 5 reaction types, threaded comments).
- **Feature 14**: State Store Profiles & Timelines (`js/store/state.js` getProfile, updateProfile, getUserPosts, bookmarks).
- **Feature 15**: State Store Friends & Connections (`js/store/state.js` sendRequest, acceptRequest, removeFriend, mutual friends).
- **Feature 16**: State Store Real-time Messaging (`js/store/state.js` getConversations, sendMessage, unread count).
- **Feature 17**: State Store Academic Study Groups (`js/store/state.js` createGroup, joinGroup, groupPosts, course code tags).
- **Feature 18**: State Store Student Marketplace (`js/store/state.js` listProduct, getProducts, filterByCategory, search).
- **Feature 19**: State Store Ads & Sponsored Promotions (`js/store/state.js` createCampaign, impression tracking, CPC/CPM).
- **Feature 20**: State Store Checkout & Order Processing (`js/store/state.js` createOrder, order status, student wallet).
- **Features 21–27**: All 9 Application Views (`index.html`, `feed.html`, `profile.html`, `friends.html`, `chat.html`, `groups.html`, `marketplace.html`, `checkout.html`, `ads.html`) — checking DOCTYPE, meta viewport, title, CSS linking, component containers, and module imports.

### Tier 2: Boundary & Corner Cases (16 tests)
Validates system resilience under failure conditions and extreme parameters:
- **B1.1–B1.3**: Uninitialized storage hydration, corrupted JSON recovery, and `QuotaExceededError` containment.
- **B2.1–B2.3**: Unauthenticated post creation guards, duplicate email registration rejection, non-existent login rejection.
- **B3.1–B3.4**: 10,000+ character post payload support, regex special character search sanitization, reaction toggle idempotency, and nested comment `parentId` referencing.
- **B4.1–B4.4**: 44px minimum interactive touch targets, container overflow-x constraints, accessible mobile touch footprint, base 16px mobile input font sizes.
- **B5.1–B5.2**: Safe zero-price / free study material listings, double-spending prevention, and `isSold: true` transaction marking.

### Tier 3: Cross-Feature Interactions (9 tests)
Validates state propagation across paired modules:
- **F1.1–F1.2**: Session propagation: user login sets `authorId` on posts; logout destroys active session.
- **F2.1–F2.2**: Social propagation: reacting updates counter arrays; commenting increments `commentsCount` and establishes parent-child relation.
- **F3.1**: Timeline filtering: profile view isolates author-specific coursework posts.
- **F4.1**: Social graph lifecycle: Student A sends request -> Student B receives -> B accepts -> both increment mutual `friendsCount`.
- **F5.1**: Chat dispatch: sending a message updates thread and conversation `lastMessageSnippet`.
- **F6.1**: Marketplace transaction: checkout execution transitions item status to `sold` and disables repurchase.
- **F7.1**: Monetization injection: active sponsored campaigns are retrieved and formatted for inline feed display.

### Tier 4: Real-world Academic Scenarios (4 tests)
Comprehensive multi-step end-to-end user journeys:
- **S1.1: Coursework Showcase & Peer Review Workflow**: Student posts CS-301 assignment -> classmates react with 'celebrate' & 'idea' -> peer adds code review comment -> post is shared to study group.
- **S2.1: Student Marketplace Sale & Multi-Method Checkout**: Senior lists used textbook -> Junior searches and filters catalog -> Junior selects student wallet payment -> transaction receipt generated -> textbook marked sold.
- **S3.1: Department Event Promotion & Sponsored Placements**: Department organizer builds sponsored ad -> budget and duration calculated -> ad injected into main feed -> impressions increment upon delivery.
- **S4.1: Study Peer Networking & Collaborative Messaging**: Student searches classmate by department -> dispatches connection request -> classmate accepts -> instant messaging conversation initiated.

---

## 4. Progressive Milestone Testing

The test runner is designed for **Progressive Testability**:
- When run during milestone development, tests that assert files belonging to future milestones (e.g. `pages/chat.html` in M7) detect that the required file is not yet created and mark the test as `○ [PENDING]`.
- Tests for completed milestones (M0 baseline, M1 layout & store) execute fully and must pass (`✓ [PASS]`).
- If an implemented file contains a defect, the test fails (`✗ [FAIL]`) and exits with code 1.
- In `--strict` mode (used for final delivery verification), any pending test is treated as a failure.

---

## 5. Execution Commands

### Run Full Test Suite
```bash
node tests/e2e/test_runner.js
```

### Run Specific Testing Tier
```bash
# Tier 1: Feature coverage
node tests/e2e/test_runner.js --tier 1

# Tier 2: Boundary & Corner Cases
node tests/e2e/test_runner.js --tier 2

# Tier 3: Cross-Feature Interactions
node tests/e2e/test_runner.js --tier 3

# Tier 4: Real-world Academic Scenarios
node tests/e2e/test_runner.js --tier 4
```

### Run Tests for a Specific Milestone
```bash
node tests/e2e/test_runner.js --milestone M1
```

### Strict Mode (Release Quality Audit)
```bash
node tests/e2e/test_runner.js --strict
```
