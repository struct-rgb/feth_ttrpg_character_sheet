
/**
 * A module implementing facilities for compiling, transforming, and executing
 * simple mathematical expressions written in infix notation
 * @module expression
 */

/* global require */

/* global
   AbstractParser, AbstractCompilationError, SwapText
   element, delimit, hilight, inBrowser, tooltip, wrap, 
 */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({
		inBrowser,
		element,
		wrap,
		hilight,
		delimit,
		tooltip,
		SwapText,
		AbstractParser,
		AbstractCompilationError
	} = require("../common.js"));
	/* eslint-enable no-global-assign */
}

/* we're going to go for a different pattern with this one */
const Calculator = (function() {

const _GRAMMAR = (`
<expr>      ::= <control> | <add-expr>

<stop>      ::= "end" | <null>
<text>      ::= <identifier> | <string>
<control>   ::= <label> | <metaif> | <bothif> | <prompt> | <cond> | <min> | <max>

<label>     ::= "label" <text> <expr> <stop>

<prompt>    ::= "ask" <text> <options> <stop>
<options>   ::= <option> | <options> <option>
<option>    ::= "case" <expr> | "else" <expr>

<cond>      ::= "if" <rel-expr> "then" <add-expr> "else" <add-expr> <stop>
<metaif>    ::= "metaif" <rel-expr> "then" <expr> "else" <expr> <stop>
<metaif>    ::= "bothif" <rel-expr> "then" <expr> "else" <expr> <stop>

<min>       ::= "less" <expr> "else" <expr> "."
<max>       ::= "more" <expr> "else" <expr> "."

<rel-expr>  ::= <add-expr> <rel-op> <add-expr>
<rel-op>    ::= ">" | "<" | "<=" | ">=" | "==" | "<>"

<add-expr>  ::= <add-expr> <add-op> <mul-expr> | <mul-expr>
<add-op>    ::= "+" | "-"

<mul-expr>  ::= <mul-expr> * <mul-expr> | <neg-expr>
<mul-op>    ::= "*" | "/" | "%"

<neg-expr>  ::= <value> | <unary-op> <value>
<unary-op>  ::= "+" | "-"

<value>     ::= <nested> | <literal> | <call> | <alias> | <identifier> | <control>
<nested>    ::= "(" <expr> ")"
<alias>     ::= <text> "=" <expr>

<call>      ::= <func-name> "(" <expr> ")"
<func-name> ::= "not" | "abs" | "ceil" | "floor" | "round" | "sign" | "meta" | "inspect"
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
		COMMENT    : new RegExp("//[^\\n]*(\\n|$)"),
		STRING     : new RegExp("\\[[^\\]]*\\]"),
		LITERAL    : new RegExp("[0-9]+(\\.[0-9]+(e[+-]*[0-9]+)*)*"),
		IDENTIFIER : new RegExp("[A-Za-z_$][0-9A-Za-z_$|]*"),
		OPERATOR   : new RegExp(
			"==|<>|>=|<=|>|<|=|\\+|-|\\*|/|%|\\(|\\)|=|,|;|\\{|\\}"
		),
		WHITESPACE : new RegExp("[ \\t\\n\\r]+"),
		BLANKSPACE : new RegExp("^[ \\t\\n\\r]+$"),
		MAXCOMMENT : new RegExp("^//[^\\n]*\\n?$"),
	};

	/* the order of these subexpressions is important */

	namespace.REGEXP.TOKENS = new RegExp([
		namespace.REGEXP.COMMENT.source,
		namespace.REGEXP.STRING.source,
		namespace.REGEXP.LITERAL.source,
		namespace.REGEXP.OPERATOR.source,
		namespace.REGEXP.WHITESPACE.source,
		namespace.REGEXP.IDENTIFIER.source,
	].join("|"), "g");

	/* a simplified accessor functions for terminals */

	namespace.get = function(token, arity) {
		return this.OPERATORS[arity][token];
	};

	const TERMINALS = {
		PERIOD   : "}",
		STOP     : "end",
		MIN      : "min",
		MAX      : "max",
		PROMPT   : "ask",
		OPTION   : "case",
		DEFAULT  : "else",
		ALIAS    : "{",
		IF       : "if",
		THEN     : "then",
		ELSE     : "else",
		GT       : ">",
		LT       : "<",
		GE       : ">=",
		LE       : "<=",
		EQ       : "==",
		NE       : "<>",
		ADD      : "+",
		SUB      : "-",
		MUL      : "*",
		DIV      : "/",
		MOD      : "%",
		BEGIN    : "(",
		END      : ")",
		ABS      : "abs",
		CEIL     : "ceil",
		FLOOR    : "floor",
		ROUND    : "round",
		UMINUS   : "-",
		UPLUS    : "+",
		SIGN     : "sign",
		LABEL    : "label",
		META     : "meta",
		METAIF   : "metaif",
		INSPECT  : "inspect",
		ELSEIF   : "elseif",
		NOT      : "not",
		DIE      : "die",
		MACRO    : "fill",
		TEMPLATE : "template",
		CONCAT   : "cat",
		BOTHIF   : "bothif",
		AND      : "and",
		OR       : "or",
		BOOLEAN  : "boolean",
		ARGSEP   : ",",
		MATCH    : "match",
		LET      : "let",
		ASSIGN   : "=",
		SHORT    : ";",
		// IN       : "in",

		/* builtin variables */
		BUILTIN_CODEGEN     : "builtins|codegen",
		BUILTIN_MACROGEN    : "builtins|macrogen",
		BUILTIN_COMPTIME    : "builtins|comptime",
		BUILTIN_RUNTIME     : "builtins|runtime",
		BUILTIN_ALIAS       : "builtins|alias",
		BUILTIN_LABEL       : "builtins|label",
	};

	namespace.TERMINALS = TERMINALS;

	/* a namespace for sets of terminals */

	namespace.SET = {

		LOGICAL: new Set([
			TERMINALS.AND,
			TERMINALS.OR,
		]),

		RELATIVE: new Set([
			TERMINALS.GT,
			TERMINALS.LT,
			TERMINALS.LE,
			TERMINALS.GE,
			TERMINALS.EQ,
			TERMINALS.NE,
		]),

		ADDITIVE: new Set([
			TERMINALS.ADD,
			TERMINALS.SUB,
		]),

		MULTIPLICATIVE: new Set([
			TERMINALS.MUL,
			TERMINALS.DIV,
			TERMINALS.MOD,
		]),

		RANDOM: new Set([
			TERMINALS.DIE,
		]),

		OPERATOR: new Set([
			TERMINALS.GT,
			TERMINALS.LT,
			TERMINALS.LE,
			TERMINALS.GE,
			TERMINALS.EQ,
			TERMINALS.NE,
			TERMINALS.ADD,
			TERMINALS.SUB,
			TERMINALS.MUL,
			TERMINALS.DIV,
			TERMINALS.MOD,
			TERMINALS.DIE,
			TERMINALS.PERIOD,
			TERMINALS.ALIAS,
			TERMINALS.OPTION,
			TERMINALS.DEFAULT,
			TERMINALS.ALIAS,
			TERMINALS.BEGIN,
			TERMINALS.END,
			TERMINALS.AND,
			TERMINALS.OR,
		]),

		CALL: new Set([
			TERMINALS.ABS,
			TERMINALS.CEIL,
			TERMINALS.FLOOR,
			TERMINALS.ROUND,
			TERMINALS.SIGN,
			TERMINALS.META,
			TERMINALS.INSPECT,
			TERMINALS.NOT,
			TERMINALS.BOOLEAN,
		]),

		UNARY: new Set([
			TERMINALS.UPLUS,
			TERMINALS.UMINUS,
		]),

		OPTIONS: new Set([
			TERMINALS.OPTION,
			TERMINALS.DEFAULT,
		]),

		BUILTINS: new Set([
			TERMINALS.BUILTIN_CODEGEN,
			TERMINALS.BUILTIN_MACROGEN,
			TERMINALS.BUILTIN_COMPTIME,
			TERMINALS.BUILTIN_RUNTIME,
			TERMINALS.BUILTIN_ALIAS,
			TERMINALS.BUILTIN_LABEL,
		]),

		RESERVED: new Set([
			TERMINALS.BOOLEAN,
			TERMINALS.ELSE,
			TERMINALS.ELSEIF,
			TERMINALS.STOP,
			TERMINALS.IF,
			TERMINALS.THEN,
			TERMINALS.ABS,
			TERMINALS.CEIL,
			TERMINALS.FLOOR,
			TERMINALS.ROUND,
			TERMINALS.PROMPT,
			// TERMINALS.OPTION,
			// TERMINALS.DEFAULT,
			TERMINALS.MIN,
			TERMINALS.MAX,
			TERMINALS.SIGN,
			TERMINALS.LABEL,
			TERMINALS.META,
			TERMINALS.METAIF,
			TERMINALS.INSPECT,
			TERMINALS.BUILTIN_CODEGEN,
			TERMINALS.BUILTIN_MACROGEN,
			TERMINALS.BUILTIN_COMPTIME,
			TERMINALS.BUILTIN_RUNTIME,
			TERMINALS.BUILTIN_ALIAS,
			TERMINALS.BUILTIN_LABEL,
			TERMINALS.NOT,
			TERMINALS.DIE,
			TERMINALS.MACRO,
			TERMINALS.TEMPLATE,
			// TERMINALS.IN,
			TERMINALS.BOTHIF,
			TERMINALS.MATCH,
			TERMINALS.LET,
		]),
	};

	function argist(head, ...args) {
		return element("div", [
			element("span", hilight(head)),
			element("ol", {
				class   : ["arglist"],
				content : args.map((a, i) => (
					element("li", [
						element("span", `{${i + 1}} `, "datum"),
						a,
					])
				)),
			})
		]);
	}

	namespace.HELP = {};

	namespace.help = (term, title, head, ...alist) => {

		const value = {
			"called" : element("span", ["Syntax: ", hilight(title)]),
			"about"  : argist(head, ...alist),
		};

		if (!(term in namespace.HELP)) {
			namespace.HELP[term] = [value];
		} else {
			namespace.HELP[term].push(value);
		}
	};

	/* a helper function to define terminals */

	function quote(recurse, parent, child) {
		const parentOp = namespace.get(parent[0], parent.length - 1);
		const childOp  = namespace.get(child[0], child.length - 1);

		if (childOp.precedence > parentOp.precedence) {
			return `(${recurse(child)})`;
		}

		return recurse(child);
	}

	class Operator {

		static EMPTY = Object.freeze({});

		constructor(precedence, template) {
			this.precedence = precedence;
			template        = template        || Operator.EMPTY;
			this.opcode     = template.opcode || null;
			
			if (inBrowser && "help" in template) {
				const help = template.help;
				this.help  = namespace.help(...help);
			}

			if ("codegen" in template) {
				this.codegen = template.codegen;
			}

			if ("macrogen" in template) {
				this.macrogen = template.macrogen;
			}

			if (new.target === Operator) {
				Object.freeze(this);
			}
		}
	}

	class Unary extends Operator {
		constructor(precedence, template) {
			super(precedence, template);

			const fn = template.fn;

			/* this is data, not a method */
			this.opcode = function(env) {
				env.push(fn(env.pop()));
				return 1;
			};

			if (new.target === Unary) {
				Object.freeze(this);
			}
		}

		codegen(recurse, code, node, env) {
			const [_opcode, argument] = node;
			recurse(argument);
			code.instructions.push(this.opcode);
		}

		macrogen(recurse, node, env) {
			const [opcode, argument] = node;

			/* this assumes a call like operator I guess */
			return `${opcode}(${recurse(argument)})`;
		}
	}

	class Binary extends Operator {
		constructor(precedence, coalesce, template) {
			super(precedence, template);

			const fn = template.fn;

			/* simplify expressions with this value */
			this.coalesce = coalesce;

			/* this is data, not a method */
			this.opcode = function(env) {
				const x = env.pop();
				const y = env.pop();
				env.push(fn(y, x));
				return 1;
			};

			if (template.macrogen) {
				this.macrogen = template.macrogen;
			}

			if (new.target === Binary) {
				Object.freeze(this);
			}
		}

		codegen(recurse, code, node, env) {
			const [_opcode, argA, argB] = node;
			recurse(argA);
			recurse(argB);
			code.instructions.push(this.opcode);
		}

		macrogen(recurse, node, env) {
			const [opcode, argA, argB] = node;

			const quoteA = quote(recurse, node, argA);
			const quoteB = quote(recurse, node, argB);

			if (env.compact && quoteB == this.coalesce) {
				return quoteA;
			}

			return `${quoteA} ${opcode} ${quoteB}`;
		}
	}

	/* arranged by arity */

	/* 
	 * lower precedence means it's higher priority
	 * ALIAS => 0
	 * UNARY => 0
	 * CALL  => 0
	 * MULT  => 1
	 * ADDI  => 2
	 * REL   => 3
	 * LOGIC => 4
	 * COND  => 5
	 */

	namespace.OPERATORS = {};

	namespace.OPERATORS[0] = {

		[TERMINALS.BUILTIN_RUNTIME] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_RUNTIME,
				TERMINALS.BUILTIN_RUNTIME,
				wrap(
					"A builtin variable; Evaluates to 1 if evaluated inside of a ",
					"compiled expression and to 0 otherwise. This is mainly ",
					"used internally to allow variables to determine whether ",
					"to return runtime or Roll20 macro generation results, ",
					"but it's exposed here for debug purposes."
				)
			],

			opcode: function(env) {
				env.push(1);
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode] = node;
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode] = node;
				return "0";
			},
		}),

		[TERMINALS.BUILTIN_CODEGEN] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_CODEGEN,
				TERMINALS.BUILTIN_CODEGEN,
				wrap(
					"A builtin variable; Evaluates to 1 if the top ",
					"level invocation is code generation and 0 ",
					"otherwise. This meants that this variable may ",
					"or may not evaluate to 1 when using [meta] or ",
					"[metaif]. For that purpose, use ",
					"builtins|comptime.",
				)
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode] = node;
				// const value     = env.codegen;
				code.instructions.push(function(env) {
					env.push(Number(env.codegen));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode] = node;
				return "0";
			},
		}),

		[TERMINALS.BUILTIN_MACROGEN] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_MACROGEN,
				TERMINALS.BUILTIN_MACROGEN,
				wrap(
					"A builtin variable; Evaluates to 1 during Roll20 ",
					"macro generation and evaluates to 0 otherwise.",
				)
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode] = node;
				code.instructions.push(function(env) {
					env.push(Number(env.macrogen));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode] = node;
				return "1";
			},
		}),

		[TERMINALS.BUILTIN_ALIAS] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_ALIAS,
				TERMINALS.BUILTIN_ALIAS,
				wrap(
					"A builtin variable; Evaluates to 1 during if env is ",
					"set to generate aliases and evaluates to 0 otherwise.",
				)
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode] = node;
				code.instructions.push(function(env) {
					env.push(Number(env.alias));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode] = node;
				return Number(env.alias);
			},
		}),

		[TERMINALS.BUILTIN_LABEL] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_LABEL,
				TERMINALS.BUILTIN_LABEL,
				wrap(
					"A builtin variable; Evaluates to 1 during if env is ",
					"set to generate labels and evaluates to 0 otherwise.",
				)
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode] = node;
				code.instructions.push(function(env) {
					env.push(Number(env.label));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode] = node;
				return Number(env.label);
			},
		}),
	};

	namespace.OPERATORS[1] = {
		/* these three do no have assiciated terminals */

		"()" : new Operator(0, {

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				recurse(argument);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				return `(${recurse(argument)})`;
			},
		}),

		"$local"  : new Operator(0, {

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node; 

				code.instructions.push(function(env) {
					env.push(env.scope[argument]);
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				return env.scope[argument];
			},

		}),

		"$global" : new Operator(0, {

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node; 

				code.instructions.push(function(env) {
					env.push(env.read(argument));
					return 1;
				});
				code.symbols.add(argument);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				return env.read(argument);
			},
		}),

		"#" : new Operator(0, {

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				code.instructions.push(function(env) {
					// this.stack.push(argument);
					env.push(argument);
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				return argument;
			},
		}),

		"text" : new Operator(0, {

			codegen: function(recurse, code, node, env) {
				const [_opcode, _argument] = node;
				throw new CompilationError(
					"Codegen reached text expression"
				);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				return argument;
			},
		}),

		/* from here on, these to have associate terminals */

		[TERMINALS.BOOLEAN]: new Operator(0, {

			help: [
				TERMINALS.BOOLEAN,
				`${TERMINALS.BOOLEAN}({1})`,
				wrap(
					"Returns 1 if {1} is nonzero and zero otherwise.",
				),
				"any expression"
			],
			
			opcode: function(env) {
				env.push(+!!env.pop());
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				// const meta = namespace.OPERATORS[1][TERMINALS.META].macrogen;
				// const tmp  = [TERMINALS.META, argument];
				// return `${Number(meta(recurse, tmp, env))}`;
				return recurse(argument);
			},

		}),

		[TERMINALS.ABS]: new Unary(0, {

			help: [
				TERMINALS.ABS,
				`${TERMINALS.ABS}({1})`,
				wrap(
					"If {1} is positive or 0, returns {1}; ",
					"otherwise returns -{1}"
				),
				"any expression",
			],

			fn: (x => Math.abs(x)),

		}),

		[TERMINALS.CEIL]: new Unary(0, {

			help: [
				TERMINALS.CEIL,
				`${TERMINALS.CEIL}({1})`,
				wrap(
					"Returns {1} rounded up to the nearest ",
					"whole number."
				),
				"any expression",
			],

			fn: (x => Math.ceil(x)),

		}),

		[TERMINALS.FLOOR]: new Unary(0, {

			help: [
				TERMINALS.FLOOR,
				`${TERMINALS.FLOOR}({1})`,
				wrap(
					"Returns {1} rounded down to the nearest ",
					"whole number.",
				),
				"any expression"
			],

			fn: (x => Math.floor(x)),

		}),

		[TERMINALS.INSPECT]  : new Operator(0, {

			help: [
				TERMINALS.INSPECT,
				`${TERMINALS.INSPECT}({1})`,
				wrap(
					"Prints the value of {1}, the compilation options, and ",
					"the associate position in the AST to the browser ",
					"console. Used for debugging calculator internals.",
				),
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;

				recurse(argument);

				code.instructions.push(function(env) {
					const value = env.pop();
					console.log(value, env, node);
					env.push(value);
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				const value = recurse(argument);
				console.log(value, env, node);
				return value;
			},
		}),

		[TERMINALS.MIN] : new Operator(0, {

			help: [
				TERMINALS.MIN,
				`${TERMINALS.MIN}({1})`,
				wrap(
					"Return the minimum value from the values in {1}."
				),
				"comma separated list of expressions"
			],

			codegen(recurse, code, node, env) {
				const [_opcode, args] = node;

				const min = function(env) {
					const x = env.pop();
					const y = env.pop();
					env.push(Math.min(y, x));
					return 1;
				};

				for (let i = 0; i < args.length; ++i) {
					recurse(args[i]);
					if (i == 0) continue;
					code.instructions.push(min);
				}
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;

				const strings = [];

				for (let each of argument) {
					strings.push(recurse(each));
				} 

				return `{(${strings.join("),(")})}kl1`;
			},
		}),

		[TERMINALS.MAX] : new Operator(0, {

			help: [
				TERMINALS.MAX,
				`${TERMINALS.MAX}({1})`,
				wrap(
					"Return the maximum value from the value in {1}."
				),
				"comma separated list of expressions"
			],

			codegen(recurse, code, node, env) {
				const [_opcode, args] = node;

				const max = function(env) {
					const x = env.pop();
					const y = env.pop();
					env.push(Math.max(y, x));
					return 1;
				};

				for (let i = 0; i < args.length; ++i) {
					recurse(args[i]);
					if (i == 0) continue;
					code.instructions.push(max);
				}
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;

				const strings = [];

				for (let each of argument) {
					strings.push(recurse(each));
				} 

				return `{(${strings.join("),(")})}kh1`;
			},
		}),

		[TERMINALS.META] : new Operator(0, {

			help: [
				TERMINALS.META,
				`${TERMINALS.META}({1})`,
				wrap(
					"Evaluate {1} at compile time and returns the ",
					"result to be used in the expression. Compile ",
					"time is defined as both code generation and ",
					"Roll20 macro generation. Other compile ",
					"time constructs like [=] aliases and [label]s ",
					"that occur inside of the parentheses will be ",
					"missing from the Roll20 macro generated due to ",
					"being stripped out by execution of the ",
					"expression."
				),
				"any expression"
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;

				try {
					const cnv   = env.clone(Env.CODEGEN);
					const cdg   = codegen(cnv, argument);
					const rnv   = env.clone(Env.RUNTIME);
					const val   = rnv.execute(cdg.instructions);

					code.instructions.push(function(env) {
						env.push(val);
						return 1;
					});
				} catch (error) {
					if (error instanceof CompilationError) {
						console.error(argument);
					}
					throw error;
				}
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;

				try {
					const cnv   = env.clone(Env.CODEGEN);
					const cdg   = codegen(cnv, argument);
					const rnv   = env.clone(Env.RUNTIME);
					const val   = rnv.execute(cdg.instructions);

					return val;
				} catch (error) {
					if (error instanceof CompilationError) {
						console.error(argument);
					}
					throw error;
				}
			},
		}),

		[TERMINALS.NOT]: new Operator(0, {

			help: [
				TERMINALS.NOT,
				`${TERMINALS.NOT}({1})`,
				wrap(
					"Returns 1 if {1} == 0 and 0 if {1} <> 0. Use with ",
					"caution inside of Roll20 macro generation; creates a ",
					"lot of text.",
				),
				"any expression",
			],

			opcode: function(env) {
				env.push(!env.pop());
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				const x = recurse(argument);
				return `(ceil((abs(${x})/(abs(${x}) + 1)) + 1) % 2)`;
			},
		}),


		[TERMINALS.ROUND]  : new Unary(0, {

			help: [
				TERMINALS.ROUND,
				`${TERMINALS.ROUND}({1})`,
				"Returns {1} rounded to the nearest whole number.",
				"any expression",
			],

			fn: (x => Math.round(x)),
		}),


		[TERMINALS.SIGN]: new Operator(0, {

			help: [
				TERMINALS.SIGN,
				"{TERMINALS.SIGN}({1})",
				wrap(
					"Returns 1 if {1} is positive, -1 if {1} is negative, ",
					"and 0 if {1} is 0. Use with caution inside of Roll20 ",
					"macro generation; creates a lot of text.",
				),
				"any expression",
			],

			opcode: function(env) {
				env.push(Math.sign(env.pop()));
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;
				const v = recurse(argument);
				return `(${v} / ((0 ** abs(${v})) + abs(${v})))`;
			},
		}),

		[TERMINALS.UMINUS] : new Operator(0, {

			help: [
				TERMINALS.UMINUS,
				`${TERMINALS.UMINUS}{1}`,
				"Return the negation of {1}",
				"any expression",
			],

			opcode: function(env) {
				env.push(-env.pop());
				// this.stack.push(-this.stack.pop());
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;

				/* this is a negated expression */
				if (argument[0] != "#") {
					return `(-1 * (${recurse(argument)}))`;
				}

				/* this is a negative literal */
				return `(-${argument[1]})`;
			},
		}),

		[TERMINALS.UPLUS]  : new Operator(0, {

			help: [
				TERMINALS.UPLUS,
				`${TERMINALS.UPLUS}{1}`,
				"Return {1} (explicity mark that it's positive)",
				"any expression"
			],

			/* The use of the unary + operator in this function is delibrate
			 * and thus, I have inline-disabled the eslint error for it here.
			 **/
			opcode: function(env) {
				/* eslint no-implicit-coercion: "off" */
				env.push(+env.pop());
				return 1;
			},

			codegen: function(recurse, code, node, opts) {
				const [_opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, opts) {
				const [_opcode, argument] = node;
				/* this operator doesn't really *do* anything */
				return recurse(argument);
			},
		}),

		[TERMINALS.CONCAT] : new Operator(0, {

			help: [
				TERMINALS.CONCAT,
				`${TERMINALS.CONCAT}({1})`,
				wrap(
					"Concatenate each item in {1} into a single string."
				),
				"comma separated list of expressions or [bracketed text]"
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, _argument] = node;

				throw new CompilationError(
					wrap(
						"Something went wrong, and codegen reached a cat ",
						"expression even thought that should be impossible ",
					)
				);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argument] = node;

				const strings = [];

				for (let each of argument) {
					strings.push(recurse(each));
				} 

				return strings.join("");
			},
		}),
	};

	namespace.OPERATORS[2] =  {

		[TERMINALS.LABEL] : new Operator(0, {

			help: [
				TERMINALS.LABEL,
				`${TERMINALS.LABEL} {1} {{2}}`,
				wrap(
					"Labels {2}'s result with {1} in the generated ",
					"Roll20 macro",
				),
				"any identifier or [bracketed text]",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, _argA, argB] = node;
				recurse(argB);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node; // TODO make this use parens right

				if (!env.label) {
					return recurse(argB);
				}

				return `(${recurse(argB)}) [${recurse(argA)}]`;
			},
		}),

		[TERMINALS.ALIAS] : new Operator(0, {

			help: [
				TERMINALS.ALIAS,
				"{1} {{2}}",
				wrap(
					"Evaluates to {2} but writes {1} in the ",
					"generated Roll20 macro as a variable name.",
				),
				"any identifier or [bracketed text]",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, _argA, argB] = node;
				recurse(argB);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;

				if (!env.alias) {
					return recurse(argB);
				}

				return `@{${recurse(argA)}}`;
			},
		}),

		[TERMINALS.GT]  : new Binary(3, undefined, {
			
			help: [
				TERMINALS.GT,
				`{1} ${TERMINALS.GT} {2}`,
				wrap(
					"Returns 1 if {1} is greater than {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x > y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.GT, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.LT]  : new Binary(3, undefined, {
			help: [
				TERMINALS.LT,
				`{1} ${TERMINALS.LT} {2}`,
				wrap(
					"Returns 1 if {1} is less than {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] of [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x < y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.LT, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.LE]  : new Binary(3, undefined, {
			help: [
				TERMINALS.LE,
				`{1} ${TERMINALS.LE} {2}`,
				wrap(
					"Returns 1 if {1} is less than or equal to {2}",
					"and 0 otherwise; can only be used in the ",
					"condition of an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x <= y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.LE, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.GE]: new Binary(3, undefined,  {
			help: [
				TERMINALS.GE,
				`{1} ${TERMINALS.GE} {2}`,
				wrap(
					"Returns 1 if {1} is greater than or equal to {2}",
					"and 0 otherwise; can only be used in the ",
					"condition of an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x >= y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.GE, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.EQ]  : new Binary(3, undefined,  {
			help: [
				TERMINALS.EQ,
				`{1} ${TERMINALS.EQ} {2}`,
				wrap(
					"Returns 1 if {1} is equal to {2} and 0 otherwise",
					"; can only be used in the condition of an [if] ",
					"or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			
			fn: ((x, y) => x == y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.EQ, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.NE]  : new Binary(3, undefined,  {
			help: [
				TERMINALS.NE,
				`{1} ${TERMINALS.NE} {2}`,
				wrap(
					"Returns 1 if {1} is not equal to {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x != y),

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff  = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.NE, argA, argB], ["#", 1], ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.ADD] : new Binary(2, 0,  {
			help: [
				TERMINALS.ADD,
				`{1} ${TERMINALS.ADD} {2}`,
				"Return the sum of {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x + y),
		}),

		[TERMINALS.SUB] : new Binary(2, 0, {
			help: [
				TERMINALS.SUB,
				`{1} ${TERMINALS.SUB} {2}`,
				"Return the difference between {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x - y),
		}),

		[TERMINALS.MUL] : new Binary(1, 1, {
			help: [
				TERMINALS.MUL,
				`{1} ${TERMINALS.MUL} {2}`,
				"Return the product of {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x * y),
		}),

		[TERMINALS.DIV] : new Binary(1, 1, {
			help: [
				TERMINALS.DIV,
				`{1} ${TERMINALS.DIV} {2}`,
				"Return the quotient of {1} divided by {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x / y),
		}),

		[TERMINALS.MOD] : new Binary(1, undefined, {
			help: [
				TERMINALS.MOD,
				`{1} ${TERMINALS.MOD} {2}`,
				"Return the remainder of {1} divided by {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x % y),
		}),

		[TERMINALS.AND] : new Operator(4, {
			help: [
				TERMINALS.AND,
				`{1} ${TERMINALS.AND} {2}`,
				"Return 1 if both {1} and {2} are nonzero and zero otherwise.",
				"any expression",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argA, argB] = node;

				recurse(argA); // compute first argument
				
				// mark location and allocate space for a conditional
				// branch past the second argument 
				const branch = code.instructions.length;
				code.instructions.push(null); 

				recurse(argB); // compute second argument

				// this is the place we jump to if we shortcircuit
				const label  = code.instructions.length;

				// add back in the conditional branch
				const offset = label - branch;
				code.instructions[branch] = function (env) {
					return env.peek() ? (env.pop(), 1) : offset;
				};
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff    = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.NE, argA, ["#", 0]], argB, ["#", 0]
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.OR] : new Operator(4, {
			help: [
				TERMINALS.OR,
				`{1} ${TERMINALS.OR} {2}`,
				"Return 1 if at least one of {1} and {2} are nonzero and zero otherwise",
				"any expression",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argA, argB] = node;

				recurse(argA); // compute first argument
				
				// mark location and allocate space for a conditional
				// branch past the second argument 
				const branch = code.instructions.length;
				code.instructions.push(null); 

				recurse(argB); // compute second argument

				// this is the place we jump to if we shortcircuit
				const label  = code.instructions.length;

				// add back in the conditional branch
				const offset = label - branch;
				code.instructions[branch] = function (env) {
					return env.peek() ? offset : (env.pop(), 1);
				};
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				const iff    = namespace.OPERATORS[3][TERMINALS.IF].macrogen;
				const tmp  = [TERMINALS.IF,
					[TERMINALS.EQ, argA, ["#", 0]], argB, argA
				];
				return `${iff(recurse, tmp, env)}`;
			},
		}),

		[TERMINALS.DIE] : new Operator(0, { // TODO fix precedence
			help: [
				TERMINALS.DIE,
				`{1} ${TERMINALS.DIE} {2}`,
				wrap(
					"Roll {1} die {2}s. In Roll20 macro generation this ",
					"creates a macro that actually rolls the dice, but in ",
					"the character builder it takes the average roll.",
				),
				"any expression",
				"any expression",
			],
			
			opcode: function(env) {
				const x = env.pop();
				const y = env.pop();

				if (x == 0) {
					env.push(0);
					return 1;
				}

				let avg = 0;
				for (let i = x; i > 0; --i) avg += i;
				env.push(y * (avg / x));
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, argA, argB] = node;
				recurse(argA);
				recurse(argB);
				code.instructions.push(this.opcode);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;

				const quoteA = quote(recurse, node, argA);
				const quoteB = quote(recurse, node, argB);

				return `${quoteA}d${quoteB}`;
			},
		}),

		[TERMINALS.MACRO] : new Operator(0, {
			help: [
				TERMINALS.MACRO,
				`${TERMINALS.MACRO} {1}({2})`,
				wrap(
					"Instantiate a character builder macro (not Roll20 macro) ",
					"with the name {1}, and arguments {2}. This replaces the ",
					"expression with whatever {1} was defined as at compile ",
					"time, with specified variables replaced with each of {2}."
				),
				"any identifier or [bracketed text]",
				"comma separated list of [bracketed text] or any expressions",
			],
			
			opcode: function(env) {
				env.push(0);
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, title, args] = node;
				const text = title[1];

				try {
					const macro = env.instantiate(text, args);
					console.log(`Expansion of ${text}`, macro);
					recurse(macro);
				} catch (error) {
					if (error instanceof CompilationError) {
						error.message = (
							`In expansion of template '${text}'; ${error.message}`
						);
					}
					throw error;
				}
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, title, args] = node;
				const text = title[1];

				try {
					const macro = env.instantiate(recurse(title), args);
					console.log(`Expansion of ${text}`, macro);
					return recurse(macro);
				} catch (error) {
					if (error instanceof CompilationError) {
						error.message = (
							`In expansion of template '${text}'; ${error.message}`
						);
					}
					throw error;
				}
			},
		}),

		[TERMINALS.TEMPLATE] : new Operator(0, {
			help: [
				TERMINALS.TEMPLATE,
				`${TERMINALS.TEMPLATE} {1}({2}) {3} end`,
				wrap(
					"Define a character builder macro (not Roll20 macro) ",
					"with the name {1}, and arguments {2} that evaluates to ",
					"the expression {3} during compile time. During runtime ",
					"and during Roll20 macro generation, evaluates to 1 if ",
					"the template was already defined, and to 0 otherwise."
				),
				"any identifier or [bracketed text]",
				"comma separated list of any identifiers or [bracketed text]",
				"any expression",
			],
			
			opcode: function(env) {
				env.push(0);
				return 1;
			},

			codegen: function(recurse, code, node, env) {
				const [_opcode, title, instance] = node;

				const defined = env.template(recurse(title), instance);

				code.instructions.push(function(env) {
					env.push(defined);
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, title, instance] = node;

				return env.template(title, instance);
			},
		}),

		[TERMINALS.LET] : new Operator(0, {
			help: [
				TERMINALS.LET,
				`${TERMINALS.LET} {1} = {2}, {3} then {4}`,
				wrap(
					"Define a local variable with the name {1} and assign it ",
					"the result of the expression {2}, then define zero or ",
					"more others in the position of {3}. Local variables ",
					"defined in a {1} position must either be used in the ",
					"{2} position of a following assignment or in {4}. ",
					"A variable with the same name as a previously defined ",
					"local or a global shadows the value of that variable ",
					"until the end of the scope."
				),
				"any identifier",
				"any expression",
				"any number of additional comma separated assignments",
				"any expression",
			],

			opcode: function(env) {
				env.scope.push(env.pop());
				return 1;
			},
			
			codegen: function(recurse, code, node, env) {
				const [_opcode, assigns, expr] = node;

				for (let [_name, value] of assigns) {
					recurse(value);
					code.instructions.push(this.opcode);
				}

				recurse(expr);

				code.instructions.push(function(env) {
					env.scope.length -= assigns.length;
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, assigns, expr] = node;

				for (let [_name, value] of assigns) {
					env.scope.push(`(${recurse(value)})`);
				}

				const output = recurse(expr);
				env.scope.length -= assigns.length;
				return output;
			},
		}),

	};

	namespace.OPERATORS[3] =  {

		[TERMINALS.IF]: new Operator(5, {

			help: [
				TERMINALS.IF,
				`${TERMINALS.IF} {1} {2} {3} then {4} else {5} end`,
				wrap(
					"Compare {1} and {3} using relative operator {2}, ",
					"if the result is true, then return {4} otherwise ",
					"return {5}, instead. Cannot appear inside of ",
					"[ask] options. Use with caution in inside of Roll20 ",
					"macro generation; creates a lot of text.",
				),
				"any expression",
				"one of <, >, <=, >=, ==, or <>",
				"any expression",
				"any expression",
				"any expression",
			],

			/*
			 * branch if true to true_branch
			 * // false branch
			 * true_branch:
			 * // true branch
			 */
			codegen: function(recurse, code, node, env) {
				const [_opcode, argX, argY, argZ] = node;
				
				recurse(argX); // compute condition
				
				// mark location and allocate space for a conditional
				// branch to the true case later on
				const branch = code.instructions.length;
				code.instructions.push(null); 

				recurse(argZ); // compute false case

				// mark location and allocate space for an unconditional
				// branch to the end of the expression later on
				code.instructions.push(null);
				const label  = code.instructions.length;

				recurse(argY); // compute true case

				// add back in the conditional branch
				const offsetT = label - branch;
				code.instructions[branch] = function (env) {
					return env.pop() ? offsetT : 1;
				};

				// add back in the unconditional branch
				const jump    = label - 1;
				const offsetF = code.instructions.length - jump;
				code.instructions[jump] = function (env) {
					return offsetF;
				};
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, condNode, tNode, fNode] = node;

				const vthen = recurse(tNode);
				const velse = recurse(fNode);

				const [relop, lNode, rNode] = condNode;

				const lhs = recurse(lNode);
				const rhs = recurse(rNode);

				let cond = undefined;
				let body = undefined;
				switch (relop) {
				case "==":
					body = `((${vthen})-(${velse})) + ${velse}`;
					cond = `({0,[[floor(1-abs((${rhs})-(${lhs})))]]}dl1)`;
					break;
				case "<>":
					body = `((${velse})-(${vthen})) + ${vthen}`;
					cond = `({0,[[floor(1-abs((${rhs})-(${lhs})))]]}dl1)`;
					break;
				case "<=":
					body = `((${vthen})-(${velse})) + ${velse}`;
					cond = `{{[[${lhs}]],[[(${rhs})+1]]}<[[${rhs}]]}`;
					break;
				case ">=":
					body = `((${vthen})-(${velse})) + ${velse}`;
					cond = `{{[[${lhs}]],[[(${rhs})-1]]}>[[${rhs}]]}`;
					break;
				case "<":
					body = `((${velse})-(${vthen})) + ${vthen}`;
					cond = `{{[[${lhs}]],[[(${rhs})-1]]}>[[${rhs}]]}`;
					break;
				case ">":
					body = `((${velse})-(${vthen})) + ${vthen}`;
					cond = `{{[[${lhs}]],[[(${rhs})+1]]}<[[${rhs}]]}`;
					break;
				default: /* this should be unreachable */
					throw new Error(
						`${relop} is not a relative operator`
					);
				}

				return `(${cond} * ${body})`;
			}
		}),

		[TERMINALS.PROMPT]: new Operator(5, {

			help: [
				TERMINALS.PROMPT,
				`${TERMINALS.PROMPT} {1} case {2} case {3} else {4} end`,
				wrap(
					"Creates a prompt in the generated Roll20 macro ",
					"with {1} as a title. Only the [ask] {1} part is ",
					"mandatory, but multiple options can be supplied ",
					"by adding additional expressions separated by ",
					"the use of [case] keywords, such as is the case ",
					"with {2}, {3}, and {4}. In the character ",
					"builder, this expression evaluates to either the ",
					"first option provided, the (max of) one option ",
					"preceded by an [else] (if there is one), or ",
					"0 if there are no options. An [ask] option's ",
					"expression cannot contain the following ",
					"expression types: [if], [more], [less], and ",
					"other [ask] expressions. However, [metaif] is ",
					"permitted. Options can be given titles using ",
					"[{}] expressions, e.g. [Title {{1}}]."
				),
				"any identifier or [bracketed text]",
				"any expression (Title {{2}} sets title)",
				"any expression (Title {{3}} sets title)",
				"any expression (Title {{4}} sets title)",
				"etc...",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, _title, def, args] = node;
				recurse(args[def]);
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, title, _def, args] = node;
				
				const options = args.map(node => {
					
					if (node[0] == TERMINALS.ALIAS) {
						return `${node[1][1]},${recurse(node[2])}`;
					}

					return recurse(node);
				}).join("|");

				return `?{${recurse(title)}|${options}}`;
			}
		}),

		[TERMINALS.MATCH]: new Operator(5, {

			help: [
				TERMINALS.MATCH,
				`${TERMINALS.MATCH} {1} case {2} then {3} else (then) {4} end`,
				wrap(

					"Creates a conditional expression where the value of {1} ",
					"is checked for equality to the value of the expressions ",
					"following each [case], as with {2}, and the result of ",
					"[then] expression following that [case], as in {3} is ",
					"returned. If no [case] matches, then the result of the ",
					"expression following the singular [else] is return. ",
					"The [else] keyword may be optionally followed by the ",
					"[then] keyword. {1} is also optional and defaults to ",
					"checking for a truthy value (one that returns 1 when ",
					"given as an argument to [boolean]) if omitted. Semantics ",
					"compile time and runtime execution are the same as the ",
					"[bothif] keyword."
				),
				"any expression, checks for truthy values if omitted",
				"any expression",
				"any expression",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				throw new Error();
			},

			macrogen: function(recurse, node, env) {
				throw new Error();
			}
		}),

		/* I've finally introduced conditional compilation lol */

		[TERMINALS.METAIF] : new Operator(0, {

			help: [
				TERMINALS.METAIF,
				`${TERMINALS.METAIF} {1} then {2} else {3} end`,
				wrap(
					"Evaluates relative expression {1} at compile ",
					"time (compile time is defined as both code ",
					"generation and Roll20 macro generation), and ",
					"if it is true, compiles {2}, otherwise compiles ",
					"{3} instead. Whichever of {2} and {3} was ",
					"omitted does not appear in the generated output. ",
					"Since evalution occurs at compile time, this ",
					"can be used inside of [ask] options, ",
					"unlike normal [if] expressions, which cannot. ",
					"For more info on relative expressions, see the ",
					"help text for [if]."
				),
				"any relative expression",
				"any expression",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argX, argY, argZ] = node;

				try {
					const cnv   = env.clone(Env.CODEGEN);
					const cdg   = codegen(cnv, argX);
					const rnv   = env.clone(Env.RUNTIME);
					const val   = rnv.execute(cdg.instructions);

					if (val) {
						recurse(argY);
					} else {
						recurse(argZ);
					}
				} catch (error) {
					if (error instanceof CompilationError) {
						console.error(env, argX);
					}
					throw error;
				}
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argX, argY, argZ] = node;

				try {
					const cnv   = env.clone(Env.CODEGEN);
					const cdg   = codegen(cnv, argX);
					const rnv   = env.clone(Env.RUNTIME);
					const val   = rnv.execute(cdg.instructions);

					return recurse(val ? argY : argZ);
				} catch (error) {
					if (error instanceof CompilationError) {
						console.error(argX);
					}
					throw error;
				}
			},
		}),

		[TERMINALS.BOTHIF] : new Operator(0, {

			help: [
				TERMINALS.BOTHIF,
				`${TERMINALS.BOTHIF} {1} then {2} else {3} end`,
				wrap(
					"If builtins|macrogen then behaves like [metaif], ",
					"otherwise behaves like [if]."
				),
				"any relative expression",
				"any expression",
				"any expression",
			],

			codegen: function(recurse, code, node, env) {
				return namespace.OPERATORS[3][TERMINALS.IF].codegen(
					recurse, code, node, env
				);
			},

			macrogen: function(recurse, node, env) {
				return namespace.OPERATORS[3][TERMINALS.METAIF].macrogen(
					recurse, node, env
				);
			},
		}),
	};

	return Object.freeze(namespace);
})(); 

function tokenize(source, wstrip=true, cstrip=true) {
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


		/* strip whitespace and comments */

		if (
			!(cstrip && token[0].match(Tokens.REGEXP.MAXCOMMENT))
				&&
			!(wstrip && token[0].match(Tokens.REGEXP.BLANKSPACE))
		) {
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

function highlight(source, strip=false) {

	const process = strip ? source.replaceAll(/\s+/g, " ") : source;
	const tokens  = tokenize(process, false, false);
	const output  = [];

	for (let token of tokens) {

		const text = token[0];
	
		if (text.match(Tokens.REGEXP.BLANKSPACE)) {
			output.push(element("span", text));
			continue;
		}

		if (text.match(Tokens.REGEXP.MAXCOMMENT)) {
			if (strip) continue;
			output.push(element("span", text, "hl-literal"));
			continue;
		}

		if (Tokens.SET.OPERATOR.has(text) || Tokens.SET.CALL.has(text)) {
			output.push(element("span", text, "hl-operator"));
			continue;
		}

		if (Tokens.SET.BUILTINS.has(text)) {
			output.push(element("span", text, "hl-identifier"));
			continue;
		}

		if (Tokens.SET.RESERVED.has(text)) {
			output.push(element("span", text, "hl-reserved"));
			continue;
		}

		if (text.match(Tokens.REGEXP.LITERAL) || text.match(Tokens.REGEXP.STRING)) {
			output.push(element("span", text, "hl-literal"));
			continue;
		}
	
		if (text.match(Tokens.REGEXP.IDENTIFIER)) {
			output.push(element("span", text, "hl-identifier"));
			continue;
		}

		output.push(element("span", text));
	}

	return delimit("", output);
}

class Parser extends AbstractParser {

	static Local = class {

		constructor(name, offset) {
			this.name    = name;
			this.offset  = offset;
			this.used    = [];

			// this.runtime = false;
			// this.meta    = false;
		}
	};

	static Frame = class {

		constructor() {
			this._vars  = new Map();
			this._depth = 0;
			this._size  = 0;
		}

		create(name) {

			const local = new Parser.Local(name, this._depth++);
			this._size  = Math.max(this._depth, this._size);

			if (this._vars.has(name)) {
				this._vars.get(name).push(local);
			} else {
				this._vars.set(name, [local]);
			}
		}

		kill(name) {
		
			if (!this._vars.has(name)) return null;

			const stack = this._vars.get(name);

			if (stack.length == 0) return null;

			this._depth--;
			return stack.pop();
		}

		use(name) {
			if (!this._vars.has(name)) return null;
			const stack = this._vars.get(name).at(-1);
			const usage = ["$local", name];
			stack.used.push(usage);
			return usage;
		}

		unused() {
			
			const bad = [];

			for (let [key, value] of this._vars.entries()) {
				if (value.at(-1).used.length == 0) bad.push(key);
			}

			return bad;
		}

		get(name) {

			if (!this._vars.has(name)) throw new Error(
				`local variable '${name}' is not defined`
			);

			return this._vars.get(name).at(-1);
		}

		get depth() {
			return this._depth;
		}
	};

	constructor(macros={}) {
		super();
		this._prompt  = false;
		this._macros  = macros;
		this._mangle  = 1;

		// track how much stack space is needed for locals here
		this._locals  = new Parser.Frame();

		// setting this internal flag to true kneecaps the parser to not 
		// understand relative or logical operators so that it can generate
		// hacky conditional expressions to execute in roll20 macros
		this._strict  = false;

		// used when parsing templates to allow for macro names as arguments
		this._params  = [];
	}

	parseSource(source) {
		const tokens = tokenize(source);
		return this.parseTokens(tokens);
	}

	parseTokens(tokens) {
		this._reset(tokens);

		const ast = this._parseExpression();

		if (this._index != this._tokens.length) {
			throw new CompilationError(
				`Discovered trailing tokens beginning with '${this.token}'`,
				this.position
			);
		}

		return ast;
	}

	_parseExpression() {
		let out  = null;
		let save = this._index;

		this._index = save;
		out = (
			this._strict // this guards roll20 compatible conditions
				? this._parseAdditiveExpression()
				: this._parseLogicalExpression()
		);
		return out;
	}

	_parseMacro() {

		if (this.token != Tokens.TERMINALS.MACRO) {
			return null;
		}

		const macro = this._parseMacroExpression();

		if (macro == null) {
			this._toPrev();
			throw new CompilationError(
				"This should never throw.", this.position
			);
		}

		const [_m, title, args] = macro;
		const name = title[1];

		// defer expansion until later if this is an parameter
		if (this._params.includes(name)) {
			return macro;
		}

		// otherwise make sure this name is defined
		if (!(name in this._macros)) {
			throw new CompilationError(
				`Macro '${name}' is not defined.`, this.position
			);
		}

		const defined  = this._macros[name];
		const mangle   = [this._mangle, 0];

		this._mangle  += 1;
		const instance = defined.instantiate(args, this._macros, mangle);
		this._mangle  -= 1;

		return instance;
	}

	_parseTemplateDefinition() {

		if (this.token != Tokens.TERMINALS.TEMPLATE) {
			return null;
		}
		this._toNext();

		const title = this._parseText();

		if (title == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected identifier or [bracketed text] after '${this.token}'`,
				this.position
			);
		}
		this._toNext();

		if (this.token != Tokens.TERMINALS.BEGIN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.BEGIN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();


		let   first = true;
		const args  = [];

		for (;;) {

			const out  = this._parseText();

			if (first && out === null) {
				break;
			}

			if (out === null) {
				
				if (first) break;

				throw new CompilationError(
					`Expected identifier after '${Tokens.TERMINALS.ARGSEP}'`,
					this.position,
				);
			}
			this._toNext();
			first = false;	

			args.push(out);

			if (this.token != Tokens.TERMINALS.ARGSEP) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		this._params = args.map(node => node[1]);
		const body   = this._parseExpression();

		if (body == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.STOP) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		const instance = new Template(this._params, body);

		return [Tokens.TERMINALS.TEMPLATE, title, instance];
	}

	_parseMacroArgument() {
		let out  = null;
		let save = this._index;

		out = this._parseString();
		if (out) {
			this._toNext();
			return out;
		}

		out = this._parseConcat();
		if (out) {
			this._toNext();
			return out;
		}

		this._index = save;
		out = this._parseLogicalExpression();
		return out;
	}

	_parseMacroExpression(fillErrorCheck=false) {

		// the token is required unless this is an error check
		if (!fillErrorCheck) {
			if (this.token != Tokens.TERMINALS.MACRO) {
				return null;
			}
			this._toNext();
		}

		const title = this._parseText();

		if (title == null) {

			// fail gracefully as this is an error check
			if (fillErrorCheck) return null;

			this._toPrev();
			throw new CompilationError(
				`Expected identifier or [bracketed text] after '${this.token}'`,
				this.position
			);
		}
		this._toNext();

		if (this.token != Tokens.TERMINALS.BEGIN) {

			// fail gracefully as this is an error check
			if (fillErrorCheck) return null;

			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.BEGIN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._sink();
		this._toNext();

		let   first   = true; 
		const options = [];
		
		for (;;) {

			const out  = this._parseMacroArgument();

			if (first && out === null) {
				break;
			}

			if (out === null) {
				
				if (first) break;

				throw new CompilationError(
					"Expected expression or [bracketed text] after ",
					`'${Tokens.TERMINALS.ARGSEP}'`,
					this.position,
				);
			}
			first = false;		

			options.push(out);

			if (this.token != Tokens.TERMINALS.ARGSEP) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._swim();
		this._toNext();

		return [Tokens.TERMINALS.MACRO, title, options];
	}

	_parseString() {

		if (this.token == null) {
			return null;
		}

		if (!this.token.match(Tokens.REGEXP.STRING)) {
			return null;
		}

		const string = this.token.replaceAll(/[[\]]/g, () => "");

		return ["text", string];
	}

	_parseText() {

		if (this.token == null) {
			return null;
		}

		if (this.token == Tokens.TERMINALS.CONCAT) {
			return this._parseConcat();
		}

		const string = this._parseString();
		if (string != null) return string; 

		const token = this.token.match(Tokens.REGEXP.IDENTIFIER);
		if (!token) return null;

		if (Tokens.SET.RESERVED.has(token[0])) return null;

		return ["text", token[0]];
	}

	_parseConcat() {

		if (this.token != Tokens.TERMINALS.CONCAT) {
			return null;
		}
		this._toNext();

		if (this.token != Tokens.TERMINALS.BEGIN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.BEGIN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._sink();
		this._toNext();

		let   first   = true; 
		const options = [];
		
		for (;;) {

			const out  = this._parseMacroArgument();

			if (first && out === null) {
				break;
			}

			if (out === null) {
				
				if (first) break;

				throw new CompilationError(
					"Expected expression or [bracketed text] after ",
					`'${Tokens.TERMINALS.ARGSEP}'`,
					this.position,
				);
			}
			first = false;		

			options.push(out[0] == "text" ? out : [Tokens.TERMINALS.META, out]);

			if (this.token != Tokens.TERMINALS.ARGSEP) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._swim();
		// this._toNext();

		return ["cat", options];
	}

	_parseLabelExpression() {

		if (this.token != Tokens.TERMINALS.LABEL) {
			return null;
		}
		this._toNext();

		const title = this._parseText();

		if (title == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected identifier or [bracketed text] after '${this.token}'`,
				this.position
			);
		}
		this._toNext();

		if (this.token != Tokens.TERMINALS.ALIAS) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.ALIAS}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		const expr = this._parseExpression();

		if (expr == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}`,
				this.position ?? -1
			);
		}

		if (this.token != Tokens.TERMINALS.PERIOD) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.PERIOD}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.LABEL, title, expr];
	}

	_parseMinMaxExpression() {

		if (   this.token != Tokens.TERMINALS.MIN
			&& this.token != Tokens.TERMINALS.MAX
		) {
			return null;
		}

		const comparison = this.token;

		/*
		 * Stealing this from the if code
		 */
		if (this._prompt) {
			throw new CompilationError(
				wrap(
					"You cannot nest a conditional expression inside of ",
					"a minimum expression because then the entire thing ",
					"would be unable to be translated into a Roll20 ",
					"macro. (Roll20 can't handle this construct)",
				),
				this.position
			);
		}
		this._toNext();

		if (this.token != Tokens.TERMINALS.BEGIN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.BEGIN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._sink();
		this._toNext();

		let   first   = true; 
		const options = [];
		
		for (;;) {

			const out  = this._parseLogicalExpression();

			if (first && out === null) {
				break;
			}

			if (out === null) {
				
				if (first) break;

				throw new CompilationError(
					"Expected expression after ",
					`'${Tokens.TERMINALS.ARGSEP}'`,
					this.position,
				);
			}
			first = false;		

			options.push(out);

			if (this.token != Tokens.TERMINALS.ARGSEP) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._swim();
		this._toNext();

		if (options.length < 2) {
			throw new CompilationError(
				`Expression for '${comparison}' requires at least 2 arguments`,
				this.position ?? -1
			);
		}
		
		return [comparison, options];
	}

	_parseAliasExpression() {

		const first  = this.token;
		const fpos   = this.position;
		const text   = this._parseText();
		this._toNext();

		if (this.token != Tokens.TERMINALS.ALIAS) {
			return null;
		}

		if (text == null) {
			if (this.token == Tokens.TERMINALS.ALIAS) {
				throw new CompilationError(
					`Cannot alias '${first}' unquoted`, fpos
				);
			}

			return null;
		}

		this._toNext();

		const expr = this._parseExpression();

		if (expr == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.PERIOD) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.PERIOD}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.ALIAS, text, expr];
	}

	_parsePromptExpression() {

		if (this.token != Tokens.TERMINALS.PROMPT) {
			return null;
		}

		/*
		 * I sincerely do not understand why one cannot nest prompts on
		 * Roll20, but alas, here we find outselves. WTF, Roll20?
		 */
		if (this._prompt) {
			throw new CompilationError(
				wrap(
					"You cannot nest prompt expressions inside one ",
					"another, because Roll20 does not allow for nested ",
					"prompts and this would be unable to be translated ",
					"into a Roll20 macro"
				),
				this.position
			);
		}
		this._prompt = true;
		this._toNext();

		const title = this._parseText();

		if (title == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected identifier or [bracketed text] after '${this.token}'`,
				this.position
			);
		}
		this._toNext();

		let   defval  = 0;
		let   defset  = false;
		const options = [];
		
		for (let i = 0; Tokens.SET.OPTIONS.has(this.token); ++i) {

			if (this.token == Tokens.TERMINALS.DEFAULT) {
				if (defset) {
					throw new CompilationError(
						"Cannot set second default for prompt",
						this.position
					);
				}

				defval = i;
				defset = true;
			}
			this._toNext();

			let save = undefined, out = undefined;

			save = this._index;
			out  = this._parseAliasExpression();
			if (out) {
				options.push(out);
				continue;
			}
			this._index = save;

			save = this._index;
			out  = this._parseExpression();
			if (out) {
				options.push(out);
				continue;
			}
			this._index = save;

			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`, this.position
			);
		}

		this._prompt = false;

		if (options.length == 0) {
			options.push(["#", 0]);
		}

		if (this.token != Tokens.TERMINALS.STOP) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.PROMPT, title, defval, options];
	}

	_parseLocalScopeExpression(mangle) {

		if (this.token != Tokens.TERMINALS.LET) {
			return null;
		}

		// used for error message purposes
		const start = this.position;
		this._toNext();

		const assignments = [];

		while (this.token.match(Tokens.REGEXP.IDENTIFIER)) {

			/* assignments are terminated by a THEN terminal */
			if (this.token == Tokens.TERMINALS.THEN) break;

			if (Tokens.SET.RESERVED.has(this.token)) {
				throw new CompilationError(
					`keyword ${this.token} cannot be used as a variable name`,
					this.position ?? -1
				);
			}

			// TODO remove if possible to make "and" and "or" detect as resv'd
			if (Tokens.SET.OPERATOR.has(this.token)) {
				throw new CompilationError(
					`keyword ${this.token} cannot be used as a variable name`,
					this.position ?? -1
				);
			}

			const assign = this.token;
			this._toNext();

			if (this.token != Tokens.TERMINALS.ASSIGN) {
				throw new CompilationError(
					`Expected '${Tokens.TERMINALS.ASSIGN}' before variable initialzation expression'`,
					this.position ?? -1
				);
			}
			this._toNext();

			const expr = this._parseExpression();

			if (expr == null) {
				this._toPrev();
				throw new CompilationError(
					`Expected expression after '${this.token}'`,
					this.position ?? -1
				);
			}

			assignments.push([assign, expr]);
			this._locals.create(assign);

			if (this.token == Tokens.TERMINALS.THEN)
				break;

			if (this.token != Tokens.TERMINALS.ARGSEP) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.ARGSEP}' after variable initialization expression`,
					this.position ?? -1
				);
			}
			this._toNext();
		}

		if (assignments.length == 0) {
			throw new CompilationError(
				"scope does not declare any variables"
			);
		}

		if (this.token != Tokens.TERMINALS.THEN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.THEN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		const expr = this._parseExpression();

		if (expr == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position ?? -1
			);
		}

		if (this.token != Tokens.TERMINALS.STOP && this.token != Tokens.TERMINALS.SHORT) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP} or ${Tokens.TERMINALS.SHORT}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		const unused = this._locals.unused();

		if (unused.length > 0) {
			throw new CompilationError(
				`Unused variables in scope: ${unused.join(", ")}`,
				start ?? -1
			);
		}

		// for (let i = 0; i < assignments.length; ++i) {
		// 	assignments[i][0] = this._locals.kill(assignments[i][0]);
		// }
		
		for (let i = 0; i < assignments.length; ++i) {
			this._locals.kill(assignments[i][0]);
		}

		return [Tokens.TERMINALS.LET, assignments, expr];
	}

	_parseMatchExpression() {

		if (this.token != Tokens.TERMINALS.MATCH) {
			return null;
		}
		this._toNext();

		// it's alright if this returns null; then we check case truthiness
		const match = (
			this.token == Tokens.TERMINALS.OPTION
				? ["truthy"]
				: this._parseExpression()
		);

		const options = [];
		
		for (let i = 0; this.token == Tokens.TERMINALS.OPTION; ++i) {

			const conditions = [];

			for (let j = 0; this.token == Tokens.TERMINALS.OPTION; ++j) {
				// we already saw a case, so go to the next one token
				this._toNext();

				let out = this._parseExpression();
				
				if (out == null) {
					throw new CompilationError(
						wrap(
							`Expected expression after ${Tokens.TERMINALS.OPTION}'`,
						),
						this.position ?? -1
					);
				}
				
				conditions.push(out);

			}

			options.push(conditions);

			if (this.token != Tokens.TERMINALS.THEN) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.THEN}' but found '${this.token}'`,
					this.position ?? -1
				);
			}
			this._toNext();

			// // we already saw a case, so go to the next one token
			// this._toNext();

			// let out = this._parseExpression();
			
			// if (out == null) {
			// 	throw new CompilationError(
			// 		wrap(
			// 			`Expected expression after ${Tokens.TERMINALS.OPTION}'`,
			// 		),
			// 		this.position ?? -1
			// 	);
			// }
			
			// options.push(out);

			// if (this.token != Tokens.TERMINALS.THEN) {
			// 	throw new CompilationError(
			// 		`Expected token '${Tokens.TERMINALS.THEN}'`,
			// 		this.position ?? -1
			// 	);
			// }
			// this._toNext();

			const out = this._parseExpression();
			
			if (out == null) {
				throw new CompilationError(
					wrap(
						`Expected expression after ${Tokens.TERMINALS.THEN}'`,
					),
					this.position ?? -1
				);
			}

			options.push(out);
		}

		if (options.length < 1) {
			throw new CompilationError(
				wrap(
					`Expected one or more '${Tokens.TERMINALS.OPTION}' expressions`,
				),
				this.position ?? -1
			);
		}

		if (this.token != Tokens.TERMINALS.DEFAULT) {
			throw new CompilationError(
				wrap(
					`Expected token '${Tokens.TERMINALS.ELSE}' but found '${this.token}'`,
				),
				this.position ?? -1
			);
		}
		this._toNext();

		// Eat a then. It's sometimes nice for code style
		if (this.token == Tokens.TERMINALS.THEN) {
			this._toNext();
		}

		const def = this._parseExpression();

		if (def == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}`,
				this.position ?? -1
			);
		}

		if (this.token != Tokens.TERMINALS.STOP) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.MATCH, match, options, def];
	}

	_parseMetaIfExpression() {

		return this._parseGenericConditionalExpression(
			Tokens.TERMINALS.METAIF, Tokens.TERMINALS.METAIF
		);
	}

	_parseBothIfExpression() {

		return this._parseGenericConditionalExpression(
			Tokens.TERMINALS.BOTHIF, Tokens.TERMINALS.BOTHIF
		);
	}

	_parseConditionalExpression() {		

		if (this.token != Tokens.TERMINALS.IF) {
			return null;
		}

		/*
		 * Well, I probably never should have expected this to work anyway
		 */
		if (this._prompt) {
			throw new CompilationError(
				wrap(
					"You cannot nest a conditional expression inside of ",
					"a prompt expression because then the entire thing ",
					"would be unable to be translated into a Roll20 ",
					"macro. (Roll20 can't handle this construct)",
				),
				this.position
			);
		}

		return this._parseGenericConditionalExpression(
			Tokens.TERMINALS.IF, Tokens.TERMINALS.IF, true
		);
	}

	_parseGenericConditionalExpression(expected, parent, strict=false) {

		if (this.token != expected) {
			return null;
		}
		this._toNext();

		// setting this internal flag to true kneecaps the parser to not 
		// understand relative or logical operators so that it can generate
		// hacky conditional expressions to execute in roll20 macros
		const save   = this._strict;
		this._strict = strict;

		// if this is a raw conditinal that's supposed to appear in a rol20
		// macro, then use a dumb version that only understand a single
		// relative operator; otherwise parse things intelligently
		const comparison = (
			strict
				? this._parseStrictRelativeExpression()
				: this._parseExpression()
		);

		// return the parser's kneecaps if they were taken
		this._strict = save;

		// alright, done with the nonsense
		if (comparison == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.THEN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.THEN}' but found '${this.token}'`,
				this.position ?? -1
			);
		}
		this._toNext();

		const tBranch = this._parseExpression();

		if (tBranch == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		let fBranch = undefined;
		if (this.token == Tokens.TERMINALS.ELSE) {
			this._toNext();

			// Eat a then. It's sometimes nice for code style
			if (this.token == Tokens.TERMINALS.THEN) {
				this._toNext();
			}

			fBranch = this._parseExpression();

			if (fBranch == null) {
				this._toPrev();
				throw new CompilationError(
					`Expected expression after '${this.token}`,
					this.position ?? -1
				);
			}

			if (this.token != Tokens.TERMINALS.STOP) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.STOP}' but found '${this.token}'`,
					this.position ?? -1
				);
			}
			this._toNext();

		} else if (this.token == Tokens.TERMINALS.ELSEIF) {

			fBranch = this._parseGenericConditionalExpression(
				Tokens.TERMINALS.ELSEIF, parent
			);

			if (fBranch == null) {
				this._toPrev();
				throw new CompilationError(
					`Expected expression after '${this.token}'`,
					this.position ?? -1
				);
			}

		} else {
			throw new CompilationError(
				wrap(
					`Expected token '${Tokens.TERMINALS.ELSE}' or `,
					`'${Tokens.TERMINALS.ELSEIF}' but found '${this.token}'`,
				),
				this.position ?? -1
			);
		}
		
		return [parent, comparison, tBranch, fBranch];
	}

	_parseLogicalExpression() {
		return this._parseOrExpression();
	}

	_parseStrictRelativeExpression() {

		const lhs = this._parseExpression();
		if (lhs == null) return lhs;

		const operator = this.token;

		if (operator == null) {
			throw new CompilationError(
				"expected relative operator after expression", -1
			);
		}

		if (!Tokens.SET.RELATIVE.has(operator)) {
			throw new CompilationError(
				`'${operator}' is not a relative operator`,
				this.position
			);
		}
		this._toNext();

		const rhs = this._parseExpression();
		
		if (rhs == null) {
			this._toPrev();
			throw new CompilationError(
				`expected expression after '${operator}'`,
				this.position
			);
		}

		return [operator, lhs, rhs];
	}

	static BinaryOperatorFactory(operators, operands, ban_prompt=false) {
		return function() {

			let lhs = null, rhs = null, op = "";

			if ((lhs = this[operands]()) == null) return lhs;

			while (this.token != null) {

				if (operators.has(op = this.token)) {
					this._toNext();
				} else {
					if (this._isTopLevel() && this.token == Tokens.TERMINALS.END) {
						throw new CompilationError(
							"encountered end of nested expression at top level",
							this.position
						);
					} else {
						return lhs;
					}
				}

				if ((rhs = this[operands]()) != null) {
					lhs = [op, lhs, rhs];
				} else {
					this._toPrev();

					throw new CompilationError(
						`No right operand to infix operator ${op}`,
						this.position
					);
				}
			}

			return lhs;
		};
	}

	_parseRandomExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.RANDOM,
			"_parseNegationExpression",
		)
	);

	_parseMultiplicativeExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.MULTIPLICATIVE,
			"_parseRandomExpression",
		)
	);

	_parseAdditiveExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.ADDITIVE,
			"_parseMultiplicativeExpression",
		)
	);

	_parseRelativeExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.RELATIVE,
			"_parseAdditiveExpression",
		)
	);

	_parseAndExpression = (
		Parser.BinaryOperatorFactory(
			new Set([Tokens.TERMINALS.AND]),
			"_parseRelativeExpression",
		)
	);

	_parseOrExpression = (
		Parser.BinaryOperatorFactory(
			new Set([Tokens.TERMINALS.OR]),
			"_parseAndExpression",
		)
	);

	_parseUnaryOperatorCase() {
		if (!Tokens.SET.UNARY.has(this.token)) return null;
		const operator = this.token;
		this._toNext();

		const out = this._parseNegationExpression();
		if (out == null) return out;

		return [operator, out];
	}

	_parseNegationExpression() {
		let out  = null;
		let save = this._index;

		this._index = save;
		out = this._parseUnaryOperatorCase();
		if (out != null) return out;

		this._index = save;
		out = this._parseValueExpression();
		return out;
	}

	_parseValueExpression() {

		const token = this.token;

		if (!this.token) return null;

		/* attempt to parse alias expression */
		const save  = this._index;
		const out   = this._parseAliasExpression();
		if (out != null) return out;
		this._index = save;

		if (token.match(Tokens.REGEXP.STRING)) {
			throw new CompilationError(
				`Invalid location for [bracketed text] ${token}`,
				this.position,
			);
		}

		/* now we know that it isn't so try everything else */

		if (   token == Tokens.TERMINALS.MIN
			|| token == Tokens.TERMINALS.MAX	
		) {

			/* check whether this is a min or max expression */
			const save  = this._index;
			const out   = this._parseMinMaxExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.LABEL) {

			/* check whether this is a label expression */
			const save  = this._index;
			const out   = this._parseLabelExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.MATCH) {

			/* check whether this is a match expression */
			const save  = this._index;
			const out   = this._parseMatchExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.METAIF) {

			/* check whether this is a metaif expression */
			const save  = this._index;
			const out   = this._parseMetaIfExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.BOTHIF) {

			/* check whether this is a bothif expression */
			const save  = this._index;
			const out   = this._parseBothIfExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.PROMPT) {

			/* check whether this is a prompt expression */
			const save  = this._index;
			const out   = this._parsePromptExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.IF) {

			/* check whether this is a conditional expression */
			const save  = this._index;
			const out   = this._parseConditionalExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.LET) {

			/* check whether this is a new local scope expression */
			const save  = this._index;
			const out   = this._parseLocalScopeExpression();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.MACRO) {

			/* check whether this is a macro instantiation */
			const save  = this._index;
			const out   = this._parseMacro();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.TEMPLATE) {

			/* check whether this is a macro definition */
			const save  = this._index;
			const out   = this._parseTemplateDefinition();
			if (out != null) return out;
			this._index = save;

		} else if (token == Tokens.TERMINALS.BOOLEAN) {

			/* this exists mostly for debug */
			this._toNext();

			const save  = this._index;
			
			if (this.token != Tokens.TERMINALS.BEGIN) return null;
			const fpos = this.position;
			this._toNext();

			this._sink();
			const inner = this._parseOrExpression();
			if (inner == null) return inner;
			this._swim();

			if (this.token != Tokens.TERMINALS.END) {
				throw new CompilationError(
					`unclosed nested expression starting at ${fpos}`, fpos
				);
			}
			this._toNext();

			if (inner != null) return [token, inner];
			this._index = save;

		} else if (Tokens.SET.CALL.has(token)) {

			/* check whether this is a function operator */
			this._toNext();

			const save  = this._index;
			const out   = this._parseNestedExpression(false);
			if (out != null) return [token, out];
			this._index = save;

		} else if (Tokens.SET.BUILTINS.has(token)) {

			/* check whether this is a builtin variable */
			this._toNext();
			return [token];

		} else if (Tokens.SET.RESERVED.has(token)) {

			/* check whether this is another reserved token */

			throw new CompilationError(
				`Reserved word '${token}' cannot be used as an identifier`,
				this.position,
			);

		} else if (token.match(Tokens.REGEXP.IDENTIFIER)) {

			/* attempt to check if this is a malformed macro instantiation */
			const save  = this._index;
			const out   = this._parseMacroExpression(true);
			this._index = save;

			if (out != null) {
				throw new CompilationError(
					`Precede macro instantiations with '${Tokens.TERMINALS.MACRO}'`,
					this.position
				);
			}

			/* it's not, so check whether this is some other identifier */
			this._toNext();

			const usage  = this._locals.use(token);
			return usage ? usage : ["$global", token];

		} else if (token.match(Tokens.REGEXP.LITERAL)) {

			/* check whether this is a number literal */

			this._toNext();
			return ["#", Number(token)];

		} else {

			/* check whether this is a nested expression */

			const save = this._index;
			const out  = this._parseNestedExpression(true);
			if (out != null) return out;
			this._index = save;

		}

		/* it wasn't any of those */

		return null;
	}

	_parseNestedExpression(quote=true) {

		if (this.token != Tokens.TERMINALS.BEGIN) return null;
		const fpos = this.position;
		this._toNext();

		this._sink();
		const inner = this._parseExpression();
		if (inner == null) return inner;
		this._swim();

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`unclosed nested expression starting at ${fpos}`, fpos
			);
		}
		this._toNext();

		return quote ? ["()", inner] : inner;
	}
}

function parse(source, macros={}) {
	const parser = new Parser(macros);
	return parser.parseSource(source);
}

class Template {

	constructor(args, body) {
		// this.name = name;
		this.args = args;

		if (body instanceof Array) {
			this.body = body;
		}
		else
		if (typeof body == "string") {
			this.body = parse(body);
		}
		else {
			throw new Error("Template body must be string or AST");
		}
		
	}

	instantiate(values, macros={}, mangle=[1, 0]) {

		if (values.length != this.args.length) {
			console.error(values);
			throw new CompilationError(
				wrap(
					`expected ${this.args.length} arguments but recieved `,
					`${values.length} instead.`,
				)
			);
		}

		const map = new Map();
		for (let i = 0; i < values.length; ++i) {
			map.set(this.args[i], values[i]);
		}

		function mangler(token, pair) {
			const parts = token.split("#");
			const depth = pair[1] + (parts.length == 3 ? Number(parts[2]) : 0);
			const scope = pair[0] + (parts.length == 3 ? Number(parts[1]) : 0);
			return `${parts[0]}#${scope}#${depth}`;
		}

		function clone(map, node, macros, in_cat) {

			const list = [];

			/* take into account the expansion of the variable stack */
			// if (node[0] == "let") {
			// 	debugger;

			// 	const size = node[1].length;
			// 	offset    += size;

			// 	const vars = clone(map, node[1], macro, in_cat);
			// 	const expr = clone()
			// 	offset    -= size;

			// 	return ["let" ];
			// }

			/* variable macro name expansion */
			if (node[0] == "fill") {

				const call = node[1][1];
				const args = node[2];

				// call is not a parameter
				if (!map.has(call)) {
					throw new CompilationError(
						wrap(
							`'${call}' is not a parameter nor a defined macro`
						)
					);
				}

				const swap = map.get(call)[1];

				if (!(swap in macros)) {
					throw new CompilationError(
						wrap(
							`Attempted to instantiate macro '${swap}' in `,
							`place of macro parameter '${call}', however `,
							"no such macro is defined."
						)
					);
				}

				const macro = macros[swap];

				if (args.length != macro.args.length) {
					throw new CompilationError(
						wrap(
							`Attempted to instantiate macro '${swap}' in `,
							`place of macro parameter '${call}', however `,
							`'${swap}' accepts ${macro.args.length} argument(s) `,
							`and ${args.length} argument(s) were provided`
						)
					);
				}

				// console.log(`${call} -> ${swap}`, args);
				return macro.instantiate(args, macros, [mangle[0], mangle[1] + 1]);
			}

			/* special case where "$global" should be treated as a string
			 * ["cat", [<ast>, <!> ["meta" ["$global", <arg>]], <ast>]]
			 */
			if (in_cat == 2 && node[0] == "meta" && node[1][0] == "$global") {

				const value = map.get(node[1][1]);

				if (value[0] == "text") {
					return value;
				}

				/* pass through */
			}

			/* substitute expression */
			if (node[0] == "$global" && map.has(node[1])) {

				const value = map.get(node[1]);

				if (value[0] == "text") {
					throw new CompilationError(
						wrap(
							"cannot substitute [bracketed text] for template ",
							`argument '${node[1]}'. Expected an expression.`,
						)
					);
				}

				return map.get(node[1]);
			}

			/* mangle the definitions of internal locals */
			if (node[0] == "let") {
				
				const assign = [];

				for (let [name, expr] of node[1]) {
					const cloned = clone(map, expr, macros, in_cat);
					assign.push([mangler(name, mangle), cloned]);
				}

				return ["let", assign, clone(map, node[2], macros, in_cat)];
			}

			/* mangle the uses of internal locals */
			if (node[0] == "$local") {
				return ["$local", mangler(node[1], mangle)];
			}

			/* substitute some text feature */
			if (node[0] == "text" && map.has(node[1])) {

				const value = map.get(node[1]);

				if (value[0] != "text" && value[0] != Tokens.TERMINALS.CONCAT) {
					throw new CompilationError(
						wrap(
							"cannot substitute expression for template ",
							`argument '${node[1]}'. Expected [bracketed text].`,
						)
					);
				}

				return map.get(node[1]);
			}

			// /* substitute local with offset */
			// if (node[0] == "$local") {
			// 	return ["$local", node[1] + offset];
			// }

			if (in_cat >= 0) ++in_cat;

			/* copy the ast node as is */
			for (let element of node) {
				if (element instanceof Array) {
					list.push(clone(map, element, macros, in_cat));
				}  else {
					list.push(element);

					if (element == Tokens.TERMINALS.CONCAT) {
						in_cat = 1;
					}
				}
			}

			return list;
		}

		return clone(map, this.body, macros, -1);
	}

	static parse(source, macros={}) {
		const [op, title, template] = parse(source, macros);
		
		if (op != Tokens.TERMINALS.TEMPLATE) {
			throw new CompilationError("Expected a template definition", 0);
		}

		return [title[1], template];
	}

}

/**
 * Expression compilation and execution environment. Has to be able to handle
 * both features since code execution at runtime is possible using the meta()
 * compile time computation construct and the metaif conditional compilation
 * construct. The term compilation here includes Roll20 macro generation.
 */
class Env {

	constructor(flags, variables, macros) {

		if (flags === undefined) {
			throw TypeError("flags is a required argument");
		}

		if (variables == undefined) {
			throw TypeError("context is a required argument");
		}

		this.flags     = flags;
		this.stack     = [];
		this.variables = variables;
		this.calls     = new Set();
		this.macros    = macros || new Map();
		this.scope     = [];
	}

	template(title, template) {
		
		const replace = this.macros.has(title);
		this.macros.set(title, template);

		return Number(replace);
	}

	instantiate(title, args) {
		if (!this.macros.has(title)) {
			throw new CompilationError(
				`Template ${title} is undefined in this environment.`
			);
		}

		return this.macros.get(title).instantiate(args);
	}

	static flagset(flags) {
		const values = [
			[Env.RUNTIME, "runtime"],
			[Env.CODEGEN, "codegen"],
			[Env.MACROGEN, "macrogen"],
			[Env.LABEL, "label"],
			[Env.ALIAS, "alias"],
			[Env.COMPACT, "compact"],
		];

		const set = new Set();

		for (let [bin, str] of values) {
			if (flags & bin) set.add(str);
		}

		return set;
	}

	flagset() {
		return Env.flagset(this.flags);
	}

	execute(code) {
		// this.reset();

		let instruction = 0;

		while (instruction < code.length) {
			instruction += code[instruction](this);
		}

		return this.pop();
	}

	reset() {
		/* funny js way to clear an array */
		this.stack.length = 0;
		/* more sane js way to clear a set */
		this.calls.clear();
	}

	read(name, fallback=0) {

		if (!(name in this.variables)) {
			throw new CompilationError(
				`Expression variable '${name}' not defined in this context`, 0
			);
		}

		if (this.calls.has(name)) {
			console.error(`Recursive read of expression variable '${name}'`);
			return fallback;
		}

		this.calls.add(name);
		const value = this.variables[name](this);
		this.calls.delete(name);

		if (Number.isNaN(value)) {
			throw new CompilationError(`${name} evaluated to NaN`);
		}

		return value;
	}

	in_scope(offset) {
		return offset < 0 || this.scope.length <= offset; 
	}

	func(name, fallback=0) {
		return (() => this.read(name, fallback));
	}

	with(flags) {
		this.flags = flags;
		return this;
	}

	clone(flags) {
		return new Env(this.flags | flags, this.variables, this.macros);
	}

	push(value) {
		this.stack.push(value);
	}

	pop() {
		return this.stack.pop();
	}

	peek() {
		return this.stack.at(-1);
	}

	/**
	 * Used for metaprogramming, to determine whether this compulation is
	 * executing code at compile time. Always starts as false but is 
	 * set to true once execution enters a meta() or metaif contruction.
	 * Not a user-provided flag. Not-inherited. Variable.
	 * @type {boolean}
	 */
	static RUNTIME = 1 << 0;

	get runtime() {
		return Boolean(this.flags & Env.RUNTIME);
	}

	/**
	 * Used for metaprogramming, to determined whether this compilation is
	 * generating an executable object for the character builder or not.
	 * This is set at the beginning of the compilation process.
	 * Not a user-provided flag. Inherited. Constant.
	 * @type {boolean}
	 */
	static CODEGEN = 1 << 1;

	get codegen() {
		return Boolean(this.flags & Env.CODEGEN);
	}


	/**
	 * Used for metaprogramming, to determine whether this compilation is
	 * generating a Roll20 macro string as output or not.
	 * This is set at the beginning of the compilation process.
	 * Not a user-provided flag. Inherited. Constant.
	 * @type {boolean}
	 */
	static MACROGEN = 1 << 2;

	get macrogen() {
		return Boolean(this.flags & Env.MACROGEN);
	}

	/**
	 * A flag used in macrogen on whether Roll20 labels should be added to
	 * macrogen output. No effect on codgen.
	 * User-provided vlag. Inherited. Constant.
	 */
	static LABEL = 1 << 3;

	get label() {
		return Boolean(this.flags & Env.LABEL);
	}


	/**
	 * A flag used in macrogen on whether variable name substitution  
	 * should be performed on alias expressions. No effect on codegen.
	 * User-provided flag. Inherited. Constant.
	 * @type {boolean}
	 */
	static ALIAS = 1 << 4;

	get alias() {
		return Boolean(this.flags & Env.ALIAS);
	}

	static COMPACT = 1 << 5;

	get compact() {
		return Boolean(this.flags & Env.COMPACT);
	}
}

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
	constructor(source, context={}, macros={}) {
		this.source  = source;

		try {
			const ast      = parse(source, macros);
			const env      = new Env(Env.CODEGEN, context);
			const cdg      = codegen(env, ast);

			this.env       = env;
			this.ast       = ast;
			this.symbols   = cdg.symbols;
			this.code      = cdg.instructions;
			this.env.flags = 0;
		} catch (e) {
			if (e instanceof CompilationError) {
				console.error(source);
			}
			throw e;
		}
	}

	/**
	 * Execute this expression in the given context. If no context is given
	 * it will draw variable values from the context it was compiled with.
	 * @param {Object} context - provide an alternate context to execute in
	 */
	execute(env) {
		env = env || this.env.with(Env.RUNTIME);
		return env.execute(this.code);
	}

	macro(flags) {
		return this.macrogen(this.env.with(Env.MACROGEN | flags));
	}

	macrogen(env) {

		env = env || this.env.with(Env.MACROGEN);

		// if (!(env instanceof Env)) debugger;

		const walk = (node) => {
			const operator = Tokens.OPERATORS[node.length - 1][node[0]];
			return operator.macrogen(walk, node, env);
		};

		return walk(this.ast);
	}

	static codegen (env, ast) {

		const code = {instructions: [], symbols: new Set()};

		function walk(node) {
			const operator = Tokens.OPERATORS[node.length - 1][node[0]];
			operator.codegen(walk, code, node, env);
		}

		walk(ast);

		return code;
	}
}

const codegen = CompiledExpression.codegen;

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
	constructor(context={}, macros={}) {
		this.context = context;
		this.macros  = macros;
		this.throws  = CompilationError;
	}

	/**
	 * Compile to provided source string into an expressions that executes
	 * with the provided context. (Defaults to internal.)
	 * @param {string} source - source code the expression
	 * @param {object} context - a map-like object for variable values
	 * @returns {CompiledExpression} - an executable expression object
	 */
	compile(source, define="") {
		if (define) {
			this.define({
				name  : define,
				about : "Feature attribute.",
				expr  : source,
			});

			return this.context[define].e;
		}
		return new CompiledExpression(source, this.context, this.macros);
	}

	/**
	 * Define a new function for this context. Ideally any time a function is
	 * added to a context, it should be done exclusively thought this function.
	 */
	define(template) {
		

		let fn = undefined;

		const source = (
			template.expr.toString()
				/* remove indentation from source */
				.replace(/\t{3,4}/g, "")
				/* convert remaining into spaces */
				.replace(/\t/g, "  ")
		);

		if (typeof template.expr == "string") {

			const e = this.compile(template.expr);

			fn = ((env) => {
				return Calculator.evaluate(e, env);
			});

			fn.e = e;
		
			fn.s = element("div", [
				"=== Calculator Expression ===", element("br"),
				element("div", Calculator.highlight(source), "calc-code"),
			]);

			fn.v = (() => e.symbols || []);

		} else if (template.expr instanceof Array) {
			// TODO either join the array or sum them.
			template.compose = template.compose || " + ";
			throw new Error("TODO");
		} else {
			fn   = template.expr;
			fn.s = element("div", [
				"=== JavaScript Function ===", element("br"),
				element("pre", source)
			]);

			const set = new Set();
			fn.v = template.vars || (() => set);
		}

		fn.called      = template.name;
		fn.header      = tooltip(
			element("span", [
				"Variable: ",
				element("span", template.name, "datum")
			]),
			wrap(
				"Click on the text below to switch between showing a ",
				"description and the definition."
			)
		);

		fn.about       = new SwapText([
			hilight(template.about),
			element("pre", fn.s),
		]).root;

		this.context[fn.called] = fn;

		return fn;
	}


	*variables(pattern) {
		for (let v in this.context) {
			if (!pattern || v.match(pattern))
				yield this.context[v];
		}
	}


	dependants(variable) {

		if (!(variable in this.context)) {
			// throw Error(`${variable} is not a valid key for context`);
			console.warn(`${variable} is not a valid key for context`);
			return new Set();
		}

		const fn = this.context[variable];
		return fn.dep || new Set(); // TODO make this not fail silently.
	}

	/**
	 * Compute which variables depend on each other.
	 * This uses a top down traversal and sets the "depends on" set as the 
	 * set of all variables that reach it using this traversal method.
	 */
	compute_dependants(variable, set=new Set()) {

		if (!(variable in this.context))
			throw Error(`${variable} is not a valid key for context`);

		const fn = this.context[variable];
		fn.dep   = ("dep" in fn) ? fn.dep.union(set) : new Set(set);
		// if (!("e" in fn)) return;

		set.add(variable);
		for (let each of fn.v()) {
			if (set.has(each)) continue;
			this.compute_dependants(each, set);
		}
		set.delete(variable);

	}

	static clean(identifier) {
		return identifier.replace(/\|/g, "_");
	}

	static line(a, b, c=false) {
		return `\t${this.clean(a)}->${this.clean(b)}${c ? "_R" : ""};`;
	}

	/**
	 * Compute the dependancies in this context for a given expression.
	 */
	dependancies(expr, set=new Set(), graph=null) {

		let collection = undefined;

		if (expr instanceof CompiledExpression) {
			collection = expr.symbols;
		} else if (typeof expr == "string" || expr instanceof String) {

			if (!(expr in this.context)) {
				return this.dependancies(this.compile(expr), set);
			}

			collection = this.context[expr].v();

		} else if (expr instanceof Set) {
			collection = expr;
		} else {
			throw new Error("argument must be string or CompiledExpression");
		}

		for (let each of collection) {

			if (graph !== null)
				graph.push(Compiler.line(expr, each, set.has(each)));

			if (set.has(each)) continue;
			set.add(each);
			this.dependancies(each, set, graph);
		}

		return set;
	}

	graph(expr) {
		const queue = [];
		const set   = new Set();
		const graph = [];

		queue.push(expr);

		while (queue.length) {
			const v = queue.shift();

			for (let each of this.context[v].v()) {
				graph.push(Compiler.line(v, each, set.has(each)));

				if (set.has(each)) continue;
				set.add(each);

				queue.push(each);
			}

		}

		console.log(graph.join("\n"));
	}

	local(source, macros=this.macros) {
		const [name, tmp] = Template.parse(source, macros);
		const id          = `locals|${name}`;
		macros[id]        = tmp;
		return id;
	}

	template(source, macros=this.macros) {
		const [name, tmp] = Template.parse(source, macros);
		macros[name]      = tmp;
		return name; 
	}

	createLocals(templates, macros=this.macros) {

		if (templates == null) return null;

		const locals  = new Set();

		for (let each of templates) {

			if (!(each instanceof Array)) {
				throw new Error(
					`expected array of strings but got ${each}`
				);
			}

			const string = each.join("\n");
			const id     = this.local(string, macros);
			locals.add(id);
		}

		return locals;
	}

	deleteLocals(locals) {
		if (locals && locals.size > 0) {
			for (let each of locals) {
				delete this.macros[each];
			}
		}
	}

}

/* create and return namespace */
return Object.freeze({
	
	/* this has to be exposed to be catchable */
	CompilationError: CompilationError,

	/* this is the main class for the module*/
	Compiler: Compiler,

	/* execution environment for compile expressions */
	Env: Env,

	Template: Template,

	tokenize: tokenize,

	highlight: highlight,

	HELP: Tokens.HELP,

	is: function(object) {
		return object instanceof CompiledExpression;
	},

	asIdentifier: function(string) {
		const rep = string.replace(/[^A-Za-z0-9_$|]/g, char => "_");
		if (rep.length == 0) return rep;
		return rep[0].match(/[0-9|]/) ? `$${rep}` : rep;
	},

	/* convenience function to compile easily */
	compile: function(source, context={}) {
		return new CompiledExpression(source, context);
	},

	/* convenience function to use code easily */
	evaluate: function(expression, env) {
		if (expression instanceof CompiledExpression) {

			/* make sure we have an env; assume runtime if undef */
			env = env || expression.env.with(Env.RUNTIME);

			return (env.runtime
				? expression.execute(env)
				: expression.macrogen(env));
		}
		if (typeof expression === "number") {
			return expression;
		}
		throw new TypeError(
			"Argument must be Expression or number"
		);
	},

	/* convenience function to execute easily */
	execute: function(expression, env) {
		if (expression instanceof CompiledExpression) {
			return expression.execute();
		}
		if (typeof expression === "number") {
			return expression;
		}
		throw new TypeError(
			"Argument must be Expression or number"
		);
	},

	/* convenience function to produce a macro */
	macro: function(expression, options) {
		if (expression instanceof CompiledExpression) {
			return expression.macro(options);
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

	// GRAMMAR: GRAMMAR,
	// codegen: codegen,
	// Tokens: Tokens,
	parse: parse,

	Frame: Parser.Frame,
});

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Calculator;

}

/* exported Calculator */
