// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

// Build all of the example folders.
dirs = fs.readdirSync('examples');

for (var i = 0; i < dirs.length; i++) {
  var dirPath = path.join('examples', dirs[i]);
  if (!fs.lstatSync(dirPath).isDirectory()) {
    continue;
  }
  console.log('\n********');
  console.log('Building: ' + dirs[i] + '...');
  process.chdir(dirPath);
  childProcess.execSync('tsc --project .', { stdio: [0, 1, 2] });
  childProcess.execSync('webpack', { stdio: [0, 1, 2] });
  process.chdir('../..');
}
console.log('\n********\nDone building examples!');
