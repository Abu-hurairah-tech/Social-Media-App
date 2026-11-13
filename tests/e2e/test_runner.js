#!/usr/bin/env node
/**
 * tests/e2e/test_runner.js
 * Master E2E Test Runner for the Academic Coursework Showcase Social Media Web Application.
 *
 * Usage:
 *   node tests/e2e/test_runner.js
 *   node tests/e2e/test_runner.js --tier 1
 *   node tests/e2e/test_runner.js --milestone M1
 *   node tests/e2e/test_runner.js --strict
 *   node tests/e2e/test_runner.js --verbose
 */

const path = require('path');
const { defaultRegistry } = require('./helpers/harness.js');
const { registerTier1Tests } = require('./tier1_features.test.js');
const { registerTier2Tests } = require('./tier2_boundaries.test.js');
const { registerTier3Tests } = require('./tier3_interactions.test.js');
const { registerTier4Tests } = require('./tier4_scenarios.test.js');

function parseArgs(args) {
  const config = {
    tierFilter: null,
    milestoneFilter: null,
    strict: false,
    verbose: false,
    rootDir: path.resolve(__dirname, '../..')
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tier' && args[i + 1]) {
      config.tierFilter = parseInt(args[++i], 10);
    } else if (arg === '--milestone' && args[i + 1]) {
      config.milestoneFilter = args[++i].toUpperCase();
    } else if (arg === '--strict') {
      config.strict = true;
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Academic Coursework Showcase E2E Test Runner

Options:
  --tier <1-4>        Run only tests belonging to a specific tier:
                        1: Feature Coverage (all views, components, CSS, store, git)
                        2: Boundary & Corner Cases (storage recovery, inputs, responsive)
                        3: Cross-Feature Interactions (pairwise user flows)
                        4: Real-world Academic Scenarios (end-to-end coursework lifecycle)
  --milestone <M0-M12> Filter tests for a specific milestone (e.g. --milestone M1)
  --strict            Treat pending/missing milestone files as failures (Release mode)
  --verbose           Display verbose execution diagnostics
  --help, -h          Show this help message
`);
      process.exit(0);
    }
  }
  return config;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));

  // Register all 4 tiers
  registerTier1Tests(defaultRegistry, config.rootDir);
  registerTier2Tests(defaultRegistry, config.rootDir);
  registerTier3Tests(defaultRegistry, config.rootDir);
  registerTier4Tests(defaultRegistry, config.rootDir);

  // Run the full test harness
  const summary = await defaultRegistry.run(config);
  summary.printReport();

  if (!summary.isSuccess()) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error executing test runner:', err);
    process.exit(1);
  });
}

module.exports = {
  main,
  parseArgs
};
