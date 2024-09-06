
/**
 * A module implementing facilities for compiling, transforming, and executing
 * polish notation expressions.
 * @module polish
 */

/* global require */

/* global
	AbstractParser, AbstractCompilationError, Iter
	conjoin, element, nameof, valuesOf,
 */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({
		conjoin, element, nameof, valuesOf,
		AbstractCompilationError, AbstractParser, Iter
	} = require("../common.js"));
	/* eslint-enable no-global-assign */
}

const Polish = (function() {

const _GRAMMAR = (`
<expr>   ::= <list> | <nested>
<list>   ::= <quote> | <symbol> | <string> | <nested> | 
<nested> ::= "(" <list> ")"
<quote>  ::= "'(" <list> ")"
`);

class CompilationError extends AbstractCompilationError {
	constructor(message, position) {
		super(message, position);
	}
}

const Tokens = (function() {

	const namespace = {};

	/* define regular expressions for lexical analysis */

	namespace.REGEXP = {
		STRING     : new RegExp("`[^`]*`"),
		OPERATORS  : new RegExp("\\(|\\)"),
		SYMBOL     : new RegExp("[^`() \\t\\n\\r]+"),
		WHITESPACE : new RegExp("[ \\t\\n\\r]+"),
		BLANKSPACE : new RegExp("^[ \\t\\n\\r]+$"),
	};

	/* the order of these subexpressions is important */

	namespace.REGEXP.TOKENS = new RegExp([
		namespace.REGEXP.STRING.source,
		namespace.REGEXP.OPERATORS.source,
		namespace.REGEXP.SYMBOL.source,
		namespace.REGEXP.WHITESPACE.source,
	].join("|"), "g");

	/* a simplified acessor functions for terminals */

	namespace.get = function(token, arity) {
		return this.OPERATORS[arity][token];
	};

	const TERMINALS = {
		// LITERAL : "`(",
		BEGIN   : "(",
		END     : ")",
	};

	namespace.TERMINALS = TERMINALS;

	/* a namespace for sets of terminals */

	namespace.SET = {
		GROUP: new Set([
			TERMINALS.BEGIN,
			TERMINALS.END,
		]),
	};

	return namespace;
})();

function tokenize(source) {
	/* regular expressions are one of the best things invented */
	const tokens = Array.from(source.matchAll(Tokens.REGEXP.TOKENS));

	/* the array for the whitespace stripped tokens */
	const output = [];

	/* validate there are no "missing" i.e. invalid tokens */
	let index = 0;
	for (let token of tokens) {

		if (index != token.index) {
			throw new CompilationError(
				`Invalid token at ${index}`, index
			);
		}

		/* strip whitespace */

		if (!token[0].match(Tokens.REGEXP.BLANKSPACE)) {
			output.push(token);
		}

		index += token[0].length;
	}

	if (index != source.length) {
		throw new CompilationError(
			`Invalid token at ${index}`, index
		);
	}

	return output;
}

class Symbol {
	constructor(value, index) {
		this.value = value;
		this.index = index;
	}
}

class Parser extends AbstractParser {

	constructor(symbols) {
		super();
		this.symbols = symbols;
	}

	parseSource(source) {
		const tokens = tokenize(source);
		return this.parseTokens(tokens);
	}

	parseTokens(tokens) {
		this._reset(tokens);
		const out = this._parseExpression();

		return out;
	}

	_parseExpression() {
		let out  = null;
		let save = this._index;

		this._index = save;
		out = this._parseList();
		return out;
	}

	_parseList() {

		const list = [];

		for (;;) {
			let out  = null;
			let save = this._index;

			this._index = save;
			out = this._parseNested();
			if (out != null) {
				list.push(out);
				continue;
			}

			this._index = save;
			out = this._parseString();
			if (out != null) {
				list.push(out);
				continue;
			}

			this._index = save;
			out = this._parseSymbol();
			if (out != null) {
				list.push(out);
				continue;
			}

			break;
		}

		// TODO ban enmpy lists

		return list || null;
	}

	_parseNested() {

		if (this.token != Tokens.TERMINALS.BEGIN) return null;
		const start = this.position;
		this._toNext();

		this._sink();
		const inner = this._parseList();
		if (inner == null) return inner;
		this._swim();

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				"Unclosed nested expression", this.position
			);
		}

		if (inner.length == 0) {
			throw new CompilationError(
				"Empty expressions are forbidden", this.position
			);
		}

		this._toNext();
		inner.index = start;
		return inner;
	}

	_parseSymbol() {

		if (!(this.token && this.token.match(Tokens.REGEXP.SYMBOL))) return null;
		const token = this.token;
		const index = this.position;
		this._toNext();

		this.symbols.add(token);
		return new Symbol(token, index);
	}

	_parseString() {

		if (!(this.token && this.token.match(Tokens.REGEXP.STRING))) return null;
		const token = this.token.replaceAll("`", () => "");
		const index = this.position;
		this._toNext();

		this.symbols.add(token);
		return new Symbol(token, index);
	}
}

function parse(source, symbols=new Set()) {
	const parser = new Parser(symbols);
	return parser.parseSource(source);
}

function highlight(source) {
	
	const ast = parse(source);

	function walk(node, top=true) {

		const out = [];

		if (!top) out.push("(");

		for (let i = 0; i < node.length; ++i) {

			if (i) out.push(" ");

			const item = node[i];

			if (item instanceof Array) {
				out.push(walk(item, false));
			}
			else
			if (typeof item == "string") {
				out.push(element("span", item, i ? "computed" : "datum"));
			}
			else {
				throw new TypeError(
					"Invalid type in ast."
				);
			}
		}

		if (!top) out.push(")");

		return element("span", out);
	}

	return walk(ast);
}

const NOT_DEPENDANCY = new Set([
	"All", "Any", "Required", "Innate", "None", "Required",
	"Unknown", "Unfinished", "Barrier", "Agarthan"
]);

// TODO account for the fact that ast[0] could be an array
function depends(ast, set=new Set()) {

	if (ast.length && !NOT_DEPENDANCY.has(ast[0].value)) set.add(ast[0].value);

	for (let i = 1; i < ast.length; ++i) {
		if (ast[i] instanceof Array) depends(ast[i], set);
	}

	return set;
}

// class Engine {

// 	constructor(context, yields) {
// 		this.stacks  = [];
// 		this.context = context;
// 		this.yields  = yields  || false;
// 	}

// 	exec(ast, context) {

// 		context = context || this.context;

// 		let
// 			args  = undefined,
// 			node  = undefined,
// 			stop  = undefined,
// 			stack = undefined;

// 		if (ast && this.stacks.length > 0) {
// 			args  = [];
// 			node  = ast;
// 			stop  = false;
// 			stack = [];
// 		} else {
// 			stack = this.stacks.pop();
// 			const frame = this.stack.pop();

// 			args = frame.args;
// 			node = frame.node;
// 			stop = frame.stop;
// 		}

// 		while (!stop) {

// 			if (args.length == node.length) {
// 				const result = this.call(context, ...args);
// 				const frame  = stack.pop();

// 				if (stop) {
// 					frame.args.push(result);
// 					this.stacks.push(stack);
// 					return result;
// 				}

// 				if (stack.length == 0) {
// 					return result;
// 				}

// 				args = frame.args;
// 				node = frame.node;
// 				stop = frame.stop;
// 				args.push(result);
// 				continue;
// 			} else {
				
// 				const element = node[args.length];
			
// 				if (typeof element == "string") {

// 					if (element == "Yield" && this.yields) {
// 						stop = true;
// 					}
					
// 					args.push(element);
// 				} else {
// 					stack.push({args, node, stop});

// 					args = [];
// 					node = element;
// 					stop = false;
// 				}
// 			}
// 		}

// 		return walk(this.ast);
// 	}

// 	call(context, name, ...args) {
// 		return context[name](...args);
// 	}

// }

/**
 * A class representing an executable expression
 */
class CompiledExpression {
	
	/**
	 * Create an instance. Should not be called directly, instead create a
	 * {@link Compiler} instance and invoke its
	 * [compile]{@link Compiler#compile} method.
	 * @param {string} source - the source code for the expression
	 * @param {Object} context - a map-like object for variable values
	 * @param {Set?} symbols - a set of defined symbols for this expression
	 */
	constructor(source, context={}, validators={}) {
		this.source   = source;
		this.context  = context;
		this.symbols  = new Set();
		this.real_ast = parse(source, this.symbols);
		this.depends  = depends(this.real_ast);
		this.ast      = this.validate(context, validators);
	}

	/**
	 * Validate arity and structure of expression predicates.
	 * @param {Object} context - provide an alternate context to execute with
	 * @param {Object} valiators - custom functions to validate specific predicates
	 * @param {boolean} complexError - whether list predicates are an error
	 */
	validate(context, validators) {

		context = context || this.context;

		if (this.real_ast.length == 0) {
			throw new CompilationError("Blank expression", 0);
		}

		const walk = (list) => {

			const array     = [];
			const predicate = list[0];

			// zero length lists are parse errors so we assume list[0] exists
			
			if (Array.isArray(predicate)) {
				throw new CompilationError(
					"Complex predicates are forbidden",
					predicate.index
				);
			}

			if (!(predicate.value in context)) {
				throw new CompilationError(
					`Predicate ${JSON.stringify(predicate.value)} is undefined`,
					predicate.index
				);
			}

			const fn    = context[predicate.value];
			const nargs = list.length - 1; 

			// check for the correct number of arguments.
			if (fn.variadic) {
				if (nargs <  fn.args.length) {
					throw new CompilationError(
						`predicate ${predicate.value} accepts ${fn.args.length} or more argument(s) but recieved ${nargs}`,
						predicate.index
					);
				}
			} else {
				if (nargs != fn.args.length) {
					throw new CompilationError(
						`predicate ${predicate.value} accepts ${fn.args.length} argument(s) but recieved ${nargs}`,
						predicate.index
					);
				}
			}
			
			// list starts with the function name so offset by 1
			let expected = 0, actual = 1;

			// check each of the explicit arguments
			while (expected < fn.args.length) {
				fn.args[expected++].check(list[actual++], context);
			}

			// have to step back because we want the last one
			--expected;

			// check trailing variadic arguments (same type as last)
			while (actual < list.length) {
				fn.args[expected].check(list[actual++], context);
			}


			for (let each of list) {
				if (Array.isArray(each)) {
					array.push(walk(each));
				} else {
					array.push(each);
				}
			}

			return array;

		};
	
		return walk(this.real_ast);
	}

	/**
	 * Execute this expression in the given context. If no context is given
	 * it will draw variable values from the context it was compiled with.
	 * @param {Object} context - provide an alternate context to execute in
	 */
	exec(context) {

		context    = context || this.context;

		const walk = (list) => {

			const args = [];

			for (let element of list) {
				args.push(
					(element instanceof Symbol) 
						? element.value 
						: walk(element)
				);
			}

			return this.apply(context, args);
		};

		return walk(this.ast);
	}

	apply(context, node) {
		if (!(node[0] in context))
			throw new Error(`'${node[0]}' undefined for this context`);
		return context[node[0]](...node);
	}

	*[Symbol.iterator]() {
		let index = 0;
		let stack = [];
		let node  = this.ast;

		yield node;
		for (;;) {

			if (index == node.length) {
				if (stack.lengt == 0) {
					break;
				}
				node  = stack.pop();
				index = stack.pop();
				continue;
			}

			if (node[index] instanceof Array) {
				stack.push(index + 1);
				stack.push(node);

				node  = node[index];
				index = 0;
				yield node;
			} else {
				++index;
			}
		}
	}
}

/**
 * A class that produces Expressions instances that all share a single
 * enduring context of variables and set of defined symbols.
 */
class Compiler {
	
	/**
	 * Create an instance.
	 * @param {object} - a map-like object for variable values
	 * @param {Set} - a set of defined symbols
	 */
	constructor(context, symbols) {
		this.context = context;
		this.symbols = symbols;
		this.throws  = CompilationError;
	}

	/**
	 * Compile to provided source string into an expressions that executes
	 * with the provided context. (Defaults to internal.)
	 * @param {string} source - source code the expression
	 * @param {object} context - a map-like object for variable values
	 * @returns {CompiledExpression} - an executable expression object
	 */
	compile(source, context=this.context) {
		return new CompiledExpression(source, context);
	}
}

/**
 * A class that represents a data type within a polish notation expression.
 * Used for type checking symbol parsings and expression return types.
 */
class Type {

	constructor(name, parse) {
		this.name  = name;
		this.parse = parse;
	}

	is(that) {
		return this == that;
	}

	check(node, context) {
		switch (nameof(node)) {
		case "Symbol":
			this.parse(node);
			break;
		case "Array": {

			const pred = node[0];

			if (!(pred.value in context)) {
				throw new CompilationError(
					`Predicate ${JSON.stringify(pred.value)} is undefined`,
					pred.index
				);
			}

			const func = context[pred.value];

			if (!this.is(func.out)) {
				throw new CompilationError(
					`expected type ${this.name} but got ${func.out.name}`,
					node.index
				);
			}
			break;
		}
		default:
			throw new Error("unreachable");
		}
	}

	/**
	 * Any type. Used for dynamic typing.
	 * @const {Type}
	 */
	static ANY     = new Type("pass", (sym) => true);

	/**
	 * Used to mark function signatures as taking variadic (rest) arguments.
	 * @const {Type}
	 */
	static VARIADIC = new Type("variadic", (sym) => {
		throw new Error(
			"cannot instantiate variadic",
		);
	});

	/**
	 * Accepts any symbol verbatim; function returns a string.
	 * @const {Type}
	 */
	static STRING   = new Type("string", (sym) => true);

	/**
	 * Parses symbols as numbers, disallowing NaN, Infinity, and -Infinity.
	 * Function returns a number.
	 * @const {Type}
	 */
	static NUMBER   = new Type("number", (sym) => {
		
		const number = Number(sym.value);

		if (Number.isNaN(number) || !Number.isFinite(number)) {
			throw new CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as number`,
				sym.index
			);
		}
	});

	/**
	 * Parses symbols as booleans allowing only "true" and "false".
	 * Function returns a boolean.
	 * @const {Type}
	 */
	static BOOLEAN = new Type("boolean", (sym) => {
		if (!sym.value.match(/true|false/)) {
			throw new CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as boolean type`,
				sym.index
			);
		}
	});

	/**
	 * Creates a Type that can only be constructed by a set of provided strings
	 * @param  {object}   options specified as kwargs
	 * @return {function} the created types
	 */	
	static fromSet(name, set, messenger) {
		return new Type(name, (symbol) => {
			if (!set.has(symbol.value)) {
				throw new CompilationError(
					messenger(symbol), symbol.index
				);
			}
		});
	}

	/**
	 * Creates fromSet type from the features in a given category. I don't like
	 * this being here because it assumes knowledge of definitions, but I also
	 * don't know where else to put it, so here it stays.
	 * @param  {Object} template keyword arguments
	 * @return {Type}            a type made from the provided categories
	 */
	static fromCategories(template) {
		const {definitions, categories, mapping, flatten, name} = template;

		const list   = conjoin("or", categories);
		const mapped = Iter.map(Iter.chain(...valuesOf(definitions, categories)), mapping);
		const set    = new Set(flatten ? Iter.chain(...mapped) : mapped);
		const error  = (symbol => 
			`${JSON.stringify(symbol.value)} is not a ${name} for any ${list}`
		);

		for (let each of (template.extra || [])) set.add(each);

		return Type.fromSet(name, set, error);
	}

}

/* create and return namespace */
return Object.freeze({

	is: function(object) {
		return object instanceof CompiledExpression;
	},

	fallback: function(context) {
		return new Proxy(context, {
			get: function(object, field, fallback) {
				return (
					Object.prototype.hasOwnProperty.call(object, field)
						? object[field]
						: fallback
				);
			},
		});
	},

	highlight: highlight,

	// toul: toul,

	context: {
		"True": (() => true),

		"False": (() => false),

		"All": ((op, ...args) => args.reduce((x, y) => x && y)),

		"Any": ((op, ...args) => args.reduce((x, y) => x || y)),

		"Yield": ((op, ...args) => args.length == 1 ? args[0] : args.length == 0 ? null : args),

		"List": ((op, ...args) => args),

		"Do": ((op, ...args) => args[args.length - 1]),

		"If": ((op, ask, yes, no) => ask ? yes : no),
	},
	
	/* this has to be exposed to be catchable */
	CompilationError: CompilationError,

	/* this is the main class for the module*/
	Compiler: Compiler,

	tokenize: tokenize,

	/* convenience function to compile easily */
	compile: function(source, context={}) {
		return new CompiledExpression(source, context);
	},

	/* convenience function to execute easily */
	execute: function(expression) {
		if (expression instanceof CompiledExpression) {
			return expression.exec();
		}
		if (typeof expression === "number") {
			return expression;
		}
		throw new TypeError(
			"Argument must be Expression or number"
		);
	},

	/* convenience function to produce a macro */
	macro: function(expression) {
		if (expression instanceof CompiledExpression) {
			return expression.macro();
		}
		if (typeof expression === "number") {
			return String(expression);
		}
		throw TypeError(
			"Argument must be Expression or number"
		);
	},

	/* convenience function to produce source */
	source: function(expression) {
		if (expression instanceof CompiledExpression) {
			return expression.source;
		}
		if (typeof expression === "number") {
			return String(expression);
		}
		throw TypeError(
			"Argument must be Expression or number"
		);
	},

	parse: parse,
	depends: depends,

	Type: Type,
});


})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Polish;

}

/* exported Polish */
