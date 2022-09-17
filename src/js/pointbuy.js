
function uniqueID() {
	const  base = '00000000-0000-4000-0000-000000000000';
	return base.replace(/0/g, character => {
		const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
		const randomChar = character ^ randomByte & 0xF >> character / 4;
		return randomChar.toString(16);
	});
}

function element(type, content, ...classes) {

	const element = document.createElement(type);

	if (content) {
		const ctype = typeof content;
		switch (ctype) {
			case "object":
				element.appendChild(content);
				break;
			case "string":
				element.textContent = content;
				break;
			default:
				throw Error(`type '${ctype}' invalid for key "content"`);
		}
	}

	if (classes && classes.length > 0) {
		element.classList.add(...classes);
	}

	return element;
}

class AttributeCell {

	constructor(options, trigger) {
		this.root     = document.createElement("td");
		this.text     = document.createTextNode("");
		this._trigger = trigger || (x => x);

		const input   = document.createElement("input");
		this.input    = input;

		if (options && "before" in options) {
			const span = element("span", options.before, "punctuation");
			this.root.appendChild(span);
		}

		if ((!options.style) || options.style == "datum") {
			const input = document.createElement("input");
			const idstr = uniqueID(input);
			// console.log(idstr);

			input.id      = idstr;
			input.name    = idstr;
			input.type    = "number";
			input.classList.add("hidden-field", "simple-border");
			input.min     = 0;
			input.max     = 100;
			input.value   = 0;
			input.oninput = (() => {
				this.value = this.input.value;
			});

			this.input = input;

			const label = document.createElement("label");
			label.appendChild(this.text);
			label.classList.add("datum");
			label.htmlFor = idstr;

			label.appendChild(this.text);
			this.root.appendChild(label);
			this.root.appendChild(input);
		} else if (options.style && options.style == "computed") {
			const span = element("span", this.text, "computed");
			this.root.appendChild(span);
		} else {
			throw Error(`'${style}' is not a valid AttributeCell style`);
		}

		if (options) {

			if ("after" in options) {
				const span = element("span", options.after, "punctuation");
				this.root.appendChild(span);
			}

			if ("shown" in options) {
				this.setShown(options.shown);
				this.setValue(options.value || 0);
			} else {
				this.value = (options.value || 0);
			}

		} else {
			this.value = 0;
		}
	}

	refresh() {
		this.text.data = String(this.shown());
	}

	get value() {
		return Number(this.input.value);
	}

	set value(value) {
		this.input.value = value;
		this.refresh();
	}

	setValue(value) {
		this.input.value = value;
	}

	setShown(text) {
		this.text.data = text; 
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

	get maximum() {
		return thus.input.max;
	}

	set maximum(value) {
		this.input.max = value;
		if (this.input.value > value) {
			this.input.value = value;
		}
	}

	shown() {
		return this._trigger(this.value);
	}
}


class AttributePair {

	constructor(name, totalA, totalB, edit) {
		this.name  = name;
		const style = (edit || edit == null ? "datum" : "computed");
		const vopts = {style: style, shown: "0"};
		this.value  = new AttributeCell(vopts, totalA)
		const copts = {style: "computed", before: "( ", after: " )", shown: "0"};
		this.cattr  = new AttributeCell(copts, totalB);
		this.roots  = [this.value.root, this.cattr.root];
		this.costs  = [];
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

		this._value = new AttributePair(name, 
			function (x) {
				oninput("value");
				return x;
			},
			function (x)  {
				return "$" + x;
			}
		);

		this._value.roots.forEach(root => this.root.appendChild(root));

		this._growth = new AttributePair(name,
			function (x) {
				oninput("growth");
				return (x * 5) + "%";
			},
			function (x) {
				return "$" + x;
			}
		);

		this._growth.roots.forEach(root => this.root.appendChild(root));
	}

	get value() {
		return Number(this._value.value.value);
	}

	get growth() {
		return Number(this._growth.value.value);
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

		this.totalValue  = new AttributePair("ValueTotal", x => x, x => "$" + x, false);
		this.totalGrowth = new AttributePair("GrowthTotal", x => (x * 5) + "%", x => "$" + x, false);
		this.pairs = {value: this.totalValue, growth: this.totalGrowth};
		this.combined = document.createTextNode("$0");

		for (let statistic of PointBuy.STATISTICS) {
			const name = statistic;
			const row  = new StatisticRow(name, (pair) => {
				this.update(pair);
			});
			this.rows.set(name, row);
			table.appendChild(row.root);
		}

		const row = document.createElement("tr");
		row.appendChild(element("th", "Sum"));

		
		this.totalValue.roots.forEach(root => row.appendChild(root));
		this.totalGrowth.roots.forEach(root => row.appendChild(root));

		table.appendChild(row);

		this.rows.get("HP")._value.value.minimum = 20

		const span = element("span", this.combined, "computed");

		table.appendChild(element("th", "Total"));

		const td = document.createElement("td");
		td.rowspan = 4;
		td.appendChild(span);
		table.appendChild(td);
		this.clear();
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
			const value = row[field].value;
			value.value = value.minimum;
			const cattr = row[field].cattr;
			cattr.value = cattr.minimum;
		}

		this.pairs[column].value.value = 0;
		this.pairs[column].cattr.value = 0;
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
			row[privacy].cattr.value = Math.floor(cost / PointBuy.COST_SCALE);
			costSum += Math.floor(cost / PointBuy.COST_SCALE);
			baseSum += row[privacy].value.value;
		}
		this.pairs[column].value.value = baseSum - (column == "value" ? 20 : 0);
		this.pairs[column].cattr.value = costSum;
		this.total();
	}

	total() {
		this.combined.textContent = "$" + (this.pairs.value.cattr.value + this.pairs.growth.cattr.value);
	}

	*column(column) {
		for (let [name, row] of this.rows.entries()) {
			yield [name.toLowerCase(), row["_" + column].value.value];
		}
	}
}


