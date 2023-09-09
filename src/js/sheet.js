
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

const V3 = true;

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

		this.attack_mttype = "str";

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
			Tile, Battalion, Adjutant, Preset, Gambit
		]) {
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

		// inner.add("Deterministic", element("div", [
		// 	element("input", {
		// 		class : ["simple-border"],
		// 		attrs : {
		// 			type    : "button",
		// 			value   : "Use Bases",
		// 			onclick : (() => this.copy_point_buy())
		// 		}
		// 	}),
		// 	element("input", {
		// 		class : ["simple-border"],
		// 		attrs : {
		// 			type    : "button",
		// 			value   : "Use Level",
		// 			onclick : (() => this.copy_point_buy_stats())
		// 		}
		// 	}),
		// 	element("input", {
		// 		class : ["simple-border"],
		// 		attrs : {
		// 			type    : "button",
		// 			value   : "Clear Points",
		// 			onclick : (() => this.clear_point_buy())
		// 		}
		// 	}),
		// 	element("br"),
		// 	this.stats.pointbuy.root,
		// ]));
		// inner.add("Random", this.stats.levelups.root);
		// inner.active = "Deterministic";

		// sidebook.add("Levels", inner.root);

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
			this.stats.pointbuy.root,
		]));

		/* Ability category */

		let model = new CategoryModel(
			Ability.kind, Ability.byName, myFeatureTitle, myFeatureBody, myTriggers
		);
		
		this.abilities = {};

		// inner = new Notebook();
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

		// this.addCategory(new MultiActiveCategory(model, {
		// 	name        : "battlefield",
		// 	empty       : "There are no battlefield abilities",
		// 	selectable  : true,
		// 	reorderable : true,
		// 	removable   : true,
		// 	hideable    : true,
		// 	ontoggle    : refresh,
		// 	onremove    : forget,
		// 	select      : Ability.select(),
		// }));
		// inner.add("On Battlefield", this.abilities.battlefield.root);

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

		sidebook.active = "Levels";

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

		buildnb.add("Character", [character_bb.root, this.character.root]);

		this.wb = weapon_bb;

		buildnb.add("Inventory", [weapon_bb.root, this.weaponz.root]);

		this.bb = battalion_bb;

		buildnb.add("Battalion", [battalion_bb.root, this.battalion.root]);

		buildnb.active = "Character";

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

	getActiveArtCategory() {
		const fromclass = this.arts.class.getActive();

		if (fromclass) return [this.arts.class, fromclass];

		const equipped = this.arts.equipped.getActive();

		if (equipped) return [this.arts.equipped, equipped];

		return [null, null];
	}

	setActiveArtCategory(category, art) {
		if (!(category || art)) return;
		this.clearActiveArt();
		category.toggleActive(art);
	}

	clearActiveArt() {
		for (let key in this.arts) {
			this.arts[key].clearActive();
		}
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
			for (let each of this.abilities.equipped.active) {
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
				fn   = ((env) => {
					if (template.debug) debugger;
					return Expression.evaluate(e, env);
				});
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

			const funcs = names.map(name => {
				const type = typeof name;
				if  ( type == "function" ) return name;
				if  ( type == "string"   ) return ctx[name];
				throw new Error(`type '${type}' is invalid`);
			});

			return (env) => {

				let a = 0;
				for (let func of funcs) {
					a = sum(env, a, func(env));

					if ((typeof a != "number" && typeof a != "string") || Number.isNaN(a)) {
						debugger;
					}

				}

				return a;
			};
		}

		const abilityfunc = (desig) => {
			const name = desig;

			return ((env) => {

				let a = 0;
				const cats = ["class", "equipped"];

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

		const artfunc = (desig) => {
			const name = desig;

			return ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				const art = CombatArt.get(key);

				return label(env, art.name, art.modifier(name));
			});
		};

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

					// add limiter (negative) to sum growth to get final
					const grow = sum + Forecast.diminish(sum, name);

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

		let weapon_tags = new Set();

		for (let weapon of chain(definitions.weapons, definitions.attributes)) {
			for (let tag of weapon.tags) {
				
				const name = tag;
				if (weapon_tags.has(tag)) continue;

				add({
					name  : `weapon|tagged|${Expression.asIdentifier(tag)}`,
					about : wrap(
						`A flag; 1 if weapon is tagged with '${tag}' and 0 if `,
						`weapon is not tagged with '${tag}'.`
					),
					expr  : ((env) => {

						for (let each of this.weaponz.attributes.values()) {
							if (each.tagged(name)) return true;
						}

						return Number(this.weaponz.tagged(name));
					}),
				});

				weapon_tags.add(tag);
			}
		}

		const art_tags = new Set();

		for (let art of definitions.arts) {
			for (let tag of art.tags) {

				const name = tag;
				if (art_tags.has(tag)) continue;

				add({
					name  : `art|tagged|${Expression.asIdentifier(tag)}`,
					about : wrap(
						`A flag; 1 if art is tagged with '${tag}' and 0 if `,
						`art is not tagged with '${tag}'.`
					),
					expr  : ((env) => {
						const key = this.getActiveArt();

						if (key == null) return 0;
					
						return CombatArt.get(key).tagged(name);
					}),
				});

				art_tags.add(tag);
			}
		}

		add({
			name  : "unit|multiplier|healing",
			about : wrap(
				"Used to halve base magic for healing spell might; value is ",
				"0.5 if weapon is tagged with 'healing' and is 1.0 if not."
			),
			expr  : ((env) => {
				const key = this.getActiveArt();
				const art = key && CombatArt.get(key).tagged("healing");
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
			expr  : ((env) => {
				const name = this.getActiveArt();
				return name ? !CombatArt.get(name).tagged("tactical") : false;
			}),
		});

		add({
			name  : "art|type|tactical",
			about : wrap(
				"Evaluates to 1 if unit has a tactical art active, ",
				"and otherwise evaluates to 0.",
			),
			expr  : ((env) => {
				const name = this.getActiveArt();
				return name ? CombatArt.get(name).tagged("tactical") : false;
			}),
		});

		add({
			name  : "art|active",
			about : wrap(
				"Evaluates to 1 if unit has an art active, ",
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

					mttype = AttackFeature.MTTYPE.asNumber(gambit.mttype);

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
				return AttackFeature.MTTYPE.asNumber(
					this.battalion.getGambit().mttype
				);
			}),

		});

		add({
			name  : "gambit|art|mttype",
			about : wrap(
				"What statistic a metagambit's might is based off of.",
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;

				const art = CombatArt.get(key);

				if (!art.tagged("metagambit")) return 0;
				
				return AttackFeature.MTTYPE.asNumber(art.mttype);
			}),

		});

		add({
			name  : "gambit|total|mttype",
			about : wrap(
				"What statistic this gambit's might targets",
			),
			expr  : ((env) => {
				return (
					/* meta gambit overrides active gambit */
					env.read("gambit|art|mttype")
						||
					/* active gambit overrides structure value */
					env.read("gambit|active|mttype")
						||
					/* structure value serves as fallback */
					env.read("gambit|structure|mttype")
						||
					/* fallback is not to assume N/A */
					3 
				);
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
						+ fill range_penalty(
							unit|total|maxrng - weapon|total|maxrng
						)
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
						+ metaif builtins|codegen == 1
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
			expr  : ((env) => {
				return label(env, "level", this.battalion.level);
			}),
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
						floor(battalion|mult|${name} * Level {battalion|level})
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
				expr  : `battalion|template|${name} + battalion|long|${name}`,
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

		add({
			name  : "battalion|modifier|gmt",
			about : wrap(
				"The battalion's might statistic bonuses from employer."
			),
			expr  : funcsum(abilityfunc("gmt"), artfunc("gmt")),
		});

		add({
			name  : "battalion|modifier|gepcost",
			about : wrap(
				"The battalion's ep cost statistic bonuses from employer."
			),
			expr  : funcsum(abilityfunc("gepcost"), artfunc("gepcost")),
		});

		add({
			name  : "battalion|modifier|ghit",
			about : wrap(
				"The battalion's hit statistic bonuses from employer."
			),
			expr  : funcsum(abilityfunc("ghit"), artfunc("ghit")),
		});

		add({
			name  : "battalion|modifier|gmaxrng",
			about : wrap(
				"The battalion's gambit max range statistic bonuses from employer."
			),
			expr  : funcsum(abilityfunc("gmaxrng"), gambitfunc("gmaxrng"), artfunc("gmaxrng"))
		});

		add({
			name  : "battalion|modifier|gminrng",
			about : wrap(
				"The battalion's gambit minrng statistic bonuses from employer."
			),
			expr  : funcsum(abilityfunc("gmaxrng"), gambitfunc("gmaxrng"), artfunc("gminrng"))
		});

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

	*iterCustomRows() {

		let row = undefined;
		let tmp = undefined;

		for (row of this.weaponz.template.rows) yield row;

		for (let each of this.weaponz.attributes.getActiveValues()) {
			for (row of each.rows) yield row;
		}

		for (let each of this.abilities.class.getActiveValues()) {
			for (row of each.rows) yield row;
		}

		for (let each of this.abilities.equipped.getActiveValues()) {
			for (row of each.rows) yield row;
		}

		if ((tmp = this.getActiveArt())) {
			for (row of CombatArt.get(tmp).rows) yield row;
		}
		
		if ((tmp = this.equipment.known.getActive())) {
			for (row of Equipment.get(tmp).rows) yield row;
		}
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
			for (let each of kit.weapons) {

				const weapon = each instanceof Array ? each[0]       : each;
				const attrs  = each instanceof Array ? each.slice(1) : [];

				if (!Weapon.has(weapon)){
					throw new Error(`weapon '${weapon}' is undefined`);
				}

				this.wb.select.value = weapon;
				this.wb.add();

				/* add any attributes to the weapon */
				for (let attr of attrs) {
					this.weaponz.attributes.add(attr);
					this.weaponz.attributes.toggleActive(attr);
				}

				/* include any attributes in the weapon's name */
				if (attrs.length) {
					this.weaponz.name = (
						attrs.join(" ") + " " + this.weaponz.name
					);
				}

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

			/* add arts */
			for (let art of kit.arts) {
				if (!CombatArt.has(art)) {
					throw new Error(`art '${art}' is undefined`);
				}

				this.arts.equipped.add(art);
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
