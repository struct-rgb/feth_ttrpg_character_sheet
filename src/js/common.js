
/* global Calculator */
/* global process */

const inBrowser = 
	typeof window !== "undefined" && typeof window.document !== "undefined";

const inNode =
	typeof process !== "undefined" && process.versions != null && process.versions.node != null;

function isObject(o) {
	return typeof o === "object" && !Array.isArray(o) && o !== null;
}

function *valuesOf(object, keys) {
	for (let key of keys) {
		yield object[key];
	}
}

const Iter = {
	
	*chain(...iterables) {
		for (let iterable of iterables) {
			yield* iterable;
		}
	},

	*map(iterable, callback, thisArg) {
	
		let index = 0;

		for (let each of iterable) {
			yield callback.call(thisArg, each, index++, iterable);
		}
	},

	any(iterable, predicate) {
		for (let each of iterable) if (predicate(each)) return true;
		return false;
	},

	all(iterable, predicate) {
		for (let each of iterable) if (!predicate(each)) return false;
		return true;
	},

	count(iterable, predicate) {
		let count = 0;
		for (let each of iterable) count += Number(predicate(each));
		return count;
	},

	is(obj) {
		if (obj == null) return false;
		return typeof obj[Symbol.iterator] === "function";
	}
	
};

Array.prototype.extend = function(...args) {
	this.push(...args);
	return this;
};

Array.prototype.chunk = function(size) {
	return this.reduce(function(result, value, index, array) {
		if (index % size == 0)
			result.push(array.slice(index, index + size));
		return result;
	}, []);
};

Array.prototype.flatten = function() {
	
	const final = [];

	for (let each of this) {
		if (each instanceof Array) {
			final.extend(...each);
		} else {
			final.push(each);
		}
	}

	return final;
};

Array.prototype.random = function() {
	return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.count = function(predicate) {
	return Iter.count(this, predicate);
};

Array.prototype.any = function(predicate) {
	return Iter.any(this, predicate);
};

Array.prototype.all = function(predicate) {
	return Iter.all(this, predicate);
};

Array.prototype.clear = function() {
	this.length = 0;
	return this;
};

Set.prototype.union = function(other) {

	const set = new Set();

	for (let member of this) {
		set.add(member);
	}

	for (let member of other) {
		set.add(member);
	}

	return set;
};

Set.prototype.intersect = function(other) {

	const set = new Set();

	for (let member of this) {
		if (other.has(member)) set.add(member);
	}

	for (let member of other) {
		if (this.has(member)) set.add(member);
	}

	return set;
};

Set.prototype.extend = function(other) {

	for (let each of other) {
		this.add(each);
	}

	return this;
};

function choice(options) {

	/* if not asked to choose return the passed object */
	if (!(options instanceof Array)) return options;

	/* if given no options choose none */
	if (options.length == 0) return null;

	/* if given one option choose it */
	if (options.length == 1) return options[1];

	/* if not interactive return the first option */
	if (!choice.interactive) return options[1];

	/* put together a prompt of choices */
	const list = Array.from(options, (item, index) => `${index + 1}. ${item}`);
	const text = `Enter the number of your choice:\n${list.join("\n")}`;

	/* keep asking until given a valid choice */
	for (;;) {
		const response = prompt(text);

		if (response == null || response == "") return options[0];

		const num = Number(response);

		if (Number.isNaN(num) || num < 1 || list.length < num) continue;

		return options[response - 1];
	}
}


const CHOICES_REGEX = /(?<begin>\d)+(?:\s*-\s*(?<end>\d+))?/g;

function parseChoices(string, asSet=false) {

	const chosen = asSet ? new Set() : [];
	const add    = asSet ? "add"     : "push";

	for (let range of string.matchAll(CHOICES_REGEX)) {

		// get our bounds from the parsed data
		const begin = Number(range.groups.begin);
		const end   = Number(range.groups.end);

		// if there's not "range" add the number and continue
		if (begin == end || range.groups.end == null) {
			chosen[add](begin);
			continue;
		}

		// since we do have a range walk through it
		const offset = Number(begin < end) || -1;

		for (let i = begin; i != end; i += offset) {
			chosen[add](i);
		}
	
		chosen[add](end);
	}

	return chosen;
}

/**
 * @typedef {Object} ChoicesOptions
 * @property {String}  message - prompt to display to the user in the dialog
 * @property {Boolean} unique  - if true; duplicate selects will be removed
 */

function choices(options, unique=true) {

	const chosen = [];

	/* if not asked to choose return the passed object */
	if (!Iter.is(options)) return options;

	/* if given no options choose none */
	if (options.length == 0) return chosen;

	/* if not interactive return the empty options */
	if (!choice.interactive) return chosen;

	/* put together a prompt of choices */
	const list = Array.from(options);
	const show = Array.from(options,
		(item, index) => `${index + 1}. ${item || "Default"}`
	);
	const text = `Enter the numbers of your choices:\n${show.join("\n")}`;

	/* keep asking until given a valid choice */
	for (;;) {
		const response = prompt(text);

		if (response == null || response == "") return chosen;

		let   error   = null;
		const numbers = parseChoices(response, unique);

		for (let num of numbers) {

			if (num < 1 || list.length < num) {
				chosen.clear();
				error = `Number ${num} is outside of range.`;
				break;
			}

			chosen.push(num);
		}

		if (error) {
			alert(error);
			continue;
		}

		// convert chosen indicies into options
		for (let i = 0; i < chosen.length; ++i)
			chosen[i] = list[chosen[i] - 1];

		return unique ? new Set(chosen) : chosen;
	}
}

choice.interactive = true;

class TagSetWidget {

	static TagData = function (key, row, locked) {
		return {id: key, row: row, locked: locked};
	};

	constructor(label, ondelete, locked=false) {

		this.map = new Map();

		this._toadd = element("input", {
			class: ["simple-border", "short-meter"],
			attrs: {
				type     : "text",
				disabled : locked,
				hidden   : locked,
			},
		});

		this._button = element("input",  {
			class   : ["simple-border"],
			attrs   : {
				value    : "Add",
				type     : "button",
				disabled : locked,
				hidden   : locked,
				onclick  : (() => {
					this.add(this._toadd.value);
				}),
			},
		});

		this.ondelete = ondelete;

		this._table = element("div");

		this.root = element("div", [
			label, this._button, this._toadd,
			this._table,
		]);

		this.lock(locked);
	}

	lock(value) {
		this._toadd.hidden    = value;
		this._toadd.disabled  = value;
		this._button.hidden   = value;
		this._button.disabled = value;
	}

	add(tag, locked=false) {

		if (this.map.has(tag)) return;

		const row = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : tag,
				onclick : (() => {
					if (locked) {
						alert("Tag is locked.");
					} else {
						this.delete(tag);
						this.ondelete();
					}
				})
			},
		});

		this.map.set(tag, TagSetWidget.TagData(tag, row, locked));
		this._table.appendChild(row);
	}

	get size() {
		return this.map.size;
	}

	clear() {
		for (let key of this.map.keys()) {
			this.delete(key);
		}
	}

	delete(tag) {
		if (!this.map.has(tag)) return;
		this.map.get(tag).row.remove();
		this.map.delete(tag);
	}

	entries() {
		return this.map.entries();
	}

	*forEach() {

	}

	*locked() {
		for (let value of this.map.values()) {
			if (value.locked) yield value;
		}
	}

	has(tag) {
		return this.map.has(tag);
	}

	keys() {
		return this.map.keys();
	}

	values() {
		return this.map.keys();
	}

}

class BigButton {

	constructor(text, onclick) {

		onclick = onclick || (() => console.log(`BigButton ${text} clicked!`));
		this.onclick = onclick;

		this.idno          = uniqueID();
		this.label         = element("button", text);
		this.label.htmlFor = this.idno;
		this.label.onclick = (e) => {
			this.input.click();
		};
		this.label.classList.add("custom-file-input", "simple-border");

		this.input         = element("input");
		this.input.id      = this.idno;
		this.input.type    = "button";
		this.input.onclick = onclick;
		this.input.classList.add("no-display");
	}

}

class SwapText {
	constructor(modes, hidden=false, base="div") {

		this.root = element(base);

		this.mode  = 0;
		this.modes = modes.map((mode) => {

			if (mode instanceof HTMLElement) {
				return mode;
			}

			return element("span", {
				content: mode,
			});
		});

		if (!hidden) {
			this.root.onclick = (() => {
				this.next();
			});
		}

		this.root.appendChild(this.modes[0]);
	}

	next() {
		this.modes[this.mode].remove();
		this.mode = (this.mode + 1) % this.modes.length;
		this.root.appendChild(this.modes[this.mode]);
	}

	show(mode) {
		this.modes[this.mode].remove();
		this.mode = mode;
		this.root.appendChild(this.modes[this.mode]);
	}
}

class Toggle {

	constructor(title, value, fn) {

		this._fn       = fn || ((bool) => !bool);
		this._original = value;
		this._check    = document.createTextNode("");

		this.root = element("button", {
			attrs   : {
				onclick: () => {
					this.checked = !this.checked;
					this._fn.call(this, this.checked);
				},
			},
			content : element("span", [this._check, title]),
			class   : ["simple-border"],
		});

		this.checked = value;
	}

	get checked() {
		return this._checked;
	}

	set checked(value) {
		this._checked = value;

		if (this._checked) {
			this.root.classList.add("selected-text");
			this._check.data = "☑ ";
		} else {
			this.root.classList.remove("selected-text");
			this._check.data = "☐ "; 
		}
	}

	reset() {
		this.checked = this._original;
	}

}

/**
 * Creates a enumerated type with a bidirectional string/number mapping.
 */
class ConfigEnum {

	/**
	 * Create an instance
	 * @param {number} defnum - default number for lookup fail
	 * @param {string} defstr - default string for lookup fail
	 * @param {Array.String} names - enum elements
	 */
	constructor(defnum, defstr, names) {
		this.defstr  = defstr;
		this.defnum  = defnum;

		this.strings = new Map();
		this.numbers = new Map();

		for (let i = 0; i < names.length; ++i) {
			this.strings.set(i, names[i]);
			this.numbers.set(names[i], i);
		}

		this.min = 0;
		this.max = names.length - 1;
	}

	/**
	 * Map the string to its corresponding number; on fail return a default
	 * @param {string} string - an enum string
	 */
	asNumber(string) {
		if (!this.numbers.has(string)) return this.defnum;
		return this.numbers.get(string);
	}

	/**
	 * Map the number to its corresponding string; on fail return a default
	 * @param {number} number - an enum number
	 */
	asString(number) {
		if (!this.strings.has(number)) return this.defstr;
		return this.strings.get(number);
	}

}

class Version {

	static PATTERN = new RegExp("^(\\d+)\\.(\\d+)\\.(\\d+)$");

	static CURRENT = new Version("4.3.1");

	constructor(string) {
		if (string == null) {
			this.major = 0;
			this.minor = 0;
			this.patch = 0;
		} else {
			const match = string.match(Version.PATTERN);
			if (!match) throw new Error("Invalid version string");

			this.major = Number(match[1]);
			this.minor = Number(match[2]);
			this.patch = Number(match[3]);
		}
	}

	compare(that) {
		if (typeof that === "string") {
			that = new Version(that);
		}

		return (
			(this.major - that.major)
			|| (this.minor - that.minor)
			|| (this.patch - that.patch)
		);
	}

	same(that) {
		return this.compare(that) == 0;
	}

	different(that) {
		return this.compare(that) != 0;
	}

	newer(that) {
		return this.compare(that) > 0;
	}

	older(that) {
		return this.compare(that) < 0;
	}

	toString() {
		return [this.major, this.minor, this.patch].join(".");
	}
}

function wrap(...args) {
	return args.join("");
}

function ellipse(string, limit) {
	if (limit == null) throw new Error("limit argument is mandatory");
	return string.length > limit ?  `${string.slice(0, limit)}...` : string;
}

function nameof(value) {
	const  type = typeof value;
	const  name = type == "object" ? value.constructor.name : type;
	return name;
}

const capitalize = (function() {

const FREG = new RegExp("^\\w");

return function(string) {
	return string.replace(FREG, (char) => char.toUpperCase());
};

})();

function uniqueID() {
	const  base = "00000000-0000-4000-0000-000000000000";
	return base.replace(/0/g, character => {
		const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
		const randomChar = character ^ randomByte & 0xF >> character / 4;
		return randomChar.toString(16);
	});
}

/**
 * Create an HTMLElement
 * @param {string} type - element name
 * @param {object} content - content to add to child nodes
 * @param {string} classes - css classes to add to this element
 * @returns {HTMLElement} the element
 */
const element = (function () {

/**
 * Add the child elements from the content parameter for {@link element}
 * @param {HTMLElement} element - the parent element
 * @param {object} content - content to add to child nodes
 */
function content_action(element, content) {

	if (content === null) {
		console.warn("make sure null content is intented behavior");
		return;
	}

	const ctype = typeof content;

	if (ctype == "string" || ctype == "number") {
		const textnode = document.createTextNode(String(content));
		element.appendChild(textnode);
	} else if (content instanceof HTMLElement || content instanceof Text) {
		element.appendChild(content);
	} else if (content.constructor.name == "Symbol") {
		// kind of hack but an efficeient way to deal with ASTs
		const textnode = document.createTextNode(String(content.value));
		element.appendChild(textnode);
	} else if (content instanceof Array) {
		for (let each of content) {
			if (each != null) content_action(element, each);
		}
	} else {

		let invalid = true;

		/* css style classes */
		if ("class" in content) {
			element.classList.add(...content.class);
			invalid = false;
		}

		/* handle recursive content */
		if ("content" in content) {
			content_action(element, content.content);
			invalid = false;
		}

		/* set fields on the element */
		if ("attrs" in content) {
			for (let field in content.attrs) {
				element[field] = content.attrs[field];
			}
			invalid = false;
		}

		/* if this is an invalid object then error out*/
		if (invalid) {
			console.error(content);
			throw Error("invalid content");
		}

	}
}

function element(type, content, ...classes) {

	const element = document.createElement(type);

	if (content) {
		content_action(element, content);
	}

	if (classes && classes.length > 0) {
		element.classList.add(...classes);
	}

	return element;
}

return element;

})();

function tag(name, text) {
	return `<${name}>${text}</${name}>`;
}

function delimit(delimiter, array) {
	return array.reduce((accumulator, element) => (
		(
			accumulator.length
				? accumulator.push(
					typeof delimiter == "function"
						? delimiter()
						: delimiter,
					element,
				)
				: accumulator.push(element)

			, /* comma operator */

			accumulator
		)
	), []);
}

function assume(first, other) {
	return first == null ? other : first;
}

function tooltip(content, tooltip, ondisplay=null) {

	const tip = element("span", {
		class   : ["ttt", "ttts"],
		content : tooltip
	});

	return element("div", {
		class   : ["tt", "tts"],
		content : (
			content instanceof Array
				? content.concat([tip])
				: [content, tip]
		),
		attrs: {
			onpointerenter: ondisplay ? ondisplay : undefined,
		}
	});
}

function uniqueLabel(content, forElement) {
	const idno  = uniqueID();
	const label = element("label", {content: content, attrs: {htmlFor: idno}});
	forElement.id = idno;
	return label;
}

/**
 * Options for initializing a new AttributeCell
 * @typedef {object} CellOptions
 * @property {string} before - text to put before label
 * @property {string} after - text to put after label
 * @property {boolean} edit - whether the cell accepts input
 * @property {strong} shown - the initial text to show on creation
 * @property {number} value - the initial value upon creation
 * @property {number} min   - the min value the cell can hold
 * @property {number} max   - the max value the cell can hold
 * @property {number} step  - the step for the input field
 * @property {string} root  - root element tag
 * @property {number} def   - default value, used on creation of not value
 */

function attrinput(textnode, options, oninput) {

	const input = element("input", {
		class: ["simple-border", "hidden-field"],
		attrs: {
			type    : "number",
			min     : assume(options.min, 0),
			max     : assume(options.max, 100),
			value   : assume(options.value, assume(options.def, 0)),
			step    : assume(options.step, 1),
			oninput : oninput,
		},
	});

	const label = uniqueLabel(textnode, input);
	label.classList.add("datum");

	return [input, element("span", [label, input])];
}

function attrselect(textnode, options, oninput) {
	const select = element("select", {

		class: ["simple-border", "hidden-field"],

		content: options.select.map((name, index) => 
			element("option", {attrs: {value: index}, content: name})
		),

		attrs: {
			value   : assume(options.value, assume(options.def, 0)),
			oninput : oninput,
		}
	});

	const label = uniqueLabel(textnode, select);
	label.classList.add("datum");

	return [select, element("span", [label, select])];
}

/**
 * A configurable table cell with a number input.
 */
class AttributeCell {

	constructor(options, trigger) {
		options       = options || {};
		this.text     = document.createTextNode(assume(options.shown, ""));
		this._trigger = trigger || options.trigger || (x => x);

		const [input, span] = (options.select ? attrselect : attrinput)(this.text, options, (() => {
			this.value = this.input.value;
		}));

		this.input = input;
		this._def  = assume(options.def, 0);

		this.root  = element(
			assume(options.root, "td"), [

				"before" in options
					? element("span", options.before, "punctuation") : null,

				!("edit" in options) || options.edit
					? span : element("span", this.text, "computed"),

				"after" in options
					? element("span", options.after, "punctuation") : null,
			]
		);
	}

	refresh() {
		this.text.data = String(this._shown());
	}

	get value() {
		return Number(this.input.value);
	}

	set value(value) {
		this.input.value = value;
		this.refresh();
	}

	get shown() {
		return this.text.data;
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
		return this.input.max;
	}

	set maximum(value) {
		this.input.max = value;
		if (this.input.value > value) {
			this.input.value = value;
		}
	}

	get default() {
		return this._def;
	}

	set default(value) {
		this._def = value;
	}

	clear() {
		this.value = this.default;
	}

	_shown() {
		return this._trigger(this.value);
	}
}

class VariableTable {

	static CONFIG = {
		/* edit */
		true  : {
			/* comma */
			true : {
				edit  : true,
				root  : "span",
				value : 0,
				shown : "0",
				min   : 0,
				max   : 999,
				after : ","
			},
			false : {
				edit  : true,
				root  : "span",
				value : 0,
				shown : "0", 
				min   : 0,
				max   : 999
			},
			space : {
				edit  : true,
				root  : "span",
				value : 0,
				shown : "0", 
				min   : 0,
				max   : 999
			},
			grow : {
				edit  : true,
				root  : "span",
				value : 0,
				shown : "0",
				min   : 0,
				max   : 999,
				before : "(",
				after  : ")"
			},
		},

		false : {
			/* comma */
			true : {
				edit  : false,
				root  : "span",
				value : 0,
				shown : "0",
				min   : 0,
				max   : 999,
				after : ","
			},
			false : {
				edit  : false,
				root  : "span",
				value : 0,
				shown : "0", 
				min   : 0,
				max   : 999
			},
			space : {
				edit  : false,
				root  : "span",
				value : 0,
				shown : "0", 
				min   : 0,
				max   : 999
			},
			grow : {
				edit  : false,
				root  : "span",
				value : 0,
				shown : "0", 
				min   : 0,
				max   : 999,
				before : "(",
				after  : ")"
			}
		},
	};

	constructor(refresher, context, obj, length) {
		this.refresher = refresher;
		this.length    = length;
		this.obj       = obj;
		this.context   = context;
		this.CONFIG    = VariableTable.CONFIG;
	}

	static NOACTION = ((base, variable) => variable());

	func(name, action=VariableTable.NOACTION) {
		const variable = new Calculator.Env(
			Calculator.Env.RUNTIME, this.context
		).func(name);

		return ((base) => {
			return action(base, variable);
		});
	}

	/**
	 * Options to pass a SheetValue method for creating a cell
	 * @typedef  {object}CellOpts -
	 * @property {string}   var    - the key to use for the variable name
	 * @property {function} call   - a custom function to execute on finish
	 * @property {object}   obj    - object to place the AttributeCell in (def)
	 * @property {string}   key    - a key for the obj
	 * @property {boolean}  edit   - whether the cell should be editable
	 * @property {CellOpts} range  - causes the two values to become a range
	 */

	/**
	 * Create an AttributeCell for use as a table element
	 * @param {CellOpts} opt - a set of options
	 * @param {boolean} comma - should the cell show a trailing comma?
	 * @returns {AttributeCell} span cell based on params
	 */
	cell(opt, comma=false) {

		if (opt instanceof AttributeCell) {
			/* assume that the caller took care of everything */
			return opt;
		}

		if (!("var" in opt) || typeof opt.var != "string") {
			throw new Error("options must contain {var: <string>}");
		}

		if (!(opt.var in this.context)) {
			throw new Error(`'${opt.var}' not defined for context`);
		}

		const edit   = assume(opt.edit, true);
		const obj    = opt.obj    || this.obj;
		const key    = opt.key    || opt.var.split("|").at(-1);
		const call   = this.func(opt.var, opt.call);
		const config = this.CONFIG[edit][opt.style || comma];

		const cell   = new AttributeCell(config, call);
		obj[key]     = cell;

		// TODO find a cleaner way to accomplish this
		this.refresher.register(cell,
			this.refresher.sheet.compiler.dependancies(opt.var), [opt.var]);

		return cell;
	}

	/**
	 * Creates a row in the variable table
	 * @param {string|HTMLElement} title - heading for the row
	 * @param {CellOpts} opts - options for the cells in the row
	 * @returns {HTMLElement} the created row
	 */
	row(title, ...opts) {

		if (opts.length == 0) {
			throw new Error("row must have one or more options");
		}

		const colSpan = this.length / opts.length;

		if (!Number.isInteger(colSpan)) {
			throw new Error(
				`number of options must be a factor of ${this.length}`
			);
		}

		const els  = [element("th", title)];
		const last = opts.length - 1;

		for (let i = 0; i < opts.length; ++i) {

			const comma = opts.length != 1 && i < last;

			const style_class = (
				opts.length != 1
					? i == 0
						? "padded-cell-left"
						: i < last
							? "padded-cell-center"
							: "padded-cell-right"
					: "padded-cell"
			);

			if (opts[i].range) {
				
				const min = opts[i];
				const max = opts[i].range;

				els.push(element("td", {
					attrs   : {colSpan: colSpan << 1},
					class   : ["center", style_class],
					content : [
						this.cell(min, false).root,
						element("span", " - ", max.edit ? "datum" : "computed"),
						this.cell(max, false).root,
					],
				}));

				continue;
			}

			els.push(element("td", {
				class   : ["center", style_class],
				attrs   : {colSpan: colSpan}, 
				content : this.cell(opts[i], comma).root,
			}));
		}

		return element("tr", els);
	}

	span(title, ...opts) {

		if (opts.length == 0) {
			throw new Error("span must have one or more options");
		}

		const els  = [element("strong", `${title} `)];
		const last = opts.length - 1;

		for (let i = 0; i < opts.length; ++i) {
			const comma = opts.length != 1 && i < last;
			els.push(this.cell(opts[i], comma).root);
		}

		return element("span", els);
	}

	range(optsA, optsB) {
		optsA.range = optsB;
		return optsA;
	}

	wideth(content) {
		return element("tr",
			element("th", {
				content : content,
				attrs   : {colSpan: this.length},
			})
		);
	}

}

const hilight = (function() {

const BILREGEX = new RegExp([
	"(\\{[0-9]+\\})",
	"( [0-9]+)",
	"([A-Za-z_$]+(?:\\|[0-9A-Za-z_$|]+))",
	"\\[([^\\]]*)\\]"
].join("|"));

return function(string) {

	const tokens  = string.split(BILREGEX).filter(x => x != null);
	const merge   = [];

	let even = false;
	for (let token of tokens) {
		merge.push(even ? element("span", token, "datum") : token);
		even = !even;
	}
	
	return element("span", merge);
};

})();

const Filter = (function() {

class Toggle {

	constructor(title, value, check) {

		this._input = element("button", {
			attrs   : {
				onclick: () => {
					this.checked = !this.checked;
					this.refresh(this.checked);
				},
			},
			content : title,
			class   : ["tight"],
		});

		this._original = value;
		this.checked   = value;

		this.root = this._input;

		// if (check instanceof Array) {

		// 	this.swap = new SwapText([], true);

		// } else {
		this.fn   = check;
		// }
	}

	refresh(value) {
		this.fn.call(this, value);
	}

	get checked() {
		return this._checked;
	}

	set checked(value) {
		this._checked = value;

		if (this._checked) {
			this._input.classList.add("toggle-on");
			this._input.classList.remove("toggle-off");
			// if (this.swap) this.swap.show(1);
		} else {
			this._input.classList.add("toggle-off");
			this._input.classList.remove("toggle-on");
			// if (this.swap) this.swap.show(0);
		}
	}

	reset() {
		this.checked = this._original;
	}

	apply(feature) {
		return this.fn(feature, this);
	}

}

class Group extends Array {

	static AND(a, b) {
		return a && b;
	}

	static OR(a, b) {
		return a || b;
	}

	static END = null;

	static NONE = null;

	constructor(func, start, ...args) {
		super(...args);
		this._func  = func;
		this._start = start;
	}

	apply(feature) {
		let value = this._start;
		for (let item of this) {
			if (!item.checked) continue;
			value = this._func(value, item.apply(feature));
		}
		return value;
	}

	get checked() {
		return this.reduce((a, b) => a || b.checked, false);
	}


	reset() {
		for (let item of this) {
			item.reset();
		}
	}

}

/**
 * Options for initializing a new SortFilter
 * @typedef {object} SortFilterOptions
 * @property {string} value - the default value
 * @property {function} trigger - function to execute on select input
 * @property {Feature} model - model type this selects from
 * @property {array.<string>} name - names to add and the order to add them
 * @property {array} content - the contents of this element
 */

class Select {

	constructor(template) {

		this._options = template.options;
		this._select  = element("select", {
			class : ["simple-border"],
			attrs : {
				value   : template.value,
				oninput : template.trigger,
			},
		});

		this._filters  = new Group(Group.AND, true);
		this._model    = template.model;
		this._trigger  = template.trigger;

		let   group   = Group.NONE;
		const content = [];
		for (let item of template.content) {

			if (item === Group.END) {
				if (group !== Group.NONE) {
					this._filters.push(group);
				}
				group = Group.NONE;
			}
			else
			if (item instanceof Toggle) {
				item.refresh = (() =>{
					this.filter();
				});

				content.push(item.root);

				if (group !== Group.NONE) {
					group.push(item);
				} else {
					this._filters.push(item);
				}
			} 
			else
			if (item instanceof Group) {
				group = item;
			} else {
				content.push(item);
			}
		}

		this.root = element("span", [
			tooltip(this._select, content), 
		]);
	
		this.filter();
	}

	reset() {
		for (let filter of this._filters) {
			filter.reset();
		}
		this.filter();
	}

	filter() {
		while (this._select.lastChild) {
			this._select.lastChild.remove();
		}

		for (let option of this._options) {
			const feature = this._model.get(option.value);
			if (this._filters.apply(feature)) {
				this._select.appendChild(option);
			}
		} 
	}

	options() {
		return this._select.childNodes;
	}

	get value() {
		return this._select.value;
	}
}

return {
	Toggle: Toggle,
	Group: Group,
	Select: Select,
};

})();

/**
 * Class representing a skill grade
 */
class Grade {

	static APTITUDE = new ConfigEnum(0, "Normal", [
		"Normal", "Talent", "Weakness", "Budding", "BuddingWeakness"
	]);

	static list = [
		new Grade("E",  0,   0), new Grade("E+",  1,   1),
		new Grade("D",  2,   2), new Grade("D+",  3,   4),
		new Grade("C",  4,   8), new Grade("C+",  5,  16),
		new Grade("B",  6,  36), new Grade("B+",  7,  50),
		new Grade("A",  8,  64), new Grade("A+",  9,  80),
		new Grade("S", 10, 150), new Grade("S+", 11, 200),
		new Grade("X", 12, 300),
	];

	static toNumber = (function () {
		const map = new Map(Grade.list.map((grade) => [grade.name, grade.number]));
		return (name) => map.get(name);
	})();

	static fromNumber = (function () {
		const map = new Map(Grade.list.map((grade) => [grade.number, grade.name]));
		return (number) => map.get(number);
	})();

	/**
	 * Converts a number of points to the corresponding letter grade
	 * @static
	 * @param {number} points - number of points
	 * @returns {string} the letter grade
	 */
	static for(points, aptitude) {
		const t     = Grade.threshold(aptitude);
		const m     = Grade.multiplier(aptitude);
		const final = (
			(t && points >= t) ? m * t + 2.0 * (points - t) : m * points
		);

		return Grade.list.reduce((a, b) => b.points > final ? a : b).name;
	}

	static threshold(aptitude) {
		switch (aptitude) {
		case 0  : return  0;
		case 1  : return  0;
		case 2  : return  0;
		case 3  : return 16;
		case 4  : return 10;
		default : throw new Error("Invalid aptitude.");
		}
	}

	static multiplier(aptitude) {
		switch (aptitude) {
		case 0  : return 1.0;
		case 1  : return 2.0;
		case 2  : return 0.5;
		case 3  : return 1.0;
		case 4  : return 0.5;
		default : throw new Error("Invalid aptitude.");
		}
	}

	static TPTABLE = [
		[15, 0, 0, 1, 2, 1, 2, 1, 2, 1, 10, 9, 0],
		[ 0, 0, 0, 0, 0, 1, 2, 1, 2, 1,  2, 1, 0],
		[ 0, 0, 0, 0, 0, 0, 0, 1, 2, 1,  2, 1, 0],
	];

	/**
	 * Create a grade
	 * @param {string} name - letter for the grade
	 * @param {number} points - minimum number of points to acheive the grade
	 */
	constructor(name, number, points) {
		this.name   = name;
		this.number = number;
		this.points = points;
	}
}


const buffer = new Uint8Array(1);

function d4() {
	return (crypto.getRandomValues(buffer)[0] & 3) + 1;
}

const cardinal = ["North", "South", "East", "West"];

function _raijin_slots(dice) {
	return Array.from(Array(dice), () => cardinal[d4() - 1]);
}

const _raijin = (function() {

function iteration(stop) {
	let   x   = 0;
	let   y   = 0;
	let   i   = 0;
	let   key = `${x},${y}`;
	const set = new Set();

	do {

		set.add(key);

		const roll = d4();

		switch (roll) {
		case 1  : ++y; break;
		case 2  : --y; break;
		case 3  : ++x; break;
		case 4  : --x; break;
		default : break;
		}
		key = `${x},${y}`;

	} while(!set.has(key) && i++ < stop);

	return set.size;
}

return function(iterations, stop=8) {

	const map   = new Map();

	for (let i = 0; i < iterations; ++i) {
		const tiles = iteration(stop);
		map.set(tiles, map.has(tiles) ? map.get(tiles) + 1 : 1);
	}

	const buckets = [];

	for (let [tiles, iters] of map) {
		buckets.push([tiles, (iters/iterations) * 100]);
	}
	
	return buckets.sort((a, b) => a[0] - b[0]);
};

})();

class Theme {

	constructor(name, description, stylesheet, canvasStyles) {
		this.name        = name;
		this.description = description;
		this.stylesheet  = stylesheet;
	}

	get unit() {
		return getComputedStyle(document.body).getPropertyValue("--gambit-unit");
	}

	get tile() {
		return getComputedStyle(document.body).getPropertyValue("--gambit-tile");
	}

	get border() {
		return getComputedStyle(document.body).getPropertyValue("--gambit-border");
	}

	get background() {
		return getComputedStyle(document.body).getPropertyValue("--gambit-background");
	}

	hit_penalty(penalty) {
		return getComputedStyle(document.body)
			.getPropertyValue(`--gambit-hit-${penalty}`);
	}

	static MAP = function() {

		const map = new Map();
		const add = (name, description, stylesheet) => (
			void map.set(name, new Theme(name, description, stylesheet))
		);

		add("Classic", "The classic look and feel.", "./src/css/light.css");
		add("Dark", "The ever popular alternative.", "./src/css/dark.css");
		add("Golden Deer", "A bad theme for the best house.", "./src/css/deer.css");
		add("Boneless", "For when you want to play as the protagonist.", "./src/css/boneless.css");
		add("Golden Fear", "Boneless mode but yellow.", "./src/css/golden_fear.css");
		add("Golden Egg", "Serious attempt at a gold theme.", "./src/css/golden_egg.css");
		add("Document", "The most minimal theme.", "./src/css/document.css");
		add("Toast", "Designed by Toast, for Toast.", "./src/css/toast.css");
		add("Hacker", "Boneless mode but green.", "./src/css/hacker.css");

		return map;
	}();

	static DEFAULT = "Classic";

	static get() {
		const store = localStorage.getItem("theme");
		return store && this.MAP.has(store) ? store : this.DEFAULT;
	}

	static active() {
		return this.MAP.get(this.get());
	}

	static set(key) {
		// DO reload if given the one we're using; good for css debug
		const theme = this.MAP.get(key || this.get());
		const style = document.getElementById("theme-link");
		style.setAttribute("href", theme.stylesheet);
		localStorage.setItem("theme", theme.name);
		return theme;
	}
}

function _big_damage(sheet, template) {

	/* template.detail  - whether to show just aggregate data or vs each foe
	 * template.level   - level to do math at
	 * template.classes - if you only want to see specific classes
	 */

	const env     = sheet.runenv;
	const level   = assume(template.level   , 1);
	const detail  = assume(template.detail  , false);
	const classes = assume(template.classes , 
		Array.from(sheet.myPresetter._class.options()).map(o => o.value)
	);

	sheet.myPresetter._level.value = level;

	const original = sheet.cb.activeID;
	const columns  = [];

	for (let item of sheet.wb.iter()) {
		
		// get up to date values
		sheet.refresher.refresh();

		// collect them 
		columns.push({
			name    : item.name,
			mt      : env.read("unit|total|mt"),
			doubles : env.read("unit|total|doubles"),
			mttype  : sheet.stats.secondary.mttype._shown(),
			hit     : env.read("unit|total|hit"),
			crit    : env.read("unit|total|crit"),
		});
	}

	sheet.tabs.tools.active = "NPCs";
	sheet.tabs.main.active  = "Tools";

	const interactive  = choice.interactive;
	choice.interactive = false;

	const rows = [];
	const ids  = [];

	for (let option of classes) {

		if (option.value == "None") continue;
		// if (option.value == "Dancer") continue;

		sheet.myPresetter._class._select.value = option;
		sheet.myPresetter._class._trigger();
		ids.push(sheet.create_npc());

		rows.push({
			name    : sheet.character.name,
			hp      : env.read("unit|total|hp"),
			doubled : env.read("unit|total|doubled"),
			avo     : env.read("unit|total|avo"),
			prot    : env.read("unit|total|prot"),
			resl    : env.read("unit|total|resl"),
			cravo   : env.read("unit|total|cravo"),
		});
	}

	choice.interactive = interactive;

	const final  = [];
	const mean   = {};
	const median = {};
	const stdev  = {};

	mean.class   = "<AVERAGE>";
	if (detail) mean.attacks = 0;
	median.class   = "<MEDIAN>";
	if (detail) median.attacks = 0;
	stdev.class   = "<STDEV>";
	if (detail) stdev.attacks = 0;


	for (let row of rows.sort(r => r.name)) {

		const results = {
			class: row.name
		};

		for (let column of columns) {

			const pkey = `${column.name} (%)`;
			const ckey = `${column.name} (c)`;

			if (!("attacks" in results)) {
				results["attacks"] = (column.doubles >= row.doubled) + 1;
			}

			if (!(pkey in mean)) mean[pkey] = 0;
			if (!(ckey in mean)) mean[ckey] = 0;
			if (!(pkey in median)) median[pkey] = [];
			if (!(ckey in median)) median[ckey] = [];
			if (!(pkey in stdev)) stdev[pkey] = [];
			if (!(ckey in stdev)) stdev[ckey] = [];

			const damage = Math.max(column.mt - (
				column.mttype == "STR" ? row.prot : column.mttype == "MAG" ? row.resl : 0
			), 1);

			const ratio   = (damage / row.hp);
			const percent = (ratio * results["attacks"] * 100);
			const hitrate = (Math.max(column.hit - row.avo, 0) / 100);
			const combats = Math.ceil(row.hp / (damage * hitrate * results["attacks"]));

			results[pkey]  = percent;
			results[ckey]  = combats;
			mean[pkey]    += percent;
			mean[ckey]    += combats;
			median[pkey].push(percent);
			median[ckey].push(combats);
			stdev[pkey].push(percent);
			stdev[ckey].push(combats);
		}

		if (detail) final.push(results);
	}

	const set = new Set(["class", "attacks"]);

	for (let key in mean) {
		if (set.has(key)) continue;
		mean[key] /= rows.length;
	}

	for (let key in median) {
		if (set.has(key)) continue;
		// console.log(key);
		const array = median[key].sort((a, b) => a - b);
		const lo    = Math .floor ((array.length - 1) / 2);
		const hi    = Math .ceil  ((array.length - 1) / 2);
		median[key] = (array[hi] + array[lo]) / 2;
	}

	for (let key in stdev) {
		if (set.has(key)) continue;
		// console.log(key);
		const array = stdev[key];
		const avg   = mean[key];
		stdev[key]  = Math.sqrt(array.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / array.length);
	}
	


	final.push(mean);
	final.push(stdev);
	final.push(median);

	sheet.cb.change(original);
	for (let id of ids) sheet.cb.remove(id);

	console.log(sheet.character.name);
	console.table(final);

}

function kwargsChecker(mandatory, optional) {
	return function (template) {
		
		// enforce certain template keys as mandatory
		for (let key of mandatory) {
			if (!(key in template)) throw new Error(
				`template object is missing key ${JSON.stringify(key)}`
			);
		}

		// fill in default valyes for the optional keys
		for (let key in optional) {
			if (!(key in template)) {
				template[key] = optional[key];
			}
		}

		return template;
	};
}

function conjoin(word, items) {

	if (!Array.isArray(items)) return items;

	switch (items.length) {
	case 0:
		return "";
	case 1:
		return items[0];
	case 2:
		return `${items[0]} ${word} ${items[1]}`;
	default: {
		const copy = Array.from(items);
		const last = copy.pop();
		return `${copy.join(", ")}, ${word} ${last}`;
	}}
}

class AbstractParser  {

	constructor() {
		this._index   = 0;
		this._tokens  = null;
		this._length  = 0;
		this._depth   = 0;
	}

	_sink() {
		++this._depth;
	}

	_swim() {
		--this._depth;
	}

	_isTopLevel() {
		return this._depth == 0;
	}

	_toNext() {
		if (this._index < this._length) {
			++this._index;
		}
	}

	_toPrev() {
		if (this._index > 0) {
			--this._index;
		}
	}

	_nextToken() {
		const i = this._index + 1;
		if (i < this._length) {
			return this._tokens[i][0];
		} else {
			return null;
		}
	}

	_prevToken() {
		const i = this._index - 1;
		if (i > 0) {
			return this._tokens[i][0];
		} else {
			return null;
		}
	}

	_reset(tokens) {
		this._index   = 0;
		this._tokens  = tokens;
		this._length  = tokens.length;
		this._depth   = 0;
	}

	get token() {
		if (this._index < this._length) {
			return this._tokens[this._index][0];
		} else {
			return null;
		}
	}

	get position() {
		if (this._index < this._length) {
			return this._tokens[this._index].index;
		} else {
			return null;
		}
	}
}

class AbstractCompilationError extends Error {
	constructor(message, position) {
		super(message);
		this.position = position;
	}

	at(source) {

		let row = 0, column = 0, left = this.position;

		for (let character of source) {
			
			if (left-- <= 0) break;

			if (character == "\n") {
				row    += 1;
				column  = 0;
			} else {
				column += 1;
			}
		}

		return [row + 1, column];
	}
}

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = {
		Grade,
		nameof,
		element,
		wrap,
		delimit,
		hilight,
		tooltip,
		SwapText,
		ConfigEnum,
		kwargsChecker,
		Iter,
		valuesOf,
		conjoin,
		AbstractCompilationError,
		AbstractParser,
		isObject
	};

}

/* exported chain */
/* exported choice */
/* exported wrap */
/* exported capitalize */
/* exported uniqueID */
/* exported delimit */
/* exported element */
/* exported tooltip */
/* exported uniqueLabel */
/* exported AttributeCell */
/* exported Version */
/* exported hilight */
/* exported template_object */
/* exported ConfigEnum */
/* exported SwapText */
/* exported Updater */
/* exported Filter */
/* exported ellipse */
/* exported Grade */
/* exported BigButton */
/* exported TagSetWidget */
/* exported Toggle */
/* exported VariableTable */
/* exported Theme */
/* exported nameof */
/* exported inBrowser */
/* exported inNode */
/* exported tag */
/* exported kwargsChecker */
/* exported AbstractCompilationError */
/* exported choices */
