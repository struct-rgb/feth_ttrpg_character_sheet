
/* global element */
/* global AttributeCell */
/* global uniqueLabel */
/* global tooltip */
/* global Version */
/* global Toggle */
/* global hitip */
/* global TagSetWidget */
/* global ModWidget */
/* global capitalize */
/* global delimit */
/* global wrap */

/* global CategoryModel */
/* global MultiActiveCategory */

/* global Feature */
/* global Weapon */
/* global Attribute */
/* global AttackFeature */

/* global Grade */

/* global Expression */

class Weapons {

	constructor(sheet) {
		this.root  = document.createElement("div");
		this.sheet = sheet;

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text", 
				value    : Weapon.DEFAULT,
				onchange : (() => {
					const activeID = this.sheet.wb.category.getActive();
					if (activeID === null) return;

					const element = this.sheet.wb.category.elements.get(activeID);
					element.title       = this.name;
					element.description = this.body();
				}),
			},
		});

		this._sf = Weapon.select(() => {
			this.template = this._select.value;
			this.refresh();
		});

		this._inInventory = new Toggle("In Inventory?", false, () => {
			const activeID = this.sheet.wb.category.getActive();
			if (activeID === null) return;

			const element = this.sheet.wb.category.elements.get(activeID);
			element.description = this.body();
		});

		this._select = this._sf._select;

		this._template = Weapon.get(Weapon.DEFAULT);

		const model = new CategoryModel(
			Attribute.kind,
			Attribute.byName,
			((feature) => feature.title()),
			((feature) => feature.body()),
			((feature) => feature.dependancies)
		);

		this.attributes = new MultiActiveCategory(model, {
			name        : "themes",
			empty       : "Weapon has no attributes",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			addActive   : true,
			ontoggle    : ((category, key) => {
				category.toggleActive(key);
				this.refresh();
			}),
			onremove    : ((category, key) => {
				const wasActive = category.isActive(key);
				category.delete(key);

				if (wasActive) this.refresh();
			}),
			select      : Attribute.select(),
		});

		this._description = element("textarea", {
			class   : ["simple-border"],
			content : "",
			attrs   : {
				placeholder : "Write any additional information here...",
				onchange    : (() => this.refresh()),
			}
		});

		this._preview = element("div");

		this.stats = {};

		const lconf = {edit: true, root: "span", value: 0, shown: "0",  min: -100, max: +100, after : ","};
		const cconf = {edit: true, root: "span", value: 0, shown: "0",  min: -100, max: +100};

		const makefn = (name) => {
			const baseFunction = new Expression.Env(
				Expression.Env.RUNTIME, this.sheet.definez
			).func(`weapon|total|${name}`);

			return ((base) => {
				this.sheet.stats.refreshSecondary();
				return baseFunction();
			});
		};

		const defsec = (key, config, fn) => {
			const cell      = new AttributeCell(config, fn);
			this.stats[key] = cell;
			return cell;
		};

		const wide   = (title, key, trig) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2},
					content : defsec(key, cconf, trig).root,
				}),
			]);
		};

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

		this._rank  = new AttributeCell({
			edit    : true,
			value   : 0,
			shown   : "E",
			min     : -11,
			max     : 11,
			root    : "span",
			trigger : ((base) => {

				let sum = base + Grade.toNumber(this.template.rank);

				for (let attribute of this.attributes.getActive()) {
					sum += Attribute.get(attribute).rank;
				}

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

				for (let attribute of this.attributes.getActive()) {
					sum += Attribute.get(attribute).price;
				}

				return sum;
			}),
		});

		this._base = new AttributeCell({
			edit    : true,
			value   : 0,
			shown   : "ELSE",
			min     : AttackFeature.MTTYPE.min,
			max     : AttackFeature.MTTYPE.max,
			step    : 1,
			root    : "span",
			trigger : ((base) => {
				const value = baseFunction();
				const text  = AttackFeature.MTTYPE.asString(value);
				this.sheet.stats.refreshSecondary();
				return text.toUpperCase();
			}),
		});

		const baseFunction = new Expression.Env(
			Expression.Env.RUNTIME, this.sheet.definez
		).func("weapon|total|mttype");

		const second = element("tbody", [
			wide("Might", "mt", makefn("mt")),
			element("tr", [
				element("th", "Based on"),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2},
					content : this._base.root,
				}),
			]),
			dual("Prot/Resl", "prot", "resl"),
			dual("Hit/Avo", "hit", "avo"),
			dual("Crit/Avo", "crit", "cravo"),
			dual("SP/TP", "sp", "tp"),
			dual("Costs", "spcost", "tpcost"),
			element("tr", [
				element("th", "Range"),
				element("td", {
					attrs   : {colSpan: 2},
					class   : ["center", "padded-cell"],
					content : [
						defsec("minrng", cconf, makefn("minrng")).root,
						element("span", " - ", "datum"),
						defsec("maxrng", cconf, makefn("maxrng")).root,
					],
				}),
			]),
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

		/* I won't allow these to be added to weapons so they can rot here */
		this._WeIgHt = dual("Doubles/Doubled", "doubles", "doubled");
		/* --------------------------------------------------------------- */

		this._adder   = new hitip.Adder(this._description, () => this.refresh());
		this._replace = new Toggle("Replace original?", false, () => {});

		this._refr    = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Refresh",
				onclick : (() => this.refresh()),
			}
		});

		const delrefr = () =>  this.refresh();
		this._template_tags = new TagSetWidget("Template", delrefr, true);
		this._custom_tags   = new TagSetWidget("Custom", delrefr, true);

		const defs = (...args) => {
			if (args.length % 2 > 0) {
				throw new Error("definitions list must have even lenth");
			}

			const dl = element("dl");

			for (let i = 0; i < args.length; ++i) {
				const tag    = args[i]; 
				const button = element("input", {
					class : ["simple-border"],
					attrs : {
						value   : tag,
						type    : "button",
						onclick : (() => {
							this._custom_tags.add(tag);
							this.refresh();
						})
					}
				});

				dl.appendChild(element("dt", button));
				++i;
				dl.appendChild(element("dd", args[i]));
			}

			return dl;
		};

		this.root = element("div", [
			uniqueLabel("Spell or Weapon Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Template", this._select), element("br"),
			this._sf.root, element("br"), element("br"),

			this._preview,

			tooltip(this._refr, [
				"Refresh the weapon preview."
			].join("")),

			tooltip(this._inInventory.root, [
				"This only really affects what gets put into the blurb for ",
				"now, but in the future it might affect weapons with ",
				"attributes that give you penalties for holding them."
			].join("")),

			element("br"), 
			element("br"), 

			element("details", [
				element("summary", element("label", "Attributes")),
				this.attributes.root,
			]),

			element("details", [
				element("summary", element("label", "Customize Description")),
				this._adder.root,
				this._description,
				tooltip(this._replace.root, [
					"If checked, replaces the template weapon's original ",
					"description. If not, appends the custom description to ",
					"the end of the template weapon's original description."
				].join(""))
			]),

			element("details", [
				element("summary", element("label", "Customize Statistics")),
				element("table", second, "battalion-table"),
			]),

			element("details", [
				element("summary", element("label", "Customize Tags")),
				this._template_tags.root, this._custom_tags.root,
				element("p", wrap(
					"You can add the following tags in order to change how ",
					"this weapon generates macros:",
				)),
				defs(
					"healing",
					"Reduced macro might for healing calculation.",
					"no might",
					"Macro omits might calculation",
					"no hit",
					"Macro omits roll to hit.",
					"no crit",
					"Macro omits roll to crit.",
					"no stats",
					"Macro omits summary of unit's stats.",
					"no cost",
					"Macro omits TP and SP cost.",
					"no triangle",
					"Macro omits weapon triangle prompt.",
				)
			]),

		], "center-pane");
	}

	fullInfo() {
		return (
			this._replace.checked
				? this.information
				: (
					this._template.description + (
						this.information
							? " " + this.information
							: ""
					)
				)
		);
	}

	tagged(tag) {
		return this._custom_tags.has(tag) || this._template_tags.has(tag);
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		this._name.value = value;

		const activeID = this.sheet.wb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.wb.category.elements.get(activeID);
		element.title = this.name;
	}

	get description() {
		return this._template.name;
	}

	get information() {
		return this._description.value;
	}

	set information(value) {
		this._description.value = value;
	}

	get mttype() {
		return this._base.value;
	}

	set mttype(value) {
		this._base.value = value;
	}

	get template() {
		return this._template;
	}

	set template(value) {

		this._template     = Weapon.get(value);
		this._select.value = value;

		this.refresh();

		const activeID = this.sheet.wb.category.getActive();
		if (activeID === null) return;

		const elemenn       = this.sheet.wb.category.elements.get(activeID);
		elemenn.description = this.body();

		this._template_tags.clear();

		for (let tag of this.template.tags) {
			this._template_tags.add(tag, true);
		}
	}

	get price() {
		return this._price.value;
	}

	set price(value) {
		this._price.value = value;
	}

	get rank() {
		return this._rank.value;
	}

	set rank(value) {
		this._rank.value = value;
	}

	get inInventory() {
		return this._inInventory.checked;
	}

	set inInventory(value) {
		this._inInventory.checked = value;

		const activeID = this.sheet.wb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.wb.category.elements.get(activeID);
		element.description = this.body();
	}

	get replaceInfo() {
		return this._replace.checked;
	}

	set replaceInfo(value) {
		this._replace.checked = value;
	}

	refresh() {
		this._rank.refresh();
		this._price.refresh();

		for (let stat in this.stats) {
			this.stats[stat].refresh();
		}

		if (this._preview.hasChildNodes()) {
			this._preview.lastChild.remove();
		}

		this._preview.appendChild(this.preview());
	}

	import(weapon) {

		this.name        = weapon.name        || Weapon.DEFAULT;
		this.rank        = weapon.rank        || 0;
		this.mttype      = weapon.mttype      || 0;
		this.price       = weapon.price       || 0;
		this.inInventory = weapon.inventory   || false;
		this.replaceInfo = weapon.replace     || false;
		this.template    = weapon.template    || Weapon.DEFAULT;
		this.information = weapon.description || "";
		this.attributes.setState(weapon.attributes);

		for (let stat in weapon.modifiers) {
			
			/* guard against malformed input */
			if (!(stat in this.stats)) continue;

			this.stats[stat].value = weapon.modifiers[stat];
		}

		if (weapon.tags instanceof Array) {
			this._custom_tags.clear();
			for (let tag of weapon.tags) {
				this._custom_tags.add(tag);
			}
		}

		this.refresh();
	}

	export() {

		const stats = {};

		for (let stat in this.stats) {
			stats[stat] = this.stats[stat].value;
		}

		return {
			version     : Version.CURRENT.toString(),
			name        : this.name,
			rank        : this.rank,
			mttype      : this.mttype,
			price       : this.price,
			template    : this.template.name,
			attributes  : this.attributes.getState(),
			modifiers   : stats,
			description : this.information,
			inventory   : this.inInventory,
			replace     : this.replaceInfo,
			tags        : Array.from(this._custom_tags.keys())
		};
	}

	clear(preset) {


		for (let stat in this.stats) {
			this.stats[stat].value = 0;
		}

		this.attributes.clear();
		this.inInventory = false;
		this.replaceInfo = false;
		this.information = "";
		this.rank        = 0;
		this.price       = 0;
		this.name        = preset || Weapon.DEFAULT;
		this.template    = preset || Weapon.DEFAULT;
		this._custom_tags.clear();
	}

	/* builtable display */

	getTitle(object) {
		return object.name;
	}

	getBody(object) {
		return element("span", [
			object.template || object.description,
			object.inventory
				? element("em", " (Inventory)", "punctuation")
				: ""
		]);
	}

	body() {
		return element("span", [
			this._template.name,
			this.inInventory
				? element("em", " (Inventory)", "punctuation")
				: ""
		]);
	}

	/* blurb display */

	preview(dead=false) {

		let   star  = undefined;
		const sheet = this.sheet;

		function span(...args) {
			return element("span", args);
		}
		
		const mods  = [];
		const env   =  new Expression.Env(
			Expression.Env.RUNTIME, sheet.definez
		);

		function uimod(name, sign=false, dead=false) {

			const dyn = env.read(`weapon|dynamic|${name}`);

			/* it it's a number just give a static html */
			if (!dyn) {

				const num = env.read(`weapon|total|${name}`);

				/* we don't care to display these */
				if (num == 0) return 0;

				return element("span", {
					class   : ["computed"],
					content : [(sign && num >= 0) ? "+" : "", String(num)],
				});
			}

			/* made a modifier expression for this value */
			const modifier = sheet.compiler.compile(`weapon|total|${name}`);

			/* handle an expression by returning a ModWidget */
			return (new ModWidget(modifier, sign, !dead)).root;
		}

		if ((star = this._price._trigger(this.price))) {
			mods.push([
				element("span", star, "computed"),
				element( "sub",  "G", "computed"),
			]);
		}

		if ((star = uimod("tpcost", false, dead))) {
			mods.push([star, element("sub", "TP", "computed")]);
		}

		if ((star = uimod("spcost", false, dead))) {
			mods.push([star, element("sub", "SP", "computed")]);
		}

		for (let key in this.stats) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			/* weapons shouldn't modify this */
			if (key == "doubles" || key == "doubled") {
				continue;
			}

			if ((star = uimod(key, true, dead))) {
				mods.push(span(capitalize(key), ":\xA0", star));
			}
		}

		const min = env.read("weapon|total|minrng");
		const max = env.read("weapon|total|maxrng");

		if (min != max) {
			const min = uimod("minrng", false, dead);
			const max = uimod("maxrng", false, dead);
			mods.push(span("Range:\xA0", min, "\xA0-\xA0", max));
		} else if (min != 0) {
			mods.push(span("Range:\xA0", uimod("maxrng", false, dead)));
		}

		if ((star = uimod("tp", false, dead))) {
			mods.push(span("Max TP:\xA0", star));
		}

		if ((star = uimod("sp", false, dead))) {
			mods.push(span("Max SP:\xA0", star));
		}

		const rank  = this._rank._trigger(this.rank);
		const attrs = Array.from(this.attributes.getActive());

		let link = undefined;

		try {
			link = hitip.link(this.fullInfo());
		} catch (error) {
			console.log(error);
			return element("div", [
				element("dt", "Error Parsing Custom Description"),
				element("dd", String(error)),
			]);
		}

		const predicate = (
			this.template.type
				? `${this.template.type} ${rank}`
				: "None"
		);

		const dd = element("dd", [
			delimit(" ", mods), mods.length ? element("br") : "",
			link,
			attrs.length ? element("div", [
				element("strong", "Attributes"),
				element("ul",
					attrs.map(a => element("li",
						tooltip(
							element("span", Attribute.get(a).name, "datum"),
							Attribute.get(a).body(true)
						)
					))
				)
			]) : "",
			element("div",
				hitip.toul(this.sheet.predicator.compile(predicate), dead)
			)
		]);

		const dt = element("dt", [
			this.name, " (", this.template.type, " ", rank, ")"
		]);

		return element("div", [dt, dd]);
	}

	blurb() {

		let star = undefined;

		function d(condition) {
			return condition ? "*" : "";
		}

		const mods = [];
		const env  = new Expression.Env(
			Expression.Env.RUNTIME, sheet.definez
		);

		if ((star = this._price._trigger(this.price))) {
			mods.push(`${star}G`);
		}

		if ((star = env.read("weapon|dynamic|tpcost"))) {
			mods.push([env.read("weapon|total|tpcost"), "TP", star]);
		}

		if ((star = env.read("weapon|dynamic|spcost"))) {
			mods.push([env.read("weapon|total|spcost"), "SP", star]);
		}

		for (let key in this.stats) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			/* weapons shouldn't modify this */
			if (key == "doubles" || key == "doubled") {
				continue;
			}

			const value = env.read(`weapon|total|${key}`);
			const isdyn = env.read(`weapon|dynamic|${key}`);

			if (!isdyn && value == 0) continue;

			const mark  = d(isdyn);

			mods.push(`${capitalize(key)}:\xA0${value}${mark}`);
		}

		const min  = env.read("weapon|total|minrng");
		const max  = env.read("weapon|total|maxrng");
		const mind = d(env.read("weapon|dynamic|minrng"));
		const maxd = d(env.read("weapon|dynamic|maxrng"));

		if (min != max) {
			mods.push("Range:\xA0", min, mind, "\xA0-\xA0", max, maxd);
		} else if (min != 0) {
			mods.push("Range:\xA0", max, (mind || maxd));
		}

		if ((star = d(env.read("weapon|dynamic|tp")))) {
			mods.push("Max TP:\xA0", env.read("weapon|total|tp"), star);
		}

		if ((star = d(env.read("weapon|dynamic|sp")))) {
			mods.push("Max SP:\xA0", env.read("weapon|total|sp"), star);
		}

		const set  = new Set();
		const rank = this._rank._trigger(this.rank);

		return [
			this.name, " (", this.template.type, " ", rank, ")", "\n",
			mods.join(" "), mods.length ? "\n" : "",
			hitip.text([this.name, this.fullInfo()], set), "\n",
			Array.from(this.attributes.getActive())
				.map(a => hitip.text(Attribute.get(a), set, true, true))
				.map(t => t.replace(/\s+/g, " "))
				.join("\n"),
			"\nUsage Requirements\n",
			"  * ", this.template.type, " ", rank
		].join("");
	}

}

/* exported Weapons */