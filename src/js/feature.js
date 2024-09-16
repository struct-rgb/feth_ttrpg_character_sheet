/**
 * A module that implements the main data model for the sheet
 * @module feature
 */

/* global 
	ConfigEnum, Filter, Iter, Version
	assume, capitalize, delimit, element, tooltip, wrap
*/

/* global Calculator */
/* global Polish */

/* global Macros */

/* global Requirements */

/* global ModWidget, RangeFinder */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */

if (typeof require !== "undefined") {

	/* global require */

	/* eslint-disable no-global-assign */
	({
		ConfigEnum, Filter,
		assume, capitalize, delimit, element, tooltip, wrap
	}            = require("./common.js"));
	(Calculator  = require("./lang/calculator.js"));
	(Polish      = require("./lang/polish.js"));
	({
		ModWidget, RangeFinder
	}            = require("./widget/dynamic.js"));
	(Macros      = require("./macro_builder.js"));
	/* eslint-enable no-global-assign */
}

/**
 * A class to represent customization features that modify a unit's statistics.
 * Instances of this class are immutable.
 */
class Feature {

	static byName;

	/**
	 * An "empty" feature instance, with completely default values
	 */
	static EMPTY;

	static kind = "feature";

	/**
	 * Immutable empty object instance to preven unnessecary allocation. 
	 * @constant
	 * @type {Object}
	 * @default
	 * @private
	 */
	static EMPTY_OBJECT = Object.freeze({});

	/**
	 * Attributes that can be either numbers or strings representing
	 * {@link PostfixExpression} instances tha must be compiled.
	 * @constant
	 * @type {Array}
	 * @default
	 * @private
	 */
	static STATS_ATTRIBUTES = Object.freeze([
		Object.freeze({key: "modifiers", default: 0}),
		Object.freeze({key: "multipliers", default: 1}),
	]);

	getVariableName(key) {
		return null;
	}

	/**
	 * Create a feature from a template object
	 */
	constructor(template, compiler, predicator, marker) {

		this.name         = template.name || "";
		this.description  = template.description || "";
		this.type         = template.type || "";
		this.tags         = new Set(template.tags || []);
		this.comment      = template.comment || "No comment.";
		this.hidden       = template.hidden || false;
		this.rows         = [];
		this.dependancies = new Set();
		this.affects      = new Set();

		compiler          = compiler   || new Calculator.Compiler();
		predicator        = predicator || new Polish.Compiler();
		this.marker       = marker;

		// defaults until these can be added to all the files
		if ("modifiers" in template) {
			template.modifiers["tslots"]   = assume(template.modifiers["slots"]    , 0);
			template.modifiers["aslots"]   = assume(template.modifiers["aslots"]   , 0);
			template.modifiers["tslots"]   = assume(template.modifiers["tslots"]   , 0);
			template.modifiers["slotcost"] = assume(template.modifiers["slotcost"] , 1);
		}
		
		// take into account the possibility of local definitions
		const locals = compiler.createLocals(template.locals);
		
		const kind   = new.target.kind;

		// function to compile dynamic modifiers
		const compile = (value, key=null) => {

			const variable = this.getVariableName(key);
			
			// join an array into a string
			if (value instanceof Array) {
				value = value.join(" ");
			}

			// see if we need to compile an expression
			if (typeof value == "number") {
				if (variable && value) this.affects.add(variable);
				return value;
			}

			// filter out any other bad input
			if (typeof value != "string") {
				throw new Error(
					`${this.name} (${key}): value cannot be ${typeof value}`
				);
			}

			// try to compile the expression, if not error and assume default
			try {
				const identifier = Calculator.asIdentifier(this.name);
				const member     = `${kind}|${identifier}|${key}`;
				const expression = compiler.compile(value, member);
				const defined    = !(typeof key == "number");

				if (variable && defined) this.affects.add(variable);

				// warn in console about any potential circular dependancies
				if (key && expression.symbols.has(key)) {
					console.warn(this.name, expression,
						"Potential circular dependacy detected."
					);
				}

				return expression;

			} catch (error) {
				if (error instanceof compiler.throws) {
					console.error(this.name, value);
				}
				throw error;
			}
		};

		if ("rows" in template) {
			for (let i = 0; i < template.rows.length; ++i) {
				const line = template.rows[i];
				let when = null, expr = null;

				const name = line.name || this.name;

				try {
					when = compile(line.when || "1", i);
				} catch (error) {
					console.error(
						`Error in 'when' in row ${
							name
						} (${i}) of ${new.target.name} '${template.name}' `,
						error
					);
					throw error;
				}

				try {
					expr = compile(line.expr || "0");
				} catch (error) {
					console.error(
						`Error in 'when' in row ${
							name
						} (${i}) of ${new.target.name} '${template.name}' `,
						error
					);
					throw error;
				}


				this.rows.push(
					new Macros.CustomRow(name, when, expr, line.roll || false)
				);
			}
		}

		this.requires = predicator.compile(template.requires || "None");

		// TODO hack to make unit size accessible to rangefinder
		if (compiler && "modifiers" in template)
			template.modifiers["size"] = "unit|size";

		// compile dynamic expressions in the modifiers/multipliers
		for (let attribute of Feature.STATS_ATTRIBUTES) {

			// skip modifiers/multipliers if not defined in the template
			if (!(attribute.key in template && template[attribute.key])) {
				this[attribute.key] = Feature.EMPTY_OBJECT;
				continue;
			}

			// either modifiers/multipliers
			const stats = template[attribute.key];

			// iterate through each element
			for (let key in stats) {
				try {
					stats[key] = compile(stats[key], key);
				} catch (error) {
					console.error(
						`Error in key '${key}' of ${new.target.name} '${template.name}'`,
						stats[key]
					);
					throw error;
				}
			}

			this[attribute.key] = Object.freeze(stats);
		}

		// delete any local templates that were created since we're done
		compiler.deleteLocals(locals);

		// These objects are just references for value and as such should not
		// be mutable. If this is not a super() call, freeze the object.
		if (new.target === Feature) {
			Object.freeze(this);
		}
	}

	/**
	 * Populate the lookup map for this class
	 * @param {Object} defintions - json game data
	 */
	static setLookupByName(iterable, compiler, predicator, marker) {

		// initialize the "empty" feature on first invocation
		if (this.EMPTY === undefined) {
			this.EMPTY = new this(this.EMPTY_OBJECT, compiler, predicator);
		}

		// initialize the map on first invocation
		if (this.byName === undefined) {
			this.byName = new Map();
		}

		// clear existing values and refill map
		this.byName.clear();
		for (let template of iterable[this.kind]) {
			try {
				const instance = new this(template, compiler, predicator, marker);
				this.byName.set(instance.name, instance);
			} catch (error) {
				console.error(template);
				throw error;
			}
		}
	}

	/**
	 * Returns an instance of this feature. If name is passed, attempts to find
	 * a feature in the lookup table with that name. If one is not found, or
	 * name is nullish, returns an "empty" feature instance.
	 * @param {string} name - optional name of feature to get
	 * @returns {Feature} a feature instance
	 */
	static get(name, fallback) {
		return (
			name && this.byName.has(name)
				? this.byName.get(name)
				: this.EMPTY
		);
	}

	static has(name) {
		return name && this.byName.has(name);
	}

	static values() {
		return this.byName.values();
	}

	static where(predicate=(() => true), map=(f => f)) {
		
		const features = [];
		
		for (let feature of this.byName.values()) {
			if (predicate(feature)) features.push(map(feature));
		}

		return features;
	}


	static dependancies(compiler, key) {
		return this.where(
			f => Calculator.is(f.modifiers[key]),
			f => f.modifiers[key].symbols,
		).reduce((x, y) => x.extend(y), new Set());
	}

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {
		
		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		return this.name;
	}

	static MODEXCLUDE = new Set([
		"tiles", "tp", "sp", "tpcost", "spcost", "capcost",
		"epcost", "cap", "minrng", "maxrng", "size", "slotcost"
	]);

	static MOD_RENAME = new Map([
		["tiles"  , "Tiles"     ],
		["maxrng" , "Max Range" ],
		["minrng" , "Min Range" ],
		["tp"     , "Max TP"    ],
		["sp"     , "Max SP"    ],
		["tpcost" , "TP Cost"   ],
		["spcost" , "SP Cost"   ],
	]);

	static UISEP = ":\xA0";

	/**
	 * Generate a feature's {@link CategoryElement} description
	 * @return {string} description for this item's {@link CategoryElement}
	 */
	body(dead=false) {

		function span(...args) {
			return element("span", args);
		}

		const mods = [];

		if (this.price) {
			mods.push([
				element("span", this.price, "computed"),
				element("sub", "G", "computed")
			]);
		}


		let   star = undefined;
		const bare = {sign: false , range: false , dead};
		const sign = {sign: true  , range: false , dead};

		if ((star = this.modifierForUI("capcost", bare))) mods.push([
			element("span", star, "computed"),
			element( "sub",  "C", "computed"),
		]);

		for (let key in this.modifiers) {

			if (Feature.MODEXCLUDE.has(key)) continue;

			if ((star = this.modifierForUI(key, sign)))
				mods.push(span(capitalize(key), Feature.UISEP, star));
		}

		for (let [key, value] of Feature.MOD_RENAME) {

			if ((star = this.modifierForUI(key, sign)))
				mods.push(span(value, Feature.UISEP, star));

		}

		console.assert(this.requires.source);

		return element("span", [
			delimit(" ", mods),
			mods.length ? element("br") : "",
			this.marker.toLinks(this.description, dead),
			Requirements.toDOM(this.marker, this.requires, dead)
		]);
	}

	blurb() {

		const mods = [];

		if (this.price) {
			mods.push(`${this.price}G`);
		}

		for (let key in this.modifiers) {

			// if (Feature.MODEXCLUDE.has(key)) continue;
			if (key == "size") continue;

			const value = this.modifier(key);
			const isnum = (typeof this.modifiers[key] == "number");

			if (isnum && value == 0) continue;

			const mark  = (isnum ? "" : "*");

			mods.push(`${capitalize(key)}:\xA0${value}${mark}`);
		}

		return [
			this.title(), "\n",
			mods.join(" "), mods.length ? "\n" : "",
			this.marker.toText(this),
			"\nUsage Requirements\n",
			Requirements.toText(this.requires)
		].join("");
	}

	html() {

		const mods = [];

		if (this.price) {
			mods.push(`${this.price}G`);
		}

		for (let key in this.modifiers) {

			// if (Feature.MODEXCLUDE.has(key)) continue;
			if (key == "size") continue;

			const value = this.modifier(key);
			const isnum = (typeof this.modifiers[key] == "number");

			if (isnum && value == 0) continue;

			const mark  = (isnum ? "" : "*");

			mods.push(`${capitalize(key)}:&nbsp;${value}${mark}`);
		}

		return [
			"<b>", this.title(), "</b><br />",
			mods.join(" "), mods.length ? "<br />" : "",
			this.marker.toHTML(this),
			"<br /><b>Usage Requirements</b><br />",
			Requirements.toHTML(this.requires)
		].join("");
	}

	/**
	 * Get the value of this feature's modifier for a statistic
	 * @param {string} stat - name of the stat to get the modifier for
	 * @returns {number} the modifier for the stat, or 0 if none exists
	 */
	modifier(stat, env) {
		return Calculator.evaluate(this.modifiers[stat] || 0, env);
	}

	modifierForUI(field, template) {

		const dead      = template.dead      ?? false;
		const sign      = template.sign      ?? false;
		const range     = template.range     ?? false;

		// if there's no field with this name, return a default value
		if (!(field in this.modifiers)) return 0;

		// handle other cases in which we would return a number
		const value    = this.modifier(field);
		const modifier = this.modifiers[field];

		// if the modifier is just a number return a static DOM object
		if (typeof modifier == "number") {

			// no need to display most zero value
			if (!range && value == 0) return 0;

			return element("span", {
				class   : ["computed"],
				content : [
					(sign && value >= 0) ? "+" : "",
					String(value)
				]
			});
		}

		const widget = new ModWidget(modifier, sign, !dead);

		// TODO this is a super ugly hack to get the triggers
		this.marker.refresher.register(
			widget,
			this.marker.refresher.sheet.compiler.dependancies(modifier),
			[this.getVariableName(field)],
		);

		// handle a calculator expression by returning a ModWidget DOM object
		return widget.root;
	}

	/**
	 * Get the value of this feature's tag for a statistic. A "tag" in this case
	 * is an optional property that isn't a direct modifier or multiplier
	 * @param {string} name - the name of the tag
	 * @returns {boolean} the value of the tag if it exists, null otherwise
	 */
	tagged(name) {
		return this.tags.has(name);
	}

	static INNATENESS_TAGS = new Set(["personal", "crest"]);

	/**
	 * Whether this feature should probably be sorted under an "Innate" group
	 * when placed into catagory. This is mainly for arts and abilities but
	 * there was no other place it really made sense to put this.
	 */
	isConsideredInnate() {
		return (
			this.requires.symbols.has("Innate")
				||
			Iter.any(Feature.INNATENESS_TAGS, tag => this.tagged(tag))
		);
	}

	static *[Symbol.iterator]() {
		yield* this.byName.values();
	}
}

class Preset {

	static kind    = "presets";
	static DEFAULT = "Blank Sheet";

	constructor(template) {
		this.name        = template.name         || "";
		this.description = template.description  || "";
		this.class       = template.class;
		this.bases       = template.bases        || {};
		this.growths     = template.growths      || {};
		this.tags        = new Set(template.tags || []);
		this.comment     = template.comment      || "No comment.";
		this.hidden      = template.hidden       || false;

		if (new.target === Preset) {
			Object.freeze(this);
		}
	}

	/**
	 * Populate the lookup map for this class
	 * @param {Object} defintions - json game data
	 */
	static setLookupByName(iterable) {

		// initialize the "empty" feature on first invocation
		if (this.EMPTY === undefined) {
			this.EMPTY = new this(Feature.EMPTY_OBJECT);
		}

		// initialize the map on first invocation
		if (this.byName === undefined) {
			this.byName = new Map();
		}

		// clear existing values and refill map
		this.byName.clear();
		for (let template of iterable[this.kind]) {
			const instance = new this(template);
			this.byName.set(instance.name, instance);
		}
	}

	static *[Symbol.iterator]() {
		yield* this.byName.values();
	}

	static get(name, fallback) {
		return (
			name && this.byName.has(name)
				? this.byName.get(name)
				: this.EMPTY
		);
	}

	static has(name) {
		return name && this.byName.has(name);
	}

	static where() {
		return [];
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls =>
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [
				element("strong", "Offense"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Power", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[0] == "Power";
				}),
				new Filter.Toggle("Balance", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[0] == "Balance";
				}),
				new Filter.Toggle("Speed", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[0] == "Speed";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Defense"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Defense", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[1] == "Defense";
				}),
				new Filter.Toggle("Balance", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[1] == "Balance";
				}),
				new Filter.Toggle("Resistance", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[1] == "Resistance";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Chance"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Dexterity", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[2] == "Dexterity";
				}),
				new Filter.Toggle("Balance", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[2] == "Balance";
				}),
				new Filter.Toggle("Luck", false, (feature) => {
					const  fields = feature.name.split("/");
					return fields.length == 3 && fields[2] == "Luck";
				}),

				Filter.Group.END,

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}

	/**
	 * Get the value of this feature's tag for a statistic. A "tag" in this case
	 * is an optional property that isn't a direct modifier or multiplier
	 * @param {string} name - the name of the tag
	 * @returns {boolean} the value of the tag if it exists, null otherwise
	 */
	tagged(name) {
		return this.tags.has(name);
	}
}

/**
 * A {@link Feature} subclass that heavily governs attack calculations.
 */
class Action extends Feature {

	/**
	 * Create an Action from a template object
	 */
	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);
		this.rank    = template.rank   || "E";
		this.mttype  = template.mttype || 0;
		this.price   = template.price  || 0;
		this.aoe     = template.aoe    || "None";

		// If this is not a super() call, freeze the object.
		if (new.target === Action) {
			Object.freeze(this);
		}
	}

	static MTTYPE = new ConfigEnum(0, "else", ["else", "str", "mag", "none"]); 

	/**
	 * Generate a {@link CategoryElement} description
	 * @return {string} description for this feature's {@link CategoryElement}
	 */

	body(dead=false) {

		function span(...args) {
			return element("span", args);
		}

		const mods  = [];

		if (this.price) {
			mods.push([
				element("span", this.price, "computed"),
				element("sub", "G", "computed")
			]);
		}

		let   star  = undefined;
		const bare  = {sign: false , range: false , dead};
		const sign  = {sign: true  , range: false , dead};
		const range = {sign: false , range: true  , dead}; 

		if ((star = this.modifierForUI("tpcost", bare)))
			mods.push([star, element("sub", "TP", "computed")]);

		if ((star = this.modifierForUI("spcost", bare)))
			mods.push([star, element("sub", "SP", "computed")]);

		if ((star = this.modifierForUI("epcost", bare)))
			mods.push([star, element("sub", "EP", "computed")]);

		for (let key in this.modifiers) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			const value = this.modifierForUI(key, sign);

			if (value) {
				mods.push(span(capitalize(key), ":\xA0", value));
			}
		}

		if ((star = this.modifierForUI("tiles", bare)))
			mods.push(span("Tiles:\xA0", star));

		const min = this.modifier("minrng");
		const max = this.modifier("maxrng");

		if (min != max) {
			const min = this.modifierForUI("minrng", range);
			const max = this.modifierForUI("maxrng", range);
			mods.push(span("Range:\xA0", min, "\xA0-\xA0", max));
		} else if (min != 0) {
			mods.push(span("Range:\xA0", this.modifierForUI("maxrng", bare)));
		}

		if ((star = this.modifier("tp"))) {
			star = this.modifierForUI("tp", bare);
			mods.push(span("Max TP:\xA0", star));
		}

		if ((star = this.modifier("sp"))) {
			star = this.modifierForUI("sp", bare);
			mods.push(span("Max SP:\xA0", star));
		}

		if (this.aoe && this.aoe != "None" && this.aoe != "Variable") {
			const va = new RangeFinder(this);
			this.marker.refresher.register(va, ["theme", "unit|total|maxrng", "unit|total|minrng"]);
			mods.push(element("br"), va.root);
		}

		console.assert(this.requires.source);

		return element("span", [
			delimit(" ", mods),
			mods.length ? element("br") : "",
			this.marker.toLinks(this.description, dead),
			Requirements.toDOM(this.marker, this.requires, dead)
		]);
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute, additional
 * optional damage scaling based off of a stat, and boolean tags.
 */
class Art extends Action {

	static kind = "arts";

	static DEFAULT = "";

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);

		let value = template.compatible || "False";
		if (value instanceof Array) value = value.join("\n");

		this.compatible = value;

		if (template.mttype != "else")
			this.affects.add("item|total|mttype");

		if (typeof this.rank == "string") {
			this.rank = this.rank.split("-");
		}

		// If this is not a super() call, freeze the object.
		if (new.target === Art) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a combat art's {@link CategoryElement} title
	 * @return {string} title for this combat this's {@link CategoryElement}
	 */
	title() {

		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		const kind = (this.tagged("tactical") ? "Tactic" : "Art");

		if (!this.type || !this.rank) {
			return ` ${this.name} (${kind})`;
		}

		return `${this.name} (${kind}: ${this.type} ${this.rank.join("-")})`;
	}

	isTactical() {
		return this.tagged("tactical");
	}

	isCombo() {
		return this.tagged("combo");
	}

	isNormal() {
		return !(this.tagged("combo") || this.tagged("tactical"));
	}

	*exKeys() {

		const ranks = this.rank instanceof Array ? this.rank : [this.rank];
		const types = this.type instanceof Array ? this.type : [this.type];

		for (let rank of ranks) {
			for (let type of types) {
				const kind = this.isTactical() ? "tactical" : "combat";
				yield `${type} ${rank}, ${kind} art`;
			}
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Type"), element("br"),

				new Filter.Toggle("Combat", false, (feature) => {
					return !feature.tagged("tactical");
				}),
				new Filter.Toggle("Tactics", false, (feature) => {
					return feature.tagged("tactical");
				}),

				element("br"), element("strong", "Skill"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.requires.symbols.has("Axes");
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.requires.symbols.has("Swords");
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.requires.symbols.has("Lances");
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.requires.symbols.has("Bows");
				}),
				element("br"),
				new Filter.Toggle("Brawl", false, (feature) => {
					return feature.requires.symbols.has("Brawl");
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.requires.symbols.has("Faith");
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.requires.symbols.has("Reason");
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.requires.symbols.has("Guile");
				}),
				element("br"),
				new Filter.Toggle("Armor", false, (feature) => {
					return feature.requires.symbols.has("Armor");
				}),
				new Filter.Toggle("Riding", false, (feature) => {
					return feature.requires.symbols.has("Riding");
				}),
				new Filter.Toggle("Flying", false, (feature) => {
					return feature.requires.symbols.has("Flying");
				}),
				new Filter.Toggle("Morph", false, (feature) => {
					return feature.requires.symbols.has("Morph");
				}),
				element("br"),
				new Filter.Toggle("Authority", false, (feature) => {
					return feature.requires.symbols.has("Authority");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Element"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Fire", false, (feature) => {
					return feature.tagged("fire");
				}),

				new Filter.Toggle("Ice", false, (feature) => {
					return feature.tagged("ice");
				}),

				new Filter.Toggle("Wind", false, (feature) => {
					return feature.tagged("wind");
				}),

				element("br"),

				new Filter.Toggle("Lightning", false, (feature) => {
					return feature.tagged("lightning");
				}),

				new Filter.Toggle("Force", false, (feature) => {
					return feature.tagged("force");
				}),

				element("br"),

				new Filter.Toggle("Metal", false, (feature) => {
					return feature.tagged("metal");
				}),

				new Filter.Toggle("Beast", false, (feature) => {
					return feature.tagged("beast");
				}),

				new Filter.Toggle("Water", false, (feature) => {
					return feature.tagged("water");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Rank"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("S", false, (feature) => {
					return feature.requires.symbols.has("S");
				}),
				new Filter.Toggle("A", false, (feature) => {
					return feature.requires.symbols.has("A");
				}),
				new Filter.Toggle("B", false, (feature) => {
					return feature.requires.symbols.has("B");
				}),
				new Filter.Toggle("C", false, (feature) => {
					return feature.requires.symbols.has("C");
				}),
				new Filter.Toggle("D", false, (feature) => {
					return feature.requires.symbols.has("D");
				}),
				new Filter.Toggle("E", false, (feature) => {
					return feature.requires.symbols.has("E");
				}),
				element("br"),
				new Filter.Toggle("S+", false, (feature) => {
					return feature.requires.symbols.has("S+");
				}),
				new Filter.Toggle("A+", false, (feature) => {
					return feature.requires.symbols.has("A+");
				}),
				new Filter.Toggle("B+", false, (feature) => {
					return feature.requires.symbols.has("B+");
				}),
				new Filter.Toggle("C+", false, (feature) => {
					return feature.requires.symbols.has("C+");
				}),
				new Filter.Toggle("D+", false, (feature) => {
					return feature.requires.symbols.has("D+");
				}),
				new Filter.Toggle("E+", false, (feature) => {
					return feature.requires.symbols.has("E+");
				}),
				element("br"),
				new Filter.Toggle("None", false, (feature) => {
					return feature.requires.symbols.has("None");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Might Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Strength", false, (feature) => {
					return feature.mttype == "str";
				}),
				new Filter.Toggle("Magic", false, (feature) => {
					return feature.mttype == "mag";
				}),
				new Filter.Toggle("None", false, (feature) => {
					return feature.mttype == "none";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Effect"), element("br"),

				new Filter.Toggle("Healing", false, (feature) => {
					return feature.tagged("healing");
				}),

				new Filter.Toggle("Condition", false, (feature) => {
					return feature.tagged("condition");
				}),

				new Filter.Toggle("AoE", false, (feature) => {
					return feature.tagged("aoe");
				}),

				// element("br"),

				new Filter.Toggle("Effective", false, (feature) => {
					return feature.tagged("effective");
				}),

				new Filter.Toggle("Reaction", false, (feature) => {
					return feature.tagged("reaction");
				}),

				new Filter.Toggle("Overlay", false, (feature) => {
					return feature.tagged("wall");
				}),

				// element("br"),

				new Filter.Toggle("Scales", false, (feature) => {
					return feature.tagged("scales");
				}),

				new Filter.Toggle("Combo", false, (feature) => {
					return feature.tagged("combo");
				}),

				new Filter.Toggle("Movement", false, (feature) => {
					return feature.tagged("movement");
				}),


				new Filter.Toggle("Variant", false, (feature) => {
					return feature.tagged("variant");
				}),

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}

	getVariableName(key) {
		const tag    = this.tagged("tactical");
		const prefix = tag ? "tactical" : "combatarts";
		return	`${prefix}|${key}`;
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute
 */
class Item extends Action {

	static kind = "items";

	getVariableName(key) {
		return `item|template|${key}`;
	}

	static DEFAULT = "Unarmed";

	/**
	 * Generate a item's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {

		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		return `${this.name} (${this.type} ${this.rank}) `;
	}

	static TYPE = new ConfigEnum(
		0, "Other", ["Other"].concat(definitions.skills)
	);

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				element("strong", "Item Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Weapon", false, (feature) => {
					return feature.tagged("weapon");
				}),

				new Filter.Toggle("Implement", false, (feature) => {
					return feature.tagged("implement");
				}),

				new Filter.Toggle("Equipment", false, (feature) => {
					return feature.tagged("equipment");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Skill"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.type == "Axes";
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.type == "Swords";
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.type == "Lances";
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.type == "Bows";
				}),
				element("br"),
				new Filter.Toggle("Brawl", false, (feature) => {
					return feature.type == "Brawl";
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.type == "Faith";
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.type == "Reason";
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.type == "Guile";
				}),
				element("br"),
				new Filter.Toggle("Authority", false, (feature) => {
					return feature.type == "Authority";
				}),
				new Filter.Toggle("Other", false, (feature) => {
					return feature.type == "Other";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Element"), element("br"),

				new Filter.Group(Filter.Group.OR, false),
				
				new Filter.Toggle("Fire", false, (feature) => {
					return feature.tagged("fire");
				}),

				new Filter.Toggle("Ice", false, (feature) => {
					return feature.tagged("ice");
				}),

				new Filter.Toggle("Wind", false, (feature) => {
					return feature.tagged("wind");
				}),

				element("br"),

				new Filter.Toggle("Lightning", false, (feature) => {
					return feature.tagged("lightning");
				}),

				new Filter.Toggle("Force", false, (feature) => {
					return feature.tagged("force");
				}),

				element("br"),

				new Filter.Toggle("Metal", false, (feature) => {
					return feature.tagged("metal");
				}),

				new Filter.Toggle("Beast", false, (feature) => {
					return feature.tagged("beast");
				}),

				new Filter.Toggle("Water", false, (feature) => {
					return feature.tagged("water");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Rank"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("S", false, (feature) => {
					return feature.rank == "S";
				}),
				new Filter.Toggle("A", false, (feature) => {
					return feature.rank == "A";
				}),
				new Filter.Toggle("B", false, (feature) => {
					return feature.rank == "B";
				}),
				new Filter.Toggle("C", false, (feature) => {
					return feature.rank == "C";
				}),
				new Filter.Toggle("D", false, (feature) => {
					return feature.rank == "D";
				}),
				new Filter.Toggle("E", false, (feature) => {
					return feature.rank == "E";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Might Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Strength", false, (feature) => {
					return feature.mttype == "str";
				}),
				new Filter.Toggle("Magic", false, (feature) => {
					return feature.mttype == "mag";
				}),
				new Filter.Toggle("None", false, (feature) => {
					return feature.mttype == "none";
				}),

				element("br"), element("strong", "Range"), element("br"),

				new Filter.Toggle("1", false, (feature) => {
					return (
						feature.modifier("maxrng") == 1
							&&
						feature.modifier("minrng") == 1
					);
				}),

				new Filter.Toggle("1-2", false, (feature) => {
					return (
						feature.modifier("maxrng") == 2
							&&
						feature.modifier("minrng") == 1
					);
				}),

				new Filter.Toggle("2", false, (feature) => {
					return (
						feature.modifier("maxrng") == 2
							&&
						feature.modifier("minrng") == 2
					);
				}),

				new Filter.Toggle("2-3", false, (feature) => {
					return (
						feature.modifier("maxrng") == 3
							&&
						feature.modifier("minrng") == 2
					);
				}),

				element("br"),

				new Filter.Toggle("1-3", false, (feature) => {
					return (
						feature.modifier("maxrng") == 3
							&&
						feature.modifier("minrng") == 1
					);
				}),

				new Filter.Toggle("1-5", false, (feature) => {
					return (
						feature.modifier("maxrng") == 5
							&&
						feature.modifier("minrng") == 1
					);
				}),

				new Filter.Toggle("3-10", false, (feature) => {
					return (
						feature.modifier("maxrng") == 10
							&&
						feature.modifier("minrng") == 3
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Effect"), element("br"),

				new Filter.Toggle("Healing", false, (feature) => {
					return feature.tagged("healing");
				}),

				new Filter.Toggle("Condition", false, (feature) => {
					return feature.tagged("condition");
				}),

				new Filter.Toggle("AoE", false, (feature) => {
					return feature.tagged("aoe");
				}),

				new Filter.Toggle("Consumable", false, (feature) => {
					return feature.tagged("break");
				}),

				new Filter.Toggle("Wall", false, (feature) => {
					return feature.tagged("wall");
				}),

				new Filter.Toggle("Effective", false, (feature) => {
					return feature.tagged("effective");
				}),

				new Filter.Toggle("Shield", false, (feature) => {
					return feature.tagged("shield");
				}),

				new Filter.Toggle("Stone", false, (feature) => {
					return feature.tagged("stone");
				}),

				new Filter.Toggle("Reaction", false, (feature) => {
					return feature.tagged("reaction");
				}),

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Template", false, (feature) => {
					return feature.tagged("template");
				}),
				new Filter.Toggle("Purchasable", false, (feature) => {
					return feature.price > 0;
				}),

				Filter.Group.END,

				element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

/**
 * An extension of {@link Feature} that adds growths, abilities, and an optional
 * internal {@link Feature} instance representing a mount.
 */
class Class extends Feature {

	static kind = "classes";
	static DEFAULT = "None";

	/**
	 * Create a class from a template object
	 */
	constructor(template, compiler, predicator, marker) {
		super(template, null, predicator, marker);
		this.abilities = template.abilities || [];
		this.arts      = template.arts || [];
		this.growths   = Object.freeze(template.growths || {});
		this.tier      = template.tier    || "Starting";
		this.default_base    = template.default_base;
		this.default_preset  = template.default_preset;
		this.default_mainarm = template.default_mainarm;
		this.default_sidearm = template.default_sidearm;
		this.mount           = Number(template.mount ?? 0);

		if (new.target === Class) {
			Object.freeze(this);
		}
	}

	/**
	 * This expects the state object created by MultiActiveCategory
	 */
	validate(category, items) {

		/* Assume this is the special case for loading a save. */
		if (typeof category == "object" && items == null) {
			for (let each of ["abilities", "arts"]) {
				if (!this.validate(each, category[each])) return false;
			}
			return true;
		}

		/* This is programmer error and as such warrants an exception. */
		if (!["arts", "abilities"].includes(category)) throw Error(
			"category must be either 'arts' or 'abilities'"
		);

		/* Defensive guard against malformed input. */
		if (items == null) return false;

		/* Validate active arts separate from all else...*/
		if (category == "arts") {
			const active   = items.filter(a => a.active).map(a => Art.get(a));

			/* Note: "tactical" and "combo" must be mutually exclusive. */
			const tactical = active.count(x => x.tagged("tactical"));
			const combo    = active.count(x => x.tagged("combo"));

			switch (active.length) {
			case 0:
			case 1:
				/* These two cases are always valid. */
				break;
			case 2: 
				/* Has to be one of:
				 * tactical == 1 && other == 1
				 * tactical == 1 && combo == 1
				 * combo    == 1 && other == 1
				 * combo    == 2
				 * 
				 * These fail (and also fail 3):
				 * other    == 2
				 * tactical == 2
				 */
				if (tactical == 1 || combo >= 1) break;
				/* fallthrough */
			case 3:
				/* Has to be one of:
				 * tactical == 1 && combo == 1 && other == 1
				 * tactical == 1 && combo == 2
				 */
				if (tactical == 1 && combo >= 1) break;
				/* fallthrough */
			default:
				/* this is fixable, so we will do so */
				for (let item of items) item.active = false;
			}
		}

		/* Now we validate class features. */
		const here = new Set(
			items.filter(x => x.group == "class").map(x => x.id)
		);

		/* Make sure only item from the list is in the set. */
		const only = (list, set) => {
			let result = false;
			for (let each of list) {
				if (set.has(each)){
					if (result) {
						return false;
					} else {
						result = true;
					}
				}
			}
			return result;
		};

		/* Check to make sure that each feature is present. */
		for (let each of this[category]) {
			if (each instanceof Array) {
				/* Ensure one options is present. */
				if (!only(each, here)) return false;
				for (let one of each) here.delete(one); 
			} else {
				/* Ensure this required feature is present. */
				if (!here.has(each)) return false;
				here.delete(each);
			}
		}

		/* Make sure there are no additional 'class' features. */
		if (here.size != 0) return false;

		/* The state is valid. */
		return true;
	}

	modifierForUI(stat, sign=false) {

		/* test explicitly for membership */
		if (!(stat in this.modifiers)) return 0;

		/* then handle other number cases*/
		const value = (
			this.modifier(stat)
				+
			(stat == "mov" && this.hasMount()
				? this.mount
				: 0)
		);

		/* we don't care to display these */
		if (value == 0) return 0;

		return element("span", {
			class   : ["computed"],
			content : [
				(sign && value >= 0) ? "+" : "",
				String(value)
			]
		});
	}

	growthForUI(stat, sign=false) {

		/* test explicitly for membership */
		if (!(stat in this.growths)) return 0;

		/* then handle other number cases*/
		const value = this.growth(stat);

		/* we don't care to display these */
		// if (value == 0) return 0;

		return element("span", {
			class   : ["computed"],
			content : [
				(sign && value >= 0) ? "+" : "",
				String(value), "%"
			]
		});
	}

	/**
	 * Get the value of this feature's growth modifier for a statistic
	 * @param {string} stat - name of the stat to get the growth modifier for
	 * @returns {number} the growth modifier for the stat, or 0 if none exists
	 */
	growth(stat) {
		return this.growths[stat] || 0;
	}

	/**
	 * Test whether this character class has an associate mount
	 * @returns {boolean} true if there is a mount, false otherwise
	 */
	hasMount() {
		return this.mount >= 0;
	}

	/**
	 * @typedef {object} ClassBodyOptions
	 * @property {Boolean} dead   if true; do not expand embedded feature links
	 * @property {Boolean} table  if true; display a table of base stats/growths
	 * @property {Boolean} center if true; center the displayed elements
	 */

	/**
	 * Generate a feature's {@link CategoryElement} description
	 * @param  {ClassBodyOptions|boolean} options options for generating the
	 * body of the class; if only a boolean is passed it is treated as though
	 * an object of the form {dead: <boolean>} were passed as the argument
	 * @return {string} description for this item's {@link CategoryElement}
	 */
	body(options={}) {

		switch (typeof options) {
		case "object"  : break;
		case "boolean" : options = {dead: options}; break;
		default        : throw new Error("Expected ClassBodyOptions or boolean");
		}

		const dead   = options.dead   ?? false;
		const table  = options.table  ?? true;
		const center = options.center ?? true;

		const rows = (
			["hp", "spd", "str", "mag", "dex", "lck", "def", "res"]
				.map(key => 
					[
						element("td", key.toUpperCase()),
						element("td", this.modifierForUI(key, false)),
						element("td", [
							element("span", "(", "punctuation"),
							this.growthForUI(key, false),
							element("span", ")", "punctuation"),
						]),
					]
				)
				.chunk(2)
				.map(array =>
					element("tr", array.flatten())
				)
		);

		rows.extend(
			element("td"),
			element("td"),
			element("td", "MOV"),
			element("td", this.modifierForUI("mov", false)),
			element("td"),
			element("td"),
		);

		console.assert(this.requires.source);

		return element("span", [
			element("em",
				`${this.tier}, ${Array.isArray(this.type) ? this.type.join(", ") : this.type}`
			), element("br"),
			this.marker.toLinks(this.description, dead),
			table
				? element("table", element("tbody", rows), center ? "center-table" : undefined)
				: "",
			Requirements.toDOM(this.marker, this.requires, dead)
		]);
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls =>
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [
				element("strong", "Class Tier"), element("br"),
				
				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Starting", false, (feature) => {
					return feature.tier == "Starting";
				}),
				new Filter.Toggle("Advanced", false, (feature) => {
					return feature.tier == "Advanced";
				}),
				new Filter.Toggle("Bonus", false, (feature) => {
					return feature.tier == "Bonus";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Class Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Armor", false, (feature) => {
					return feature.type.includes("Armor");
				}),
				new Filter.Toggle("Cavalry", false, (feature) => {
					return feature.type.includes("Cavalry");
				}),
				new Filter.Toggle("Flying", false, (feature) => {
					return feature.type.includes("Flying");
				}),
				element("br"),
				new Filter.Toggle("Infantry", false, (feature) => {
					return feature.type.includes("Infantry");
				}),
				new Filter.Toggle("Monster", false, (feature) => {
					return feature.type.includes("Monster");
				}),
				new Filter.Toggle("Other", false, (feature) => {
					return feature.type.includes("Monster");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Skill"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.requires.symbols.has("Axes");
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.requires.symbols.has("Swords");
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.requires.symbols.has("Lances");
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.requires.symbols.has("Bows");
				}),
				element("br"),
				new Filter.Toggle("Brawl", false, (feature) => {
					return feature.requires.symbols.has("Brawl");
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.requires.symbols.has("Faith");
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.requires.symbols.has("Reason");
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.requires.symbols.has("Guile");
				}),
				element("br"),
				new Filter.Toggle("Armor", false, (feature) => {
					return feature.requires.symbols.has("Armor");
				}),
				new Filter.Toggle("Riding", false, (feature) => {
					return feature.requires.symbols.has("Riding");
				}),
				new Filter.Toggle("Flying", false, (feature) => {
					return feature.requires.symbols.has("Flying");
				}),
				new Filter.Toggle("Morph", false, (feature) => {
					return feature.requires.symbols.has("Morph");
				}),
				element("br"),
				new Filter.Toggle("Authority", false, (feature) => {
					return feature.requires.symbols.has("Authority");
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

/**
 * A Feature subclass to represent abilities.
 */
class Ability extends Feature {

	static kind = "abilities";

	getVariableName(key) {
		return `abilities|${key}`;
	}

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);
		// this.weapon = template.weapon || "";

		if (this.name.includes("Crest")) {
			this.affects.add("Crest");
		}

		if (new.target === Ability) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Source"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Personal", false, (feature) => {
					return feature.tagged("personal");
				}),
				new Filter.Toggle("Class", false, (feature) => {
					return feature.requires.symbols.has("Class");
				}),
				new Filter.Toggle("Skills", false, (feature) => {
					return (
						!feature.requires.symbols.has("Class")
							&&
						!feature.tagged("personal")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Skill"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.requires.symbols.has("Axes");
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.requires.symbols.has("Swords");
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.requires.symbols.has("Lances");
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.requires.symbols.has("Bows");
				}),
				element("br"),
				new Filter.Toggle("Brawl", false, (feature) => {
					return feature.requires.symbols.has("Brawl");
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.requires.symbols.has("Faith");
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.requires.symbols.has("Reason");
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.requires.symbols.has("Guile");
				}),
				element("br"),
				new Filter.Toggle("Armor", false, (feature) => {
					return feature.requires.symbols.has("Armor");
				}),
				new Filter.Toggle("Riding", false, (feature) => {
					return feature.requires.symbols.has("Riding");
				}),
				new Filter.Toggle("Flying", false, (feature) => {
					return feature.requires.symbols.has("Flying");
				}),
				new Filter.Toggle("Morph", false, (feature) => {
					return feature.requires.symbols.has("Morph");
				}),
				element("br"),
				new Filter.Toggle("Authority", false, (feature) => {
					return feature.requires.symbols.has("Authority");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Rank"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("S", false, (feature) => {
					return feature.requires.symbols.has("S");
				}),
				new Filter.Toggle("A", false, (feature) => {
					return feature.requires.symbols.has("A");
				}),
				new Filter.Toggle("B", false, (feature) => {
					return feature.requires.symbols.has("B");
				}),
				new Filter.Toggle("C", false, (feature) => {
					return feature.requires.symbols.has("C");
				}),
				new Filter.Toggle("D", false, (feature) => {
					return feature.requires.symbols.has("D");
				}),
				new Filter.Toggle("E", false, (feature) => {
					return feature.requires.symbols.has("E");
				}),
				element("br"),
				new Filter.Toggle("S+", false, (feature) => {
					return feature.requires.symbols.has("S+");
				}),
				new Filter.Toggle("A+", false, (feature) => {
					return feature.requires.symbols.has("A+");
				}),
				new Filter.Toggle("B+", false, (feature) => {
					return feature.requires.symbols.has("B+");
				}),
				new Filter.Toggle("C+", false, (feature) => {
					return feature.requires.symbols.has("C+");
				}),
				new Filter.Toggle("D+", false, (feature) => {
					return feature.requires.symbols.has("D+");
				}),
				new Filter.Toggle("E+", false, (feature) => {
					return feature.requires.symbols.has("E+");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Level"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("1", false, (feature) => {
					return !feature.requires.symbols.has("Level");
				}),
				new Filter.Toggle("2", false, (feature) => {
					return feature.requires.symbols.has("2");
				}),
				new Filter.Toggle("5", false, (feature) => {
					return feature.requires.symbols.has("5");
				}),
				new Filter.Toggle("8", false, (feature) => {
					return feature.requires.symbols.has("8");
				}),
				new Filter.Toggle("11", false, (feature) => {
					return feature.requires.symbols.has("11");
				}),
				new Filter.Toggle("14", false, (feature) => {
					return feature.requires.symbols.has("14");
				}),
				new Filter.Toggle("17", false, (feature) => {
					return feature.requires.symbols.has("17");
				}),
				new Filter.Toggle("21", false, (feature) => {
					return feature.requires.symbols.has("21");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Family"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Advantage", false, (feature) => {
					return feature.tagged("advantage");
				}),
				new Filter.Toggle("Battalion", false, (feature) => {
					return feature.tagged("battalion");
				}),
				new Filter.Toggle("Blow", false, (feature) => {
					return feature.tagged("blow");
				}),
				new Filter.Toggle("Breaker", false, (feature) => {
					return feature.tagged("breaker");
				}),
				new Filter.Toggle("Consumption", false, (feature) => {
					return feature.tagged("consumption");
				}),
				new Filter.Toggle("Defiant", false, (feature) => {
					return feature.tagged("defiant");
				}),
				new Filter.Toggle("Faire", false, (feature) => {
					return feature.tagged("faire");
				}),
				new Filter.Toggle("\"Flight\"-like", false, (feature) => {
					return feature.tagged("flight");
				}),
				new Filter.Toggle("Lull", false, (feature) => {
					return feature.tagged("lull");
				}),
				new Filter.Toggle("Prowess", false, (feature) => {
					return feature.tagged("prowess");
				}),
				new Filter.Toggle("Seal", false, (feature) => {
					return feature.tagged("seal");
				}),
				new Filter.Toggle("Spirit", false, (feature) => {
					return feature.tagged("spirit");
				}),
				new Filter.Toggle("Stance", false, (feature) => {
					return feature.tagged("stance");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Effect"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Chance", false, (feature) => {
					return feature.tagged("chance");
				}),
				new Filter.Toggle("Static", false, (feature) => {
					return feature.tagged("static");
				}),
				new Filter.Toggle("In Combat", false, (feature) => {
					return feature.tagged("in combat");
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

/**
 * A Feature subclass to repersent equipment
 */
class Equipment extends Feature {

	static kind = "equipment";
	static DEFAULT = "";

	getVariableName(key) {
		return `equipment|${key}`;
	}

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);
		this.price = template.price || "";

		if (new.target === Equipment) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [
				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Item Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Accessory", false, (feature) => {
					return feature.type == "Accessory";
				}),
				new Filter.Toggle("Ring", false, (feature) => {
					return feature.type == "Ring";
				}),
				new Filter.Toggle("Shield", false, (feature) => {
					return feature.type == "Shield";
				}),
				element("br"),
				new Filter.Toggle("Staff", false, (feature) => {
					return feature.type == "Staff";
				}),
				new Filter.Toggle("Quiver", false, (feature) => {
					return feature.type == "Quiver";
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Purchasable", false, (feature) => {
					return feature.price > 0;
				}),

				Filter.Group.END,

				element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

/**
 * A Feature subclass to represent map tiles
 */
class Tile extends Action {

	static kind = "tiles";
	static DEFAULT = "";

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);
		this.stats = template.stats || {};

		if (new.target === Tile) {
			Object.freeze(this);
		}
	}

	title() {
		
		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		return this.name;
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Effect"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Modifier", false, (feature) => {
					return feature.tagged("modifier");
				}),
				new Filter.Toggle("Movement", false, (feature) => {
					return feature.tagged("movement");
				}),
				new Filter.Toggle("Destructible", false, (feature) => {
					return feature.tagged("destroy");
				}),
				new Filter.Toggle("Damage", false, (feature) => {
					return feature.tagged("damage");
				}),
				new Filter.Toggle("Condition", false, (feature) => {
					return feature.tagged("condition");
				}),
				new Filter.Toggle("Healing", false, (feature) => {
					return feature.tagged("healing");
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Parameter", false, (feature) => {
					return feature.tagged("parameter");
				}),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

class Adjutant extends Feature {

	static kind    = "adjutants";
	static DEFAULT = "No Adjutant";

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);

		this.type   = "Adjutant";
		this.gambit = (
			template.gambit
				? new Gambit(template.gambit, compiler, predicator, marker)
				: Gambit.EMPTY
		);

		this.reactions = template.reactions || [];

		if (new.target === Adjutant) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Reaction"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Follow-Up (Magic)", false, (feature) => {
					return feature.reaction == "Follow-Up (Magic)";
				}),
				new Filter.Toggle("Follow-Up (Strength)", false, (feature) => {
					return feature.reaction == "Follow-Up (Strength)";
				}),
				new Filter.Toggle("Follow-Up (Either)", false, (feature) => {
					return feature.reaction == "Follow-Up (Either)";
				}),
				new Filter.Toggle("Guard", false, (feature) => {
					return feature.reaction == "Guard";
				}),
				new Filter.Toggle("Heal", false, (feature) => {
					return feature.reaction == "Heal";
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

class Gambit extends Action {

	static kind = "gambits";

	getVariableName(key) {
		return `battalion|modifier|${key}`;
	}

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);

		if (this.name.includes("Training"))
			this.affects.add("Training");
		if (this.name.includes("Outfitting"))
			this.affects.add("Outfitting");

		this.affects.add("gambits");

		if (new.target === Gambit) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {
		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}
		return `${this.name} (${this.modifier("cap")})`;
	}

	body(dead=false) {
		
		let   tags = 0;
		const info = [];

		const tagtip = ((tag, text) => {

			if (!this.tagged(tag)) return;

			const name = capitalize(tag);

			info.push(element(
				"span",
				dead ? name       : tooltip(name, text),
				dead ? "computed" : "datum"
			));
			tags += 1;
		});

		tagtip("structure", wrap(
			"Structure gambits act like passive abilities and ",
			"multiple may be active at one time."
		));

		tagtip("measured", wrap(
			"Measured gambits cannot be extra actions."
		));

		tagtip("adjutant", wrap(
			"Adjutant gambits are granted by equipped adjutants."
		));

		if (!this.tagged("structure")) info.push(
			element("span",
				["AoE:\xA0", element("span", this.aoe, "computed")]
			)
		);

		if (info.length) return element("div", [
			delimit(",\xA0", info),
			tags ? element("br") : "\xA0",
			super.body(dead),
		]);

		return super.body(dead);
	}

	blurb() {

		const mods = [];

		if (this.price) {
			mods.push(`${this.price}G`);
		}

		const info = [];

		const tagtip = ((tag) => {
			if (!this.tagged(tag)) return;
			const name = capitalize(tag);
			info.push(name);
		});

		tagtip("structure");

		tagtip("measured");

		tagtip("adjutant");

		if (!this.tagged("structure"))
			info.push(`AoE:\xA0${this.aoe}`);

		for (let key in this.modifiers) {

			// if (Feature.MODEXCLUDE.has(key)) continue;

			if (key == "size") continue;

			const value = this.modifier(key);
			const isnum = (typeof this.modifiers[key] == "number");

			if (isnum && value == 0) continue;

			const mark  = (isnum ? "" : "*");

			mods.push(`${capitalize(key)}:\xA0${value}${mark}`);
		}

		return [
			this.title(), "\n",
			info.join(",\xA0"), "\n",
			mods.join(" "), mods.length ? "\n" : "",
			this.marker.toText(this),
			"\nUsage Requirements\n",
			Requirements.toText(this.requires),
		].join("");
	}

	html() {

		const mods = [];

		if (this.price) {
			mods.push(`${this.price}G`);
		}

		const info = [];

		const tagtip = ((tag) => {
			if (!this.tagged(tag)) return;
			const name = capitalize(tag);
			info.push(name);
		});

		tagtip("structure");

		tagtip("measured");

		tagtip("adjutant");

		if (!this.tagged("structure"))
			info.push(`AoE: ${this.aoe}`);

		for (let key in this.modifiers) {

			// if (Feature.MODEXCLUDE.has(key)) continue;

			if (key == "size") continue;

			const value = this.modifier(key);
			const isnum = (typeof this.modifiers[key] == "number");

			if (isnum && value == 0) continue;

			const mark  = (isnum ? "" : "*");

			mods.push(`${capitalize(key)}:&nbsp;${value}${mark}`);
		}

		return [
			"<b>", this.title(), "</b><br />",
			info.join(",&nbsp;"), "<br />",
			mods.join(" "), mods.length ? "<br />" : "",
			this.marker.toHTML(this),
			"<br /><b>Usage Requirements</b><br />",
			Requirements.toHTML(this.requires)
		].join("");
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Feature Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Structure", false, (feature) => {
					return feature.tagged("structure");
				}),
				new Filter.Toggle("Measured", false, (feature) => {
					return feature.tagged("measured");
				}),
				new Filter.Toggle("Other", false, (feature) => {
					return !feature.tagged("structure") && !feature.tagged("measured");
				}),

				Filter.Group.END,

				element("br"),

				new Filter.Toggle("Costs 0 EP, Not Structure", false, (feature) => {
					return feature.modifier("epcost") == 0 && !feature.tagged("structure");
				}),

				element("br"), element("strong", "Capacity Cost"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("0", false, (feature) => {
					return feature.modifier("cap") == 0;
				}),
				new Filter.Toggle("1", false, (feature) => {
					return feature.modifier("cap") == -1;
				}),
				new Filter.Toggle("2", false, (feature) => {
					return feature.modifier("cap") == -2;
				}),
				new Filter.Toggle("3", false, (feature) => {
					return feature.modifier("cap") == -3;
				}),
				new Filter.Toggle("4", false, (feature) => {
					return feature.modifier("cap") == -4;
				}),
				new Filter.Toggle("5", false, (feature) => {
					return feature.modifier("cap") == -5;
				}),
				new Filter.Toggle("6", false, (feature) => {
					return feature.modifier("cap") == -6;
				}),
				new Filter.Toggle("+", false, (feature) => {
					return feature.modifier("cap") <= -7;
				}),

				Filter.Group.END,

				element("br"), element("strong", "Rank"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("S", false, (feature) => {
					return feature.requires.symbols.has("S");
				}),
				new Filter.Toggle("A", false, (feature) => {
					return feature.requires.symbols.has("A");
				}),
				new Filter.Toggle("B", false, (feature) => {
					return feature.requires.symbols.has("B");
				}),
				new Filter.Toggle("C", false, (feature) => {
					return feature.requires.symbols.has("C");
				}),
				new Filter.Toggle("D", false, (feature) => {
					return feature.requires.symbols.has("D");
				}),
				new Filter.Toggle("E", false, (feature) => {
					return feature.requires.symbols.has("E");
				}),
				element("br"),
				new Filter.Toggle("S+", false, (feature) => {
					return feature.requires.symbols.has("S+");
				}),
				new Filter.Toggle("A+", false, (feature) => {
					return feature.requires.symbols.has("A+");
				}),
				new Filter.Toggle("B+", false, (feature) => {
					return feature.requires.symbols.has("B+");
				}),
				new Filter.Toggle("C+", false, (feature) => {
					return feature.requires.symbols.has("C+");
				}),
				new Filter.Toggle("D+", false, (feature) => {
					return feature.requires.symbols.has("D+");
				}),
				new Filter.Toggle("E+", false, (feature) => {
					return feature.requires.symbols.has("E+");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Training"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.requires.symbols.has("Axes");
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.requires.symbols.has("Swords");
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.requires.symbols.has("Lances");
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.requires.symbols.has("Bows");
				}),
				new Filter.Toggle("Mighty Fist", false, (feature) => {
					return feature.requires.symbols.has("Mighty Fist");
				}),
				new Filter.Toggle("Mystic Fist", false, (feature) => {
					return feature.requires.symbols.has("Mystic Fist");
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.requires.symbols.has("Faith");
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.requires.symbols.has("Reason");
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.requires.symbols.has("Guile");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Outfitting"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Armor", false, (feature) => {
					return feature.requires.symbols.has("Armor");
				}),
				new Filter.Toggle("Cavalry", false, (feature) => {
					return feature.requires.symbols.has("Cavalry");
				}),
				new Filter.Toggle("Flying", false, (feature) => {
					return feature.requires.symbols.has("Flying");
				}),
				new Filter.Toggle("Infantry", false, (feature) => {
					return feature.requires.symbols.has("Infantry");
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

class Battalion extends Feature {

	static kind    = "battalions";
	static DEFAULT = "Alone";

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);

		this.price   = template.price  || 0;
		this.rank    = template.rank   || "E";
		this.growths = Object.freeze(template.growths || {});
		this.gambit  = template.gambit ? new Gambit(template.gambit) : null;

		if (new.target === Battalion) {
			Object.freeze(this);
		}
	}

	/**
	 * Get the value of this feature's growth modifier for a statistic
	 * @param {string} stat - name of the stat to get the growth modifier for
	 * @returns {number} the growth modifier for the stat, or 0 if none exists
	 */
	growth(stat) {
		return this.growths[stat] || 0;
	}

	body() {
		
		const b = this;
		const g = this.gambit;

		return (
			`${b.rarity} Battalion [${b.type}]<br />`
				+ `(${b.requires} - Costs ${b.price})\n`
				+ `${g.title()}:\n${g.body()}`
		);
	}

	static MODEXCLUDE = new Set(["contract", "mor", "cap", "total", "auto", "plu"]);

}

class Attribute extends Action {

	static kind = "attributes";
	static DEFAULT = "";

	getVariableName(key) {
		return `item|attributes|${key}`;
	}

	constructor(template, compiler, predicator, marker) {
		super(template, compiler, predicator, marker);

		this.price  = template.price || 0;
		this.rank   = template.rank  || 0;

		if (template.mttype != "else")
			this.affects.add("item|total|mttype");

		if (new.target === Attribute) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {

		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		return `${this.name} (Rank +${this.rank}) `;
	}

	/* uninhereit the body method back to super.super.body */
	body = Feature.prototype.body;

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Campaign"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("All", true, (feature) => {
					return (
						!feature.tagged("FbF")
							&&
						!feature.tagged("CoA")
							&&
						!feature.tagged("FE3H")
					);
				}),
				new Filter.Toggle("FbF", false, (feature) => {
					return feature.tagged("FbF");
				}),
				new Filter.Toggle("CoA", false, (feature) => {
					return feature.tagged("CoA");
				}),
				new Filter.Toggle("FE3H", false, (feature) => {
					return feature.tagged("FE3H");
				}),

				Filter.Group.END,

				element("br"), element("strong", "For"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Axes", false, (feature) => {
					return feature.tagged("for axes");
				}),
				new Filter.Toggle("Swords", false, (feature) => {
					return feature.tagged("for swords");
				}),
				new Filter.Toggle("Lances", false, (feature) => {
					return feature.tagged("for lances");
				}),
				new Filter.Toggle("Bows", false, (feature) => {
					return feature.tagged("for bows");
				}),

				element("br"),

				new Filter.Toggle("Brawl", false, (feature) => {
					return feature.tagged("for brawl");
				}),
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.tagged("for faith");
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.tagged("for reason");
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.tagged("for guile");
				}),

				element("br"),

				new Filter.Toggle("Shield", false, (feature) => {
					return feature.tagged("for shield");
				}),
				new Filter.Toggle("Stone", false, (feature) => {
					return feature.tagged("for stone");
				}),
				new Filter.Toggle("Other", false, (feature) => {
					return feature.tagged("for other");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Rank Increase"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("0", false, (feature) => {
					return feature.rank == 0;
				}),
				new Filter.Toggle("1", false, (feature) => {
					return feature.rank == 1;
				}),
				new Filter.Toggle("2", false, (feature) => {
					return feature.rank == 2;
				}),
				new Filter.Toggle("3", false, (feature) => {
					return feature.rank == 3;
				}),
				new Filter.Toggle("4", false, (feature) => {
					return feature.rank == 4;
				}),

				Filter.Group.END,

				element("br"), element("strong", "Effect"), element("br"),

				new Filter.Toggle("Effective", false, (feature) => {
					return feature.tagged("effective");
				}),
				new Filter.Toggle("Cost", false, (feature) => {
					return feature.tagged("cost");
				}),
				new Filter.Toggle("Penalty", false, (feature) => {
					return feature.tagged("penalty");
				}),

				element("br"),

				
				new Filter.Toggle("Structure", false, (feature) => {
					return feature.tagged("structure");
				}),
				new Filter.Toggle("Conjure", false, (feature) => {
					return feature.tagged("conjure");
				}),
				new Filter.Toggle("Treatment", false, (feature) => {
					return feature.tagged("treatment");
				}),

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Purchasable", false, (feature) => {
					return feature.price > 0;
				}),

				element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}
}

class Condition extends Feature {

	static kind = "conditions";
	static DEFAULT = "";

	title() {
		const types = [];
		if (this.tagged("bonus"))   types.push("Bonus");
		if (this.tagged("penalty")) types.push("Penalty");
		return ` ${this.name} (${types.join(", ")})`;
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		const filter = new Filter.Select({
			value   : this.DEFAULT,
			trigger : trigger,
			model   : this,
			options : definitions[this.kind].map(cls => 
				element("option", {
					attrs   : {value: cls.name},
					content : cls.name,
				})
			),
			content : [

				element("strong", "Type"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Bonus", false, (feature) => {
					return feature.tagged("bonus");
				}),
				new Filter.Toggle("Penalty", false, (feature) => {
					return feature.tagged("penalty");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Effect"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Modifier", false, (feature) => {
					const mods = feature.modifiers;
					for (let key in mods) {
						if (mods[key]) return true;
					}
					return false;
				}),

				new Filter.Toggle("Movement", false, (feature) => {
					return feature.tagged("movement");
				}),

				new Filter.Toggle("Rolls", false, (feature) => {
					return feature.tagged("rolls");
				}),

				new Filter.Toggle("Target", false, (feature) => {
					return feature.tagged("target");
				}),

				new Filter.Toggle("Damage", false, (feature) => {
					return feature.tagged("damage");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Mechanics"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Parameter", false, (feature) => {
					return feature.tagged("parameter");
				}),

				new Filter.Toggle("Merge", false, (feature) => {
					return feature.tagged("merge");
				}),

				element("br"),

				new Filter.Toggle("Interaction", false, (feature) => {
					return feature.tagged("interaction");
				}),

				Filter.Group.END,

				element("br"),
				element("strong", `Version ${Version.CURRENT}`),
				element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("New", false, (feature) => {
					return feature.tagged("new");
				}),

				new Filter.Toggle("Changed", false, (feature) => {
					return feature.tagged("changed");
				}),

				new Filter.Toggle("Other", false, (feature) => {
					return (
						!feature.tagged("new")
							&&
						!feature.tagged("changed")
					);
				}),

				Filter.Group.END,

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
				}),

				new Filter.Toggle("Depricate", true, (feature) => {
					return !feature.tagged("depricated");
				}),

				element("br"),

				element("button", {
					class   : ["simple-border"],
					content : "Reset Filter",
					attrs   : {
						onclick: (() => void filter.reset())
					}
				})
			],
		});

		return filter;
	}

}

Feature.SUBCLASSES = [
	Ability, Item, Art, Equipment, Class, Attribute, Condition,
	Tile, Battalion, Adjutant, Preset, Gambit
];

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = {
		Ability, Adjutant, Art, Attribute, Battalion, Class, Condition,
		Equipment, Feature, Gambit, Item, Preset, Tile 
	};
}

/* exported
	Ability, Adjutant, Art, Attribute, Battalion, Class, Condition, Equipment,
	Feature, Gambit, Item, Preset, Tile
*/

