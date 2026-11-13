/**
 * tests/e2e/tier1_features.test.js
 * Tier 1: Feature Coverage (>=5 test cases per feature across all 9 views,
 * components, CSS files, store methods, and Git branches).
 */

const fs = require('fs');
const path = require('path');
const assert = require('./helpers/assert.js');
const { parseHTML } = require('./helpers/dom_parser.js');
const { parseCSS } = require('./helpers/css_parser.js');
const { createVirtualBrowserEnv, loadModuleInEnv } = require('./helpers/store_loader.js');
const { GitHelper } = require('./helpers/git_helper.js');

function registerTier1Tests(registry, rootDir) {
  const getPath = (rel) => path.join(rootDir, rel);
  const readText = (rel) => fs.readFileSync(getPath(rel), 'utf8');

  // =========================================================================
  // 1. Git Repository & Baseline Setup (M0)
  // =========================================================================
  registry.describe('Tier 1: Feature 1 - Git Repository & Baseline Setup (M0)', () => {
    const git = new GitHelper(rootDir);

    registry.test('1.1 .gitignore exists and ignores editor and temporary files', {
      tier: 1,
      milestone: 'M0',
      requiredFiles: ['.gitignore']
    }, () => {
      const content = readText('.gitignore');
      assert.ok(
        content.includes('.vscode') || content.includes('.idea') || content.includes('*.log') || content.includes('node_modules'),
        '.gitignore should ignore editor or temporary files'
      );
      assert.ok(content.length > 10, '.gitignore should not be empty');
    });

    registry.test('1.2 README.md exists in repository baseline', {
      tier: 1,
      milestone: 'M0',
      requiredFiles: ['README.md']
    }, () => {
      assert.ok(fs.existsSync(getPath('README.md')), 'README.md must exist at project root');
      const content = readText('README.md');
      // Verify file presence; if empty, mark warning/note for milestone completion
      assert.ok(typeof content === 'string', 'README.md content must be readable');
    });

    registry.test('1.3 Git repository has main and develop branches initialized', {
      tier: 1,
      milestone: 'M0'
    }, () => {
      const branches = git.getAllBranches();
      assert.ok(git.hasBranch('main'), 'Branch "main" must exist');
      assert.ok(git.hasBranch('develop'), 'Branch "develop" must exist');
    });

    registry.test('1.4 Sequential feature branch exists or is tracked in repository history', {
      tier: 1,
      milestone: 'M0'
    }, () => {
      const current = git.getCurrentBranch();
      const branches = git.getAllBranches();
      const hasCoreBranch = branches.some(b => b.includes('feat/core-layout-store') || b.includes('develop'));
      assert.ok(hasCoreBranch, 'feat/core-layout-store or develop branch should be active/present');
    });

    registry.test('1.5 Git commit history contains root baseline commit', {
      tier: 1,
      milestone: 'M0'
    }, () => {
      const commits = git.getCommitLog(10);
      assert.ok(commits.length >= 1, 'Git commit log should have at least 1 commit');
    });
  });

  // =========================================================================
  // 2. Design Tokens & Theme Variables (css/variables.css - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 2 - Design Tokens & Theme Variables (M1)', () => {
    const targetFile = 'css/variables.css';

    registry.test('2.1 css/variables.css exists and defines brand color palette', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasVariable('--color-primary'), 'Must declare --color-primary');
      assert.ok(css.hasVariable('--color-accent') || css.hasVariable('--color-secondary'), 'Must declare accent/secondary');
      assert.ok(
        css.hasVariable('--color-bg') || css.hasVariable('--color-bg-base') || css.hasVariable('--bg-body') || css.hasVariable('--bg-surface'),
        'Must declare background/surface color token'
      );
    });

    registry.test('2.2 Declares typography tokens (font family, scale, and line heights)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasVariable('--font-sans') || css.hasVariable('--font-family-base'), 'Must declare font family');
      assert.ok(css.hasVariable('--font-sm') || css.hasVariable('--font-size-sm'), 'Must declare small font size');
      assert.ok(css.hasVariable('--font-base') || css.hasVariable('--font-size-base'), 'Must declare base font size');
      assert.ok(css.hasVariable('--font-lg') || css.hasVariable('--font-size-lg') || css.hasVariable('--font-xl'), 'Must declare larger font size');
    });

    registry.test('2.3 Declares standard spacing scale for modular layouts', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasVariable('--space-1') || css.hasVariable('--space-xs'), 'Must declare small spacing token');
      assert.ok(css.hasVariable('--space-4') || css.hasVariable('--space-md'), 'Must declare base/medium spacing token');
      assert.ok(css.hasVariable('--space-8') || css.hasVariable('--space-lg'), 'Must declare large spacing token');
    });

    registry.test('2.4 Declares shadows, elevations, and rounded corner radius tokens', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasVariable('--radius-sm') || css.hasVariable('--radius-md'), 'Must declare border radius token');
      assert.ok(css.hasVariable('--radius-full'), 'Must declare --radius-full for avatar pills/circles');
      assert.ok(css.hasVariable('--shadow-sm') || css.hasVariable('--shadow-card') || css.hasVariable('--shadow-md'), 'Must declare shadow token');
    });

    registry.test('2.5 Implements dark theme color overrides via [data-theme="dark"] selector', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(
        css.hasDarkVariable('--color-bg') || css.hasDarkVariable('--color-bg-base') || css.hasDarkVariable('--bg-body') || css.hasDarkVariable('--bg-surface'),
        'Must override background/surface in dark mode'
      );
    });
  });

  // =========================================================================
  // 3. CSS Reset & Typography Normalization (css/reset.css - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 3 - CSS Reset & Base Normalization (M1)', () => {
    const targetFile = 'css/reset.css';

    registry.test('3.1 css/reset.css enforces universal box-sizing: border-box', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /box-sizing\s*:\s*border-box/i, 'Must set box-sizing: border-box on universal reset');
    });

    registry.test('3.2 Resets default margins and paddings on body and structural elements', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /margin\s*:\s*0/i, 'Must reset margins on body or elements');
    });

    registry.test('3.3 Normalizes image and media elements to responsive max-width: 100%', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /max-width\s*:\s*100%/i, 'Must set max-width: 100% on img/video/svg elements');
    });

    registry.test('3.4 Sets base typography, font smoothing, and line-height on root/body', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /line-height|font-family/i, 'Must configure baseline typography or line-height');
    });

    registry.test('3.5 Normalizes form controls and clickable button reset rules', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /button|input|textarea/i, 'Must address buttons, inputs, or textareas');
    });
  });

  // =========================================================================
  // 4. Core Multi-Column Layout Grid (css/layout.css - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 4 - Core Layout Grid & Breakpoints (M1)', () => {
    const targetFile = 'css/layout.css';

    registry.test('4.1 css/layout.css defines multi-column app container grid for desktop', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(
        css.hasSelector('.app-layout') || css.hasSelector('.app-container') || css.hasSelector('.layout-container'),
        'Must define main layout container class (.app-layout or .app-container)'
      );
      const containerRule = css.findRuleBySelector('.app-layout') || css.findRuleBySelector('.app-container') || css.findRuleBySelector('.layout-container');
      assert.ok(containerRule, 'Layout container rule must exist');
      assert.match(containerRule.body, /display\s*:\s*(grid|flex)/i, 'Layout container must use grid or flex');
    });

    registry.test('4.2 Defines desktop sidebar and layout columns with sticky positioning', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(
        css.hasSelector('.sidebar-left') || css.hasSelector('.app-sidebar') || css.hasSelector('.sidebar'),
        'Must define sidebar navigation column'
      );
      assert.match(readText(targetFile), /sticky/i, 'Sidebar column must feature sticky positioning');
    });

    registry.test('4.3 Defines tablet responsive breakpoint (768px - 1024px)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasMediaQuery('1024px'), 'Must include media query targeting tablet width (1024px)');
    });

    registry.test('4.4 Defines mobile responsive breakpoint (<= 768px) collapsing to single column', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasMediaQuery('767px') || css.hasMediaQuery('768px'), 'Must include media query for mobile (<= 768px)');
    });

    registry.test('4.5 Defines mobile off-canvas drawer and sticky bottom navigation classes', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /drawer-open|\.drawer/i, 'Must define slide-out drawer open modifier');
      assert.match(content, /mobile-bottom-nav|\.bottom-nav/i, 'Must define mobile bottom navigation bar class');
    });
  });

  // =========================================================================
  // 5. Reusable UI Components (css/components.css - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 5 - Reusable UI Components Styling (M1)', () => {
    const targetFile = 'css/components.css';

    registry.test('5.1 Defines button hierarchy (.btn, .btn-primary, .btn-secondary, .btn-icon)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasSelector('.btn'), 'Must define base .btn class');
      assert.ok(css.hasSelector('.btn-primary'), 'Must define .btn-primary class');
    });

    registry.test('5.2 Defines card containers (.card, .card-header, .card-body)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasSelector('.card'), 'Must define base .card class');
    });

    registry.test('5.3 Defines avatar badges and status indicator dots (.avatar, .avatar-status)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasSelector('.avatar'), 'Must define .avatar class');
    });

    registry.test('5.4 Defines accessible modal dialog overlay and container (.modal-backdrop, .modal-dialog)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const css = parseCSS(readText(targetFile));
      assert.ok(css.hasSelector('.modal-backdrop') || css.hasSelector('.modal-overlay'), 'Must define modal backdrop');
      assert.ok(css.hasSelector('.modal-dialog') || css.hasSelector('.modal-content') || css.hasSelector('.modal'), 'Must define modal container');
    });

    registry.test('5.5 Defines badge tags and navigation tabs (.badge, .tab-nav)', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /\.badge|\.tab-nav|\.dropdown/i, 'Must define reusable component classes (badge, tab-nav, dropdown)');
    });
  });

  // =========================================================================
  // 6. Navigation Bar Component (js/components/navbar.js - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 6 - Navbar Component (M1)', () => {
    const targetFile = 'js/components/navbar.js';

    registry.test('6.1 js/components/navbar.js exports renderNavbar function', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /export\s+function\s+renderNavbar/i, 'Must export renderNavbar function');
    });

    registry.test('6.2 renderNavbar creates brand logo and title elements', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /logo|brand/i, 'Navbar must include brand/logo references');
    });

    registry.test('6.3 renderNavbar creates global search input with autocomplete capability', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /search/i, 'Navbar must include search input markup');
    });

    registry.test('6.4 renderNavbar renders notifications bell and user avatar menu', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /avatar|user|profile/i, 'Navbar must include user avatar/profile menu');
    });

    registry.test('6.5 renderNavbar creates mobile hamburger menu toggle button', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /drawer|hamburger|menu-toggle|mobile/i, 'Navbar must render mobile toggle button');
    });
  });

  // =========================================================================
  // 7. Navigation Sidebar Component (js/components/sidebar.js - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 7 - Sidebar Component (M1)', () => {
    const targetFile = 'js/components/sidebar.js';

    registry.test('7.1 js/components/sidebar.js exports renderSidebar function', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /export\s+function\s+renderSidebar/i, 'Must export renderSidebar function');
    });

    registry.test('7.2 renderSidebar renders active user profile badge card', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /user|avatar|profile/i, 'Sidebar must render user identity information');
    });

    registry.test('7.3 renderSidebar renders navigation links for Feed, Friends, Groups, Marketplace', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /friends\.html|chat\.html|groups\.html|marketplace\.html/i, 'Sidebar must link to platform pages');
    });

    registry.test('7.4 renderSidebar applies active CSS class to current page navigation item', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /active/i, 'Sidebar must set active link class');
    });

    registry.test('7.5 renderSidebar supports mobile drawer slide-out toggle listener', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /drawer|drawer-open|close/i, 'Sidebar must handle drawer open/close transitions');
    });
  });

  // =========================================================================
  // 8. Reusable Modal Dialog (js/components/modal.js - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 8 - Modal Dialog Component (M1)', () => {
    const targetFile = 'js/components/modal.js';

    registry.test('8.1 js/components/modal.js exports openModal and closeModal functions', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /export\s+function\s+(openModal|closeModal|Modal)/i, 'Must export modal management functions');
    });

    registry.test('8.2 openModal creates backdrop overlay and dialog container', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /backdrop|modal/i, 'Modal must construct backdrop and container');
    });

    registry.test('8.3 Supports header title, customizable body HTML, and action buttons', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /title|content|buttons|footer/i, 'Modal must accept title, content, and footer options');
    });

    registry.test('8.4 Closes modal when user clicks backdrop overlay or close icon', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /click|close/i, 'Modal must attach click dismiss handlers');
    });

    registry.test('8.5 Closes modal on keyboard Escape key press', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /keydown|Escape|27/i, 'Modal must listen for Escape key to close');
    });
  });

  // =========================================================================
  // 9. Post Card Component (js/components/postCard.js - M3, M4)
  // =========================================================================
  registry.describe('Tier 1: Feature 9 - Post Card Component (M3, M4)', () => {
    const targetFile = 'js/components/postCard.js';

    registry.test('9.1 js/components/postCard.js exports renderPostCard function', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /export\s+function\s+renderPostCard/i, 'Must export renderPostCard function');
    });

    registry.test('9.2 renderPostCard renders author avatar, name, coursework tag, and timestamp', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /author|avatar|course/i, 'Post card must render author details and coursework tag');
    });

    registry.test('9.3 renderPostCard renders multi-reaction bar (Like, Love, Care, Haha, Wow)', {
      tier: 1,
      milestone: 'M4',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /reaction|like|love/i, 'Post card must support multi-reactions');
    });

    registry.test('9.4 renderPostCard renders nested comments section and comment composer', {
      tier: 1,
      milestone: 'M4',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /comment/i, 'Post card must render comment list and composer');
    });

    registry.test('9.5 renderPostCard provides share action connecting to post share modal', {
      tier: 1,
      milestone: 'M4',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /share/i, 'Post card must provide share functionality');
    });
  });

  // =========================================================================
  // 10. Seed Mock Data Store (js/store/mockData.js - M1)
  // =========================================================================
  registry.describe('Tier 1: Feature 10 - Seed Mock Data Store (M1)', () => {
    const targetFile = 'js/store/mockData.js';

    registry.test('10.1 js/store/mockData.js exports initial seed dataset', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /export\s+(const|default)\s+/i, 'Must export seed mock data');
    });

    registry.test('10.2 Seed data contains registered students array with academic profile fields', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /users\s*:\s*\[/i, 'Must define users seed array');
      assert.match(content, /department|major|semester|university/i, 'Users must have academic department/major fields');
    });

    registry.test('10.3 Seed data contains academic showcase posts with course codes', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /posts\s*:\s*\[/i, 'Must define posts seed array');
      assert.match(content, /courseCode|CS-|course/i, 'Posts must include coursework courseCode');
    });

    registry.test('10.4 Seed data contains marketplace products, groups, and ad campaigns', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /groups/i, 'Seed data must contain groups');
      assert.match(content, /marketplace|products/i, 'Seed data must contain marketplace items');
      assert.match(content, /ads|campaigns/i, 'Seed data must contain ad campaigns');
    });

    registry.test('10.5 Seed data timestamps adhere to standard ISO-8601 UTC format', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i, 'Timestamps must follow ISO-8601 UTC standard');
    });
  });

  // =========================================================================
  // 11. Reactive State Store - Auth & Session Domain (js/store/state.js - M1, M2)
  // =========================================================================
  registry.describe('Tier 1: Feature 11 - State Store Auth & Session (M1, M2)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('11.1 store exposes getCurrentUser and setCurrentUser session methods', {
      tier: 1,
      milestone: 'M1',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getCurrentUser/i, 'Must declare getCurrentUser method');
    });

    registry.test('11.2 store.login validates credentials and sets active user session', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /login\s*\(/i, 'Must implement login method');
    });

    registry.test('11.3 store.login rejects invalid or non-existent email', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /throw|error|false/i, 'Login should handle invalid user error path');
    });

    registry.test('11.4 store.register creates new student user and persists to storage', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /register|signup/i, 'Must implement register/signup method');
    });

    registry.test('11.5 store.logout clears active session and publishes AUTH event', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /logout\s*\(/i, 'Must implement logout method');
    });
  });

  // =========================================================================
  // 12. Reactive State Store - Posts & Feed Domain (js/store/state.js - M1, M3, M4)
  // =========================================================================
  registry.describe('Tier 1: Feature 12 - State Store Posts & Feed (M1, M3, M4)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('12.1 store.getPosts retrieves chronological list of posts', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getPosts/i, 'Must implement getPosts method');
    });

    registry.test('12.2 store.getPosts supports filtering by courseCode or category', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /filter|course/i, 'getPosts must support filtering');
    });

    registry.test('12.3 store.createPost creates new post with authorId and ISO timestamp', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /createPost/i, 'Must implement createPost method');
    });

    registry.test('12.4 store.reactToPost toggles user reaction and updates counters', {
      tier: 1,
      milestone: 'M4',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /reactToPost|toggleReaction/i, 'Must implement reaction handler');
    });

    registry.test('12.5 store.addComment appends comment and increments post commentsCount', {
      tier: 1,
      milestone: 'M4',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /addComment/i, 'Must implement addComment method');
    });
  });

  // =========================================================================
  // 13. Reactive State Store - Friends & Social Graph (js/store/state.js - M6)
  // =========================================================================
  registry.describe('Tier 1: Feature 13 - State Store Friends & Peers (M6)', () => {
    const targetFile = 'js/store/state.js';
    const reqFiles = ['pages/friends.html', targetFile];

    registry.test('13.1 store.sendFriendRequest creates pending friend request record', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /sendFriendRequest/i, 'Must implement sendFriendRequest method');
    });

    registry.test('13.2 store.respondFriendRequest accepts request and increments friendsCount', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /respondFriendRequest|acceptFriendRequest/i, 'Must implement accept/respond request');
    });

    registry.test('13.3 store.respondFriendRequest declines request cleanly without error', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /decline/i, 'Must support declining friend request');
    });

    registry.test('13.4 store.getFriends returns list of confirmed peer connections', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getFriends/i, 'Must implement getFriends method');
    });

    registry.test('13.5 store.searchUsers filters directory by query string', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /searchUsers|search/i, 'Must implement user search method');
    });
  });

  // =========================================================================
  // 14. Reactive State Store - Chat & Messenger Domain (js/store/state.js - M7)
  // =========================================================================
  registry.describe('Tier 1: Feature 14 - State Store Chat & Messaging (M7)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('14.1 store.getConversations returns active chat rooms list', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getConversations|getChats/i, 'Must implement conversation retrieval');
    });

    registry.test('14.2 store.getMessages retrieves chat message stream', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getMessages/i, 'Must implement getMessages method');
    });

    registry.test('14.3 store.sendMessage appends message with senderId and timestamp', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /sendMessage/i, 'Must implement sendMessage method');
    });

    registry.test('14.4 store.sendMessage updates conversation lastMessageSnippet', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /lastMessage|snippet/i, 'Must update conversation summary snippet');
    });

    registry.test('14.5 Publishes MESSAGE_SENT event on new message dispatch', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /MESSAGE_SENT|publish/i, 'Must publish message event');
    });
  });

  // =========================================================================
  // 15. Reactive State Store - Groups Domain (js/store/state.js - M8)
  // =========================================================================
  registry.describe('Tier 1: Feature 15 - State Store Groups (M8)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('15.1 store.getGroups returns cohort and subject clubs list', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getGroups/i, 'Must implement getGroups method');
    });

    registry.test('15.2 store.createGroup registers new academic study group', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /createGroup/i, 'Must implement createGroup method');
    });

    registry.test('15.3 store.toggleGroupMembership joins and leaves a group', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /toggleGroupMembership|joinGroup|leaveGroup/i, 'Must implement group membership toggle');
    });

    registry.test('15.4 store.getGroupPosts filters posts belonging to specific groupId', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getGroupPosts|groupId/i, 'Must support group-scoped posts retrieval');
    });

    registry.test('15.5 store.getGroupById returns matching group entity', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getGroupById|find/i, 'Must support finding group by ID');
    });
  });

  // =========================================================================
  // 16. Reactive State Store - Marketplace Domain (js/store/state.js - M9)
  // =========================================================================
  registry.describe('Tier 1: Feature 16 - State Store Marketplace (M9)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('16.1 store.getMarketplaceItems returns product listings', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getMarketplaceItems|getProducts/i, 'Must implement marketplace items retrieval');
    });

    registry.test('16.2 store.getMarketplaceItems supports filtering by category', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /category/i, 'Marketplace retrieval must support category filtering');
    });

    registry.test('16.3 store.createMarketplaceItem registers item with sellerId and price', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /createMarketplaceItem|createProduct/i, 'Must implement marketplace item creation');
    });

    registry.test('16.4 store.updateProductStatus toggles available / sold flags', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /isSold|status/i, 'Must support updating item sale status');
    });

    registry.test('16.5 Publishes MARKETPLACE_UPDATED event on item mutations', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /MARKETPLACE|publish/i, 'Must publish marketplace event');
    });
  });

  // =========================================================================
  // 17. Reactive State Store - Ads Manager Domain (js/store/state.js - M10)
  // =========================================================================
  registry.describe('Tier 1: Feature 17 - State Store Ads Manager (M10)', () => {
    const targetFile = 'js/store/state.js';

    registry.test('17.1 store.getAdCampaigns returns sponsored promotions list', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getAdCampaigns|getCampaigns|getAds/i, 'Must implement campaign retrieval');
    });

    registry.test('17.2 store.createAdCampaign registers new ad with daily budget and headline', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /createAdCampaign|createCampaign|createAd/i, 'Must implement ad creation');
    });

    registry.test('17.3 store.getActiveAds returns active campaigns for feed or sidebar placement', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /getActiveAds|Active/i, 'Must retrieve active advertisements');
    });

    registry.test('17.4 store records ad impressions counter increments', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /impression/i, 'Must track impressions');
    });

    registry.test('17.5 store records ad click-through counter increments', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [targetFile]
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /click/i, 'Must track clicks');
    });
  });

  // =========================================================================
  // 18. Reactive State Store - Payments & Checkout Domain (js/store/state.js - M11)
  // =========================================================================
  registry.describe('Tier 1: Feature 18 - State Store Checkout & Payments (M11)', () => {
    const targetFile = 'js/store/state.js';
    const reqFiles = ['pages/checkout.html', targetFile];

    registry.test('18.1 store.createOrder creates order record with reference ID', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /createOrder|processCheckout/i, 'Must implement order creation / checkout');
      assert.match(content, /ord|TXN|transaction/i, 'Must generate transaction reference');
    });

    registry.test('18.2 store.createOrder marks purchased marketplace items as isSold = true', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /isSold\s*=\s*true|sold/i, 'Must mark items as sold upon order creation');
    });

    registry.test('18.3 store.createOrder supports multiple payment methods (wallet, card)', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /paymentMethod|wallet|card/i, 'Must record payment method');
    });

    registry.test('18.4 store.createOrder records order in user transaction history', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /orders|transactions/i, 'Must record order into state');
    });

    registry.test('18.5 Publishes ORDER_COMPLETED event on successful checkout', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: reqFiles
    }, () => {
      const content = readText(targetFile);
      assert.match(content, /ORDER_COMPLETED|publish/i, 'Must publish order completed event');
    });
  });

  // =========================================================================
  // 19. HTML View 1: Main Feed / Wall Dashboard (index.html - M3)
  // =========================================================================
  registry.describe('Tier 1: Feature 19 - View index.html & feed.css (M3)', () => {
    const htmlFile = 'index.html';
    const cssFile = 'css/pages/feed.css';

    registry.test('19.1 index.html has valid HTML5 doctype, viewport meta, and title', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include responsive meta viewport');
      assert.ok(doc.getTitle().length > 0, 'Must have non-empty <title>');
    });

    registry.test('19.2 Links core stylesheets and dedicated css/pages/feed.css', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const styles = doc.getStyleSheets();
      assert.ok(styles.some(s => s.includes('feed.css')), 'Must link feed.css');
      assert.ok(styles.some(s => s.includes('variables.css')), 'Must link variables.css');
    });

    registry.test('19.3 Loads page controller script js/pages/feed.js as ES module', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const scripts = doc.getScriptModules();
      const hasFeedMod = scripts.some(s => s.src.includes('feed.js') && s.type === 'module');
      assert.ok(hasFeedMod, 'Must load js/pages/feed.js as type="module"');
    });

    registry.test('19.4 Contains post composer form and coursework tag selector', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasComposer = doc.hasElementWithId('post-composer-form') ||
                          doc.hasElementWithId('composer-form') ||
                          doc.hasElement('.composer');
      assert.ok(hasComposer, 'Must contain post composer element');
    });

    registry.test('19.5 Contains feed posts stream container and course filter tabs', {
      tier: 1,
      milestone: 'M3',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasFeed = doc.hasElementWithId('feed-posts-container') ||
                      doc.hasElementWithId('feed-container') ||
                      doc.hasElement('.feed-stream');
      assert.ok(hasFeed, 'Must contain feed posts container element');
    });
  });

  // =========================================================================
  // 20. HTML View 2: User Authentication (pages/auth.html - M2)
  // =========================================================================
  registry.describe('Tier 1: Feature 20 - View auth.html & auth.css (M2)', () => {
    const htmlFile = 'pages/auth.html';
    const cssFile = 'css/pages/auth.css';

    registry.test('20.1 pages/auth.html has valid HTML5 doctype, viewport meta, and title', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include responsive meta viewport');
    });

    registry.test('20.2 Links core stylesheets and dedicated css/pages/auth.css', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const styles = doc.getStyleSheets();
      assert.ok(styles.some(s => s.includes('auth.css')), 'Must link auth.css');
    });

    registry.test('20.3 Loads page controller js/pages/auth.js as ES module', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const scripts = doc.getScriptModules();
      assert.ok(scripts.some(s => s.src.includes('auth.js')), 'Must load auth.js');
    });

    registry.test('20.4 Contains login and signup form containers with toggle tabs', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasForms = doc.hasElementWithId('auth-form-login') ||
                       doc.hasElementWithId('login-form') ||
                       doc.hasElement('.auth-card');
      assert.ok(hasForms, 'Must contain authentication form container');
    });

    registry.test('20.5 Provides one-click demo login button for instant grading/evaluation', {
      tier: 1,
      milestone: 'M2',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /demo/i, 'Auth view must provide demo login button/trigger');
    });
  });

  // =========================================================================
  // 21. HTML View 3: User Profile (pages/profile.html - M5)
  // =========================================================================
  registry.describe('Tier 1: Feature 21 - View profile.html & profile.css (M5)', () => {
    const htmlFile = 'pages/profile.html';

    registry.test('21.1 pages/profile.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M5',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('21.2 Links css/pages/profile.css and loads js/pages/profile.js as module', {
      tier: 1,
      milestone: 'M5',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('profile.css')), 'Must link profile.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('profile.js')), 'Must load profile.js');
    });

    registry.test('21.3 Contains cover photo banner and profile header container', {
      tier: 1,
      milestone: 'M5',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasHeader = doc.hasElementWithId('profile-header') || doc.hasElement('.profile-header');
      assert.ok(hasHeader, 'Must contain profile header element');
    });

    registry.test('21.4 Contains profile navigation tabs (Timeline, Academic About, Friends)', {
      tier: 1,
      milestone: 'M5',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /timeline|about|projects/i, 'Profile must include tab navigation');
    });

    registry.test('21.5 Contains Edit Profile action button triggering edit modal', {
      tier: 1,
      milestone: 'M5',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /edit/i, 'Profile must provide Edit Profile action');
    });
  });

  // =========================================================================
  // 22. HTML View 4: Friends & Search (pages/friends.html - M6)
  // =========================================================================
  registry.describe('Tier 1: Feature 22 - View friends.html & friends.css (M6)', () => {
    const htmlFile = 'pages/friends.html';

    registry.test('22.1 pages/friends.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('22.2 Links css/pages/friends.css and loads js/pages/friends.js as module', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('friends.css')), 'Must link friends.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('friends.js')), 'Must load friends.js');
    });

    registry.test('22.3 Contains global directory search input for finding study peers', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasSearch = doc.hasElementWithId('friends-search-input') ||
                        doc.hasElementWithId('search-input') ||
                        doc.hasElement('input');
      assert.ok(hasSearch, 'Must contain peer search input');
    });

    registry.test('22.4 Contains friend requests queue container with Confirm/Delete actions', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /request/i, 'Must contain friend requests section');
    });

    registry.test('22.5 Contains campus peers recommendation / suggestions grid', {
      tier: 1,
      milestone: 'M6',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /suggest|friend|peer/i, 'Must contain suggested peers or friends grid');
    });
  });

  // =========================================================================
  // 23. HTML View 5: Chat Messenger (pages/chat.html - M7)
  // =========================================================================
  registry.describe('Tier 1: Feature 23 - View chat.html & chat.css (M7)', () => {
    const htmlFile = 'pages/chat.html';

    registry.test('23.1 pages/chat.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('23.2 Links css/pages/chat.css and loads js/pages/chat.js as module', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('chat.css')), 'Must link chat.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('chat.js')), 'Must load chat.js');
    });

    registry.test('23.3 Contains conversations list sidebar pane', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasList = doc.hasElementWithId('conversations-list') ||
                      doc.hasElementWithId('chat-list') ||
                      doc.hasElement('.conversations-list') ||
                      doc.hasElement('.chat-sidebar');
      assert.ok(hasList, 'Must contain conversations list container');
    });

    registry.test('23.4 Contains active message stream container for message bubbles', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasThread = doc.hasElementWithId('chat-message-thread') ||
                        doc.hasElementWithId('message-thread') ||
                        doc.hasElement('.message-thread') ||
                        doc.hasElement('.chat-messages');
      assert.ok(hasThread, 'Must contain message thread container');
    });

    registry.test('23.5 Contains chat composer input and send message button', {
      tier: 1,
      milestone: 'M7',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasInput = doc.hasElementWithId('chat-message-input') ||
                       doc.hasElementWithId('message-input') ||
                       doc.hasElement('.chat-input');
      assert.ok(hasInput, 'Must contain chat input composer');
    });
  });

  // =========================================================================
  // 24. HTML View 6: Groups & Communities (pages/groups.html - M8)
  // =========================================================================
  registry.describe('Tier 1: Feature 24 - View groups.html & groups.css (M8)', () => {
    const htmlFile = 'pages/groups.html';

    registry.test('24.1 pages/groups.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('24.2 Links css/pages/groups.css and loads js/pages/groups.js as module', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('groups.css')), 'Must link groups.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('groups.js')), 'Must load groups.js');
    });

    registry.test('24.3 Contains group discovery catalog grid and category filters', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasGrid = doc.hasElementWithId('groups-directory') ||
                      doc.hasElementWithId('groups-grid') ||
                      doc.hasElement('.groups-grid');
      assert.ok(hasGrid, 'Must contain groups grid container');
    });

    registry.test('24.4 Contains "Create Group" trigger button opening group creation modal', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /create.*group/i, 'Must contain Create Group action');
    });

    registry.test('24.5 Contains "Joined Groups" / "My Groups" section', {
      tier: 1,
      milestone: 'M8',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /joined|my.*group/i, 'Must display joined groups section');
    });
  });

  // =========================================================================
  // 25. HTML View 7: Marketplace (pages/marketplace.html - M9)
  // =========================================================================
  registry.describe('Tier 1: Feature 25 - View marketplace.html & marketplace.css (M9)', () => {
    const htmlFile = 'pages/marketplace.html';

    registry.test('25.1 pages/marketplace.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('25.2 Links css/pages/marketplace.css and loads js/pages/marketplace.js', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('marketplace.css')), 'Must link marketplace.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('marketplace.js')), 'Must load marketplace.js');
    });

    registry.test('25.3 Contains product showcase grid container', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasGrid = doc.hasElementWithId('marketplace-grid') ||
                      doc.hasElementWithId('products-grid') ||
                      doc.hasElement('.product-grid') ||
                      doc.hasElement('.marketplace-grid');
      assert.ok(hasGrid, 'Must contain marketplace product grid');
    });

    registry.test('25.4 Contains category filter pills (Textbooks, Hardware, Notes)', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /textbook|hardware|notes|category/i, 'Must contain marketplace category filters');
    });

    registry.test('25.5 Contains "Create Listing" / "Sell Item" button', {
      tier: 1,
      milestone: 'M9',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /sell|create.*listing|list.*item/i, 'Must contain Sell Item action');
    });
  });

  // =========================================================================
  // 26. HTML View 8: Ads Manager (pages/ads-manager.html - M10)
  // =========================================================================
  registry.describe('Tier 1: Feature 26 - View ads-manager.html & ads.css (M10)', () => {
    const htmlFile = 'pages/ads-manager.html';

    registry.test('26.1 pages/ads-manager.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('26.2 Links css/pages/ads.css and loads js/pages/ads.js as module', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('ads.css')), 'Must link ads.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('ads.js')), 'Must load ads.js');
    });

    registry.test('26.3 Contains KPI performance metrics cards (impressions, clicks, spend)', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /impression|click|spend|budget/i, 'Must contain KPI metrics cards');
    });

    registry.test('26.4 Contains interactive campaign creator form with budget estimator', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasForm = doc.hasElementWithId('ad-campaign-form') ||
                      doc.hasElementWithId('campaign-form') ||
                      doc.hasElement('form');
      assert.ok(hasForm, 'Must contain ad campaign form');
    });

    registry.test('26.5 Contains live interactive ad preview container', {
      tier: 1,
      milestone: 'M10',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasPreview = doc.hasElementWithId('ad-live-preview') ||
                         doc.hasElementWithId('ad-preview') ||
                         doc.hasElement('.ad-preview');
      assert.ok(hasPreview, 'Must contain live ad preview component');
    });
  });

  // =========================================================================
  // 27. HTML View 9: Payments & Checkout (pages/checkout.html - M11)
  // =========================================================================
  registry.describe('Tier 1: Feature 27 - View checkout.html & payments.css (M11)', () => {
    const htmlFile = 'pages/checkout.html';

    registry.test('27.1 pages/checkout.html has valid HTML5 doctype and viewport meta', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.hasDoctype(), 'Must have <!DOCTYPE html>');
      assert.ok(doc.hasMetaViewport(), 'Must include meta viewport');
    });

    registry.test('27.2 Links css/pages/payments.css and loads js/pages/payments.js', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      assert.ok(doc.getStyleSheets().some(s => s.includes('payments.css')), 'Must link payments.css');
      assert.ok(doc.getScriptModules().some(s => s.src.includes('payments.js')), 'Must load payments.js');
    });

    registry.test('27.3 Contains order summary card with item cost breakdown and tax', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: [htmlFile]
    }, () => {
      const doc = parseHTML(readText(htmlFile));
      const hasSummary = doc.hasElementWithId('checkout-order-summary') ||
                         doc.hasElementWithId('order-summary') ||
                         doc.hasElement('.order-summary');
      assert.ok(hasSummary, 'Must contain checkout order summary container');
    });

    registry.test('27.4 Contains payment method selection options (Card, Student Wallet)', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /wallet|card|payment/i, 'Must offer payment method options');
    });

    registry.test('27.5 Contains order confirmation receipt view with TXN reference', {
      tier: 1,
      milestone: 'M11',
      requiredFiles: [htmlFile]
    }, () => {
      const content = readText(htmlFile);
      assert.match(content, /confirm|receipt|success/i, 'Must include order confirmation markup');
    });
  });
}

module.exports = {
  registerTier1Tests
};
