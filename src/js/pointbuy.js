
function uniqueID(object) {
	return object.constructor.name + performance.now();
}

class AttributeCell {

	constructor(total, punctuation, oninput) {
		this.root  = document.createElement("td");
		this.text  = document.createTextNode("");
		this._comp = total;

		const input = document.createElement("input");
		this.input = input;

		if (punctuation && "before" in punctuation) {
			const span = document.createElement("span");
			span.appendChild(document.createTextNode(punctuation.before));
			span.classList.add("punctuation");
			this.root.appendChild(span);
		}

		if (!oninput) {
			const span = document.createElement("span");
			span.appendChild(this.text);
			span.classList.add("computed");
			this.root.appendChild(span);
		} else {

			const input = document.createElement("input");
			const idstr = uniqueID(input);
			console.log(idstr);

			input.id      = idstr;
			input.name    = idstr;
			input.type    = "number";
			input.classList.add("hidden-field", "simple-border");
			input.min     = 0;
			input.max     = 100;
			input.value   = 0;
			input.oninput = (() => {
				this.base = this.input.value;
				if (oninput) oninput();
			});

			this.input = input;

			const label = document.createElement("label");
			label.appendChild(this.text);
			label.classList.add("datum");
			label.htmlFor = idstr;

			label.appendChild(this.text);
			this.root.appendChild(label);
			this.root.appendChild(input);
		}

		if (punctuation && "after" in punctuation) {
			const span = document.createElement("span");
			span.appendChild(document.createTextNode(punctuation.after));
			span.classList.add("punctuation");
			this.root.appendChild(span);
		}

		this.base = 0;
	}

	get base() {
		return Number(this.input.value);
	}

	set base(value) {
		this.input.value      = value;
		this.text.textContent = String(this.display);
	}

	get minimum() {
		return this.input.min;
	}

	set minimum(value) {
		this.input.min = value;
		if (this.input.value < value) {
			this.input.value = value;
		}
	}

	get display() {
		return this._comp(this.base);
	}
}

class AttributePair {

	constructor(name, totalA, totalB, oninput) {
		this.name  = name;
		this.value = new AttributeCell(totalA, null, oninput ? oninput : null);
		this.cattr = new AttributeCell(totalB, {before: "( ", after: " )"});
		this.roots = [this.value.root, this.cattr.root];
		this.costs = [];
	}

	costSum() {
		return this.costs.reduce((a, b) => a + b, 0);
	}

}

class StatisticRow {
	constructor(name, oninput) {
		this.root        = document.createElement("tr");
		this.name        = name;

		this.headerText  = document.createTextNode(name);
		const header     = document.createElement("th");
		header.appendChild(this.headerText);
		this.root.appendChild(header);

		this._value  = new AttributePair(name, x => x, x => "$" + x, () => oninput("value"));
		this._value.roots.forEach(root => this.root.appendChild(root));
		
		this._growth = new AttributePair(name, x => (x * 5) + "%", x => "$" + x, () => oninput("growth"));
		this._growth.roots.forEach(root => this.root.appendChild(root));
	}

	get value() {
		return Number(this._value.value.base);
	}

	get growth() {
		return Number(this._growth.value.base);
	}
}

const costfunctions = {
	growth: {
		HP  : (s) => Math.round(Math.max(s("HP")  + (s("HP"))/6 - Math.abs(s("RES") - s("DEF"))/4, 0)),
		STR : (s) => Math.round(Math.max(s("STR") + (s("STR"))/6 + (s("SPD"))/6 - (s("MAG"))/6, 0)),
		MAG : (s) => Math.round(Math.max(s("MAG") + (s("MAG"))/6 + (s("SPD"))/6 - (s("STR"))/6, 0)),
		DEX : (s) => Math.round(Math.max(s("DEX") + (s("DEX"))/6 + (s("CHA"))/6, 0)),
		SPD : (s) => Math.round(Math.max(s("SPD") + (s("SPD"))/6 + Math.abs(s("STR") - s("MAG"))/3 + (s("MAG"))/6 + (s("STR"))/6, 0)),
		DEF : (s) => Math.round(Math.max(s("DEF") + (s("DEF"))/6 + (s("RES"))/6, 0)),
		RES : (s) => Math.round(Math.max(s("RES") + (s("RES"))/6 + (s("DEF"))/6, 0)),
		CHA : (s) => Math.round(Math.max(s("CHA") + (s("CHA"))/6 + (s("DEX"))/10, 0)),
	},

	value: {
		HP  : (s) => Math.round(Math.max((s("HP") - (20 * PointBuy.COST_SCALE)) + (s("HP") - (20 * PointBuy.COST_SCALE))/4 - Math.abs(s("RES") - s("DEF"))/3, 0)),
		STR : (s) => Math.round(Math.max(s("STR") + (s("STR"))/4 + (s("SPD"))/4 - (s("MAG"))/4, 0)),
		MAG : (s) => Math.round(Math.max(s("MAG") + (s("MAG"))/4 + (s("SPD"))/4 - (s("STR"))/4, 0)),
		DEX : (s) => Math.round(Math.max(s("DEX") + (s("DEX"))/4 + (s("CHA"))/2, 0)),
		SPD : (s) => Math.round(Math.max(s("SPD") + (s("SPD"))/4 + Math.abs(s("STR") - s("MAG"))/2 + (s("MAG"))/4 + (s("STR") )/4, 0)),
		DEF : (s) => Math.round(Math.max(s("DEF") + (s("DEF"))/4 + (s("RES"))/4, 0)),
		RES : (s) => Math.round(Math.max(s("RES") + (s("RES"))/4 + (s("DEF"))/4, 0)),
		CHA : (s) => Math.round(Math.max(s("CHA") + (s("CHA"))/4 + (s("DEX"))/8, 0)),
	},
}

class PointBuy {

	static STATISTICS = ["HP", "STR", "MAG", "DEX", "SPD", "DEF", "RES", "CHA"];

	constructor(names) {
		const table = document.createElement("table");
		this.root   = table;
		this.rows   = new Map();

		for (let name of PointBuy.STATISTICS) {
			const row = new StatisticRow(name, (pair) => this.update(pair));
			this.rows.set(name, row);
			table.appendChild(row.root);
		}

		const row            = document.createElement("tr");
		const header         = document.createElement("th");
		header.textContent   = "Sum";
		row.appendChild(header);

		this.totalValue  = new AttributePair("ValueTotal", x => x, x => "$" + x);
		this.totalValue.roots.forEach(root => row.appendChild(root));

		this.totalGrowth = new AttributePair("GrowthTotal", x => (x * 5) + "%", x => "$" + x);
		this.totalGrowth.roots.forEach(root => row.appendChild(root));

		this.pairs = {value: this.totalValue, growth: this.totalGrowth};

		table.appendChild(row);

		this.rows.get("HP")._value.value.minimum = 20

		this.combined = document.createTextNode("$0");
		const span = document.createElement("span");
		span.appendChild(this.combined);
		span.classList.add("computed");

		const th = document.createElement("th");
		th.appendChild(document.createTextNode("Total"));
		table.appendChild(th);

		const td = document.createElement("td");
		td.rowspan = 4;
		td.appendChild(span);
		table.appendChild(td);
	}

	static COST_SCALE = 60;

	_foreach_column(callback) {
		for (let column of ["value", "growth"]) {
			callback(column);
		}
	}

	clear(column) {

		if (column == null) {
			this._foreach_column((column) => this.clear(column));
			return;
		}

		const field = "_" + column;

		for (let [key, row] of this.rows.entries()) {
			row[field].value.base = row[field].value.minimum;
			row[field].cattr.base = row[field].cattr.minimum;
		}

		this.pairs[column].value.base = 0;
		this.pairs[column].cattr.base = 0;
		this.total();
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
		for (let [key, row] of this.rows.entries()) {
			const cost = costfunctions[column][row.name](getter);
			row[privacy].cattr.base = Math.floor(cost / PointBuy.COST_SCALE);
			costSum += Math.floor(cost / PointBuy.COST_SCALE);
			baseSum += row[privacy].value.base;
		}
		this.pairs[column].value.base = baseSum - (column == "value" ? 20 : 0);
		this.pairs[column].cattr.base = costSum;
		this.total();
	}

	total() {
		this.combined.textContent = "$" + (this.pairs.value.cattr.base + this.pairs.growth.cattr.base);
	}

	*column(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row["_" + column].value.base];
		}
	}
}


