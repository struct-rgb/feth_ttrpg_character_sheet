
/* global element */
/* global delimit */
/* global tooltip */
/* global uniqueLabel */
/* global Version */

/* global Class */
/* global Ability */
/* global CombatArt */
/* global Equipment */

/* global Polish */

class Characters {

	static DEFAULT = "Blank Sheet";

	static DESCRIPTION = "Write your character description here.";

	static DEFAULT_CLASS = "None";

	constructor(sheet) {

		this.sheet = sheet;

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text", 
				value    : "Blank Sheet",
				onchange : (() => {
					const activeID = this.sheet.cb.category.getActive();
					if (activeID === null) return;

					const element = this.sheet.cb.category.elements.get(activeID);
					element.title = this.name;
				}),
			},
		});

		this._advantage = element("select", {
			class: ["simple-border"],
			attrs: {
				value   : "Normal",
				oninput : (() => {
					this.sheet.stats.refresh();
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
			class   : ["simple-border"],
			content : Characters.DESCRIPTION,
			attrs   : {
				onchange: (() => {
					const activeID = sheet.cb.category.getActive();
					if (activeID === null) return;

					const element = sheet.cb.category.elements.get(activeID);
					element.description = this.description;
				}),
			},
		});

		this._class = element("select", {
			class : ["simple-border"],
			attrs : {
				value   : Characters.DEFAULT_CLASS,
				oninput : (() => {
					this.class = this._class.value;
					this.refresh();
				}),
			},
		});

		for (let template of definitions.classes) {
			const option       = element("option");
			option.value       = template.name;
			option.textContent = template.name;
			this._class.appendChild(option);
		}

		this._mounted = element("input", {
			class: ["simple-border"],
			attrs: {
				type    : "checkbox",
				oninput : (() => {
					this.mounted = this._mounted.checked;
				}),
			}
		});

		this._classText = document.createTextNode(
			"Class description/prerequisites/etc. will go here."
		);

		this._info = element("div");

		this.root = element("div", [
			uniqueLabel("Character Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Triangle Effect", this._advantage), element("br"),
			this._advantage, element("br"),

			uniqueLabel("Gold Pieces", this._money), element("br"),
			this._money, element("br"),

			uniqueLabel("Description", this._description), element("br"),
			this._description, element("br"),

			uniqueLabel("Class", this._class), element("br"),
			// this._class, this._mounted, element("span", "Mounted?"), element("br"),
			this._class, 

			tooltip([this._mounted, "Mounted?"], [
				"Flying and Cavalry classes can ride mounts for increased ",
				"stats. When not mounted, they lose that class-type.",
			].join("")),

			element("br"),
			element("br"),
			this._info,

		]);
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		this._name.value = value;

		const activeID = this.sheet.cb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.cb.category.elements.get(activeID);
		element.title = this.name;
	}

	get description() {
		return this._description.value;
	}

	set description(value) {
		this._description.value = value;

		const activeID = this.sheet.cb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.cb.category.elements.get(activeID);
		element.description = this.description;
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
		this._mounted.checked = value;

		if (this.mounted && !this.class.hasMount()) {
			this.mounted = false;
		} else {
			this.refresh();
		}
	}

	get class() {
		return Class.get(this._class.value);
	}

	set class(value) {

		if (value === undefined) throw Error();

		this._class.value     = value;
		this._mounted.checked = this.class.hasMount();
		// this.refresh();
		
	}

	get triangle() {
		return Number(this._advantage.value);
	}

	set triangle(value) {
		this._advantage.value = value;
	}

	refresh(active=[]) {

		this.sheet.abilities.class.setState({
			added: this.class.abilities,
			active: active
		});

		// this.sheet.skills.refresh()
		this.sheet.stats.refresh();

		/* generate the class information blurb */
		this._info.remove();

		const c = Class.get(this._class.value);

		const list = Characters.listize(Polish.parse(c.requires));
		const pass = this.sheet.skills.validate(c.requires).boolean;

		const p = element("div", {
			class   : ["center-pane"],
			content : [
				element("dt", element("strong", c.name)),
				element("dd", [
					element("em", `${c.tier}, ${Array.isArray(c.type) ? c.type.join(", ") : c.type}`),
					element("br"),
					c.description,
				]),
				element("strong", [
					"Class Requirements (",
					element("span", pass ? "Pass" : "Fail", pass ? "datum" : "computed"),
					")",
				]),
				element("div", list),
			],
			attrs  : {
				onclick: (() => this.refresh())
			}
		});

		this._info = p;
		this.root.appendChild(p);
	}

	static listize(node, top=true) {

		const name = node[0];

		if (top) {

			const elements = Characters.listize(node, false);

			if (name == "All") {
				return elements;
			}

			return element("ul", element("li", elements));
		}

		const args = node.slice(1);

		switch (name) {

		case "All":
			return element("ul",
				args.map(e => element("li", Characters.listize(e, false)))
			);

		case "Any":
			return delimit(" or ",
				args.map(e => Characters.listize(e, false))
			);

		case "Required":
			return element("span",
				[Characters.listize(args[0], false), " (required)"]
			);

		case "Permission":
			return element("strong", name);

		default:
			return element("strong", node.join(" "));
		}
	}

	import(object) {

		this.sheet.stats.import(object.statistics);
		this.sheet.skills.import(object.skills);

		this.class       = object.class       || Characters.DEFAULT_CLASS;
		this.name        = object.name        || Characters.DEFAULT;
		this.description = object.description || Characters.DESCRIPTION;
		this.money       = object.money       || 0;

		this.sheet.wb.importAll(object.weapons);

		this.sheet.abilities.equipped.setState(object.abilities.equipped);
		this.sheet.combatarts.equipped.setState(object.combatarts.equipped);

		/** TODO fill the rest of these in **/

		this.triangle = 0;

		this.refresh();
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

			/*
			 * don't save the actual state for class since this will be
			 * loaded when the class is assigned; only save active abilites
			 * yes, I realize it's a little clunky but that's how it is
			 */
			class_active : Array.from(this.sheet.abilities.class.getActive()),

			weapons    : this.sheet.wb.exportAll(),
			// battalions : this.sheet.bb.exportAll(),

			abilities    : {
				equipped    : this.sheet.abilities.equipped.getState(),
				battlefield : this.sheet.abilities.battlefield.getState(),
			},
			combatarts  : {
				equipped    : this.sheet.combatarts.equipped.getState(),
			},

			equipment   : {
				known       : this.sheet.equipment.known.getState()
			}
		};
	}

	clear(preset) {

		preset           = preset || {};
		this.class       = Characters.DEFAULT_CLASS;
		this.name        = preset.name        || Characters.DEFAULT;
		this.description = preset.description || Characters.DESCRIPTION;
		this.money       = 0;
		this.triangle    = 0;

		for (let feature of [Ability, CombatArt, Equipment]) {
			for (let category in this[feature.kind]) {
				if (category == "class") continue;
				this[feature.kind][category].clear();
			}
		}

		this.sheet.wb.clear();
		// this.sheet.bb.clear();

		this.sheet.stats.clear();
		this.sheet.skills.clear();
		this.sheet.weaponz.clear();
		// this.sheet.battalion.clear();

		this.sheet.abilities.equipped.clear();
		this.sheet.combatarts.equipped.clear();

		this.sheet.stats.levelups.clear();

		this.refresh();
		this.sheet.skills.refresh();
	}
}

/* exported Characters */