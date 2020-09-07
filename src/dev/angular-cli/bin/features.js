const logger = require('./log');

class Features {
  features = {}; // map of feature: {candidateAPIs: xxx, imports: [{}]}
  featureList = [];
  constructor(featureList) {
    if (featureList) {
      this.featureList = featureList;
    }
  }
  checkFeature(feature) {
    let newFeature = feature;
    if (feature.endsWith('R') || feature.endsWith('U')) {
      newFeature = feature.slice(0, -1);
    }
    if (
      !this.featureList.includes(feature) &&
      !this.featureList.includes(newFeature)
    ) {
      logger.warning(`Feature ${feature} is not supported!`);
    }
  }
  usedCandidate(feature, API) {
    this.checkFeature(feature);
    if (!this.features[feature]) {
      this.features[feature] = {};
    }
    if (!this.features[feature].candidateAPIs) {
      this.features[feature].candidateAPIs = '';
    }
    this.features[feature].candidateAPIs += API;
  }
  usedConfirmed(feature) {
    this.checkFeature(feature);

    if (!this.features[feature]) {
      this.features[feature] = {};
    }
    this.features[feature].usedFlag = true;
  }
  used(API) {
    for (let p in this.features) {
      const f = this.features[p];
      if (f.candidateAPIs && f.candidateAPIs.includes(API)) {
        f.usedFlag = true;
        if (!f.confirmedAPIs) {
          f.confirmedAPIs = '';
        }
        f.confirmedAPIs += API;
      }
    }
  }
  addFeatures(featuresMap) {
    for (let f in featuresMap) {
      this.checkFeature(f);

      let featureArray = featuresMap[f];
      if (!Array.isArray(featureArray)) {
        featureArray = [featureArray];
      }
      this.features[f] = {
        candidateAPIs: '',
        featureArray,
      };
    }
  }
  getUsedFeatures() {
    let featuresMap = {};
    for (let p in this.features) {
      const f = this.features[p];
      if (f.usedFlag) {
        featuresMap[p] = true;
        if (!f.confirmedAPIs) {
          continue;
        }
        if (f.confirmedAPIs.includes('U') || f.confirmedAPIs.includes('C')) {
          featuresMap[`${p}U`] = true;
        }
        if (f.confirmedAPIs.includes('L') || f.confirmedAPIs.includes('R')) {
          featuresMap[`${p}R`] = true;
        }
      }
    }
    return featuresMap;
  }
  getImports() {
    let imports = {};
    let modules = [];
    let dependencies = [];
    let featuresMap = this.getUsedFeatures();
    for (let p in featuresMap) {
      let featureArray = this.features[p].featureArray;
      if (!featureArray) {
        continue;
      }
      for (let a of featureArray) {
        if (!a.import || !a.from) {
          continue;
        }
        if (!Array.isArray(a.import)) {
          a.import = [a.import];
        }
        if (a.type === 'module') {
          modules = modules.concat(a.import);
        } else if (a.type === 'dependency') {
          dependencies = dependencies.concat(a.import);
        }
        if (!imports[a.from]) {
          imports[a.from] = [];
        }
        imports[a.from] = imports[a.from].concat(a.import);
      }
    }
    dependencies = dependencies.filter(
      (item, index) => dependencies.indexOf(item) === index
    );
    modules = modules.filter((item, index) => modules.indexOf(item) === index);
    for (let p in imports) {
      imports[p] = imports[p].filter(
        (item, index) => imports[p].indexOf(item) === index
      );
    }
    return {
      imports,
      modules,
      dependencies,
    };
  }
}

const featureList = [
  'hasDate',
  'hasRef',
  'hasEditor',
  'hasFileUpload',
  'hasEmailing',
  'hasMinNumber',
  'hasMaxNumber',
  'hasAnchorPipe',
  'hasRequiredMultiSelection',
  'hasRequiredArray',
  'hasRequiredMap',

  'hasMultiSelect',
];

const angularImports = {
  common: {
    hasMinNumberU: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
    hasMaxNumberU: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
    hasAnchorPipeR: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
    hasRequiredArrayU: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
    hasRequiredMapU: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
    hasRequiredMultiSelectionU: {
      type: 'module',
      import: 'MddsCoreModule',
      from: '@hicoder/angular-core',
    },
  },
  bootstrap: {
    hasDate: [
      {
        type: 'module',
        import: 'NgbModule',
        from: '@ng-bootstrap/ng-bootstrap',
      },
      {
        type: 'dependency',
        import: 'NgbDateParserFormatter',
        from: '@ng-bootstrap/ng-bootstrap',
      },
      {
        type: 'dependency',
        import: ['MDDS_NGB_DATE_FORMAT', 'MraNgbDateFormatterService'],
        from: '@hicoder/angular-core',
      },
    ],
    hasFileUpload: {
      type: 'module',
      import: 'FilesModule',
      from: '@hicoder/angular-file',
    },
    hasEmailingR: {
      type: 'module',
      import: 'ActionEmailModule',
      from: '@hicoder/angular-action-email',
    },
    hasEditor: {
      // MddsRichtextEditorComponent, MddsRichTextShowDirective,
      type: 'module',
      import: 'MddsRichtextEditorModule',
      from: '@hicoder/angular-richtext',
    },
  },
  angularmeterial: {
    hasMultiSelect: {
      type: 'module',
      import: 'MatChipsModule',
      from: '@angular/material/chips',
    },
    hasDate: [
      {
        type: 'module',
        import: 'NgbModule',
        from: '@ng-bootstrap/ng-bootstrap',
      },
      {
        type: 'dependency',
        import: 'NgbDateParserFormatter',
        from: '@ng-bootstrap/ng-bootstrap',
      },
      {
        type: 'dependency',
        import: ['MDDS_NGB_DATE_FORMAT', 'MraNgbDateFormatterService'],
        from: '@hicoder/angular-core',
      },
    ],
    hasFileUpload: {
      type: 'module',
      import: 'FilesModule',
      from: '@hicoder/angular-file',
    },
    hasEmailingR: {
      type: 'module',
      import: 'ActionEmailModule',
      from: '@hicoder/angular-action-email',
    },
    hasEditor: {
      // MddsRichtextEditorComponent, MddsRichTextShowDirective,
      type: 'module',
      import: 'MddsRichtextEditorModule',
      from: '@hicoder/angular-richtext',
    },
  },
};

function getNewFeatures(framework, design) {
  let imports = {};
  if (framework === 'angular') {
    imports = angularImports;
  }

  const features = new Features(featureList);
  features.addFeatures(imports.common);
  if (imports[design]) {
    features.addFeatures(imports[design]);
  }

  return features;
}

module.exports = {
  getNewFeatures,
};
