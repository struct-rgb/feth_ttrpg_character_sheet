
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

		const select = element("select");
		select.classList.add("simple-border");

		for (let template of options.templates) {
			const option       = element("option");
			option.value       = template;
			option.textContent = template;
			select.appendChild(option);
		}

		this.select = select;
		this.root.appendChild(select);

		this.map      = new Map();
		const model   = new CategoryModel(options.name, this.map, (x) => x.name, (x) => x.description, () => []);
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

	import(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const item     = JSON.parse(e.target.result);
			const activeID = uniqueID();
			this.map.set(activeID, item);
			this.category.add(activeID);
			this.change(activeID);
		};
		reader.readAsText(file);
		// this._import.onclick.call();
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
		const compiler = new Expression.Compiler(context);
		this.compiler  = compiler;
		this.context(context);
		this.definez   = context;

		// set the lookup tables for each feature class
		for (let each of [Ability, Weapon, CombatArt, Equipment, Class, Attribute]) {
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
			ontoggle    : refresh,
			onremove    : forget,
		}));
		inner.add("Equipped", this.abilities.equipped.root);

		this.addCategory(new MultiActiveCategory(model, {
			name        : "battlefield",
			empty       : "There are no battlefield abilities",
			selectable  : true,
			reorderable : true,
			removable   : true,
			ontoggle    : refresh,
			onremove    : forget,
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

		this.combatarts = {};

		this.addCategory(new SingleActiveCategory(model, {
			name        : "equipped",
			empty       : "No arts are equipped",
			selectable  : true,
			reorderable : true,
			removable   : true,
			ontoggle    : refresh,
			onremove    : forget,
		}));

		sidebook.add("Arts", this.combatarts.equipped.root);

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
			ontoggle    : refresh,
			onremove    : forget,
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
		});

		this.cb = character_bb;

		buildnb.add("Characters", [character_bb.root, this.character.root]);

		const battalion_bb = new Buildables({
			name      : "battalions",
			empty     : "Not leading a battalion",
			templates : data.battalions.filter(x => !x.hidden).map(x => x.name),
			model     : this.battalion,
		});

		this.bb = battalion_bb;

		/* TODO figure out what to do with battalions for patch #5 */
		// buildnb.add("Battalions", [battalion_bb.root, btl]);

		this.weaponz = new Weapons(this);

		const weapon_bb = new Buildables({
			name      : "weapons2",
			empty     : "No weapons or spells",
			templates : data.weapons.filter(x => !x.hidden).map(x => x.name),
			model     : this.weaponz,
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

		tools.add("Legacy", legacy_bb.root);

		tools.active = "Macros";

		this.tabs.tools = tools;

		notebook.add("Tools", tools.root);

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

		notebook.add("Themes", themes);

		notebook.active = "Create";

		/* set theme */
		this.theme();

		/* prompt user to reload last session */
		Object.prototype.hasOwnProperty.call(localStorage, "v2session")
			? this.autoload()
			: this.cb.add();

		/* autosave current sheet every five minutes */
		// setInterval(() => void this.autosave(), 300000);
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

			if (typeof template.expr == "string") {
				const e = this.compiler.compile(template.expr);
				fn   = ((env) => Expression.evaluate(e, env));
				fn.s = (
					template.expr
						/* remove indentation from source */
						.replace(/\t{4}/g, "")
						/* convert remaining into spaces */
						.replace(/\t/g, "  ")
				);
				fn.e = e;
			} else {
				fn   = template.expr;
				fn.s = "[javascript code]"; 
			}

			fn.called      = template.name;
			fn.header      = element("span", [
				"Variable: ", element("span", template.name, "datum"),
				" (Click below for Definition)"
			]);
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

			if (funcs.some(func => func === undefined)) {
				debugger;
			}

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

		add({
			name  : "other|recursion",
			about : "If the interpreter is broken this will freeze the page.",
			expr  : "other|recursion",
		});

		add({
			name  : "unit|level",
			about : "This unit's level",
			expr  : ((env) => this.stats.level)
		});

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

			add({
				name  : `unit|modifier|${name}`,
				about : `The sum of all ${name} modifiers.`,
				expr  : funcsum(...prime),
			});

			if (name == "mov") {
				/* mov has a special calculation the others don't */
				add({
					name  : "unit|total|mov",
					about : 
						"The unit's total mov statistic after modifiers."
					,
					expr  : (() => {
						const mpri = prime.concat(["other|martial|mov"]);
						const fsum = funcsum(...mpri);

						return (env) => sum(env, 4, fsum(env));
					})(),
				});
			} else {
				add({
					name  : `unit|total|${name}`,
					about : wrap(
						`The unit's total ${name} statistic after `,
						"modifiers.",
					),
					expr  : funcsum(...prime),
				});
			}
		}

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
						`${this.weaponz.name} template`,
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
					const key = this.combatarts.equipped.getActive();

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

		for (let each of Weapon.TYPE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `weapon|type|${str.toLowerCase()}`,
				about : wrap(
					`Numerical constant for weapons that use ${str}.`
				),
				expr  : `${num}`,
			});
		}

		add({
			name  : "weapon|type",
			about : wrap(
				"Evaluates to a numerical constant indicating which skill is ",
				"needed to wield the equipped weapon or 0 if none is equipped."
			),
			expr  : ((env) => {
				return Weapon.TYPE.asNumber(this.weaponz.template.type);
			}),
		});

		for (let each of AttackFeature.BASE.strings.entries()) {

			const [num, str] = each;

			add({
				name  : `other|base|${Expression.asIdentifier(str)}`,
				about : wrap(
					`Indicates damage/healing type is ${str}.`
				),
				expr  : `${num}`,
			});
		}

		// add({
		// 	name  : "",
		// 	about : wrap(
		// 		""
		// 	),
		// 	expr  : ((calc) => {

		// 	}),
		// });

		add({
			name  : "weapon|attributes|base",
			about : wrap(
				"Whether the weapon's attributes cause it to deal damage ",
				"and heal based on unit|total|str or unit|total|mag. If ",
				"multiple have this effect only the active one listed ",
				"first is used."
			),
			expr  : ((env) => {
				let a = 0;
				for (let attr of this.weaponz.attributes.getActive()) {
					const attribute = Attribute.get(attr);
					const flag      = (
						AttackFeature.BASE.asNumber(attribute.base)
					);

					/* take the first one that's true */
					a = a || flag;
				}

				return a;
			}),
		});

		add({
			name  : "weapon|template|base",
			about : wrap(
				"Whether this weapon's template deals damage or heals based ",
				"on unit|total|str or unit|total|mag."
			),
			expr  : ((env) => {
				return  (
					AttackFeature.BASE.asNumber(this.weaponz.template.base)
				);
			}),
		});

		add({
			name  : "weapon|base|base",
			about : wrap(
				"Whether this weapon's base deals damage or heals based ",
				"on unit|total|str or unit|total|mag."
			),
			expr  : ((env) => {
				return  this.weaponz.base;
			}),
		});

		add({
			name  : "weapon|total|base",
			about : wrap(
				"Whether this weapon deals damage or heals based ",
				"on unit|total|str or unit|total|mag."
			),
			expr  : ((env) => {
				return  (
					/* manual entry overrides all others */
					env.read("weapon|base|base")
						||
					/* attributes override template */
					env.read("weapon|attributes|base")
						||
					/* fallback value is template value */
					env.read("weapon|template|base")
				);
			}),
		});

		add({
			name  : "art|base",
			about : wrap(
				"Whether this art deals damage or heals based ",
				"on unit|total|str or unit|total|mag."
			),
			expr  : ((env) => {
				const key = this.combatarts.equipped.getActive();

				if (key == null) return 0;
				
				return AttackFeature.BASE.asNumber(CombatArt.get(key).base);
			}),
		});

		add({
			name  : "unit|total|base",
			about : wrap(
				"Whether this unit deals damage or heals based ",
				"on unit|total|str or unit|total|mag."
			),
			expr  : ((env) => {
				return (
					/* art overrides weapon value */
					env.read("art|base")
						||
					/* weapon value serves as fallback */
					env.read("weapon|total|base")
						||
					/* fallback is not to assume N/A */
					3 
				);
			}),
		});

		add({
			name  : "unit|total|mt",
			about : wrap(
				"The amount of damage an attack does before it is reduced by",
				"a foe's unit|total|prot or their unit|total|resl, as ",
				"determined by unit|total|mt|type",
			),
			expr  : `
				floor(
					metaif builtins|macrogen == 1 then
						metaif unit|total|base == other|base|mag then
							unit|total|mag
						elseif unit|total|base == other|base|str then
							unit|total|str
						else
							0
						end
					else
						if     unit|total|base == other|base|mag then
							unit|total|mag
						elseif unit|total|base == other|base|str then
							unit|total|str
						else
							0
						end
					end
					
					* weapon|multiplier|healing
				)
					+ weapon|total|mt
					+ art|mt
					+ equipment|mt
			`,
		});

		add({
			name  : "unit|damage",
			about : wrap(
				"Evaluates to unit|total|mt if unit|total|base is not equal ",
				"to other|base|n_a, which is the enum value used for when a ",
				"feature does not heal or do damage and to 0 if it is equal.",
			),
			expr  : `
				metaif builtins|macrogen == 1
					then metaif unit|total|base == other|base|n_a
						then 0
						else unit|total|mt
					end
					else     if unit|total|base == other|base|n_a
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

	/**
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
		const text = [];

		text.push(this.character.name, "\n\n");
		for (let name of this.stats.names) {
			text.push(name.toUpperCase(), ": ", this.cache.stats[name], "\n");
		}
		text.push("\n");

		function doPushFeatures(title, category) {

			if (!category.size) return;

			text.push(title, "\n\n");
			for (let item of category) {
				text.push(item.title(), "\n", item.body(), "\n\n");
			}
		}

		doPushFeatures("Class Abilities", this.abilities.class);
		doPushFeatures("Equipped Abilities", this.abilities.equipped);
		doPushFeatures("Arts", this.combatarts.equipped);
		doPushFeatures("Weapons & Spells", this.weapons.known);
		doPushFeatures("Equipment", this.equipment.known);

		const blurb = text.join("");
		// (navigator.clipboard.writeText(blurb)
		// 	.then((value) => {
		// 		alert("Character blurb copied to clipboard!");
		// 		console.log(blurb);
		// 	})
		// 	.catch((error) => {
		// 		alert(error);
		// 		console.log(error);
		// 	})
		// );
		
		document.getElementById("generator-output").value = blurb;
	}

	macro() {
		this.macros.macro();
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
