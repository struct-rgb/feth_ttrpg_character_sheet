
/**
 * A module implementing facilities for compiling, transforming, and executing
 * simple mathematical expressions written in infix notation
 * @module expression
 */

/* global element */
/* global wrap */
/* global hilight */
/* global uniqueID */
/* global delimit */

/* we're going to go for a different pattern with this one */
const Expression = (function() {

const _GRAMMAR = (`
<expr>      ::= <control> | <add-expr>

<stop>      ::= "end" | <null>
<text>      ::= <identifier> | <string>
<control>   ::= <label> | <metaif> | <prompt> | <cond> | <min> | <max>

<label>     ::= "label" <text> <expr> <stop>

<prompt>    ::= "ask" <text> <options> <stop>
<options>   ::= <option> | <options> <option>
<option>    ::= "," <expr> | ";" <expr>

<cond>      ::= "if" <rel-expr> "then" <add-expr> "else" <add-expr> <stop>
<metaif>    ::= "metaif" <rel-expr> "then" <expr> "else" <expr> <stop>

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

class CompilationError extends Error {
	constructor(message, position) {
		super(message);
		this.position = position;
	}
}

const Tokens = (function() {

	const namespace = {};

	/* define regular expressions for lexical analysis */

	namespace.REGEXP = {
		STRING     : new RegExp("\\[[^\\]]*\\]"),
		LITERAL    : new RegExp("[0-9]+(\\.[0-9]+(e[+-]*[0-9]+)*)*"),
		IDENTIFIER : new RegExp("[A-Za-z_$][0-9A-Za-z_$|]*"),
		OPERATOR   : new RegExp(
			"==|<>|>=|<=|>|<|\\+|-|\\*|/|%|\\(|\\)|=|,|;|\\{|\\}"
		),
		WHITESPACE : new RegExp("[ \\t\\n\\r]+"),
		BLANKSPACE : new RegExp("^[ \\t\\n\\r]+$"),
	};

	/* the order of these subexpressions is important */

	namespace.REGEXP.TOKENS = new RegExp([
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
		MIN      : "less",
		MAX      : "more",
		PROMPT   : "ask",
		OPTION   : ",",
		DEFAULT  : ";",
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
		// IN       : "in",

		/* builtin variables */
		BUILTIN_CODEGEN     : "builtins|codegen",
		BUILTIN_MACROGEN    : "builtins|macrogen",
		BUILTIN_COMPTIME    : "builtins|comptime",
		BUILTIN_RUNTIME     : "builtins|runtime",
	};

	namespace.TERMINALS = TERMINALS;

	/* a namespace for sets of terminals */

	namespace.SET = {
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
		]),

		RESERVED: new Set([
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
			TERMINALS.NOT,
			TERMINALS.DIE,
			TERMINALS.MACRO,
			TERMINALS.TEMPLATE,
			// TERMINALS.IN,
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
			
			if ("help" in template) {
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
	 * COND  => 4
	 */

	namespace.OPERATORS = {};

	namespace.OPERATORS[0] = {

		[TERMINALS.BUILTIN_RUNTIME] : new Operator(0, {

			help: [
				TERMINALS.BUILTIN_RUNTIME,
				TERMINALS.BUILTIN_RUNTIME,
				wrap(
					"A builtin variable; Evaluates 1 if evaluated inside of a ",
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

		"$" : new Operator(0, {

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
				const [_opcode, argument] = node;
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

		[TERMINALS.FLOOR]: new Unary(0, {

			help: [
				TERMINALS.FLOOR,
				"floor({1})",
				wrap(
					"Returns {1} rounded down to the nearest ",
					"whole number.",
				),
				"any expression"
			],

			fn: (x => Math.floor(x)),

		}),

		[TERMINALS.ABS]: new Unary(0, {

			help: [
				TERMINALS.ABS,
				"abs({1})",
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
				"ceil({1})",
				wrap(
					"Returns {1} rounded up to the nearest ",
					"whole number."
				),
				"any expression",
			],

			fn: (x => Math.ceil(x)),

		}),

		[TERMINALS.ROUND]  : new Unary(0, {

			help: [
				TERMINALS.ROUND,
				"round({1})",
				"Returns {1} rounded to the nearest whole number.",
				"any expression",
			],

			fn: (x => Math.round(x)),
		}),


		[TERMINALS.SIGN]: new Operator(0, {

			help: [
				TERMINALS.SIGN,
				"sign({1})",
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

		[TERMINALS.NOT]: new Operator(0, {

			help: [
				TERMINALS.NOT,
				"not({1})",
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

		[TERMINALS.UMINUS] : new Operator(0, {

			help: [
				TERMINALS.UMINUS,
				"-{1}",
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
				"+{1}",
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

		[TERMINALS.INSPECT]  : new Operator(0, {

			help: [
				TERMINALS.INSPECT,
				"inspect({1})",
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

		[TERMINALS.META]  : new Operator(0, {

			help: [
				TERMINALS.META,
				"meta({1})",
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
					if (error instanceof Expression.CompilationError) {
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
					if (error instanceof Expression.CompilationError) {
						console.error(argument);
					}
					throw error;
				}
			},
		}),

		[TERMINALS.CONCAT] : new Operator(0, {

			help: [
				TERMINALS.CONCAT,
				"cat({1})",
				wrap(
					"Concatenate each item in {1} into a single string."
				),
				"comma separated list of expressions or [bracketed text]"
			],

			codegen: function(recurse, code, node, env) {
				const [_opcode, argument] = node;

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
		})
	};

	namespace.OPERATORS[2] =  {

		[TERMINALS.LABEL] : new Operator(0, {

			help: [
				TERMINALS.LABEL,
				"label {1} {{2}}",
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
				const [_opcode, argA, argB] = node;

				if (!env.label) {
					return recurse(argB);
				}

				return `${recurse(argB)} [${recurse(argA)}]`;
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

		[TERMINALS.MIN] : new Operator(0, {

			help: [
				TERMINALS.MIN,
				"less {1} else {2}",
				wrap(
					"Returns the lesser of {1} and {2}. Cannot ",
					"appear inside of [ask] options.",
				),
				"any expression",
				"any expression",
			],

			codegen(recurse, code, node, env) {
				const [_opcode, argA, argB] = node;
				recurse(argA);
				recurse(argB);
				code.instructions.push(function(env) {
					const x = env.pop();
					const y = env.pop();
					env.push(Math.min(y, x));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				return `{(${recurse(argA)}),(${recurse(argB)})}kl1`;
			},
		}),

		[TERMINALS.MAX] : new Operator(0, {

			help: [
				TERMINALS.MAX,
				"more {1} else {2}",
				wrap(
					"Returns the greater of {1} and {2}. Cannot ",
					"appear inside of [ask] options.",
				),
				"any expression",
				"any expression",
			],

			codegen(recurse, code, node, env) {
				const [_opcode, argA, argB] = node;
				recurse(argA);
				recurse(argB);
				code.instructions.push(function(env) {
					const x = env.pop();
					const y = env.pop();
					env.push(Math.max(y, x));
					return 1;
				});
			},

			macrogen: function(recurse, node, env) {
				const [_opcode, argA, argB] = node;
				return `{(${recurse(argA)}),(${recurse(argB)})}kh1`;
			},
		}),

		[TERMINALS.GT]  : new Binary(3, undefined, {
			
			help: [
				TERMINALS.GT,
				"{1} > {2}",
				wrap(
					"Returns 1 if {1} is greater than {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],

			fn: ((x, y) => x > y),
		}),

		[TERMINALS.LT]  : new Binary(3, undefined, {
			help: [
				TERMINALS.LT,
				"{1} < {2}",
				wrap(
					"Returns 1 if {1} is less than {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] of [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x < y),
		}),

		[TERMINALS.LE]  : new Binary(3, undefined, {
			help: [
				TERMINALS.LE,
				"{1} <= {2}",
				wrap(
					"Returns 1 if {1} is less than or equal to {2}",
					"and 0 otherwise; can only be used in the ",
					"condition of an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x <= y),
		}),

		[TERMINALS.GE]: new Binary(3, undefined,  {
			help: [
				TERMINALS.GE,
				"{1} >= {2}",
				wrap(
					"Returns 1 if {1} is greater than or equal to {2}",
					"and 0 otherwise; can only be used in the ",
					"condition of an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x >= y),
		}),

		[TERMINALS.EQ]  : new Binary(3, undefined,  {
			help: [
				TERMINALS.EQ,
				"{1} == {2}",
				wrap(
					"Returns 1 if {1} is equal to {2} and 0 otherwise",
					"; can only be used in the condition of an [if] ",
					"or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x == y),
		}),

		[TERMINALS.NE]  : new Binary(3, undefined,  {
			help: [
				TERMINALS.NE,
				"{1} <> {2}",
				wrap(
					"Returns 1 if {1} is not equal to {2} and 0 ",
					"otherwise; can only be used in the condition of ",
					"an [if] or [metaif] expression.",
				),
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x != y),
		}),

		[TERMINALS.ADD] : new Binary(2, 0,  {
			help: [
				TERMINALS.ADD,
				"{1} + {2}",
				"Return the sum of {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x + y),
		}),

		[TERMINALS.SUB] : new Binary(2, 0, {
			help: [
				TERMINALS.SUB,
				"{1} - {2}",
				"Return the difference between {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x - y),
		}),

		[TERMINALS.MUL] : new Binary(1, 1, {
			help: [
				TERMINALS.MUL,
				"{1} * {2}",
				"Return the product of {1} and {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x * y),
		}),

		[TERMINALS.DIV] : new Binary(1, 1, {
			help: [
				TERMINALS.DIV,
				"{1} / {2}",
				"Return the quotient of {1} divided by {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x / y),
		}),

		[TERMINALS.MOD] : new Binary(1, undefined, {
			help: [
				TERMINALS.MOD,
				"{1} % {2}",
				"Return the remainder of {1} divided by {2}",
				"any expression",
				"any expression",
			],
			fn: ((x, y) => x % y),
		}),

		[TERMINALS.DIE] : new Operator(0, {
			help: [
				TERMINALS.DIE,
				"{1} die {2}",
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
				"fill {1}({2})",
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
							`In expansion of template '${text}'; `
								+ error.message
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
							`In expansion of template '${text}'; `
								+ error.message
						);
					}
					throw error;
				}
			},
		}),

		[TERMINALS.TEMPLATE] : new Operator(0, {
			help: [
				TERMINALS.TEMPLATE,
				"template {1}({2}) {3} end",
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

	};

	namespace.OPERATORS[3] =  {

		"if": new Operator(4, {

			help: [
				TERMINALS.IF,
				"if {1} {2} {3} then {4} else {5}",
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
					cond = `{{[[${lhs}]],[[(${rhs})-1]]}<[[${rhs}]]}`;
					break;
				case ">=":
					body = `((${vthen})-(${velse})) + ${velse}`;
					cond = `{{[[${lhs}]],[[(${rhs})+1]]}>[[${rhs}]]}`;
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

		[TERMINALS.PROMPT]: new Operator(4, {

			help: [
				TERMINALS.PROMPT,
				"ask {1}, {2}, {3}; {4}",
				wrap(
					"Creates a prompt in the generated Roll20 macro ",
					"with {1} as a title. Only the [ask] {1} part is ",
					"mandatory, but multiple options can be supplied ",
					"by adding additional expressions separated by ",
					"the use of [,] characters, such as is the case ",
					"with {2}, {3}, and {4}. In the character ",
					"builder, this expression evaluates to either the ",
					"first option provided, the (max of) one option ",
					"preceded by a [;] (if there is one), or ",
					"0 if there are no options. An [ask] option's ",
					"expression cannot contain the following ",
					"expression types: [if], [more], [less], and ",
					"other [ask] expressions. However, [metaif] is ",
					"permitted. Options can be given titles using ",
					"[=] expressions, e.g. [Title = 1]."
				),
				"any identifier or [bracketed text]",
				"any expression (Title = {2} sets title)",
				"any expression (Title = {3} sets title)",
				"any expression (Title = {4} sets title)",
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

		/* I've finally introduced conditional compilation lol */

		[TERMINALS.METAIF] : new Operator(0, {

			help: [
				TERMINALS.METAIF,
				"metaif {1} then {2} else {3}",
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
					if (error instanceof Expression.CompilationError) {
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
					if (error instanceof Expression.CompilationError) {
						console.error(argX);
					}
					throw error;
				}
			},
		}),
	};

	return Object.freeze(namespace);
})(); 

function tokenize(source, strip=true) {
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

		if (!strip || !token[0].match(Tokens.REGEXP.BLANKSPACE)) {
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
	const tokens  = tokenize(process, false);
	const output  = [];

	for (let token of tokens) {

		const text = token[0];
	
		if (text.match(Tokens.REGEXP.BLANKSPACE)) {
			output.push(element("span", text));
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

class Parser {

	constructor(macros={}) {

		this._index   = 0;
		this._tokens  = null;
		this._length  = 0;
		this._depth   = 0;
		this._prompt  = false;
		this._macros  = macros;

		// this.symbols = symbols;
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

	parseSource(source) {
		const tokens = tokenize(source);
		return this.parseTokens(tokens);
	}

	parseTokens(tokens) {
		this._index   = 0;
		this._tokens  = tokens;
		this._length  = tokens.length;
		this._depth   = 0;

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
		out = this._parseAdditiveExpression();
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

		// return macro;

		const [_m, title, args] = macro;
		const name = title[1];

		if (!(name in this._macros)) {
			throw new CompilationError(
				`Macro '${name}' is not defined.`, this.position
			);
		}

		const defined  = this._macros[name];
		const instance = defined.instantiate(args);

		// return [Tokens.TERMINALS.MACRO, name, instance];
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
				`Expected token '${Tokens.TERMINALS.BEGIN}'`,
				this.position || -1
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
					`Expected identifier after '${Tokens.TERMINALS.OPTION}'`,
					this.position,
				);
			}
			this._toNext();
			first = false;	

			args.push(out);

			if (this.token != Tokens.TERMINALS.OPTION) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}'`,
				this.position || -1
			);
		}
		this._toNext();

		const body = this._parseExpression();

		if (body == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.STOP) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP}'`,
				this.position || -1
			);
		}
		this._toNext();

		const instance = new Template(args.map(node => node[1]), body);

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
		out = this._parseAdditiveExpression();
		return out;
	}

	_parseMacroExpression() {

		if (this.token != Tokens.TERMINALS.MACRO) {
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
				`Expected token '${Tokens.TERMINALS.BEGIN}'`,
				this.position || -1
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
					`'${Tokens.TERMINALS.OPTION}'`,
					this.position,
				);
			}
			first = false;		

			options.push(out);

			if (this.token != Tokens.TERMINALS.OPTION) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}'`,
				this.position || -1
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
				`Expected token '${Tokens.TERMINALS.BEGIN}'`,
				this.position || -1
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
					`'${Tokens.TERMINALS.OPTION}'`,
					this.position,
				);
			}
			first = false;		

			options.push(out[0] == "text" ? out : [Tokens.TERMINALS.META, out]);

			if (this.token != Tokens.TERMINALS.OPTION) {
				break;
			}
			this._toNext();
		}

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.END}'`,
				this.position || -1
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
				`Expected token '${Tokens.TERMINALS.ALIAS}'`,
				this.position || -1
			);
		}
		this._toNext();

		const expr = this._parseExpression();

		if (expr == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}`,
				this.position || -1
			);
		}

		if (this.token != Tokens.TERMINALS.PERIOD) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.PERIOD}'`,
				this.position || -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.LABEL, title, expr];
	}

	_parseMinMaxExpression() {
		// debugger;

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

		const lhs = this._parseExpression();

		if (lhs == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.ELSE) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.ELSE}'`,
				this.position || -1
			);
		}
		this._toNext();

		const rhs = this._parseExpression();

		if (rhs == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected expression after '${this.token}`,
				this.position || -1
			);
		}

		if (this.token != Tokens.TERMINALS.STOP) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.STOP}'`,
				this.position || -1
			);
		}
		this._toNext();

		return [comparison, lhs, rhs];
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
				`Expected token '${Tokens.TERMINALS.PERIOD}'`,
				this.position || -1
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
				`Expected token '${Tokens.TERMINALS.STOP}'`,
				this.position || -1
			);
		}
		this._toNext();

		return [Tokens.TERMINALS.PROMPT, title, defval, options];
	}

	_parseMetaIfExpression() {

		return this._parseGenericConditionalExpression(
			Tokens.TERMINALS.METAIF, Tokens.TERMINALS.METAIF
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
			Tokens.TERMINALS.IF, Tokens.TERMINALS.IF
		);
	}

	_parseGenericConditionalExpression(expected, parent) {

		if (this.token != expected) {
			return null;
		}
		this._toNext();

		const comparison = this._parseRelativeExpression();

		if (comparison == null) {
			this._toPrev();
			throw new CompilationError(
				`Expected relative expression after '${this.token}'`,
				this.position
			);
		}

		if (this.token != Tokens.TERMINALS.THEN) {
			throw new CompilationError(
				`Expected token '${Tokens.TERMINALS.THEN}'`,
				this.position || -1
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

			fBranch = this._parseExpression();

			if (fBranch == null) {
				this._toPrev();
				throw new CompilationError(
					`Expected expression after '${this.token}`,
					this.position || -1
				);
			}

			if (this.token != Tokens.TERMINALS.STOP) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.STOP}'`,
					this.position || -1
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
					this.position || -1
				);
			}

		} else {
			throw new CompilationError(
				wrap(
					`Expected token '${Tokens.TERMINALS.ELSE}' or `,
					`'${Tokens.TERMINALS.ELSEIF}'`,
				),
				this.position || -1
			);
		}
		
		return [parent, comparison, tBranch, fBranch];
	}

	_parseRelativeExpression() {

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

	static BinaryOperatorFactory(operators, operands) {
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

					/** TODO validate this behavior.
					 * I don't remember if this branch has a valid
					 * purpose or if it exists just to indicate failure.
					 * I suspect the later so I'm making it throw an
					 * exception whenever this branch is taken.
					 *
					 * Remove and restpre the return if you find out that
					 * it does something of use for some reason.
					 */

					this._toPrev();

					throw new CompilationError(
						`No right operand to infix operator ${op}`,
						this.position
					);

					// return rhs;
				}
			}

			return lhs;
		};
	}

	_parseMultiplicativeExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.MULTIPLICATIVE,
			"_parseNegationExpression",
		)
	);

	_parseAdditiveExpression = (
		Parser.BinaryOperatorFactory(
			Tokens.SET.ADDITIVE,
			"_parseMultiplicativeExpression",
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

		} else if (token == Tokens.TERMINALS.METAIF) {

			/* check whether this is a metaif expression */
			const save  = this._index;
			const out   = this._parseMetaIfExpression();
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

			/* check whether this is some other identifier */

			this._toNext();
			return ["$", token];

		} else if (token.match(Tokens.REGEXP.LITERAL)) {

			/* check whether this is a number literal */

			this._toNext();
			return ["#", Number(token)];

		} else {

			/* finally check whether this is a nested expression */

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

	instantiate(values) {

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

		function clone(map, node) {

			const list = [];

			/* substitute expression */
			if (node[0] == "$" && map.has(node[1])) {

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

			/* copy the ast node as is */
			for (let element of node) {
				if (element instanceof Array) {
					list.push(clone(map, element));
				} else {
					list.push(element);
				}
			}

			return list;
		}

		return clone(map, this.body);
	}

	static parse(source, macros={}) {
		const [_op, title, template] = parse(source, macros);
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
		this.uid       = uniqueID();
		this.macros    = macros || new Map();
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

		return value;
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
	}

	/**
	 * Compile to provided source string into an expressions that executes
	 * with the provided context. (Defaults to internal.)
	 * @param {string} source - source code the expression
	 * @param {object} context - a map-like object for variable values
	 * @returns {CompiledExpression} - an executable expression object
	 */
	compile(source, context=this.context, macros=this.macros) {
		return new CompiledExpression(source, context, macros);
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

	asIdentifier: function(string) {
		const rep = string.replace(/[^A-Za-z0-9_$|]/, char => "_");
		if (rep.length == 0) return rep;
		return rep[0].match(/[0-9|]/) ? "$" + rep : rep;
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
});

})();



const Polish = (function() {


const _GRAMMAR = (`
<expr>   ::= <list> | <nested>
<list>   ::= <quote> | <symbol> | <string> | <nested> | 
<nested> ::= "(" <list> ")"
<quote>  ::= "'(" <list> ")"
`);

class CompilationError extends Error {
	constructor(message, position) {
		super(message);
		this.position = position;
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

class Parser {

	constructor(symbols) {

		this._index   = 0;
		this._tokens  = null;
		this._length  = 0;
		this._depth   = 0;

		this.symbols = symbols;
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

	get token() {
		if (this._index < this._length) {
			return this._tokens[this._index][0];
		} else {
			return null;
		}
	}

	get position() {
		if (this._index < this._length) {
			return this._tokens[this._index]._index;
		} else {
			return null;
		}
	}

	parseSource(source) {
		const tokens = tokenize(source);
		return this.parseTokens(tokens);
	}

	parseTokens(tokens) {
		this._index   = 0;
		this._tokens  = tokens;
		this._length  = tokens.length;
		this._depth   = 0;

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

		return list || null;
	}

	_parseNested() {

		if (this.token != Tokens.TERMINALS.BEGIN) return null;
		this._toNext();

		this._sink();
		const inner = this._parseList();
		if (inner == null) return inner;
		this._swim();

		if (this.token != Tokens.TERMINALS.END) {
			throw new CompilationError(
				"unclosed nested expression", this.position
			);
		}
		this._toNext();

		return inner;
	}

	_parseSymbol() {

		if (!(this.token && this.token.match(Tokens.REGEXP.SYMBOL))) return null;
		const token = this.token;
		this._toNext();

		this.symbols.add(token);

		return token;
	}

	_parseString() {

		if (!(this.token && this.token.match(Tokens.REGEXP.STRING))) return null;
		const token = this.token.replaceAll("`", () => "");
		this._toNext();

		return token;
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
	constructor(source, context={}) {
		this.source  = source;
		this.context = context;
		this.symbols = new Set();
		this.ast     = parse(source, this.symbols);
	}

	search() {

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
					(typeof element == "string") 
						? element 
						: walk(element)
				);
			}

			return this.apply(context, args);
		};

		return walk(this.ast);
	}

	apply(context, node) {
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

/* create and return namespace */
return Object.freeze({

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
});


})();

/* exported Expression */
/* exported Polish */
