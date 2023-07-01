
/* global element */
/* global uniqueLabel */
/* global AttributeCell */

/* global Battalion */
/* global Adjutant */

/* global Expression */

/* global Grade */

class Battalions {

	static LP_BONUS = [0, 2, 6, 8, 12, 16, 24, 32, 40, 48, 64, 80];

	constructor(sheet) {

		this.sheet = sheet;

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
			content : definitions.battalions.map(
				(object) => element("option", {
					attrs   : {value: object.name},
					content : object.name,
				})
			)
		});

		this._aselect = element("select", {
			class   : ["simple-border"],
			attrs   : {
				value   : Adjutant.DEFAULT,
				oninput : (() => {
					this.adjutant = this._aselect.value;
				}),
			},
			content : definitions.adjutants.map(
				(object) => element("option", {
					attrs   : {value: object.name},
					content : object.name,
				})
			)
		});

		this._rank  = new AttributeCell({
			edit    : true,
			value   : 0,
			shown   : "E",
			min     : 0,
			max     : 11,
			root    : "span",
			trigger : ((base) => {
				let sum = base + Grade.toNumber(this.template.rank);

				this._lp.refresh();

				return Grade.fromNumber(Math.max(Math.min(sum, 12), 0));
			}),
		});

		this._price = new AttributeCell({
			edit    : true,
			after   : element("sub", "G"),
			value   : 0,
			shown   : "0",
			min     : 0,
			max     : 100000,
			step    : 1,
			root    : "span",
			trigger : ((base) => {
				let sum = base + (this.template.price || 0);

				// for (let attribute of this.attributes.getActive()) {
				// 	sum += Attribute.get(attribute).price;
				// }

				return sum;
			}),
		});

		this._level = new AttributeCell({
			edit    : true,
			// after   : element("sub", "G"),
			value   : 1,
			shown   : "1",
			min     : 1,
			max     : 100,
			step    : 1,
			root    : "span",
			trigger : ((base) => {
				this.refresh();
				return base;
			}),
		});

		this.stats = {};

		const lconf = {edit: true, root: "span", value: 0, shown: "0",  min: 0, max: 999, after : ","};
		const cconf = {edit: true, root: "span", value: 0, shown: "0",  min: 0, max: 999};
		const lconfs = {edit: false, root: "span", value: 0, shown: "0",  min: 0, max: 999, after : ","};
		const cconfs = {edit: false, root: "span", value: 0, shown: "0",  min: 0, max: 999};

		const makefn = (name) => {
			const baseFunction = new Expression.Env(
				Expression.Env.RUNTIME, this.sheet.definez
			).func(`battalion|total|${name}`);

			return ((base) => {
				this.sheet.stats.refreshSecondary();
				return baseFunction();
			});
		};

		this._lp = new AttributeCell({
			edit    : false,
			// after   : element("sub", "G"),
			value   : 0,
			shown   : "0",
			min     : 0,
			max     : 1000,
			step    : 1,
			root    : "span",
			trigger : makefn("lp"),
		});

		const defsec = (key, config, fn) => {
			const cell      = new AttributeCell(config, fn);
			this.stats[key] = cell;
			return cell;
		};

		// const wide   = (title, key, trig) => {
		// 	return element("tr", [
		// 		element("th", title),
		// 		element("td", {
		// 			class   : ["center"],
		// 			attrs   : {colSpan: 2},
		// 			content : defsec(key, cconf, trig).root,
		// 		}),
		// 	]);
		// };

		const dual = (title, key1, key2) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec(key1, lconf, makefn(key1)).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec(key2, cconf, makefn(key2)).root
				}),
			]);
		};

		const duals = (title, key1, key2) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec(key1, lconfs, makefn(key1)).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec(key2, cconfs, makefn(key2)).root
				}),
			]);
		};

		const wideth = (content) => {
			return element("tr",
				element("th", {
					content : content,
					attrs   : {colSpan: 3},
				})
			);
		};

		const second = element("tbody", [
			element("tr", [
				element("th", "Level"),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2}, 
					content : this._level.root
				}),
			]),
			element("tr", [
				element("th", "Leadership"),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2}, 
					content : this._lp.root
				}),
			]),
			dual("Disc/Brav", "disc", "brav"),
			dual("Pres/Strc", "pres", "strc"),
			duals("Auto/Cap", "auto", "cap"),
			element("tr", [
				element("th", "Range"),
				element("td", {
					attrs   : {colSpan: 2},
					class   : ["center", "padded-cell"],
					content : [
						defsec("minrng", cconfs, makefn("minrng")).root,
						element("span", " - ", "computed"),
						defsec("maxrng", cconfs, makefn("maxrng")).root,
					],
				}),
			]),
			wideth(element("hr")),
			duals("Atk/Br", "atk", "br"),
			duals("EP/GCost", "ep", "gcost"),
			duals("GMt/GHit", "gmt", "ghit"),
			element("tr", [
				element("th", "GRange"),
				element("td", {
					attrs   : {colSpan: 2},
					class   : ["center", "padded-cell"],
					content : [
						defsec("gminrng", cconfs, makefn("gminrng")).root,
						element("span", " - ", "computed"),
						defsec("gmaxrng", cconfs, makefn("gmaxrng")).root,
					],
				}),
			]),
			wideth(element("hr")),
			element("tr", [
				element("th", "Rank"),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2}, 
					content : this._rank.root
				}),
			]),
			element("tr", [
				element("th", "Price"),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2},
					content : this._price.root,
				}),
			]),
		]);

		this._template = Battalion.get(Battalions.DEFAULT);
		this._adjutant = Adjutant.get(Adjutant.DEFAULT);

		this.root = element("div", [
			uniqueLabel("Battalion Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Template", this._select), element("br"),
			this._select, element("br"),

			uniqueLabel("Adjutant", this._aselect), element("br"),
			this._aselect, element("br"), element("br"),

			element("details", [
				element("summary", element("label", "Abilities")),
			]),

			element("details", [
				element("summary", element("label", "Statistics")),
				element("table", second, "battalion-table"),
			]),
		]);
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		this._name.value = value;

		const activeID = this.sheet.bb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.bb.category.elements.get(activeID);
		element.title = this.name;
	}

	get template() {
		return this._template;
	}

	set template(value) {

		this._template     = Battalion.get(value);
		this._select.value = value;

		this.refresh();

		const activeID = this.sheet.bb.category.getActive();
		if (activeID === null) return;

		const elemenn       = this.sheet.bb.category.elements.get(activeID);
		elemenn.description = this.body();
	}

	get adjutant() {
		return this._adjutant;
	}

	set adjutant(value) {
		this._adjutant = Adjutant.get(value);
		this.refresh();
	}

	get level() {
		return this._level.value;
	}

	get rank() {
		return this._rank.value;
	}

	refresh() {
		for (let stat in this.stats) {
			this.stats[stat].refresh();
		}
	}

	import(battalion) {

		this.name        = battalion.name;
		this.template    = battalion.template;

		for (let stat in battalion.statistics) {
			this.stats[stat].value = battalion.statistics[stat];
		}

		this.refresh();
	}

	export() {

		const stats = {};

		for (let stat in this.stats) {
			stats[stat] = this.stats[stat].value;
		}

		return {
			name        : this.name,
			template    : this.template.name,
			statistics  : stats,
		};
	}

	clear(preset) {

		this.name        = preset || Battalion.DEFAULT;
		this.template    = preset || Battalion.DEFAULT;

		for (let stat in this.stats) {
			this.stats[stat].value = 0;
		}
	}


	/* builtable display */

	getTitle(object) {
		return object.name;
	}

	getBody(object) {
		return element("span", object.template || object.description);
	}

	body() {
		return element("span", this._template.name);
	}
}

/* exported Battalions */
