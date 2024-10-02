
/* global
   Toggle, Version
   element, ellipse, delimit, tooltip, uniqueLabel,
 */

/* global
   Ability, Art, Class, Item, Preset
 */

/* global BuildableModel */

/* global Presetter */

class Characters extends BuildableModel {

	static DEFAULT = "Blank Sheet";

	static DEFAULT_CLASS = "None";

	constructor(sheet) {
		super();

		this.sheet     = sheet;
		this.refresher = sheet.refresher;
		this._pregroup = null;

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text",
				value    : "Blank Sheet",
				onchange : (() => {
					this.sheet.cb.setTitle(this.uuid, this.name);
				}),
			},
		});

		this._advantage = element("select", {
			class: ["simple-border"],
			attrs: {
				value   : "Normal",
				oninput : (() => {
					this.refresher.refresh("other|triangle");
				}),
			},
		});

		const options = [
			["Advantage", +15],
			["Normal", 0],
			["Disadvantage", -15]
		];

		for (let template of options) {
			const option       = element("option");
			option.value       = template[1];
			option.textContent = template[0];
			this._advantage.appendChild(option);
		}

		this._initiative = element("select", {
			class: ["simple-border"],
			attrs: {
				value   : "Not Applicable",
				oninput : (() => {
					this.refresher.refresh("other|initiative");
				}),
			},
		});

		const initiative =  [
			["Not Applicable", 0],
			["Unit Initiated", 1],
			["Foe Initiated", 2],
		];

		for (let template of initiative) {
			const option       = element("option");
			option.value       = template[1];
			option.textContent = template[0];
			this._initiative.appendChild(option);
		}

		this._money = element("input", {
			class: ["simple-border"],
			attrs: {
				type    : "number",
				value   : 0,
				min     : 0,
				oninput : (() => console.log("TODO")),
			},
		});

		this._description = element("textarea", {
			class       : ["simple-border"],
			content     : "",
			attrs       : {
				placeholder : "Write your character description here...",
				onchange    : (() => {
					this.sheet.cb.setBody(this.uuid, this.body());
				}),
			},
		});

		this._sf    = Class.select(() => {
			this.class = this._class.value;
			this.refresh();
		}, this.refresher);

		this._class = this._sf._select;

		this._mounted = new Toggle("Mount/Morph?", false, (bool) => {
			this.mounted = this._mounted.checked;
		});

		this._classText = document.createTextNode(
			"Class description/prerequisites/etc. will go here."
		);

		this._info    = element("div");
		this._infodiv = element("div", this._info);

		this._token   = element("img");

		this.root = element("div", [

			uniqueLabel("Character", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Description", this._description), element("br"),
			this._description, element("br"),

			uniqueLabel("Gold Pieces", this._money), element("br"),
			this._money, element("br"),

			uniqueLabel("Triangle Effect", this._advantage), element("br"),
			this._advantage, element("br"),

			uniqueLabel("Combat Initiative", this._initiative), element("br"),
			this._initiative, element("br"),

			uniqueLabel("Class", this._class), element("br"),
			this._sf.root,
			
			tooltip(this._mounted.root, [
				"Flying, Cavalry, and Morph classes gain access to benefits ",
				"when mounted or morphed. When they are not, they lose that ",
				"class type."
			].join("")),

			element("br"),
			element("br"),
			this._infodiv,

		]);
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		
		if (Item.has(value)) {
			console.trace(`Character: ${this.name} -> ${value}`);
			alert("Press Ctrl-Shift-I and send Ryan a screenshot.");
		}

		this._name.value = value;
		this.sheet.cb.setTitle(this.uuid, value);
	}

	get description() {
		return this._description.value;
	}

	set description(value) {
		this._description.value = value;
		this.sheet.cb.setBody(this.uuid, this.body());
	}

	get money() {
		return Number(this._money.value);
	}

	set money(value) {
		this._money.value = value;
	}

	get mounted() {
		return this._mounted.checked;
	}

	set mounted(value) {
		if (value && !this.class.hasMount()) {
			this._mounted.checked = false;
		} else {
			this.refresh();
		}
	}

	get class() {
		return Class.get(this._class.value);
	}

	set class(value) {

		if (value === undefined) throw Error();

		this._sf.value        = value;
		this._mounted.checked = this.class.hasMount();

		this.refresher.refresh("Class");
		this.refresher.refresh("ClassType");
	}

	/**
	 * Loads class arts and/or abilities when changing classes
	 *
	 * @param  {Category} category The Category collection object where the
	 * given type of feature (arts or abilities) are store within.
	 *
	 * @param  {Array}    options   An array of feature names, typically from
	 * the template of the class to change to.
	 *
	 * @param  {boolean}  active    Should the class feature be set active?
	 *
	 * @param  {Set}      elections A set of the names of preferred features
	 * to pick from the options list when presented with a choice. If one can't
	 * be chosen from the set the user is prompted to make a selection.
	 *
	 */
	loadClassFeatures(category, features, active, election) {

		// remove all current class features
		const names = Array.from(category.names("class"));
		for (let feature of names) category.delete(feature);
	
		// add in the new class features
		for (let feature of features) {

			// select feature from optinon provided by class
			feature = Presetter.elect(feature, election);
			
			if (category.has(feature)) {
				// feature is present in "equip" group; move it to "class"
				category.setGroupFor(feature, "class");
			} else {
				// feature should be added to category if not present
				category.add(feature, {group: "class"});
			}

			// adjust other varous properties of the element
			const element     = category.element(feature);
			// hide the description by default to conserve room
			element.hidden    = true;
			// hide the remove button so the user can't invalidate the setup
			element.removable = false;

			// abilities are set to active by default to the user don't forget
			if (active && !category.isActive(feature))
				category.toggleActive(feature);
		}

		// display the "class" group before equipped features for visibility
		category.getGroup("class")?.shiftToFront();

		// display the "innate" group (if it exists) before class features
		category.getGroup("innate")?.shiftToFront();
	}

	setClass(value, elections) {

		if (value === undefined) throw Error();

		this._class.value     = value;
		this._mounted.checked = this.class.hasMount();

		for (let key of ["abilities", "arts"]) {

			const category = this.sheet[key];
			const features = this.class[key];
			const active   = key == "abilities";

			this.loadClassFeatures(category, features, active, elections[key]);
		}

		this.sheet.stats.refresh();

		if (this._pregroup) this.refresher.delete(this._pregroup);
		this._pregroup = this.refresher.createGroup();

		this.reclass();
		
		this.sheet.refresher.refresh("abilities|slotcost", "arts|slotcost");
	}

	get triangle() {
		return Number(this._advantage.value);
	}

	set triangle(value) {
		this._advantage.value = value;
	}

	get initiative() {
		return Number(this._initiative.value);
	}

	set initiative(value) {
		this._initiative.value = value;
	}

	get token() {
		return this._token.src;
	}

	set token(value) {
		this._token.src = value;
	}

	refresh() {

		for (let key of ["abilities", "arts"]) {

			const category = this.sheet[key];
			const features = this.class[key];
			const active   = key == "abilities";

			if (!this.class.validate(key, category.getState()))
				this.loadClassFeatures(category, features, active);
		}

		this.sheet.stats.refresh();

		if (this._pregroup) this.refresher.delete(this._pregroup);
		this._pregroup = this.refresher.createGroup();

		this.reclass();
		
		this.sheet.refresher.refresh("abilities|slotcost", "arts|slotcost");
	}

	static CLASS_OPTIONS = {dead: true, table: false, center: false};

	reclass() {
		/* generate the class information blurb */
		this._info.remove();

		const c = Class.get(this._class.value);

		const p = element("div", {
			class   : ["center-pane"],
			content : [
				element("dt", element("strong", c.name)),
				element("dd", c.body(Characters.CLASS_OPTIONS)),
			],
		});

		this._info = p;
		this._infodiv.appendChild(p);
	}

	import(object) {

		if (typeof object != "object") {
			throw Error(`expected object but got type ${typeof object}`);
		}

		/* Prevents refreshing secondary stats 1000 times */
		this.sheet.stats.pause        = true;
		this.refresher.wait();

		/* Prevents stat change animation from playing */
		const animate = this.sheet.myPointBuy.setAnimated(false);

		this.sheet.stats.import(object.statistics);
		this.sheet.skills.import(object.skills);

		this.class = (
			Class.has(object.class)
				? object.class
				: Characters.DEFAULT_CLASS
		);

		this.name        = object.name        || Characters.DEFAULT;
		this.description = object.description || "";
		this.money       = object.money       || 0;

		this.sheet.inv.clear();
		this.sheet.wb.importAll(object.items);

		if (object.battalions) {
			this.sheet.battalion.clear();
			this.sheet.bb.importAll(object.battalions);
		} else {
			this.sheet.bb.clear();
			this.sheet.battalion.clear();
		}
		
		for (let key of ["abilities", "arts"]) {
			
			const category = this.sheet[key];
			category.setState(object[key]);

			// we don't the user to be able to remove class features
			for (let each of category.elements("class"))
				each.removable = false;
		}

		this.triangle = 0;

		this.sheet.checks.import(object.traits);
		this.sheet.experiences.import(object.experiences);

		/* We do want to refresh secondary stats now */
		this.sheet.stats.pause        = false;
		this.refresh();

		// Put this setting back to what it was.
		this.sheet.myPointBuy.setAnimated(animate);
		this.sheet.refresher.signal();

		console.log(this.refresher.items.size);
	}

	export() {
		return {
			version      : Version.CURRENT.toString(),
			name         : this.name,
			description  : this.description,
			money        : this.money,
			class        : this.class.name,
			statistics   : this.sheet.stats.export(),
			skills       : this.sheet.skills.export(),
			items        : this.sheet.wb.exportAll(),
			battalions   : this.sheet.bb.exportAll(),
			abilities    : this.sheet.abilities.getState(),
			arts         : this.sheet.arts.getState(),
			traits       : this.sheet.checks.export(),
			experiences  : this.sheet.experiences.export(),
		};
	}

	preset(preset) {

		if (!(preset instanceof Preset)) {
			throw Error(`expected Preset but got ${preset.constructor.name}`);
		}

		if (Item.has(preset)) { // TODO remove after debugging
			console.trace(`Character: ${preset}`);
			alert("Press Ctrl-Shift-I and send Ryan a screenshot.");
		}

		this.refresher.wait();

		this.clear();

		this.name        = preset.name        || Characters.DEFAULT; // TODO Investigate
		this.description = preset.description || "Preset for a custom character.";

		this.sheet.stats.import(preset);
		this.sheet.copy_stats_to_point_buy(false);

		this.refresh();

		this.refresher.signal();
	}

	/**
	 * Clear the input widgets for this model
	 * @param {string} preset - an object to fill the inputs from
	 */
	clear(preset) {

		if (typeof preset == "string" || preset instanceof String) {

			if (!Preset.has(preset)) {
				throw new Error(`preset '${preset}' is undefined`);
			}

			return this.preset(Preset.get(preset));
		}

		this.refresher.wait();

		this.uuid        = null;
		this.class       = Characters.DEFAULT_CLASS;
		this.name        = Characters.DEFAULT;
		this.description = "";
		this.money       = 0;
		this.triangle    = 0;

		for (let feature of [Ability, Art]) {
			for (let category in this[feature.kind]) {
				if (category == "class") continue;
				this[feature.kind][category].clear();
			}
		}

		this.sheet.wb.clear();
		this.sheet.bb.clear();

		this.sheet.stats.clear();
		this.sheet.skills.clear();
		this.sheet.inv.clear();
		this.sheet.battalion.clear();

		this.sheet.abilities.clear();
		this.sheet.arts.clear();

		this.sheet.experiences.clear();

		this.refresh();
		this.sheet.skills.refresh();

		this.refresher.signal();
	}

	/* builtable display */

	getTitle(object=this) {
		return object.name;
	}

	getBody(object=this) {
		return element("span", ellipse(object.description, 50));
	}

	body() {
		return this.getBody(this);
	}

}

/* exported Characters */
