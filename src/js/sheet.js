
/**
 * A module that implements the main controller for the sheet, as well as some
 * small models and utilities that are too small to separate into other modules
 * @module sheet
 */

/* global capitalize */
/* global wrap */
/* global uniqueID */
/* global tooltip */
/* global element */
/* global Version */
/* global hilight */
/* global SwapText */
/* global Grade */
/* global uniqueLabel */
/* global BigButton */
/* global chain */
/* global Theme */
/* global Toggle */

/* global Expression */
/* global Polish */

/* global Macros */

/* global Notebook */

/* global Presetter */

/* global Feature */
/* global Ability */
/* global Class */
/* global Art */
/* global Item */
/* global Equipment */
/* global Attribute */
/* global Action */
/* global Condition */
/* global Tile */
/* global Battalion */
/* global Adjutant */
/* global Preset */
/* global Gambit */

/* global Legacy */

/* global Skills */
/* global Stats */
/* global Items */
/* global Characters */

/* global CategoryModel */
/* global MultiActiveCategory */
/* global SingleActiveCategory */

/* global Forecast   */

/* global Battalions */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */


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
			const partSecs       = justSecs < 10 ? "0" + justSecs : justSecs;
			this._countdown.data = `${minutes}:${partSecs}`;
			if (seconds--) return;

			this.sheet.autosave();
			seconds = value / 1e3;
		}, 1e3);
	}
}

class Buildables {

	constructor(options) {

		this._updatefn = options.update || (x => x);

		options    = options || {name: "NO NAME", templates: []};
		this.root  = element("div");
		this.model = options.model;

		let button = undefined;

		this._save         = new BigButton("Save", () => void this.save());
		this._export       = new BigButton("Export", () => void this.export());
		this._batch_export = new BigButton("Batch Export", () => void this.exportBatch());
		this._copy         = new BigButton("Copy", () => void this.copy());
		
		this._import       = new BigButton("Import");
		this._import.input.type   = "file";
		this._import.input.accept = ".json";
		this._import.input.addEventListener("change", (e) => {
			this.import(e);
			this._import.input.value = null;
		}, false);

		this._batch_import = new BigButton("Batch Import");
		this._batch_import.input.type   = "file";
		this._batch_import.input.accept = ".batch.json";
		this._batch_import.input.addEventListener("change",  (e) => {
			const warn = "This action will wipe out your current data. Continue?";
			if (!confirm(warn)) {
				this._batch_import.input.value = null;
				return;
			}
			this.importBatch(e);
			this._batch_import.input.value = null;
		}, false);

		// this.root.appendChild(this._batch_import.input);

		const cell = ((bigbutton, tooltiptext) => {
			return element("td", [
				tooltip(bigbutton.label, tooltiptext),
				bigbutton.input
			]);
		});

		this.root.appendChild(element("table", [
			element("tr", [
				cell(this._save, 
					"Save all sheet data to this web browser's local storage."
				),
				cell(this._export,
					"Download the selected item as a file."
				),
				cell(this._batch_export,
					"Download all items as a group file."
				),
			]),
			element("tr", [
				cell(this._copy,
					"Create a copy of the selected item."
				),
				cell(this._import,
					"Upload a file from the disk to edit."
				),
				cell(this._batch_import,
					"Upload a group file from the disk to edit."
				),
			]),
		]));

		/* Add button */
		button         = element("input");
		button.type    = "button";
		button.value   = "Add";
		button.onclick = () => void this.add();
		button.classList.add("simple-border");
		this._add      = button;

		this.root.appendChild(this._add);

		/* Template select */

		if (options.sortfilter) {
			this._sf    = options.sortfilter;
			this.select = this._sf._select;
			this.root.appendChild(this._sf.root); 
		} else {
			this.root.appendChild(this.select = element("select", {
				class   : ["simple-border"],
				content : options.templates.map(template =>
					element("option", {
						content : template,
						attrs   : {value: template},
					})
				),
			}));
		}

		const getTitle = ((x) => {
			return this.model.getTitle(x);
		});

		const getBody = ((x) => {
			return this.model.getBody(x);
		});

		this.map      = new Map();
		const model   = new CategoryModel(options.name, this.map, getTitle, getBody, () => []);
		this.category = new SingleActiveCategory(model, {
			name        : options.name,
			empty       : options.empty || "Something went wrong!",
			selectable  : false,
			reorderable : true,
			removable   : true,
			ontoggle    : ((category, key) => {
			
				if (key == category.active) {
					return false;
				}

				this.change(key);
			}),
			onremove    : ((category, key) => void this.remove(key)),
			parent      : this.root,
		});
	}

	get activeID() {// TODO see if this can be replaced with this.category.getActive()
		return this.category.getActive() ? this._activeID : null;
	}

	set activeID(value) {
		this._activeID = value;
	}

	add() {
		if (this.category.size > 0) {
			this.map.set(this._activeID, this.model.export());
		}

		const activeID = uniqueID();

		this.map.set(activeID, {
			name        : this.model.name,
			description : this.model.description,
		});

		this.category.add(activeID);
		this.category.toggleActive(activeID);

		this._activeID = activeID;

		this.model.clear(this.select.value);
	}

	get active() {
		return this.map.get(this._activeID);
	}

	change(key) {

		// Nothing to do for a null key.
		if (key == null) return key;
		
		// Guard against a stale activeID in importAll
		this.sync();

		this._activeID = key;
		this.category.toggleActive(key);

		this.model.import(this.map.get(key));

		return key;
	}

	sync() {
		if (this.map.has(this._activeID))
			this.map.set(this._activeID, this.model.export());
	}

	remove(key) {
		if (key == this._activeID) {
			alert("You cannot delete the active item.");
			return;
		}

		this.category.delete(key);
		this.map.delete(key);
	}

	save() {
		/* global sheet */
		sheet.save();
	}

	copy(key) {

		key = key || this._activeID;

		const activeID = uniqueID();

		const item = (key == this._activeID
			? this.model.export()
			: JSON.parse(JSON.stringify(this.map.get(key)))
		);

		this.map.set(activeID, item);
		this.category.add(activeID);

		return this.change(activeID);
	}

	clear() {
		this.map.clear();
		this.category.clear();
		this.model.clear();
	}

	exportAll() {
		const active = this.category.getActive();
		const data   = {active: active, elements: {}};
		
		for (let name of this.category.names()) {
			const category = (
				name == active
					? this.model.export()
					: this.map.get(name)
			);

			data.elements[name] = category;
		}

		return data;
	}

	importAll(data) {
		
		const {active, elements} = data;

		this.map.clear();
		this.category.clear();
		this._activeID = null;

		for (let element in elements) {
			this.map.set(element, this._updatefn(elements[element]));
			this.category.add(element);
		}

		if (active) this.change(active);
	}

	exportObject() {
		return this.model.export();
	}

	export(batch=false) {
		const a    = element("a");
		const item = this.model.export();
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = this.model.name.replace(/ /g, "_") + ".json";
		a.click();
		URL.revokeObjectURL(a.href);
	}

	exportBatch() {
		const a    = element("a");
		const item = this.exportAll();
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = this.model.constructor.name + ".batch.json";
		a.click();
		URL.revokeObjectURL(a.href);
	}

	importObject(object) {
		const activeID = uniqueID();
		this.map.set(activeID, object);
		this.category.add(activeID);
		this.change(activeID);
	}

	import(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			const item     = JSON.parse(e.target.result);
			this.importObject(this._updatefn(item));
		};
		
		reader.readAsText(file);
	}

	importBatch(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			const item = JSON.parse(e.target.result);
			this.importAll(item);
		};
		
		reader.readAsText(file);
	}

}

/*
 * AttributeCell v/
 * ModWidget v/
 * ReqWidget

	 new Set([
	    "Brawl", v/
	    "Level", v/
	    "Swords", v/
	    "Lances", v/
	    "Riding", v/
	    "Class", v/
	    "Flying", v/
	    "Armor", v/
	    "Bows", v/
	    "Axes", v/
	    "Authority", v/
	    "ClassType", v/
	    "Faith", v/
	    "Guile", v/
	    "Reason", v/
	    "Other", v/
	    "Item", 
	    "Crest", v/
	    "Equipment",
	    "Permission",
	    "Adjutant",
	    "Training", v/
	    "Outfitting" v/
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
	}

	createGroup() {
		return (this.group = new Set());
	}

	clearGroup() {
		const group = this.group;
		this.group  = null;
		return group;
	}

	register(element, triggers, propagate=[]) {

		if (this.items.has(element)) return false;

		this.items.set(element, new Set(triggers));
		this.propagate.set(element, new Set(propagate));

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


	soil(value) {
		if (typeof value == "string" || value instanceof String) {

			// Value is a string representing a trigger.
			if (!this.triggers.has(value)) {
				return;
			}

			for (let element of this.triggers.get(value)) {
				this.dirty.add(element);
				this.soil(this.propagate.get(element));
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
			this.dirty.add(value);
			this.soil(this.propagate.get(element));

			return;
		}

		throw new Error(`No element, group, or trigger for '${value}'`);
	}

	clean() {

		// Guard against objects that invoke this object's
		// refresh method in their refresh method to prevent
		// infinte recursion. (Only clean once at the end.)
		if (this.flight) return 0;
		this.flight = true;

		let count = 0;
		for (let each of this.dirty) {
			each.refresh();
			count += 1;
		}
		this.dirty.clear();

		this.flight = false;
		return count;
	}

	refresh(value) {

		if (value === undefined) {
			return this.refresh(Array.from(this.items.keys()));
		}

		this.soil(value);

		return this.clean();
	}

	delete(value) {

		if (value instanceof Set) {
			let count = 0;
			for (let each of value) count += this.delete(each);
			return count;
		} else if (this.items.has(value)) {
			const triggers = this.items.get(value);

			this.items.delete(value);
			this.propagate.delete(value);

			for (let trigger of triggers) {
				this.triggers.get(trigger).delete(value);
			}

			this.dirty.delete(value);

			return 1;
		}

		return 0;
	}

	all() {
		for (let each of this.items.keys()) {
			if (this.dirty.has(each)) this.dirty.delete(each);
			each.refresh();
		}
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

		this.macros = new Macros.UserInterface(this);

		this.refresher = new Refresher(this);

		/* prominently display the version data */
		const version = element("strong", [
			element("span", `Version ${Version.CURRENT.toString()} (`),
			element("a", {
				attrs: {"href": "./README.html"},
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
				const [name, tmp] = Expression.Template.parse(string, defs);
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
					element("div", Expression.highlight(string), "calc-code"),
				]).root;
			}

			return defs;

		})(data.macros);

		const compiler = new Expression.Compiler(context, macros);
		this.compiler  = compiler;
		this.context(compiler, this.macros.varopts);
		this.definez   = context;

		this.view_triggers = new Set(["theme"]).extend(
			compiler.dependancies("unit|total|maxrng")
		).extend(
			compiler.dependancies("unit|total|minrng")
		);

		this.runenv    = new Expression.Env(
			Expression.Env.RUNTIME, this.definez
		);

		const predicates = {};
		const predicator = new Polish.Compiler(predicates, new Set());
		this.predicator  = predicator;
		this.predicates(predicates);
		this.predicatez = predicates;

		data.presets = Presetter.generate_presets();

		/* set lookup tables for each feature class */
		for (let each of Feature.SUBCLASSES) {
			each.setLookupByName(data, compiler, predicator);
		}

		/* special nonsense */
		for (let each of Adjutant.byName.values()) {
			const gambit = each.gambit;
			if (!gambit) continue;
			Gambit.byName.set(gambit.name, gambit);
		}

		/* populate skills, stats, and growths */
		this.stats = new Stats(data.stats.names, this);
		stats_section.appendChild(this.stats.root);

		this.skills = new Skills.UserInterface(data.skills, this);
		skill_section.appendChild(this.skills.root);

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

		let model = new CategoryModel(
			Ability.kind, Ability.byName, myFeatureTitle, myFeatureBody, myTriggers
		);
		
		this.abilities = new MultiActiveCategory(model, {
			name        : "equip",
			empty       : "No abilities are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : unequip("abilities"),
			select      : Ability.select(),
			refresher   : this.refresher,
		});

		sidebook.add("Abilities", this.abilities.root);

		/* Art category */

		model = new CategoryModel(
			Art.kind, Art.byName, myFeatureTitle, myFeatureBody, myTriggers
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
			onremove    : unequip("arts"),
			select      : Art.select(),
			refresher   : this.refresher,
		});

		sidebook.add("Arts", this.arts.root);

		/* Equipment category */

		model = new CategoryModel(
			Equipment.kind, Equipment.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.equipment = new SingleActiveCategory(model, {
			name        : "equip",
			empty       : "No equipment is owned",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : forget,
			select      : Equipment.select(),
			refresher   : this.refresher,
		});

		sidebook.add("Equipment", this.equipment.root);

		/* battalions tab for test */
		this.battalion  = new Battalions(this);

		sidebook.active = "Levels";

		/* set up the characters and options tabs */

		let notebook = new Notebook(right_section);
		this.tabs.main = notebook;

		const buildnb = new Notebook([notebook.root, class_section]);
		
		this.character = new Characters(this);

		const character_bb = new Buildables({
			name       : "characters",
			empty      : "If you're reading this, something has gone wrong",
			model      : this.character,
			sortfilter : Preset.select(),
			update     : Legacy.character,
		});

		const battalion_bb = new Buildables({
			name      : "battalions",
			empty     : "Not leading a battalion",
			templates : data.battalions.filter(x => !x.hidden).map(x => x.name),
			model     : this.battalion,
			update    : Legacy.battalion,
		});

		this.item = new Items(this);

		const item_bb = new Buildables({
			name       : "items",
			empty      : "No items",
			model      : this.item,
			sortfilter : Item.select(),
			update     : Legacy.item,
		});

		this.cb = character_bb;

		buildnb.add("Character", [character_bb.root, this.character.root]);

		this.wb = item_bb;

		buildnb.add("Inventory", [item_bb.root, this.item.root]);

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
			name        : "unit",
			empty       : "No conditions",
			selectable  : true,
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
			name        : "map",
			empty       : "No tiles",
			selectable  : true,
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
			empty     : "No Version 1.9.1 or earlier character sheets.",
			templates : ["Everything but export is disabled."],
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

			legacy_bb.importAll(modern);
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

		this.themes  = new SingleActiveCategory(model, {
			name        : "themes",
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

		tools.add("Configure", configure);

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
	}

	predicates(base) {

		const ctx = base || {};

		const add = (name, func) => {
			ctx[name] = func;
		};

		function autopass() {
			return (op) => ({
				require: false,
				succeed: false,
				boolean: true
			});
		}

		add("All", (op, ...args) => args.reduce((x, y) => ({
			require: x.require || y.require,
			succeed: false,
			boolean: (
				(x.boolean || (y.succeed && !x.require))
					&&
				(y.boolean || (x.succeed && !y.require))
			),
		})));

		add("Any", (op, ...args) => args.reduce((x, y) => ({
			require: x.require || y.require,
			succeed: x.succeed || y.succeed,
			boolean: x.boolean || y.boolean,
		})));

		add("Required", ((op, x) => {
			x.require = true;
			return x;
		}));

		add("Permission", (op, text) => ({
			require: false,
			succeed: false,
			boolean: true,
			// boolean: confirm(text),
		}));

		add("None", autopass());
		// add("Other", autopass());
		add("Barrier", autopass());
		add("Innate", autopass());
		add("Unfinished", autopass());

		add("Level", (op, level) => ({
			require: false,
			succeed: false,
			boolean: this.stats.level >= level
		}));

		for (let each of definitions.skills) {
			const skill = each;

			add(skill, (name, grade) => {
				const diff = (
					Grade.toNumber(this.skills[skill].grade)
						-
					Grade.toNumber(grade)
				);

				return {
					require: false,
					succeed: diff >= 1,
					boolean: diff >= 0,
				};
			});
		}

		add("Other", (op, grade) => {
			let diff = 0;
			for (let each of definitions.skills) {
				diff = (
					Grade.toNumber(grade)
						-
					Grade.toNumber(this.skills[each].grade)
				);

				if (diff <= 0) break;
			}

			return {
				require: false,
				succeed: false,
				boolean: diff <= 0,
			};		
		});

		add("ClassType", (op, type) => {
			return {
				require: true,
				succeed: false, 
				boolean: this.character.class.type.includes(type),
			};
		});

		add("Class", (op, name) => {
			return {
				require: true,
				succeed: false, 
				boolean: !name || this.character.class.name == name,
			};
		});

		add("Equipment", (op, name) => {

			const active = this.equipment.active;

			return {
				require: true,
				succeed: false, 
				boolean: active ? active == name : false,
			};
		});

		add("Item", (op, name) => {

			const active = this.wb.active;

			return {
				require: true,
				succeed: false, 
				boolean: active
					? active.template == name
					: false,
			};
		});

		add("Gambit", (op, name) => {

			let found = false;
			for (let each of this.battalion.gambits.active) {
				if (each.includes(name)) found = true;
			}

			return {
				require: true,
				succeed: false, 
				boolean: found,
			};
		});

		add("Training", (op, name) => {

			let found = false;
			for (let each of this.battalion.gambits.active) {
				if (each.includes(`${name} Training`)) found = true;
			}

			return {
				require: true,
				succeed: false, 
				boolean: found,
			};
		});

		add("Outfitting", (op, name) => {

			let found = false;
			for (let each of this.battalion.gambits.active) {
				if (each.includes(`${name} Outfitting`)) found = true;
			}

			return {
				require: true,
				succeed: false, 
				boolean: found,
			};
		});

		add("Crest", (op, name) => {

			let found = false;
			for (let each of this.abilities.getActiveKeys()) {
				if (each.includes(name)) found = true;
			}

			return {
				require: true,
				succeed: false, 
				boolean: found,
			};
		});

		add("Adjutant", (op, name) => {
			return {
				require: true,
				succeed: false, 
				boolean: this.battalion.adjutant.name == name,
			};
		});

		this._predicates = ctx;
		return ctx;
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

				const rnv    = env.clone(Expression.Env.RUNTIME);
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

				let range = min, start = min, last = 0;
				for (range = min; range <= max; ++range) {
					const raw     = 20 * (range - cut);
					const penalty = Math.min(60, Math.max(0, raw));

					if (last !== penalty) {
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
			name  : "other|triangle|prompt",
			about : wrap(
				"Code that generates a prompt asking for the user to select ",
				"a Triangle Effect value when converted into a Roll20 macro. ",
				"Evaluates to 0 in the character builder.",
			),
			expr  : `
				ask [Triangle Effect?]
					; Neutral      {0}
					, Advantage    {+15}
					, Disadvantage {-15}
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
				expr  : `${capitalize(name)} {unit|base|${name}}`,
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
								? cls.mount.modifier(name, env)
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
								? cls.mount.modifier(name, env)
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
									; Yes {class|mount|${name}}
									, No  {0}
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

			prime.push(add({ // TODO HIDDEN CODE
				name  : `abilities|${name}`,
				about : 
					`The sum of all ${name} modifiers from active abilities.`
				,
				expr  : abilityfunc(name),
			}));

			prime.push(add({ // TODO HIDDEN CODE
				name  : `equipment|${name}`,
				about : wrap(
					`The total ${name} modifier provided by the equipped `,
					"equipment. If none is equipped then evaluates to 0.",
				),
				expr  : ((env) => {
					const key   = this.equipment.getActive();
					if (key == null) return 0;
					const equip = Equipment.get(key); 
					return label(env, equip.name, equip.modifier(name, env));
				}),
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

		for (let item of chain(definitions.items, definitions.attributes)) {
			for (let tag of item.tags) {
				
				const name       = tag;
				const identifier = Expression.asIdentifier(tag);
				if (item_tags.has(tag)) continue;

				add({
					name  : `item|tagged|${identifier}`,
					about : wrap(
						`A flag; 1 if item is tagged with '${tag}' and 0 if `,
						`item is not tagged with '${tag}'.`
					),
					expr  : ((env) => {
						const active = this.item.attributes.getActiveValues();

						for (let each of active) {
							if (each.tagged(name)) return true;
						}

						return Number(this.item.tagged(name));
					}),
				});

				add({
					name  : `inventory|${identifier}`,
					about : wrap(
						`The number of inventory items tagged with '${tag}'`,
					),
					expr  : ((env) => {
						this.wb.sync();

						let count = 0;

						for (let each of this.wb.category.values()) {
							// Ignore what isn't in the inventory.
							if (!each.inventory) continue;

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

				const id = Expression.asIdentifier(tag);

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

			const tag = Expression.asIdentifier(each);

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

		add({
			name  : "item|passes",
			about : wrap(
				"A flag; whether a the equipped item passes requirements."
			),
			expr  : ((env) => {
				const item      = this.item;
				const rank      = item._rank._trigger(item.rank);
				const type      = item.template.type;
				const source    = type ? `${type} ${rank}` : "None";
				const predicate = this.predicator.compile(source);
				return Number(predicate.exec().boolean);
			}),
		});

		for (let each of Item.TYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `item|type|${str.toLowerCase()}`,
				about : wrap(
					`Evaluates to 1 if item type is ${str}, and otherwise `,
					"evaluates to 0."
				),
				expr  : ((env) => {
					const string = this.item.template.type;
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
			const identifier = Expression.asIdentifier(name);

			add({
				name  : `item|has_attribute|${identifier}`,
				about : wrap(
					`Evaluates to 1 if item has the ${name} attribute, `,
					"and otherwise evaluates to 0."
				),
				expr  : ((env) => {
					return Number(this.item.attributes.active.has(name));
				}),
			});
		}

		add({
			name  : "item|type|weapon",
			about : wrap(
				"Evaluates to 1 if item skill type is Axes, Swords, Lances, ",
				"Brawling, or Bows, and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.item.template.type;
				const number = Item.TYPE.asNumber(string);
				return 1 <= number && number <= 5;
			}),
		});

		add({
			name  : "item|type|spell",
			about : wrap(
				"Evaluates to 1 if item skill type is Faith, Guile, or Reason, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.item.template.type;
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

		add({
			name  : "item|type",
			about : wrap(
				"The skill type of the equipped item or 0 if none."
			),
			expr  : ((env) => {
				const string = this.item.template.type;
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
			expr  : ((env) => { // TODO make more efficient
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

		add({
			name  : "item|attributes|mttype",
			about : wrap(
				"Which statistic this item uses to calculate Mt: str, mag, ",
				"none, or else (no effect). Taken from the first attribute ",
				"listed to have a value other than else."
			),
			expr  : ((env) => {
				let a = 0;
				for (let each of this.item.attributes.getActiveValues()) {
					a = a || Action.MTTYPE.asNumber(each.mttype);
				}
				return a;
			}),
		});

		add({
			name  : "item|template|mttype",
			about : wrap(
				"What statistic this item's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. This is the ",
				"base might type variable, every other overrides it.",
			),
			expr  : ((env) => {
				return  (
					Action.MTTYPE.asNumber(this.item.template.mttype)
				);
			}),
		});

		add({
			name  : "item|custom|mttype",
			about : wrap(
				"What statistic this item's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. Overrides both ",
				"item|template|mttype and item|attributes|mttype.",
			),
			expr  : ((env) => {
				return this.item.mttype;
			}),
		});

		add({
			name  : "item|total|mttype",
			about : wrap(
				"What statistic this item's might is based off of; either ",
				"unit|total|str or unit|total|mag or none.",
			),
			expr  : `
				bothif item|custom|mttype
					// manual entry overrides all others
					then item|custom|mttype
				elseif item|attributes|mttype
					// attributes override template
					then item|attributes|mttype
				else
					// fallback is template value
					then item|template|mttype
				end
			`
		});

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

			second.push(add({
				name  : `item|custom|${name}`,
				about : wrap(
					`User provided ${name} modifier for equipped item under `,
					"Create => Inventory => Customize Statistics."
				),
				expr  : ((env) => {
					return label(env, 
						`${this.item.name} base`,
						this.item.stats[name].value,
					);
				}),
			}));

			second.push(add({
				name  : `item|template|${name}`,
				about : wrap(
					`Equipped item's ${name} from the template it uses.`
				),
				expr  : ((env) => {
					return label(env, 
						this.item.name,
						this.item.template.modifier(name, env),
					);
				}),
			}));

			add({
				name  : `item|noattr|${name}`,
				about : wrap(
					`Equipped item's ${name} without modifiers from attributes.`
				),
				expr  : `item|template|${name} or item|custom|${name}`,
			});

			second.push(add({
				name  : `item|attributes|${name}`,
				about : wrap(
					`Sum of equipped item's ${name} modifiers from attributes.`
				),
				expr  : ((env) => {
					let a = 0;
					for (let attr of this.item.attributes.getActive()) {

						const attribute = Attribute.get(attr);
						const modifier  = attribute.modifier(name, env);
						if (modifier == 0) continue;

						a = sum(env, a, label(env, attribute.name, modifier));
					}

					return a;
				}),
			}));

			add({
				name  : `item|total|${name}`,
				about : wrap(
					`Equipped item's total ${name} after all modifiers.`
				),
				expr  : funcsum(...second),
			});

			add({
				name  : `item|dynamic|${name}`,
				about : wrap(
					`A flag; 1 if equipped item has dynamic modifiers to ${name}, otherwise 0.`
				),
				expr  : ((env) => {

					let a = false;
					for (let attr of this.item.attributes.getActive()) {

						const attribute = Attribute.get(attr);
						const modifier  = (
							typeof attribute.modifiers[name] != "number"
						);

						a = a || modifier;
					}

					return a || (
						typeof this.item.template.modifiers[name] != "number"
					);
				}),
			});

			add({
				name  : `tactical|${name}`,
				about : wrap(
					`Active tactical art's ${name} statistic (zero if none).`
				),
				expr  : tacticfunc(name),
			});

			/* clear what we have so far */
			second.length = 0;

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

			add({ // TODO remove this when possible
				name  : `arts|${name}`,
				about : wrap(
					`Total ${name} from active arts.`
				),
				expr  : artfunc(name),
			});

			second.push(add({
				name  : `combatarts|${name}`,
				about : wrap(
					`Total ${name} from active combat arts.`
				),
				expr  : combatfunc(name),
			}));

			second.push(add({
				name  : `equipment|${name}`,
				about : wrap(
					`Total ${name} from equipped equipment.`
				),
				expr  : ((env) => {
					const key   = this.equipment.getActive();
					if (key == null) return 0;
					const equip = Equipment.get(key); 
					return label(env, equip.name, equip.modifier(name, env));
				}),
			}));

			second.push(add({
				name  : `abilities|${name}`,
				about : 
					`Total ${name} from active abilities.`
				,
				expr  : abilityfunc(name),
				// vars  : (() => Ability.getDynamics(name))

			}));

			add({
				name  : `unit|modifier|${name}`,
				about : `The sum of all ${name} modifiers.`,
				expr  : funcsum(...second),
			});
		}

		add({
			name  : "battalion|charm",
			about : wrap(
				"Higher of dexterity and luck; this variable gets replaced ",
				"with a Roll20 variable called \"Charm\" when variables are ",
				"enabled within macrogen. Use for battalion macros."
			),
			expr  : "[Charm] {more unit|total|lck else unit|total|dex end}" 
		});

		add({
			name  : "unit|charm",
			about : wrap(
				"Higher of dexterity and luck. Use for non-battalion macros.",
			),
			expr  : "more unit|total|lck else unit|total|dex end" 
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
					bothif unit|total|mttype == mttype|mag
						then unit|total|mag
					elseif unit|total|mttype == mttype|str
						then unit|total|str
						else 0
					end
						* unit|multiplier|healing
				)
					+ host|mt
					+ abilities|mt
					+ combatarts|mt
					+ equipment|mt
			`,
		});

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
			name  : "unit|total|doubles",
			about : wrap(
				"Maximum attack speed that of foes this unit can double."
			),
			expr  : `
				(unit|total|spd + unit|modifier|doubles - 5)
			`,
		});

		add({
			name  : "unit|total|doubled",
			about : wrap(
				"Minimum attack speed that foe needs to double this unit."
			),
			expr  : `
				(unit|total|spd + unit|modifier|doubled + 5)
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
					+ equipment|maxrng
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
					+ equipment|minrng
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
			const identifier = Expression.asIdentifier(name);

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
						floor(battalion|mult|${name} * Level {unit|level})
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
			["gminrng", "min range"], ["gmaxrng", "max rang"],
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

			// sum.push(add({
			// 	name  : `gambits|${stat}`,
			// 	about : wrap(
			// 		`The battalion's gambit ${name} statistic bonuses from employer's combat arts.`
			// 	),
			// 	expr  : artfunc(stat),
			// }));

			add({
				name  : `battalion|modifier|${stat}`,
				about : wrap(
					`The battalion's gambit ${name} statistic bonuses from employer.`
				),
				expr  : funcsum(...sum),
			});

			/* TODO battalion|modifier|g{min,max}rng had gambitfunc("g{min,max}rng")
			 * I have no idea whoat this was used for honestly, to I took it out
			 * add that back in if it ends up breaking, else remove comment here
			 */
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

	*iterCustomRows(includeItem=true) {

		let row = undefined;
		let tmp = undefined;

		if (includeItem) {
			for (row of this.item.template.rows) yield row;

			for (let each of this.item.attributes.getActiveValues()) {
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
		
		if ((tmp = this.equipment.getActive())) {
			for (row of Equipment.get(tmp).rows) yield row;
		}
	}

	modifier(name) {

		const variable = name == "cutrng" ? "item|total|maxrng" : `unit|total|${name}`;
		if (!(variable in this.definez)) return 0;

		const env   =  new Expression.Env(
			Expression.Env.RUNTIME, this.definez
		);

		return env.read(variable);
	}

	get aoe() {
		return this.item.aoe;
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
		setTimeout(() => this.refresher.refresh("theme", true), 20);
		
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

	create_npc() {

		this.character._sf.reset();
		this.item._sf.reset();
		this.abilities._sf.reset();
		this.equipment._sf.reset();
		this.arts._sf.reset();
		this.battalion.gambits._sf.reset();
		this.myPointBuy.forecast._sf.reset();
		this.myPointBuy.forecast._cc.reset();
		this.wb._sf.reset();
		this.cb._sf.reset();

		const animate = this.myPointBuy.setAnimated(false);

		/* set preset to custom and add a new sheet */
		this.cb.select.value = "Custom";
		this.cb.add();

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

		/* add items and abilties to sheet */

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

				const item  = each instanceof Array ? each[0]       : each;
				const attrs = each instanceof Array ? each.slice(1) : [];

				if (!Item.has(item)){
					throw new Error(`item '${item}' is undefined`);
				}

				this.wb.select.value = item;
				this.wb.add();

				/* add any attributes to the item */
				for (let attr of attrs) {
					this.item.attributes.add(attr);
					this.item.attributes.toggleActive(attr);
				}

				/* include any attributes in the item's name */
				if (attrs.length) {
					this.item.name = (
						attrs.join(" ") + " " + this.item.name
					);
				}

				this.item.inInventory = true;
			}

			/* add abilities */
			for (let ability of kit.abilities) {
				if (!Ability.has(ability)){
					throw new Error(`ability '${ability}' is undefined`);
				}

				this.abilities.add(ability);
				this.abilities.toggleActive(ability);
			}

			/* add arts */
			for (let art of kit.arts) {
				if (!Art.has(art)) {
					throw new Error(`art '${art}' is undefined`);
				}

				this.arts.add(art);
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

			/* recurse */
			if (kind.parent != null) addKit(kind.parent, scale);
		};

		if (ps.mainarm == ps.sidearm || ps.sidearm == "None") {
			addKit(ps.mainarm, 3);
		} else {
			addKit(ps.mainarm, 2);
			addKit(ps.sidearm, 1);
		}

		/* fill out flavor information */
		this.character.name        = cls.name;
		this.character.class       = cls.name;
		this.character.description = cls.description;

		/* refresh */
		this.character.refresh();

		this.myPointBuy.setAnimated(animate);
	}
}


/* exported Sheet */
