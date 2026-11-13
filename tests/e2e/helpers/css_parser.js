/**
 * tests/e2e/helpers/css_parser.js
 * Zero-dependency CSS and design token parser for validating responsive styling.
 */

class CSSDocument {
  constructor(cssContent) {
    this.rawCss = cssContent || '';
    this.cleanCss = this._stripComments(this.rawCss);
    this.variables = this._extractVariables();
    this.mediaQueries = this._extractMediaQueries();
    this.rules = this._extractRules();
  }

  _stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  _extractVariables() {
    const vars = {
      root: {},
      dark: {}
    };

    // Root variables
    const rootMatch = /:root\s*\{([^}]+)\}/g;
    let match;
    while ((match = rootMatch.exec(this.cleanCss)) !== null) {
      const decls = match[1].split(';');
      for (const decl of decls) {
        const parts = decl.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (name.startsWith('--')) {
            vars.root[name] = val;
          }
        }
      }
    }

    // Dark theme overrides
    const darkMatch = /\[data-theme=["']?dark["']?\]\s*\{([^}]+)\}/g;
    let dMatch;
    while ((dMatch = darkMatch.exec(this.cleanCss)) !== null) {
      const decls = dMatch[1].split(';');
      for (const decl of decls) {
        const parts = decl.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (name.startsWith('--')) {
            vars.dark[name] = val;
          }
        }
      }
    }

    return vars;
  }

  _extractMediaQueries() {
    const queries = [];
    const mqRegex = /@media\s*([^{]+)\{((?:[^{}]+|\{[^{}]*\})*)\}/g;
    let match;
    while ((match = mqRegex.exec(this.cleanCss)) !== null) {
      queries.push({
        condition: match[1].trim(),
        body: match[2].trim()
      });
    }
    return queries;
  }

  _extractRules() {
    const rules = [];
    // Extract standard top-level rules
    const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(this.cleanCss)) !== null) {
      const selectors = match[1].trim().split(',').map(s => s.trim());
      const body = match[2].trim();
      const declarations = {};
      const decls = body.split(';');
      for (const decl of decls) {
        const parts = decl.split(':');
        if (parts.length >= 2) {
          const prop = parts[0].trim().toLowerCase();
          const val = parts.slice(1).join(':').trim();
          declarations[prop] = val;
        }
      }
      rules.push({ selectors, declarations, body });
    }
    return rules;
  }

  hasVariable(name) {
    return Object.prototype.hasOwnProperty.call(this.variables.root, name);
  }

  getVariable(name) {
    return this.variables.root[name] || null;
  }

  hasDarkVariable(name) {
    return Object.prototype.hasOwnProperty.call(this.variables.dark, name);
  }

  hasMediaQuery(conditionSubstr) {
    return this.mediaQueries.some(mq => mq.condition.includes(conditionSubstr));
  }

  getMediaQuery(conditionSubstr) {
    return this.mediaQueries.find(mq => mq.condition.includes(conditionSubstr)) || null;
  }

  hasSelector(selector) {
    return this.rules.some(r => r.selectors.some(s => s === selector || s.includes(selector)));
  }

  findRuleBySelector(selector) {
    return this.rules.find(r => r.selectors.some(s => s === selector || s.includes(selector))) || null;
  }

  containsText(text) {
    return this.cleanCss.includes(text);
  }

  matchesRegex(regex) {
    return regex.test(this.cleanCss);
  }
}

function parseCSS(cssContent) {
  return new CSSDocument(cssContent);
}

module.exports = {
  CSSDocument,
  parseCSS
};
