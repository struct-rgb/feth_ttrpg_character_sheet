
/**
 * A module implementing facilities for compiling, transforming, and executing
 * simple mathematical expressions written in infix notation
 * @module postfix
 */

/* we're going to go for a different pattern with this one */
const Expression = (function() {

	const GRAMMAR = (`
	<expr>      ::= <cond> | <add-expr>
	<cond>      ::= "if" <rel-expr> "then" <add-expr> "else" <add-expr>

	<rel-expr>  ::= <add-expr> <rel-op> <add-expr>
	<rel-op>    ::= ">" | "<" | "<=" | ">=" | "==" | "<>"

	<add-expr>  ::= <add-expr> <add-op> <mul-expr> | <mul-expr>
	<add-op>    ::= "+" | "-"

	<mul-expr>  ::= <mul-expr> * <mul-expr> | <neg-expr>
	<mul-op>    ::= "*" | "/"

	<neg-expr>  ::= <value> | <unary-op> <value>
	<unary-op>  ::= "+" | "-"

	<value>     ::= <nested> | <literal> | <call> | <identifier>
	<nested>    ::= "(" <expr> ")"

	<call>      ::= <func-name> "(" <expr> ")"
	<func-name> ::= "abs" | "ceil" | "floor" | "round"
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
			LITERAL    : new RegExp("[0-9]+(\\.[0-9]+(e[+-]*[0-9]+)*)*"),
			IDENTIFIER : new RegExp("[A-Za-z_$][0-9A-Za-z_$]*"),
			OPERATOR   : new RegExp("==|<>|>=|<=|>|<|\\+|-|\\*|/|\\(|\\)"),
			WHITESPACE : new RegExp("[ \t\n\r]+"),
		};

		/* the order of these subexpressions is important */

		namespace.REGEXP.TOKENS = new RegExp([
			namespace.REGEXP.LITERAL.source,
			namespace.REGEXP.OPERATOR.source,
			namespace.REGEXP.WHITESPACE.source,
			namespace.REGEXP.IDENTIFIER.source,
		].join("|"), "g");

		/* a simplified acessor functions for terminals */

		namespace.get = function(token, arity) {
			return this.OPERATORS[arity][token];
		}

		const TERMINALS = {
			IF     : "if",
			THEN   : "then",
			ELSE   : "else",
			GT     : ">",
			LT     : "<",
			GE     : ">=",
			LE     : "<=",
			EQ     : "==",
			NE     : "<>",
			ADD    : "+",
			SUB    : "-",
			MUL    : "*",
			DIV    : "/",
			BEGIN  : "(",
			END    : ")",
			ABS    : "abs",
			CEIL   : "ceil",
			FLOOR  : "floor",
			ROUND  : "round",
			UMINUS : "-",
			UPLUS  : "+",
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
			]),

			CALL: new Set([
				TERMINALS.ABS,
				TERMINALS.CEIL,
				TERMINALS.FLOOR,
				TERMINALS.ROUND,
			]),

			UNARY: new Set([
				TERMINALS.UPLUS,
				TERMINALS.UMINUS,
			]),
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
				template        = template || Operator.EMPTY;
				this.precedence = precedence;
				this.opcode     = template.opcode   || null;

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
			constructor(precedence, fn) {
				super(precedence);

				/* this is data, not a method */
				this.opcode = function() {
					this.stack.push(fn(this.stack.pop()));
					return 1;
				};

				if (new.target === Unary) {
					Object.freeze(this);
				}
			}

			codegen(recurse, code, node) {
				const [opcode, argument] = node;
				recurse(argument);
				code.instructions.push(this.opcode);
			}

			macrogen(recurse, node) {
				const [opcode, argument] = node;

				/* this assumes a call like operator I guess */
				return `${opcode}(${recurse(argument)})`;
			}
		}

		class Binary extends Operator {
			constructor(precedence, fn) {
				super(precedence);

				/* this is data, not a method */
				this.opcode = function() {
					const x = this.stack.pop();
					const y = this.stack.pop();
					this.stack.push(fn(y, x));
					return 1;
				};

				if (new.target === Binary) {
					Object.freeze(this);
				}
			}

			codegen(recurse, code, node) {
				const [opcode, argA, argB] = node;
				recurse(argA);
				recurse(argB);
				code.instructions.push(this.opcode);
			}

			macrogen(recurse, node) {
				const [opcode, argA, argB] = node;

				const quoteA = quote(recurse, node, argA);
				const quoteB = quote(recurse, node, argB);

				return `${quoteA} ${opcode} ${quoteB}`;
			}
		}

		const FREG = new RegExp("^\\w");

		namespace.OPERATORS = {

			/* arranged by arity */

			/* 
			 * lower precedence means it's higher priority
			 * UNARY => 0
			 * CALL  => 0
			 * MULT  => 1
			 * ADDI  => 2
			 * REL   => 3
			 * COND  => 4
			 */

			1 : {
				/* these two do no have assiciated terminals */

				"$" : new Operator(0, {

					codegen: function(recurse, code, node) {
						const [opcode, argument] = node;
						code.instructions.push(function() {
							this.stack.push(this.context[argument]);
							return 1;
						});
						code.symbols.add(argument);
					},

					/** @todo see if character name needs added */
					macrogen: function(recurse, node) {
						const [opcode, argument] = node;
						const capital = argument.replace(FREG, (c) => {
							return c.toUpperCase();
						});
						return `@{${capital}}`;
					},
				}),

				"#" : new Operator(0, {

					codegen: function(recurse, code, node) {
						const [opcode, argument] = node;
						code.instructions.push(function() {
							this.stack.push(argument);
							return 1;
						});
					},

					macrogen: function(recurse, node) {
						const [opcode, argument] = node;
						return `${argument}`;
					},
				}),

				/* from here on, these to have associate terminals */

				[TERMINALS.FLOOR]  : new Unary(0, x => Math.floor(x)),
				[TERMINALS.ABS]    : new Unary(0, x => Math.abs(x)),
				[TERMINALS.CEIL]   : new Unary(0, x => Math.ceil(x)),
				[TERMINALS.ROUND]  : new Unary(0, x => Math.round(x)),

				[TERMINALS.UMINUS] : new Operator(0, {

					opcode: function() {
						this.stack.push(-this.stack.pop());
						return 1;
					},

					codegen: function(recurse, code, node) {
						const [opcode, argument] = node;
						recurse(argument);
						code.instructions.push(this.opcode);
					},

					macrogen: function(recurse, node) {
						const [opcode, argument] = node;

						/* this is a negated expression */
						if (argument[0] != "#") {
							return `(-1 * (${recurse(argument)}))`;
						}

						/* this is a negative literal */
						return `(-${argument[1]})`;
					},
				}),

				[TERMINALS.UPLUS]  : new Operator(0, {

					opcode: function() {
						this.stack.push(+this.stack.pop());
						return 1;
					},

					codegen: function(recurse, code, node) {
						const [opcode, argument] = node;
						recurse(argument);
						code.instructions.push(this.opcode);
					},

					macrogen: function(recurse, node) {
						const [opcode, argument] = node;
						/* this operator doesn't really *do* anything */
						return recurse(argument);
					},
				}),
			},

			2 : {

				[TERMINALS.GT]  : new Binary(3, (x, y) => x > y),
				[TERMINALS.LT]  : new Binary(3, (x, y) => x < y),
				[TERMINALS.LE]  : new Binary(3, (x, y) => x <= y),
				[TERMINALS.GE]  : new Binary(3, (x, y) => x >= y),
				[TERMINALS.EQ]  : new Binary(3, (x, y) => x == y),
				[TERMINALS.NE]  : new Binary(3, (x, y) => x != y),
				[TERMINALS.ADD] : new Binary(2, (x, y) => x + y),
				[TERMINALS.SUB] : new Binary(2, (x, y) => x - y),
				[TERMINALS.MUL] : new Binary(1, (x, y) => x * y),
				[TERMINALS.DIV] : new Binary(1, (x, y) => x / y),

			},

			3 : {
				"if": new Operator(4, {

					/*
					 * branch if true to true_branch
					 * // false branch
					 * true_branch:
					 * // true branch
					 */
					codegen: function(recurse, code, node) {
						const [opcode, argX, argY, argZ] = node;
						
						recurse(argX); // compute condition
						
						// mark location and allocate space for a conditional
						// branch to the true case later on
						const branch = code.instructions.length;
						code.instructions.push(null); 

						recurse(argZ) // compute false case

						// mark location and allocate space for an unconditional
						// branch to the end of the expression later on
						code.instructions.push(null);
						const label  = code.instructions.length;

						recurse(argY); // compute true case

						// add back in the conditional branch
						const offsetT = label - branch;
						code.instructions[branch] = function () {
							return this.stack.pop() ? offsetT : 1;
						};

						// add back in the unconditional branch
						const jump    = label - 1;
						const offsetF = code.instructions.length - jump;
						code.instructions[jump] = function () {
							return offsetF;
						};
					},

					macrogen: function(recurse, node) {
						const [opcode, condNode, tNode, fNode] = node;

						const vthen = recurse(tNode);
						const velse = recurse(fNode);

						const [relop, lNode, rNode] = condNode;

						const lhs = recurse(lNode);
						const rhs = recurse(rNode);

						let cond;
						let body;
						switch (relop) {
						case "==":
							body = `((${vthen})-(${velse})) + ${velse})`;
							cond = `({0,[[floor(1-abs((${rhs})-(${lhs})))]]}dl1)`;
							break;
						case "<>":
							body = `((${velse})-(${vthen})) + ${vthen})`;
							cond = `({0,[[floor(1-abs((${rhs})-(${lhs})))]]}dl1)`;
							break;
						case "<=":
							body = `((${vthen})-(${velse})) + ${velse})`;
							cond = `{{[[${lhs}]],[[(${rhs})-1]]}<[[${rhs}]]}`;
							break;
						case ">=":
							body = `((${vthen})-(${velse})) + ${velse})`;
							cond = `{{[[${lhs}]],[[(${rhs})+1]]}>[[${rhs}]]}`;
							break;
						case "<":
							body = `((${velse})-(${vthen})) + ${vthen})`;
							cond = `{{[[${lhs}]],[[(${rhs})-1]]}>[[${rhs}]]}`;
							break;
						case ">":
							body = `((${velse})-(${vthen})) + ${vthen})`;
							cond = `{{[[${lhs}]],[[(${rhs})+1]]}<[[${rhs}]]}`;
							break;
						default:
							throw new Error(
								`${relop} is not a relative operator`
							);
							break;
						}

						return `(${cond} * ${body})`;
					}
				})
			}
		}

		return Object.freeze(namespace);
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

			if (!token[0].match(Tokens.REGEXP.WHITESPACE)) {
				output.push(token);
			}

			index += token[0].length;
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
			const i = this._index + 1
			if (i < this._length) {
				return this._tokens[i][0]
			} else {
				return null;
			}
		}

		_prevToken() {
			const i = this._index - 1
			if (i > 0) {
				return this._tokens[i][0]
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

			return this._parseExpression();
		}

		_parseExpression() {
			let out  = null;
			let save = this._index;

			this._index = save;
			out = this._parseConditionalExpression();
			if (out != null) return out;

			this._index = save;
			out = this._parseAdditiveExpression();
			return out;
		}

		_parseConditionalExpression() {

			// debugger;

			if (this.token != Tokens.TERMINALS.IF) {
				return null;
			}
			this._toNext();

			const comparison = this._parseRelativeExpression();
			if (comparison == null) return comparison;

			if (this.token != Tokens.TERMINALS.THEN) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.THEN}'`, this.position
				);
			}
			this._toNext();

			const tBranch = this._parseAdditiveExpression();
			if (tBranch == null) return tBranch;

			if (this.token != Tokens.TERMINALS.ELSE) {
				throw new CompilationError(
					`Expected token '${Tokens.TERMINALS.ELSE}'`, this.position
				);
			}
			this._toNext();

			const fBranch = this._parseAdditiveExpression();
			if (fBranch == null) return fBranch;

			return [Tokens.TERMINALS.IF, comparison, tBranch, fBranch]
		}

		_parseRelativeExpression() {
			// debugger;
			const lhs = this._parseAdditiveExpression();
			if (lhs == null) return lhs;

			const operator = this.token;
			if (!Tokens.SET.RELATIVE.has(operator)) {
				throw new CompilationError(
					`Not a relative operator: '${operator}'`, this.position
				);
			}
			this._toNext();

			const rhs = this._parseAdditiveExpression();
			if (rhs == null) return rhs;

			return [operator, lhs, rhs];
		}

		static BinaryOperatorFactory(operators, operands) {
			return function() {
				let lhs = null, rhs = null, op = "";

				if ((lhs = this[operands]()) == null) return lhs;

				while (this.token != null) {

					if (operators.has(op = this.token)) {
						this._toNext()
					} else {
						if (this._isTopLevel() && this.token == Tokens.TERMINALS.END) {
							throw new CompilationError(
								"encountered end of nested expression at top level",
								this.position
							)
						} else {
							return lhs;
						}
					}

					if ((rhs = this[operands]()) != null) {
						lhs = [op, lhs, rhs];
					} else {
						return rhs;
					}
				}

				return lhs;
			}
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
			this._toNext()

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

			/* check to see if the value is an identifier */
			if (token.match(Tokens.REGEXP.IDENTIFIER)) {
				this._toNext();
				/* If so, check if it one of the function operators.
				 * I could make a function for this, but when they only
				 * take a single argument there's no need right now.
				 */
				if (Tokens.SET.CALL.has(token)) {
					const save = this._index;
					const out  = this._parseNestedExpression()
					if (out != null) return [token, out];
					this._index = save;
				}
				return ["$", token];
			} else if (token.match(Tokens.REGEXP.LITERAL)) {
				this._toNext()
				return ["#", Number(token)];
			} else {
				const save = this._index;
				const out  = this._parseNestedExpression()
				if (out != null) return out;
				this._index = save;
			}

			return null;
		}

		_parseNestedExpression() {

			if (this.token != Tokens.TERMINALS.BEGIN) return null;
			this._toNext();

			this._sink();
			const inner = this._parseExpression()
			if (inner == null) return inner;
			this._swim();

			if (this.token != Tokens.TERMINALS.END) {
				throw new CompilationError(
					"unclosed nested expression", this.state.position
				)
			}
			this._toNext();

			return inner;
		}
	}

	function parse(source, context={}, symbols=null) {
		const parser = new Parser(context);
		return parser.parseSource(source);
	}

	function codegen(ast) {
		const code = {instructions: [], symbols: new Set()};

		function walk(node) {
			const operator = Tokens.OPERATORS[node.length - 1][node[0]];
			operator.codegen(walk, code, node);
		}

		walk(ast);

		return code;
	}

	function macrogen(ast) {
		function walk(node) {
			const operator = Tokens.OPERATORS[node.length - 1][node[0]];
			return operator.macrogen(walk, node);
		}

		return walk(ast);
	}

	/**
	 * A class representing an executable expression
	 */
	class Expression {
		
		/**
		 * Create an instance. Should not be called directly, instead create a
		 * {@link PostfixCompiler} instance and invoke its
		 * [compile]{@link PostfixCompiler#compile} method.
		 */
		constructor(source, context={}, symbols=null) {
			this.stack   = [];
			this.source  = source;
			this.context = context;

			const ast    = parse(source, context);
			const cdg    = codegen(ast);

			// this.ast     = ast;
			this.code    = cdg.instructions;
			this.symbols = cdg.symbols;
			this.macro   = macrogen(ast);
		}

		/**
		 * Execute this expression in the given context. If no context is given
		 * it will draw variable values from the context it was compiled with.
		 * @param {Object} context - provide an alternate context to execute in
		 */
		exec(context) {

			let instruction = 0;
			this.stack.length = 0;

			while (instruction < this.code.length) {
				instruction += this.code[instruction].call(this);
			}

			return this.stack.pop();
		}
	}

	class Compiler {
		
		constructor(context, symbols) {
			this.context = context;
			this.symbols = symbols;
		}

		compile(source, context=this.context) {
			return new Expression(source, context);
		}
	
	}

	/* create and return namespace */
	return Object.freeze({
		
		/* this has to be exposed to be catchable */
		CompilationError: CompilationError,

		/* this is the main class for the module*/
		Compiler: Compiler,

		// tokenize: tokenize,

		/* convenience function to compile easily */
		compile: function(source, context={}) {
			return new Expression(source, context);
		},

		/* convenience function to execute easily */
		execute: function(expression) {
			if (expression instanceof Expression) {
				return expression.exec();
			}
			if (typeof expression === "number") {
				return expression
			}
			throw new TypeError(
				"Argument must be Expression or number"
			);
		},

		/* convenience function to produce a macro */
		macro: function(expression) {
			if (expression instanceof Expression) {
				return expression.macro;
			}
			if (typeof expression === "number") {
				return String(expression)
			}
			throw TypeError(
				"Argument must be Expression or number"
			);
		},

		/* convenience function to produce source */
		source: function(expression) {
			if (expression instanceof Expression) {
				return expression.source;
			}
			if (typeof expression === "number") {
				return String(expression)
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
