/**
 * A module that implements the main data model for the sheet
 * @module feature
 */

/* global Expression */
/* global Polish */
/* global Macros */

/* global ConfigEnum */
/* global Filter */
/* global wrap */
/* global ellipse */
/* global uniqueLabel */

/* global element */
/* global tooltip */
/* global delimit */
/* global capitalize */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */

class ModWidget {

	constructor(modifier, sign, tool_tip) {

		this.tooltip  = tool_tip;
		this.modifier = modifier;
		this.sign     = sign;

		this._runtext = document.createTextNode("");
		this._mactext = document.createTextNode("");

		this._base    = element("span", {
			class   : ["computed"],
			content : (!tool_tip
				? [this._runtext, element("sup", "*")]
				:  this._runtext
			),
			attrs   : {
				onpointerenter: (() => {
					this.refresh();
				})
			}
		});

		if (!tool_tip) {
			this.root = this._base;
			this.refresh();
			return;
		}

		const code = Expression.highlight(this.modifier.source, true);

		this.root = tooltip(this._base, [

			"Value updates on mouse over.",

			element("br"), element("br"),

			element("strong", "Calculator Expression"), element("br"),

			element("div", code, "calc-code"), element("br"),

			element("strong", "Roll20 Macro"), element("br"),

			element("div", this._mactext, "calc-code"),
		]);
		
		this.refresh();
	}

	refresh() {
		const value     = this.modifier.execute();
		const sign      = (this.sign && value >= 0 ? "+" : "");
		this._runtext.data = sign + value;
		this._mactext.data = this.modifier.macrogen();
	}
}

class ReqWidget {

	constructor(predicate, title, body, dead) {

		this.predicate = predicate;
		this.title     = title;

		this._runtext = document.createTextNode("");

		this._base    = element("span", {
			class   : ["computed"],
			content : this._runtext,
			attrs   : {
				onpointerenter: (() => {
					this.refresh();
				})
			}
		});

		if (dead) {
			this.root = this._base;
			this.refresh();
			return;
		}

		this.root = tooltip(this._base, [

			"Value updates on mouse over.",

			element("br"), element("br"),

			body,
		]);
		
		this.refresh();
	}

	refresh() {
		const result       = this.predicate.exec(this.predicate.context).boolean;
		this._runtext.data = `${this.title}${(result ? "Pass" : "Fail")}`;

		const cl = this._base.classList;

		if (result) {
			if (cl.contains("computed")) {
				cl.remove("computed");
				cl.add("datum");
			}
		} else {
			if(cl.contains("datum")) {
				cl.remove("datum");
				cl.add("computed");
			}
		}
	}
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

	/**
	 * Create a feature from a template object
	 */
	constructor(template, compiler, predicator) {
		this.name         = template.name || "";
		this.description  = template.description || "";
		this.type         = template.type || "";
		this.tags         = Object.freeze(template.tags || Feature.EMPTY_OBJECT);
		this.comment      = template.comment || "No comment.";
		this.hidden       = template.hidden || false;
		this.rows         = [];
		this.dependancies = new Set();

		// parse file-local template definitions if present
		const locals = new Set();

		if (template.locals) {
			
			const defines   = compiler.macros;

			for (let each of template.locals) {
				const string      = each.join("\n");
				const [name, tmp] = Expression.Template.parse(string, defines);
				const id          = `locals|${name}`;
				defines[id]       = tmp;
				locals.add(id);
			}
		}

		// function to compile dynamic modifiers
		const compile = (value, key=null) => {
			
			// join an array into a string
			if (value instanceof Array) {
				value = value.join(" ");
			}

			// see if we need to compile an expression
			if (typeof value == "number") {
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
				const expression = compiler.compile(value);

				// add any dependacies to this feature's dependancy list
				for (let symbol of expression.symbols) {
					this.dependancies.add(symbol);
				}

				// warn in console about any potential circular dependancies
				if (key && expression.symbols.has(key)) {
					console.warn(this.name, expression,
						"Potential circular dependacy detected."
					);
				}

				return expression;

			} catch (error) {
				if (error instanceof Expression.CompilationError) {
					console.error(this.name, value);
				}
				throw error;
			}
		};

		if ("rows" in template) {
			for (let i = 0; i < template.rows.length; ++i) {
				const line = template.rows[i];
				this.rows.push(
					new Macros.CustomRow(
						line.name || this.name,
						compile(line.when || "1", i),
						compile(line.expr || "0", i),
						line.roll || false,
					)
				);
			}
		}
		
		this.requires     = (predicator
			? predicator.compile(template.requires || "None")
			: Polish.compile("")
		);

		this.tags         = new Set(template.tags || []);

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
				stats[key] = compile(stats[key], key);
			}	

			this[attribute.key] = Object.freeze(stats);
		}

		// delete any local templates that were created since we're done
		if (locals.size > 0) {
			for (let each of locals) {
				delete compiler.macros[each];
			}
		}
		
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
	static setLookupByName(iterable, compiler, predicator) {

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
				const instance = new this(template, compiler, predicator);
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

	static where(predicate) {
		
		const features = [];
		
		for (let feature of this.byName.values()) {
			if (predicate(feature)) features.push(feature);
		}

		return features;
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

	static MODEXCLUDE = new Set(["tiles", "tp", "sp", "tpcost", "spcost", "epcost", "cap", "minrng", "maxrng"]);

	/**
	 * Generate a feature's {@link CategoryElement} description
	 * @return {string} description for this item's {@link CategoryElement}
	 */
	body(dead=false) {
		// return this.description;

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

		for (let key in this.modifiers) {

			if (Feature.MODEXCLUDE.has(key)) continue;

			const value = this.modifierForUI(key, true, dead);
			if (value) mods.push(span(capitalize(key), ":\xA0", value));
		}

		const tiles = this.modifierForUI("tiles", true, dead);
		if (tiles) mods.push(span("Tiles:\xA0", tiles));

		const maxrng = this.modifierForUI("maxrng", true, dead);
		if (maxrng) mods.push(span("Max Range:\xA0", maxrng));

		const minrng = this.modifierForUI("minrng", true, dead);
		if (minrng) mods.push(span("Min Range:\xA0", minrng));

		const tp = this.modifierForUI("tp", true, dead);
		if (tp) mods.push(span("Max TP:\xA0", tp));

		const sp = this.modifierForUI("sp", true, dead);
		if (sp) mods.push(span("Max SP:\xA0", sp));

		const tpcost = this.modifierForUI("tpcost", true, dead);
		if (tpcost) mods.push(span("TP Cost:\xA0", tpcost));

		const spcost = this.modifierForUI("spcost", true, dead);
		if (spcost) mods.push(span("SP Cost:\xA0", spcost));

		return element("span", [
			// "Requires: ", Polish.highlight(String(this.requires)), "\n",
			delimit(" ", mods),
			mods.length ? element("br") : "",
			dead
				? hitip.dead(this.description)
				: hitip.link(this.description),
			// this.requires.source ? element("div", [
			// 	element("strong", "Usage Requirements"),
			// 	hitip.toul(this.requires.ast, dead),
			// ]) : ""
			this.requires.source ? hitip.toul(this.requires, dead) : ""
		]);
	}

	blurb() {

		const mods = [];

		if (this.price) {
			mods.push(`${this.price}G`);
		}

		for (let key in this.modifiers) {

			// if (Feature.MODEXCLUDE.has(key)) continue;

			const value = this.modifier(key);
			const isnum = (typeof this.modifiers[key] == "number");

			if (isnum && value == 0) continue;

			const mark  = (isnum ? "" : "*");

			mods.push(`${capitalize(key)}:\xA0${value}${mark}`);
		}

		return [
			this.title(), "\n",
			mods.join(" "), mods.length ? "\n" : "",
			hitip.text(this),
			"\nUsage Requirements\n",
			hitip.totl(this.requires.ast),
		].join("");
	}

	/**
	 * Get the value of this feature's modifier for a statistic
	 * @param {string} stat - name of the stat to get the modifier for
	 * @returns {number} the modifier for the stat, or 0 if none exists
	 */
	modifier(stat, env) {
		return Expression.evaluate(this.modifiers[stat] || 0, env);
	}

	modifierForUI(stat, sign=false, dead=false, range=false) {

		/* test explicitly for membership */
		if (!(stat in this.modifiers)) return 0;

		/* then handle other number cases*/
		const value    = this.modifier(stat);
		const modifier = this.modifiers[stat];

		/* it it's a number just give a static html */
		if (typeof modifier == "number") {
			
			/* we don't care to display these */
			if (!range && value == 0) return 0;

			return element("span", {
				class   : ["computed"],
				content : [
					(sign && value >= 0) ? "+" : "",
					String(value)
				]
			});
		}

		/* handle an expression by returning a ModWidget */
		return (new ModWidget(modifier, sign, !dead)).root;
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

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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
			],
		});
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
class AttackFeature extends Feature {

	/**
	 * Create an AttackFeature from a template object
	 */
	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);
		this.rank    = template.rank   || "E";
		this.mttype  = template.mttype || 0;
		this.price   = template.price  || 0;

		// If this is not a super() call, freeze the object.
		if (new.target === AttackFeature) {
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

		// const cap = this.modifierForUI("cap", true, dead);
		// if (cap) mods.push([cap, element("sub", "C", "computed")]);

		const tpcost = this.modifierForUI("tpcost", false, dead);
		if (tpcost) mods.push([tpcost, element("sub", "TP", "computed")]);

		const spcost = this.modifierForUI("spcost", false, dead);
		if (spcost) mods.push([spcost, element("sub", "SP", "computed")]);

		const epcost = this.modifierForUI("epcost", false, dead);
		if (epcost) mods.push([epcost, element("sub", "EP", "computed")]);

		for (let key in this.modifiers) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			const value = this.modifierForUI(key, true, dead);

			if (value) {
				mods.push(span(capitalize(key), ":\xA0", value));
			}
		}

		const tiles = this.modifierForUI("tiles", false, dead);
		if (tiles) mods.push(span("Tiles:\xA0", tiles));

		const min = this.modifier("minrng");
		const max = this.modifier("maxrng");

		if (min != max) {
			const min = this.modifierForUI("minrng", false, dead, true);
			const max = this.modifierForUI("maxrng", false, dead, true);
			mods.push(span("Range:\xA0", min, "\xA0-\xA0", max));
		} else if (min != 0) {
			mods.push(span("Range:\xA0", this.modifierForUI("maxrng", false, dead)));
		}

		const tp = this.modifier("tp");

		if (tp) {
			const tp = this.modifierForUI("tp", false, dead);
			mods.push(span("Max TP:\xA0", tp));
		}

		const sp = this.modifier("sp");

		if (sp) {
			const sp = this.modifierForUI("sp", false, dead);
			mods.push(span("Max SP:\xA0", sp));
		}

		return element("span", [
			delimit(" ", mods),
			mods.length ? element("br") : "",
			hitip[dead ? "dead" : "link"](this.description),
			this.requires.source ? hitip.toul(this.requires, dead) : ""
		]);
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute, additional
 * optional damage scaling based off of a stat, and boolean tags.
 */
class Art extends AttackFeature {

	static kind = "arts";

	static DEFAULT = "";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);

		let value = template.compatible || "False";
		if (value instanceof Array) value = value.join("\n");

		this.compatible = value;

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

		return `${this.name} (${kind}: ${this.type} ${this.rank})`;
	}

	static compatibles(object) {

		const relative = (symbol, func) => {
			return (op, ...args) => {
				if (args.length < 2) throw Error(
					`Expected two or more arguments for '${symbol}' predicate.`
				);

				let x = Number(args.pop());
				
				while (args.length) {
					const y = Number(args.pop());
					if (!func(x, y)) return false;
					x = y;
				}
				return true;
			};
		};

		return {
			"All": (op, ...args) => args.reduce((x, y) => x && y),
			"Any": (op, ...args) => args.reduce((x, y) => x || y),
			"Not": (op, arg) => !arg,
			"Skill": (op, ...args) => {
				for (let arg of args) {
					if (object.target.type == arg) return true;
				}
				return false;
			},
			"Name": (op, ...args) => {
				for (let arg of args) {
					if (object.target.name == arg) return true;
				}
				return false;
			},
			"Tag": (op, ...args) => {
				let has = true;
				for (let arg of args) {
					has = has && object.target.tagged(arg);
				}
				return has;
			},
			"Element": (op, ...args) => {
				for (let arg of args) {
					if (object.target.description.includes(arg)) return true;
				}
				return false;
			},
			"Requires": (op, ...args) => {
				for (let arg of args) {
					if (object.target.requires.symbols.has(arg)) return true;
				}
				return false;
			},
			"Modifier": (op, field) => {
				return object.target.modifier(field);
			},

			">": relative(">", (x, y) => x > y),
			"<": relative("<", (x, y) => x < y),
			"==": relative("==", (x, y) => x == y),
			"<>": relative("<>", (x, y) => x != y),
			">=": relative(">=", (x, y) => x >= y),
			"<=": relative("<=", (x, y) => x <= y),
			
			"Text": (op, ...args) => {
				for (let arg of args) {
					if (object.target.description.includes(arg)) return true;
				}
				return false;
			},
			"AoE": (op, ...args) => {
				for (let arg of args) {
					if (object.target.aoe == arg) return true;
				}
				return false;
			},
			"True": (op, ...args) => true,
			"False": (op, ...args) => false,
			"Match": (op, ...args) => {

				// If odd, use the last expression as a default.
				const odd   = args.length & 1;
				const other = odd ? Boolean(args.pop()) : false;

				// Process the other arguments as pairs.
				for (let [cls, val] of args.chunk(2)) {
					
					const name = object.target.constructor.name;

					// Special case for arts specifically.
					if (name == "Art") {
						// target is an art, but is it tactical?
						const tactic = object.target.isTactical();
						if (tactic ? cls == "Tactic" : cls == "Art")
							return val;

						continue; // Skip the normal case.
					}

					// Normal case, just check the type.
					if (name == cls) return val;
				}

				return other;
			}
		};
	}

	compatible(feature) {
		if (
			!(feature instanceof Item)
				&&
			!(feature instanceof Gambit)
				&&
			!(feature instanceof Art)
		) {
			throw new Error(
				"expected Item, Art, or Gambit as argument"
			);
		}


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

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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

				new Filter.Toggle("Combat", false, (feature) => {
					return !feature.tagged("tactical");
				}),
				new Filter.Toggle("Tactical", false, (feature) => {
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

				new Filter.Toggle("Wall", false, (feature) => {
					return feature.tagged("wall");
				}),

				// element("br"),

				new Filter.Toggle("Scales", false, (feature) => {
					return feature.tagged("scales");
				}),

				new Filter.Toggle("Combo", false, (feature) => {
					return feature.tagged("combo");
				}),

				// new Filter.Toggle("Rally", false, (feature) => {
				// 	return feature.tagged("rally");
				// }),

				new Filter.Toggle("Movement", false, (feature) => {
					return feature.tagged("movement");
				}),

				new Filter.Toggle("Order", false, (feature) => {
					return feature.tagged("order");
				}),

				new Filter.Toggle("Variant", false, (feature) => {
					return feature.tagged("variant");
				}),

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Class", false, (feature) => {
					return feature.requires.symbols.has("Class");
				}),

				new Filter.Toggle("Hero's Relic", false, (feature) => {
					return feature.tagged("relic");
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
			],
		});
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute
 */
class Item extends AttackFeature {

	static kind = "items";

	static DEFAULT = "Unarmed";

	/**
	 * Generate a item's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {

		if (this.tagged("depricated")) {
			return `${this.name} (DEPRICATED)`;
		}

		return this.name + " (" + this.type + " " + this.rank + ") ";
	}

	static TYPE = new ConfigEnum(
		0, "Other", ["Other"].concat(definitions.skills)
	);

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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
				element("strong", "Skill"), element("br"),

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

				new Filter.Toggle("Reaction", false, (feature) => {
					return feature.tagged("reaction");
				}),

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Sacred", false, (feature) => {
					return feature.tagged("sacred");
				}),
				new Filter.Toggle("Hero's Relic", false, (feature) => {
					return feature.tagged("relic");
				}),
				new Filter.Toggle("Secret", false, (feature) => {
					return feature.tagged("secret");
				}),

				element("br"),

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
			],
		});
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
	constructor(template, compiler, predicator) {
		super(template, null, predicator);
		this.abilities = template.abilities || [];
		this.arts      = template.arts || [];
		this.growths   = Object.freeze(template.growths || {});
		this.tier      = template.tier    || "Starting";

		this.default_base    = template.default_base;
		this.default_preset  = template.default_preset;
		this.default_mainarm = template.default_mainarm;
		this.default_sidearm = template.default_sidearm;

		this.mount = (template.mount
			? ("name" in template.mount
				? new Feature(template.mount)
				: new Feature({name: "new", modifiers: template.mount}))
			: null
		);

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

	modifierForUI(stat, sign=false, dead=false) {

		/* test explicitly for membership */
		if (!(stat in this.modifiers)) return 0;

		/* then handle other number cases*/
		const value = (
			this.modifier(stat)
				+
			(this.hasMount() && stat in this.mount.modifiers
				? this.mount.modifiers[stat]
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

	growthForUI(stat, sign=false, dead=false) {

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
		return Boolean(this.mount);
	}

	/**
	 * Generate a feature's {@link CategoryElement} description
	 * @return {string} description for this item's {@link CategoryElement}
	 */
	body(dead=false, table=true, center=true) {

		const rows = (
			["hp", "spd", "str", "mag", "dex", "lck", "def", "res"]
				.map(key => 
					[
						element("td", key.toUpperCase()),
						element("td", this.modifierForUI(key, false, dead)),
						element("td", [
							element("span", "(", "punctuation"),
							this.growthForUI(key, false, dead),
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
			element("td", this.modifierForUI("mov", false, dead)),
			element("td"),
			element("td"),
		);

		return element("span", [
			element("em",
				`${this.tier}, ${Array.isArray(this.type) ? this.type.join(", ") : this.type}`
			), element("br"),
			dead
				? hitip.dead(this.description)
				: hitip.link(this.description),
			table
				? element("table", element("tbody", rows), center ? "center-table" : undefined)
				: "",
			this.requires.source ? hitip.toul(this.requires, dead) : ""
		]);
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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
				new Filter.Toggle("Authority", false, (feature) => {
					return feature.requires.symbols.has("Authority");
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
			],
		});
	}
}

/**
 * A Feature subclass to represent abilities.
 */
class Ability extends Feature {

	static kind = "abilities";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);
		// this.weapon = template.weapon || "";

		if (new.target === Ability) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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

				element("strong", "Source"), element("br"),

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

				element("br"),

				new Filter.Toggle("In Combat", false, (feature) => {
					return feature.tagged("in combat");
				}),
				new Filter.Toggle("Barrier", false, (feature) => {
					return feature.requires.symbols.has("Barrier");
				}),

				Filter.Group.END,

				element("br"), element("strong", "Crests"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Major", false, (feature) => {
					return feature.tagged("major");
				}),
				new Filter.Toggle("Minor", false, (feature) => {
					return feature.tagged("minor");
				}),

				Filter.Group.END,

				new Filter.Toggle("None", true, (feature) => {
					return !feature.tagged("crest");
				}),

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
			],
		});
	}
}

/**
 * A Feature subclass to repersent equipment
 */
class Equipment extends Feature {

	static kind = "equipment";
	static DEFAULT = "";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);
		this.price = template.price || "";

		if (new.target === Equipment) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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
				element("strong", "Item Type"), element("br"),

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

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Group(Filter.Group.OR, false),

				new Filter.Toggle("Sacred", false, (feature) => {
					return feature.tagged("sacred");
				}),
				new Filter.Toggle("Hero's Relic", false, (feature) => {
					return feature.tagged("relic");
				}),
				element("br"),
				new Filter.Toggle("Secret", false, (feature) => {
					return feature.tagged("secret");
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
			],
		});
	}
}

/**
 * A Feature subclass to represent map tiles
 */
class Tile extends AttackFeature {

	static kind = "tiles";
	static DEFAULT = "";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);
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

		return new Filter.Select({
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
			],
		});
	}
}

class Adjutant extends Feature {

	static kind    = "adjutants";
	static DEFAULT = "No Adjutant";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);

		this.type   = "Adjutant";
		this.gambit = (
			template.gambit
				? new Gambit(template.gambit, compiler, predicator)
				: Gambit.EMPTY
		);

		this.reactions = template.reactions || [];

		if (new.target === Adjutant) {
			Object.freeze(this);
		}
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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
			],
		});
	}
}

class Gambit extends AttackFeature {

	static kind = "gambits";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);

		this.aoe = template.aoe || "none";

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
			hitip.text(this),
			"\nUsage Requirements\n",
			hitip.totl(this.requires.ast),
		].join("");
	}

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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

				element("strong", "Feature Type"), element("br"),

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

				// element("br"), element("strong", "Family"), element("br"),

				// new Filter.Group(Filter.Group.OR, false),

				
				// new Filter.Toggle("", false, (feature) => {
				// 	return feature.tagged("action");
				// }),
				// new Filter.Toggle("Aura", false, (feature) => {
				// 	return feature.tagged("aura");
				// }),
				// new Filter.Toggle("Breach", false, (feature) => {
				// 	return feature.tagged("breach");
				// }),
				// new Filter.Toggle("Damage", false, (feature) => {
				// 	return feature.tagged("damage");
				// }),

				// Filter.Group.END,

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
			],
		});
	}
}

class Battalion extends Feature {

	static kind    = "battalions";
	static DEFAULT = "Alone";

	constructor(template) {
		super(template);

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

class Attribute extends AttackFeature {

	static kind = "attributes";
	static DEFAULT = "";

	constructor(template, compiler, predicator) {
		super(template, compiler, predicator);

		this.price  = template.price || 0;
		this.rank   = template.rank  || 0;

		if (new.target === Ability) {
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

		return this.name + " (Rank +" + this.rank + ") ";
	}

	/* uninhereit the body method back to super.super.body */
	body = Feature.prototype.body;

	static select(trigger) {

		trigger = trigger || (() => {});

		return new Filter.Select({
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

				element("strong", "For"), element("br"),

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

				element("br"),

				new Filter.Toggle("Penalty", false, (feature) => {
					return feature.tagged("penalty");
				}),

				new Filter.Toggle("Conjure", false, (feature) => {
					return feature.tagged("conjure");
				}),

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

			],
		});
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

		return new Filter.Select({
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
				// new Filter.Toggle("Pure", false, (feature) => {
				// 	const bonus   = feature.tagged("bonus");
				// 	const penalty = feature.tagged("penalty");
				// 	return (
				// 		(bonus && !penalty)
				// 			||	
				// 		(!bonus && penalty)
				// 	);
				// }),

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
			],
		});
	}

}

Feature.SUBCLASSES = [
	Ability, Item, Art, Equipment, Class, Attribute, Condition,
	Tile, Battalion, Adjutant, Preset, Gambit
];

const hitip = (function() {

const HLREGEX = /(@){([^:]*):([^:]*):([^}]*)}/;

const LINK_DELIMITER = "||";

function parser(action, combine) {
	return function(string, data) {
		const tok   = string.split(HLREGEX).filter(x => x != null);
		const merge = [];

		for (let i = 0; i < tok.length; ++i) {
			if (tok[i] == "@") {
				try {
					const html = action(tok[++i], tok[++i], tok[++i], data);
					if (html) merge.push(html);
					continue;
				} catch (error) {
					console.error(string);
					throw error;
				}
			}
			merge.push(tok[i]);
		}

		return combine(merge);
	};
}

function deadfn(table, link, text) {

	/* special behavior for literal tooltips */
	if (table == "tooltip") {
		return element("span", link, "computed");
	}

	return element("span", text, "computed");
}

const dead = parser(deadfn, (merge) => element("span", merge));

const LOOKUP = new Map([
	[ "item"      , Item    ],
	[ "condition" , Condition ],
	[ "ability"   , Ability   ],
	[ "art"       , Art ],
	[ "attribute" , Attribute ],
	[ "tile"      , Tile      ],
	[ "equipment" , Equipment ],
	[ "class"     , Class     ],
	[ "gambit"    , Gambit    ],
	[ "adjutant"  , Adjutant  ],

	["", {
		get: function() {
			return this;
		},

		body: function() {
			return "This feature.";
		},

		select: function(trigger) {

			trigger = trigger || (() => {});

			return new Filter.Select({
				value   : this.DEFAULT,
				trigger : trigger,
				model   : this,
				options : [],
				content : [],
			});
		}
	}],

	["const", {

		features: (function() {

			const map = new Map();

			for (let key in definitions.tooltips) {
				map.set(key, {

					name: definitions.tooltips[key].name,

					text: definitions.tooltips[key].description.join(""),

					body: function() {
						return dead(this.text);
					}
				});
			}

			return map;
		})(),

		get: function(link) {

			if (!this.features.has(link)) {
				throw new ReferenceError(
					`tooltip constant text for ${link} is not defined`
				);
			}

			return this.features.get(link);
		},

		DEFAULT: "gbp",

		name: "Premade Tooltip",

		select: function(trigger) {

			trigger = trigger || (() => {});

			return new Filter.Select({
				value   : this.DEFAULT,
				trigger : trigger,
				model   : this,
				options : Object.keys(definitions.tooltips).map(cls => 
					element("option", {
						attrs   : {value: cls},
						content : cls,
					})
				),
				content : [],
			});
		}
	}],

	["tooltip", {

		text: "",

		get: function() {
			return this;
		},

		body: function() {
			return "If you see this, an error has occured!";
		},

		name: "Custom Tooltip",

		select: function(trigger) {
			trigger = trigger || (() => {});

			const text = element("input", {
				class : ["simple-border"],
				attrs : {
					"placeholder" : "text",
					"type"        : "text",
				}
			});

			/* this mimics a Filter.Select object */
			return {
				_select : text,
				root    : element("span", [
					tooltip(text, []),
				]),
			};
		}
	}],

	["style", {

		text: "",

		get: function() {
			return this;
		},

		body: function() {
			return "If you see this, an error has occured!";
		},

		name: "Text Style",

		select: function(trigger) {

			trigger = trigger || (() => {});

			const styles = ["bold", "italic", "underline"];

			return new Filter.Select({
				value   : this.DEFAULT,
				trigger : trigger,
				model   : this,
				options : styles.map(cls => 
					element("option", {
						attrs   : {value: cls},
						content : cls,
					})
				),
				content : [],
			});
		}

	}]

]);

function linkfn(table, link, text) {

	/* special behavior for literal tooltips */
	if (table == "tooltip") {
		return tooltip(element("span", link, "datum"), text);
	}

	/* special behavior for styles */
	if (table == "style") {

		const classes = link.split(LINK_DELIMITER);

		if (classes.length == 0) {
			console.error("style link is broken");
			return element("div", [
				element("strong", "Broken style.", "computed"),
				element("br"),
			]);
		}

		return element("span", {
			class   : link.split(LINK_DELIMITER),
			content : text || " ",
		});
	}

	/* otherwise do a lookup */
	const feature  = LOOKUP.get(table);

	if (feature === undefined) {
		throw new ReferenceError(
			`feature namespace '${table}' is not defined`
		);
	}

	const con  = [];
	const keys = link ? link.split(LINK_DELIMITER) : [text];

	let broken = false;

	for (let key of keys) {

		const instance = feature.get(key);

		if (Object.is(instance, feature.EMPTY)) {
			console.error(`feature link '${link || text}' broken`);
			con.push(element("div", [
				element("strong", `Broken feature link: ${key}`, "computed"),
				element("br"),
			]));
			broken = true;
			continue;
		}

		if (instance instanceof Feature && instance.tagged("depricated")) {
			console.error(`feature '${link || text}' is depricated`);
			con.push(element("div", [
				element("strong", `Depricated feature link: ${key}`, "computed"),
				element("br"),
			]));
			broken = true;
			continue;
		}

		con.push(
			element("div", [
				element("strong", instance.name), element("br"),
				instance.body(true)
			])
		);
	}

	const base = element("span", text, broken ? "computed" : "datum");
	return tooltip(base, delimit(() => element("hr"), con));
}

const link = parser(linkfn, (merge) => element("span", merge));

function textfn(table, link, text, userdata) {

	/* special behavior for literal tooltips */
	if (table == "tooltip") {
		return link;
	}

	/* omit the generic mechanics explainations */
	if (table == "const") {
		return text;
	}

	/* special behavior for style tooltips */
	if (table == "style") {
		return text; // TODO make this actually style the text in markdown
	}

	/* here we do the lookup */
	const feature  = LOOKUP.get(table);

	if (feature === undefined) {
		throw new ReferenceError(
			`feature namespace '${table}' is not defined`
		);
	}

	const con  = [];
	const keys = link ? link.split(LINK_DELIMITER) : [text];

	for (let key of keys.reverse()) {

		/* prevent unbounded recursion */
		if (userdata.set.has(key)) {
			con.push(text);
			continue;
		}

		const instance = feature.get(key);

		if (Object.is(instance, feature.EMPTY)) {
			console.error(`feature link '${key}' broken`);
			return text;
		}

		if (instance instanceof Feature && instance.tagged("depricated")) {
			console.error(`feature '${key}' is depricated`);
			return text;
		}

		userdata.set.add(key);
		const body = textp(instance.description, userdata);
		userdata.stack.push(`(${instance.name}) ${body}`);
		// userdata.set.delete(key);
	}

	return text;
}

const textp = parser(textfn, (merge) => merge.join(""));

function textwrapper(feature, set, join=true, named=false) {

	const [name, description] = (function() {
		if (feature instanceof Feature) {
			return [feature.name, feature.description];
		}

		if (feature instanceof Array && feature.length >= 2) {
			return feature;
		}

		throw new TypeError(
			`expected Feature or Array (length >= 2) but got '${feature}'`
		);
	})();

	const userdata = {
		"set"   : set || new Set([name]),
		"stack" : [],
	};

	const body = textp(description, userdata);
	userdata.stack.push(named ? `(${name}) ${body}` : body);

	const entries = userdata.stack.reverse();
	return join ? entries.join("\n") : entries;
}

const LISTPRED = new Set(["All", "Any"]);

function andblurb() {
	return link(LOOKUP.get("const").get("all").text);
}

function totl(node, top=true) {

	const fn   = node[0];
	const args = node.slice(1);

	if (top) {
		const list = LISTPRED.has(fn);
		return wrap(
			`Requires ${fn}\n`,
			list
				? args.map(e => `  * ${totl(e, false)}`).join("\n")
				: `  * ${totl(node, false)}`
		);
	}

	switch (fn) {

	case "All":
		return args.map(e => totl(e, false)).join(" and ");

	case "Any":
		return args.map(e => totl(e, false)).join(" or ");

	case "Required":
		return `${totl(args[0], false)} (required)`;

	case "Permission":
		return fn;

	case "Crest":
		return `Crest of ${args[0]}`;

	case "ClassType":
		return `${args[0]} Class`;

	case "Class":
		return `Class is ${args[0]}`;

	case "Item":
	case "Equipment":
		return `${args[0]} equipped`;

	default:
		return node.join(" ");
	}
}

function toul(node, dead=false, top=true) {

	if (top) {

		const ast = node.ast;

		const title = element("span", [
			element("strong", `Requires ${ast[0]} `),
			element("span", [
				element("strong", "("),
				(new ReqWidget(node, "", andblurb(), dead)).root,
				element("strong", ")"),
			])
		]);

		const body  = element("ul", {
			class    : ["compact-list"],
			content : LISTPRED.has(ast[0])
				? ast.slice(1).map(e => element("li", toul(e, dead, false)))
				: element("li", toul(ast, dead, false)),
		});

		return element("div", [title, body]);
	}

	const fn   = node[0];
	const args = node.slice(1);

	switch (fn) {

	case "All":
		return delimit(" and ",
			args.map(e => toul(e, dead, false))
		);

	case "Any":
		return delimit(" or ",
			args.map(e => toul(e, dead, false))
		);

	case "Required":
		return element("span",
			[toul(args[0], dead, false), " (required)"]
		);

	case "Permission":
		return element("strong", fn);

	case "Gambit":
		return element("span",
			[(dead ? deadfn : linkfn)("gambit", args[0], args[0]), element("strong", " equipped")]
		);

	case "Training": {
		const name = `${args[0]} Training`;
		return element("span",
			[(dead ? deadfn : linkfn)("gambit", name, args[0])]
		);
	}

	case "Outfitting": {
		const name = `${args[0]} Outfitting`;
		return element("span",
			[(dead ? deadfn : linkfn)("gambit", name, args[0])]
		);
	}
	
	case "Crest": {
		const name  = `Crest of ${args[0]}`;
		const major = `Major ${name}`;
		const minor = `Minor ${name}`;
		const func  = (dead ? deadfn : linkfn);
		return element("span", 
			element("strong", func("ability", `${major}||${minor}`, name))
		);
	}

	case "ClassType":
		return element("strong", [args[0], " Class"]);

	case "Class":
		return args.length >= 1 
			? element("strong", ["Class is ", args[0]])
			: element("strong", "Class");

	case "Item":
		return element("span",
			[(dead ? deadfn : linkfn)("item", args[0], args[0]), element("strong", " equipped")]
		);

	case "Equipment":
		return element("span",
			[(dead ? deadfn : linkfn)("equipment", args[0], args[0]), element("strong", " equipped")]
		);

	default:
		return element("strong", delimit(" ", node));
	}
}

class TagAdder {

	static TIPS = {

		combo: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: you can combine multiple tooltips from the same ",
				"namespace into one by typing || between the names ",
				"in the center field."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{art:Shelter R||Shelter F:Shelter}"
			)),
		]),

		custom: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: the \"tooltip\" namespace lets you make custom tooltips. ",
				"Unlike other namespaces, the display text goes in the center ",
				"field and the tooltip text in the rightmost.",
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{tooltip:display text:tooltip text}"
			))
		]),

		const: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: the \"const\" namespace contains commonly used ",
				"prewritten tooltips."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"gbp: shown for status conditions that apply a generic ",
				"statistic bonus or penalty, i.e. [Stat +X] or [Stat -X]."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"variant: explanation for how reason metamagic ",
				"variants work (special effect with specific spells)"
			)),
			element("br"), element("br"),
			element("span", wrap(
				"ap: attack plurality table"
			)),
		]),

		style: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: you can apply multiple styles at once by typing || ",
				"between the names in the center field.",
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{style:bold||italic:extra emphasis}"
			)),
		]),
	};

	constructor(target, callback) {

		this.target   = target;
		this.callback = callback; 

		class Thorax {
			constructor(feature) {
				// debugger
				this.textnode = document.createTextNode(feature.name);
				this.select   = feature.select(() => {
					this.textnode.data = ellipse(this.select._select.value, 10);
				});

				this.root = this.select.root;

				const div      = this.select.root.firstChild;
				const dropdown = div.firstChild;
				dropdown.remove();

				div.firstChild.prepend(element("br"));
				div.firstChild.prepend(dropdown);
				div.firstChild.prepend(element("br"));
				div.firstChild.prepend(element("strong", feature.name));
				div.prepend(element("span", this.textnode, "datum"));				
			}

			get value() {
				return this.select._select.value;
			}
		}

		this._tags = element("select", {
			class   : ["simple-border", "selectable"],
			content : (
				Array.from(LOOKUP.keys())
					.filter(n => n != "")
					.map(n =>
						element("option", {attrs: {value: n}, content: n}))
			),
			attrs   : {
				onchange: (() => {
					const data        = this._tags.value;
					this._tag_tn.data = data ? data : "\xA0\xA0\xA0";
					this._span.firstChild.remove();
					this._span.appendChild(this._map.get(data).root);
					this._tips.firstChild.remove();
					this._tips.appendChild(TagAdder.TIPS[
						data == "tooltip"
							? "custom"
							: data == "style"
								? "style"
								: data == "const"
									? "const"
									: "combo"
					]);
				})
			}
		});

		const exclude = new Set([""]);

		this._map = new Map(
			Array.from(LOOKUP.entries())
				.filter(e => !exclude.has(e[0]))
				.map(e => { e[1] = new Thorax(e[1]); return e; })
		);

		this._span = element("span", this._map.get("item").root);

		this._tool = element("input", {
			class : ["simple-border", "selectable", "adder-field"],
			attrs : {
				type: "text",
			}
		});

		this._text = element("textarea", {
			class : ["simple-border", "selectable", "adder-field"],
			attrs : {
				placeholder : "Enter custom display text here...",
				onchange    : (() => {
					this._txt_tn.data = ellipse(this._text.value, 6);
				}),
			}
		});

		this._tips = element("div", TagAdder.TIPS["combo"]);

		this._tag_tn = document.createTextNode("namespace");
		this._txt_tn = document.createTextNode("...");

		this.root = element("span", [
			tooltip(
				element("input", {
					class  : ["simple-border"],
					attrs  : {
						value   : "Add",
						type    : "button",
						onclick : (() => {
							this.insert(this.text());
							this.callback.call();
						})
					},
				}),
				wrap(
					"Add your own tooltips to your custom item description; ",
					"mouse over the highlighted text to the right to select ",
					"a feature to add."
				)
			),
			element("span", [
				"@{",
				tooltip(element("span", this._tag_tn, "datum"), [
					uniqueLabel("Choose a namespace:", this._tags), element("br"),
					this._tags, this._tips
				]),
				":",
				this._span,
				":",
				tooltip(element("span", this._txt_tn, "datum"), [
					uniqueLabel("Enter display text:", this._text), element("br"),
					this._text,
					element("br"),
					element("span", wrap(
						"Tip: if left empty, display text will be the name of ",
						"the feature selected in the center field.",
					))
				]),
				"}"
			])
		]);
	}

	text() {
		const namespace = this._tags.value;
		const link      = this._map.get(namespace).value;
		const text      = this._text.value || link;
		return `@{${namespace}:${link}:${text}}`;
	}

	insert(text) {
		const start  = this.target.selectionStart;
		const end    = this.target.selectionEnd;
		const old    = this.target.value;
		this.target.value = (
			`${old.substring(0, start)}${text}${old.substring(end)}`
		);

		this.target.setSelectionRange(start + text.length, end + text.length);
		this.target.focus();
	}

}

return {
	link: link,
	dead: dead,
	toul: toul,
	totl: totl,
	text: textwrapper,
	Adder: TagAdder,
};

})();

/* exported Ability */
/* exported Class */
/* exported CombartArt */
/* exported Item */ 
/* exported Equipment */
/* exported Attribute */
/* exported Condition */
/* exported Tile */
/* exported Battalion */
/* exported Gambit */
/* exported Adjutant */
/* exported Preset */
/* exported hitip */
