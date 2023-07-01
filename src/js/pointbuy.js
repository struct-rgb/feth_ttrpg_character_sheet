
/* global element */
/* global AttributeCell */
/* global Class */
/* global assume */
/* global uniqueID */
/* global tooltip */

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

		this.cattr  = new AttributeCell({
			edit    : false,
			before  : "( ",
			after   : " )",
			shown   : "0",
			trigger : (cost) => "$" + String(cost), 
		});

		this.roots  = [this.value.root, this.cattr.root];
		this.costs  = [];
	}

	costSum() {
		return this.costs.reduce((a, b) => a + b, 0);
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
				return (x * 5) + "%";
			},
		});

		this._final  = new AttributePair(name,  {
			edit    : false,
			trigger : function (x) {
				// oninput("final");
				return x;
			},
		});

		this.root = element("tr",
			[element("th", name)]
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
		CHA : (s) => natural(scale(s, "CHA", 5)),
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
		DEX : (s) => natural((scale(s, "DEX",  4) / 2) + scale(s, "CHA", 4)/4),
		SPD : (s) => {
			const spd = scale(s, "SPD",  4);
			return natural(spd + spd/4);
		},
		DEF : (s) => natural(scale(s, "DEF",  4) + scale(s, "RES", 4)/4),
		RES : (s) => natural(scale(s, "RES",  4) + scale(s, "DEF", 4)/4),
		CHA : (s) => natural((scale(s, "CHA",  4) / 2) + scale(s, "DEX", 4)/4),
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
					Class.get(cls).body(true)
				),
			]
		});

		const del   = element("button", {
			class   : ["simple-border", "smol"],
			content : "Delete",
			attrs   : {
				onclick : (() => this.remove())
			}
		});

		this.root = element("tr",
			element("td", [block, del])
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

		for (let [clas, levels] of cls_levels) {
			const template  = Class.get(clas);
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
			total += Number(record.levels);
		}

		return total;
	}

}

class PointBuy {

	static STATISTICS = definitions.stats.names.map(n => n.toUpperCase());

	static ROWS = [
		["HP",
			new PointRange(20, 20, 32),
			new PointRange(9,  9,  12)],
		["STR",
			new PointRange(0,  4, 10),
			new PointRange(5,  5,  8)],
		["MAG",
			new PointRange(0,  4, 10),
			new PointRange(5,  5,  8)],
		["DEX",
			new PointRange(0,  4, 16),
			new PointRange(5,  5,  8)],
		["SPD",
			new PointRange(0,  4, 10),
			new PointRange(5,  5,  8)],
		["DEF",
			new PointRange(0,  4, 10),
			new PointRange(5,  5,  8)],
		["RES",
			new PointRange(0,  4, 10),
			new PointRange(5,  5,  8)],
		["CHA",
			new PointRange(0,  4, 16),
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
			trigger : (x => String(x * 5) + "%"),
		});

		this.totalFinal  = new AttributePair("FinalTotal", {
			edit    : false,
			trigger : (x => x),
		});

		this.pairs    = {
			value  : this.totalValue,
			growth : this.totalGrowth,
			final  : this.totalFinal,
		};

		const table = element("table", [
			...PointBuy.ROWS.map((template) => {
				const row = new StatisticRow(...template, (pair) => {
					this.update(pair);
				});
				this.rows.set(row.name, row);
				return row.root;
			}),
			element("tr",  [
				element("th", "Sum"),
				...this.totalValue.roots,
				...this.totalGrowth.roots,
				...this.totalFinal.roots,
			])
		], "simple-border");

		this.forecast = new Forecast(this);

		this.root = element("div", [
			table, this.forecast.root,
		]);

		this.clear();
	}

	static COST_SCALE = 60;

	_foreach_column(callback) {
		for (let column of ["value", "growth", "final"]) {
			callback(column);
		}
	}

	clear(column) {

		if (column == null) {
			this._foreach_column((column) => this.clear(column));
			return;
		}

		const field = "_" + column;

		for (let [_key, row] of this.rows.entries()) {
			row[field].value.clear();
			row[field].cattr.clear();
		}

		this.pairs[column].value.value = 0;
		this.pairs[column].cattr.value = 0;
		this.update(column);
	}

	update(column) {

		if (column == null) {
			this._foreach_column((column) => this.update(column));
			return;
		}

		const getter  = (key) => PointBuy.COST_SCALE * this.rows.get(key)[column];
		const privacy = "_" + column; 

		let costSum = 0;
		let baseSum = 0;
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
				
				const vcost = costfunctions.value[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).value
				);

				const gcost = costfunctions.growth[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).growth
				);

				const cost = gcost + vcost;
				
				row[privacy].value.value = pts;
				row[privacy].cattr.value = cost;

				/* underline the numbers that have increased */
				const root = row[privacy].value.root.classList;
				if (root.contains("underline")) root.remove("underline");
				if (old < pts) root.add("underline");
				
				costSum += cost;
				baseSum += pts;
			}
		}
		this.pairs[column].value.value = baseSum;
		this.pairs[column].cattr.value = Math.trunc(costSum / PointBuy.COST_SCALE);
	}

	*column(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row["_" + column].value.value];
		}
	}

	// import(e) {
	// 	const file = e.target.files[0];
	// 	if (!file) return;

	// 	const reader = new FileReader();

	// 	reader.onload = (e) => {
	// 		const item     = JSON.parse(e.target.result);
	// 		this.importObject(this._updatefn(item));
	// 	};
		
	// 	reader.readAsText(file);
	// }

	import(obj) {
		for (let [stat, row] of this.rows.entries()) {
			const key = stat.toLowerCase();
			row._value.value.value  = obj.bases[key];
			row._growth.value.value = obj.growths[key] / 5;
		}
	}

	export() {
		const a    = element("a");
		const name = prompt("Enter a preset name:") || "mypreset";
		
		const item = {
			"name": name,
			"bases": {},
			"growths": {},
			"comment": "",
			"tags": [],
			"hidden": false
		};

		for (let [stat, row] of this.rows.entries()) {
			const key = stat.toLowerCase();
			item.bases[key]   = row._value.value.value;
			item.growths[key] = row._growth.value.value;
		}
		item.bases.mov = 0;

		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = item.name.replace(/ /g, "_") + ".json";
		a.click();
		URL.revokeObjectURL(a.href);
	}
}


