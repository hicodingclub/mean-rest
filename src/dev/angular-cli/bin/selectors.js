const logger = require('./log');
class SelectorInput {
  valid = false;
  key;
  value;
  constructor(input) {
    if (typeof input !== 'object') {
      logger.warning(`selector not given as object： ${input}`);
      return;
    }
    this.key = input.key;
    this.value = input.value;
    this.valid = true;
  }
}

class Selector {
  valid = false;
  showDisplayName = false;
  usedCandidates = '';
  usedFlag = false;

  name;
  selector;
  module;
  package;
  inputs = [];
  constructor(name, selector) {
    if (typeof selector !== 'object') {
      logger.warning(`selector ${name} not given as object.`);
      return;
    }
    this.name = name;
    this.showDisplayName = selector.showDisplayName;
    this.selector = selector.selector;
    this.module = selector.module;
    this.package = selector.package;
    if (selector.inputs) {
      for (let i of selector.inputs) {
        const input = new SelectorInput(i);
        if (input.valid) {
          this.inputs.push(input);
        }
      }
    }
    this.valid = true;
  }
  usedCandidate(API) {
    this.usedCandidates += API;
  }
  used(API) {
    if (this.usedCandidates.includes(API)) {
      this.usedFlag = true;
    }
  }
  isUsed() {
    return this.usedFlag;
  }
}

class Selectors {
  selectors = [];
  constructor(sels) {
    if (!sels) {
      return;
    }
    if (typeof sels !== 'object') {
      logger.warning(`selectors not given as object.`);
      return;
    }
    for (const s in sels) {
      if (sels.hasOwnProperty(s)) {
        const sel = new Selector(s, sels[s]);
        if (sel.valid) {
          this.selectors.push(sel);
        }
      }
    }
  }

  hasSelector(selName) {
    return this.selectors.some((x) => x.name === selName);
  }
  getSelector(selName) {
    for (let x of this.selectors) {
      if (x.name === selName) {
        return x;
      }
    }
  }
  used(API) {
    for (let x of this.selectors) {
      x.used(API);
    }
  }
  combineSelectors(selectors) {
    if (!(selectors instanceof Selectors)) {
      logger.warning(`selectors not given as instanceof Selectors`);
      return;
    }
    this.selectors = this.selectors.concat(selectors.selectors);
  }
  getImports() {
    let imports = {};
    let modules = [];

    for (let x of this.selectors) {
      if (!x.module || !x.package) {
        continue;
      }
      if (!x.isUsed()) {
        continue;
      }
      if (!imports[x.package]) {
        imports[x.package] = [];
      }
      imports[x.package].push(x.module);
      modules.push(x.module);
    }
    modules = modules.filter((item, index) => modules.indexOf(item) === index);
    for (let p in imports) {
      imports[p] = imports[p].filter(
        (item, index) => imports[p].indexOf(item) === index
      );
    }
    return {
      imports,
      modules,
    };
  }
}

module.exports = {
  Selectors,
};
