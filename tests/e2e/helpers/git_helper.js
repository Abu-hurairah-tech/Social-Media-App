/**
 * tests/e2e/helpers/git_helper.js
 * Inspects Git branch topology, merge commit types, tags, and working directory state.
 */

const { execSync } = require('child_process');

class GitHelper {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  _exec(command) {
    try {
      return execSync(command, { cwd: this.cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err) {
      return '';
    }
  }

  getCurrentBranch() {
    return this._exec('git rev-parse --abbrev-ref HEAD');
  }

  getAllBranches() {
    const raw = this._exec('git branch -a');
    if (!raw) return [];
    return raw
      .split('\n')
      .map(line => line.replace(/^[* ]\s*/, '').trim())
      .filter(Boolean);
  }

  hasBranch(branchName) {
    const branches = this.getAllBranches();
    const cleanTarget = branchName.replace(/^refs\/heads\//, '').replace(/^origin\//, '');
    return branches.some(b => {
      const cleanB = b.replace(/^remotes\/origin\//, '').replace(/^origin\//, '');
      return cleanB === cleanTarget;
    });
  }

  getCommitLog(maxCount = 100) {
    // Format: Hash|Subject|ParentHashes
    const raw = this._exec(`git log -n ${maxCount} --format="%H|%s|%P"`);
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|');
      const hash = parts[0] || '';
      const subject = parts[1] || '';
      const parents = (parts[2] || '').split(' ').filter(Boolean);
      return {
        hash,
        subject,
        parents,
        isMergeCommit: parents.length >= 2
      };
    });
  }

  getMergeCommits() {
    return this.getCommitLog().filter(c => c.isMergeCommit);
  }

  hasNoFfMerge(branchKeyword, targetKeyword = 'develop') {
    const merges = this.getMergeCommits();
    return merges.some(m => {
      const lowerSubject = m.subject.toLowerCase();
      const hasBranch = lowerSubject.includes(branchKeyword.toLowerCase());
      const hasTarget = targetKeyword ? lowerSubject.includes(targetKeyword.toLowerCase()) : true;
      return hasBranch && hasTarget;
    });
  }

  getTags() {
    const raw = this._exec('git tag -l');
    if (!raw) return [];
    return raw.split('\n').map(t => t.trim()).filter(Boolean);
  }

  hasTag(tagName) {
    return this.getTags().includes(tagName);
  }

  getTagCommit(tagName) {
    return this._exec(`git rev-list -n 1 ${tagName}`);
  }

  isWorkingTreeClean() {
    const status = this._exec('git status --porcelain');
    // Ignore .agents directory if untracked
    const nonAgentChanges = status
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes('.agents/'));
    return nonAgentChanges.length === 0;
  }
}

module.exports = {
  GitHelper
};
