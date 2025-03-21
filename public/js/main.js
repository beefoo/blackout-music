import config from './config.js';
import App from './lib/App.js';
import StringHelper from './lib/StringHelper.js';

const q = StringHelper.queryParams();
const _app = new App(Object.assign({}, config, q));
