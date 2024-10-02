#!/usr/bin/env node

/**
 * This is a script converts old equipment definitions into item definitions
 *
 * In fish, invoke with "node to_item.js source destination"
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

function add(...args) {

	let total = 0;

	for (const arg of args) {
		
		if (typeof total == "number" && typeof arg == "number") {
			total += arg;
			continue;
		}

		if (typeof total == "number" && typeof arg != typeof total) {
			total = [total, arg];
			continue;
		}

		if (typeof total == "object") {
			total.push(arg);
			continue;
		}

		console.error(args);
		process.exit(1);
	}

	return total;
}

function convert(data) {
	return {
		"name": data.name,
		"type": "Other",
		"description": data.description,
		"requires": data.requires,
		"rank": "E",
		"price": data.price,
		"mttype": "none",
		"modifiers": {
			"mt"     : add(
				data.modifiers.str, data.modifiers.mag, data.modifiers.mt
			),
			"prot"    : data.modifiers.prot,
			"resl"    : data.modifiers.resl,
			"hit"     : add(data.modifiers.hit   , data.modifiers.dex),
			"avo"     : add(data.modifiers.avo   , data.modifiers.lck),
			"crit"    : add(data.modifiers.crit  , data.modifiers.lck),
			"cravo"   : add(data.modifiers.cravo , data.modifiers.dex),
			"minrng"  : data.modifiers.minrng,
			"maxrng"  : data.modifiers.maxrng,
			"tpcost"  : data.modifiers.tpcost,
			"spcost"  : data.modifiers.spcost,
			"doubles" : data.modifiers.spd,
			"doubled" : data.modifiers.spd,
			"tp"      : data.modifiers.tp,
			"sp"      : data.modifiers.sp,
			"hp"      : data.modifiers.hp,
			"charm"   : add(data.modifiers.dex, data.modifiers.lck),
			"mov"     : data.modifiers.mov,
		},
		"comment": data.comment,
		"tags": [
			"equipment", data.type.toLowerCase(), ...data.tags,
		],
		"hidden": data.hidden,
	};
}

function main(argv) {

	const [src, dst] = argv;
	const input      = readNotDir(src);
	const output     = convert(input);
	const string     = JSON.stringify(output, null, 2);

	console.log(output);
	fs.writeFileSync(dst, string);
}

if (require.main == module) {
	main(process.argv.slice(2));
}

