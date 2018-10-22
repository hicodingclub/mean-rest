1. npm install
  Development dependencies will be installed. It has peerDependencies to @angular stuff.

2. npm run build
  A /lib directory is generated with the ts files compiled to .js files

3. npm run package
  A /dist directroy is generated. This uses ng-packagr to build the angular packages


4. 
cd dist
npm publish
  This will publish the package.json and bundle/*.* to npm
