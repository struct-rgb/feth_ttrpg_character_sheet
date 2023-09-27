
/* global element */
/* global delimit */
/* global tooltip */
/* global uniqueLabel */
/* global Version */
/* global Toggle */
/* global ellipse */
/* global choice */

/* global Class */
/* global Preset */
/* global Ability */
/* global Art */
/* global Equipment */

class Characters {

	static DEFAULT = "Blank Sheet";

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

					const element = this.sheet.cb.category.element(activeID);
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
			class       : ["simple-border"],
			content     : "",
			attrs       : {
				placeholder : "Write your character description here...",
				onchange    : (() => {
					const activeID = sheet.cb.category.getActive();
					if (activeID === null) return;

					const element = sheet.cb.category.element(activeID);
					element.description = this.body();
				}),
			},
		});

		this._sf    = Class.select(() => {
			this.class = this._class.value;
			this.refresh();
		});

		this._class = this._sf._select;

		this._mounted = new Toggle("Mounted?", false, (bool) => {
			this.mounted = this._mounted.checked;
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
			this._sf.root,
			
			tooltip(this._mounted.root, [
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

		const element = this.sheet.cb.category.element(activeID);
		element.title = this.name;
	}

	get description() {
		return this._description.value;
	}

	set description(value) {
		this._description.value = value;

		const activeID = this.sheet.cb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.cb.category.element(activeID);
		element.description = this.body();
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
	}

	get triangle() {
		return Number(this._advantage.value);
	}

	set triangle(value) {
		this._advantage.value = value;
	}

	refresh() {

		const options = {removable: false, group: "class", hidden: true};

		const load    = (category, items, active) => {

			/* Remove all current class arts/abilities. */
			const names = Array.from(category.names("class"));
			for (let item of names) category.delete(item);

			/* Add in the new class arts/abilities. */
			let added = 1;
			for (let item of items) {
				item = choice(item);
				if (!category.has(item)) category.add(item, options);

				const element = category.element(item);
				element.shiftForward(category.size - added);
				added++;

				if (active) category.toggleActive(item);
			}
		};

		const cls = this.class;

		for (let key of ["abilities", "arts"]) {

			const category = this.sheet[key];

			if (!cls.validate(key, category.getState())) {
				load(category, this.class[key], key == "abilities");
			} else {
				/* TODO low priority; find a better place to do this. */
				for (let each of category.elements("class")) {
					each.removable = false;
				}
			}
		}

		this.sheet.stats.refresh();

		this.reclass();
	}

	reclass() {
		/* generate the class information blurb */
		this._info.remove();

		const c = Class.get(this._class.value);

		const p = element("div", {
			class   : ["center-pane"],
			content : [
				element("dt", element("strong", c.name)),
				element("dd", c.body(true, false, false)),
			],
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
			return element("strong", args[0] || name);

		default:
			return element("strong", node.join(" "));
		}
	}

	import(object) {

		if (typeof object != "object") {
			throw Error(`expected object but got type ${typeof object}`);
		}

		/* Prevents refreshing secondary stats 1000 times */
		this.sheet.stats.pause = true;
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

		this.sheet.item.clear();
		this.sheet.wb.importAll(object.items);

		if (object.battalions) {
			this.sheet.battalion.clear();
			this.sheet.bb.importAll(object.battalions);
		} else {
			this.sheet.bb.clear();
			this.sheet.battalion.clear();
		}
		
		this.sheet.abilities.setState(object.abilities);
		this.sheet.arts.setState(object.arts);

		this.sheet.equipment.setState(object.equipment);

		this.triangle = 0;

		/* We do want to refresh secondary stats now */
		this.sheet.stats.pause = false;
		this.refresh();

		// Put this setting back to what it was.
		this.sheet.myPointBuy.setAnimated(animate);
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
			equipment    : this.sheet.equipment.getState(),
		};
	}

	preset(preset) {

		if (!(preset instanceof Preset)) {
			throw Error(`expected Preset but got ${preset.constructor.name}`);
		}

		this.clear();

		this.name        = preset.name        || Characters.DEFAULT;
		this.description = preset.description || "Preset for a custom character.";

		this.sheet.stats.import(preset);
		this.sheet.copy_stats_to_point_buy(false);

		this.refresh();
	}

	/**
	 * Clear the input widgets for this model
	 * @param {string} preset - an object to fill the inputs from
	 */
	clear(preset) {

		if (preset) {

			if (!Preset.has(preset)) {
				throw new Error(`preset '${preset}' is undefined`);
			}

			return this.preset(Preset.get(preset));
		}

		this.class       = Characters.DEFAULT_CLASS;
		this.name        = Characters.DEFAULT;
		this.description = "";
		this.money       = 0;
		this.triangle    = 0;

		for (let feature of [Ability, Art, Equipment]) {
			for (let category in this[feature.kind]) {
				if (category == "class") continue;
				this[feature.kind][category].clear();
			}
		}

		this.sheet.wb.clear();
		this.sheet.bb.clear();

		this.sheet.stats.clear();
		this.sheet.skills.clear();
		this.sheet.item.clear();
		this.sheet.battalion.clear();

		this.sheet.abilities.clear();
		this.sheet.arts.clear();
		this.sheet.equipment.clear();

		this.sheet.stats.levelups.clear();

		this.refresh();
		this.sheet.skills.refresh();
	}

	/* builtable display */

	getTitle(object) {
		return object.name;
	}

	getBody(object) {
		return element("span", ellipse(object.description, 50));
	}

	body() {
		return this.getBody(this);
	}

}

/* exported Characters */