

/* global Adjutant, Battalion, Gambit */

/* global CategoryModel, MultiActiveCategory */

/* global Calculator */

/* global
   AttributeCell, Grade, Toggle, VariableTable, Version
   capitalize, delimit, element, uniqueLabel, tooltip, wrap
 */

/* global Requirements */
/* global Markup */
/* global Tagger */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */

class BattalionPreview {

	constructor(battalion) {
		this.battalion  = battalion;
		this.marker     = this.battalion.marker;
		this.root       = element("div");
		this._pregroup  = null;

		this.battalion.refresher.register(this,
			Array.from(this.battalion.sheet.compiler.variables(
				/battalion\|total\|.*/
			)).map(f => f.called).concat([
				"gambits"
			])
		);
	}

	generate(dead=false) {

		const sheet = this.battalion.sheet;

		const mods  = [];

		const rank  = this.battalion._rank._trigger(this.battalion.rank);
		const attrs = Array.from(this.battalion.gambits.names());

		let link = undefined;

		try {
			link = this.marker.toLinks(this.battalion.fullInfo(), dead);
		} catch (error) {
			console.log(error);
			return element("div", [
				element("dt", "Error Parsing Custom Description"),
				element("dd", String(error)),
			]);
		}

		const predicate = `Authority ${rank}`;

		const dd = element("dd", [
			this.marker.toLinks(
				`(With @{adjutant}{${this.battalion.adjutant.name}})\xA0`,
				dead
			),
			delimit(" ", mods), mods.length ? element("br") : "",
			link,
			attrs.length ? element("div", [
				element("strong", "Gambits"),
				element("ul",
					attrs.map(a => element("li",
						tooltip(
							element("span", Gambit.get(a).name, "datum"),
							Gambit.get(a).body(true)
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
			this.battalion.name, " (Authority ", rank, ")"
		]);

		return element("div", [dt, dd]);
	}

	refresh() {
		if (this.root.hasChildNodes()) {
			this.root.lastChild.remove();
		}

		if (this._pregroup) this.battalion.refresher.delete(this._pregroup);
		this._pregroup = this.battalion.refresher.createGroup();
		this.root.appendChild(this.generate());
	}

}

class Battalions {
	
	constructor(sheet) {

		this.sheet  = sheet;
		this.marker = this.sheet.marker;

		this.stats  = {
			leads  : {},
			first  : {},
			second : {},
			growth : {},
		};

		this.refresher = sheet.refresher;
		this._preview  = new BattalionPreview(this);

		const sf = new VariableTable(sheet.refresher, sheet.definez, this.stats.first,  4);
		const ss = new VariableTable(sheet.refresher, sheet.definez, this.stats.second, 4);

		this._name = element("input", {
			class : ["simple-border"],
			attrs : {
				type     : "text", 
				value    : "Blank Battalion",
				onchange : (() => {
					const activeID = this.sheet.bb.category.getActive();
					if (activeID === null) return;

					const element = this.sheet.bb.category.element(activeID);
					element.title = this.name;

					this.refresher.refresh("gambits");
				}),
			},
		});

		this._replace = new Toggle("Replace original?", false, () => {
			this.refresher.refresh("gambits");
		});

		this._refr    = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Refresh",
				onclick : (() => this.refresh()),
			}
		});

		this._description = element("textarea", {
			class   : ["simple-border"],
			content : "",
			attrs   : {
				placeholder : "Write any additional information here...",
				onchange    : (() => this.refresh()),
			}
		});

		this._adder = new Tagger(
			this._description, this.marker.context, () => this.refresh()
		);

		this._select = element("select", {
			class: ["simple-border"],
			attrs: {
				value   : Battalion.DEFAULT,
				oninput : (() => {
					this.template = this._select.value;
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

		const model = new CategoryModel(
			Gambit.kind,
			Gambit.byName,
			((feature) => feature.title()),
			((feature, refresher) => feature.body(false, refresher)),
			((feature) => feature.dependancies)
		);

		this.gambits = new MultiActiveCategory(model, {
			name        : "gambit",
			empty       : "This battalion has not been trained.",
			selectable  : true,
			reorderable : true,
			removable   : true,
			hideable    : true,
			addActive   : true,
			ontoggle    : ((category, key) => {

				const gambit = Gambit.get(key);

				if (!gambit.tagged("structure")) {
					for (let each of category.active) {
						if (each == key) continue;
						const tag = !Gambit.get(each).tagged("structure");
						if (tag) category.toggleActive(each);
					}
				}
				category.toggleActive(key);

				this.refresher.refresh(gambit.affects);
			}),
			onremove    : ((category, key) => {
				category.delete(key);

				const feature = Gambit.get(key);
				this.refresher.refresh(feature.affects);
			}),
			// onadd       : ((category, key) => {

			// 	const feature = category.get(key);

			// 	if (feature.tagged("structure"))
			// 		return category.setGroupFor(key, "structure");

			// 	if (feature.tagged("measured"))
			// 		return category.setGroupFor(key, "measured");

			// 	category.setGroupFor(key, "Other");
			// }),
			select         : Gambit.select(),
			refresher      : sheet.refresher,
			defaultGroup   : "gambit",
			groupShowTitle : capitalize,
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

				this.stats.first.cap.refresh();
				this.stats.first.contract.refresh();

				return Grade.fromNumber(Math.max(Math.min(sum, 12), 0));
			}),
		});

		const fn = ((base, variable) => {
			// this.refreshSecond();
			return variable();
		});

		const perc = ((base, variable) => {
			return `${variable()}%`;
		});

		const babcap = sf.span("Capacity", {
			var  : "battalion|total|cap",
			edit : false
		});

		const second = element("tbody", [
			sf.row(
				[
					tooltip("Level", wrap(
						"Multiplied by each stat's growths and then added to that ",
						"stat. TODO make this us the main sheet's level stat ",
						"instead of this custom box."
					)), "/",
					tooltip("Charm", wrap(
						"The higher of this unit’s employer’s Dex or Luc."
					))
				],
				{var: "battalion|level", call: fn, edit: false},
				{var: "battalion|total|cha", call: fn, edit: false}),
			sf.row(
				[
					tooltip("Auto", wrap(
						"Autonomy is the maximum distance battalion units may ",
						"be away from their employer."
					)), "/",
					tooltip("Plu", wrap(
						"Plurality is the maximum number of battalion units ",
						"that can be deployed at once. All deployed battalion ",
						"units share statistics along with a common pool ",
						"of Endurance."
					))
				],
				{var: "battalion|total|auto", edit: false},
				{var: "battalion|total|plu",  edit: false}),
			ss.row(
				tooltip("EP", wrap(
					"A battalion retreats for the rest of the battle when its ",
					"Endurance is reduced to zero."
				)),
				{var: "battalion|total|ep", edit: false, style: "space"},
				{var: "battalion|growth|end", edit: false, call: perc, style: "grow", obj: this.stats.growth}),
			sf.row(
				tooltip("Atk", wrap(
					"The amount of damage an attack does, before applying defenses."
				)),
				{var: "battalion|total|atk", call: fn, edit: false, style: "space"},
				{var: "battalion|growth|atk", edit: false, call: perc, style: "grow", obj: this.stats.growth}),
			sf.row(
				tooltip("Prot", wrap(
					"Decreases damage taken from physical attacks."
				)),
				{var: "battalion|total|prot", call: fn, edit: false, style: "space"},
				{var: "battalion|growth|prot", edit: false, call: perc,  style: "grow", obj: this.stats.growth}),
			sf.row(
				tooltip("Resl", wrap(
					"Decreases damage taken from magical attacks."
				)),
				{var: "battalion|total|resl", call: fn, edit: false, style: "space"},
				{var: "battalion|growth|resl", edit: false, call: perc, style: "grow", obj: this.stats.growth}),
			ss.wideth(element("hr")),
			ss.row(
				[
					tooltip("Mt", wrap(
						"Total Might of battalion's gambit."
					)), "/",
					tooltip("Hit", wrap(
						"Total Hit of battalion's gambit."
					))
				],
				{var: "battalion|total|mt",   edit: false},
				{var: "battalion|total|hit",  edit: false}),
			ss.row(
				tooltip("Cost", wrap(
					"Endurance cost for battalion's gambit."
				)),
				{var: "battalion|total|epcost", edit: false}),
			ss.row(
				tooltip("Range", wrap(
					"Minimum and maximum distance of battalion's gambit."
				)),
				ss.range(
					{var: "battalion|total|minrng", range: true, edit: false},
					{var: "battalion|total|maxrng", range: true, edit: false})),
			ss.wideth(element("hr")),
			sf.row(
				tooltip("Rank", wrap(
					"Increases Capacity and can be increased by one after a ",
					"battle in which this battaion was not defeated."
				)),
				this._rank),
			sf.row(
				tooltip("Contract Fee", wrap(
					"This battalion's initial hiring fee."
				)),
				{var: "battalion|total|contract", edit: false}),
		]);

		this._template = Battalion.get(Battalion.DEFAULT);
		this._adjutant = Adjutant.get(Adjutant.DEFAULT);

		this.canvas = element("canvas", {
			attrs: {width: 100, height: 100}
		});

		this.root = element("div", [
			uniqueLabel("Battalion Name", this._name), element("br"),
			this._name, element("br"),

			uniqueLabel("Template", this._select), element("br"),
			this._select, element("br"),

			uniqueLabel("Adjutant", this._aselect), element("br"),
			this._aselect, element("br"), element("br"),

			this._preview.root,

			tooltip(this._refr, [
				"Refresh the battalion preview."
			].join("")),

			element("br"),
			element("br"),

			element("details", [
				element("summary", element("label", "Statistics")),
				element("table", second, "battalion-table"),
			]),

			element("details", [
				element("summary", element("label", "Gambits")),
				babcap, this.gambits.root,
			]),

			element("details", [
				element("summary", element("label", "Customize Description")),
				this._adder.root,
				this._description,
				tooltip(this._replace.root, wrap(
					"If checked, replaces the template battalion's original ",
					"description. If not, appends the custom description to ",
					"the end of the template battalion's original description."
				)),
			]),

			this.canvas,
		]);
	}

	get name() {
		return this._name.value;
	}

	set name(value) {
		this._name.value = value;

		const activeID = this.sheet.bb.category.getActive();
		if (activeID === null) return;

		const element = this.sheet.bb.category.element(activeID);
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

		const elemenn       = this.sheet.bb.category.element(activeID);
		elemenn.description = this.body();
	}

	get adjutant() {
		return this._adjutant;
	}

	set adjutant(value) {

		/* adjutant gambits can't be removed during category iteration */
		let gambits = Array.from(this.gambits.values());
		let remove  = gambits.filter(x => x.tagged("adjutant"));
		for (let gambit of remove){
			if (this.gambits.active.has(gambit.name)) {
				this.gambits.toggleActive(gambit.name);
			}

			this.gambits.delete(gambit.name);
		}

		/* set the new adjutant for this battalion */
		this._adjutant = Adjutant.get(value);

		/* collect gambits that need to be added */
		let gambit = this._adjutant.gambit;
		gambits    = Array.from(this._adjutant.reactions);
		if (gambit) gambits.push(gambit.name);

		/* add each gambit and remove its delete button */
		for (let name of gambits) {
			this.gambits.add(name, {removable: false});

			const element = this.gambits.element(name);
			element.shiftForward(this.gambits.size);
			
			if (Gambit.get(name).tagged("structure")) {
				this.gambits.toggleActive(name);
			}
		}

		/* refresh the category */
		this.refresh();
	}

	get level() {
		return this.sheet.runenv.read("unit|level");
	}

	set level(value) {
		// this._level.value = value;
	}

	get rank() {
		return this._rank.value;
	}

	set rank(value) {
		this._rank.value = value;
	}

	getGambit() {

		for (let name of this.gambits.active) {
			const gambit = Gambit.get(name);
			if (!gambit.tagged("structure")) return gambit;
		}

		return Gambit.get("Counter");
	}

	clearGambit() {
		for (let gambit of this.gambits.getActiveValues()) {
			if (!gambit.tagged("structure"))
				this.gambits.toggleActive(gambit.name);
		}
	}

	toggleGambit(name) {

		const gambit = this.gambits.get(name);

		if (!gambit || gambit.tagged("structure")) return false;

		this.clearGambit();

		return this.gambits.toggleActive(name);
	}

	refreshFirst() {
		for (let stat in this.stats.first) {
			this.stats.first[stat].refresh();
		}
	}

	refreshSecond() {
		for (let stat in this.stats.second) {
			this.stats.second[stat].refresh();
		}
	}

	refreshGrowths() {
		for (let stat in this.stats.growth) {
			this.stats.growth[stat].refresh();
		}
	}

	refresh(key=true) {
		this.refreshFirst();
		this.refreshSecond();
		this.refreshGrowths();

		this.refresher.refresh("gambits");
	}

	*iterCustomRows() {

		let row = undefined;

		for (let each of this.gambits.getActiveValues()) {
			for (row of each.rows) yield row;
		}

		for (let each of this.sheet.arts.getActiveValues()) {
			if (!each.tagged("metagambit")) continue;
			for (row of each.rows) yield row;
		}

	}

	/* blurb display */

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

	get information() {
		return this._description.value;
	}

	set information(value) {
		this._description.value = value;
	}

	get replaceInfo() {
		return this._replace.checked;
	}

	set replaceInfo(value) {
		this._replace.checked = value;
	}

	blurb() {

		const mods = [];
		const env  = new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		);

		for (let key of [
			"ep", "atk", "prot", "resl", "cap", "br", "auto", "plu"
		]) {
			const value = env.read(`battalion|total|${key}`);
			if (value <= 1) continue;

			mods.push(`${capitalize(key)}:\xA0${value}`);
		}

		const rank = this._rank._trigger(this.rank);

		return [
			this.name, " (Authority ", rank, ")", "\n",
			"(With ", this.adjutant.name, ") ",
			mods.join(" "), mods.length ? "\n" : "",
			this.marker.toText([this.name, this.fullInfo()]),
			"\nUsage Requirements\n",
			"  * Authority ", rank
		].join("");
	}

	html() {

		const mods = [];
		const env  = new Calculator.Env(
			Calculator.Env.RUNTIME, this.sheet.definez
		);

		for (let key of [
			"ep", "atk", "prot", "resl", "cap", "br", "auto", "plu"
		]) {
			const value = env.read(`battalion|total|${key}`);
			if (value <= 1) continue;

			mods.push(`${capitalize(key)}:&nbsp;${value}`);
		}

		const rank = this._rank._trigger(this.rank);

		return [
			"<b>",
			this.name, " (Authority ", rank, ")",
			"</b>",
			"(With&nbsp;", this.adjutant.name, ") ", "<br />",
			mods.join(" "), mods.length ? "<br />" : "",
			this.marker.toHTML([this.name, this.fullInfo()]),
			"<br /><b>Usage Requirements</b><br />",
			"<ul>",
			"<li>", "Authority ", rank, "</li>",
			"</ul>",
		].join("");
	}

	/* buildable functions */

	import(battalion) {

		/* this needs to be set before the adjutant */
		this.gambits.setState(battalion.gambits);

		this.name        = battalion.name        || Battalion.DEFAULT;
		this.information = battalion.description || "";
		this.replaceInfo = battalion.replace     || false;
		this.template    = battalion.template    || Battalion.DEFAULT;
		this.adjutant    = battalion.adjutant    || Adjutant.DEFAULT;
		this.rank        = battalion.rank        || 0;
		
		this.refresh();
	}

	export() {

		/* filter all adjutant abilites off of the gambit state */
		const state = this.gambits.getState().filter(
			x => !Gambit.get(x).tagged("adjutant")
		);

		return {
			version     : Version.CURRENT.toString(),
			name        : this.name,
			description : this.information,
			replace     : this.replaceInfo,
			template    : this.template.name,
			adjutant    : this.adjutant.name,
			rank        : this.rank,
			gambits     : state,
		};
	}

	clear(preset) {
		this.name        = preset || Battalion.DEFAULT;
		this.information = "";
		this.replaceInfo = false;
		this.template    = preset || Battalion.DEFAULT;
		this.adjutant    = Adjutant.DEFAULT;
		this.rank        = 0;
		this.level       = 1;
		this.gambits.clear();
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
