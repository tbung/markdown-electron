// NOTE: This must remain ES5 code.
var path = require('path');
var appRoot = path.join(__dirname);
require('electron-compile').init(appRoot, './src/main');
