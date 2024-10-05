
/**
 * A module implementing facilities for parsing and transforming the custom
 * markup language used to produce tooltips in feature descriptions.
 * @module expression
 */

/* global require */

/* global
	AbstractCompilationError,
	conjoin, delimit, element, inBrowser, tooltip
 */

/* global
	Feature
*/

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({
		AbstractCompilationError,
		conjoin, delimit, element, inBrowser, tooltip
	} = require("../common.js"));
	/* eslint-enable no-global-assign */
}

const Markup = (function () {

////////////////////////////////////////////////
// Markup Parsing Support and Data Structures //
////////////////////////////////////////////////

class CompilationError extends AbstractCompilationError {
	constructor(message, position) {
		super(message, position);
	}
}

/**
 * Consumes an array of string tokens representing split source and returns
 * yeild a sequence of symbols tying each string to the position of its
 * starting character in the original source string.
 * @param {Array.<string>} tokens array of strong tokens to process
 * @param {[type]}         start  character position to start counting at
 * @yield {Symbol}                value and position info for the string
 */
function *eat(tokens, start=0) {
	
	let i = 0, at = start;
	
	while (i < tokens.length) {
		const token  = new Symbol(tokens[i], at);
		at          += token.value.length;
		i           += 1;
		yield token;
	}
}

/**
 * Class that represents a token parsed from souce input
 */
class Symbol {
	constructor(value, index) {
		this.value = value;
		this.index = index;
	}

	toString() {
		return this.value;
	}

	slice(start, stop) {
		const string = this.value.slice(start, stop);
		return new Symbol(string, this.index + start);
	}

	split(separator) {
		const names  = [];
		const tokens = eat(this.value.split(separator), this.index);

		for (let token of tokens) {
			if (token.value.match(separator)) continue;
			names.push(token);
		}

		return names;
	}

	get length() {
		return this.value.length;
	}
}

/**
 * Class that represents a markup tag
 */
class Tag {

	static LOUD     = "@";
	static SILENT   = "#";
	static START    = new Set([Tag.LOUD, Tag.SILENT]);
	static TOKENS   = /([@#])((?:{[^}]*})+)/;
	static FIELDS   = /(}{)/;
	static NAMES    = /(\|\|)/;

	/**
	 * Creates a tag object from tage fields
	 * @param  {Symbol}         namespace namespace the names belong to
	 * @param  {Array.<Symbol>} names     names of features linked to
	 * @param  {Symbol?}        display   text to display in tag's location; if
	 * null then displayed text is contructed from names
	 * @param  {Boolean}        silent    if reminders should not be expanded
	 */
	constructor(namespace, names, display, silent=false) {
		this.namespace = namespace;
		this.names     = names;
		this._names    = conjoin("and", this.names.map(x => x.value));
		this.display   = display;
		this.silent    = silent;
	}
	
	getNamesText() {
		return this._names;
	}

	getDisplayText() {
		return this.display != null
			? this.display.value
			: this._names;
	}

	toString() {
		const fields = [];
		const start  = this.silent ? "#" : "@";
		fields.push(this.namespace.value);
		fields.push(this.names.map(x => x.value).join("||"));
		if (this.display) {
			fields.push(this.display.value);
		}
		return `${start}{${fields.join("}{")}}`;
	}

	/**
	 * Creates a tag object from tage fields, but accepts string arguments
	 * in places where {@link Symbol} arguments would normally be expected
	 * @param  {string}         namespace namespace the names belong to
	 * @param  {Array.<string>} names     names of features linked to
	 * @param  {string?}        display   text to display in tag's location; if
	 * null then displayed text is contructed from names
	 * @param  {Boolean}        silent    if reminders should not be expanded
	 * @return {Tag}                      Tag object created from data
	 */
	static create(namespace, names, display, silent=false) {

		// TODO I doubt this will ever need accurate indicies for each
		// symbol but if it does later, assign them as thought we were
		// passed a single text tag to parse

		return new Tag(
			new Symbol(namespace, 0),
			names.map((n, i) => new Symbol(n, i)),
			display == null ? null : new Symbol(display, 0),
			silent
		);
	}


}

//////////////////////////////
// Tag Processing Functions //
//////////////////////////////

/**
 * Callback for action to process discovered markup tags in parser
 *
 * @callback parserAction
 * @param  {Tag}    tag  - tag to process
 * @param  {Object} data - custom userdata provided by caller for processing
 * @return {Object} custom result of processing input parameters
 */

/**
 * Parser action to map tags into DOM <span> elements. This is used so when it
 * is undesirable to expand links to features into tooltips, such is when a tag
 * occurs already inside of a tooltip.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}                 tag        - tag to process
 * @param  {DOMTagUD}            userdara   - unused
 * @return {HTMLElement}         style span element representing the tag
 */
const DOMDeadTag = (namespaces, tag, userdata) => {

	// if this is a tooltip, use the "names" field as display text
	if (tag.namespace.value == "tooltip") {
		return element("span", tag.getNamesText(), "computed");
	}

	return element("span", tag.getDisplayText(), "computed");
};

/**
 * Parser action to map tags into appropriate DOM elements. Namespaces acting
 * as links to feature descriptions are specifically turned into tooltips.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}                 tag        - tag to process
 * @param  {DOMTagUD}            userdata   - unused
 * @return {HTMLElement}         DOM tree reperesenting tag
 */
const DOMLinkTag = (namespaces, tag, userdata) => {

	const {namespace, names} = tag;

	// namespace tooltip swaps the uses of display and names
	if (namespace.value == "tooltip") {
		const visible = element("span", tag.getNamesText(), "datum");
		return tooltip(visible, tag.getDisplayText());
	}

	// namespace style tags use relevant tags to style output
	if (namespace.value == "style") {
		return element("span", {
			class   : names.map(symbol => symbol.value),
			content : tag.getDisplayText(),
		});
	}

	// otherwise this is a link style tag, so lookup the namespace
	const feature = namespaces.get(namespace.value);

	if (feature === undefined) {
		throw new ReferenceError(
			`feature namespace ${JSON.stringify(namespace.value)} is not defined`
		);
	}

	// process the names within the namespace
	const combo = [];

	for (let name of names) {

		const instance = feature.get(name.value);

		// check whether lookup failed and there is no feature with this name
		if (Object.is(instance, Feature.EMPTY)) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`link to nonexistant feature ${link}`);
		}

		if (instance instanceof Feature && instance.tagged("depricated")) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`feature ${link} is depricated`);
		}

		combo.push(
			element("div", [
				element("strong", instance.name), element("br"),
				instance.body(true)
			])
		);
	}

	const  base = element("span", tag.getDisplayText(), "datum");
	return tooltip(base, delimit(() => element("hr"), combo));
};

/**
 * Userdata for creating text with trailing reminders from tags.
 * @typedef  {object} TextTagUD
 * @property {Set<string>}          seen   - tracks seen reminders to guard recursion
 * @property {Array<string>}        stack  - stores reminder text to be appended to end
 */

/**
 * Parser action to map tags into html markup. Tags are turned into trailing reminders.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}         tag                - tag to process
 * @param  {TextTagUD}   userdata           - necessary data create trailing reminders
 * @return {HTMLElement} html markup representing the tag
 */
const HtmlTag = (namespaces, tag, userdata) => {

	// exit early if this is a silent tag
	if (tag.silent) return tag.getDisplayText();

	const {namespace, names} = tag;

	// namespace tooltip gets its tooltip text stripped away
	if (namespace.value == "tooltip") {
		return tag.getNamesText();
	}

	// namespace const gets its tooltip text stripped away
	if (namespace.value == "const") {
		return tag.getDisplayText();
	}

	// namespace style uses tags for common styles
	if (namespace.value == "style") {

		let text = tag.getDisplayText();

		// nest styles in the order they are encountered
		for (let name of names) {
			switch (name.value) {
			case "italic":
				text = tag("i", text);
				break;
			case "bold":
				text = tag("b", text);
				break;
			case "underline":
				text = tag("u", text);
				break;
			case "table":
				text = tag("pre", text);
				break;
			default:
				break;
			}
		}

		return text;
	}

	// otherwise this is a link style tag, so lookup the namespace
	const feature = namespaces.get(namespace.value);

	if (feature === undefined) {
		throw new ReferenceError(
			`feature namespace ${JSON.stringify(namespace.value)} is not defined`
		);
	}

	// process the names within the namespace
	const combo  = [];

	// process names in reverse order to reminder text is stacked correctly
	for (let name of names.reverse()) {

		// prevent unbounded recursion
		if (userdata.seen.has(name.value)) {
			combo.push(tag.getDisplayText());
			continue;
		}

		const instance = feature.get(name.value);

		// check whether lookup failed and there is no feature with this name
		if (Object.is(instance, Feature.EMPTY)) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`link to nonexistant feature ${link}`);
		}

		if (instance instanceof Feature && instance.tagged("depricated")) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`feature ${link} is depricated`);
		}

		// mark that we've already seen this feature
		userdata.seen.add(name.value);

		// recursively parse the description markup for this feature so that
		// we can use that feature in the reminder text appended to the end
		const body = HtmlParser(namespaces, instance.description, userdata);

		// save reminder text for TextParserWrapper to handle
		userdata.stack.push(`<i>(${instance.name})</i> ${body}`);
	}

	return tag.getDisplayText();
};

/**
 * Parser action to map tags into plain text. Tags are turned into trailing reminders.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}                 tag        - tag to process
 * @param  {TextTagUD}           userdata   - necessary data create trailing reminders
 * @return {HTMLElement} plain text representing the tag
 */
const TextTag = (namespaces, tag, userdata) => {

	// exit early if this is a silent tag
	if (tag.silent) return tag.getDisplayText();

	const {namespace, names} = tag;

	// namespace tooltip gets its tooltip text stripped away
	// note: names and display are swapped for this namespace
	if (namespace.value == "tooltip") {
		return tag.getNamesText();
	}

	// namespace const gets its tooltip text stripped away
	if (namespace.value == "const") {
		return tag.getDisplayText();
	}

	// namespace style has its styling stripped away
	if (namespace.value == "style") {
		return tag.getDisplayText();
	}

	// otherwise this is a link style tag, so lookup the namespace
	const feature = namespaces.get(namespace.value);

	if (feature === undefined) {
		throw new ReferenceError(
			`feature namespace ${JSON.stringify(namespace.value)} is not defined`
		);
	}

	// process the names within the namespace
	const combo  = [];

	// process names in reverse order to reminder text is stacked correctly
	for (let name of names.reverse()) {

		// prevent unbounded recursion
		if (userdata.seen.has(name.value)) {
			combo.push(tag.getDisplayText());
			continue;
		}

		const instance = feature.get(name.value);

		// check whether lookup failed and there is no feature with this name
		if (Object.is(instance, Feature.EMPTY)) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`link to nonexistant feature ${link}`);
		}

		if (instance instanceof Feature && instance.tagged("depricated")) {
			const link = JSON.stringify(name.value);
			throw new CompilationError(`feature ${link} is depricated`);
		}

		// mark that we've already seen this feature
		userdata.seen.add(name.value);

		// recursively parse the description markup for this feature so that
		// we can use that feature in the reminder text appended to the end
		const body = TextParser(namespaces, instance.description, userdata);

		// save reminder text for TextParserWrapper to handle
		userdata.stack.push(`(${instance.name}) ${body}`);
	}

	return tag.getDisplayText();
};

/**
 * Parser action that just returns raw tag objects (for debugging purposes)
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}    tag                     - tag to process
 * @param  {Object} userdata                - unused but included for interface parity
 * @return {Tag} tag object passed in by the parser
 */
const RawTag = (namespaces, tag, userdata) => {
	return tag;
};

/**
 * This is a wrapper that allows markup validation to use the same interface as
 * Polish and Calculator compilation.
 */
class Compiler {

	constructor(context, refresher=null) {
		this.context = context;
		this.throws  = CompilationError;

		// giving this a compile method allows it to be used with the same
		// interface as Polish and Calculator's compilers for validation
		this.compile = this.validate;

		// probably best practice to have this here
		this.refresher = refresher;
	}

	validate(source, options=inBrowser, context=this.context) {
		return ValidateParser(context, source);
	}

	toHTML(source, options={}, context=this.context) {
		return HtmlParserWrapper(context, source, options);
	}

	toText(source, options={}, context=this.context) {
		return TextParserWrapper(context, source, options);
	}

	toLinks(source, dead=true, context=this.context) {
		const handler = (dead ? DOMDeadParser : DOMLinkParser);
		return handler(context, source);
	}

	get(namespace, name, context=this.context) {
		return context.get(namespace).get(name);
	}

	link(namespace, names, options={}, context=this.context) {
		return createLink(context, namespace, names, options);
	}
}

/**
 * Parser action to validate tags while compiling definitions files
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}      tag                   - tag to process
 * @param  {Compiler} userdata              - compiler object containing namespace info
 * @return {boolean} always true; throws an exception if invalid
 */
const ValidateTag = (namespaces, tag, inBrowser) => {

	const {namespace, names} = tag;

	if (namespace.value == "") {
		throw new CompilationError(
			"encountered markup tag with empty namespace field",
			namespace.index
		);
	}

	for (let {value, index} of names) {
		if (value == "") {
			throw new CompilationError(
				"encountered markup tag with blank name in its names field",
				index
			);
		}
	}

	// namespaces tooltip and style are always valid
	if (namespace.value == "tooltip" || namespace.value == "style") {
		return true;
	}

	// otherwise this is a link style tag, so lookup the namespace
	const feature = namespaces.get(namespace.value);

	if (feature === undefined) {
		throw new CompilationError(
			`feature namespace ${JSON.stringify(namespace.value)} is not defined`,
			namespace.index
		);
	}

	for (let {value, index} of names) {

		// instance is the raw JSON for the definitions
		const instance = feature.get(value);

		// check whether lookup failed and there is no feature with this name
		if (instance == undefined) {
			const link = JSON.stringify(value);
			throw new CompilationError(
				`link to nonexistant feature ${link}`,
				index
			);
		}

		if ("tags" in instance && instance.tags.includes("depricated")) {
			const link = JSON.stringify(value);
			// console.error(`feature ${link} is depricated`);
			throw new CompilationError(
				`feature ${link} is depricated`,
				index
			);
		}
	}

	return true;
};

//////////////////////////////
// Markup Parsing Functions //
//////////////////////////////

/**
 * Callback for combining parser output
 * @callback parserCombine
 * @param  {Array<Object>} array - array of data to merge into output
 * @return {Object} the result of combining that array into output
 */

/**
 * Callback for processing tags
 * @callback parserAction
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {Tag}    tag                     - tag object to process
 * @param  {Object} userdata                - any other data needed to process the tag
 * @return {Object} result of processing that tag
 */

/**
 * Creates a markup parser function using supplied callbakcs to determine the
 * action taken when encountering a tag and how to combine the final output.
 * @param  {parserAction}  action  function to process tag data when encountered
 * @param  {parserCombine} combine function to combine token array into output
 * @return {parser}                function to parser markup text
 */
function createParser(action, combine) {
	/**
	 * [description]
	 * @param  {[type]} string [description]
	 * @param  {[type]} data   [description]
	 * @return {[type]}        [description]
	 */
	return function(namespaces, string, data) {

		const merge  = [];
		const tokens = eat(string.split(Tag.TOKENS), 0);

		for (let token of tokens) {

			// check for and process tag
			if (Tag.START.has(token.value)) {

				const silent = token.value == Tag.SILENT;
				const field  = tokens.next().value;
				const fields = field.slice(+1, -1).split(Tag.FIELDS);

				if (fields.length < 2 || 3 < fields.length) {
					throw new CompilationError(
						`expected 2 or 3 fields but got ${fields.length}`,
						token.index
					);
				}

				const hasDisplay = fields.length == 3;

				if (hasDisplay && fields[2].value == "") {
					throw new CompilationError(
						"omit display field rather than leaving it blank",
						fields[2].index
					);
				}

				const namespace  = fields[0];
				const names      = fields[1].split(Tag.NAMES);
				const display    = hasDisplay ? fields[2] : null;
				const tag        = new Tag(namespace, names, display, silent);
				const product    = action(namespaces, tag, data);
				merge.push(product);
				continue;
			}

			// this is a segment of ordinary text
			merge.push(token.value);
		}

		// put the output together and return it
		return combine(merge);
	};
}

/**
 * A parser that turns markup strings into DOM trees where tags are hilighted
 * and bolded. Useful for use inside of environments like tooltips where use
 * of {@link DOMLinkParser} is not approriate.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {string}              string     - string of markup to parse
 * @param  {Object}              userdata   - unused
 * @return {HTMLElement} DOM tree representing markup with tags as styled span elements
 */
const DOMDeadParser = createParser(DOMDeadTag, (merge) => {
	return element("span", merge);
});

/**
 * A parser that turns markup strings into DOM trees where tags representing
 * links to features are transformed into tooltips that display the relevant
 * data on those features.
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {string}              string     - string of markup to parse
 * @param  {DOMTagUD}            userdata   - data
 * @return {HTMLElement} DOM tree representing markup with tags as tooltips
 */
const DOMLinkParser = createParser(DOMLinkTag, (merge) => {
	return element("span", merge);
});

/**
 * A parser that turns markup strings plaintext
 * @param  {Map<string, Feature} namespaces - map of reminder namespaces
 * @param  {string}              string     - string of markup to parse
 * @param  {Object}              data
 * @return {HTMLElement}        plaintext representing markup
 */
const HtmlParser = createParser(HtmlTag, (merge) => {
	return merge.join("");
});

const RawParser = createParser(RawTag, (merge) => {
	return merge;
});

/**
 * A parser that turns markup strings plaintext
 * @param  {string}      string string of markup to parse
 * @param  {Object}      data
 * @return {HTMLElement}        plaintext representing markup
 */
const TextParser = createParser(TextTag, (merge) => {
	return merge.join("");
});

/**
 * A parser to validate markup while compliling definitions files
 * @param  {string}      string string of markup to parse
 * @param  {Object}      data
 * @return {HTMLElement}        true; throws an exception if invalid
 */
const ValidateParser = createParser(ValidateTag, (merge) => {
	return true;
});

/////////////////////////////////////
// Reminder Text Wrapper Functions //
/////////////////////////////////////

/**
 * Wraps a parser function to append reminder text explaining markup tags for
 * features encountered within the text body.
 * @param  {function} parser    parser (created qith {@link createParser})
 * @param  {function} reminder  takes the named and body an returns a formatted
 *                              string that represents the reminder text
 * @param  {string}   delimiter used to delimit reminders
 * @return {string}             parser output with appended reminders
 */
const createReminderWrapper = (parser, reminder, delimiter) => {
	return (lookup, feature, options={}) => {

		const [name, description] = (function () {
			if (feature instanceof Feature) {
				return [feature.name, feature.description];
			}

			if (feature instanceof Array && feature.length >= 2) {
				return feature;
			}

			throw new TypeError(
				`expected Feature or Array (length >= 2) but got '${feature}'`
			);
		})();

		const seen     = options.seen  ?? new Set([name]);
		const join     = options.join  ?? true;
		const named    = options.named ?? false;
		const userdata = {seen, stack: []};

		const body = parser(lookup, description, userdata);
		userdata.stack.push(named ? reminder(name, body) : body);

		const entries = userdata.stack.reverse();
		if (join) return entries.join(delimiter);
		return entries;
	};
};

/**
 * Parser that generates HTML text formatted output with feature reminders
 * @param  {}       lookup  [description]
 * @param  {[type]} feature [description]
 * @param  {}       options [description]
 * @return {[type]}         [description]
 */
const HtmlParserWrapper = createReminderWrapper(
	HtmlParser, (name, body) => `<i>(${name})</i>${body}`, "<br />"
);

/**
 * Parser that generates plain text formatted output with feature reminders
 * @param  {[type]}  feature [description]
 * @param  {[type]}  set     [description]
 * @param  {Boolean} join    [description]
 * @param  {Boolean} named   [description]
 * @return {[type]}          [description]
 */
const TextParserWrapper = createReminderWrapper(
	TextParser, (name, body) => `(${name}) ${body}`, "\n"
);

/**
 * Optional parameters for @{link createLink}
 * @typedef {Object} CreateLinkOptions
 * @property {Boolean} dead    If tooltips should not be expanded
 * @property {string?} display Text to display tag with
 * @property {Boolean} year    If reminders should not be expanded
 */

/**
 * Helper function to manually create a link from stuctured data without the
 * need to expose internal types like {@link Tag} and {@link Symbol}.
 * @param  {Map.<string, Feature} namespaces collection of all possible
 * namespaces to look up features within
 * @param  {string}               namespace  namespace to look up feature
 * body within based on names
 * @param  {Array.<string>}       names      feature names to display inside
 * generated tooltip
 * @param  {CreateLinkOptions}    template   optional parameters
 * @return {HTMLElement}          feature link created from arguments
 */
function createLink(namespaces, namespace, names, template) {

	const dead      = template.dead      ?? true;
	const display   = template.display   ?? null;
	const silent    = template.silent    ?? true;
	const tag       = Tag.create(namespace, names, display, silent);

	return (dead ? DOMDeadTag : DOMLinkTag)(namespaces, tag);
}

return {
	toRaw              : RawParser,
	toHTML             : HtmlParserWrapper,
	toLiveLinks        : DOMLinkParser,
	toDeadLinks        : DOMDeadParser,
	toText             : TextParserWrapper,
	validate           : ValidateParser,
	Compiler           : Compiler,
	CompilationError   : CompilationError,
	link               : createLink,
	compose            : (namespace, names, display="", silent=false) => {
		return (new Tag(
			new Symbol(namespace, 0),
			names.map(n => new Symbol(n, 0)),
			display ? new Symbol(display, 0) : null,
			silent
		)).toString();
	}
};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Markup;

}

/* exported Markup */
