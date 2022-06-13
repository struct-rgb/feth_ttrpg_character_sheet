

/**
 * Options for initializing a new CategoryElement
 * @typedef {object} CategoryElementOptions
 * @property {string} title - a title for the element
 * @property {string} description - a description for the element
 * @property {boolean} reorderable - whether this element should be reorderable
 * @property {boolean} removable - whether this element should have a remove button
 * @property {CategoryElementCallback} onremove - called when element is removed; action canceled if falsy value returned
 * @property {CategoryElementCallback} ontoggle - called when element is toggled; action canceled if falsy value returned
 * @property {string} key - string to embed as a data attribute on this element's dt
 */

/**
 * Options for initializing a new Cell
 * @typedef {object} CellOptions
 * @property {string} key - name of the field in the map to set on update
 * @property {object} map - map in which the value is to be stored
 * @property {number} init - value to initialize the key to
 * @property {Function} compute - 
 * @property {boolean} editable - 
 * @property {Array} affects - other cells that depend on the value of this cell
 * @property {Function} onrefresh -
 * @property {string} prefix - string to put before the input
 * @property {string} suffix - string to put after the input
 **/

class Cell {

	static compute = function (cell) {
		if (cell.editable) {
			return cell.input.value;
		}
		return 0;
	}

	constructor(options) {
		console.log(options);

		if (!("map" in options)) {
			throw new Error("Cell must have associated map!");
		}

		if (!("key" in options)) {
			throw new Error("Cell must have associated key!");
		}

		if (options.key in options.map) {
			throw new Error("Cell key is already used by map");
		}

		const init         = Number(options.init) || 0;
		this.map           = options.map;
		this.key           = options.key;
		this.root          = document.createElement("td");
		this.map[this.key] = init;
		this.compute       = options.compute   || Cell.compute;
		this.editable      = options.editable  || false;
		this.affects       = options.affects   || [];
		this.onrefresh     = options.onrefresh || (() => {});
		
		if ("prefix" in options) {
			const textnode = document.createTextNode(options.prefix);
			const span     = document.createElement("span");
			span.appendChild(textnode);
			span.classList.add("punctuation");
			this.root.appendChild(span);
		}

		const inputID  = "Cell" + Date.now();
		const label    = document.createElement("label");
		const labeltxt = document.createTextNode(String(init));
		label.htmlFor  = inputID;

		label.appendChild(labeltxt);
		this.root.appendChild(label);
		this._text = labeltxt;

		if (options.editable) {
			label.classList.add("datum");

			const input    = document.createElement("input");
			input.type     = "number";
			input.min      = 0;
			input.max      = 100;
			input.value    = init;
			input.id       = inputID;
			input.name     = inputID;

			input.classList.add("hidden-field");
			input.classList.add("simple-border");
			this.input     = input;

			input.oninput  = (() => {
				this.refresh();
			});

			this.root.appendChild(input);
		} else {
			this.input = null;
			label.classList.add("computed");
		}

		if ("suffix" in options) {
			const textnode = document.createTextNode(options.suffix);
			const span     = document.createElement("span");
			span.appendChild(textnode);
			span.classList.add("punctuation");
			this.root.appendChild(span);
		}
	}

	refresh() {
		const value        = Number(this.compute(this));
		this._text.data    = value;
		this.map[this.key] = value;
		for (let affected of this.affects) {
			affected.refresh();
		}
		this.onrefresh(this);
	}
}

class StatsTable {

	constructor(values) {
		// this.stats       = new Map();
		// this.identifiers = new Set();

		this.root  = document.createElement("div");
		this.table = document.createElement("table");
		this.row   = document.createElement("tr");
		this.root.appendChild(this.table);

		// for (let pair of values) {

		// 	const [text, key] = pair;

		// 	const name = "listing_" + this.identity + "_" + key;
		// 	const tr   = document.createElement("tr");
		// 	const th   = document.createElement("th");
		// 	th.appendChild(document.createTextNode(text))
		// 	tr.appendChild(th);

		// 	const cell = new StatsCell(template);
		// 	tr.appendChild(cell.root);

		// 	this.stats.set("key", input);
		// 	this.table.appendChild(tr);
		// }


	}

	addRow() {
		const row = document.createElement("tr");
		this.row  = row;
		this.table.appendChild(row);
		return this;
	}

	addInputCell(options) {
		const cell = new Cell(options);
		this.row.appendChild(cell.root);
		return this;
	}
	
	addTitle(title) {
		const element = document.createElement("th");
		element.appendChild(document.createTextNode(title));
		this.row.appendChild(element);
		return this;
	}

	// get(key) {

	// }

	// set(key, value) {

	// }

	// getState() {
	// 	const state = {};
	// 	for (let [key, value] of this.stats.entries()) {
	// 		state[key] = value;
	// 	}
	// 	return state;
	// }

	// setState() {
	// 	for (let key of this.stats) {
	// 		this.stats.set(key, state[key] || 0);
	// 	} 
	// }
}

// const template = {
// 	key: "",
// 	init: 0,
// 	map: {},
// 	affects: new Set(),
// 	compute: function(cell) {},
//  onrefresh: function(cell) {}
// 	prefix: "",
// 	suffix: "",
//  editable:
// };

function setup() {
	console.log("setup");
	t = new StatsTable();
	document.getElementById("body").appendChild(t.root);
	m = {};

	(t
		.addRow()
		.addTitle("STR")
		.addInputCell({
				key       : "strength",
				init      : 0,
				map       : m,
				affects   : new Set(),
				compute   : null,
				onrefresh : null,
				editable  : true,
			}));

	// let v = new Cell({
	// 	key       : "computed",
	// 	init      : 0,
	// 	map       : m,
	// 	affects   : new Set(),
	// 	compute   : (cell) => cell.map.value + 10,
	// 	onrefresh : null,
	// 	prefix    : "(",
	// 	suffix    : ")",
	// 	editable  : false,
	// });

	// c = new Cell({
	// 	key       : "value",
	// 	init      : 0,
	// 	map       : m,
	// 	affects   : new Set([v]),
	// 	compute   : null,
	// 	onrefresh : null,
	// 	prefix    : "(",
	// 	suffix    : ")",
	// 	editable  : true,
	// });
	// t.root.appendChild(c.root);
	// t.root.appendChild(v.root);


}




// function register_cascade(input, dependants) {
// 	input.oninput = (() => {
// 		for (let dependants of dependants) {
// 			dependant.register
// 		}
// 	});
// }