function warning(message) {
  message.split('\n').forEach(function (line) {
    console.error('  Selector warning: %s', line);
  });
}

class SelectorInput {
  valid = false;
  key;
  value;
  constructor(input) {
    if (typeof input !== 'object') {
      warning(`selector not given as object： ${input}`);
      return;
    }
    this.key = input.key;
    this.value = input.value;
    this.valid = true;
  }
}

class Selector {
  valid = false;
  usedCandidates = '';
  usedFlag = false;

  name;
  selector;
  module;
  package;
  inputs = [];
  constructor(name, selector) {
    if (typeof selector !== 'object') {
      warning(`selector ${name} not given as object.`);
      return;
    }
    this.name = name;
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
    if (typeof sels !== 'object') {
      warning('selectors not given as object.');
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
}

module.exports = {
  Selectors,
};
