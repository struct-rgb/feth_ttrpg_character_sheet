
/**
 * A module that implements a builder for Roll20 Macros
 * @namespace UserInterface
 */

class SwapText {
	constructor(modes) {

		this.root = element("div");

		this.mode  = 0;
		this.modes = modes.map((mode) => {

			if (mode instanceof HTMLElement) {
				return mode;
			}

			return element("span", {
				content: mode,
			});
		});

		this.root.onclick = (() => {
			this.next();
		});

		this.root.appendChild(this.modes[0]);
	}

	next() {
		this.modes[this.mode].remove();
		this.mode = (this.mode + 1) % this.modes.length;
		this.root.appendChild(this.modes[this.mode]);
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
	static CURRENT = new Version("2.0.0");

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
		// console.warn("make sure null content is intented behavior");
		return;
	}

	const ctype = typeof content;

	if (ctype == "string" || ctype == "number") {
		const textnode = document.createTextNode(String(content));
		element.appendChild(textnode);
	} else if (content instanceof HTMLElement || content instanceof Text) {
		element.appendChild(content);
	} else if (content instanceof Array) {
		for (let each of content) {
			content_action(element, each);
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

function delimit(delimiter, array) {
	return array.reduce((accumulator, element) => (
		(
			accumulator.length
				? accumulator.push(delimiter, element)
				: accumulator.push(element)

			, /* comma operator */

			accumulator
		)
	), []);
}

function assume(first, other) {
	return first == null ? other : first;
}

function tooltip(content, tooltip) {

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
		)
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
 */

function attrinput(textnode, options, oninput) {

	const input = element("input", {
		class: ["simple-border", "hidden-field"],
		attrs: {
			type    : "number",
			min     : assume(options.min, 0),
			max     : assume(options.max, 100),
			value   : assume(options.value, 0),
			step    : assume(options.step, 1),
			oninput : oninput,
		},
	});

	const label = uniqueLabel(textnode, input);
	label.classList.add("datum");

	return [input, element("span", [label, input])];
}

/**
 * A configurable table cell with a number input.
 */
class AttributeCell {

	constructor(options, trigger) {
		options       = options || {};
		this.text     = document.createTextNode(assume(options.shown, ""));
		this._trigger = trigger || options.trigger || (x => x);

		const [input, span] = attrinput(this.text, options, (() => {
			this.value = this.input.value;
		}));

		this.input = input;

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

	_shown() {
		return this._trigger(this.value);
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
