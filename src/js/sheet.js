
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

/* global Expression */
/* global Polish */

/* global Macros */

/* global Notebook */

/* global PointBuy */

/* global Presetter */

/* global Ability */
/* global Class */
/* global CombatArt */
/* global Weapon */
/* global Equipment */
/* global Attribute */
/* global AttackFeature */
/* global Condition */
/* global Tile */
/* global Battalion */
/* global Adjutant */
/* global Preset */

/* global Legacy */

/* global Skills */
/* global Stats */
/* global Weapons */
/* global Characters */

/* global CategoryModel */
/* global MultiActiveCategory */
/* global SingleActiveCategory */

/* global Battalions */

class Theme {

	static list = [
		new Theme("Classic", "The classic look and feel.", "./src/css/light.css"),
		new Theme("Dark", "The ever popular alternative.", "./src/css/dark.css"),
		new Theme("Golden Deer", "A bad theme for the best house.", "./src/css/deer.css"),
		new Theme("Boneless", "For when you want to play as the protagonist.", "./src/css/boneless.css"),
		new Theme("Golden Fear", "Boneless mode but yellow.", "./src/css/golden_fear.css"),
		new Theme("Golden Egg", "Serious attempt at a gold theme.", "./src/css/golden_egg.css"),
		new Theme("Document", "The most minimal theme.", "./src/css/document.css"),
		new Theme("Toast", "Designed by Toast, for Toast.", "./src/css/toast.css"),
	];

	constructor(name, description, stylesheet) {
		this.name        = name;
		this.description = description;
		this.stylesheet  = stylesheet;
	}
}

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

		/* Save button */
		this._save     = new BigButton("Save", () => void this.save());
		this.root.appendChild(tooltip(this._save.label,
			"Save all sheet data to this web browser's local storage."
		));
		this.root.appendChild(this._save.input);

		/* Copy button */
		this._copy     = new BigButton("Copy", () => void this.copy());
		this.root.appendChild(tooltip(this._copy.label,
			"Create a copy of the selected item."
		));
		this.root.appendChild(this._copy.input);

		/* Import button */
		this._import     = new BigButton("Import");
		this.root.appendChild(tooltip(this._import.label,
			"Upload a file from the disk to edit."
		));

		this._import.input.type   = "file";
		this._import.input.accept = ".json";
		this._import.input.addEventListener("change", (e) => {this.import(e);}, false);

		this.root.appendChild(this._import.input);

		/* Export button */
		this._export     = new BigButton("Export", () => void this.export());
		this.root.appendChild(tooltip(this._export.label,
			"Download the selected item as a file."
		));
		this.root.appendChild(this._export.input);

		/* Can't use the category select since those must be predefined */
		this.root.appendChild(element("br"));

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
			const select = element("select");
			select.classList.add("simple-border");

			for (let template of options.templates) {
				const option       = element("option");
				option.value       = template;
				option.textContent = template;
				select.appendChild(option);
			}

			this.select = select;
			this.root.appendChild(this.select);
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

	add() {
		if (this.category.size > 0) {
			this.map.set(this.activeID, this.model.export());
		}

		const activeID = uniqueID();

		this.map.set(activeID, {
			name        : this.model.name,
			description : this.model.description,
		});

		this.category.add(activeID);
		this.category.toggleActive(activeID);

		this.activeID = activeID;

		this.model.clear(this.select.value);
	}

	get active() {
		return this.map.get(this.activeID);
	}

	change(key) {
		
		/* Guard against a stale activeID in importAll */
		if (this.map.has(this.activeID))
			this.map.set(this.activeID, this.model.export());

		this.activeID = key;
		this.category.toggleActive(key);

		this.model.import(this.map.get(key));

		return key;
	}

	remove(key) {
		if (key == this.activeID) {
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

		key = key || this.activeID;

		const activeID = uniqueID();

		const item = (key == this.activeID
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

		for (let element in elements) {
			this.map.set(element, this._updatefn(elements[element]));
			this.category.add(element);
		}

		if (active) this.change(active);
	}

	exportObject() {
		return this.model.export();
	}

	export() {
		const a    = element("a");
		const item = this.model.export();
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = this.model.name.replace(/ /g, "_") + ".json";
		a.click();
		URL.revokeObjectURL(a.href);
		// this._export.onclick.call();
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
		this.context(context, this.macros.varopts);
		this.definez   = context;

		const predicates = {};
		const predicator = new Polish.Compiler(predicates, new Set());
		this.predicator  = predicator;
		this.predicates(predicates);
		this.predicatez = predicates;

		data.presets = Presetter.generate_presets();

		/* set lookup tables for each feature class */
		for (let each of [
			Ability, Weapon, CombatArt, Equipment, Class, Attribute, Condition,
			Tile, Battalion, Adjutant, Preset
		]) {
			each.setLookupByName(data, compiler, predicator);
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
			this.stats.refresh();
		};

		const forget  = (category, key) => {
			console.log("forget", key);
			category.delete(key);
			this.stats.refresh();
		};

		this.tabs = {};

		const myFeatureTitle = ((feature) => feature.title()); 
		const myFeatureBody  = ((feature) => feature.body());
		const myTriggers     = ((feature) => feature.dependancies);

		let   sidebook = new Notebook(equip_section);
		let   inner    = new Notebook();

		this.tabs.assign = sidebook;

		/* Level Ups tab */

		sidebook.add("Level Ups", this.stats.levelups.root);

		/* Ability category */

		let model = new CategoryModel(
			Ability.kind, Ability.byName, myFeatureTitle, myFeatureBody, myTriggers
		);
		
		this.abilities = {};

		this.addCategory(new MultiActiveCategory(model, {
			name        : "class",
			empty       : "This class has no class abilities",
			selectable  : false,
			reorderable : false,
			removable   : false,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : null,
		}));
		inner.add("From Class", this.abilities.class.root);

		this.addCategory(new MultiActiveCategory(model, {
			name        : "equipped",
			empty       : "No abilities are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : forget,
			select      : Ability.select(),
		}));
		inner.add("Equipped", this.abilities.equipped.root);

		this.addCategory(new MultiActiveCategory(model, {
			name        : "battlefield",
			empty       : "There are no battlefield abilities",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : forget,
			select      : Ability.select(),
		}));
		inner.add("On Battlefield", this.abilities.battlefield.root);

		inner.active = "From Class";

		this.tabs.abilities = inner;

		sidebook.add("Abilities", inner.root);

		/* CombatArt category */

		inner = new Notebook();
		model = new CategoryModel(
			CombatArt.kind, CombatArt.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.arts = {};

		this.addCategory(new SingleActiveCategory(model, {
			name        : "class",
			empty       : "No arts are equipped",
			selectable  : false,
			reorderable : false,
			removable   : false,
			hideable    : true,
			ontoggle    : ((category, key) => {

				/* only one art can be active at a time */
				this.arts.equipped.clearActive();

				console.log("refresh", key);
				category.toggleActive(key);
				this.stats.refresh();
			}),
			onremove    : null,
		}));
		inner.add("From Class", this.arts.class.root);

		this.addCategory(new SingleActiveCategory(model, {
			name        : "equipped",
			empty       : "No arts are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : ((category, key) => {

				/* only one art can be active at a time */
				this.arts.class.clearActive();

				console.log("refresh", key);
				category.toggleActive(key);
				this.stats.refresh();
			}),
			onremove    : forget,
			select      : CombatArt.select(),
		}));
		inner.add("Equipped", this.arts.equipped.root);

		inner.active = "From Class";

		this.tabs.arts = inner;

		sidebook.add("Arts", inner.root);

		/* Equipment category */

		model = new CategoryModel(
			Equipment.kind, Equipment.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.equipment = {};

		this.addCategory(new SingleActiveCategory(model, {
			name        : "known",
			empty       : "No equipment is owned",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : refresh,
			onremove    : forget,
			select      : Equipment.select(),
		}));

		sidebook.add("Equipment", this.equipment.known.root);

		/* battalions tab for test */
		this.battalion  = new Battalions(this);

		sidebook.active = "Abilities";

		/* set up the characters and options tabs */

		let notebook = new Notebook(right_section);
		this.tabs.main = notebook;

		const buildnb = new Notebook([notebook.root, class_section]);
		
		this.character = new Characters(this);

		const character_bb = new Buildables({
			name       : "characters",
			empty      : "If you're reading this, something has gone wrong",
			// templates  : data.presets.map(x => x.name),
			model      : this.character,
			sortfilter : Preset.select(),
			update     : Legacy.convert,
		});

		const battalion_bb = new Buildables({
			name      : "battalions",
			empty     : "Not leading a battalion",
			templates : data.battalions.filter(x => !x.hidden).map(x => x.name),
			model     : this.battalion,
		});

		this.weaponz = new Weapons(this);

		const weapon_bb = new Buildables({
			name       : "weapons",
			empty      : "No weapons or spells",
			// templates : data.weapons.filter(x => !x.hidden).map(x => x.name),
			model      : this.weaponz,
			sortfilter : Weapon.select(),
		});

		this.cb = character_bb;

		buildnb.add("Characters", [character_bb.root, this.character.root]);

		this.wb = weapon_bb;

		buildnb.add("Weapons & Spells", [weapon_bb.root, this.weaponz.root]);

		this.bb = battalion_bb;

		/* TODO figure out what to do with battalions for patch #6 */
		// buildnb.add("Battalions", [battalion_bb.root, this.battalion.root]);

		buildnb.active = "Characters";

		this.tabs.create = buildnb;

		notebook.add("Create", buildnb.root);
		equip_section.append(sidebook.root);

		notebook.add("Assign", equip_section);

		const gloss = new Notebook();

		this.conditions = {};

		model = new CategoryModel(
			Condition.kind, Condition.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.addCategory(new MultiActiveCategory(model, {
			name        : "unit",
			empty       : "No conditions",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : (() => void(0)),
			onremove    : forget,
			select      : Condition.select(),
		}));
		gloss.add("Conditions", this.conditions.unit.root);

		this.tiles = {};

		model = new CategoryModel(
			Tile.kind, Tile.byName, myFeatureTitle, myFeatureBody, myTriggers
		);

		this.addCategory(new MultiActiveCategory(model, {
			name        : "map",
			empty       : "No tiles",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			ontoggle    : (() => void(0)),
			onremove    : forget,
			select      : Tile.select(),
		}));
		gloss.add("Tiles", this.tiles.map.root);

		gloss.active = "Conditions";

		this.tabs.gloss = gloss;

		notebook.add("Glossary", gloss.root);

		const tools = new Notebook();

		tools.add("Macros", element("div", this.macros.root));

		this.myPointBuy = new PointBuy();
		this.myPresetter = new Presetter();

		tools.add("Point Buy", element("div", [
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
			this.myPointBuy.root,
			this.myPresetter.root
		]));

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
		legacy_bb._add.disabled          = true;
		legacy_bb._copy.input.disabled   = true;
		legacy_bb._save.input.disabled   = true;
		legacy_bb._import.input.disabled = true;
		legacy_bb.category.removable     = false;

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

		this.myThemeMap = new Map();
		model           = new CategoryModel(
			"themes", this.myThemeMap, (x) => x.name, (x) => x.description, () => []
		);

		const themes = element("div");

		this._autosave_conf = new AutosaveConfiguration(this);

		themes.appendChild(this._autosave_conf.root);

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

		for (let theme of Theme.list) {
			this.myThemeMap.set(theme.name, theme);
			this.themes.add(theme.name);
		}

		this.themes.toggleActive("Classic");
		// this.themes.addTo(themes);
		
		themes.appendChild(
			element("fieldset", [
				element("legend", element("strong", "Themes")),
				this.themes.root,
			])
		);

		themes.remove();

		tools.add("Configure", themes);

		tools.active = "Configure";

		this.tabs.tools = tools;

		notebook.add("Tools", tools.root);

		notebook.active = "Create";

		/* set theme */
		this.theme();

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
	}

	/* this was a workaround the fact two arts cats weren't expected */
	getActiveArt() {

		const fromclass = this.arts.class.getActive();

		if (fromclass) return fromclass;

		const equipped = this.arts.equipped.getActive();

		if (equipped) return equipped;

		return null;
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
		add("Other", autopass());
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

			const active = this.equipment.known.active;

			return {
				require: true,
				succeed: false, 
				boolean: active ? active == name : false,
			};
		});

		add("Weapon", (op, name) => {

			const active = this.wb.active;

			return {
				require: true,
				succeed: false, 
				boolean: active
					? active.template == name
					: false,
			};
		});

		add("Crest", (op, name) => {

			let found = false;
			for (let each of this.abilities.equipped.active) {
				if (each.includes(name)) found = true;
			}

			return {
				require: true,
				succeed: false, 
				boolean: found,
			};
		});

		this._predicates = ctx;
		return ctx;
	}

	context(base) {

		if (this._context) return this._context;

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

		/*
		 * v/ level
		 * v/ triangle
		 *
		 * v/ unit.modifier.<prime>
		 * v/ unit.total.<prime>
		 * v/ <prime.base>
		 * v/ class.<prime>
		 * v/ class.mount.<prime>
		 *
		 * v/ unit.total.<second>
		 * v/ unit.modifier.<second>
		 * v/ weapon.<second>
		 * v/ weapon.base.<second>
		 * v/ weapon.template.<second>
		 * v/ weapon.attributes.<second>
		 * v/ equipment.<second>
		 * v/ arts.<second>
		 * v/ battalion.gambit.<second>
		 *
		 * v/ abilities.<prime>
		 * v/ abilities.<second>
		 *
		 * v/ battalion.<batstat>
		 * v/ battalion.base.<batstat>
		 * v/ battalion.template.<batstat>
		 */

		/* this.macros must be initialized before this is called */
		const vardiv = this.macros.varopts;
		const varsen = [];
		const ctx    = base || {};

		const add = (template) => {

			let fn = undefined;

			const source = (
				template.expr.toString()
					/* remove indentation from source */
					.replace(/\t{3,4}/g, "")
					/* convert remaining into spaces */
					.replace(/\t/g, "  ")
			);

			if (typeof template.expr == "string") {
				const e = this.compiler.compile(template.expr);
				fn   = ((env) => Expression.evaluate(e, env));
				fn.e = e;
				fn.s = element("div", [
					"=== Calculator Expression ===", element("br"),
					element("div", Expression.highlight(source), "calc-code"),
				]);
			} else {
				fn   = template.expr;
				fn.s = element("div", [
					"=== JavaScript Function ===", element("br"),
					element("pre", source)
				]); 
			}

			fn.called      = template.name;
			fn.header      = tooltip(
				element("span", [
					"Variable: ",
					element("span", template.name, "datum")
				]),
				wrap(
					"Click on the text below to switch between showing a ",
					"description and the definition."
				)
			);

			fn.about       = new SwapText([
				hilight(template.about),
				element("pre", fn.s),
			]).root;
			ctx[fn.called] = fn;
			varsen.push(fn.called);
			return fn.called;
		};

		function funcsum(...names) {

			const funcs = names.map(name => ctx[name]);

			return (env) => {

				let a = 0;
				for (let func of funcs) {
					a = sum(env, a, func(env));
				}

				return a;
			};
		}

		const abilityfunc = (desig) => {
			const name = desig;

			return ((env) => {

				let a = 0;
				const cats = ["class", "equipped", "battlefield"];

				for (let cat of cats) {
					for (let each of this.abilities[cat].getActive()) {

						const ability  = Ability.get(each);
						const modifier = ability.modifier(name, env);
						if (modifier == 0) continue;

						a = sum(env, a, label(env, ability.name, modifier));
					}
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
			name  : "unit|level",
			about : "This unit's level",
			expr  : ((env) => this.stats.level)
		});


		add({
			name  : "other|recursion",
			about : "If the interpreter is broken this will freeze the page.",
			expr  : "other|recursion",
		});

		// add({
		// 	name  : "other|martial|mov",
		// 	about : wrap(
		// 		"This is the Martial Starting class movement bonus that ",
		// 		"those get after level 10. Evaluates to 1 if the state of ",
		// 		"the sheet meets those circumstances and to 0 otherwise.",
		// 	),
		// 	expr  : ((env) => {
		// 		const cls = this.character.class;

		// 		return label(env, "lvl 10 martial", Number(
		// 			cls.type == "Martial"
		// 			&& cls.tier == "Starting"
		// 			&& this.stats.level >= 10
		// 		));
		// 	}),
		// });

		add({
			name  : "other|range_penalty|prompt",
			about : wrap(
				"The hit penalty for attacking past maximum bow range. This ",
				"isn't available in the builder proper, but you can use it ",
				"in a macro to prompt for values.",
			),
			expr  : `
				ask [Range Penalty?]
					; [Range +0] {+ 0}
					, [Range +1] {-20}
					, [Range +2] {-40}
					, [Further]  {-60}
				end
			`,
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
				"weapon that has the 'no triangle' tag is equipped, instead ",
				"evaluates to 0."
			),
			expr  : `
				metaif builtins|macrogen == 1 then
					metaif weapon|tagged|no_triangle + art|tagged|no_triangle == 0 then
						other|triangle|prompt
					else
						0
					end
				else
					if weapon|tagged|no_triangle + art|tagged|no_triangle == 0 then
						other|triangle
					else
						0
					end
				end
			`,
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

					// anything above 60% is halved, create limiter
					const raw  = Math.floor((60 - sum) / 10) * 5;

					// change a positive limiter to no effect (zero)
					const cap  = Math.min(raw, 0);

					// add limiter (negative) to sum growth to get final
					const grow = sum + cap;

					return grow;
				}),
			});

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
					metaif builtins|macrogen == 1 then
						metaif class|mount|${name} <> 0 then 
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

			prime.push(add({
				name  : `abilities|${name}`,
				about : 
					`The sum of all ${name} modifiers from active abilities.`
				,
				expr  : abilityfunc(name),
			}));

			prime.push(add({
				name  : `equipment|${name}`,
				about : wrap(
					`The total ${name} modifier provided by the equipped `,
					"equipment. If none is equipped then evaluates to 0.",
				),
				expr  : ((env) => {
					const key   = this.equipment.known.getActive();
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
			name  : "weapon|tagged|healing",
			about : wrap(
				"A flag; 1 if weapon is tagged with 'healing' and 0 if ",
				"weapon is not tagged with 'healing'. The 'healing' tag ",
				"indicates whether the weapon's might is applied as healing ",
				"or as damage. Used in the macro builder.",
			),
			expr  : ((env) => {
				return Number(this.weaponz.tagged("healing"));
			}),
		});

		add({
			name  : "art|tagged|healing",
			about : wrap(
				"A flag; 1 if art is tagged with 'healing' and 0 if ",
				"art is not tagged with 'healing'. The 'healing' tag ",
				"indicates whether the art's might is applied as healing ",
				"or as damage. Used in the macro builder.",
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return CombatArt.get(key).tagged("healing");
			}),
		});


		add({
			name  : "art|tagged|tactical",
			about : wrap(
				"A flag; 1 if art is tagged with 'tactical' and 0 if ",
				"art is not tagged with 'tactical'. The 'tactical' tag ",
				"indicates whether the art is considered a combat art or ",
				"a tactical art for slots purposes."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return CombatArt.get(key).tagged("tactical");
			}),
		});

		add({
			name  : "art|tagged|wall",
			about : wrap(
				"A flag; 1 if art is tagged with 'wall' and 0 if ",
				"art is not tagged with 'wall'. The 'wall' tag ",
				"indicates whether the art's primary purpose is to ",
				"create tiles."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return CombatArt.get(key).tagged("wall");
			}),
		});

		add({
			name  : "art|tagged|no_triangle",
			about : wrap(
				"A flag; 1 if art is tagged with 'no triangle' and 0 if ",
				"weapon is not tagged with 'no triangle'. The 'no triangle' ",
				"tag indicates whether the art is subject to the weapon ",
				"triangle system or not. Used in the macro builder."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return CombatArt.get(key).tagged("no triangle");
			}),
		});
		
		add({
			name  : "unit|tagged|healing",
			about : wrap(
				"A flag; 1 if art is tagged with 'healing' and 0 if ",
				"art is not tagged with 'healing'. The 'healing' tag ",
				"indicates whether the art's might is applied as healing ",
				"or as damage. Used in the macro builder.",
			),
			expr  : ((env) => 
				env.read("weapon|tagged|healing")
					||
				env.read("art|tagged|healing")
			),
		});

		add({
			name  : "weapon|tagged|no_triangle",
			about : wrap(
				"A flag; 1 if weapon is tagged with 'no triangle' and 0 if ",
				"weapon is not tagged with 'no triangle'. The 'no triangle' ",
				"tag indicates whether the weapon is subject to the weapon ",
				"triangle system or not. Used in the macro builder."
			),
			expr  : ((env) => {
				return Number(this.weaponz.tagged("no triangle"));
			}),
		});

		add({
			name  : "weapon|tagged|no_hit",
			about : wrap(
				"A flag; 1 if weapon is tagged with 'no hit' and 0 if ",
				"weapon is not tagged with 'no hit'. The 'no hit' ",
				"tag indicates whether the weapon rolls to hit or not. ",
				"Used in the macro builder.",
			),
			expr  : ((env) => {
				return Number(this.weaponz.tagged("no hit"));
			}),
		});

		add({
			name  : "weapon|tagged|no_might",
			about : wrap(
				"A flag; 1 if weapon is tagged with 'no might' and 0 if ",
				"weapon is not tagged with 'no might'. The 'no might' ",
				"tag indicates whether the weapon uses the might stat or ",
				"only applies an effect (e.g. buff spells). ",
				"Used in the macro builder."
			),
			expr  : ((env) => {
				return Number(this.weaponz.tagged("no might"));
			}),
		});

		add({
			name  : "weapon|tagged|wall",
			about : wrap(
				"A flag; 1 if weapon is tagged with 'wall' and 0 if ",
				"weapon is not tagged with 'wall'. The 'wall' tag ",
				"indicates whether the weapon's primary purpose is to ",
				"create tiles."
			),
			expr  : ((env) => {
				return Number(this.weaponz.tagged("wall"));
			}),
		});

		add({
			name  : "unit|multiplier|healing",
			about : wrap(
				"Used to halve base magic for healing spell might; value is ",
				"0.5 if weapon is tagged with 'healing' and is 1.0 if not."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 1.0;
				
				const art = CombatArt.get(key).tagged("healing");
				const wpn = this.weaponz.tagged("healing");
				return art || wpn ? 0.5 : 1.0;
			}),
		});

		// d88888b db       .d8b.   d888b  .d8888.
		// 88'     88      d8' `8b 88' Y8b 88'  YP
		// 88ooo   88      88ooo88 88      `8bo.
		// 88~~~   88      88~~~88 88  ooo   `Y8b.
		// 88      88booo. 88   88 88. ~8~ db   8D
		// YP      Y88888P YP   YP  Y888P  `8888Y'

		for (let each of Weapon.TYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `weapon|type|${str.toLowerCase()}`,
				about : wrap(
					`Evaluates to 1 if weapon type is ${str}, and otherwise `,
					"evaluates to 0."
				),
				expr  : ((env) => {
					const string = this.weaponz.template.type;
					const number = Weapon.TYPE.asNumber(string);
					return number == num;
				}),
			});
		}

		/* has to use the raw data because Attributes isn't populated yet */
		for (let each of definitions.attributes) {

			const name       = each.name;
			const identifier = Expression.asIdentifier(name);

			add({
				name  : `weapon|has_attribute|${identifier}`,
				about : wrap(
					`Evaluates to 1 if weapon has the ${name} attribute, `,
					"and otherwise evaluates to 0."
				),
				expr  : ((env) => {
					return Number(this.weaponz.attributes.active.has(name));
				}),
			});
		}

		add({
			name  : "weapon|type|weapon",
			about : wrap(
				"Evaluates to 1 if weapon type is Axes, Swords, Lances, ",
				"Brawling, or Bows, and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.weaponz.template.type;
				const number = Weapon.TYPE.asNumber(string);
				return 1 <= number && number <= 5;
			}),
		});

		add({
			name  : "weapon|type|spell",
			about : wrap(
				"Evaluates to 1 if weapon type is Faith, Guile, or Reason, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.weaponz.template.type;
				const number = Weapon.TYPE.asNumber(string);
				return 6 <= number && number <= 8;
			}),
		});

		for (let each of Weapon.TYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `art|type|${str.toLowerCase()}`,
				about : wrap(
					`Evaluates to 1 if art type is ${str}, and otherwise `,
					"evaluates to 0."
				),
				expr  : ((env) => {
					const string = this.weaponz.template.type;
					const number = Weapon.TYPE.asNumber(string);
					return number == num;
				}),
			});
		}

		add({
			name  : "art|type|weapon",
			about : wrap(
				"Evaluates to 1 if weapon type is Axes, Swords, Lances, ",
				"Brawling, or Bows, and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.weaponz.template.type;
				const number = Weapon.TYPE.asNumber(string);
				return 1 <= number && number <= 5;
			}),
		});

		add({
			name  : "art|type|spell",
			about : wrap(
				"Evaluates to 1 if weapon type is Faith, Guile, or Reason, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const string = this.weaponz.template.type;
				const number = Weapon.TYPE.asNumber(string);
				return 6 <= number && number <= 8;
			}),
		});

		add({
			name  : "art|type|combat",
			about : wrap(
				"Evaluates to 1 if unit has a combat art active, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => this.getActiveArt() != null),
		});

		add({
			name  : "art|type|tactical",
			about : wrap(
				"Evaluates to 1 if unit has a tactical art active, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => this.getActiveArt() != null),
		});
		
		// d8888b. .88b  d88.  d888b    d8888b.  .d8b.  .d8888. d88888b
		// 88  `8D 88'YbdP`88 88' Y8b   88  `8D d8' `8b 88'  YP 88'
		// 88   88 88  88  88 88        88oooY' 88ooo88 `8bo.   88ooooo
		// 88   88 88  88  88 88  ooo   88~~~b. 88~~~88   `Y8b. 88~~~~~
		// 88  .8D 88  88  88 88. ~8~   88   8D 88   88 db   8D 88.
		// Y8888D' YP  YP  YP  Y888P    Y8888P' YP   YP `8888Y' Y88888P

		add({
			name  : "weapon|attributes|mttype",
			about : wrap(
				"What statistic this weapon's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. If multiple ",
				"have this effect, on the first listed active one is used. ",
				"Overrides weapon|template|mttype.",
			),
			expr  : ((env) => {
				let a = 0;
				for (let attr of this.weaponz.attributes.getActive()) {
					const attribute = Attribute.get(attr);
					const flag      = (
						AttackFeature.MTTYPE.asNumber(attribute.mttype)
					);

					/* take the first one that's true */
					a = a || flag;
				}

				return a;
			}),
		});

		add({
			name  : "weapon|template|mttype",
			about : wrap(
				"What statistic this weapon's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. This is the ",
				"base might type variable, every other overrides it.",
			),
			expr  : ((env) => {
				return  (
					AttackFeature.MTTYPE.asNumber(this.weaponz.template.mttype)
				);
			}),
		});

		add({
			name  : "weapon|base|mttype",
			about : wrap(
				"What statistic this weapon's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. Overrides both ",
				"weapon|template|mttype and weapon|attributes|mttype.",
			),
			expr  : ((env) => {
				return this.weaponz.mttype;
			}),
		});

		add({
			name  : "weapon|total|mttype",
			about : wrap(
				"What statistic this weapon's might is based off of; either ",
				"unit|total|str or unit|total|mag or none.",
			),
			expr  : ((env) => {
				return  (
					/* manual entry overrides all others */
					env.read("weapon|base|mttype")
						||
					/* attributes override template */
					env.read("weapon|attributes|mttype")
						||
					/* fallback value is template value */
					env.read("weapon|template|mttype")
				);
			}),
		});

		add({
			name  : "art|equipped",
			about : wrap(
				"Evaluates to 1 if an Art is equipped; otherwise 0."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;

				return 1;				
			}),
		});

		add({
			name  : "art|mttype",
			about : wrap(
				"What statistic this art's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. Overrides ",
				"weapon|total|mttype.",
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return AttackFeature.MTTYPE.asNumber(CombatArt.get(key).mttype);
			}),
		});

		add({
			name  : "unit|total|mttype",
			about : wrap(
				"What statistic this unit's might is based off of; either ",
				"unit|total|str or unit|total|mag or none. Defaults to ",
				"none if nothing overrides it with another option.",
			),
			expr  : ((env) => {
				return (
					/* art overrides weapon value */
					env.read("art|mttype")
						||
					/* weapon value serves as fallback */
					env.read("weapon|total|mttype")
						||
					/* fallback is not to assume N/A */
					3 
				);
			}),
		});

		for (let each of AttackFeature.MTTYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `unit|total|mttype|${str}`,
				about : wrap(
					`Evaluates to 1 if unit|total|mttype is ${str}, and `,
					"evaluates to 0 otherwise."
				),
				expr  : ((env) => {
					return env.read("unit|total|mttype") == num;
				}),
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
				name  : `weapon|base|${name}`,
				about : wrap(
					`The equipped weapon/spells's base ${name} statistic `,
					"value entered into the table under Create => Weapons & ",
					"Spells before modifiers. If none is equipped then ",
					"evaluates to 0."
				),
				expr  : ((env) => {
					return label(env, 
						`${this.weaponz.name} base`,
						this.weaponz.stats[name].value,
					);
				}),
			}));

			second.push(add({
				name  : `weapon|template|${name}`,
				about : wrap(
					`The equipped weapon/spells's base ${name} statistic `,
					"value from the template weapon/spell it's based on.",
					"If none is equipped then evaluates to 0.",
				),
				expr  : ((env) => {
					return label(env, 
						this.weaponz.name,
						this.weaponz.template.modifier(name, env),
					);
				}),
			}));

			add({
				name  : `weapon|noattr|${name}`,
				about : wrap(
					`The equipped weapon/spells's ${name} statistic without `,
					"attributes taken into account. If none is equipped then ",
					"evaluates to 0.",
				),
				expr  : `weapon|template|${name} + weapon|base|${name}`,
			});

			second.push(add({
				name  : `weapon|attributes|${name}`,
				about : wrap(
					`The sum of all ${name} modifiers from the equipped `,
					"weapon/spell's active attributes. If none are active ",
					"then evaluates to 0."
				),
				expr  : ((env) => {
					let a = 0;
					for (let attr of this.weaponz.attributes.getActive()) {

						const attribute = Attribute.get(attr);
						const modifier  = attribute.modifier(name, env);
						if (modifier == 0) continue;

						a = sum(env, a, label(env, attribute.name, modifier));
					}

					return a;
				}),
			}));

			add({
				name  : `weapon|total|${name}`,
				about : wrap(
					`The total ${name} modifier provided by the equipped `,
					"weapon/spell. If none is equipped then evaluates to 0.",
				),
				expr  : funcsum(...second),
			});

			add({
				name  : `weapon|dynamic|${name}`,
				about : wrap(
					`Evaluates to 1 if weapon's ${name} has any dynamic `,
					"components and to 0 otherwise.",
				),
				expr  : ((env) => {

					let a = false;
					for (let attr of this.weaponz.attributes.getActive()) {

						const attribute = Attribute.get(attr);
						const modifier  = (
							typeof attribute.modifiers[name] != "number"
						);

						a = a || modifier;
					}

					return a || (
						typeof this.weaponz.template.modifiers[name] != "number"
					);
				}),
			});

			second.push(add({
				name  : `equipment|${name}`,
				about : wrap(
					`The total ${name} modifier provided by the equipped `,
					"equipment. If none is equipped then evaluates to 0.",
				),
				expr  : ((env) => {
					const key   = this.equipment.known.getActive();
					if (key == null) return 0;
					const equip = Equipment.get(key); 
					return label(env, equip.name, equip.modifier(name, env));
				}),
			}));

			second.push(add({
				name  : `art|${name}`,
				about : wrap(
					`The total ${name} modifier provided by the active `,
					"combat art/tactical art/metamagic. If none is active, ",
					"then evaluates to 0."
				),
				expr  : ((env) => {
					const key = this.getActiveArt();

					if (key == null) return 0;

					const art = CombatArt.get(key);

					return label(env, art.name, art.modifier(name, env));
				}),
			}));

			second.push(add({
				name  : `abilities|${name}`,
				about : 
					`The sum of all ${name} modifiers from active abilities.`
				,
				expr  : abilityfunc(name),
			}));

			add({
				name  : `unit|modifier|${name}`,
				about : `The sum of all ${name} modifiers.`,
				expr  : funcsum(...second),
			});
		}

		add({
			name  : "unit|total|mt",
			about : wrap(
				"The amount of damage an attack does before it is reduced by",
				"a foe's unit|total|prot or their unit|total|resl, as ",
				"determined by unit|total|mttype",
			),
			expr  : `
				floor(
					(
						metaif builtins|macrogen == 1 then
							metaif unit|total|mttype|mag == 1
								then unit|total|mag
							elseif unit|total|mttype|str == 1
								then unit|total|str
								else 0
							end
						else
							if     unit|total|mttype|mag == 1
								then unit|total|mag
							elseif unit|total|mttype|str == 1
								then unit|total|str
								else 0
							end
						end
					)
						*
					unit|multiplier|healing
				)
					+ weapon|total|mt
					+ abilities|mt
					+ art|mt
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
				metaif builtins|macrogen == 1
					then metaif unit|total|mttype|none == 1
						then 0
						else unit|total|mt
					end
					else     if unit|total|mttype|none == 1
						then 0
						else unit|total|mt
					end
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

		add({
			name  : "unit|total|crit",
			about : wrap(
				"The unit's chance to score a critical hit."
			),
			expr  : `
				(floor((unit|total|dex) / 2)
					+ unit|total|cha
					+ unit|modifier|crit)
			`,
		});

		add({
			name  : "unit|total|cravo",
			about : wrap(
				"Reduces foe's chance to score a critical hit on this unit."
			),
			expr  : "unit|total|cha + unit|modifier|cravo",
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
					+ metaif builtins|codegen == 1
						then other|triangle
						else 0
					end)
			`,
		});

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
				"The base maximum range at which this unit can use a weapon ",
				"or art. This defaults to the maximum range of the weapon, ",
				"but if an art is used, the art's maximum range supercedes it.",
			),
			expr  : ((env) => {
				return (
					env.read("art|maxrng") || env.read("weapon|total|maxrng")
				);
			}),
		});

		add({
			name  : "unit|total|maxrng",
			about : wrap(
				"The maximum range at which this unit can use a weapon or art."
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
				"The base minimum range at which this unit can use a weapon ",
				"or art. This defaults to the minimum range of the weapon, ",
				"but if an art is used, the art's minimum range supercedes it.",
			),
			expr  : ((env) => {
				return (
					env.read("art|minrng") || env.read("weapon|total|minrng")
				);
			}),
		});

		add({
			name  : "unit|total|minrng",
			about : wrap(
				"The minimum range at which this unit can use a weapon or art."
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
			expr  : ((env) => {
				return 10 * Math.floor(this.stats.level / 10) + 15;
			}),
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
			about : "The total cost in technique points to use a weapon/spell.",
			expr  : "unit|modifier|tpcost",
		});


		// battalion stuff

		add({
			name  : "battalion|total|lp",
			about : wrap(
				"The total number of leadership points afforded to the ",
				"equipped battalion. If none then evaluates to zero.",
			),
			expr  : ((env) => {
				const dex   = env.read("unit|total|dex");
				const luc   = env.read("unit|total|cha");
				const lp    = Math.max(dex, luc);

				const bonus = Battalions.LP_BONUS[this.battalion.rank];
				
				const lead  = -(
					env.read("battalion|base|disc") + env.read("battalion|base|brav")
						+
					env.read("battalion|base|pres") + env.read("battalion|base|strc")
				);

				return lp + bonus + lead;
			}),
		});

		add({
			name  : "battalion|level",
			about : wrap(
				"The equipped battalion's level. Used to scale its stats."
			),
			expr  : ((env) => {
				return label(env, 
					`${this.battalion.name} level`,
					this.battalion.level,
				);
			}),
		});

		for (let each of this.data.stats.battalion.first) {

			const name = each;
			const second = [];

			second.push(add({
				name  : `battalion|base|${name}`,
				about : wrap(
					`The equipped battalion's base ${name} statistic `,
					"value entered into the table under Create => Weapons & ",
					"Spells before modifiers. If none is equipped then ",
					"evaluates to 0."
				),
				expr  : ((env) => {
					return label(env, 
						`${this.battalion.name} base`,
						this.battalion.stats[name].value,
					);
				}),
			}));

			second.push(add({
				name  : `battalion|template|${name}`,
				about : wrap(
					`The battalion's base ${name} statistic before modifiers.`
				),
				expr  : ((env) => {
					const value =  this.battalion.template.modifiers[name];
					return label(env, `base ${name}`, value);
				}),
			}));

			if (this.data.stats.battalion.growths.includes(name)) {
				second.push(add({
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
				}));
			}

			second.push(add({
				name  : `battalion|adjutant|${name}`,
				about : wrap(
					`The adjutant's ${name} statistic; zero if no adjutant.`
				),
				expr  : ((env) => {
					const value =  this.battalion.adjutant.modifier(name);
					return label(env, `adj ${name}`, value);
				}),
			}));

			add({
				name  : `battalion|total|${name}`,
				about : wrap(
					`The battalion's base ${name} statistic before modifiers.`
				),
				expr  : funcsum(...second),
			});	
		}

		for (let each of this.data.stats.battalion.gambit) {

			const name = each;

			add({
				name  : `battalion|gambit|${name}`,
				about : wrap(
					`The battalion's base ${name} statistic before modifiers.`
				),
				expr  : ((env) => {
					const value =  this.battalion.template.gambit.modifiers[name];
					return label(env, `base ${name}`, value);
				}),
			});
		}

		add({
			name  : "battalion|modifier|br",
			about : wrap(
				"The battalion's endurance statistic."
			),
			expr  : abilityfunc("br"),
		});

		add({
			name  : "battalion|modifier|gmt",
			about : wrap(
				"The battalion's endurance statistic."
			),
			expr  : abilityfunc("gmt"),
		});

		add({
			name  : "battalion|total|ep",
			about : wrap(
				"The battalion's endurance statistic."
			),
			expr  : "battalion|total|disc",
		});

		add({
			name  : "battalion|total|atk",
			about : wrap(
				"The battalion's counterattack might."
			),
			expr  : (
				"battalion|total|pres + floor((battalion|total|brav - battalion|total|disc)/2)"
			),
		});

		add({
			name  : "battalion|total|br",
			about : wrap(
				"The battalion's barrier statistic."
			),
			expr  : (
				"2 + battalion|modifier|br + floor((battalion|total|disc - battalion|total|brav)/2)"
			),
		});

		add({
			name  : "battalion|total|gmt",
			about : wrap(
				"The battalion's gambit might statistic."
			),
			expr  : "battalion|total|atk + battalion|modifier|gmt + battalion|gambit|mt",
		});

		add({
			name  : "battalion|total|ghit",
			about : wrap(
				"The battalion's gambit hit statistic."
			),
			expr  : "battalion|total|brav + battalion|gambit|hit",
		});

		add({
			name  : "battalion|total|gcost",
			about : wrap(
				"The battalion's gambit cost statistic."
			),
			expr  : "battalion|gambit|cost + floor((battalion|total|disc - battalion|total|brav)/2)",
		});

		add({
			name  : "battalion|total|gminrng",
			about : wrap(
				"The battalion's minimum gambit range statistic."
			),
			expr  : "battalion|gambit|minrng",
		});

		add({
			name  : "battalion|total|gmaxrng",
			about : wrap(
				"The battalion's maximum gambit range statistic."
			),
			expr  : "battalion|gambit|maxrng",
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
		return ctx;
	}

	/* methods relating to initialization */

	/**
	 * Add a {@link Category} to this sheet at sheet[feature][category]
	 * @param {Category} category - the category to add 
	 */
	addCategory(category) {
		this[category.model.name][category.name] = category;
	}

	/** todo check if uneeded remove this if uneeded
	 * Compute the value of a secondary stat using the cached value of a primary
	 * stat and the values of all active modifiers and mulitpliers that apply
	 * @param {string} prime - name of a primary stat
	 * @param {string} second - name of a secondary stat
	 * @returns {number} the value of the secondary stat
	 */
	calcSecondaryStat(second) {

		const env    = new Expression.Env(
			Expression.Env.RUNTIME, this.definez
		);

		return env.read(`unit|total|${second}`);
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
			const char = Legacy.convert(old, Version.CURRENT);
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

		if (name == null) {
			name = localStorage.getItem("theme");
			if (name == null) return false;
		}

		if (!this.myThemeMap.has(name)) return false;

		const theme      = this.myThemeMap.get(name);
		const stylesheet = document.getElementById("theme-link");
		stylesheet.setAttribute("href", theme.stylesheet);
		this.themes.toggleActive(name);

		localStorage.setItem("theme", name);

		return true;
	}

	/* Methods relating to Point Buy */

	clear_point_buy() {
		this.myPointBuy.clear();
	}

	copy_point_buy() {
		for (let [name, value] of this.myPointBuy.column("value")) {
			this.stats.stats[name].value = value;
			this.stats.stats[name].refresh();
		}

		for (let [name, value] of this.myPointBuy.column("growth")) {
			this.stats.growths[name].value = value * 5;
		}

		this.stats.level = 0;
	}

	copy_point_buy_stats(doClass=true) {

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
	}

	create_npc() {

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

		/* add weapons and abilties to sheet */

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

			/* add weapons */
			for (let weapon of kit.weapons) {
				if (!Weapon.has(weapon)){
					throw new Error(`weapon '${weapon}' is undefined`);
				}

				this.wb.select.value = weapon;
				this.wb.add();

				this.weaponz.inInventory = true;
			}

			/* add abilities */
			for (let ability of kit.abilities) {
				if (!Ability.has(ability)){
					throw new Error(`ability '${ability}' is undefined`);
				}

				this.abilities.equipped.add(ability);
				this.abilities.equipped.toggleActive(ability);
			}

			/* set skill level */
			if (skill in this.skills) {

				const row = this.skills[skill];

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

		if (ps.sidearm == "None") {
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
	}
}

/* exported Sheet */
