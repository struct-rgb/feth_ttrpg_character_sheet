
/* global
	AttributeCell, ModWidget, TagSetWidget, Toggle, Version
	capitalize, delimit, element, tooltip, uniqueLabel, wrap
*/

/* global CategoryModel, MultiActiveCategory */

/* global Notebook */

/* global Action, Attribute, Feature, Item */

/* global RangeFinder */

/* global Requirements */

/* global Grade */

/* global Calculator */

/* global Tagger */

class ItemPreview {

	constructor(item) {
		this.item   = item;
		this.marker = this.item.marker;
		this.root   = element("div");

		const itemID = this.item.itemID;

		this.va = new RangeFinder(this.item, {draw: false});
		this.item.refresher.register(this.va, ["theme", "unit|size", `${itemID}|total|maxrng`, `${itemID}|total|minrng`]);
		this._pregroup = null;

		this.item.refresher.register(this,
			Array.from(this.item.sheet.compiler.variables(
				/item\|total\|.*/
			)).map(f => f.called).concat([
				`${itemID}|rank`, `${itemID}|price`, `${itemID}|preview`
			])
		);
	}

	// static TIMES = 0;

	generate(dead=false) {

		// console.log(ItemPreview.TIMES++);
		
		const itemID = this.item.itemID;

		let   star  = undefined;
		const sheet = this.item.sheet;

		function span(...args) {
			return element("span", args);
		}
		
		const mods  = [];
		const env   =  new Calculator.Env(
			Calculator.Env.RUNTIME, sheet.definez
		);

		const uimod = (name, sign=false, dead=false) => {

			const dyn = env.read(`${itemID}|dynamic|${name}`);

			/* it it's a number just give a static html */
			if (!dyn) {

				const num = env.read(`${itemID}|total|${name}`);

				/* we don't care to display these */
				if (num == 0) return 0;

				return element("span", {
					class   : ["computed"],
					content : [(sign && num >= 0) ? "+" : "", String(num)],
				});
			}

			const variable = `${itemID}|total|${name}`;

			/* made a modifier expression for this value */
			const modifier = sheet.compiler.compile(variable);

			/* handle an expression by returning a ModWidget */
			const widget = new ModWidget(modifier, sign, !dead);

			/* throw it in the refresher */
			// this.item.refresher.register(widget, [variable]);

			return widget.root;
		};

		if ((star = this.item._price._trigger(this.item.price))) {
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

		for (let key in this.item.stats) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			/* items shouldn't modify this */
			if (key == "doubles" || key == "doubled") {
				continue;
			}

			if ((star = uimod(key, true, dead))) {
				mods.push(span(capitalize(key), ":\xA0", star));
			}
		}

		const min = env.read(`${itemID}|total|minrng`);
		const max = env.read(`${itemID}|total|maxrng`);

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

		const rank  = this.item._rank._trigger(this.item.rank);
		const attrs = Array.from(this.item.attributes.getActive());

		let link = undefined;

		try {
			link = this.marker.toLinks(this.item.fullInfo(), dead);
		} catch (error) {
			console.log(error);
			return element("div", [
				element("dt", "Error Parsing Custom Description"),
				element("dd", String(error)),
			]);
		}

		const predicate = (
			this.item.template.type
				? `${this.item.template.type} ${rank}`
				: "None"
		);

		const dd = element("dd", [
			delimit(" ", mods), mods.length ? element("br") : "",
			...(this.item.aoe && !this.item.tagged("equipment")
				? [this.va.root, element("br")]
				: []),
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
				Requirements.toDOM(
					this.marker,
					sheet.predicator.compile(predicate),
					dead
				)
			)
		]);

		const dt = element("dt", [
			this.item.name, " (", this.item.template.type, " ", rank, ")"
		]);

		return element("div", [dt, dd]);
	}

	refresh() {
		if (this.root.hasChildNodes()) {
			this.root.lastChild.remove();
		}

		if (this._pregroup) this.item.refresher.delete(this._pregroup);
		this._pregroup = this.item.refresher.createGroup();
		this.root.appendChild(this.generate());
	}

}

class Items {

	constructor(sheet, options={}) {

		this.itemID   = options.itemID   ?? "item";
		this.readonly = options.readonly ?? false;

		const itemID  = this.itemID;

		this.root            = document.createElement("div");
		this.sheet           = sheet;
		this.refresher       = this.sheet.refresher;
		this.marker          = this.sheet.marker;
		this.showRangeFinder = true;
		// this._pregroup = null;

		this.equipment  = null;

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text",
				value    : Item.DEFAULT,
				onchange : (() => {
					this.sheet.wb.setTitle(this.uuid, this.name);
					this.refresher.refresh(`${itemID}|preview`);
				}),
			},
		});

		this.editor   = element("div");

		this.notebook = new Notebook(this.editor);

		this._sf = Item.select(() => {
			this.template = this._select.value;
			this.refresh();
		}, this.refresher);

		this._select = this._sf._select;

		this._template = Item.get(Item.DEFAULT);

		const model = new CategoryModel(
			Attribute.kind,
			Attribute.byName,
			((feature) => feature.title()),
			((feature) => feature.body()),
			((feature) => feature.dependancies)
		);

		this.attributes = new MultiActiveCategory(model, {
			empty        : "Item has no attributes",
			selectable   : true,
			reorderable  : true,
			removable    : true,
			hideable     : true,
			addActive    : true,
			ontoggle     : ((category, key) => {
				category.toggleActive(key);
				// this.refresh();
				const feature = category.model.get(key);
				this.refresher.refresh(feature.affects);
			}),
			onremove     : ((category, key) => {
				const wasActive = category.isActive(key);
				category.delete(key);

				if (wasActive) {
					const feature = category.model.get(key);
					this.refresher.refresh(feature.affects);
				}
			}),
			select       : Attribute.select()
		});

		this._description = element("textarea", {
			class   : ["simple-border"],
			content : "",
			attrs   : {
				placeholder : "Write any additional information here...",
				onchange    : (() => this.refresh()),
			}
		});

		this._preview = new ItemPreview(this);

		this.stats = {};

		const lconf = {edit: true, root: "span", value: 0, shown: "0",  min: -100, max: +100, after : ","};
		const cconf = {edit: true, root: "span", value: 0, shown: "0",  min: -100, max: +100};

		const makefn = (name) => {

			const variable = `${itemID}|total|${name}`;

			const baseFunction = new Calculator.Env(
				Calculator.Env.RUNTIME, this.sheet.definez
			).func(variable);

			return ((base) => {
				this.refresher.refresh(variable);
				return baseFunction();
			});
		};

		const defsec = (key, config, fn) => {
			const cell       = new AttributeCell(config, fn);
			this.stats[key] = cell;

			const variable = `${itemID}|total|${key}`;

			const dependancies = this.sheet.compiler.dependancies(variable);
			this.refresher.register(cell, dependancies);
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

		{
			const refreshes = `${itemID}|rank`;

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

					this.refresher.refresh(refreshes);
					return Grade.fromNumber(Math.max(Math.min(sum, 12), 0));
				}),
			});
		}

		{
			const refreshes = `${itemID}|price`;

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

					this.refresher.refresh(refreshes);
					return sum;
				}),
			});
		}

		{
			const name = `${itemID}|total|mttype`;

			const baseFunction = new Calculator.Env(
				Calculator.Env.RUNTIME, this.sheet.definez
			).func(name);

			const refreshes = "unit|total|mttype";

			this._base = new AttributeCell({
				edit    : true,
				value   : 0,
				shown   : "ELSE",
				min     : Action.MTTYPE.min,
				max     : Action.MTTYPE.max,
				step    : 1,
				root    : "span",
				trigger : ((base) => {
					const value = baseFunction();
					const text  = Action.MTTYPE.asString(value);
					this.refresher.refresh(refreshes);
					return text.toUpperCase();
				}),
			});
		}

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

		/* I won't allow these to be added to items so they can rot here */
		this._WeIgHt = dual("Doubles/Doubled", "doubles", "doubled");
		/* --------------------------------------------------------------- */

		this._adder   = new Tagger(this._description, this.marker.context, () => this.refresh());
		this._replace = new Toggle("Replace original?", false, () => {
			this.refresher.refresh(`${itemID}|preview`);
		});

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

		this.notebook.add("Information", element("div", [
			uniqueLabel("Item Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Template", this._select), element("br"),
			this._sf.root, element("br"),

			uniqueLabel("Description", this._description), element("br"),
			this._adder.root,
			this._description,
			tooltip(this._replace.root, [
				"If checked, replaces the template item's original ",
				"description. If not, appends the custom description to ",
				"the end of the template item's original description."
			].join("")),


			tooltip(this._refr, [
				"Refresh the item preview."
			].join("")),
		]));

		this.notebook.add("Attributes", this.attributes.root);

		this.notebook.add("Stats",
			element("table", second, "battalion-table")
		);

		this.notebook.add("Tags", element("div", [
			this._template_tags.root, this._custom_tags.root,
			element("p", wrap(
				"You can add the following tags in order to change how ",
				"this item generates macros:",
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
		]));

		this.notebook.active = "Information";

		this.summaryText = document.createTextNode("Customize Item");

		this.root = element("div", [

			element("details", [

				element("summary",
					element("label", this.summaryText, "underline", "bold")
				),

				this.notebook.root,
			]),

			element("br"),

			this._preview.root,

		], "center-pane");
	}

	fullInfo() {
		return (
			this._replace.checked
				? this.information
				: (
					this._template.description + (
						this.information
							? ` ${this.information}`
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
		this.sheet.wb.setTitle(this.uuid, this.name);
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

		this._template = Item.get(value);
		this._sf.value = value;

		this.refresh();

		this.sheet.wb.setBody(this.uuid, value);

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

	get replaceInfo() {
		return this._replace.checked;
	}

	set replaceInfo(value) {
		this._replace.checked = value;
	}

	modifier(name) {

		if (name == "size") return this.sheet.runenv.read("unit|size");

		const variable = `${this.itemID}|total|${name}`;
		if (!(variable in this.sheet.definez)) return 0;

		const env   =  new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		);

		return env.read(variable);
	}

	refresh() {
		this._rank.refresh();
		this._price.refresh();

		for (let stat in this.stats) {
			this.stats[stat].refresh();
		}

		this.refresher.refresh(`${this.itemID}|preview`);
	}

	import(item) {

		this.refresher.wait();

		this.name        = item.name        || Item.DEFAULT;
		this.rank        = item.rank        || 0;
		this.mttype      = item.mttype      || 0;
		this.price       = item.price       || 0;
		this.replaceInfo = item.replace     || false;
		this.template    = item.template    || Item.DEFAULT;
		this.information = item.description || "";
		this.attributes.setState(item.attributes);

		for (let stat in item.modifiers) {
			
			/* guard against malformed input */
			if (!(stat in this.stats)) continue;

			this.stats[stat].value = item.modifiers[stat];
		}

		if (item.tags instanceof Array) {
			this._custom_tags.clear();
			for (let tag of item.tags) {
				this._custom_tags.add(tag);
			}
		}

		this.refresh();
		this.refresher.signal();
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
			replace     : this.replaceInfo,
			tags        : Array.from(this._custom_tags.keys())
		};
	}

	clear(preset) {

		this.refresher.wait();

		for (let stat in this.stats) {
			this.stats[stat].value = 0;
		}

		this.attributes.clear();
		this.replaceInfo = false;
		this.information = "";
		this.rank        = 0;
		this.price       = 0;
		this.name        = preset || Item.DEFAULT; // TODO investigate
		this.template    = preset || Item.DEFAULT;
		this._custom_tags.clear();
		this._base.value = 0;

		this.refresher.signal();
	}

	/* buildable display */

	getTitle(object=this) {
		return object.name;
	}

	getBody(object=this) {
		return element("span", object.template || object.description);
	}

	body() {
		return element("span", this._template.name);
	}

	/* blurb display */

	get aoe() {
		return this.template.aoe;
	}


	blurb() {

		const itemID = this.itemID;

		let star = undefined;

		function d(condition) {
			return condition ? "*" : "";
		}

		const mods = [];
		const env  = new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		);

		if ((star = this._price._trigger(this.price))) {
			mods.push(`${star}G`);
		}

		if ((star = env.read(`${itemID}|dynamic|tpcost`))) {
			mods.push([env.read(`${itemID}|total|tpcost`), "TP", star]);
		}

		if ((star = env.read(`${itemID}|dynamic|spcost`))) {
			mods.push([env.read(`${itemID}|total|spcost`), "SP", star]);
		}

		for (let key in this.stats) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			/* items shouldn't modify this */
			if (key == "doubles" || key == "doubled") {
				continue;
			}

			const value = env.read(`${itemID}|total|${key}`);
			const isdyn = env.read(`${itemID}|dynamic|${key}`);

			if (!isdyn && value == 0) continue;

			const mark  = d(isdyn);

			mods.push(`${capitalize(key)}:\xA0${value}${mark}`);
		}

		const min  = env.read(`${itemID}|total|minrng`);
		const max  = env.read(`${itemID}|total|maxrng`);
		const mind = d(env.read(`${itemID}|dynamic|minrng`));
		const maxd = d(env.read(`${itemID}|dynamic|maxrng`));

		if (min != max) {
			mods.push("Range:\xA0", min, mind, "\xA0-\xA0", max, maxd);
		} else if (min != 0) {
			mods.push("Range:\xA0", max, (mind || maxd));
		}

		if ((star = d(env.read(`${itemID}|dynamic|tp`)))) {
			mods.push("Max TP:\xA0", env.read(`${itemID}|total|tp`), star);
		}

		if ((star = d(env.read(`${itemID}|dynamic|sp`)))) {
			mods.push("Max SP:\xA0", env.read(`${itemID}|total|sp`), star);
		}

		const set  = new Set();
		const rank = this._rank._trigger(this.rank);

		return [
			this.name, " (", this.template.type, " ", rank, ")", "\n",
			mods.join(" "), mods.length ? "\n" : "",
			this.marker.toText([this.name, this.fullInfo()], {seen: set}), "\n",
			Array.from(this.attributes.getActive())
				.filter(a => !set.has(a))
				.map(a => this.marker.toText(Attribute.get(a), {seen: set, named: true}))
				.map(t => t.replace(/\s+/g, " "))
				.join("\n"),
			"Usage Requirements\n",
			"  * ", this.template.type, " ", rank
		].join("");
	}

	html() {

		let star = undefined;
		const itemID = this.itemID;

		function d(condition) {
			return condition ? "*" : "";
		}

		const mods = [];
		const env  = new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		);

		if ((star = this._price._trigger(this.price))) {
			mods.push(`${star}G`);
		}

		if ((star = env.read(`${itemID}|dynamic|tpcost`))) {
			mods.push([env.read(`${itemID}|total|tpcost`), "TP", star]);
		}

		if ((star = env.read(`${itemID}|dynamic|spcost`))) {
			mods.push([env.read(`${itemID}|total|spcost`), "SP", star]);
		}

		for (let key in this.stats) {

			if (Feature.MODEXCLUDE.has(key)) {
				continue;
			}

			/* items shouldn't modify this */
			if (key == "doubles" || key == "doubled") {
				continue;
			}

			const value = env.read(`${itemID}|total|${key}`);
			const isdyn = env.read(`${itemID}|dynamic|${key}`);

			if (!isdyn && value == 0) continue;

			const mark  = d(isdyn);

			mods.push(`${capitalize(key)}:&nbsp;${value}${mark}`);
		}

		const min  = env.read(`${itemID}|total|minrng`);
		const max  = env.read(`${itemID}|total|maxrng`);
		const mind = d(env.read(`${itemID}|dynamic|minrng`));
		const maxd = d(env.read(`${itemID}|dynamic|maxrng`));

		if (min != max) {
			mods.push("Range:&nbsp;", min, mind, "&nbsp;-&nbsp;", max, maxd);
		} else if (min != 0) {
			mods.push("Range:&nbsp;", max, (mind || maxd));
		}

		if ((star = d(env.read(`${itemID}|dynamic|tp`)))) {
			mods.push("Max TP:&nbsp;", env.read(`${itemID}|total|tp`), star);
		}

		if ((star = d(env.read(`${itemID}|dynamic|sp`)))) {
			mods.push("Max SP:&nbsp;", env.read(`${itemID}|total|sp`), star);
		}

		const set  = new Set();
		const rank = this._rank._trigger(this.rank);

		return [
			"<b>",
			this.name, " (", this.template.type, " ", rank, ")", "<br />",
			"</b><br />",
			mods.join(" "), mods.length ? "<br />" : "",
			this.marker.toHTML([this.name, this.fullInfo()], {seen: set}), "<br />",
			Array.from(this.attributes.getActive())
				.filter(a => !set.has(a))
				.map(a => this.marker.toHTML(Attribute.get(a), {set, named: true}))
				.map(t => t.replace(/\s+/g, " "))
				.join("<br />"),
			"\n<b>Usage Requirements</b><br />\n",
			"<ul>",
			"<li>", this.template.type, " ", rank, "</li>",
			"</ul>",
		].join("");
	}


	getFlavor() {

		let flavor = null;

		for (let each of this.attributes) {
			if (each.flavor != null) return flavor;
		}

	}
}

/* exported Items */
