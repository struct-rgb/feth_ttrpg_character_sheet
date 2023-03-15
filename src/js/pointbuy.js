
/* global element */
/* global AttributeCell */


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
		HP  : (s) => natural(scale(s,  "HP", 6) + scale(s,  "HP", 6)/4),
		STR : (s) => natural(scale(s, "STR", 4) + Math.max(scale(s, "STR", 4) - scale(s, "MAG", 4), 0)/3),
		MAG : (s) => natural(scale(s, "MAG", 4) + Math.max(scale(s, "MAG", 4) - scale(s, "STR", 4), 0)/3),
		DEX : (s) => natural(scale(s, "DEX", 4) + scale(s, "CHA", 4)/4),
		SPD : (s) => natural(scale(s, "SPD", 4) + scale(s, "SPD", 4)/3 + Math.max(scale(s, "MAG", 4), scale(s, "STR", 4))/3),
		DEF : (s) => natural(scale(s, "DEF", 4) + scale(s, "DEF", 4)/3),
		RES : (s) => natural(scale(s, "RES", 4) + scale(s, "RES", 4)/3),
		CHA : (s) => natural(scale(s, "CHA", 4) + scale(s, "DEX", 4)/4),
	},

	value: {
		HP  : (s) => natural(scale(s,  "HP", 20)),
		STR : (s) => natural(scale(s, "STR",  4) + Math.max(scale(s, "STR", 4) - scale(s, "MAG", 4), 0)/4),
		MAG : (s) => natural(scale(s, "MAG",  4) + Math.max(scale(s, "MAG", 4) - scale(s, "STR", 4), 0)/4),
		DEX : (s) => natural(scale(s, "DEX",  4) + scale(s, "CHA", 4)/5),
		SPD : (s) => natural(scale(s, "SPD",  4) + scale(s, "SPD", 4)/4 + Math.max(scale(s, "MAG", 4), scale(s, "STR", 4))/3),
		DEF : (s) => natural(scale(s, "DEF",  4) + scale(s, "DEF", 4)/4),
		RES : (s) => natural(scale(s, "RES",  4) + scale(s, "RES", 4)/4),
		CHA : (s) => natural(scale(s, "CHA",  4) + scale(s, "DEX", 4)/5),
	},
};

class PointRange {
	constructor(min, def, max, cost) {

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
}

class Forecast {

	constructor(pb) {

		this.pb = pb;

		this.records = new Map(); 

		this._toadd  = element("input", {
			class: ["simple-border", "short-meter"],
			attrs: {
				type    : "number",
				value   : 1,
				min     : 1,
				// oninput : (() => console.log("TODO")), 
			},
		});

		this._sf = Class.select(() => {});

		this._button = element("input",  {
			class   : ["simple-border"],
			attrs   : {
				value   : "Up",
				type    : "button",
				onclick : (() => {
					this.add(this._sf._select.value, this._toadd.value);
					pb.update("final");
				}),
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

	add(cls, levels) {

		const uid  = uniqueID();
		const name = `${levels} level(s) of ${cls}`;

		this.records.set(uid, [cls, levels]);

		const row = element("tr", 
			element("td",
				element("input", {
					class : ["simple-border"],
					attrs : {
						type    : "button",
						value   : name,
						onclick : (() => {
							this.records.delete(uid);
							row.remove();
							this.pb.update("final");
						})
					},
				})
			)
		);

		this._table.appendChild(row);
	}

	getBase(pb, key) {
		return pb.rows.get(key.toUpperCase())._value.value.value;
	}

	getGrow(pb, key) {
		return pb.rows.get(key.toUpperCase())._growth.value.value * 5;
	}

	statistic(pb, name) {

		name = name.toLowerCase();

		let total = 0;

		for (let [cls, levels] of this.records.values()) {

			const template = Class.get(cls);

			const sum = Math.max(
				this.getGrow(pb, name) + template.growths[name], 0
			);

			const cap = Math.min(
				Math.floor((60 - sum) / 10 * 5), 0
			);

			total += levels * (sum + cap);
		}

		const bonus = Class.get(this._cc._select.value).modifiers[name];

		return this.getBase(pb, name) + Math.floor(total / 100) + bonus;
	}

}

class PointBuy {

	static STATISTICS = ["HP", "STR", "MAG", "DEX", "SPD", "DEF", "RES", "CHA"];

	static ROWS = [
		["HP",
			new PointRange(20, 20, 32),
			new PointRange(0,  6,  10)],
		["STR",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["MAG",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["DEX",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["SPD",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["DEF",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["RES",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)],
		["CHA",
			new PointRange(0,  4, 12),
			new PointRange(3,  4, 10)]
	];

	constructor() {
		this.rows = new Map();

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
				costSum += Math.floor(cost / PointBuy.COST_SCALE);
				baseSum += row[privacy].value.value;
			} else {
				const pts  = this.forecast.statistic(this, row.name);
				
				const vcost = costfunctions.value[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).value
				);

				const gcost = costfunctions.growth[row.name](
					(key) => PointBuy.COST_SCALE * this.rows.get(key).growth
				);

				const cost  = (
					Math.floor(gcost / PointBuy.COST_SCALE) + Math.floor(vcost / PointBuy.COST_SCALE)
				);

				row[privacy].value.value = pts;
				row[privacy].cattr.value = cost;
				
				costSum += cost;
				baseSum += pts;
			}
		}
		this.pairs[column].value.value = baseSum;
		this.pairs[column].cattr.value = costSum;
	}

	*column(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row["_" + column].value.value];
		}
	}
}


