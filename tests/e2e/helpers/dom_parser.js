/**
 * tests/e2e/helpers/dom_parser.js
 * Zero-dependency HTML and DOM structure parser for validating views.
 */

class ParsedElement {
  constructor(tag, attributes = {}, rawText = '', fullTag = '') {
    this.tagName = (tag || '').toLowerCase();
    this.attributes = attributes;
    this.id = attributes.id || null;
    this.className = attributes.class || attributes.className || '';
    this.classList = this.className ? this.className.split(/\s+/).filter(Boolean) : [];
    this.rawText = rawText;
    this.fullTag = fullTag;
  }

  getAttribute(name) {
    return this.attributes[name] || this.attributes[name.toLowerCase()] || null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ||
           Object.prototype.hasOwnProperty.call(this.attributes, name.toLowerCase());
  }

  hasClass(cls) {
    return this.classList.includes(cls);
  }
}

class DOMDocument {
  constructor(htmlContent) {
    this.rawHtml = htmlContent || '';
    this.elements = [];
    this._parse();
  }

  _parse() {
    // Extract elements with opening tags and attributes
    const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
    let match;
    while ((match = tagRegex.exec(this.rawHtml)) !== null) {
      const tag = match[1];
      const attrString = match[2];
      const attributes = {};

      const attrRegex = /([a-zA-Z0-9\-:_]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2] !== undefined ? attrMatch[2] :
                        attrMatch[3] !== undefined ? attrMatch[3] :
                        attrMatch[4] !== undefined ? attrMatch[4] : '';
        attributes[attrName] = attrVal;
      }

      this.elements.push(new ParsedElement(tag, attributes, '', match[0]));
    }
  }

  hasDoctype() {
    return /<!DOCTYPE\s+html/i.test(this.rawHtml);
  }

  getTitle() {
    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(this.rawHtml);
    return match ? match[1].trim() : null;
  }

  hasMetaViewport() {
    return /<meta[^>]+name=['"]viewport['"][^>]*>/i.test(this.rawHtml) ||
           /<meta[^>]+content=[^>]+name=['"]viewport['"][^>]*>/i.test(this.rawHtml);
  }

  getElementById(id) {
    const target = id.startsWith('#') ? id.slice(1) : id;
    return this.elements.find(el => el.id === target) || null;
  }

  hasElementWithId(id) {
    return this.getElementById(id) !== null;
  }

  getElementsByClassName(className) {
    const target = className.startsWith('.') ? className.slice(1) : className;
    return this.elements.filter(el => el.hasClass(target));
  }

  getElementsByTagName(tagName) {
    const target = tagName.toLowerCase();
    return this.elements.filter(el => el.tagName === target);
  }

  getStyleSheets() {
    return this.getElementsByTagName('link')
      .filter(el => (el.getAttribute('rel') || '').toLowerCase() === 'stylesheet')
      .map(el => el.getAttribute('href'))
      .filter(Boolean);
  }

  getScriptModules() {
    return this.getElementsByTagName('script')
      .map(el => ({
        src: el.getAttribute('src'),
        type: el.getAttribute('type') || 'text/javascript'
      }))
      .filter(s => Boolean(s.src));
  }

  hasElement(selector) {
    if (selector.startsWith('#')) {
      return this.hasElementWithId(selector.slice(1));
    }
    if (selector.startsWith('.')) {
      return this.getElementsByClassName(selector.slice(1)).length > 0;
    }
    return this.getElementsByTagName(selector).length > 0;
  }

  containsText(text) {
    return this.rawHtml.includes(text);
  }

  matchesRegex(regex) {
    return regex.test(this.rawHtml);
  }
}

function parseHTML(htmlContent) {
  return new DOMDocument(htmlContent);
}

module.exports = {
  ParsedElement,
  DOMDocument,
  parseHTML
};
