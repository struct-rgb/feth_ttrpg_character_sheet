
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

/* global Expression */

/* global Macros */

/* global Notebook */

/* global PointBuy */

/* global Ability */
/* global Class */
/* global CombatArt */
/* global Weapon */
/* global Equipment */
/* global Attribute */
/* global AttackFeature */
/* global Condition */
/* global Tile */

/* global Legacy */

/* global Skills */
/* global Stats */
/* global Weapons */
/* global Characters */

/* global CategoryModel */
/* global MultiActiveCategory */
/* global SingleActiveCategory */

class Theme {

	static list = [
		new Theme("Classic", "The classic look and feel.", "./src/css/light.css"),
		new Theme("Dark", "The ever popular alternative.", "./src/css/dark.css"),
		new Theme("Golden Deer", "A theme for the best house.", "./src/css/deer.css"),
		new Theme("Boneless", "For when you want to play as the protagonist.", "./src/css/boneless.css"),
	];

	constructor(name, description, stylesheet) {
		this.name        = name;
		this.description = description;
		this.stylesheet  = stylesheet;
	}

}

class BigButton {

	constructor(text, onclick) {

		onclick = onclick || (() => console.log(`BigButton ${text} clicked!`));
		this.onclick = onclick;

		this.idno          = uniqueID();
		this.label         = element("label", text);
		this.label.htmlFor = this.idno;
		this.label.classList.add("custom-file-input", "simple-border");

		this.input         = element("input");
		this.input.id      = this.idno;
		this.input.type    = "button";
		this.input.onclick = onclick;
		this.input.classList.add("no-display");
	}

}

class Buildables {

	constructor(options) {

		this._updatefn = options.update || (x => x);

		options    = options || {name: "NO NAME", templates: []};
		this.root  = element("div");
		this.model = options.model;

		let button = undefined;

		// /* Clear button */
		// button         = element("input");
		// button.type    = "button";
		// button.value   = "Clear";
		// button.onclick = options.clear || voidfn;
		// button.classList.add("simple-border");
		// this._clear      = button;

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
			empty       : options.empty || "If you're reading this, something has gone wrong",
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

		// this._new.onclick.call();
	}

	get active() {
		return this.map.get(this.activeID);
	}

	change(key) {
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
			this.map.set(element, elements[element]);
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
 * Class representing a skill grade
 */
class Grade {

	static list = [
		new Grade("E",  0,   0), new Grade("E+",  1,   1),
		new Grade("D",  2,   2), new Grade("D+",  3,   4),
		new Grade("C",  4,   8), new Grade("C+",  5,  16),
		new Grade("B",  6,  36), new Grade("B+",  7,  50),
		new Grade("A",  8,  64), new Grade("A+",  9,  80),
		new Grade("S", 10, 150), new Grade("S+", 11, 200),
		new Grade("X", 12, 201),
	];

	static toNumber = (function () {
		const map = new Map(Grade.list.map((grade) => [grade.name, grade.number]));
		return (name) => map.get(name);
	})();

	static fromNumber = (function () {
		const map = new Map(Grade.list.map((grade) => [grade.number, grade.name]));
		return (number) => map.get(number);
	})();

	static budThreshold     = 32;
	static budThresholdWeak = 25;

	/**
	 * Converts a number of points to the corresponding letter grade
	 * @static
	 * @param {number} points - number of points
	 * @returns {string} the letter grade
	 */
	static for(points, skill, aptitude) {
		const final = points * Grade.multiplier(points, skill, aptitude);
		return Grade.list.reduce((a, b) => b.points > final ? a : b).name;
	}

	static multiplier(points, skill, aptitude) {
		return (
			(skill == aptitude.budding
				? (skill == aptitude.weakness
					? (points >= Grade.budThresholdWeak
						? 2.0
						: 0.5)
					: (points >= Grade.budThreshold
						? 2.0
						: 1.0))
				: (skill == aptitude.talent
					? 2.0
					: (skill == aptitude.weakness
						? 0.5
						: 1.0)))
		);
	}

	static TPTABLE = [
		[15, 0, 0, 1, 2, 1, 2, 1, 2, 1, 10, 9],
		[ 0, 0, 0, 0, 0, 1, 2, 1, 2, 1,  2, 1],
		[ 0, 0, 0, 0, 0, 0, 0, 1, 2, 1,  2, 1],
	];

	/**
	 * Create a grade
	 * @param {string} name - letter for the grade
	 * @param {number} points - minimum number of points to acheive the grade
	 */
	constructor(name, number, points) {
		this.name   = name;
		this.number = number;
		this.points = points;
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

		// main definition data object
		this.data = data;

		this.macros = new Macros.UserInterface(this);
		document.getElementById("macro-builder").appendChild(this.macros.root);

		/* prominently display the version data */
		const version = document.getElementById("version");
		version.textContent = "Version " + Version.CURRENT.toString();

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
		this.context(context);
		this.definez   = context;

		// set the lookup tables for each feature class
		for (let each of [Ability, Weapon, CombatArt, Equipment, Class, Attribute, Condition, Tile]) {
			each.setLookupByName(data, compiler);
		}

		/* populate skills, stats, and growths */
		this.stats = new Stats(data.stats.names, this);
		document.getElementById("stats-section").appendChild(this.stats.root);

		this.skills = new Skills.UserInterface(data.skills, this);
		document.getElementById("skill-section").appendChild(this.skills.root);

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

		let   sidebook = new Notebook(document.getElementById("equip-pane"));
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
		this.battalion  = this.stats.battalion;

		sidebook.active = "Abilities";

		/* set up the characters and themes tabs */

		let notebook = new Notebook(document.getElementById("right-pane"));
		this.tabs.main = notebook;

		const buildnb = new Notebook([notebook.root, document.getElementById("main-tabs")]);
		
		this.character = new Characters(this);

		const character_bb = new Buildables({
			name      : "characters",
			empty     : "If you're reading this, something has gone wrong",
			templates : data.presets.map(x => x.name),
			model     : this.character,
			update    : Legacy.convert,
		});

		this.cb = character_bb;

		buildnb.add("Characters", [character_bb.root, this.character.root]);

		// const battalion_bb = new Buildables({
		// 	name      : "battalions",
		// 	empty     : "Not leading a battalion",
		// 	templates : data.battalions.filter(x => !x.hidden).map(x => x.name),
		// 	model     : this.battalion,
		// });

		// this.bb = battalion_bb;

		/* TODO figure out what to do with battalions for patch #5 */
		// buildnb.add("Battalions", [battalion_bb.root, btl]);

		this.weaponz = new Weapons(this);

		const weapon_bb = new Buildables({
			name       : "weapons",
			empty      : "No weapons or spells",
			// templates : data.weapons.filter(x => !x.hidden).map(x => x.name),
			model      : this.weaponz,
			sortfilter : Weapon.select(),
		});

		this.wb = weapon_bb;

		buildnb.add("Spells & Weapons", [weapon_bb.root, this.weaponz.root]);

		buildnb.active = "Characters";

		this.tabs.create = buildnb;

		notebook.add("Create", buildnb.root);

		const eqdiv = document.getElementById("equip-pane");
		eqdiv.remove();

		eqdiv.append(sidebook.root);

		notebook.add("Assign", eqdiv);

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

		/* get the macro builder and shove it into a tab */
		const builder = document.getElementById("macro-builder");
		builder.remove();
		tools.add("Macros", builder);

		const pbdiv = document.getElementById("point-buy");
		pbdiv.remove();

		this.myPointBuy = new PointBuy();
		pbdiv.appendChild(this.myPointBuy.root);

		tools.add("Point Buy", pbdiv);

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

					// body   : (function() {
					// 	return element("span", model_data.description);
					// }),

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

						// console.log(object);
					}),

					export : (function() {
						return this.data;
					}),
					
					clear  : (function() {
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

		const themes = document.getElementById("themes");

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
		this.themes.addTo(themes);
		
		themes.remove();

		tools.add("Themes", themes);

		tools.active = "Themes";

		this.tabs.tools = tools;

		notebook.add("Tools", tools.root);

		notebook.active = "Create";

		/* set theme */
		this.theme();

		/* prompt user to reload last session */
		Object.prototype.hasOwnProperty.call(localStorage, "v2session")
			? this.autoload()
			: this.cb.add();

		/* autosave current sheet every five minutes */
		setInterval(() => void this.autosave(), 300000);
	}

	/* this was a workaround the fact two arts cats weren't expected */
	getActiveArt() {

		const fromclass = this.arts.class.getActive();

		if (fromclass) return fromclass;

		const equipped = this.arts.equipped.getActive();

		if (equipped) return equipped;

		return null;
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

		const vardiv = document.getElementById("var-options");
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

			// if (funcs.some(func => func === undefined)) {
			// 	debugger;
			// }

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

		add({
			name  : "other|martial|mov",
			about : wrap(
				"This is the Martial Starting class movement bonus that ",
				"those get after level 10. Evaluates to 1 if the state of ",
				"the sheet meets those circumstances and to 0 otherwise.",
			),
			expr  : ((env) => {
				const cls = this.character.class;

				return label(env, "lvl 10 martial", Number(
					cls.type == "Martial"
					&& cls.tier == "Starting"
					&& this.stats.level >= 10
				));
			}),
		});

		add({
			name  : "other|range_penalty|prompt",
			about : wrap(
				"The hit penalty for attacking past maximum bow range. This ",
				"isn't available in the builder proper, but you can used it ",
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
				"evaluates to other|triangle|prompt. Additionally, if a ",
				"weapon that has the 'no triangle' tag is equipped, instead ",
				"evaluates to 0."
			),
			expr  : `
				metaif builtins|macrogen == 1 then
					metaif weapon|tagged|no_triangle == 0 then
						other|triangle|prompt
					else
						0
					end
				else
					if weapon|tagged|no_triangle == 0 then
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
							ask [Mounted?]
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

			// if (name == "mov") {
			// 	/* mov has a special calculation the others don't */
			// 	add({
			// 		name  : "unit|total|mov",
			// 		about : 
			// 			"The unit's total mov statistic after modifiers."
			// 		,
			// 		expr  : (() => {
			// 			const mpri = prime.concat(["other|martial|mov"]);
			// 			const fsum = funcsum(...mpri);

			// 			return (env) => sum(env, 4, fsum(env));
			// 		})(),
			// 	});
			// } else {
			// 	add({
			// 		name  : `unit|total|${name}`,
			// 		about : wrap(
			// 			`The unit's total ${name} statistic after `,
			// 			"modifiers.",
			// 		),
			// 		expr  : funcsum(...prime),
			// 	});
			// }

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
				return Number(this.weaponz.template.tagged("healing"));
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
				"indicates whether the art's might is applied as healing ",
				"or as damage. Used in the macro builder.",
			),
			expr  : ((env) => {
				const key = this.getActiveArt();

				if (key == null) return 0;
				
				return CombatArt.get(key).tagged("tactical");
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
				return Number(this.weaponz.template.tagged("no triangle"));
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
				return Number(this.weaponz.template.tagged("no hit"));
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
				return Number(this.weaponz.template.tagged("no might"));
			}),
		});

		add({
			name  : "weapon|multiplier|healing",
			about : wrap(
				"Used to halve base magic for healing spell might; value is ",
				"0.5 if weapon is tagged with 'healing' and is 1.0 if not."
			),
			expr  : ((env) => {
				return this.weaponz.template.tagged("healing") ? 0.5 : 1.0;
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

		// add({
		// 	name  : "",
		// 	about : wrap(
		// 		""
		// 	),
		// 	expr  : ((calc) => {

		// 	}),
		// });
		
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
				
				return AttackFeature.MTTYPE.asNumber(CombatArt.get(key).base);
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
					"value entered into the table under Create => Spells & ",
					"Weapons before modifiers. If none is equipped then ",
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
					(metaif builtins|macrogen == 1 then
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
					end)
					
					* weapon|multiplier|healing
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

		document
			.getElementById("generator-console")
			.setAttribute("list", uid);

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
}

/* exported Sheet */
