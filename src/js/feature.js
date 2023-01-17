/**
 * A module that implements the main data model for the sheet
 * @module feature
 */

/* global Expression */
/* global Polish */

/* global ConfigEnum */
/* global Filter */

/* global element */
/* global tooltip */
/* global delimit */
/* global capitalize */

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
	constructor(template, compiler) {
		this.name         = template.name || "";
		this.description  = template.description || "";
		this.type         = template.type || "";
		this.tags         = Object.freeze(template.tags || Feature.EMPTY_OBJECT);
		this.comment      = template.comment || "No comment.";
		this.hidden       = template.hidden || false;
		this.requires     = Polish.compile(template.requires || "");
		this.tags         = new Set(template.tags || []);
		this.dependancies = new Set();

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

				let value = stats[key];

				// join an array into a tring
				if (value instanceof Array) {
					value = value.join(" ");
				}

				// see if we need to compile an expression
				if (typeof value != "string") {
					continue;
				}

				// try to compile the expression, if not error and assume default
				try {

					const expression = compiler.compile(value);

					if (expression.symbols.has(key)) {
						console.warn(expression, "Potential circular dependacy detected.");
					}

					stats[key] = expression;

					// add any dependacies to this feature's dependancy list
					for (let symbol of expression.symbols) {
						this.dependancies.add(symbol);
					}


				} catch (e) {
					if (e instanceof Expression.CompilationError) {
						console.error(value, e);
						stats[key] = attribute.default;
					} else {
						throw e;
					}
				}
			}

			this[attribute.key] = Object.freeze(stats);
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
	static setLookupByName(iterable, compiler) {

		// initialize the "empty" feature on first invocation
		if (this.EMPTY === undefined) {
			this.EMPTY = new this(this.EMPTY_OBJECT, compiler);
		}

		// initialize the map on first invocation
		if (this.byName === undefined) {
			this.byName = new Map();
		}

		// clear existing values and refill map
		this.byName.clear();
		for (let template of iterable[this.kind]) {
			const instance = new this(template, compiler);
			this.byName.set(instance.name, instance);
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

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {
		return this.name;
	}

	static MODEXCLUDE = new Set(["tiles", "tp", "sp", "tpcost", "spcost", "minrng", "maxrng"]);

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
			this.requires.source ? element("div", [
				element("strong", "Usage Requirements"),
				hitip.toul(this.requires.ast, dead),
			]) : ""
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

	modifierForUI(stat, sign=false, dead=false) {

		/* test explicitly for membership */
		if (!(stat in this.modifiers)) return 0;

		/* then handle other number cases*/
		const value    = this.modifier(stat);
		const modifier = this.modifiers[stat];

		/* it it's a number just give a static html */
		if (typeof modifier == "number") {
			
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

/**
 * A {@link Feature} subclass that heavily governs attack calculations.
 */
class AttackFeature extends Feature {

	/**
	 * Create an AttackFeature from a template object
	 */
	constructor(template, compiler) {
		super(template, compiler);
		this.rank    = template.rank   || "";
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

		const tpcost = this.modifierForUI("tpcost", false, dead);
		if (tpcost) mods.push([tpcost, element("sub", "TP", "computed")]);

		const spcost = this.modifierForUI("spcost", false, dead);
		if (spcost) mods.push([spcost, element("sub", "SP", "computed")]);

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
			const min = this.modifierForUI("minrng", false, dead);
			const max = this.modifierForUI("maxrng", false, dead);
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
			// "Requires: ", Polish.highlight(String(this.requires)), "\n",
			delimit(" ", mods),
			mods.length ? element("br") : "",
			hitip[dead ? "dead" : "link"](this.description),
			this.requires.source ? element("div", [
				element("strong", "Usage Requirements"),
				hitip.toul(this.requires.ast, dead),
			]) : ""
		]);
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute, additional
 * optional damage scaling based off of a stat, and boolean tags.
 */
class CombatArt extends AttackFeature {

	static kind = "arts";

	static DEFAULT = "";

	constructor(template, compiler) {
		super(template, compiler);
		// this.requires = Polish.compile(template.requires || "");

		// If this is not a super() call, freeze the object.
		if (new.target === CombatArt) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a combat art's {@link CategoryElement} title
	 * @return {string} title for this combat this's {@link CategoryElement}
	 */
	title() {
		const kind = (this.tagged("tactical") ? "Tactic" : "Art");

		if (!this.type || !this.rank) {
			return ` ${this.name} (${kind})`;
		}

		return `${this.name} (${kind}: ${this.type} ${this.rank})`;
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

			],
		});
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute
 */
class Weapon extends AttackFeature {

	static kind = "weapons";

	static DEFAULT = "Unarmed";

	/**
	 * Generate a weapon's {@link CategoryElement} title
	 * @return {string} title for this weapon's {@link CategoryElement}
	 */
	title() {
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
				new Filter.Toggle("Faith", false, (feature) => {
					return feature.type == "Faith";
				}),
				new Filter.Toggle("Reason", false, (feature) => {
					return feature.type == "Reason";
				}),
				new Filter.Toggle("Guile", false, (feature) => {
					return feature.type == "Guile";
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

				element("br"),

				new Filter.Toggle("Effective", false, (feature) => {
					return feature.tagged("effective");
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
	constructor(template) {
		super(template);
		this.abilities = template.abilities || [];
		this.arts      = template.arts || [];
		this.growths   = Object.freeze(template.growths || {});
		this.tier      = template.tier    || "Starting";

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

				element("br"), element("strong", "Weapon Type"), element("br"),
				new Filter.Toggle("Caster", false, (feature) => {
					return feature.type.includes("Caster");
				}),
				new Filter.Toggle("Martial", false, (feature) => {
					return feature.type.includes("Martial");
				}),
				new Filter.Toggle("Pure", false, (feature) => {
					const martial = feature.type.includes("Martial");
					const caster  = feature.type.includes("Caster");
					return (
						(caster && !martial)
							||	
						(!caster && martial)
					);
				}),

				element("br"), element("strong", "Other"), element("br"),

				new Filter.Toggle("Rework", false, (feature) => {
					return feature.tagged("rework");
				}),

				new Filter.Toggle("Hide", true, (feature) => {
					return !feature.hidden;
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

	constructor(template, compiler) {
		super(template, compiler);
		this.weapon = template.weapon || "";

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

				new Filter.Toggle("None", false, (feature) => {
					return !feature.requires.symbols.has("Level");
				}),
				new Filter.Toggle("5", false, (feature) => {
					return feature.requires.symbols.has("5");
				}),
				new Filter.Toggle("10", false, (feature) => {
					return feature.requires.symbols.has("10");
				}),
				new Filter.Toggle("15", false, (feature) => {
					return feature.requires.symbols.has("15");
				}),
				new Filter.Toggle("20", false, (feature) => {
					return feature.requires.symbols.has("20");
				}),
				new Filter.Toggle("25", false, (feature) => {
					return feature.requires.symbols.has("25");
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

	constructor(template, compiler) {
		super(template, compiler);
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
				element("br"),
				new Filter.Toggle("Shield", false, (feature) => {
					return feature.type == "Shield";
				}),
				new Filter.Toggle("Staff", false, (feature) => {
					return feature.type == "Staff";
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

	constructor(template, compiler) {
		super(template, compiler);
		this.stats = template.stats || {};

		if (new.target === Tile) {
			Object.freeze(this);
		}
	}

	title() {
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
			],
		});
	}
}


// class Gambit extends AttackFeature {

// 	static kind = "gambit";

// 	constructor(template) {
// 		super(template);

// 		this.type    = "Gambit";
// 		this.shape   = template.shape || "1x1 Square.";
// 		this.magical = template.magical || false;

// 		if (new.target === Battalion) {
// 			Object.freeze(this);
// 		}
// 	}

// }

// class Battalion extends Feature {

// 	static kind = "battalions";

// 	constructor(template) {
// 		super(template);

// 		this.rarity = template.rarity || "Bronze";
// 		this.price  = template.price  || 0;

// 		this.gambit = template.gambit ? new Gambit(template.gambit) : null;

// 		if (new.target === Battalion) {
// 			Object.freeze(this);
// 		}
// 	}

// 	body() {
		
// 		const b = this;
// 		const g = this.gambit;

// 		return (
// 			`${b.rarity} Battalion [${b.type}]<br />`
// 				+ `(${b.requires} - Costs ${b.price})\n`
// 				+ `${g.title()}:\n${g.body()}`
// 		);
// 	}

// }

class Attribute extends AttackFeature {

	static kind = "attributes";
	static DEFAULT = "";

	constructor(template, compiler) {
		super(template, compiler);

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

				new Filter.Toggle("Weapons", false, (feature) => {
					return feature.tagged("forweapon");
				}),
				new Filter.Toggle("Spells", false, (feature) => {
					return feature.tagged("forspell");
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
			],
		});
	}

}

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
	[ "weapon"    , Weapon    ],
	[ "condition" , Condition ],
	[ "ability"   , Ability   ],
	[ "art"       , CombatArt ],
	[ "attribute" , Attribute ],
	[ "tile"      , Tile      ],
	[ "equipment" , Equipment ],

	["", {
		get: function() {
			return this;
		},

		body: function() {
			return "This feature.";
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
		}
	}],

	["tooltip", {

		text: "",

		get: function() {
			return this;
		},

		body: function() {
			return "If you see this, an error has occured!";
		}

	}]

]);

function linkfn(table, link, text) {

	/* special behavior for literal tooltips */
	if (table == "tooltip") {
		return tooltip(element("span", link, "datum"), text);
	}

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

		con.push(
			element("div", [
				element("strong", instance.name), element("br"),
				instance.body(true)
			])
		);
	}

	const base = element("span", text, broken ? "computed" : "datum")
	return tooltip(base, delimit(element("hr"), con));
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

function totl(node, top=true) {

	const fn   = node[0];
	const args = node.slice(1);

	if (top) switch (fn) {

	case "All":
		return totl(node, false);

	case "Any":
		return args.map(e => totl(e, true)).join("\nor\n");

	default:
		return `  * ${totl(node, false)}`;

	}

	switch (fn) {

	case "All":
		return args.map(e => `  * ${totl(e, false)}`).join("\n");

	case "Any":
		return args.map(e => totl(e, false)).join(" or ");

	case "Required":
		return `${totl(args[0], false)} (required)`;

	case "Permission":
		return fn;

	case "Crest":
		return `Crest of ${args[0]}`;

	case "Weapon":
	case "Equipment":
		return `${args[0]} equipped`;

	default:
		return node.join(" ");
	}
}

function toul(node, dead=false, top=true) {

	const fn = node[0];

	if (top) {

		const elements = toul(node, dead, false);

		if (fn == "All") {
			return elements;
		}

		/* we want the top level to be inside of a  ul */
		return element("ul", element("li", elements), "compact-list");
	}

	const args = node.slice(1);

	switch (fn) {

	case "All":
		return element("ul",
			args.map(e => element("li", toul(e, dead, false))), "compact-list"
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

	case "Crest":
		return element("strong", ["Crest of ", args[0]]);

	case "Weapon":
		return element("span",
			[(dead ? deadfn : linkfn)("weapon", args[0], args[0]), element("strong", " equipped")]
		);

	case "Equipment":
		return element("span",
			[(dead ? deadfn : linkfn)("equipment", args[0], args[0]), element("strong", " equipped")]
		);

	default:
		return element("strong", delimit(" ", node));
	}
}

return {
	link: link,
	dead: dead,
	toul: toul,
	totl: totl,
	text: textwrapper,
};

})();

/* exported Ability */
/* exported Class */
/* exported CombartArt */
/* exported Weapon */ 
/* exported Equipment */
/* exported Attribute */
/* exported Condition */
/* exported Tile */
/* exported hitip */
