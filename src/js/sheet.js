
/**
 * A module that implements the main controller for the sheet, as well as some
 * small models and utilities that are too small to separate into other modules
 * @module sheet
 */

/* global
	Grade, Iter, SwapText, Theme, Toggle, VariableTable, Version,
	capitalize, delimit, element, hilight, tooltip, uniqueID, uniqueLabel, wrap
*/

/* global Polish */

/* global Calculator */

/* global Macros */

/* global Markup */

/* global Notebook */

/* global Presetter */

/* global Checks */

/* global Experiences */

/* global
	Ability, Action, Adjutant, Art, Attribute, Class, Condition,
	Feature, Gambit, Item, Preset, Tile
*/

/* global Legacy */

/* global Skills */
/* global Stats */
/* global Inventory */
/* global Characters */

/* global Requirements */
/* global Reminder */
/* global Compatible */

/* global
	CategoryModel MultiActiveCategory SingleActiveCategory
*/

/* global Forecast   */

/* global Battalions */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */

/* global definitions */

/* global Buildables */


const V3 = true;

class AutosaveConfiguration {

	static MODES = new Map([
		["Minutes", 6e4],
		["Seconds", 1e3],
		["Off", 0]
	]);

	constructor(sheet) {

		this.sheet       = sheet;
		this._radios     = [];
		this._interval   = null;
		this._multiplier = 6e4;

		this._countdown   = document.createTextNode("Never");

		this._input       = element("input", {
			class : ["simple-border"],
			attrs : {
				type  : "number",
				value : 5,
				min   : 0,
			}
		});

		this._set = element("button", {
			class   : ["simple-border"],
			content : "Set",
			attrs   : {
				onclick: (() => {
					localStorage.setItem("autosave",
						JSON.stringify(this.export())
					);
					this.setInterval(this.value);
				}),
			}
		});

		const els = [
			element("legend", [
				element("strong", "Autosave in "),
				element("span", this._countdown, "computed")
			]),
			this._set, this._input, element("br"),
		];

		for (let each of AutosaveConfiguration.MODES.entries()) {

			const [value, mult] = each;

			const radio = element("input", {
				attrs : {
					type     : "radio",
					value    : value,
					name     : this._radio_group,
					checked  : value == "Minutes",
					onchange : (() => {
						this._multiplier = mult;
					})
				}
			});

			this._radios.push(radio);
			els.push(radio, uniqueLabel(value, radio));
		}

		this.root = element("fieldset", els);
	}

	import(object) {

		this._input.value = object.number || 5;


		let multiplier = object.multiplier || "Minutes";

		for (let radio of this._radios) {
			radio.checked = false;
			if (radio.value == multiplier) {
				radio.checked    = true;
				this._multiplier = AutosaveConfiguration.MODES.get(multiplier);
			}
		}

		this.setInterval(this.value);
	}

	export() {
		return {
			number     : Number(this._input.value),
			multiplier : (
				this._radios
					.filter(radio => radio.checked)[0]
					.value
			)
		};
	}

	get value() {
		return this._multiplier * Number(this._input.value);
	}

	setInterval(value=this.value) {

		if (this._interval != null) {
			clearInterval(this._interval);
			this._interval = null;
		}

		if (value == 0) {
			this._countdown.data = "Never";
			return;
		}

		let seconds  = value / 1e3;

		this._interval = setInterval(() => {

			const minutes        = Math.floor(seconds / 60);
			const justSecs       = seconds - (minutes * 60);
			const partSecs       = justSecs < 10 ? `0${justSecs}` : justSecs;
			this._countdown.data = `${minutes}:${partSecs}`;
			if (seconds--) return;

			this.sheet.autosave();
			seconds = value / 1e3;
		}, 1e3);
	}
}

class CampaignConfiguration {

	static LOCAL = "CampaignConfiguration";

	static FbF = {
		"maxcap_abilities" : 18,
		"maxcap_arts"      :  3,
		"maxcap_tactical"  :  2,
		"maxcap_combat"    :  2,
		"free_traits"      :  0,
		"coa_rebalances"   :  0,
	};

	static CoA = {
		"maxcap_abilities" : 30,
		"maxcap_arts"      :  5,
		"maxcap_tactical"  :  3,
		"maxcap_combat"    :  3,
		"free_traits"      :  1,
		"coa_rebalances"   :  1,
	};

	static DEFINED = {
		"maxcap_abilities" : wrap(
			"Maximum capacity for abilities. A low value makes for units that ",
			"are faster and more intuitive to play while a higher value makes ",
			"units more customizable at the expense of simplicity."
		),
		"maxcap_arts"      : wrap(
			"Maximum number of slots for arts. A low value makes for units that ",
			"are faster and more intuitive to play while a higher value makes ",
			"units more customizable at the expense of simplicity."
		),
		"maxcap_tactical"  : wrap(
			"Maximum number of slots for tactical arts. Increasing this ",
			"relative to the maximum number of combat arts can give players ",
			"incentive to make more support oriented units."
		),
		"maxcap_combat"    : wrap(
			"Maximum number of slots for combat arts. Increasing this ",
			"relative to the maximum number of combat arts can give players ",
			"incentive to make more combat oriented units."
		),
		"free_traits"      : wrap(
			"Allow players to set their own ranks for traits instead of tying ",
			"trait progression entirely to skill rank, as is the default."
		),
		"coa_rebalances"   : wrap(
			"Use CoA specific rebalances to various features instead of defaults",
		),
	};

	static FE3H = {
		"maxcap_abilities" : 30,
		"maxcap_arts"      :  5,
		"maxcap_tactical"  :  3,
		"maxcap_combat"    :  3,
		"free_traits"      :  0,
		"coa_rebalances"   :  0,
	};

	constructor(sheet) {

		this.values = {};

		this.table  = new VariableTable(
			sheet.refresher, sheet.definez, this.values, 2
		);

		this.triggers = Array.from(
			Object.keys(CampaignConfiguration.DEFINED),
			key => `game|${key}`
		);

		this.table.refresher.register(this,
			[CampaignConfiguration.LOCAL],
			this.triggers
		);

		this._save = element("button", {
			class   : ["simple-border"],
			content : "Save Settings",
			attrs   : {
				onclick: (() => {
					localStorage.setItem(
						CampaignConfiguration.LOCAL,
						JSON.stringify(this.export())
					);
					alert("Campaign settings saved.");
				}),
			}
		});

		this._clear   = element("button", {
			class   : ["simple-border"],
			content : element("span", "Set to Defaults"),
			attrs   : {
				onclick: (() => void this.clear()),
			}
		});

		this.defaults = element("select", {
			class   : ["simple-border"],
			content : ["FbF", "CoA", "FE3H"].map(name =>
				element("option", {content: name, attrs: {value: name}})
			)
		});

		const update = ((base, variable, name) => {
			this.table.refresher.refresh(name);
			return variable();
		});

		const boolean = ((base, variable, name) => {
			this.table.refresher.refresh(name);
			return variable() ? "true" : "false";
		});

		const traits = ((base, variable, name) => {
			
			for (const value of sheet.checks.rows.values()) {
				value._rank.edit = Boolean(base);
			}

			this.table.refresher.refresh(name);
			return variable() ? "true" : "false";
		});

		const rows = element("tbody", [
			this.table.row(
				tooltip("Art Slots",
					CampaignConfiguration.DEFINED["maxcap_arts"],
				),
				{
					var  : "game|maxcap_arts",
					call : update,
				}
			),
			this.table.row(
				tooltip("Tactical Art Slots",
					CampaignConfiguration.DEFINED["maxcap_tactical"],
				),
				{
					var  : "game|maxcap_combat",
					call : update,
				}
			),
			this.table.row(
				tooltip("Combat Art Slots",
					CampaignConfiguration.DEFINED["maxcap_combat"],
				),
				{
					var  : "game|maxcap_tactical",
					call : update,
				}
			),
			this.table.row(
				
				tooltip("Ability Capacity",
					CampaignConfiguration.DEFINED["maxcap_abilities"],
				),
				{
					var  : "game|maxcap_abilities",
					call : update,
				}
			),
			this.table.row(
				tooltip("Free Trait Ranks",
					CampaignConfiguration.DEFINED["free_traits"]
				),
				{
					var  : "game|free_traits",
					call : traits,
				}
			),
			this.table.row(
				tooltip("CoA Rebalances",
					CampaignConfiguration.DEFINED["coa_rebalances"]
				),
				{
					var  : "game|coa_rebalances",
					call : boolean,
				}
			)
		]);

		this.root = element("fieldset", [
			element("legend",
				element("span", "Campaign Settings", "underline", "bold")
			),
			element("table", rows),

			this._clear, this.defaults, element("br"),
			this._save,
			
		]);
	}

	import(object) {

		object = Legacy.configuration(object);

		for (const key in CampaignConfiguration.DEFINED) {
			this.values[key].setValue(object.values[key]);
		}

		this.table.refresher.refresh(CampaignConfiguration.LOCAL);
	}

	export() {

		const object = {
			version : Version.CURRENT.toString(),
			values  : {},
		};

		for (const key in this.values) {
			object.values[key] = this.values[key].value;
		}

		return object;
	}

	clear() {

		const defaults = CampaignConfiguration[this.defaults.value];

		for (const key in defaults) {
			this.values[key].setValue(defaults[key]);
		}

		this.table.refresher.refresh(CampaignConfiguration.LOCAL);
	}

	refresh() {
		for (const key in this.values) {
			this.values[key].refresh();
		}
	}

}

/*
 * AttributeCell v/
 * ModWidget v/
 * ReqWidget

	 new Set([
	    "Brawl", v/ L/
	    "Level", v/ L/
	    "Swords", v/ L/
	    "Lances", v/ L/
	    "Riding", v/ L/
	    "Class", v/ L/
	    "Flying", v/ L/
	    "Armor", v/ L/
	    "Bows", v/ L/
	    "Axes", v/ L/
	    "Authority", v/ L/
	    "ClassType", v/ L/
	    "Faith", v/ L/
	    "Guile", v/ L/
	    "Reason", v/ L/
	    "Other", v/ L/
	    "Item",
	    "Crest", v/ L/
	    "Equipment",
	    "Permission",
	    "Adjutant",
	    "Training", v/ L/
	    "Outfitting" v/ L/
	])

 * VisualAid v/
 */

class Refresher {

	constructor(sheet) {

		this.items     = new Map();
		this.propagate = new Map();
		this.triggers  = new Map();
		this.dirty     = new Set();
		this.group     = null;
		this.flight    = false;
		this.sheet     = sheet; // TODO ugly hack
		this.defer     = 0;

		// for debugging memory management issues
		this.snaps     = [];
		this.version   = 0;
		this.versions  = new Map();
	}

	/**
	 * For debugging memory management issues. Saves a snapshot of the
	 * item currently stored within the refresher with corresponding number.
	 */
	shapshot() {
		++this.version;
		this.snaps.push(new Set(this.items.keys()));
	}

	/**
	 * Determines which items are different between two snapshots
	 * @param  {Number} start the snapshot to start from
	 * @param  {Number} stop  the snapshot to end with
	 * @return {Set}          the set of differences
	 */
	snapdiff(start, stop) {
		return this.snaps[start].difference(this.snaps[stop]);
	}

	createGroup() {
		return (this.group = new Set());
	}

	clearGroup() {
		const group = this.group;
		this.group  = null;
		return group;
	}

	/**
	 * Adds one to the "wait depth" of the refresher. The "wait depth" defers
	 * cleaning of any elements until the refresher has encountered a call to
	 * signal for each call to wait (similar to a semaphore). This is useful
	 * for if you make a lot of programmatic changes to elements that trigger
	 * automatic updates when their value is modified.
	 * @return {Number} "wait depth" after modification
	 */
	wait() {
		return ++this.defer;
	}

	/**
	 * Decreases the "wait depth" of the refresher, and if the "wait depth" is
	 * reduced to zero, cleans all dirty elements.
	 * @return {Number} number of elements cleaned
	 */
	signal() {
		--this.defer;
		return this.clean();
	}

	/**
	 * Registers an element to be refreshed when certain event occur
	 * @param  {Refreshable}   element   element to refresh
	 * @param  {Array<String>} triggers  events that cause element to refresh
	 * @param  {Array<String>} propagate events to propagate this refresh to
	 * @return {Boolean}                 true if registration was a success
	 */
	register(element, triggers, propagate=[]) {

		// if (this.items.has(element)) return false;

		if (this.items.has(element)) {

			// amend the existing registration to include new data
			// doesn't seem to cause memory leaks, but keep in mind
			
			const addTriggers  = this.items.get(element);
			for (const each of triggers) addTriggers.add(each);

			const addPropagate = this.propagate.get(element);
			for (const each of propagate) addPropagate.add(each);

		} else {

			// create a new registration since we don't have one
			this.items.set(element, new Set(triggers));
			this.versions.set(element, this.version);
			this.propagate.set(element, new Set(propagate));

		}

		for (let trigger of triggers) {
			if (this.triggers.has(trigger)) {
				this.triggers.get(trigger).add(element);
			} else {
				this.triggers.set(trigger, new Set([element]));
			}
		}

		if (this.group) this.group.add(element);
		return true;
	}

	/**
	 * Marks elements with the given event(s) registered as being out of date
	 * ("dirty") and in need of refreshing at a later point in time.
	 * @param  {String|Array<String>} value event(s) to access element for
	 */
	soil(value) {
		if (typeof value == "string" || value instanceof String) {

			// Value is a string representing a trigger.
			if (!this.triggers.has(value)) {
				return;
			}

			for (let element of this.triggers.get(value)) {
				if (!this.dirty.has(element)) {
					this.dirty.add(element);
					this.soil(this.propagate.get(element));
				}
			}

			return;
		} else if (value instanceof Set || value instanceof Array) {

			// Value is a set of trigger string or refreshable object.
			for (let each of value) {
				this.soil(each);
			}

			return;
		} else if (this.items.has(value)) {

			// Value is a refreshable object.
			if (!this.dirty.has(value)) {
				this.dirty.add(value);
				this.soil(this.propagate.get(value));
			}

			return;
		}

		throw new Error(`No element, group, or trigger for '${value}'`);
	}

	/**
	 * Refreshes all elements marked as out of date ("dirty") by soil
	 * @return {Number} the number of elements refreshed
	 */
	clean() {

		// Defer actual updates until they're enabled again
		if (this.defer) return 0;

		// Guard against objects that invoke this object's
		// refresh method in their refresh method to prevent
		// infinte recursion. (Only clean once at the end.)
		if (this.flight) return 0;
		this.flight = true;

		let count = 0;
		for (let each of this.dirty) {
			(typeof each == "function" ? each() : each.refresh());
			count += 1;
		}
		this.dirty.clear();

		this.flight = false;
		return count;
	}

	/**
	 * Refreshes the elements registered with the event(s) provided. Avoids
	 * unbounded recursion by first recursively soiling all affected elements
	 * and then cleaning them once at the end of the operation.
	 * @param  {String|Array<String>} value events for the elements to refresh
	 * @return {Number}                     number of elements refreshed
	 */
	refresh(value) {

		if (value === undefined) {
			return this.refresh(Array.from(this.items.keys()));
		}

		this.soil(value);

		return this.clean();
	}

	/**
	 * Remove the registration of an element from the refresher.
	 * @param  {Refreshable|Set<Refreshable>} value element to remove
	 * @return {Number}                       number of elements removed
	 */
	delete(value) {

		if (value instanceof Set) {
			let count = 0;
			for (let each of value) count += this.delete(each);
			return count;
		} else if (this.items.has(value)) {
			const triggers = this.items.get(value);

			this.items.delete(value);
			this.versions.delete(value);
			this.propagate.delete(value);

			for (let trigger of triggers) {
				this.triggers.get(trigger).delete(value);
			}

			this.dirty.delete(value);

			return 1;
		}

		return 0;
	}

}


/**
 * Class representing the main body of the sheet.
 */
class Sheet {

	/**
	 * Initialize the sheet
	 * @param {Object} data - the json format game data
	 */
	constructor(data) {

		/* main definition data object */
		this.data = data;

		this.refresher = new Refresher(this);

		this.refresher.wait();

		/* prominently display the version data */
		const version = element("strong", [
			element("span", `Version ${Version.CURRENT.toString()} (`),
			element("a", {
				attrs: {"href": "./src/html/README.html"},
				content: "Changelog"}
			), ")"
		]);

		/* general layout divs */
		const right_section = element("div", version, "span-4");
		const skill_section = element("div", {class: ["span-1"]});
		const stats_section = element("div", {class: ["span-2"]});
		const class_section = element("div");
		const equip_section = element("div");

		const context  = {};
		const macros   = (function(templates) {

			const defs = {};

			function argist(tmp, head, ...args) {
				return element("div", [
					element("span", hilight(head)),
					element("ol", {
						class   : ["arglist"],
						content : args.map((a, i) => (
							element("li", [
								element("span", `${tmp.args[i]}`, "datum"),
								": ",
								a,
							])
						)),
					})
				]);
			}

			for (let each of templates) {
				const string      = each.define.join("\n");
				const [name, tmp] = Calculator.Template.parse(string, defs);
				defs[name]        = tmp;

				/* help and referencelookup stuff */
				const args = tmp.args.map(arg => `[${arg}]`).join(", ");
				tmp.called = tooltip(
					hilight(`Template: fill ${name}(${args})`),
					wrap(
						"Click on the text below to switch between showing a ",
						"description and the definition."
					)
				);
				tmp.about  = new SwapText([
					argist(tmp, wrap(...each.about), ...each.args),
					element("div", Calculator.highlight(string), "calc-code"),
				]).root;
			}

			return defs;

		})(data.macros);

		// for markup namespaces
		this.marker  = new Markup.Compiler(
			Reminder.getNamespace(definitions),
			this.refresher,
		);

		this.macros = new Macros.UserInterface(this);

		const compiler = new Calculator.Compiler(context, macros);
		this.compiler  = compiler;
		this.context(compiler, this.macros.varopts);
		this.definez   = context;

		this.view_triggers = new Set(["theme", "unit|size"]).extend(
			compiler.dependancies("unit|total|maxrng")
		).extend(
			compiler.dependancies("unit|total|minrng")
		);

		this.runenv    = new Calculator.Env(
			Calculator.Env.RUNTIME, this.definez
		);

		const predicates = {};
		const predicator = new Polish.Compiler(predicates, new Set());
		this.predicator  = predicator;
		this.predicates(predicates);
		this.predicatez = predicates;

		data.presets = Presetter.generate_presets();

		/* set lookup tables for each feature class */
		for (let each of Feature.SUBCLASSES) {
			each.setLookupByName(data, compiler, predicator, this.marker);
		}

		/* special nonsense */
		for (let each of Adjutant.byName.values()) {
			const gambit = each.gambit;
			if (!gambit) continue;
			Gambit.byName.set(gambit.name, gambit);
		}

		this.gameConfig = new CampaignConfiguration(this);

		Object.prototype.hasOwnProperty.call(localStorage, CampaignConfiguration.LOCAL)
			? this.gameConfig.import(
				JSON.parse(localStorage.getItem(CampaignConfiguration.LOCAL))
			)
			: this.gameConfig.clear();

		/* populate skills, stats, and growths */
		this.stats = new Stats(data.stats.names, this);
		stats_section.appendChild(this.stats.root);

		this.skills = new Skills.UserInterface(data.skills, this);
		skill_section.appendChild(this.skills.root);

		skill_section.appendChild(element("hr"));

		this.checks = new Checks.UserInterface(definitions.traits, this);
		skill_section.appendChild(this.checks.root);

		/* create callbacks for category events */
		const refresh = (category, key) => {
			console.log("refresh", key);
			category.toggleActive(key);

			const feature = category.model.get(key);
			this.refresher.refresh(feature.affects);
		};

		const forget  = (category, key) => {
			console.log("forget", key);
			category.delete(key);

			const feature = category.model.get(key);
			this.refresher.refresh(feature.affects);
		};

		const equip = (type) => {

			/* type should be "abilities" or "arts" */

			const capcost = `${type}|capcost`;

			return (category, key) => {
				this.refresher.refresh(capcost);

				const feature = category.get(key);

				if (feature.isConsideredInnate()) {

					category.setGroupFor(key, "innate");

					category.getGroup("class")?.shiftToFront();

					category.getGroup("innate").shiftToFront();
				}
			};
		};

		const unequip = (type) => {

			/* type should be "abilities" or "arts" */

			return (category, key) => {
				console.log("unequip", key);

				/* get the element in questions from the category */
				const element = category.element(key);

				/* either the classes abilites or arts array */
				const array   = this.character.class[type];

				/* check if this element is a class ability/art */
				const index   = array.findIndex(name => name == key);

				/* element is a class ability listed as an equipped */
				if (element.group == "equip" && index != -1) {
					element.group       = "class";
					element.reorderable = false;
					element.hidden      = true;
					element.removable   = false;

					element.shiftForward(category.size);
					element.shiftBackward(index);
				} else {
					category.delete(key);
				}

				const feature = category.model.get(key);
				this.refresher.refresh(feature.affects);
			};
		};

		this.tabs = {};

		const myFeatureTitle = ((feature) => feature.title());
		const myFeatureBody  = ((feature, refresher) => feature.body(false, refresher));
		const myTriggers     = ((feature) => feature.affects);

		let   sidebook = new Notebook(equip_section);

		this.tabs.assign = sidebook;

		this.animate = new Toggle("Play Animation when Preview Changes?", true, (value) => {
			this.myPointBuy.setAnimated(value);
		});

		sidebook.add("Levels", element("div", [
			element("input", {
				class : ["simple-border"],
				attrs : {
					type    : "button",
					value   : "Use Bases",
					onclick : (() => this.copy_point_buy())
				}
			}),
			element("input", {
				class : ["simple-border"],
				attrs : {
					type    : "button",
					value   : "Use Level",
					onclick : (() => this.copy_point_buy_stats())
				}
			}),
			element("input", {
				class : ["simple-border"],
				attrs : {
					type    : "button",
					value   : "Clear Points",
					onclick : (() => this.clear_point_buy())
				}
			}),
			element("br"),
			this.animate.root,
			element("br"),
			this.stats.pointbuy.root,
		]));

		/* Ability category */

		const updateVerdictElement = ((space, method) =>
			() => {
				while (space.hasChildNodes())
					space.removeChild(space.lastChild);

				const verdict = method();

				if (verdict) space.appendChild(verdict);
			}
		);

		let model = new CategoryModel(
			Ability.kind, Ability.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this._abilities_verdict = element("div", "", "computed");

		this.refresher.register(
			updateVerdictElement(
				this._abilities_verdict,
				() => this.checkAbilitySlots(),
			),
			[
				"abilities|capcost", "game|maxcap_abilities", "unit|level",
				...definitions.skills
			]
		);

		this.abilities = new MultiActiveCategory(model, {
			name        : "equip",
			empty       : "No abilities are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onadd       : equip("abilities"),
			onremove    : unequip("abilities"),
			select      : Ability.select(null, this.refresher),
			refresher   : this.refresher,
			groupShowTitle : capitalize,
			groupReorderable : false,
		});

		sidebook.add("Abilities",  element("div", [
			element("span", this._abilities_verdict, "computed"),
			this.abilities.root,
		]));

		/* Art category */

		model = new CategoryModel(
			Art.kind, Art.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this._arts_verdict = element("div", "", "computed");

		this.refresher.register(
			updateVerdictElement(
				this._arts_verdict,
				() => this.checkArtsSlots(),
			),
			[
				"arts|slotcost", "game|maxcap_arts", "game|maxcap_combat",
				"game|maxcap_combat", "unit|level", ...definitions.skills
			]
		);

		this.arts = new MultiActiveCategory(model, {
			name        : "equip",
			empty       : "No arts are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : ((category, key) => {
				console.log("refresh", key);

				const feature = category.model.get(key);

				// It's always fine to deactivate an art; nothing to break.
				if (category.isActive(key)) {
					category.toggleActive(key);

					// this.stats.refresh();
					this.refresher.refresh(feature.affects);
					return;
				}

				// Alright so we're activating one now, it seems.
				const art      = Art.get(key);
				const active   = category.getActiveValues();

				// Assumes zero or one tactical arts active.
				if (art.isTactical()) {
					const swap = active.find(x => x.isTactical());
					if (swap) category.toggleActive(swap.name);
				}

				// Assumes zero or one normal arts active.
				else if (art.isNormal()) {
					const swap = active.find(x => x.isNormal());
					if (swap) category.toggleActive(swap.name);

					// Guard againt a third being activated.
					if (active.count(x => x.isCombo()) == 2) return;
				}

				// At most two combo (and if two, no normal)
				else {
					const swap = active.filter(x => x.isCombo());

					// If there's two we can't do much, but if there's one
					// and a normal we can swap the two combos around.
					if (swap.length == 1 && active.find(x => x.isNormal())) {
						category.toggleActive(swap[0].name);
					}

					// Guard against a third being activated.
					if (swap.length == 2) return;
				}

				// Then just activate this one.
				category.toggleActive(key);

				// this.stats.refresh();
				this.refresher.refresh(feature.affects);
			}),
			onadd       : equip("arts"),
			onremove    : unequip("arts"),
			select      : Art.select(null, this.refresher),
			refresher   : this.refresher,
			groupShowTitle : capitalize,
			groupReorderable : false,
			// defaultGroup : "equip",
		});

		sidebook.add("Arts", element("div", [
			this._arts_verdict,
			this.arts.root,
		]));

		this.experiences = new Experiences();
		sidebook.add("Experiences", this.experiences.root);

		/* battalions tab for test */
		this.battalion  = new Battalions(this);

		sidebook.active = "Levels";

		/* set up the characters and options tabs */

		let notebook = new Notebook(right_section);
		this.tabs.main = notebook;

		const buildnb = new Notebook([notebook.root, class_section]);

		this.character = new Characters(this);

		const character_bb = new Buildables({
			name        : "characters",
			empty       : "If you're reading this, something has gone wrong",
			model       : this.character,
			sortfilter  : Preset.select(),
			update      : Legacy.character,
			groups      : "custom",
			updateBatch : Legacy.batchOfCharacters,
		});

		const battalion_bb = new Buildables({
			name        : "battalions",
			empty       : "Not leading a battalion",
			templates   : data.battalions.filter(x => !x.hidden).map(x => x.name),
			model       : this.battalion,
			update      : Legacy.battalion,
			updateBatch : Legacy.batchOfBattalions,
		});

		this.inv  = new Inventory(this);

		const item_bb = new Buildables({
			name         : "items",
			empty        : "No items",
			model        : this.inv,
			sortfilter   : Item.select(null, this.refresher),
			update       : Legacy.item,
			selectGroup  : "convoy",
			groups       : ["inventory", "convoy"],
			updateBatch  : Legacy.batchOfItems,
			groupShowTitle : capitalize,
		});

		this.cb = character_bb;

		buildnb.add("Character", [character_bb.root, this.character.root]);

		this.wb = item_bb;

		buildnb.add("Inventory", [item_bb.root, this.inv.root]);

		this.bb = battalion_bb;

		buildnb.add("Battalion", [battalion_bb.root, this.battalion.root]);

		buildnb.active = "Character";

		this.tabs.create = buildnb;

		notebook.add("Create", buildnb.root);
		equip_section.append(sidebook.root);

		notebook.add("Assign", equip_section);

		const gloss = new Notebook();

		model = new CategoryModel(
			Condition.kind, Condition.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.conditions = new MultiActiveCategory(model, {
			empty       : "No conditions",
			selectable  : true,
			toggleable  : false,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : (() => void(0)),
			onremove    : forget,
			select      : Condition.select(),
			refresher   : this.refresher,
		});
		gloss.add("Conditions", this.conditions.root);

		model = new CategoryModel(
			Tile.kind, Tile.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.tiles = new MultiActiveCategory(model, {
			empty       : "No tiles",
			selectable  : true,
			toggleable  : false,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : (() => void(0)),
			onremove    : forget,
			select      : Tile.select(),
			refresher   : this.refresher,
		});

		gloss.add("Tiles", this.tiles.root);

		gloss.active = "Conditions";

		this.tabs.gloss = gloss;

		notebook.add("Glossary", gloss.root);

		const tools = new Notebook(undefined, true);

		tools.add("Macros", element("div", this.macros.root));

		this.myPointBuy = this.stats.pointbuy;
		this.myPresetter = new Presetter();

		tools.add("NPCs", this.myPresetter.root);

		const legacy_bb  = new Buildables({
			name      : "legacy",
			// empty     : "No Version 1.9.1 or earlier character sheets.",
			empty     : "This feature has been disabled.",
			// templates : ["Everything but export is disabled."],
			templates : ["This feature has been disabled."],
			model     : (function () {

				const model_data = {
					name        : "None",
					description : "None",
				};

				return {
					name   : model_data.name,
					data   : model_data,

					/* builtable display */

					getTitle: (function(object) {
						return object.name;
					}),

					getBody: (function(object) {
						return element("span", object.description, "trunc");
					}),

					import : (function(object) {
						this.name = object.name;
						this.data = object;
					}),

					export : (function() {
						return this.data;
					}),

					clear  : (function(template) {
						console.log(template);
						this.name = model_data.name;
						this.data = model_data;
					}),
				};
			})(),
			updateBatch : Legacy.batchOfCharacters,
		});

		/* don't want users adding any new sheets here */
		legacy_bb._add.disabled                = true;
		legacy_bb._copy.label.disabled         = true;
		legacy_bb._save.label.disabled         = true;
		legacy_bb._import.label.disabled       = true;
		legacy_bb._batch_import.label.disabled = true;
		legacy_bb.category.removable           = false;

		/* fill the legacy buildables if there's data for it */
		const legacy_storage = localStorage.getItem("session");

		if (legacy_storage !== null) {
			const legacy = JSON.parse(legacy_storage);
			const modern = {active: "0", elements: {}};

			for (let i = 0; i < legacy.characters.length; ++i) {
				modern.elements[String(i)] = legacy.characters[i];
			}

			// legacy_bb.importAll(modern); TODO fix or remove
			// there's an issue with the new category multiselect model
		}

		this.lb = legacy_bb;

		const legacy_button = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Convert & Import Legacy Characters",
				onclick : (() => {
					this.legacy();
					this.tabs.main.active   = "Create";
					this.tabs.create.active = "Characters";
				}),
			},
		});

		tools.add("Legacy", element("div", [
			legacy_button,
			legacy_bb.root,
		]));

		model = new CategoryModel(
			"themes", Theme.MAP, (x) => x.name, (x) => x.description, () => []
		);

		const configure = element("div");

		this._autosave_conf = new AutosaveConfiguration(this);

		configure.appendChild(this._autosave_conf.root);

		configure.appendChild(
			element("fieldset", [
				element("legend", element("strong", "Troubleshoot")),
				element("input", {
					class : ["simple-border"],
					attrs : {
						type    : "button",
						value   : "Launch Session Editor",
						onclick : (() =>
							void SessionEditor.startLaunch()
						),
					}
				})
			])
		);

		this.themes  = new SingleActiveCategory(model, {
			empty       : "If you're reading this, there is no theme",
			selectable  : false,
			reorderable : false,
			removable   : false,
			ontoggle    : ((category , key) => {
				// do not turn off theme if it is reselected
				if (key == category.active) {
					category.toggleActive(key);
				}

				// reapply theme either way to make debug easier
				this.theme(key);
			}),
		});

		for (let theme of Theme.MAP.keys()) this.themes.add(theme);
		this.themes.toggleActive(Theme.get());

		configure.appendChild(
			element("fieldset", [
				element("legend", element("strong", "Themes")),
				this.themes.root,
			])
		);

		const subconf   = new Notebook(undefined, true);

		subconf.add("Application", configure);

		subconf.add("Campaign", this.gameConfig.root);

		subconf.active = "Application";

		tools.add("Configure", subconf.root);

		tools.active = "Configure";

		this.tabs.tools = tools;

		notebook.add("Tools", tools.root);

		notebook.active = "Create";

		/* prompt user to reload last session */
		Object.prototype.hasOwnProperty.call(localStorage, "v2session")
			? this.autoload()
			: this.cb.add();

		Object.prototype.hasOwnProperty.call(localStorage, "autosave")
			? this._autosave_conf.import(
				JSON.parse(localStorage.getItem("autosave"))
			)
			: void(0);

		/* autosave current sheet every five minutes */
		this._autosave_conf.setInterval();

		this.myPointBuy.setAnimated(this.animate.checked);

		this.root = element("div", {
			class   : ["container"],
			content : [
				skill_section,
				stats_section,
				element("div", {
					class   : ["span-3"],
					content : class_section,
				}),
				element("div", {
					class   : ["span-4"],
					content : [
						version,
						this.tabs.main.root,
					]
				}),
			]
		});

		// We can do this now that all is initialized
		this.stats.va.refresh();
		this.refresher.signal();
	}

	predicates(base) {
		return (
			this._predicates
				??
			(this._predicates = Requirements.createContext(base, this, definitions))
		);
	}

	context(compiler) {

		if (this._context) return this._context;

		const base = compiler.context;

		function sum(env, ...args) {
			return (
				env.runtime
					? args.reduce((a, b) => a + b, 0)
					: args.reduce((a, b) =>
						a != 0
							? (b != 0
								? `${a} + ${b}`
								: a)
							: b,
					0)
			);
		}

		/* this.macros must be initialized before this is called */
		const vardiv = this.macros.varopts;
		const varsen = [];
		const ctx    = base || {};

		const add = (template) => {
			const fn = compiler.define(template);
			varsen.push(fn.called);
			return fn.called;
		};

		this._js_vmap = new Map();

		const funcsum = (...names) => {

			const vars = [];

			for (let name of names) {
				const type = typeof name;
				if (type == "function") {

					// a hash name has already been made for this
					if (this._js_vmap.has(name)) {
						vars.push(this._js_vmap.get(name));
						continue;
					}

					// create a hash name for this function
					const uid = `uid|${uniqueID().replace(/-/g, "_")}`;

					add({
						name  : uid,
						about : "Anonymous function.",
						expr  : name,
					});

					this._js_vmap.set(name, uid);
					vars.push(uid);

				} else if (type == "string") {

					vars.push(name);

				} else {
					throw new Error(`type ${type} is invalid`);
				}
			}

			return vars.join("\n  + ");
		};

		const multisum = (getter, filter) => {

			if (!filter) filter = (x => true);

			return (field) => {
				return (env) => {

					// Unfortunate but necessary; uninitialized in outer scope.
					const category = getter();

					let a = 0;
					for (let each of category.getActive()) {
						const feature  = category.model.get(each);
						if (!filter(feature)) continue;
						const modifier = feature.modifier(field, env);
						if (modifier == 0) continue;

						a = sum(env, a, label(env, feature.name, modifier));
					}

					return a;
				};
			};
		};

		const abilityfunc = multisum(() => this.abilities);
		const artfunc     = multisum(() => this.arts);
		const combatfunc  = multisum(() => this.arts, (art) => !art.isTactical());
		const tacticfunc  = multisum(() => this.arts, (art) =>  art.isTactical());

		const gambitfunc = (desig, onlyActive=true) => {
			const name   = desig;
			const active = onlyActive;

			return ((env) => {

				let a = 0;

				const iter = (
					active
						? this.battalion.gambits.getActive()
						: this.battalion.gambits.names()
				);

				for (let each of iter) {

					const gambit = Gambit.get(each);
					// if (ability.tagged("art")) continue;
					const modifier = gambit.modifier(name, env);
					if (modifier == 0) continue;

					a = sum(env, a, label(env, gambit.name, modifier));
				}

				return a;
			});
		};

		const gambitoverfunc = (desig, onlyActive=true) => {
			const name   = desig;
			const active = onlyActive;

			return ((env) => {

				let a = 0, s = true;

				const iter = (
					active
						? this.battalion.gambits.getActive()
						: this.battalion.gambits.values()
				);

				for (let each of iter) {
					const g = Gambit.get(each);
					const m = g.modifier(name, env);

					if (!g.tagged("structure")) s = false;
					a = s ? sum(env, a, label(env, g.name, m)) : m;
				}

				return a;
			});
		};

		function label(env, text, value) {
			if (!env.runtime && env.label && value != "0") {
				if (typeof value == "string" && value.includes(" ")) {
					return `(${value}) [${text}]`;
				}
				return `${value} [${text}]`;
			}
			return value;
		}

		// .88b  d88. d888888b .d8888.  .o88b.
		// 88'YbdP`88   `88'   88'  YP d8P  Y8
		// 88  88  88    88    `8bo.   8P
		// 88  88  88    88      `Y8b. 8b
		// 88  88  88   .88.   db   8D Y8b  d8
		// YP  YP  YP Y888888P `8888Y'  `Y88P'
		

		for (const key in CampaignConfiguration.DEFINED) {

			const defined  = CampaignConfiguration.DEFINED;

			add({
				name  : `game|${key}`,
				about : defined[key],
				expr  : ((env) => this.gameConfig.values[key].value),
			});
		}

		add({
			name  : "other|trigger",
			about : "SBAC trigger modifier",
			expr  : abilityfunc("trigger"),
		});

		add({
			name  : "unit|level",
			about : "This unit's level",
			expr  : ((env) => this.stats.level)
		});

		add({
			name  : "unit|size",
			about : "Unit's length and width in tiles (units are squares).",
			expr  : ((env) => this.stats.size)
		});

		add({
			name  : "other|recursion",
			about : "If the interpreter is broken this will freeze the page.",
			expr  : "other|recursion",
		});

		add({
			name  : "other|range_penalty",
			about : wrap(
				"The hit penalty for attacking past maximum weapon range."
			),
			expr : (env) => {

				// this is only ever relevant in macrogen
				if (env.runtime) return 0;

				const rnv    = env.clone(Calculator.Env.RUNTIME);
				const max    = rnv.read("unit|total|maxrng");
				const cut    = rnv.read("host|maxrng");
				const diff   = max - cut;

				// we don't need anything for this unless the user asks
				// us to explicitly put it in, so otherwise save on clutter
				const hasCloseCounter = (
					this.abilities.active.has("Close Counter")
						&&
					rnv.read("host|type|bows")
				);

				const hasFarCounter = (
					this.abilities.active.has("Far Counter")
						&&
					rnv.read("host|type|brawl")
				);

				if (
					diff == 0
						&&
					!this.macros._ranges.checked
						&&
					!hasCloseCounter
						&&
					!hasFarCounter
				) return "0";

				const m      = new Macros.Builder();
				const min    = rnv.read("unit|total|minrng");
				const prompt = ["Range?"];

				const option = ((start, stop, penalty) => {
					if (start == stop) {
						return `Range ${start} (Hit -${penalty})`;
					}
					return `Range ${start}-${stop} (Hit -${penalty}`;
				});

				let range = min, start = min, last = -1;
				for (range = min; range <= max; ++range) {
					const raw     = 20 * (range - cut);
					const penalty = Math.min(60, Math.max(0, raw));

					if (last >= 0 && last !== penalty) {
						prompt.push(option(start, range - 1, last), -last);
						start = range;
					}

					last = penalty;
				}
				prompt.push(option(start, range - 1, last), -last);

				if (hasCloseCounter) {
					prompt.push("Close Counter (Hit -0)", -0);
				}

				if (hasFarCounter) {
					prompt.push("Far Counter (Hit -0)", -0);
				}

				// in case we only end up with one range grouping such as
				// at times when this.macros._ranges.checked is set to true
				if (prompt.length == 3) prompt.push("No Penalty", 0);

				return m.merge(m.prompt(...prompt)).join("");
			}
		});

		for (let each of definitions.skills) {
			const skill = each;

			add({
				name  : `unit|rank|${Calculator.asIdentifier(skill)}`,
				about : wrap(
					`Unit's numerical ${skill} rank.`
				),
				expr  : ((env) => Grade.toNumber(this.skills[skill].grade))
			});
		}

		add({
			name  : "unit|rank|max",
			about : wrap(
				"Unit's highest numerical skill rank."
			),
			expr  : ((env) => {
				let highest = 0;
				for (let name of this.skills.names) {
					const grade = Grade.toNumber(this.skills[name].grade);
					highest     = Math.max(highest, grade);
				}
				return highest;
			}),
		});

		for (let each in definitions.traits) {

			const trait = each;

			add({
				name  : `unit|trait|${trait}|rank`,
				about : wrap(
					"Trait rank determined from skills/custom assignment"
				),
				expr  : ((env) => {
					const custom = this.checks[trait]._rank.value;
					const free   = env.read("game|free_traits");
					return Checks.rank(this, trait, free * custom);
				}),
			});

			add({
				name  : `unit|trait|${trait}|bonus`,
				about : wrap(
					"Trait bonus as determined by trait rank"
				),
				expr  : ((env) =>  {
					const custom = this.checks[trait]._rank.value;
					const free   = env.read("game|free_traits");
					return Checks.bonus(this, trait, free * custom);
				}),
			});
		}

		add({
			name  : "unit|traits",
			about : "Select for which trait to roll a check with.",
			expr  : `
				label([trait],
					ask [Trait?]
						case [Athletics] {unit|trait|Athletics|bonus}
						case [Precision] {unit|trait|Precision|bonus}
						case [Endurance] {unit|trait|Endurance|bonus}
						case [Canniness] {unit|trait|Canniness|bonus}
						case [Spirit]    {unit|trait|Spirit|bonus}
						case [Acuity]    {unit|trait|Acuity|bonus}
					end
				)
			`
		});

		add({
			name  : "unit|experiences",
			about : "Select for which experience to roll a check with.",
			expr  : ((env) => {

				// not relevant for use in sheet
				if (env.runtime) return 0;

				const m = new Macros.Builder();
				const e = ["Experience?", "No Experience", 0];

				for (let record of this.experiences.records.values()) {
					e.push(record.phrase, record.bonus);
				}

				const macro = m.merge(m.prompt(...e)).join("");
				return label(env, "experience", macro);
			})
		});

		add({
			name  : "unit|ease",
			about : "Check ease for this unit.",
			expr  : `
				label([ease], ask [Ease?] end)
					+ unit|traits
					+ unit|experiences
					+ ask [Other Modifiers?] end
			`
		});

		// d888888b d8888b. d888888b  .d8b.  d8b   db  d888b  db      d88888b
		// `~~88~~' 88  `8D   `88'   d8' `8b 888o  88 88' Y8b 88      88'
		//    88    88oobY'    88    88ooo88 88V8o 88 88      88      88ooooo
		//    88    88`8b      88    88~~~88 88 V8o88 88  ooo 88      88~~~~~
		//    88    88 `88.   .88.   88   88 88  V888 88. ~8~ 88booo. 88.
		//    YP    88   YD Y888888P YP   YP VP   V8P  Y888P  Y88888P Y88888P

		add({
			name  : "other|triangle",
			about : wrap(
				"The numerical value of the selected option of the Triangle ",
				"Effect select widget in the Create => Characters tab of the ",
				"unit builder.",
			),
			expr  : ((env) => this.character.triangle)
		});

		add({
			name  : "other|triangle|advantage",
			about : "Weapon triangle advantage value.",
			expr  : "+15",
		});

		add({
			name  : "other|triangle|neutral",
			about : "Weapon triangle neutral value.",
			expr  : "0",
		});

		add({
			name  : "other|triangle|disadvantage",
			about : "Weapon triangle disadvantage value.",
			expr  : "-15",
		});

		add({
			name  : "other|mounted",
			about : "Whether unit is mounted or not.",
			expr  : ((env) => Number(this.character.mounted)),
		});

		add({
			name  : "other|morphed",
			about : "Whether unit is morphed or not.",
			expr  : ((env) => Number(this.character.mounted)),
		});

		add({
			name  : "other|triangle|prompt",
			about : wrap(
				"Code that generates a prompt asking for the user to select ",
				"a Triangle Effect value when converted into a Roll20 macro. ",
				"Evaluates to 0 in the character builder.",
			),
			expr  : `
				ask [Triangle Effect?]
					else Neutral      {0}
					case Advantage    {+15}
					case Disadvantage {-15}
				end
			`,
		});

		add({
			name  : "other|triangle|conditional",
			about : wrap(
				"Takes into account whether this is codegen, in which case it ",
				"evaluates to other|triangle, or macrogen, in which cast it ",
				"evaluates to other|triangle|prompt. Additionally, if an art or ",
				"item that has the 'no triangle' tag is equipped, instead ",
				"evaluates to 0."
			),
			expr : `
				bothif not(item|tagged|no_triangle or arts|tagged|no_triangle) then
					other|triangle|prompt
				else
					0
				end
			`
		});

		add({
			name  : "other|initiative",
			about : wrap(
				"The numerical value of the selected option of the Combat ",
				"Initiative select widget in the Create => Characters tab of ",
				"the unit builder."
			),
			expr  : ((env) => this.character.initiative)
		});

		add({
			name  : "other|initiative|n_a",
			about : "Combat initiative value for not applicable.",
			expr  : "0",
		});

		add({
			name  : "other|initiative|unit",
			about : "Combat initiative value for unit initiated.",
			expr  : "1",
		});

		add({
			name  : "other|initiative|foe",
			about : "Combat initiative value for foe initiated.",
			expr  : "2",
		});

		add({
			name  : "other|kindred",
			about : wrap(
				"The numerical value of the selected option of the Kinded ",
				"select widget in the Create => Characters tab of the unit ",
				"builder. Used in computing what traits Morph gives bonuses."
			),
			expr  : ((env) => this.character.kindred)
		});

		// d8888b. d8888b. d888888b .88b  d88.  .d8b.  d8888b. db    db
		// 88  `8D 88  `8D   `88'   88'YbdP`88 d8' `8b 88  `8D `8b  d8'
		// 88oodD' 88oobY'    88    88  88  88 88ooo88 88oobY'  `8bd8'
		// 88~~~   88`8b      88    88  88  88 88~~~88 88`8b      88
		// 88      88 `88.   .88.   88  88  88 88   88 88 `88.    88
		// 88      88   YD Y888888P YP  YP  YP YP   YP 88   YD    YP

		for (let each of this.data.stats.first) {

			const name = each;

			const prime = [];

			add({
				name  : `unit|base|${name}`,
				about :
					`The unit's base ${name} statistic before modifiers.`
				,
				expr  : ((env) => {
					const value =  this.stats.stats[name].value;
					return label(env, `base ${name}`, value);
				}),
			});

			add({
				name  : `unit|growth|${name}`,
				about : `The unit's base ${name} growth before modifiers.`,
				expr  : ((env) => {
					return this.stats.growths[name].value;
				})
			});

			prime.push(add({
				name  : `unit|var_base|${name}`,
				about : wrap(
					"The unit's base ${name} statistic before modifiers, but",
					"gets replaced with a Roll20 variable name when used ",
					"to generate a Roll20 macro."
				),
				expr  : `alias([${capitalize(name)}], unit|base|${name})`,
			}));

			prime.push(add({
				name  : `class|base|${name}`,
				about : `The unit's class's ${name} modifier.`,
				expr  : ((env) => {
					const value = this.character.class.modifier(name, env);
					return label(env, "cls", value);
				}),
			}));

			add({
				name  : `class|growth|${name}`,
				about : `The unit's class's ${name} growth modifier.`,
				expr  : ((env) => {
					return this.character.class.growth(name);
				})
			});

			add({
				name  : `unit|total|growth|${name}`,
				about : `The unit's total ${name} growth after modifiers.`,
				expr  : ((env) => {

					// read out components
					const unit = env.read(`unit|growth|${name}`);
					const cls  = env.read(`class|growth|${name}`);

					// the normal sum of the growths
					const sum  = Math.max(0, unit + cls);

					// add limiter (negative) to sum growth to get final
					const grow = sum + Forecast.diminish(sum, name);

					return grow;
				}),
			});

			if (name == "mov") {
				add({
					name  : `class|mounted|${name}`,
					about : wrap(
						`Evaluates to the unit's class's mount's ${name} `,
						"modifier if the 'Mounted?' checkbox under Create => ",
						"Characters is checked, otherwise always evaluates to 0.",
					),
					expr  : ((env) => {
						const cls = this.character.class;
						return label(env, "mnt",
							cls.hasMount() && this.character.mounted
								? cls.mount
								: 0
						);
					}),
				});

				add({ /* not added to prime because we want it conditional */
					name  : `class|mount|${name}`,
					about : wrap(
						`The unit's class's mount's ${name} modifier. If `,
						"the unit's class has not mount, evaluates to 0.",
					),
					expr  : ((env) => {
						const cls = this.character.class;
						return label(env, "mount",
							cls.hasMount()
								? cls.mount
								: 0
						);
					}),
				});

				prime.push(add({
					name  : `class|ask_mounted|${name}`,
					about : wrap(
						`Evaluates to class|mounted|${name} in the character `,
						"builder, but creates a prompt in the generated Roll20 ",
						`macro for class|mount|${name}, so long as the value `,
						`of class|mount|${name} is not 0.`,
					),
					expr  : `
						metaif builtins|macrogen then
							metaif class|mount|${name} then 
								ask cat([Mounted? #], class|mount|${name})
									else Yes {class|mount|${name}}
									case No  {0}
								end
							else
								0
							end
						else
							class|mounted|${name}
						end
					`,
				}));
			}

			prime.push(add({
				name  : `abilities|${name}`,
				about :
					`The sum of all ${name} modifiers from active abilities.`
				,
				expr  : abilityfunc(name),
			}));

			add({
				name  : `unit|modifier|${name}`,
				about : `The sum of all ${name} modifiers.`,
				expr  : funcsum(...prime),
			});

			add({
				name  : `unit|total|${name}`,
				about : wrap(
					`The unit's total ${name} statistic after `,
					"modifiers.",
				),
				expr  : funcsum(...prime),
			});
		}

		// d888888b  .d8b.   d888b   d888b  d88888b d8888b.
		// `~~88~~' d8' `8b 88' Y8b 88' Y8b 88'     88  `8D
		//    88    88ooo88 88      88      88ooooo 88   88
		//    88    88~~~88 88  ooo 88  ooo 88~~~~~ 88   88
		//    88    88   88 88. ~8~ 88. ~8~ 88.     88  .8D
		//    YP    YP   YP  Y888P   Y888P  Y88888P Y8888D'

		add({
			name  : "unit|tagged|healing",
			about : wrap(
				"A flag; 1 if art is tagged with 'healing' and 0 if ",
				"art is not tagged with 'healing'. The 'healing' tag ",
				"indicates whether the art's might is applied as healing ",
				"or as damage. Used in the macro builder.",
			),
			expr : `
				bothif item|tagged|healing
					then item|tagged|healing
					else arts|tagged|healing
				end
			`
		});

		let item_tags = new Set();

		for (let item of Iter.chain(definitions.items, definitions.attributes)) {

			for (let tag of item.tags) {

				const name       = tag;
				const identifier = Calculator.asIdentifier(tag);
				if (item_tags.has(tag)) continue;

				for (const itemID of Inventory.ITEM_IDS) add({
					name  : `${itemID}|tagged|${identifier}`,
					about : wrap(
						`A flag; 1 if ${itemID} is tagged with '${tag}' and `,
						`0 if ${itemID} is not tagged with '${tag}'.`
					),
					expr  : ((env) => {
						const item   = this.inv.get(itemID);
						const active = item.attributes.getActiveValues();

						for (let each of active)
							if (each.tagged(name))
								return 1;

						return Number(item.tagged(name));
					}),
				});

				// this exists specfically to implement discipline master
				add({
					name  : `inventory|${identifier}`,
					about : wrap(
						`The number of inventory items tagged with '${tag}'`,
					),
					expr  : ((env) => {
						this.wb.sync();

						let count = 0;

						for (let each of this.wb.category.values("inventory")) {

							// Check the item's custom tags.
							if (each.tags.includes(tag)) {
								++count; continue;
							}

							// Check the item's template tags.
							const item = Item.get(each.template);

							if (item.tagged(tag)) {
								++count; continue;
							}

							// Check tags on attributes.
							for (let attr of each.attributes) {
								const attribute = Attribute.get(attr.id);
								if (attribute.tagged(tag)) {
									++count; break;
								}
							}
						}

						return count;
					}),
				});

				item_tags.add(tag);
			}
		}

		const art_tags = new Set();

		for (let art of definitions.arts) {
			for (let tag of art.tags) {

				const name = tag;
				if (art_tags.has(tag)) continue;

				const id = Calculator.asIdentifier(tag);

				add({
					name  : `arts|tagged|${id}`,
					about : wrap(
						`A flag; 1 if any active art is tagged with '${tag}' and 0 otherwise.`
					),
					expr : ((env) => {
						const active = this.arts.getActiveValues();

						for (let each of active) {
							if (each.tagged(name)) return 1;
						}

						return 0;
					}),
				});

				add({
					name  : `tactical|tagged|${id}`,
					about : wrap(
						`A flag; 1 if any active tactical art is tagged with '${tag}' and 0 otherwise.`
					),
					expr  : ((env) => {
						return Number(this.arts.getActiveValues().any((art) =>
							art.isTactical() && art.tagged(name)
						));
					}),
				});

				art_tags.add(tag);
			}
		}

		for (let each of item_tags.intersect(art_tags)) {

			const tag = Calculator.asIdentifier(each);

			add({
				name  : `host|tagged|${tag}`,
				about : wrap(
					`A flag; 1 if host is tagged with '${tag}' and 0 otherwise.`
				),
				expr  : `item|tagged|${tag} or tactical|tagged|${tag}`,
			});
		}

		add({
			name  : "unit|multiplier|healing",
			about : wrap(
				"Used to halve base magic for healing spell might; value is ",
				"0.5 if item is tagged with 'healing' and is 1.0 if not."
			),
			expr  : `
				bothif arts|tagged|healing or item|tagged|healing
					then 0.5
					else 1.0
				end
			`,
		});

		// d88888b db       .d8b.   d888b  .d8888.
		// 88'     88      d8' `8b 88' Y8b 88'  YP
		// 88ooo   88      88ooo88 88      `8bo.
		// 88~~~   88      88~~~88 88  ooo   `Y8b.
		// 88      88booo. 88   88 88. ~8~ db   8D
		// YP      Y88888P YP   YP  Y888P  `8888Y'

		for (const itemID of Inventory.ITEM_IDS) add({
			name  : `${itemID}|passes`,
			about : wrap(
				"A flag; whether a the equipped item passes requirements."
			),
			expr  : ((env) => {
				const item      = this.inv.get(itemID);
				const rank      = item._rank._trigger(item.rank);
				const type      = item.template.type;
				const source    = type ? `${type} ${rank}` : "None";
				const predicate = this.predicator.compile(source);
				return Number(predicate.exec().boolean);
			}),
		});

		for (let each of Item.TYPE.strings.entries()) {

			const [num, str] = each;

			for (const itemID of Inventory.ITEM_IDS) add({
				name  : `${itemID}|type|${str.toLowerCase()}`,
				about : wrap(
					`Evaluates to 1 if item type is ${str}, and otherwise `,
					"evaluates to 0."
				),
				expr  : ((env) => {
					const string = this.inv.get(itemID).template.type;
					const number = Item.TYPE.asNumber(string);
					return number == num;
				}),
			});

			add({
				name  : `inventory|type|${str.toLowerCase()}`,
				about : wrap(
					`The number of ${str} items in the inventory.`
				),
				expr  : ((env) => {
					this.wb.sync();

					let count = 0;

					for (let each of this.wb.category.values()) {
						const string = Item.get(each.template).type;
						const number = Item.TYPE.asNumber(string);
						if (number == num) count++;
					}

					return count;
				}),
			});
		}

		/* has to use the raw data because Attributes isn't populated yet */
		for (let each of definitions.attributes) {

			const name       = each.name;
			const identifier = Calculator.asIdentifier(name);

			for (const itemID of Inventory.ITEM_IDS) add({
				name  : `${itemID}|has_attribute|${identifier}`,
				about : wrap(
					`Evaluates to 1 if item has the ${name} attribute, `,
					"and otherwise evaluates to 0."
				),
				expr  : ((env) => {
					return Number(this.inv.get(itemID).attributes.active.has(name));
				}),
			});
		}

		// used to implement crest abilities; doesn't need equipment equivalent
		add({
			name  : "item|type|weapon",
			about : wrap(
				"Evaluates to 1 if item skill type is Axes, Swords, Lances, ",
				"Brawling, or Bows, and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.inv.get("item").template.type;
				const number = Item.TYPE.asNumber(string);
				return 1 <= number && number <= 5;
			}),
		});

		// used to implement crest abilities; doesn't need equipment equivalent
		add({
			name  : "item|type|spell",
			about : wrap(
				"Evaluates to 1 if item skill type is Faith, Guile, or Reason, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.inv.get("item").template.type;
				const number = Item.TYPE.asNumber(string);
				return 6 <= number && number <= 8;
			}),
		});

		for (let each of Item.TYPE.strings.entries()) {

			const [_num, str] = each;

			add({
				name  : `arts|type|${str.toLowerCase()}`,
				about : wrap(
					`The number of combat arts with the ${str} skill type.`
				),
				expr  : ((env) => {
					const type = Item.TYPE.asNumber(str);
					return this.arts.getActiveValues().count((art) =>{
						const number = Item.TYPE.asNumber(art.type);
						return !art.isTactical() && type == number;
					});
				}),
			});

			add({
				name  : `tactical|type|${str.toLowerCase()}`,
				about : wrap(
					`The whether an active tactical art is ${str} skill type.`
				),
				expr  : ((env) => {
					const type = Item.TYPE.asNumber(str);
					return this.arts.getActiveValues().count((art) =>{
						const number = Item.TYPE.asNumber(art.type);
						return art.isTactical() && type == number;
					});
				}),
			});

			add({
				name  : `host|type|${str.toLowerCase()}`,
				about : wrap(
					`The whether equipped item or active tactical art is ${str} skill type.`
				),
				expr  : `
					bothif arts|tactical
						then tactical|type|${str.toLowerCase()}
						else item|type|${str.toLowerCase()}
					end
				`,
			});
		}

		add({
			name  : "tactical|type",
			about : wrap(
				"The skill type of the equipped tactical art or 0 if none."
			),
			expr  : ((env) => {
				for (let each of this.arts.getActiveValues()) {
					if (each.isTactical()) return Item.TYPE.asNumber(each.type);
				}
				return 0;
			}),
		});

		for (const itemID of Inventory.ITEM_IDS) add({
			name  : `${itemID}|type`,
			about : wrap(
				"The skill type of the equipped item or 0 if none."
			),
			expr  : ((env) => {
				const string = this.inv.get(itemID).template.type;
				const number = Item.TYPE.asNumber(string);
				return number;
			}),
		});

		add({
			name  : "host|type",
			about : wrap(
				"The skill type of the equipped tactical art or item or 0 if none."
			),
			expr  : `
				bothif arts|tactical
					then tactical|type
					else item|type
				end
			`,
		});

		add({
			name  : "arts|type|weapon",
			about : wrap(
				"The number of combat arts with an Axes, Swords, Lances, Brawl, ",
				"or Bows skill type."
			),
			expr  : ((env) =>
				this.arts.getActiveValues().count((art) => {
					const number = Item.TYPE.asNumber(art.type);
					return !art.isTactical() && 1 <= number && number <= 5;
				})
			)
		});

		add({
			name  : "arts|type|spell",
			about : wrap(
				"The number of combat arts with a Faith, Guile, or Reason skill type."
			),
			expr  : ((env) =>
				this.arts.getActiveValues().count((art) => {
					const number = Item.TYPE.asNumber(art.type);
					return !art.isTactical() && 6 <= number && number <= 8;
				})
			)
		});
		add({
			name  : "arts|combat",
			about : wrap(
				"Number of combat arts active.",
			),
			expr  : ((env) => {
				return Number(this.arts.getActiveValues().any(
					art => !art.tagged("tactical")
				));
			}),
		});

		add({
			name  : "arts|tactical",
			about : wrap(
				"A flag; 1 if a tactial art is active and 0 otherwise.",
			),
			expr  : ((env) => {
				return Number(this.arts.getActiveValues().any(
					art => art.tagged("tactical")
				));
			}),
		});

		add({
			name  : "arts|active",
			about : wrap(
				"Number of arts equipped."
			),
			expr  : ((env) => {
				return this.arts.getActive().size;
			}),
		});

		// d8888b. .88b  d88.  d888b    d8888b.  .d8b.  .d8888. d88888b
		// 88  `8D 88'YbdP`88 88' Y8b   88  `8D d8' `8b 88'  YP 88'
		// 88   88 88  88  88 88        88oooY' 88ooo88 `8bo.   88ooooo
		// 88   88 88  88  88 88  ooo   88~~~b. 88~~~88   `Y8b. 88~~~~~
		// 88  .8D 88  88  88 88. ~8~   88   8D 88   88 db   8D 88.
		// Y8888D' YP  YP  YP  Y888P    Y8888P' YP   YP `8888Y' Y88888P

		for (const itemID of Inventory.ITEM_IDS) {

			add({
				name  : `${itemID}|attributes|mttype`,
				about : wrap(
					"Which statistic this item uses to calculate Mt: str, mag, ",
					"none, or else (no effect). Taken from the first attribute ",
					"listed to have a value other than else."
				),
				expr  : ((env) => {
					let   a    = 0;
					const item = this.inv.get(itemID);
					for (let each of item.attributes.getActiveValues()) {
						a = a || Action.MTTYPE.asNumber(each.mttype);
					}
					return a;
				}),
			});

			add({
				name  : `${itemID}|template|mttype`,
				about : wrap(
					"What statistic this item's might is based off of; either ",
					"unit|total|str or unit|total|mag or none. This is the ",
					"base might type variable, every other overrides it.",
				),
				expr  : ((env) => {
					return Action.MTTYPE.asNumber(
						this.inv.get(itemID).template.mttype
					);
				}),
			});

			add({
				name  : `${itemID}|custom|mttype`,
				about : wrap(
					"What statistic this item's might is based off of; either ",
					"unit|total|str or unit|total|mag or none. Overrides both ",
					"item|template|mttype and item|attributes|mttype.",
				),
				expr  : ((env) => {
					return this.inv.get(itemID).mttype;
				}),
			});

			add({
				name  : `${itemID}|total|mttype`,
				about : wrap(
					"What statistic this item's might is based off of; either ",
					"unit|total|str or unit|total|mag or none.",
				),
				expr  : `
					bothif ${itemID}|custom|mttype
						// manual entry overrides all others
						then ${itemID}|custom|mttype
					elseif ${itemID}|attributes|mttype
						// attributes override template
						then ${itemID}|attributes|mttype
					else
						// fallback is template value
						then ${itemID}|template|mttype
					end
				`
			});
		}

		add({
			name  : "arts|mttype",
			about : wrap(
				"Which statistic equipped arts use to calculate Mt: str, mag, ",
				"none, or else (no effect). Taken from the first art listed ",
				"to have a value other than else."
			),
			expr  : ((env) => {
				let a = 0;
				for (let each of this.arts.getActiveValues()) {
					a = a || Action.MTTYPE.asNumber(each.mttype);
				}
				return a;
			}),
		});

		add({
			name  : "gambit|structure|mttype",
			about : wrap(
				"What statistic this gambit's might deals damage against based ",
				"on this battalion's equipped structure gambits. Training ",
				"gambits serve as the base and can be overriden by others."
			),
			expr  : ((env) => {
				let mttype = 0;

				for (let gambit of this.battalion.gambits.values()) {
					
					if (!gambit.tagged("structure")) continue;

					mttype = Action.MTTYPE.asNumber(gambit.mttype);

					/* some structure that overrides a training gambit */
					if (!gambit.name.includes("Training")) {
						return mttype;
					}
				}

				return mttype;
			}),
		});

		add({
			name  : "gambit|active|mttype",
			about : wrap(
				"What statistic the active gambit's might is targets.",
			),
			expr  : ((env) => {
				return Action.MTTYPE.asNumber(
					this.battalion.getGambit().mttype
				);
			}),

		});

		add({
			name  : "gambit|arts|mttype",
			about : wrap(
				"What statistic a metagambit's might is based off of.",
			),
			expr  : ((env) => {
				let a = 0;
				for (let each of this.arts.getActiveValues()) {
					if (!each.tagged("metagambit")) continue;
					a = a || Action.MTTYPE.asNumber(each.mttype);
				}
				return a;
			}),

		});

		add({
			name  : "gambit|total|mttype",
			about : wrap(
				"What statistic this gambit's might targets",
			),
			expr  : `
				bothif gambit|arts|mttype
					// meta gambit overrides active gambit
					then gambit|arts|mttype
				elseif gambit|active|mttype
					// active gambit overrides structure value
					then gambit|active|mttype
				elseif gambit|structure|mttype
					// structure value serves as fallback
					then gambit|structure|mttype
				else
					// fallback is not to assume N/A
					then mttype|none
				end
			`
		});

		add({
			name  : "unit|total|mttype",
			about : wrap(
				"What statistic this unit's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. Defaults to ",
				"none if nothing overrides it with another option.",
			),

			expr  : `
				bothif arts|mttype
					// art overrides item value
					then arts|mttype
				elseif item|total|mttype
					// item value serves as fallback
					then item|total|mttype
				else
					// fallback is not to assume N/A
					then mttype|none
				end
			`,
		});

		for (let each of Action.MTTYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `mttype|${str}`,
				about : wrap(
					`Constant value for the ${str} mttype.`
				),
				expr  : String(num)
			});

			add({
				name  : `unit|total|mttype|${str}`,
				about : wrap(
					`Evaluates to 1 if unit|total|mttype is ${str}, and `,
					"evaluates to 0 otherwise."
				),
				expr  : `unit|total|mttype == mttype|${str}`
			});
		}

		// .d8888. d88888b  .o88b.  .d88b.  d8b   db d8888b.  .d8b.  d8888b. db    db
		// 88'  YP 88'     d8P  Y8 .8P  Y8. 888o  88 88  `8D d8' `8b 88  `8D `8b  d8'
		// `8bo.   88ooooo 8P      88    88 88V8o 88 88   88 88ooo88 88oobY'  `8bd8'
		//   `Y8b. 88~~~~~ 8b      88    88 88 V8o88 88   88 88~~~88 88`8b      88
		// db   8D 88.     Y8b  d8 `8b  d8' 88  V888 88  .8D 88   88 88 `88.    88
		// `8888Y' Y88888P  `Y88P'  `Y88P'  VP   V8P Y8888D' YP   YP 88   YD    YP


		for (let each of this.data.stats.second) {
			const name   = each;
			const second = [];

			for (const itemID of Inventory.ITEM_IDS) {

				second.push(add({
					name  : `${itemID}|custom|${name}`,
					about : wrap(
						`User provided ${name} modifier for equipped ${itemID} `,
						"under Create => Inventory => Customize Statistics."
					),
					expr  : ((env) => {
						const item  = this.inv.get(itemID);
						const text  = `${item.name} base`;
						const value = item.stats[name].value;
						return label(env, text, value);
					}),
				}));

				second.push(add({
					name  : `${itemID}|template|${name}`,
					about : wrap(
						`Equipped item's ${name} from the template it uses.`
					),
					expr  : ((env) => {
						const item  = this.inv.get(itemID);
						const text  = `${item.name} base`;
						const value = item.template.modifier(name, env);
						return label(env, text, value);
					}),
				}));

				add({
					name  : `${itemID}|noattr|${name}`,
					about : wrap(
						`Equipped ${itemID}'s ${name} without modifiers `,
						"from attributes."
					),
					expr  : `
						${itemID}|template|${name} or ${itemID}|custom|${name}
					`,
				});

				second.push(add({
					name  : `${itemID}|attributes|${name}`,
					about : wrap(
						`Sum of equipped ${itemID}'s ${name} modifiers from `,
						"attributes."
					),
					expr  : ((env) => {
						let   a    = 0;
						const item = this.inv.get(itemID);
						for (let each of item.attributes.getActive()) {

							const attr = Attribute.get(each);
							const mod  = attr.modifier(name, env);
							if (mod == 0) continue;

							a = sum(env, a, label(env, attr.name, mod));
						}

						return a;
					}),
				}));

				add({
					name  : `${itemID}|total|${name}`,
					about : wrap(
						`Equipped ${itemID}'s total ${name} after all modifiers.`
					),
					expr  : funcsum(...second),
				});

				add({
					name  : `${itemID}|dynamic|${name}`,
					about : wrap(
						`A flag; 1 if equipped ${itemID} has dynamic `,
						`modifiers to ${name}, otherwise 0.`
					),
					expr  : ((env) => {

						let   a    = false;
						const item = this.inv.get(itemID);

						for (let attr of item.attributes.getActive()) {

							const attribute = Attribute.get(attr);
							const modifier  = (
								typeof attribute.modifiers[name] != "number"
							);

							a = a || modifier;
						}

						return a || (
							typeof item.template.modifiers[name] != "number"
						);
					}),
				});

				/* clear what we have so far */
				second.length = 0;
			}

			add({
				name  : `tactical|${name}`,
				about : wrap(
					`Active tactical art's ${name} statistic (zero if none).`
				),
				expr  : tacticfunc(name),
			});

			second.push(add({
				name  : `combatarts|${name}`,
				about : wrap(
					`Total ${name} from active combat arts.`
				),
				expr  : combatfunc(name),
			}));

			second.push(add({
				name  : `abilities|${name}`,
				about :
					`Total ${name} from active abilities.`
				,
				expr  : abilityfunc(name),
			}));

			add({
				name  : `unit|modifier|no_item|${name}`,
				about : `The sum of all ${name} modifiers excluding from items.`,
				expr  : funcsum(...second),
			});

			second.push(add({
				name  : `host|${name}`,
				about : wrap(
					`Equal to item|total|${name} if no tactical art is `,
					"active, but if one is active, equal to 0."
				),
				expr  : `
					bothif arts|tactical
						then tactical|${name}
						else item|total|${name}
					end
				`,
			}));

			add({
				name  : `unit|modifier|${name}`,
				about : `The sum of all ${name} modifiers.`,
				expr  : funcsum(...second, `equipment|total|${name}`),
			});
		}

		add({
			name  : "battalion|charm",
			about : wrap(
				"Higher of dexterity and luck; this variable gets replaced ",
				"with a Roll20 variable called \"Charm\" when variables are ",
				"enabled within macrogen. Use for battalion macros."
			),
			expr  : "alias([Charm], max(unit|total|lck, unit|total|dex))"
		});

		add({
			name  : "unit|charm",
			about : wrap(
				"Higher of dexterity and luck. Use for non-battalion macros.",
			),
			expr  : "max(unit|total|lck, unit|total|dex)"
		});

		add({
			name  : "unit|total|atk",
			about : wrap(
				"unit|total|str, unit|total|mag, or 0 as determined by",
				"unit|total|mttype",
			),
			expr  : `
				// detemine base stat to compute mt from
				bothif unit|total|mttype == mttype|mag
					then unit|total|mag
				elseif unit|total|mttype == mttype|str
					then unit|total|str
					else 0
				end
			`,
		});

		add({
			name  : "unit|total|mt",
			about : wrap(
				"The amount of damage an attack does before it is reduced by",
				"a foe's unit|total|prot or their unit|total|resl, as ",
				"determined by unit|total|mttype",
			),
			expr  : `
				floor(
					(unit|total|atk)
						// healing (Heal, Recover) halves Mt
						* unit|multiplier|healing
				)

					// weapon triangle +3 Mt bonus
					+ bothif not(host|tagged|no_triangle)
						then (max(
							metaif builtins|macrogen
								then other|triangle|prompt
								else other|triangle
							end,
							0
						) / 5)
						else 0
					end

					// other modifiers
					+ host|mt
					+ abilities|mt
					+ combatarts|mt
					+ equipment|total|mt
			`,
		});

		// add({
		// 	name  : "unit|received|prot",
		// 	about : wrap(
		// 		"This unit's protection when it's receiving an attack. ",
		// 		"Used in roll20 macro generation."
		// 	),
		// 	expr  : "unit|total|def + unit|modifier|no_item|prot",
		// });

		// add({
		// 	name  : "unit|received|resl",
		// 	about : wrap(
		// 		"This unit's resiliance when it's receiving an attack. ",
		// 		"Used in roll20 macro generation."
		// 	),
		// 	expr  : "unit|total|res + unit|modifier|no_item|resl",
		// });

		// add({
		// 	name  : "unit|received|avo",
		// 	about : wrap(
		// 		"This unit's avoid when it's receiving an attack. ",
		// 		"Used in roll20 macro generation."
		// 	),
		// 	expr  : "unit|total|lck + unit|modifier|no_item|avo",
		// });

		// add({
		// 	name  : "unit|received|cravo",
		// 	about : wrap(
		// 		"This unit's critical avoid when it's receiving an attack. ",
		// 		"Used in roll20 macro generation."
		// 	),
		// 	expr  : "unit|total|dex + unit|modifier|no_item|cravo",
		// });


		// add({
		// 	name  : "unit|received|doubled",
		// 	about : wrap(
		// 		"This unit's threshold to be doubled when it's receiving an attack. ",
		// 		"Used in roll20 macro generation."
		// 	),
		// 	expr  : "unit|total|spd + unit|modifier|no_item|doubled",
		// });

		add({
			name  : "unit|damage",
			about : wrap(
				"Evaluates to unit|total|mt if unit|total|mttype is not equal ",
				"to other|base|none, which is the enum value used for when a ",
				"feature does not heal or do damage and to 0 if it is equal.",
			),
			expr  : `
				bothif unit|total|mttype == mttype|none
					then 0
					else unit|total|mt
				end
			`,
		});

		add({
			name  : "unit|total|prot",
			about : wrap(
				"Reduces incoming 'strength-based' damage before it is ",
				"applied to the unit's hit points.",
			),
			expr  : funcsum("unit|total|def", "unit|modifier|prot"),
		});

		add({
			name  : "unit|total|resl",
			about : wrap(
				"Reduces incoming 'magic-based' damage before it is ",
				"applied to the unit's hit points.",
			),
			expr  : funcsum("unit|total|res", "unit|modifier|resl"),
		});

		if (V3) {
			add({
				name  : "unit|total|crit",
				about : wrap(
					"The unit's chance to score a critical hit."
				),
				expr  : "unit|total|lck + unit|modifier|crit",
			});

			add({
				name  : "unit|total|cravo",
				about : wrap(
					"Reduces foe's chance to score a critical hit on this unit."
				),
				expr  : "unit|total|dex + unit|modifier|cravo",
			});

			add({
				name  : "unit|total|hit",
				about : wrap(
					"The unit's chance to score a hit."
				),
				expr  : `
					unit|total|dex
						+ unit|modifier|hit
						+ other|range_penalty
				`,
			});

			add({
				name  : "unit|total|avo",
				about : wrap(
					"Reduces foe's chance to score a hit on this unit."
				),
				expr  : "unit|total|lck + unit|modifier|avo",
			});
		} else {
			add({
				name  : "unit|total|crit",
				about : wrap(
					"The unit's chance to score a critical hit."
				),
				expr  : `
					(floor((unit|total|dex) / 2)
						+ unit|total|lck
						+ unit|modifier|crit)
				`,
			});

			add({
				name  : "unit|total|cravo",
				about : wrap(
					"Reduces foe's chance to score a critical hit on this unit."
				),
				expr  : "unit|total|lck + unit|modifier|cravo",
			});

			add({
				name  : "unit|total|hit",
				about : wrap(
					"The unit's chance to score a hit."
				),
				expr  : `
					(unit|total|dex
						+ unit|modifier|hit
						+ other|triangle|conditional)
				`,
			});

			add({
				name  : "unit|total|avo",
				about : wrap(
					"Reduces foe's chance to score a hit on this unit."
				),
				expr  : `
					(unit|total|spd
						+ unit|modifier|avo
						+ metaif builtins|codegen
							then other|triangle
							else 0
						end)
				`,
			});
		}

		add({
			name  : "doubling_threshold",
			about : wrap(
				"Number of points of speed one unit's speed must exceed another to double it."
			),
			expr  : `
				4
			`,
		});

		add({
			name  : "unit|total|doubles",
			about : wrap(
				"Maximum attack speed that of foes this unit can double."
			),
			expr  : `
				(unit|total|spd + unit|modifier|doubles - doubling_threshold)
			`,
		});

		add({
			name  : "unit|total|doubled",
			about : wrap(
				"Minimum attack speed that foe needs to double this unit."
			),
			expr  : `
				(unit|total|spd + unit|modifier|doubled + doubling_threshold)
			`,
		});

		add({
			name  : "unit|base|maxrng",
			about : wrap(
				"The base maximum range at which this unit can use a item ",
				"or art. This defaults to the maximum range of the item, ",
				"but if an art is used, the art's maximum range supercedes it.",
			),
			expr  : `
				bothif combatarts|maxrng
					then combatarts|maxrng
				elseif tactical|maxrng
					then tactical|maxrng
				else
					then item|total|maxrng
				end
			`
		});

		add({
			name  : "unit|total|maxrng",
			about : wrap(
				"The maximum range at which this unit can use a item or art."
			),
			expr  : `
				unit|base|maxrng
					+ abilities|maxrng
					+ equipment|total|maxrng
			`,
		});

		add({
			name  : "unit|base|minrng",
			about : wrap(
				"The base minimum range at which this unit can use a item ",
				"or art. This defaults to the minimum range of the item, ",
				"but if an art is used, the art's minimum range supercedes it.",
			),
			expr  : `
				bothif combatarts|minrng
					then combatarts|minrng
				elseif tactical|minrng
					then tactical|minrng
				else
					then item|total|minrng
				end
			`
		});

		add({
			name  : "unit|total|minrng",
			about : wrap(
				"The minimum range at which this unit can use a item or art."
			),
			expr  : `
				unit|base|minrng
					+ abilities|minrng
					+ equipment|total|minrng
			`,
		});

		add({
			name  : "unit|base|sp",
			about : wrap(
				"The base stamina points available ",
				"to this unit (i.e. from levels)."
			),
			expr  : "10 * floor(unit|level / 10) + 15",
		});

		add({
			name  : "unit|total|sp",
			about : "The total stamina points available to this unit.",
			expr  : funcsum("unit|base|sp", "unit|modifier|sp"),
		});

		add({
			name  : "unit|total|spcost",
			about : "The total cost in stamina points to use an art.",
			expr  : "unit|modifier|spcost",
		});

		add({
			name  : "unit|base|tp",
			about : wrap(
				"The base technique points available ",
				"to this unit (i.e. from skill ranks)."
			),
			expr  : ((env) => {

				const skills = this.skills;
				const grades = (
					/* for each skill */
					Array.from(skills.names)
						/* convert letter grade into number grade */
						.map((name) => Grade.toNumber(skills[name].grade))
						/* sort descending order*/
						.sort((a, b) => b - a)
				);

				let sum = 0;
				/* we only want the highest three; ignore the rest */
				for (let i = 0; i < 3; ++i) {
					/* start from the grade and sum each rank down */
					for (let j = grades[i]; j >= 0; --j) {
						sum += Grade.TPTABLE[i][j];
					}
				}

				return sum;
			}),
		});

		add({
			name  : "unit|total|tp",
			about : "The total technique points available to this unit.",
			expr  : funcsum("unit|base|tp", "unit|modifier|tp"),
		});

		add({
			name  : "unit|total|tpcost",
			about : "The total cost in technique points to use an item.",
			expr  : "unit|modifier|tpcost",
		});

		// d8888b.  .d8b.  d888888b d888888b  .d8b.  db      d888888b  .d88b.  d8b   db
		// 88  `8D d8' `8b `~~88~~' `~~88~~' d8' `8b 88        `88'   .8P  Y8. 888o  88
		// 88oooY' 88ooo88    88       88    88ooo88 88         88    88    88 88V8o 88
		// 88~~~b. 88~~~88    88       88    88~~~88 88         88    88    88 88 V8o88
		// 88   8D 88   88    88       88    88   88 88booo.   .88.   `8b  d8' 88  V888
		// Y8888P' YP   YP    YP       YP    YP   YP Y88888P Y888888P  `Y88P'  VP   V8P

		/* has to use the raw data because Gambits isn't populated yet */
		for (let each of definitions.gambits) {

			const name       = each.name;
			const identifier = Calculator.asIdentifier(name);

			if (name == "Counter") continue;

			add({
				name  : `gambit|is_active|${identifier}`,
				about : wrap(
					`Evaluates to 1 if ${name} in an active gambit, `,
					"and otherwise evaluates to 0."
				),
				expr  : ((env) => {
					return Number(this.battalion.gambits.active.has(name));
				}),
			});
		}

		add({
			name  : "gambit|is_active|Counter",
			about : wrap(
				"Evaluates to 1 if Counter in an active gambit, ",
				"and otherwise evaluates to 0."
			),
			expr  : ((env) => {
				return Number(this.battalion.getGambit().name == "Counter");
			}),
		});

		add({
			name  : "battalion|modifier|cap",
			about : wrap(
				"The total capacity cost of equipped gambits.",
			),
			expr  : gambitfunc("cap", false),
		});

		add({
			name  : "battalion|rank",
			about : wrap(
				"The numerical value of a battalion's rank."
			),
			expr  : ((env) => {
				return this.battalion.rank;
			}),
		});

		add({
			name  : "battalion|template|cap",
			about : wrap(
				"The battalion's template capcity statistic before modifiers."
			),
			expr  : ((env) => {
				return this.battalion.template.modifier("cap");
			}),
		});

		add({
			name  : "battalion|rank|cap",
			about : wrap(
				"The a battalion's capacity modifier from its rank."
			),
			expr  : ((env) => {
				return this.battalion.rank + 1;
			}),
		});

		add({
			name  : "battalion|total|cap",
			about : wrap(
				"The total number of capacity points afforded to the ",
				"equipped battalion. If none then evaluates to zero.",
			),
			expr  : funcsum(
				"battalion|template|cap",
				"battalion|rank|cap",
				"battalion|modifier|cap"
			),
		});

		add({
			name  : "battalion|level",
			about : wrap(
				"The equipped battalion's level. Used to scale its stats."
			),
			expr  : "unit|level",
		});

		for (let each of this.data.stats.battalion.first) {

			const name = each;
			const second = [];

			second.push(add({
				name  : `battalion|template|${name}`,
				about : wrap(
					`The battalion's template ${name} statistic before modifiers.`
				),
				expr  : ((env) => {
					const value = this.battalion.template.modifiers[name];
					return label(env, `template ${name}`, value);
				}),
			}));

			if (this.data.stats.battalion.growths.includes(name)) {
				add({
					name  : `battalion|level|${name}`,
					about : wrap(
						`The battalion's ${name} bonus from its level.`,
					),
					expr  : ((env) => {
						const growth = this.battalion.template.growth(name);
						const level  = this.battalion.level;
						const bonus  = Math.floor((level * growth)/100);
						return label(env, `level ${level}`, bonus);
					}),
				});

				add({
					name  : `battalion|growth|${name}`,
					about : wrap(
						`The battalion's template ${name} growth.`
					),
					expr  : ((env) => {
						return this.battalion.template.growth(name);
					}),
				});

				add({
					name  : `battalion|mult|${name}`,
					about : wrap(
						`The battalion's template ${name} growth as a real number.`
					),
					expr  : ((env) => {
						return label(env,
							`${this.battalion.name} ${name} growth`,
							this.battalion.template.growth(name) / 100
						);
					}),
				});

				second.push(add({
					name  : `battalion|long|${name}`,
					about : wrap(
						`The battalion's ${name} bonus from its level written out.`,
					),
					expr  : `
						floor(battalion|mult|${name} * alias([Level], unit|level))
					`,
				}));
			}

			second.push(add({
				name  : `battalion|modifier|${name}`,
				about : wrap(
					`The adjutant's ${name} statistic; zero if no adjutant.`
				),
				expr  : gambitfunc(name),
			}));

			add({
				name  : `battalion|total|${name}`,
				about : wrap(
					`The battalion's base ${name} statistic before modifiers.`
				),
				expr  : funcsum(...second),
			});

			add({
				name  : `battalion|leveled|${name}`,
				about : wrap(
					`The battalion's leveled ${name} statistic before modifiers.`
				),
				expr  : (
					this.data.stats.battalion.growths.includes(name)
						? `battalion|template|${name} + battalion|long|${name}`
						: `battalion|template|${name}`
				)
			});
		}

		for (let each of this.data.stats.battalion.second) {

			const name = each;

			add({
				name  : `battalion|modifier|${name}`,
				about : wrap(
					`The battalion's ${name} modifier; zero if no adjutant.`
				),
				expr  : (
					(name == "minrng" || name == "maxrng")
						? gambitoverfunc(name)
						: gambitfunc(name)
				),
			});
		}

		add({
			name  : "battalion|total|cha",
			about : wrap(
				"The battalion's total charm statistic."
			),
			expr  : funcsum((env) => env.read("battalion|charm"), gambitfunc("cha")),
		});

		add({
			name  : "battalion|modifier|br",
			about : wrap(
				"The battalion's endurance statistic."
			),
			expr  : abilityfunc("br"),
		});

		for (let each of [
			["gmt", "might"], ["ghit", "hit"], ["gepcost", "ep cost"],
			["gminrng", "min range"], ["gmaxrng", "max range"],
			["gplu", "plurality"], ["gauto", "autonomy"]
		]) {

			const [stat, name] = each;
			const sum          = [];

			sum.push(add({
				name  : `abilities|${stat}`,
				about : wrap(
					`The battalion's gambit ${name} statistic bonuses from employer's abilities.`
				),
				expr  : abilityfunc(stat),
			}));

			sum.push(add({
				name  : `combatarts|${stat}`,
				about : wrap(
					`The battalion's gambit ${name} statistic bonuses from employer's combat arts.`
				),
				expr  : artfunc(stat),
			}));

			add({
				name  : `battalion|modifier|${stat}`,
				about : wrap(
					`The battalion's gambit ${name} statistic bonuses from employer.`
				),
				expr  : funcsum(...sum),
			});
		}

		add({
			name  : "battalion|total|mt",
			about : wrap(
				"The battalion's might statistic."
			),
			expr  : "battalion|total|atk + battalion|modifier|mt + battalion|modifier|gmt",
		});

		add({
			name  : "battalion|total|hit",
			about : wrap(
				"The battalion's hit statistic."
			),
			expr  : "battalion|charm + battalion|modifier|hit + battalion|modifier|ghit",
		});

		add({
			name  : "battalion|total|ep",
			about : wrap(
				"The battalion's endurance statistic."
			),
			expr  : "battalion|charm + battalion|total|end",
		});

		add({
			name  : "battalion|total|cha",
			about : wrap(
				"The battalion's charm statistic."
			),
			expr  : "battalion|charm",
		});

		add({
			name  : "battalion|total|epcost",
			about : wrap(
				"The battalion's hit statistic."
			),
			expr  : "battalion|modifier|epcost + battalion|modifier|gepcost",
		});

		add({
			name  : "battalion|total|minrng",
			about : wrap(
				"The battalion's minimum range statistic."
			),
			expr  : "battalion|modifier|minrng + battalion|modifier|gminrng",
		});

		add({
			name  : "battalion|total|maxrng",
			about : wrap(
				"The battalion's minimum range statistic."
			),
			expr  : "battalion|modifier|maxrng + battalion|modifier|gmaxrng",
		});

		add({
			name  : "battalion|total|br",
			about : wrap(
				"The battalion's barrier statistic."
			),
			expr  : (
				"battalion|modifier|br"
			),
		});

		const CONTRACT = [
			300, 400, 600, 900, 1400, 1900, 2500, 3200, 4000, 4900, 5900, 7000
		];

		add({
			name  : "battalion|total|contract",
			about : wrap(
				"The battalion's initial contract cost."
			),
			expr  : ((env) => {
				return CONTRACT[this.battalion.rank];
			}),
		});

		const uid = uniqueID();

		vardiv.append(
			element("datalist", {
				attrs   : {id: uid},
				content : varsen.sort().map(e => {
					return element("option", {
						attrs: {
							value   : e,
							onclick : () => alert(e),
						},
					});
				})
			})
		);

		this.macros._input.setAttribute("list", uid);
		this._context = ctx;

		for (let variable in this._context) {
			this.compiler.compute_dependants(variable);
		}

		return ctx;
	}

	contextForItems(itemsID, add) {

	}

	*iterCustomRows(includeItem=true) {

		let row = undefined;

		if (includeItem) {
			for (const equipped of this.inv) {

				for (row of equipped.template.rows) yield row;

				for (const each of equipped.attributes.getActiveValues())
					for (row of each.rows) yield row;
			}
		}

		for (let each of this.abilities.getActiveValues()) {
			for (row of each.rows) yield row;
		}

		for (let each of this.arts.getActiveValues()) {
			if (each.tagged("metagambit")) continue;
			for (row of each.rows) yield row;
		}

	}

	modifier(name) {

		if (name == "size") return this.runenv.read("unit|size");

		const variable = name == "cutrng" ? "item|total|maxrng" : `unit|total|${name}`;
		if (!(variable in this.definez)) return 0;

		const env   =  new Calculator.Env(
			Calculator.Env.RUNTIME, this.definez
		);

		return env.read(variable);
	}

	get aoe() {
		return this.inv.get("item").aoe;
	}

	tablink(text, tabs) {
		return element("span", {
			class   : ["datum", "underline"],
			content : text,
			attrs   : {
				onclick: (() => {
					for (let [notebook, tab] of tabs) {
						this.tabs[notebook].active = tab;
					}
				})
			}
		});
	}

	/* methods relating to persisting the sheet */

	blurb() {
		this.macros.blurb();
	}

	macro() {
		this.macros.macro();
	}

	legacy() {

		const message = wrap(
			"Trying to convert legacy characters may not produce totally ",
			"equivalent sheets; some manual conversion is still necessary."
		);

		if (!confirm(message)) return;

		for (let old of this.lb.category) {
			const char = Legacy.character(old, Version.CURRENT);
			this.cb.importObject(char);
		}
	}

	autoload() {

		const session = localStorage.getItem("v2session");

		if (session == null) return false;

		this.cb.importAll(JSON.parse(session));

		return true;
	}

	autosave() {
		console.log("Saving...");
		const session = this.cb.exportAll();
		localStorage.setItem("v2session", JSON.stringify(session));
	}

	/**
	 * Make a save the contents of the sheet in the browser session
	 */
	save() {
		this.autosave();

		alert(
			"Sheet data has been successfully saved to browser storage. " +
			"Autosave also occurs automatically every five minutes."
		);
	}

	theme(name) {
		if (!Theme.set(name)) return false;
		this.themes.toggleActive(name);

		// Gotta wait until the new sheet loads before we refresh.
		// Timeout may not be good for every environment and need tweaked.
		setTimeout(() => this.refresher.refresh("theme"), 60);

		return true;
	}

	/* Methods relating to Point Buy */

	clear_point_buy() {
		this.myPointBuy.clear();
	}

	copy_point_buy() {

		const animate = this.myPointBuy.setAnimated(false);

		for (let [name, value] of this.myPointBuy.column("value")) {
			this.stats.stats[name].value = value;
			this.stats.stats[name].refresh();
		}

		for (let [name, value] of this.myPointBuy.column("growth")) {
			this.stats.growths[name].value = value * 5;
		}

		this.stats.level = 0;
		this.myPointBuy.setAnimated(animate);
	}

	copy_point_buy_stats(doClass=true) {

		const animate = this.myPointBuy.setAnimated(false);

		/* set the class to "None" so we don't bring over bonuses */
		const cls = this.myPointBuy.forecast.class;
		this.myPointBuy.forecast.class = "None";
		this.myPointBuy.update("final");

		/* carry over each stat to the main sheet */
		for (let [name, value] of this.myPointBuy.column("final")) {
			this.stats.stats[name].value = value;
			this.stats.stats[name].refresh();
		}

		/* carry over each growth as well, in case something changed */
		for (let [name, value] of this.myPointBuy.column("growth")) {
			this.stats.growths[name].value = value * 5;
		}

		/* compute and carry over the total level */
		this.stats.level = this.myPointBuy.forecast.level;

		/* set the class back to what it originally was */
		this.myPointBuy.forecast.class = cls;
		this.myPointBuy.update("final");

		/* set main sheet's class to the one from the point buy */
		if (doClass) {
			this.character.class = cls;
			this.character.refresh();
		}

		this.myPointBuy.setAnimated(animate);
	}

	/**
	 * Copies stats (and optionally class) from the point buy to the main sheet.
	 * @param  {Boolean} whether to set the class on the main sheet
	 * @return {null}
	 */
	copy_stats_to_point_buy(doClass=true) {

		this.myPointBuy.forecast.clear();
		this.myPointBuy.forecast.class = (
			doClass ? this.character.class.name : "None"
		);

		for (let [name, cell] of this.myPointBuy.cells("value")) {
			cell.value = this.stats.stats[name].value;

		}

		for (let [name, cell] of this.myPointBuy.cells("growth")) {
			cell.value = Math.floor(this.stats.growths[name].value / 5);
		}
	}

	*iterItemEquipmentCombos() {

		this.wb.sync();

		const items     = [];
		const equipment = [];

		for (const entry of this.wb.category.entries("inventory")) {

			const [_key, value] = entry;
			const isEquipment   = (Inventory.getItemType(value) == "equipment");

			if (isEquipment && Inventory.isTaggedBB(value, "no macro"))
				continue;

			(isEquipment ? equipment : items).push(entry);
		}

		// handle the case where we have no equipment
		if (equipment.length == 0) {
			for (const [key, value] of items) {
				yield [key, null, value.name];
			}
			return;
		}

		// for streamlining equipment item combinations
		const ref      = {target: null};
		const context  = Compatible.createContext(ref, definitions);
		const compiler = new Polish.Compiler(context);

		// handle the case where we have weapon/implement and equipment combos
		for (const [iKey, iValue] of items) {
			
			// number of times this item was added to a combo
			let combos = 0;
			// object to perform compatibility check on
			ref.target = Item.get(iValue.template);

			for (const [eKey, eValue] of equipment) {

				const archer = Item.get(eValue.template);

				if (!compiler.compile(archer.compatible).exec()) continue;
				
				yield [iKey, eKey, `${iValue.name} & ${eValue.name}`];
				++combos;
			}

			if (combos == 0) yield [iKey, null, iValue.name];
		}
	}

	/**
	 * Creates a new character from the settings of the Tools > NPCs tab.
	 * @return {string} uuid of character in buildable
	 */
	create_npc() {

		this.character._sf.reset();
		for (const each of this.inv) each._sf.reset();
		this.abilities._sf.reset();
		this.arts._sf.reset();
		this.battalion.gambits._sf.reset();
		this.myPointBuy.forecast._sf.reset();
		this.myPointBuy.forecast._cc.reset();
		this.wb._sf.reset();
		this.cb._sf.reset();

		const animate = this.myPointBuy.setAnimated(false);

		/* set preset to custom and add a new sheet */
		this.cb.select.value = "Custom";
		const uuid           = this.cb.add();

		/* easy access variables */
		const ps  = this.myPresetter;
		const pb  = this.myPointBuy;
		const fc  = pb.forecast;
		const cls = Class.get(ps.class);

		/* import the selected preset and clear the point buy */
		pb.import(Preset.get(ps.preset));
		fc.clear();

		/* add the levels to the point buy */
		if (cls.default_base == cls.name) {
			fc.add(cls.name, ps.level);
		} else {
			const advanced = Math.max(ps.level - 15, 0);
			const basic    = ps.level - advanced;
			fc.add(cls.default_base, basic);
			if (advanced) fc.add(cls.name, advanced);
		}
		fc.class = cls.name;
		pb.update("final");

		/* copy stats over to main sheet */
		this.copy_point_buy_stats(false);

		/* add items and abilities to sheet */

		const addKit = (skill, scale) => {

			/* get correct skill and scale */
			const kind = Presetter.KITS[skill];
			const kits = kind[scale];

			/* find appropriate kit for level */
			let kit = null;
			for (let level in kits) {
				if (level > ps.level) break;
				kit = kits[level];
			}

			if (kit === null) return;

			/* add items */
			for (let each of kit.items) {

				const name  = each instanceof Array ? each[0]       : each;
				const attrs = each instanceof Array ? each.slice(1) : [];

				if (!Item.has(name)){
					throw new Error(`item '${name}' is undefined`);
				}

				this.wb.select.value = name;
				this.wb.add("inventory");

				const item = this.inv.getByType(name);

				/* add any attributes to the item */
				for (let attr of attrs) {
					item.attributes.add(attr);
					item.attributes.toggleActive(attr);
				}

				/* include any attributes in the item's name */
				if (attrs.length) {
					item.name = `${attrs.join(" ")} ${item.name}`;
				}
			}

			/* add abilities */
			for (let ability of kit.abilities) {
				if (!Ability.has(ability)){
					throw new Error(`ability '${ability}' is undefined`);
				}

				if (this.abilities.has(ability)) continue;
				this.abilities.add(ability, {group: "equip"});
				this.abilities.toggleActive(ability);
			}

			/* add arts */
			for (let art of kit.arts) {
				if (!Art.has(art)) {
					throw new Error(`art '${art}' is undefined`);
				}

				if (this.arts.has(art)) continue;
				this.arts.add(art, {group: "equip"});
			}

			/* set skill level */
			if (skill in this.skills || skill.skill in this.skills) {

				const row = this.skills[skill] || this.skills[skill.skill];

				if (row.value < kit.points) {
					row.value = kit.points;
				}

				if (scale == 2 || scale == 3) {
					row.aptitude = 1;
				}
			}

			/* create battalion */
			if ("battalion" in kit) {
				this.bb.select.value = kit.battalion;
				this.bb.add();

				const name          = kit.scale > 1 ? "Talent" : "Normal";
				const number        = Grade.APTITUDE.asNumber(name);
				const grade         = Grade.for(scale, number);
				this.battalion.rank = Grade.toNumber(grade);

				/* add an outfitting gambit */
				const clstype  = Presetter.getDefault(cls.type);
				const outfit   = `${clstype} Outfitting`;
				this.battalion.gambits.add(outfit);
				this.battalion.gambits.toggleActive(outfit);

				/* add a training gambit; match weapon if possible */
				let training = (
					Presetter.KITS[ps.mainarm].training
						||
					Presetter.KITS[ps.sidearm].training
				);

				if (!(training && kit.training.includes(training))) {
					training = Presetter.getDefault(kit.training);
				}

				this.battalion.gambits.add(training);
				this.battalion.gambits.toggleActive(training);

				/* add any other gambits to battalion */
				for (let each of kit.gambits) {
					this.battalion.gambits.add(each);
					this.battalion.gambits.toggleActive(each);
				}
			}

			/* recurse */
			if (kind.parent != null) addKit(kind.parent, scale);
		};

		this.character.setClass(cls.name,
			Presetter.getElections(ps.mainarm, ps.sidearm)
		);

		if (ps.mainarm == ps.sidearm || ps.sidearm == "None") {
			addKit(ps.mainarm, 3);
		} else {
			addKit(ps.mainarm, 2);
			addKit(ps.sidearm, 1);
		}

		/* fill out flavor information */
		this.character.name        = cls.name;
		this.character.description = cls.description;

		/* refresh */
		this.character.refresh();

		this.myPointBuy.setAnimated(animate);

		return uuid;
	}

	/* slot validation methods */

	static ModifierCounter = (
		/**
		 * Sums the numbers in an array of {@link Feature} modifier
		 */
		class SlotCounter {

			/**
			 * @param  {string} name - display name of the modifier to count
			 * @param  {field}  field - field name of the modifier to count
			 * @param  {limit}  limit - maximum sum; exceeding this will cause
			 * counting to return an error string.
			 * @return {SlotCounter}
			 */
			constructor(name, field, limit) {
				this.slots = [];
				this.name  = name;
				this.field = field;
				this.limit = limit;
				this.sum   = 0;
			}

			/**
			 * @param  {Feature} feature - feature to count the modifier from
			 * @return {?strong} error string if sum exceeds limit; else null
			 */
			count(feature) {

				this.sum += feature.modifier(this.field);
				this.slots.push(feature);

				if (this.sum > this.limit) return wrap(
					"Capacity of ", this.name, " exceeds maximum of ",
					this.limit, ". ", this.slots.map(
						f => `${f.name} (${f.modifier(this.field)})`
					).join(", "), " consume a total of ", this.sum, " capacity."
				);

				return null;
			}
		}
	);

	/**
	 * Check that the abilities in the category don't exceed the maximium number
	 * of ability slots this unit possesses.
	 * @param  {MultiActiveCategory} category - a category containing abilities;
	 * defaults to this.abilites
	 * @return {?string} an errer string if check fails; else null
	 */
	checkAbilitySlots(category=this.abilities) {

		// for counting slot capacity restrictions
		const capacity = new Sheet.ModifierCounter(
			"equipped abilities", "capcost", this.runenv.read(
				"game|maxcap_abilities"
			)
		);

		for (let ability of this.abilities) {

			const entry = this.abilities.element(ability.name);

			// we only care about user equipped arts for this
			if (entry.group != "equip") continue;

			// secondary pass just to do our due diligence, as at the time
			// of this writing, some arts can be sourced as either class
			// arts and equippables without being regrouped as class arts
			if (this.character.class.abilities.includes(ability.name)) continue;

			// don't count this art if it doesn't consume any slots
			if (ability.modifier("capcost") == 0) continue;

			let error = capacity.count(ability);
			if (error) return element("span", error);
		}

		return null;
	}

	/**
	 * Validates that the arts in the category don't exceed the maximum number
	 * of arts slots, that the numbers of combat and tactical arts don't exceed
	 * the number of slots allocated to each kind, and that there are no arts
	 * equipped that are mutually exclusive with each other.
	 * @param  {MultiActiveCategory} category - a category containing arts;
	 * defaults fo this.arts
	 * @return {?string} an error string if check fails; else null
	 */
	checkArtsSlots(category=this.arts) {

		// map to reserve Skill. Rank, Type combos
		const arts    = [];
		const reserve = new Map();

		// for counting slot number restrictions
		const tactics = new Sheet.ModifierCounter(
			"tactical arts", "slotcost", this.runenv.read("game|maxcap_tactical")
		);
		const combats = new Sheet.ModifierCounter(
			"combat arts", "slotcost", this.runenv.read("game|maxcap_combat")
		);
		const slots = new Sheet.ModifierCounter(
			"equipped arts", "slotcost", this.runenv.read("game|maxcap_arts")
		);

		// we only need to check these requirements for equipped arts
		for (let art of this.arts.values("equip")) {

			// check to see if we can equip this art in the first place
			// if we can't it's already invalid and not worth assigning
			if (!art.requires.exec().boolean) continue;

			// don't count this art if it doesn't consume any slots
			if (art.modifier("slotcost") == 0) continue;

			// proper arts don't come up until Rank D so we can ignore these
			if (art.rank.all(r => Grade.toNumber(r) < 2)) continue;

			// record the number of overall slots the art consumes
			let error = slots.count(art);
			if (error) return element("span", error);

			// record how many tactic/combat slots the art consumes
			error = (art.isTactical() ? tactics : combats).count(art);
			if (error) return element("span", error);

			// skip the next phase for arts that ignore Skill/Rank exclusion
			// these are those with "may be equipped alongside other" effects
			if (art.tagged("inclusive")) continue;

			// get the set of valid Rank/Skill/Type combos for this art
			// combos unit can't meet requirements for are filtered out
			// since it passed the first check least one will be left
			const keys = new Set(art.exKeys(this.predicator));

			// store the art with its keys
			arts.push({art, keys});
		}

		// this makes the error display order make more sense
		arts.reverse();

		// sort elements in descending order of number of keys
		// we want the ones with fewer options to reserve combos
		// first and we're taking arts off the end of the array
		const sortfn  = (a, b) => b.keys.size - a.keys.size;

		// tracks which arts are in conflict
		const conflicts = [];

		// we now need to try to assign each art a Skill/Rank/Type combo
		while (arts.length) {

			// not worth writing a priority queue for this
			arts.sort(sortfn);

			// get the item with the lowest number of combo options
			const {art, keys} = arts.pop();

			// if there are no combo options we have a conflict
			if (keys.size == 0) {
				conflicts.push(wrap(
					art.name, " conflicts with ", Array.from(
						art.exKeys(this.predicator),
						key => `${reserve.get(key).name} (equipped as ${key})`
					).join(", ")
				));
				continue;
			}

			// select an arbitrary available combination
			const [key] = keys;

			// reserve that combination for this art
			reserve.set(key, art);

			// remove the key from the pool of available keys
			for (let each of arts) each.keys.delete(key);
		}

		return conflicts.length
			? element("div", delimit(() => element("br"), conflicts))
			: null;
	}

	variableUsage(filter) {

		const use = new Map();

		const add = ((set, map) => {

			if (!set) return;

			for (let each of set) {
				if (map.has(each)) {
					map.set(each, map.get(each) + 1);
				} else {
					map.set(each, 1);
				}
			}

		});

		for (let key in this._context) {
			add(this._context[key]?.e?.symbols, use);
		}

		for (let each of Iter.chain(...Feature.SUBCLASSES)) {
			for (let key in each.modifiers) {
				
				const expr = each.modifiers[key];

				if (!Calculator.is(expr)) continue;

				add(expr.symbols, use);
			}
		}

		if (!filter) return use;
		return new Map(Iter.filter(use, (pair) => filter(...pair)));
	}

}

class SessionEditor {

	constructor(key) {

		this.key = key;

		this._textarea = element("textarea", {
			class   : ["simple-border"],
		});

		this._erase = element("button", {
			class   : ["simple-border"],
			content : "Erase Data and Reload",
			attrs   : {
				onclick : (() => this.erase())
			}
		});

		this._refresh = element("button", {
			class   : ["simple-border"],
			content : "Undo All Changes",
			attrs   : {
				onclick : (() => this.refresh())
			}
		});

		this._overwrite = element("button", {
			class   : ["simple-border"],
			content : "Overwrite Data and Reload",
			attrs   : {
				onclick : (() => this.overwrite())
			}
		});

		const title = wrap(
			"Failed to load the builder. ",
			"Raw session data is available below. ",
			"Press Ctrl-Shift-I to get error information."
		);

		this.root = element("div", [
			element("strong", title), element("br"),
			this._textarea, element("br"),
			this._refresh, this._overwrite, this._erase
		]);

		this.refresh();
	}

	static MANUAL_KEY = "doEditSession";

	static startLaunch() {
		localStorage.setItem(SessionEditor.MANUAL_KEY, true);
		window.location.replace("index.html");
	}

	static checkLaunch() {
		if (localStorage.getItem(SessionEditor.MANUAL_KEY)) {
			localStorage.removeItem(SessionEditor.MANUAL_KEY);
			throw new Error("Manually launching session editor.");
		}
	}

	refresh() {
		const raw  = localStorage.getItem(this.key);
		const data = JSON.stringify(JSON.parse(raw), null, 2);
		this._textarea.value = data;
	}

	overwrite() {
		const data = JSON.stringify(JSON.parse(this._textarea.value));
		localStorage.setItem(this.key, data);
		location.reload();
	}

	erase() {
		localStorage.removeItem(this.key);
		location.reload();
	}

}


/* exported Sheet */
/* exported SessionEditor */
