#!/usr/bin/env node

/* global module */
/* global require */

let vimode = false;

var gCompiler = null; // TODO REMOVE THIS HACK
let cCompiler = null;
let rCompiler = null;
let mCompiler = null;

const fs             = require("node:fs");
const process        = require("node:process");
const {
	Grade, isObject
}                    = require("./src/js/common.js");
const Reminder       = require("./src/js/context/reminder.js");
const Requirements   = require("./src/js/context/requirements.js");
const Compatible     = require("./src/js/context/compatible.js");
const Markup         = require("./src/js/lang/markup.js");
const Calculator     = require("./src/js/lang/calculator.js");
const Polish         = require("./src/js/lang/polish.js");
const Presetter      = require("./src/js/presetter.js");

const Color = {
	Reset      : "\x1b[0m",
	Bright     : "\x1b[1m",
	Dim        : "\x1b[2m",
	Underscore : "\x1b[4m",
	Blink      : "\x1b[5m",
	Reverse    : "\x1b[7m",
	Hidden     : "\x1b[8m",

	FgBlack    : "\x1b[30m",
	FgRed      : "\x1b[31m",
	FgGreen    : "\x1b[32m",
	FgYellow   : "\x1b[33m",
	FgBlue     : "\x1b[34m",
	FgMagenta  : "\x1b[35m",
	FgCyan     : "\x1b[36m",
	FgWhite    : "\x1b[37m",
	FgGray     : "\x1b[90m",

	BgBlack    : "\x1b[40m",
	BgRed      : "\x1b[41m",
	BgGreen    : "\x1b[42m",
	BgYellow   : "\x1b[43m",
	BgBlue     : "\x1b[44m",
	BgMagenta  : "\x1b[45m",
	BgCyan     : "\x1b[46m",
	BgWhite    : "\x1b[47m",
	BgGray     : "\x1b[100m",

	enable     : true,

	key(object) {
		const quoted = JSON.stringify(object);
		if (Color.enable) return `${Color.FgYellow}${quoted}${Color.Reset}`;
		return quoted;
	},

	value(object) {
		const quoted = JSON.stringify(object);
		if (Color.enable) return `${Color.FgGreen}${quoted}${Color.Reset}`;
		return quoted;
	},

	dimmed(object) {
		if (Color.enable) return `${Color.Dim}${object}${Color.Reset}`;
		return object;
	},

	bright(object) {
		if (Color.enable) return `${Color.Bright}${object}${Color.Reset}`;
		return object;
	},

	expected(object) {
		if (Color.enable) return `${Color.FgGreen}${object}${Color.Reset}`;
		return object;
	},

	num(object) {
		if (Color.enable) return `${Color.FgRed}${object}${Color.Reset}`;
		return object;
	}
};

function inside(kind, key) {
	return `inside ${Color.expected(kind)} for key ${Color.key(key)}:`;
}

const TIER_ORDER = {
	"Starting" : 1,
	"Advanced" : 2,
	"Phantom"  : 3,
	"Bonus"    : 4,
};

const SKILL_ORDER = {
	"Axes"     : 0,
	"Lances"   : 1,
	"Swords"   : 2,
	"Bows"     : 3,
	"Brawl"    : 4,
	"Faith"    : 5,
	"Guile"    : 6,
	"Reason"   : 7,
	"Other"    : 8,
};

const RANK_ORDER = {
	"S+" : 12,
	"S"  : 11,
	"A+" : 10,
	"A"  :  9,
	"B+" :  8,
	"B"  :  7,
	"B-C":  6,
	"C+" :  5,
	"C"  :  4,
	"D+" :  3,
	"D"  :  2,
	"E+" :  1, 
	"E"  :  0,
};

const OVERMAX_RANK = 13;

function keyGet(object, key, def) {
	return key in object ? object[key] : def;
}

function compare(a, b) {

	const typeA = a instanceof Array;
	const typeB = b instanceof Array;

	if (typeA && typeB) {
		// element by element comparison as far as possible
		const last = Math.min(a.length, b.length);

		for (let i = 0; i < last; ++i) {
			// use recursive comparison
			const result = compare(a[i], b[i]);
			// if nonzero return that value
			if (result != 0) return result;
		}

		return 0;
	}

	if (typeA || typeB) {
		// comparison between array and primative not defined
		throw Error(`cannot compare ${typeof a} and ${typeof b}`);
	}

	if (a < b) return -1;
	if (a > b) return +1;
	return 0;
}

function keyLookup(cache, func, key) {
	return (
		cache.has(key)
			? cache
			: cache.set(key, func(key))
	).get(key);
}	

function keySorted(iterable, func=(x => x), reverse=false) {

	// create a copy of the input
	const copy   = Array.from(iterable);

	// prepare the cache and comparison functions
	const cache  = new Map();
	const lookup = (key)  => keyLookup(cache, func, key);
	const check  = (a, b) => compare(lookup(a), lookup(b));
	return copy.sort(check);
}

const SORTING = {
	
	adjutants(item) {
		return [
			!item.tags.includes("first")
		];
	},

	presets(item) {
		return [
			!item.tags.includes("first"),
			keyGet(TIER_ORDER, item.tier, 1000),
			keySorted(item.type).join(""),
			item.name,
		];
	},

	classes(item) {
		return [
			!item.tags.includes("first"),
			keyGet(TIER_ORDER, item.tier, 1000),
			keySorted(item.type).join(""),
			item.name,
		];
	},

	gambits(item) {
		return [
			!item.tags.includes("first"),
			!item.name.includes("Training"),
			!item.name.includes("Outfitting"),
			keyGet(RANK_ORDER, item.rank, OVERMAX_RANK),
			item.name,
		];
	},

	battalions(item) {
		return [
			item.tags.includes("first"),
			item.name,
		];
	},

	items(item) {
		return [
			item.tags.includes("first"),
			keyGet(SKILL_ORDER, item.type, 8),
			item.tags.includes("custom"),
			item.tags.includes("secret"),
			item.tags.includes("relic"),
			item.tags.includes("sacred"),
			keyGet(RANK_ORDER, item.rank, OVERMAX_RANK),
		]; 
	},

	arts(item) {
		return [
			item.tags.includes("first"),
			item.type instanceof Array
				? 8
				: keyGet(SKILL_ORDER, item.type, 8),
			item.tags.includes("relic"),
			item.tags.includes("sacred"),
			keyGet(RANK_ORDER, item.rank, OVERMAX_RANK),
		];
	},

	abilities(item) {
		return [
			item.tags.includes(item.tags),
			item.name,
		];
	},

	attributes(item) {
		return [
			item.tags.includes("first"),
			item.name,
		];
	},

	conditions(item) {
		return [
			item.name,
		];
	},

	tiles(item) {
		return [
			item.name,
		];
	},

	equipment(item) {
		return [
			item.type,
			item.name,
		];
	}
};

function indent(text, level=1) {

	// if (text != "") console.log(level, text);

	const padding = Color.dimmed("| ".repeat(level));

	if (typeof text == "string")
		return `${padding}${text}`;

	return text.map(each => `${padding}${each}`);
}

const short = false;

function got(expect, key, actual) {
	const quoteKey    = key ? `type of ${Color.key(key)}: ` : "";
	const quoteActual = Color.value(actual);
	const quoteExpect = Color.expected(short ? "<expected>" : expect);
	// return [`expected ${quoteExpect}${quoteKey} but got: ${quoteActual}`];
	return [`${quoteKey}${quoteExpect} expected but found ${quoteActual}`];
}

function checkArray(key, array, depth, callback) {

	// make sure we were given an array
	if (!Array.isArray(array))
		return indent(got("array", key, array), depth);

	const errors = [];
	const keyed  = Number(key != null);

	// check each element for any errors and collect the messages
	for (let i = 0; i < array.length; ++i) {

		const lines = callback(i, array[i], depth + keyed + 1);
		if (lines.length == 0) continue;

		const index = `at index ${Color.key(i)}`;
		errors.extend(indent(index, depth + keyed), ...lines);
	}

	// there is a key and errors prefix the key location
	if (keyed && errors.length) {
		return [indent(inside("array", key), depth), ...errors];
	}

	// otherwise return the array as it is
	return errors;
}

// function wrapIterable(set, indent) {

// 	const line  = [];
// 	const lines = [];
// 	const width = process.env.columns ?? 80;
// 	let   used  = width;	

// 	for (let each of set) {
// 		if (used > each.length + 2) {
// 			lines.push(line.join(", "));
// 			used = indent.length + each.length;
// 		}
// 	}

// 	return 
// }
class Enum {

	constructor(name, iterable) {
		this.name = name;
		this.set  = new Set(iterable);
		this.seen = new Set();
	}

	toString(expand=false) {
		return this.name;
	}

	check(key, actual, expand=false) {
		if(!(typeof actual == "string" && this.set.has(actual))) {
			return got(this.toString(expand), key, actual);
		}
		return [];
	}

	checkList(key, actual, depth=0, flags={}) {

		const base     = depth;

		// how deep are we allowed to nest arrays?
		const maxdepth = Number  (flags.maxdepth ?? 1);
		// is a bare string (no enclosing array) valid?
		const string   = Boolean (maxdepth <= 0  || (flags.string ?? false));
		// TODO see if we want to keep this arround
		const expand   = Boolean (flags.expand   ?? false);
		// are duplicate values allowed or do we force uniqueness?
		const unique   = Boolean (flags.unique   ?? true);
		// is a top level empty array allowed? TODO make kwarg if needed
		const filled   = string;

		// if bare strings are allowed test for that before anything else
		if (string && typeof actual == "string")
			return this.check(key, actual, expand);

		// if arrays are forbidden then this is an error since it's no string
		if (maxdepth <= 0)
			return this.errorType(0, key, actual, depth);

		// arrays are allowed and it's not a string; make sure it's an array
		if (!Array.isArray(actual))
			return this.errorType(string ? 1 : 2, key, actual, depth);
		
		// it the array is required to have at least one item make sure it does
		if (filled && actual.length == 0)
			return this.errorEmpty(key, depth);

		// if strings must be unique we need to clear this for use
		if (unique) this.seen.clear();
		
		const check = (i, item, depth) => {

			// we need to validate this array element (item)

			// handle validation in the string case
			if (typeof item == "string") {

				// duplicates items are an error when enforcing uniqueness
				if (unique && this.seen.has(item))
					return this.errorUnique(item, depth);

				// check if the string is valid for this enum
				const error = this.check("", item, expand);
				if (error.length) return indent(error, depth);

				// record that we've seen this item if enforcing uniqueness
				if (unique) this.seen.add(item);
				return [];
			}

			// have we hit the deepest allowed layer of array nesting?
			
			const bottom = maxdepth < (depth - base);

			// handle validation in the array case
			if (Array.isArray(item)) {
				
				// have we hit the deepested level of permitted nesting?
				if (bottom)
					return this.errorMaxDepth(maxdepth, depth);

				// have we encountered an empty array?
				if (item.length == 0)
					return this.errorEmpty(null, depth);

				return checkArray(null, item, depth, check);
			}
			
			// item was not a valid type
			return this.errorType(bottom ? 0 : 1, null, item, depth);
		};

		return checkArray(key, actual, depth, check);
	}

	errorUnique(actual, depth) {
		return indent([`item ${Color.value(actual)} is a duplicate`], depth);
	}

	errorEmpty(key, depth) {
		const quoteKey = key ? `type of ${Color.key(key)}: ` : "";
		return indent([`${quoteKey}empty arrays are not permitted`], depth);
	}

	errorType(type, key, actual, depth) {
		const prefix   = ["", "(array of) ", "array of "][type];
		const expected = `${prefix}${this.name}`;
		return indent(got(expected, key, actual), depth);
	}

	errorMaxDepth(maxdepth, depth) {
		const message = [`nesting exceeds max depth of ${Color.num(maxdepth)}`];
		return indent(message, depth);
	}
} 

const KITS  = new Enum("kit", Object.keys(Presetter.KITS));

const TIERS = new Enum("tier", [
	"Starting", "Advanced", "Bonus", "Phantom", "Monster", "Other"
]);

const MTTYPE = new Enum("mttype", ["str", "mag", "else", "none"]);

const RANK   = new Enum("rank", Grade.list.map(grade => grade.name));

let definitions = null, ClassNameSet = null;

const PresetSet = new Enum("preset", Presetter.generate_presets().map(preset => preset.name));

let SkillSet = null, AbilitySet = null, ArtsSet = null;

const TYPES = new Enum("class type", ["Armor", "Flying", "Cavalry", "Infantry", "Monster", "Morph", "Dragon"]);

function checkCompile(key, compiler, source, types) {

	// account for custom error message (calculator accepts number)
	types = types ?? "string or array of strings";

	// array of strings is a means to break up lines so account for that
	if (Array.isArray(source) && source.all(s => typeof s == "string"))
		source = source.join("\n");

	// received invalid source type; return an error
	if (typeof source != "string")
		return [`type of ${Color.key(key)}: expected ${types}`];

	try {
		// attempt to compile; failure will throw some CompilationError
		compiler.compile(source);
	} catch (error) {
		if (!(error instanceof compiler.throws)) {
			throw error;
		}
		const ctx = errorContext(source, ...error.at(source), error.message, 3);
		return [`compile ${Color.key(key)}:`, ...indent(ctx.split("\n"), 1)];
	}

	return [];
}

function checkLocals(compiler, templates, local, depth=1) { // TODO marker

	if (templates == null) return null;

	const locals = new Set();
	const key    = local == "locals" ? "locals" : local;
	const method = local == "locals" ? "local"  : "template";
	const errors = checkArray(key, templates, depth, (i, source, depth) => {

		if (Array.isArray(source) && source.all(s => typeof s == "string"))
			source = source.join("\n");

		if (typeof source != "string")
			return indent(["expected string or array of strings"], depth);

		try {
			// compiler.createLocal(source);
			locals.add(compiler[method](source));
		} catch (error) {
			if (!(error instanceof gCompiler.throws)) {
				throw error;
			}
			const ctx = errorContext(source, ...error.at(source), error.message, 3);
			return indent([...indent(ctx.split("\n"), 1)], depth);
		}

		return [];
	});

	return errors.length ? errors : locals;
}

function noKeyValue(key, value, depth=0) {
	const message = `missing ${Color.key(key)}: ${Color.expected(value)}`;
	return [indent(message, depth)];
}

const TypeCheck = {

	"tags": function (key, actual, depth) {

		const seen  = new Set();

		return checkArray(key, actual, depth, (i, item, depth) => {

			if (!(typeof item == "string"))
				// return indent([`expected ${Color.expected("string")}`], depth);
				return indent(got("string", null, item), depth);

			if (seen.has(item))
				return indent([`item ${Color.value(item)} is a duplicate`], depth);

			seen.add(item);
			return [];
		});
	},

	"rank": function (key, actual, depth) {
		return indent(RANK.check(key, actual), depth);
	},

	"mttype": function (key, actual, depth) {
		return indent(MTTYPE.check(key, actual), depth);
	},

	"classtier": function(key, actual, depth) {
		return indent(TIERS.check(key, actual), depth);
	},

	"markup": function (key, actual, depth) {
		return indent(checkCompile(key, mCompiler, actual), depth);
	},

	"calculator": function (key, value, depth) {
		// a number is always good an need nothing more
		if (typeof value == "number") return [];

		const types = "number, string, or array of strings";
		return indent(checkCompile(key, gCompiler, value, types), depth);
	},

	"requires": function (key, value, depth) {
		return indent(checkCompile(key, rCompiler, value), depth);
	},

	"compatible": function (key, value, depth) {
		return indent(checkCompile(key, cCompiler, value), depth);
	},

	"rows": function (key, actual, depth) { 
		return checkArray(key, actual, depth, (i, row, depth) => {

			const errors = [];

			// name is optional, so if it's not there don't check it
			if ("name" in row) errors.extend(
				...checkType("name", "string", row.name, depth)
			);

			// expr is also not optional so it's an error if missing
			if (!("expr" in row)) {
				errors.push(noKeyValue("expr", "calculator", depth));
			} else {
				errors.extend(...checkType("expr", "calculator", row.expr, depth));
			}

			// when is optional, so if it's not there, don't check it
			if ("when" in row) errors.extend(
				...checkType("when", "calculator", row.when, depth)
			);

			// roll is optional, so if it's not there, don't check it
			if ("roll" in row) errors.extend(
				...checkType("roll", "boolean", row.roll, depth)
			);

			if (errors.length > 0) return errors;
			return errors;
		});
	},

	"classname": function (key, actual, depth) {

		if (ClassNameSet == null) {
			ClassNameSet = new Enum("class nam", definitions.classes.map(cls => cls.name));
		}

		return indent(ClassNameSet.check(key, actual, depth), depth);
	},

	"preset": function (key, actual, depth) {
		return indent(PresetSet.check(key, actual, depth), depth);
	},

	"skill": function (key, actual, depth) {
		
		if (SkillSet == null) {
			// TODO remove Morph once it gets added for real
			SkillSet = new Enum("skill", definitions.skills.concat(["Other", "Morph", "Generic"]));
		}

		return SkillSet.checkList(key, actual, depth, {string: true});
	},

	// TODO test this one
	"kits" : function (key, actual, depth) {
		return KITS.checkList(key, actual, depth,
			{string: true, maxdepth: 2, unique: false}
		);
	},

	"classtype" : function (key, actual, depth) {
		return TYPES.checkList(key, actual, depth);
	},

	"abilities" : function (key, actual, depth) {

		if (AbilitySet == null) {
			AbilitySet = new Enum("ability", definitions.abilities.map(a => a.name));
		}

		return AbilitySet.checkList(key, actual, depth, {maxdepth: 2});
	},

	"arts" : function (key, actual, depth) {

		if (ArtsSet == null) {
			ArtsSet = new Enum("art", definitions.arts.map(a => a.name));
		}

		return ArtsSet.checkList(key, actual, depth, {maxdepth: 2});
	},

	"pass" : function (key, actual, depth) {
		return [];
	}

};

function checkType(key, expected, actual, depth) {

	// check for recursive objects first
	if (isObject(expected))
		return isObject(actual) || actual == null ? [] : [`expected object for \`${key}`];

	if (typeof expected != "string")
		return [];

	// check one of our custom types
	if (expected in TypeCheck)
		return TypeCheck[expected](key, actual, depth);

	// built-in javascript/json types
	const builtin = new Set(["string", "boolean", "number"]);
	if (!builtin.has(typeof actual) && typeof actual != expected)
		return indent(got(expected, key, actual), depth);

	return [];
}

function exitWith(file, message, code) {
	
	if (vimode) {
		const errorFile = ".build_error.txt";
		fs.writeFileSync(errorFile, message);
		console.log(["-O", file, errorFile].join(vimode));
	} else {
		console.error(Color.Reset, message);
	}

	process.exit(code);
}

const tSeen = new Set();
const iSeen = new Set();

function checkTemplate(template, instance, depth=1) {

	const result = checkLocals(gCompiler, instance.locals, "locals", depth); // TODO marker
	const errors = result instanceof Array ? result : [];
	const locals = result instanceof Set   ? result : null;

	for (let [tKey, value] of Object.entries(template)) {

		///////////////////////////
		// HANDLE DIRECTIVE KEYS //
		///////////////////////////

		// keys that match this pattern are directives (unimplemented)
		const directive = tKey.match(/^@(.*)$/);
		if (directive) continue;

		// keys that match this pattern are optional
		const optional = tKey.match(/^\?(.*)$/);
		const iKey     = optional ? optional[1] : tKey;

		//////////////////////////////
		// KEY EXISTANCE VALIDATION //
		//////////////////////////////

		// check for missing key value pairs
		if (!(iKey in instance)) {
			if (optional) continue;
			const type = isObject(value) ? "object" : template[tKey];
			errors.push(noKeyValue(iKey, type, depth));
			continue;
		}

		///////////////////////////
		// TYPE CHECK VALIDATION //
		///////////////////////////

		errors.extend(
			...checkType(iKey, template[tKey], instance[iKey], depth)
		);

		tSeen.add(tKey); // TODO remove
		
		//////////////////////////////
		// NESTED OBJECT VALIDATION //
		//////////////////////////////

		// if the value isn't a nested object then we're done with this
		if (!isObject(value)) continue;

		// null is technically an object but we can't recursively check it
		// if (instance[iKey] == null) continue;
		if (!isObject(instance[iKey]))
			return indent(got("object", iKey, instance[iKey]), depth); 

		// recursively check the structure of the nested object
		const recurse = checkTemplate(template[tKey], instance[iKey], depth + 1);
		if (recurse.length == 0) continue;

		// add in an indication of under which key the errors occured
		errors.extend(indent(inside("object", iKey), depth), ...recurse);
	}

	// TODO remove
	for (let [key, _value] of Object.entries(instance)) {
		if (tSeen.has(key) || tSeen.has(`?${key}`)) continue;
		iSeen.add(key);
	}

	gCompiler.deleteLocals(locals);

	return errors;
}

function errorTemplate(source, template, instance) {
	
	const errors  = checkTemplate(template, instance);

	if (errors.length) {
		const quote = Color.key(source);
		return `Error loading: ${quote}\n${errors.join("\n")}`;
	}

	return "";
}

function errorContext(data, row, column, message="", context=1) {

	const lines  = data.split("\n");
	const colno  = Number(column);
	const center = Number(row) - 1;
	const start  = Math.max(center - context, 0);
	const stop   = Math.min(center + context, lines.length - 1);
	const indent = String(stop).length + 1;
	const text   = [];

	text.push(
		`${message} (line ${Color.num(row)} column ${Color.num(colno + 1)})`
	);

	for (let i = start; i <= stop; ++i) {
		const lineno = String(i + 1);
		const blank  = " ".repeat(indent - lineno.length);
		text.push(`${blank}${Color.dimmed(lineno)} ${lines[i]}`);
		if (i == center) {
			text.push(Color.dimmed(`${"-".repeat(indent + colno + 1)}^`));
		}
	}
	
	return text.join("\n");
}

function jsonCheckLoad(file) {

	let data = undefined;

	try {
		data = fs.readFileSync(file, "utf8");
	} catch (error) {
		exitWith(file, `Error Loading: ${Color.key(file)}\n`, 1);
	}

	try {
		data = JSON.parse(data);
	} catch (error) {

		const out = [`Error loading: ${Color.key(file)}`];

		if (error.message.includes("Unexpected token")) {
			out.push(indent("Ensure that file uses utf8 encoding", 1));
			out.push(indent(error.message, 1));
		}

		if (error.message.includes("line")) {
			const pattern   = / \(line (\d+) column (\d+)\)/;
			const [_, r, c] = error.message.match(pattern);
			const message   = error.message.replace(pattern, "");
			const context   = errorContext(data, r, c, message, 3);
			out.extend(...indent(context.split("\n")));
		}

		exitWith(file, out.join("\n"), 1);
	}

	return data;
}

function loadDefinitions(tbase, compiled, omit) {

	const verify     = [];
	const namespaces = fs.readdirSync(tbase, {withFileTypes: true});

	// compile all of the data into a monolithic file
	for (let namespace of namespaces) {

		// we want every folder except the templates
		if (!namespace.isDirectory() || namespace.name == "templates")
			continue;

		const definitions = [];
		const template    = jsonCheckLoad(
			`${tbase}/templates/${namespace.name}.json`
		);

		const folder      = `${tbase}/${namespace.name}`;
		const options     = {withFileTypes: true, recursive: true};

		for (let instance of fs.readdirSync(folder, options)) {

			if (instance.isDirectory()) continue;

			const path = `${instance.parentPath}/${instance.name}`;
			const data = jsonCheckLoad(path);

			// omit files flagged for it
			if (omit && ("omit" in data) && data["omit"])
				continue;

			// skip this stage for presets because they're too complex
			if (instance.name != "presets") {

				// save these for later once we've loaded everything
				verify.push([path, template, data]);
			}

			// success
			definitions.push(data);
		}

		compiled[namespace.name] = definitions;
	}

	// load the paths to all of the image resources
	const icons = {};
	const rbase = "./resources/icons";

	for (let each of ["item", "type", "effective", "portraits"]) {
		const path      = `${rbase}/${each}`;
		const directory = fs.readdirSync(path);
		icons[each]     = keySorted(directory.map(file => `${path}/${file}`));
	}

	function keyForPortrait(path) {
		const base  = path.split(/[./]/).at(-2);
		const match = base.match(/^((?:\w+ ?)+)(?:\((\d+)\))?$/);
		if (!match) throw Error(`Couldn't parse portrait filename ${base}`);
		return [match[1], Number(match[2] || 0)];
	}

	icons.portraits = keySorted(icons.portraits, keyForPortrait);
	compiled.icons  = icons;

	return verify;
}

function checkPrefabTooltips(compiled) {
	
	const errors   = [];
	const template = {name:"string", description: "markup"}; 
	const tooltips = compiled.tooltips;

	for (let key in tooltips) {
		const issue = checkTemplate(template, tooltips[key], 3);
		if (issue.length == 0) continue;
		errors.extend(indent(inside("object", key), 2), ...issue);
	}

	return errors;
}

// TODO make something that properly checks template definitions
// function checkPrefabMacros(compiled) {

// 	const macros = compiled.macros;

// 	return checkArray("macros", macros, 1, (index, element, depth) => {
// 		if ()
// 	});
// }

function checkDefinitions(tbase, compiled, verify) {

	// TODO this is a hack, find a better way
	const rContext    = Requirements.createContext({}, {}, compiled);
	const cContext    = Compatible.createContext({}, compiled);
	definitions = compiled;

	// TODO this is a hack, find a better way
	gCompiler    = new Calculator.Compiler({}, {});

	const define = compiled.macros.map(each => each.define);
	const locals = checkLocals(gCompiler, define, "macros");

	if (locals instanceof Array) {
		const file  = `${tbase}/definitions.json`;
		const error = `Error loading: ${Color.key(file)}\n${locals.join("\n")}`;
		exitWith(file, error, 1);
	}

	rCompiler = new Polish.Compiler(rContext);
	cCompiler = new Polish.Compiler(cContext);
	mCompiler = new Markup.Compiler(Reminder.getNamespace(compiled));

	const prefabs = checkPrefabTooltips(compiled);

	if (prefabs.length) {

		const file   = `${tbase}/definitions.json`;
		const head   = indent(inside("object", "tooltips"), 1);
		const error  = `Error loading: ${Color.key(file)}\n${head}\n${prefabs.join("\n")}`;
		exitWith(file, error, 1);
	}

	// verify the file; must be the second step so we can check references
	for (let args of verify) {
		// second, check structure of the file read in
		const errors = errorTemplate(...args);
		if (errors) exitWith(args[0], errors, 2);
	}

	console.log(iSeen);
}

function sortDefinitions(definitions) {
	for (let name in definitions) {
		if (!(name in SORTING)) continue;
		definitions[name] = keySorted(definitions[name], SORTING[name]);
	}
}

function compileDefinitions(omit=false) {
	const tbase      = "./src/json";
	const compiled   = jsonCheckLoad(`${tbase}/definitions.json`);
	const verify     = loadDefinitions(tbase, compiled, omit);
	checkDefinitions(tbase, compiled, verify);
	sortDefinitions(compiled);
	return compiled;
}

function make(print, omit, markdown, dry) {
	
	const compiled   = compileDefinitions(omit);
	const string     = JSON.stringify(compiled, null, 2);
	const javascript = `/* eslint-disable */\nconst definitions = ${string};`;

	if (print) console.log(string);

	if (dry) return;

	fs.writeFileSync("definitions.js", javascript);

	if (markdown) {
		try {
			const marked = require("marked");
			const html   = marked.parse(fs.readFileSync("README.md", "utf8"));
			fs.writeFileSync("README.html", html);
		} catch (error) {
			console.error(
				"Could not require module \"marked\" so markdown to HTML "
				+ "conversion was skipped."
			);
		}
	}
}

function flags(arg) {

	// try to match a flag pattern
	const flag = arg.match(/^(--?)([0-9A-Za-z]*)$/);
	
	// this is not a flag
	if (!flag) return [];

	// this is a single long form flag
	if (flag[1] == "--") return [flag[2]];

	// this is one or more short form flags
	return flag[2].split("");
}

function getopts(args, func) {

	// copy args just to be safe
	args = Array.from(args);

	while (args.length) {
		for (let each of flags(args.shift())) {
			func(each, args);
		}
	}
}

/**
 * This is a fallback argument parser in the case that we need to run in
 * an environment where the nice argparse package is not available.
 * @param  {Array} args commandline arguments
 */
function fallbackMain(args) {
	let omit     = false;
	let print    = false;
	let markdown = true;
	let dry      = false;

	getopts(args, (each) => {
		switch (each) {
		case "p":
		case "print":
			print = true;
			break;
		case "o":
		case "omit":
			omit = true;
			break;
		case "m":
		case "nomarkdown":
			markdown = false;
			break;
		case "d":
		case "dry-run":
			dry = true;
			break;
		default:
			throw Error("only arguments are --omit and --print");
		}
	});

	make(print, omit, markdown, dry);
}

function main(args) {
	try {
		
		const argparse = require("argparse");

		const parser = new argparse.ArgumentParser({
			description: "builds the character builder's data file"
		});

		parser.add_argument("-o", "--omit", {
			help   : "omit files with {\"omit\": true} from final data file",
			action : "store_true",
		});

		parser.add_argument("-p", "--print", {
			help   : "print the final data file to standard output",
			action : "store_true",
		});

		parser.add_argument("-m", "--nomarkdown", {
			help   : "don't try to convert markdown files to html",
			action : "store_false",
		});

		parser.add_argument("-d", "--dry-run", {
			help   : "just verify data without writing the final file",
			action : "store_true",
		});

		parser.add_argument("-v", "--vim-mode", {
			help   : "open file causing error in vim",
			action : "store",
		});

		const ns = parser.parse_args();

		if (ns.vim_mode) {
			Color.enable = false;
			vimode       = ns.vim_mode;
		}

		make(ns.print, ns.omit, ns.nomarkdown, ns.dry_run);

	} catch (error) {
		// 
		if (error.code !== "MODULE_NOT_FOUND") {
			throw error;
		}
		if (!error.message.includes("argparse")) {
			throw error;
		}
		fallbackMain(args);
	}
}


if (require.main == module) {
	main(process.argv.slice(2));
}