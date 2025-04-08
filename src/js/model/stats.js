
/* global
   AttributeCell
   element
 */

/* global Action */
/* global PointBuy */
/* global Calculator */
/* global RangeFinder */

class Stats {

	static BASE_OPTIONS = {
		value : 0,
		shown : "0",
		edit  : true,
	};

	static GROW_OPTIONS = {
		value  : 0,
		shown  : "0%",
		before : "(",
		after  : ")",
		edit   : true,
		step   : 5,
	};

	constructor(stats, sheet) {
		this.root      = element("div");
		this.names     = stats;
		this.sheet     = sheet;
		this.pointbuy  = new PointBuy();
		this.refresher = this.sheet.refresher;

		const primes  = element("tbody");

		this._level = new AttributeCell({
			edit    : true,
			value   : 1,
			shown   : "1",
			min     : 1,
			max     : 100,
			trigger : ((level) => {
				this.refresher.refresh("Level");
				this.refresher.refresh("unit|level");
				return level;
			}),
		});

		this._size = new AttributeCell({
			edit    : true,
			value   : 1,
			shown   : "1",
			min     : 1,
			max     : 9,
			root    : "span",
			trigger : ((size) => {
				Action.UNIT_SIZE = Number(size);
				this.refresher.refresh("unit|size");
				return size;
			})
		});

		const edit = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Edit",
				onclick : (() => {
					const tabs = this.sheet.tabs;
					tabs.main.active   = "Assign";
					tabs.assign.active = "Levels";
				}),
			},
		});

		primes.appendChild(
			element("tr", [
				element("th", "Level"), this._level.root, element("td", edit),
			]),
		);

		this.stats   = {};
		this.growths = {};

		for (let item of stats) {
			const stat = item;

			const baseFunction = new Calculator.Env(
				Calculator.Env.RUNTIME, this.sheet.definez
			).func(`unit|total|${stat}`);

			const varname = `unit|base|${stat}`;

			const base = new AttributeCell(Stats.BASE_OPTIONS, (_base) => {

				// TODO refresher location
				this.refresher.refresh(varname);
				
				if (stat == "dex" || stat == "lck") {
					this.sheet.battalion.refresh(false);
				}

				return Math.max(baseFunction(), 0);
			});

			this.refresher.register(base,
				this.sheet.compiler.dependancies(`unit|total|${stat}`,
					new Set([`unit|var_base|${stat}`]) // prevent recursion
				)
			);

			this.stats[stat] = base;

			const grow = ((stat) => {

				if (stat == "mov") return element("td", [
					element("strong", "Size "), this._size.root
				]);

				const growFunction = new Calculator.Env(
					Calculator.Env.RUNTIME, this.sheet.definez
				).func(`unit|total|growth|${stat}`);

				const cell = new AttributeCell(Stats.GROW_OPTIONS, (x) => {
					return `${Math.max(growFunction(), 0)}%`;
				});

				this.growths[stat] = cell;
				return cell.root;
			})(stat);

			primes.appendChild(
				element("tr", [
					element("th", stat.toUpperCase()), base.root, grow,
				])
			);
		}

		this.secondary = {};

		const lconf = {edit: false, root: "span", value: 0, shown: "0", after : ","};
		const rconf = {edit: false, root: "span", value: 0, shown: "0"};
		const cconf = {edit: false, root: "span", value: 0, shown: "0"};

		const defsec = (key, config, fn) => {

			const variable      = `unit|total|${key}`;

			if (fn === undefined) {
				fn = new Calculator.Env(
					Calculator.Env.RUNTIME, this.sheet.definez
				).func(variable);
			}

			const cell          = new AttributeCell(config, fn);
			this.secondary[key] = cell;

			const dependancies  = this.sheet.compiler.dependancies(variable);
			this.refresher.register(cell, dependancies);
			return cell;
		};

		const wide = (title, key, trig) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2},
					content : defsec(key, cconf, trig).root,
				}),
			]);
		};

		const dual = (title, key1, key2) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec(key1, lconf).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec(key2, rconf).root
				}),
			]);
		};

		const baseFunction = new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		).func("unit|total|mttype");

		const second = element("tbody", [
			wide("Might", "mt"),
			wide("Based on", "mttype", (base) => {
				const value = baseFunction();
				const text  = Action.MTTYPE.asString(value);
				return text.toUpperCase();
			}),
			dual("Prot/Resl", "prot", "resl"),
			dual("Hit/Avo", "hit", "avo"),
			dual("Crit/Avo", "crit", "cravo"),
			dual("Dbs/Dbd", "doubles", "doubled"),
			dual("SP/TP", "sp", "tp"),
			element("tr", [
				element("th", "Costs"),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec("spcost", lconf).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec("tpcost", rconf).root
				}),
			]),
			element("tr", [
				element("th", "Range"),
				element("td", {
					attrs   : {colSpan: 2},
					class   : ["center", "padded-cell"],
					content : [
						defsec("minrng", cconf).root,
						element("span", " - ", "computed"),
						defsec("maxrng", cconf).root,
					],
				}),
			]),
		]);

		this.va = new RangeFinder(this.sheet, {
			width : 180,
			draw  : false,
		});

		this.refresher.register(this.va, this.sheet.view_triggers);

		this.refresher.register(this.secondary.tp, definitions.skills);

		this.root = element("div", [
			element("table", primes),
			element("hr"),
			element("table", second),
			this.va.root,
		]);
	}


	/**
	 * The character's level
	 * @type {number}
	 */
	get level() {
		return this._level.value;
	}

	set level(value) {
		this._level.value = value;
	}

	/**
	 * The character's size in tiles (characters are squares).
	 * @type {number}
	 */
	get size() {
		return this._size.value;
	}

	set size(value) {
		this._size.value = value;
	}

	/**
	 * Set all stats and growths to zero. Secondary stats may not become zero
	 * depending on equipped abilities, items, and/or arts.
	 */
	clear() {
		this.level = 1;
		for (let name of this.names) {
			this.stats[name].value = 0;
			if (name == "mov") continue;
			this.growths[name].value = 0;
		}
	}

	/**
	 * Recompute display values for all primary and secondary stats.
	 */
	refresh() {
		this.refreshPrimary();
		this.refreshSecondary();
	}

	/**
	 * Recompute display values for primary stats.
	 */
	refreshPrimary() {
		this.pause = true;

		for (let name of this.names) {
			this.stats[name].refresh();
			if (name == "mov") continue;
			this.growths[name].refresh();
		}

		this.pause = false;
	}

	/**
	 * Recompute display values for secondary stats.
	 */
	refreshSecondary() {

		/* This should improve load times a bit. */
		if (this.pause) return;

		if (!this.VarS) {
			this.VarS = [];
			for (let key in this.secondary) {
				this.VarS.push([key, `unit|total|${key}`]);
			}
		}

		for (let [key, variable] of this.VarS) {
			this.secondary[key].value = Math.max(
				this.sheet.runenv.read(variable), (
					key == "spcost" || key == "tpcost"
						? -100
						: 0
				)
			);
		}
	}

	/**
	 * Set primary statistic and growth values from an object. The object should
	 * have the fields "statistics" for primary stats, and "growths" for the
	 * growths, each consisting of accurate stat names and integer values.
	 * This is based on the format of the sheet export data file.
	 * @param {object} object - object to set stats and growths from
	 */
	import(object) {
		
		this.level = object.level || 1;
		this.size  = object.size  || 1;

		for (let name of this.names) {
			this.stats[name].value   = object.bases[name];
			if (name == "mov") continue;
			this.growths[name].value = object.growths[name];
		}

		// we don't use this, we're just preserving it for posterity
		this.levelups = object.levelups ?? null;

		if ("pointbuy" in object) {
			this.pointbuy.import(object.pointbuy);
		} else {
			this.pointbuy.clear();
		}

		// We want it to look fresh, not have modifiers.
		this.pointbuy.bells.clear();
	}

	/**
	 * Return a collection of current values for primary statistics and growths.
	 * @returns {object} a collection of primary statistics and growths.
	 */
	export() {

		const object = {
			size     : this.size,
			level    : this.level,
			pointbuy : this.pointbuy.export(),
			bases    : {},
			growths  : {},
		};

		// reproduce old levelup data so it's not erased
		if (this.levelups) object.levelups = this.levelups;

		for (let name of this.names) {
			object.bases[name] = this.stats[name].value;
			if (name == "mov") continue;
			object.growths[name] = this.growths[name].value;
		}

		return object;
	}
}

// class Stats {

// 	constructor(names, sheet) {

// 		this.sheet = sheet;

// 		this.stats = {
// 			first  : {},
// 			second : {},
// 			growth : {},
// 		};

// 		this.refresher = sheet.refresher;

// 		const sf = new VariableTable(sheet.refresher, sheet.definez, this.stats.first, 4);
// 		const ss = new VariableTable(sheet.refresher, sheet.definez, this.stats.second, 4);

// 		const fn = ((base, variable, name) => {
// 			// this.refreshSecond();
// 			return variable();
// 		});

// 		const perc = ((base, variable, name) => {
// 			return `${variable()}%`;
// 		});

// 		this.pointbuy  = new PointBuy();

// 		this._level = new AttributeCell({
// 			edit    : true,
// 			value   : 1,
// 			shown   : "1",
// 			min     : 1,
// 			max     : 100,
// 			trigger : ((level) => {
// 				this.refresher.refresh("Level");
// 				this.refresher.refresh("unit|level");
// 				return level;
// 			}),
// 		});

// 		this._size = new AttributeCell({
// 			edit    : true,
// 			value   : 1,
// 			shown   : "1",
// 			min     : 1,
// 			max     : 9,
// 			root    : "span",
// 			trigger : ((size) => {
// 				Action.UNIT_SIZE = Number(size);
// 				this.refresher.refresh("unit|size");
// 				return size;
// 			})
// 		});

// 		const table = element("tbody", [
// 			sf.row(
// 				tooltip("HP", wrap(
// 					"A unit is defeated when its Hit Points are reduced to",
// 					"zero"
// 				)),
// 				{var: "unit|total|hp", edit: true},
// 				{var: "unit|growth|hp", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Str", wrap(
// 					"Strength increases damage dealt with physical weapons."
// 				)),
// 				{var: "unit|total|str", edit: true},
// 				{var: "unit|growth|str", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Mag", wrap(
// 					"Magic increases damage dealt with magical weapons and the ",
// 					"the potency of magical healing and barriers."
// 				)),
// 				{var: "unit|total|mag", edit: true},
// 				{var: "unit|growth|mag", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Dex", wrap(
// 					"Dexterity increases attack accuracy and protects against criticals."
// 				)),
// 				{var: "unit|total|dex", edit: true},
// 				{var: "unit|growth|dex", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Spd", wrap(
// 					"High speed allow a unit to attack twice and avoid being attacked ",
// 					"twice in combat"
// 				)),
// 				{var: "unit|total|spd", edit: true},
// 				{var: "unit|growth|spd", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Def", wrap(
// 					"Defense reduces damage taken from physical attacks."
// 				)),
// 				{var: "unit|total|def", edit: true},
// 				{var: "unit|growth|def", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Res", wrap(
// 					"Resistance reduces damage taken from magical attacks."
// 				)),
// 				{var: "unit|total|res", edit: true},
// 				{var: "unit|growth|res", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Lck", wrap(
// 					"Luck increases critical rate and chance to avoid attacks."
// 				)),
// 				{var: "unit|total|lck", edit: true},
// 				{var: "unit|growth|lck", edit: true, call: perc, style: "grow",
// 					obj: this.stats.growth}),
// 			sf.row(
// 				tooltip("Mov", wrap(
// 					"Movement is the maximum number of spaces (manhattan ",
// 					"distance) a unit may move on its phase."
// 				)),
// 				{var: "unit|total|mov", edit: true}),
// 			sf.wideth(element("hr")),
// 			ss.row(
// 				tooltip("Might", wrap(
// 					"Might (Mt) is damage dealt by an attack before it is ",
// 					"reduced by a foe's Protection or Resiliance. HP restored ",
// 					"by healing features may also be displayed here."
// 				)),
// 				{var: "unit|total|mt", edit: false}),
// 			ss.row(
// 				tooltip("Based on", wrap(
// 					"Whether Might is based on Strength or Magic, which ",
// 					"determines whether an attack deals physical or magical ",
// 					"damage, or whether the action deals no damage."
// 				)),
// 				{var: "unit|total|mttype", edit: false}),
// 			ss.row(
// 				[
// 					tooltip("Prot", wrap(
// 						"Protection reduces damage taken from physical attacks."
// 					)), "/",
// 					tooltip("Hit", wrap(
// 						"Resiliance reduces damage taken from physical attacks."
// 					))
// 				],
// 				{var: "unit|total|prot", edit: false},
// 				{var: "unit|total|resl", edit: false}),
// 			ss.row(
// 				[
// 					tooltip("Hit", wrap(
// 						"Hit is an attack's percentage chance to connect with ",
// 						"a foe, before it is reduced by a foe's Avoid"
// 					)), "/",
// 					tooltip("Avo", wrap(
// 						"Avoid reduces a foe's percentage chance to hit this ",
// 						"unit with an attack."
// 					))
// 				],
// 				{var: "unit|total|prot", edit: false},
// 				{var: "unit|total|resl", edit: false}),
// 			ss.row(
// 				[
// 					tooltip("Crit", wrap(
// 						"Critical Hit is an attack's percentage chance to deal ",
// 						"10 extra damage when it hits. This extra damage is ",
// 						"not reduced by Protection or Resistance."
// 					)), "/",
// 					tooltip("Avo", wrap(
// 						"Critical Avoid reduces a foe's chance to score a ",
// 						"critical hit against this unit."
// 					))
// 				],
// 				{var: "unit|total|crit", edit: false},
// 				{var: "unit|total|cravo", edit: false}),
// 			ss.row(
// 				[
// 					tooltip("Dbs", wrap(
// 						"If Doubles is greater than or equal to a foe's speed, ",
// 						"this unit attacks that foe twice during combat."
// 					)), "/",
// 					tooltip("Dbd", wrap(
// 						"If Doubled is less than or equal to a foe's speed, this",
// 						"the foe attacks this unit twice during combat."
// 					))
// 				],
// 				{var: "unit|total|doubles", edit: false},
// 				{var: "unit|total|doubled", edit: false}),
// 			ss.row(
// 				[
// 					tooltip("TP", wrap(
// 						"The size of this unit's pool of Technical Points, ",
// 						"which are spenr to use items."
// 					)), "/",
// 					tooltip("SP", wrap(
// 						"The size of this unit's pool of Stamina Points, ",
// 						"which are spent to use arts."
// 					))
// 				],
// 				{var: "unit|total|sp", edit: false},
// 				{var: "unit|total|tp", edit: false}),
// 			ss.row(
// 				tooltip("Costs", wrap(
// 					"The TP and SP costs of this attack or action."
// 				)),
// 				{var: "unit|total|sp", edit: false},
// 				{var: "unit|total|tp", edit: false}),
// 			ss.row(
// 				tooltip("Range", wrap(
// 					"Minimum and maximum distance of this attack or action."
// 				)),
// 				ss.range(
// 					{var: "unit|total|minrng", range: true, edit: false},
// 					{var: "unit|total|maxrng", range: true, edit: false})),
// 		]);

// 		this.va = new RangeFinder(this.sheet, {
// 			width : 180,
// 			draw  : false,
// 		});

// 		this.root = element("div", [
// 			element("table", table),
// 			this.va.root,
// 		]);
// 	}

// }

/* exported Stats */
