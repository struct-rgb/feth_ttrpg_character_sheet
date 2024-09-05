#!/usr/bin/env node

/**
 * This is a script that's used to determine which features (abilities/arts)
 * are option for the class data contained within this folder.
 *
 * In fish, invoke with "node optional_features.js **"
 */

/* global module */
/* global require */
/* global process */

const fs = require("node:fs");

function readNotDir(file) {
	try {
		return JSON.parse(fs.readFileSync(file, "utf8"));
	} catch (error) {
		if (error.code == "EISDIR") return null;
		throw error;
	}
}

function collectOptions(set, options) {

	for (let option of options) {
		
		if  (!(option instanceof Array)) continue;

		for (let each of option) set.add(each);

	}

}

function main(argv) {

	const abilities = new Set();
	const arts      = new Set();

	for (let file of argv) {

		if (!file.match(/^[^.]+\.json$/)) continue;
		
		const data = readNotDir(file);

		if (data == null) continue;

		collectOptions(abilities, data.abilities);
		collectOptions(arts, data.arts);

	}

	console.log({abilities, arts});
}

if (require.main == module) {
	main(process.argv.slice(2));
}

