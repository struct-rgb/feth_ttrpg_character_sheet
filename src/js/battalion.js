
/* global element */
/* global uniqueLabel */
/* global AttributeCell */

/* global Battalion */

class Battalions {

	static DEFAULT = "Blank Battalion";

	static CELL_OPTIONS = {
		value : 0,
		shown : "0",
		edit  : true,
	};

	constructor(stats, sheet) {

		this.sheet    = sheet;

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text", 
				value    : "Blank Battalion",
				onchange : (() => {
					/* TODO find better way to do this */
					const activeID = this.sheet.bb.category.getActive();
					if (activeID === null) return;

					const element = this.sheet.bb.category.elements.get(activeID);
					element.title = this.name;
				}),
			},
		});

		this._select = element("select", {
			class: ["simple-border"],
			attrs: {
				value   : Battalions.DEFAULT,
				oninput : (() => {
					this.template      = this._select.value;
				}),
			},
		});

		for (let template of definitions.battalions) {
			const option       = element("option");
			option.value       = template.name;
			option.textContent = template.name;
			this._select.appendChild(option);
		}

		this._template     = Battalion.get(Battalions.DEFAULT);

		this._level = new AttributeCell({
			edit    : true,
			value   : 1,
			shown   : "1",
			min     : 1,
			max     : 5,
			trigger : (x => x),
		});

		this._endurance_meter = element("meter", {
			class: ["short-meter"],
			attrs: {
				min   : 0,
				max   : 3,
				value : 3,
			},
		});

		this._endurance_input = element("input", {
			class: ["hidden-field", "simple-border"],
			attrs: {
				type    : "number",
				min     : 0,
				max     : 3,
				value   : 3,
				oninput : (() => {
					this._endurance_meter.value = this._endurance_input.value;
				}),
			},
		});

		const tbody = element("tbody", element("tr", [
			element("th", "Level"), this._level.root, element("td", {
				content : [
					uniqueLabel(
						this._endurance_meter,
						this._endurance_input,
					),
					this._endurance_input,
				],
				attrs   : {colSpan: 2},
			}),
		]));

		this.stats = {};

		for (let j = 0; j < stats.length;) {
			const tr   = document.createElement("tr");
			for (let i = 0; i < 2; ++i) {
				tr.appendChild(element("th", stats[j].toUpperCase()));

				const name = stats[j];

				const base = new AttributeCell(Battalions.CELL_OPTIONS, (base) => {
					this.sheet.stats.refresh();
					return base + this._template.modifier(name);
				});

				this.stats[stats[j]] = base;
				tr.appendChild(base.root);
				++j;
			}
			tbody.appendChild(tr);
		}

		this._info    = element("div");

		this._details = element("details", [
			element("summary", "Details"),
			this._info,
		]);

		this.root = element("div", [
			uniqueLabel("Battalion Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Template", this._select), element("br"),
			this._select, element("br"), element("br"),

			this._details,

			element("table", tbody, "battalion-table"),
		]);
	}

	get(stat) {
		if (!(stat in this.stats)) return 0;
		return this.stats[stat].value + this._template.modifier(stat);
	}

	get level() {
		return Number(this._level.value);
	}

	set level(value) {
		this._level.value = value;
	}

	get endurance() {
		return Number(this._endurance_input.value);
	}

	set endurance(value) {
		this._endurance_input.value = value;
		this._endurance_meter.value = value;
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		this._name.value = value;

		/* TODO find better way to do this */
		const activeID = this.sheet.bb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.bb.category.elements.get(activeID);
		element.title = this.name;
	}

	get description() {
		return this._template.name;
	}

	get template() {
		return this._template;
	}

	set template(value) {

		this._template     = Battalion.get(value);
		this._select.value = value;

		for (let stat in this.stats) {
			this.stats[stat].refresh();
		}

		/* TODO find better way to do this */
		const activeID = this.sheet.bb.category.getActive();
		if (activeID === null) return;

		const elemenn       = this.sheet.bb.category.elements.get(activeID);
		elemenn.description = this.description;

		this._info.remove();

		const b = this._template;
		const g = this._template.gambit;
		const p = element("div");

		const text = [
			["strong", b.name],
			["br"],
			["em", `${b.rarity} ${b.type} Battalion`],
			["br"],
			["em", `(${b.requires} - Costs ${b.price})`],
			["br"], ["br"],
			["strong", b.gambit.title()],
			["br"],
			["em", 
				(g.higherMight()
					? "Might: " + g.higherMight() + ", "
					: "")
				+ "Hit: " + g.modifier("hit") + ", "
				+ "Uses: " + g.modifier("uses")
			],
			["br"],
			["em",
				"Range: "
					+ (g.modifier("minrng") == g.modifier("maxrng")
						? g.modifier("minrng")
						: g.modifier("minrng") + "-" + g.modifier("maxrng"))
				+ " (" + g.shape + ")"
			],
			["br"], ["br"],
			["div", g.description],
		];

		for (let line of text) {
			p.appendChild(element(...line));
		}

		this._info = p;
		this._details.appendChild(p);
	}

	import(battalion) {

		this.name        = battalion.name;
		this.template    = battalion.template;
		this.endurance   = battalion.endurance;

		for (let stat in battalion.statistics) {
			this.stats[stat].value = battalion.statistics[stat];
		}

	}

	export() {

		const stats = {};

		for (let stat in this.stats) {
			stats[stat] = this.stats[stat].value;
		}

		return {
			name        : this.name,
			template    : this.template.name,
			endurance   : this.endurance,
			statistics  : stats,
		};
	}

	clear(preset) {

		this.name        = preset || Battalions.DEFAULT;
		this.template    = preset || Battalions.DEFAULT;
		this.endurance   = 3;

		for (let stat in this.stats) {
			this.stats[stat].value = 0;
		}
	}

}

/* exported Battalions */
