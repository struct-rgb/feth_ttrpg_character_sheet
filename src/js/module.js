/**
 * This file is the template for a module.
 * @module [module name]
 */

if (typeof require !== "undefined") {

	/* global require */

	/* eslint-disable no-global-assign */

	/* eslint-enable no-global-assign */
}

const Module = (function () {

return {};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Module;

}

/* exported Module */
