/**
 * tests/e2e/helpers/harness.js
 * Comprehensive test harness supporting multi-tier categorization,
 * progressive milestone awareness, and clear terminal reporting.
 */

const fs = require('fs');
const path = require('path');

const STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  PENDING: 'PENDING',
  SKIPPED: 'SKIPPED'
};

class TestResult {
  constructor({ suite, name, status, tier = 1, milestone = 'M1', missingFiles = [], error = null, duration = 0 }) {
    this.suite = suite;
    this.name = name;
    this.status = status;
    this.tier = tier;
    this.milestone = milestone;
    this.missingFiles = missingFiles;
    this.error = error;
    this.duration = duration;
  }
}

class TestRegistry {
  constructor() {
    this.tests = [];
    this.currentSuite = 'General';
  }

  describe(suiteName, fn) {
    const prevSuite = this.currentSuite;
    this.currentSuite = suiteName;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, optionsOrFn, maybeFn) {
    let options = {};
    let fn = maybeFn;
    if (typeof optionsOrFn === 'function') {
      fn = optionsOrFn;
    } else if (typeof optionsOrFn === 'object' && optionsOrFn !== null) {
      options = optionsOrFn;
    }

    const testDef = {
      suite: this.currentSuite,
      name,
      tier: options.tier || 1,
      milestone: options.milestone || 'M1',
      requiredFiles: options.requiredFiles || [],
      tags: options.tags || [],
      fn
    };

    this.tests.push(testDef);
  }

  async run(config = {}) {
    const {
      tierFilter = null,
      milestoneFilter = null,
      strict = false,
      verbose = false,
      rootDir = process.cwd()
    } = config;

    const results = [];
    const startTime = Date.now();

    for (const t of this.tests) {
      // Check filters
      if (tierFilter !== null && t.tier !== tierFilter) {
        continue;
      }
      if (milestoneFilter !== null && t.milestone !== milestoneFilter) {
        continue;
      }

      // Check required files for progressive testability
      const missingFiles = [];
      for (const relPath of t.requiredFiles) {
        const absPath = path.isAbsolute(relPath) ? relPath : path.join(rootDir, relPath);
        if (!fs.existsSync(absPath)) {
          missingFiles.push(relPath);
        }
      }

      if (missingFiles.length > 0) {
        // Files for this milestone not yet created
        results.push(new TestResult({
          suite: t.suite,
          name: t.name,
          status: strict ? STATUS.FAIL : STATUS.PENDING,
          tier: t.tier,
          milestone: t.milestone,
          missingFiles,
          error: strict ? new Error(`Strict mode failure: missing required files: ${missingFiles.join(', ')}`) : null
        }));
        continue;
      }

      // Execute test function
      const testStart = Date.now();
      try {
        if (typeof t.fn !== 'function') {
          throw new Error('Test definition has no executable function.');
        }
        const ret = t.fn();
        if (ret && typeof ret.then === 'function') {
          await ret;
        }
        const duration = Date.now() - testStart;
        results.push(new TestResult({
          suite: t.suite,
          name: t.name,
          status: STATUS.PASS,
          tier: t.tier,
          milestone: t.milestone,
          duration
        }));
      } catch (err) {
        const duration = Date.now() - testStart;
        results.push(new TestResult({
          suite: t.suite,
          name: t.name,
          status: STATUS.FAIL,
          tier: t.tier,
          milestone: t.milestone,
          error: err,
          duration
        }));
      }
    }

    const totalDuration = Date.now() - startTime;
    return new TestRunSummary(results, totalDuration, config);
  }
}

class TestRunSummary {
  constructor(results, duration, config) {
    this.results = results;
    this.duration = duration;
    this.config = config;

    this.passed = results.filter(r => r.status === STATUS.PASS);
    this.failed = results.filter(r => r.status === STATUS.FAIL);
    this.pending = results.filter(r => r.status === STATUS.PENDING);
    this.total = results.length;
  }

  isSuccess() {
    return this.failed.length === 0;
  }

  getTierStats(tierNum) {
    const tierTests = this.results.filter(r => r.tier === tierNum);
    return {
      total: tierTests.length,
      passed: tierTests.filter(r => r.status === STATUS.PASS).length,
      failed: tierTests.filter(r => r.status === STATUS.FAIL).length,
      pending: tierTests.filter(r => r.status === STATUS.PENDING).length
    };
  }

  getMilestoneStats(milestoneName) {
    const mTests = this.results.filter(r => r.milestone === milestoneName);
    return {
      total: mTests.length,
      passed: mTests.filter(r => r.status === STATUS.PASS).length,
      failed: mTests.filter(r => r.status === STATUS.FAIL).length,
      pending: mTests.filter(r => r.status === STATUS.PENDING).length
    };
  }

  printReport() {
    const colors = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      bold: '\x1b[1m'
    };

    console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  ACADEMIC COURSEWORK SHOWCASE SOCIAL PLATFORM — E2E TEST RUNNER     ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

    // Group by suite
    const suites = {};
    for (const r of this.results) {
      if (!suites[r.suite]) suites[r.suite] = [];
      suites[r.suite].push(r);
    }

    for (const [suiteName, tests] of Object.entries(suites)) {
      console.log(`\n${colors.bold}Suite: ${suiteName}${colors.reset}`);
      for (const t of tests) {
        if (t.status === STATUS.PASS) {
          console.log(`  ${colors.green}✓ [PASS]${colors.reset} [Tier ${t.tier} | ${t.milestone}] ${t.name} ${colors.gray}(${t.duration}ms)${colors.reset}`);
        } else if (t.status === STATUS.PENDING) {
          const missing = t.missingFiles.length > 0 ? ` [Awaiting: ${t.missingFiles.join(', ')}]` : '';
          console.log(`  ${colors.yellow}○ [PENDING]${colors.reset} [Tier ${t.tier} | ${t.milestone}] ${t.name}${colors.gray}${missing}${colors.reset}`);
        } else {
          console.log(`  ${colors.red}✗ [FAIL]${colors.reset} [Tier ${t.tier} | ${t.milestone}] ${t.name} ${colors.gray}(${t.duration}ms)${colors.reset}`);
          if (t.error) {
            console.log(`      ${colors.red}Error: ${t.error.message}${colors.reset}`);
            if (t.error.actual !== undefined && t.error.expected !== undefined) {
              console.log(`      ${colors.gray}Expected: ${JSON.stringify(t.error.expected)}${colors.reset}`);
              console.log(`      ${colors.gray}Actual:   ${JSON.stringify(t.error.actual)}${colors.reset}`);
            }
          }
        }
      }
    }

    // Summary Box
    console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}SUMMARY BY TESTING TIER:${colors.reset}`);
    for (let tier = 1; tier <= 4; tier++) {
      const s = this.getTierStats(tier);
      const tierNames = [
        'Tier 1: Feature Coverage',
        'Tier 2: Boundary & Corner Cases',
        'Tier 3: Cross-Feature Interactions',
        'Tier 4: Academic Workflows & Scenarios'
      ];
      console.log(`  ${colors.bold}${tierNames[tier - 1]}:${colors.reset} Total: ${s.total} | ${colors.green}Passed: ${s.passed}${colors.reset} | ${colors.yellow}Pending: ${s.pending}${colors.reset} | ${colors.red}Failed: ${s.failed}${colors.reset}`);
    }

    console.log(`\n${colors.bold}SUMMARY BY MILESTONE:${colors.reset}`);
    const allMilestones = Array.from(new Set(this.results.map(r => r.milestone))).sort((a, b) => {
      const numA = parseInt(a.replace('M', ''), 10) || 0;
      const numB = parseInt(b.replace('M', ''), 10) || 0;
      return numA - numB;
    });

    for (const m of allMilestones) {
      const ms = this.getMilestoneStats(m);
      console.log(`  ${colors.bold}${m.padEnd(4)}:${colors.reset} Total: ${String(ms.total).padStart(2)} | ${colors.green}Passed: ${String(ms.passed).padStart(2)}${colors.reset} | ${colors.yellow}Pending: ${String(ms.pending).padStart(2)}${colors.reset} | ${colors.red}Failed: ${String(ms.failed).padStart(2)}${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
    const passColor = this.failed.length === 0 ? colors.green : colors.red;
    console.log(`${colors.bold}TOTAL EXECUTION RESULTS:${colors.reset}`);
    console.log(`  Total Test Cases: ${colors.bold}${this.total}${colors.reset}`);
    console.log(`  Passed Tests:     ${colors.green}${colors.bold}${this.passed.length}${colors.reset}`);
    console.log(`  Pending Tests:    ${colors.yellow}${colors.bold}${this.pending.length}${colors.reset} (future milestone files not yet created)`);
    console.log(`  Failed Tests:     ${colors.red}${colors.bold}${this.failed.length}${colors.reset}`);
    console.log(`  Duration:         ${this.duration}ms`);
    console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);
  }
}

const defaultRegistry = new TestRegistry();

function describe(suiteName, fn) {
  defaultRegistry.describe(suiteName, fn);
}

function test(name, optionsOrFn, maybeFn) {
  defaultRegistry.test(name, optionsOrFn, maybeFn);
}

module.exports = {
  STATUS,
  TestResult,
  TestRegistry,
  TestRunSummary,
  defaultRegistry,
  describe,
  test
};
