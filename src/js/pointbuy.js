
/* global
	AttributeCell, Class,
	assume, element, uniqueID, tooltip
*/

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */

/**
 * Options for initializing a new AttributePair
 * @typedef {object} PairOptions
 * @property {boolean} edit - whether the cell accepts input
 * @property {PointRange} range - range of values
 * @property {function} trigger - callback of oninput behavior
 */

/**
 * Data necessary for the level up animation for {@link LevelHistory}
 */
class ChangeAnimation {

	/**
	 * Create an instance
	 * @param {Array.HTMLElement} titles - array of HTMLElements to animate 
	 * @param {Array.HTMLElement} inputs - inputs to disable as animation plays
	 */
	constructor(titles, inputs=[], incr_cls="incr-bell", decr_cls="decr-bell") {

		this.titles    = titles;
		this.inputs    = inputs;
		this._incrBell = new Audio("./resources/ding-126626_trimmed.wav");
		this._decrBell = new Audio("./resources/cowbell_os_1-89685.mp3");
		this._dings    = [];
		this.disabled  = false;
		this._incr_cls = incr_cls;
		this._decr_cls = decr_cls;

		this._incrBell.addEventListener("ended", (event) => this.next());
		this._decrBell.addEventListener("ended", (event) => this.next());
	}

	/**
	 * Add input to disable while animation plays
	 * @param {HTMLElement} input - input to disable
	 */
	// addLock(input) {
	// 	this.inputs.push(input);
	// 	return input;
	// }

	/**
	 * Disable inputs; used to prevent interference while animation plays
	 * @param {boolean} value - whether to lock or unlock
	 */
	lock(value) {
		for (let input of this.inputs()) {
			input.disabled = value;
		}
	}

	/**
	 * Play the animation
	 * @param {LevelAttempt} levelattempt - levelattempt to animate
	 */
	async play(array) {
		if (this.disabled) return;
		this.set(array);
		this.next();
	}

	/**
	 * Queue which of the titles to highlight when animation plays next
	 * @param {LevelAttempt} levelattempt - levelattempt to animate
	 */
	set(array) {
		this.lock(true);

		this._dings.length = 0;
		for(let i = array.length; i >= 0; --i) {
			if (array[i]) this._dings.push(i, array[i]);
		}
	}

	/**
	 * Clear applied styles on all highlighted elements
	 */
	clear() {
		for (let [title, node] of this.titles) {
			const classes = title.classList;
			if (classes.contains(this._incr_cls)) {
				classes.remove(this._incr_cls);
			}
			if (classes.contains(this._decr_cls)) {
				classes.remove(this._decr_cls);
			}
			node.data = "";
		}
		this.lock(false);
	}

	/**
	 * Play the next sound effect/highligh in the queue
	 */
	async next() {
		if (this._dings.length) {

			const color         = this._dings.pop();
			const [title, node] = this.titles[this._dings.pop()];

			if (color > 0) {
				title.classList.add(this._incr_cls);
				node.data = `+${color}`;
				this._incrBell.play();
			} else if (color < 0) {
				title.classList.add(this._decr_cls);
				node.data = color;
				this._decrBell.play();
			} else {
				// throw new Error(
				// 	`recieved invalid bell modifier ${color}`
				// );
				console.log("zero");
			}
		} else {
			setTimeout(() => this.lock(false), 2000);
		}
	}
}

/**
 * Options for initializing a new AttributePair
 * @typedef {object} PairOptions
 * @property {boolean} edit - whether the cell accepts input
 * @property {PointRange} range - range of values
 * @property {function} trigger - callback of oninput behavior
 */

class AttributePair {

	constructor(name, options) {

		this.name     = name;
		// this.cost     = options.cost;
		options.range = options.range || new PointRange(0, 0, 100);

		this.value  = new AttributeCell({
			edit    : assume(options.edit, true),
			max     : options.range.max,
			min     : options.range.min,
			def     : options.range.def,
			shown   : options.range.def,
			value   : options.range.def,
			trigger : options.trigger    || (x => x),
		});

		const text = document.createTextNode("");

		this.center = {
			root: element("td", text, "monospace"),
			text: text,
		};

		this.cattr  = new AttributeCell({
			edit    : false,
			before  : "( ",
			after   : " )",
			shown   : "0",
			trigger : (cost) => `$${cost}`, 
		});

		this.roots  = [this.value.root, this.center.root, this.cattr.root];
		this.costs  = [];
	}

	costSum() {
		return this.costs.r9educe((a, b) => a + b, 0);
	}

}

class StatisticRow {
	constructor(name, vrange, grange, oninput) {
		this.name   = name;

		this._value = new AttributePair(name, {
			range   : vrange,		
			trigger : function (x) {
				oninput("value");
				oninput("final");
				return x;
			},
		});

		this._growth = new AttributePair(name, {
			range   : grange,
			trigger : function (x) {
				oninput("growth");
				oninput("final");
				return `${x * 5}%`;
			},
		});

		this._final  = new AttributePair(name,  {
			edit    : false,
			trigger : function (x) {
				// oninput("final");
				return x;
			},
		});

		const title = element("th", name);
		this.title  = title;
		this.root   = element("tr",
			[title]
				.concat(this._value.roots)
				.concat(this._growth.roots)
				.concat(this._final.roots)
		);
	}

	get value() {
		return Number(this._value.value.value);
	}

	get growth() {
		return Number(this._growth.value.value);
	}
}

function scale(fn, name, factor) {
	return fn(name) - (factor * PointBuy.COST_SCALE);
}

function natural(number) {
	return number;
}

const costfunctions = {
	growth: {
		HP  : (s) => natural(scale(s,  "HP", 9)),
		STR : (s) => natural(Math.max(scale(s, "STR", 5) - scale(s, "MAG", 5), 0)/2 + scale(s, "STR", 5)/2),
		MAG : (s) => natural(Math.max(scale(s, "MAG", 5) - scale(s, "STR", 5), 0)/2 + scale(s, "MAG", 5)/2),
		DEX : (s) => natural(scale(s, "DEX", 5)),
		SPD : (s) => natural(scale(s, "SPD", 5)),
		DEF : (s) => natural(scale(s, "DEF", 5)),
		RES : (s) => natural(scale(s, "RES", 5)),
		LCK : (s) => natural(scale(s, "LCK", 5)),
	},

	value: {
		HP  : (s) => natural(scale(s,  "HP", 20) / 2),
		STR : (s) => {
			const str = scale(s, "STR", 4);
			const mag = scale(s, "MAG", 4);
			return natural(str + Math.max(str - mag, 0)/4);
		},
		MAG : (s) => {
			const str = scale(s, "STR", 4);
			const mag = scale(s, "MAG", 4);
			return natural(mag + Math.max(mag - str, 0)/4);
		},
		DEX : (s) => natural((scale(s, "DEX",  4) / 2) + scale(s, "LCK", 4)/4),
		SPD : (s) => {
			const spd = scale(s, "SPD",  4);
			return natural(spd - spd/4);
		},
		DEF : (s) => natural(scale(s, "DEF",  4) + scale(s, "RES", 4)/4),
		RES : (s) => natural(scale(s, "RES",  4) + scale(s, "DEF", 4)/4),
		LCK : (s) => natural((scale(s, "LCK",  4) / 2) + scale(s, "DEX", 4)/4),
	},
};

class PointRange {
  
	constructor(min, def, max, cost=0) {

		if (!(min <= max)) {
			throw Error(
				`maximum '${max}' must equal or exceed minimum '${min}'`
			);
		}

		if (!(min <= def && def <= max)) {
			throw Error(
				`default value must be within range [${min}, ${max}]`
			);
		}

		this.min  = min;
		this.def  = def;
		this.max  = max;
		this.cost = cost;
	}

	has(number) {
		return this.min <= number && number < this.max;
	}
}

class ForecastRecord {

	constructor(forecast, cls, levels) {
		this._cls     = cls;
		this.uid      = uniqueID();
		this.cnode    = document.createTextNode(cls);
		this.forecast = forecast;
		forecast.records.set(this.uid, this);

		this.cell = new AttributeCell(
			{
				edit  : true,
				shown : levels,
				value : levels,
				min   : 0,
				max   : 100,
				step  : 1,
				root  : "span",
			},
			(value) => {
				this.forecast.pb.update("final");
				if (value == 0) this.remove();
				this._levels = value;
				return value;
			}
		);

		const block = element("span", {
			class   : ["simple-border"],
			content : [
				this.cell.root,
				" level(s) of ",
				tooltip(
					element("span", this.cnode, "datum"),
					Class.get(cls).body({dead: true})
				),
			]
		});

		this._delete = element("button", {
			class   : ["simple-border", "smol"],
			content : "Delete",
			attrs   : {
				onclick : (() => this.remove())
			}
		});

		this.root = element("tr",
			element("td", [block, this._delete])
		);
	}

	get levels() {
		return this.cell.value;
	}

	set levels(value) {
		this.cell.value = value;
	}

	get cls() {
		return this._cls;
	}

	set cls(value) {
		this._cls       = value;
		this.cnode.data = value;
		this.forecast.pb.update("final");
	}

	remove() {
		this.forecast.records.delete(this.uid);
		this.forecast.pb.update("final");
		this.root.remove();
	}
}

class Forecast {

	static DIMINISHING = new Set(["str", "mag", "def", "res", "spd"]);

	static diminish(sum, name=null) {

		if (name != null) {
			return this.DIMINISHING.has(name) ? this.diminish(sum) : 0;
		}

		// return Math.min(Math.floor((60 - sum) / 10 * 5), 0);
		return Math.min((50 - sum) / 2, 0);
	}

	static statisic(name, base, growth, cls_levels, cls) {

		let total = 0;

		for (let [cls, levels] of cls_levels) {
			const template  = Class.get(cls);
			const sum       = Math.max(growth + template.growths[name], 0);
			const multi     = sum + this.diminish(sum, name);
			const delta     = multi * levels;
			total          += delta;
		}

		const bonus = Class.get(cls).modifiers[name];
		return base + Math.floor(total / 100) + bonus;
	}

	constructor(pb) {

		this.pb = pb;

		this.records = new Map(); 

		const update = ((_event) => {
			if (this._toadd.value == 0) return;
			this.add(this._sf._select.value, Number(this._toadd.value));
			pb.update("final");
		});

		this._toadd  = element("input", {
			class: ["simple-border", "short-meter"],
			attrs: {
				type       : "number",
				value      : 1,
				min        : 1,
				onkeypress : ((event) => {
					if (event.key == "Enter") {
						update(event);
						this._sf._select.focus();
					}
				})
			},
		});

		this._sf = Class.select(() => {});

		this._sf._select.onkeypress = ((event) => {
			if (event.key == "Enter") {
				event.preventDefault();
				this._toadd.focus();
			}
		});

		this._button = element("input",  {
			class   : ["simple-border"],
			attrs   : {
				value   : "Up",
				type    : "button",
				onclick : update,
			},
		});

		this._cc = Class.select(() => {
			pb.update("final");
		});

		this._table = element("table");

		this.root = element("div", [
			this._button, this._sf.root, this._toadd,
			this._table,

			element("span", "Now", "simple-border"), this._cc.root
		]);
	}

	*inputs() {
		yield this._toadd;
		yield this._button;
		yield this._sf._select;
		yield this._cc._select;
		for (let record of this.records.values()) {
			yield record.cell.input;
			yield record._delete;
		}
	}

	get class() {
		return this._cc._select.value;
	}

	set class(value) {
		this._cc._select.value = value;
	}

	add(cls, levels) {
		const row = new ForecastRecord(this, cls, levels);
		this._table.appendChild(row.root);
	}

	clear() {
		for (let record of this.records.values()) {
			record.remove();
		}
	}

	getBase(pb, key) {
		return pb.rows.get(key.toUpperCase())._value.value.value;
	}

	getGrow(pb, key) {
		return pb.rows.get(key.toUpperCase())._growth.value.value * 5;
	}

	statistic(pb, name) {

		const root = pb.rows.get(name)._growth.value.root.classList;
		if (root.contains("underline")) root.remove("underline");

		name = name.toLowerCase();

		let total = 0;

		for (let record of this.records.values()) {

			const template = Class.get(record.cls);

			const sum = Math.max(
				this.getGrow(pb, name) + template.growths[name], 0
			);

			const dim    = Forecast.diminish(sum, name);
			if (dim < 0) root.add("underline");

			const multi  = sum + dim;
			const delta  = multi * record.levels;
			total       += delta;
		}

		const bonus = Class.get(this._cc._select.value).modifiers[name];

		return this.getBase(pb, name) + Math.floor(total / 100) + bonus;
	}

	get level() {
		
		let total = 0;

		for (let record of this.records.values()) {
			if (Class.get(record.cls).tier != "Bonus") {
				total += Number(record.levels);
			}
		}

		return total;
	}

	import(forecast) {
		this.clear();

		for (let record of forecast.levels) {
			this.add(...record);
		}

		this.class = forecast.class;
	}

	export() {

		const levels = [];

		for (let record of this.records.values()) {
			levels.push([record.cls, record.levels]);
		}

		return {
			class  : this.class,
			levels : levels,
		};
	}
}

class PointBuy {

	static STATISTICS = definitions.stats.names.map(n => n.toUpperCase());

	static ROWS = [
		["HP",
			new PointRange(20, 20, 32),
			new PointRange(9,  9,  12)],
		["STR",
			new PointRange(2,  4, 10),
			new PointRange(5,  5,  8)],
		["MAG",
			new PointRange(2,  4, 10),
			new PointRange(5,  5,  8)],
		["DEX",
			new PointRange(2,  4, 16),
			new PointRange(5,  5,  8)],
		["SPD",
			new PointRange(2,  4, 10),
			new PointRange(5,  5,  8)],
		["DEF",
			new PointRange(2,  4, 10),
			new PointRange(5,  5,  8)],
		["RES",
			new PointRange(2,  4, 10),
			new PointRange(5,  5,  8)],
		["LCK",
			new PointRange(2,  4, 16),
			new PointRange(5,  5,  8)]
	];

	constructor() {
		this.rows   = new Map();

		this.totalValue  = new AttributePair("ValueTotal", {
			edit    : false,
			trigger : (x => x),
		});

		this.totalGrowth = new AttributePair("GrowthTotal", {
			edit    : false,
			trigger : (x => `${x * 5}%`),
		});

		this.totalFinal  = new AttributePair("FinalTotal", {
			edit    : false,
			trigger : (x => x),
		});

		this.pairs = {
			value  : this.totalValue,
			growth : this.totalGrowth,
			final  : this.totalFinal,
		};

		this.baseMin = new AttributeCell({
			edit    : true,
			before  : "( ",
			after   : " )",
			shown   : "$15",
			value   : 15,
			trigger : (cost) => `$${cost}`,
		});

		this.growMin = new AttributeCell({
			edit    : true,
			before  : "( ",
			after   : " )",
			shown   : "$15",
			value   : 15,
			trigger : (cost) => `$${cost}`,
		});

		this.finalMax = new AttributeCell({
			edit    : true,
			before  : "( ",
			after   : " )",
			shown   : "$33",
			value   : 33,
			trigger : (cost) => `$${cost}`,
		});

		this._atkspdsum = new AttributeCell({
			edit    : false,
			shown   : "0",
			value   : 0,
			root    : "span",
			trigger : (
				(value) => Math.max(
					this.rows.get("STR")._value.value.value,
					this.rows.get("MAG")._value.value.value,
				)
					+
				this.rows.get("SPD")._value.value.value
			), 
		});

		this._atkspdlim = new AttributeCell({
			edit    : true,
			shown   : "14",
			value   : 14,
			root    : "span",
			trigger : (cost) => String(cost), 
		});

		const table = element("table", [
			element("tbody", [
				...PointBuy.ROWS.map((template) => {
					const row = new StatisticRow(...template, (pair) => {
						this.update(pair);
					});
					this.rows.set(row.name, row);
					return row.root;
				}),
			]),
			element("tfoot", [
				element("tr",  [
					element("th", "Sum"),
					...this.totalValue.roots,
					...this.totalGrowth.roots,
					...this.totalFinal.roots,
				]),
				element("tr", [
					element("th", "Budget"),
					element("td", {
						content : "Min",
						attrs   : {colSpan: 2}
					}),
					this.baseMin.root,
					element("td", {
						content : "Min",
						attrs   : {colSpan: 2}
					}),
					this.growMin.root,
					element("td", {
						content : "Max",
						attrs   : {colSpan: 2}
					}),
					this.finalMax.root,
				]),
				element("tr", [
					element("td", {
						content : [
							element("strong", "(Atk + Spd) limit is "),
							this._atkspdsum.root,
							element("strong", " / "),
							this._atkspdlim.root,
						],
						attrs  : {
							colSpan: 10,
						}
					})
				]),
			]), 
		], "simple-border");

		this.forecast   = new Forecast(this);

		this.root = element("div", [
			table, 



			this.forecast.root,
		]);

		const that = this;

		this.bells = new ChangeAnimation(
			Array.from(this.rows.values()).map(row => 
				[row._final.center.root, row._final.center.text]
			).concat([
				[this.pairs.final.center.root, this.pairs.final.center.text]
			]),
			function*() {for (let each of that.inputs()) yield each;},
			"hl-reserved",
			"hl-operator",
		);

		this.animate = false;
		this.clear();
	}

	setAnimated(value) {
		const old    = this.animate;
		this.animate = value;
		return old;
	}

	*inputs() {
		for (let row of this.rows.values()) {
			yield row._value.value.input;
			yield row._growth.value.input;
		}
		for (let input of this.forecast.inputs()) {
			yield input;
		}
	}

	static COST_SCALE = 60;

	_foreach_column(callback) {
		for (let column of ["value", "growth", "final"]) {
			callback(column);
		}
	}

	clear(column) {

		const animate = this.setAnimated(false);

		if (column == null) {
			this.forecast.clear();
			this._foreach_column((column) => this.clear(column));
			return;
		}

		const field = `_${column}`;

		for (let [_key, row] of this.rows.entries()) {
			row[field].value.clear();
			row[field].cattr.clear();
		}

		this.pairs[column].value.value = 0;
		this.pairs[column].cattr.value = 0;
		this.update(column);

		this.setAnimated(animate);
		this.bells.clear();
	}

	diffset(center, diff) {
		const root = center.root.classList;
		
		root.remove("hl-reserved");
		root.remove("hl-operator");

		center.text.data = (
			diff > 0 ? (root.add("hl-reserved"), `+${diff}`) : // eslint-disable-next-line indent
			diff < 0 ? (root.add("hl-operator"),     diff  ) : ""
		);
	}

	update(column) {

		if (column == null) {
			this._foreach_column((column) => this.update(column));
			return;
		}

		const array   = [];
		const getter  = (key) => PointBuy.COST_SCALE * this.rows.get(key)[column];
		const privacy = `_${column}`; 

		let costSum = 0, baseSum = 0, diffSum = 0;
		for (let [_key, row] of this.rows.entries()) {
			if (column != "final") {
				const cost = costfunctions[column][row.name](getter);
				row[privacy].cattr.value = (cost / PointBuy.COST_SCALE).toFixed(2);
				// costSum += Math.trunc(cost / PointBuy.COST_SCALE);
				costSum += cost;
				baseSum += row[privacy].value.value;
			} else {
				const old  = row[privacy].value.value;
				const pts  = this.forecast.statistic(this, row.name);
				const diff = pts - old;
				
				const vcost = costfunctions.value[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).value
				);

				const gcost = costfunctions.growth[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).growth
				);

				const cost = gcost + vcost;
				
				row[privacy].value.value = pts;
				row[privacy].cattr.value = (cost / PointBuy.COST_SCALE).toFixed(2);

				if (this.animate) {
					array.push(diff);
				} else {
					this.diffset(row[privacy].center, diff);
				}

				costSum += cost;
				baseSum += pts;
				diffSum += diff;
			}
		}

		const row       = this.pairs[column];
		row.value.value = baseSum;
		row.cattr.value = Math.trunc(costSum / PointBuy.COST_SCALE);
		if (!this.animate) this.diffset(row.center, diffSum);
		array.push(diffSum);

		if (this.animate && array) {
			this.bells.clear();
			this.bells.play(array);
		}
	}

	*column(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row[`_${column}`].value.value];
		}
	}

	*cells(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row[`_${column}`].value];
		}
	}

	import(obj) {
		for (let [stat, row] of this.rows.entries()) {
			const key = stat.toLowerCase();
			row._value.value.value  = obj.bases[key];
			row._growth.value.value = obj.growths[key] / 5;
		}

		if ("forecast" in obj) {
			this.forecast.import(obj.forecast);
		}
		this.update();
	}

	export(doprompt=false) {
		const name = (doprompt && prompt("Enter a preset name:")) || "mypreset";
		
		const item = {
			"name": name,
			"bases": {},
			"growths": {},
			"forecast": this.forecast.export(),
			"comment": "",
			"tags": [],
			"hidden": false
		};

		for (let [stat, row] of this.rows.entries()) {
			const key = stat.toLowerCase();
			item.bases[key]   = row._value.value.value;
			item.growths[key] = row._growth.value.value * 5;
		}
		item.bases.mov = 0;

		return item;
	}

	fileExport() {
		const a    = element("a");
		const item = this.export();
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = `${item.name.replace(/ /g, "_")}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}
}


