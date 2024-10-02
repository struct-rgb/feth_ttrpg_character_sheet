
/* global require */

/* global isObject */
/* global Polish   */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({isObject} = require("../common.js"));
	(Polish     = require("../lang/polish.js"));
	/* eslint-enable no-global-assign */
}

const Compatible = (function () {

const USE_WITH_ARTS = ["gambits", "items", "arts"];

const defineTypes = (definitions) => ({

	string: Polish.Type.STRING,

	skill: new Polish.Type("skill", (sym) => {

		if (!sym.value.match(/Axes|Swords|Lances|Bows|Brawl|Faith|Reason|Guile|Armor|Riding|Flying|Morph|Other/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as skill`,
				sym.index
			);
		}
	}),

	element: new Polish.Type("element", (sym) => {

		if (!sym.value.match(/fire|lightning|force|wind|ice|water|beast|metal/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as element`,
				sym.index
			);
		}
	}),

	select: new Polish.Type("select", (sym) => {
		throw new Polish.CompilationError(
			"cannot construct select from string",
			sym.index
		);
	}),

	boolean: Polish.Type.BOOLEAN,

	number: Polish.Type.NUMBER,

	any: Polish.Type.ANY,

	variadic: Polish.Type.VARIADIC,

	tag: Polish.Type.fromCategories({
		name        : "tag",
		categories  : USE_WITH_ARTS,
		definitions : definitions,
		mapping     : (
			feature => Array.isArray(feature.tags) ? feature.tags : []
		),
		flatten     : true,
	}),

	modifier: Polish.Type.fromCategories({
		name        : "modifier",
		categories  : USE_WITH_ARTS,
		definitions : definitions,
		mapping     : (
			feature => isObject(feature.modifiers)
				? Object.keys(feature.modifiers)
				: {}
		),
		flatten     : true,
	}),

	name: Polish.Type.fromCategories({
		name        : "name",
		categories  : USE_WITH_ARTS,
		definitions : definitions,
		mapping     : (feature => feature.name),
		extra       : ["Counter"],
	}),

});

function createContext(object, definitions) {

	const ctx   = {};
	const Types = defineTypes(definitions);

	const addx = (template) => {

		const func              = template.expr;
		const [name, args, out] = template.sign;
		ctx[name]               = func;

		if (args.at(-1) == Types.variadic) {
			func.variadic = true;
			args.pop();
		} else {
			func.variadic = false;
		}

		func.pred = name;
		func.args = args;
		func.out  = out;
	};

	const relative = (symbol, func) => {
		return (op, ...args) => {
			if (args.length < 2) throw Error(
				`Expected two or more arguments for '${symbol}' predicate.`
			);

			let x = Number(args.pop());
			
			while (args.length) {
				const y = Number(args.pop());
				if (!func(x, y)) return false;
				x = y;
			}
			return true;
		};
	};

	addx({
		sign: ["All", [Types.boolean, Types.boolean, Types.variadic], Types.boolean],
		expr: ((op, ...args) => args.reduce((x, y) => x && y)),
	});

	addx({
		sign: ["Any", [Types.boolean, Types.boolean, Types.variadic], Types.boolean],
		expr: ((op, ...args) => args.reduce((x, y) => x || y)),
	});

	addx({
		sign: ["Not", [Types.boolean], Types.boolean],
		expr: ((op, arg) => !arg),
	});

	addx({
		sign: ["Is", [Types.boolean], Types.boolean],
		expr: ((op, arg) => arg),
	});

	addx({
		sign: ["Skill", [Types.skill, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			for (let arg of args) {
				if (object.target.type == arg) return true;
			}
			return false;
		}),
	});

	addx({
		sign: ["Element", [Types.element, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			for (let arg of args) {
				if (object.target.description.includes(arg)) return true;
			}
			return false;
		}),
	});

	addx({
		sign: ["Name", [Types.name, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			for (let arg of args) {
				if (object.target.name == arg) return true;
			}
			return false;
		}),
	});

	addx({
		sign: ["Tag", [Types.tag, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			let has = true;
			for (let arg of args) {
				has = has && object.target.tagged(arg);
			}
			return has;
		}),
	});

	addx({
		sign: ["Text", [Types.string, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			for (let arg of args) {
				if (object.target.description.includes(arg)) return true;
			}
			return false;
		}),
	});

	addx({
		sign: ["Modifier", [Types.modifier], Types.number],
		expr: ((op, field) => {
			return object.target.modifier(field);
		}),
	});

	addx({
		sign: [">", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative(">", (x, y) => x > y),
	});

	addx({
		sign: ["<", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative("<", (x, y) => x < y),
	});

	addx({
		sign: ["==", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative("==", (x, y) => x == y),
	});

	addx({
		sign: ["<>", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative("<>", (x, y) => x != y),
	});

	addx({
		sign: [">=", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative(">=", (x, y) => x >= y),
	});

	addx({
		sign: ["<=", [Types.number, Types.number, Types.variadic], Types.boolean],
		expr: relative("<=", (x, y) => x <= y),
	});

	addx({
		sign: ["AoE", [Types.string, Types.variadic], Types.boolean],
		expr: ((op, ...args) => {
			for (let arg of args) {
				if (object.target.aoe == arg) return true;
			}
			return false;
		}),
	});

	addx({
		sign: ["Host", [Types.boolean, Types.select, Types.variadic], Types.boolean],
		expr: ((op, def, ...args) => {
			for (let arg of args) {
				if (arg.selected) return arg.value;
			}
			return (def === "true");
		}),
	});

	addx({
		sign: ["Gambit", [Types.boolean], Types.select],
		expr: ((op, arg) => ({
			selected : object.target.constructor.name == "Gambit",
			value    : arg,
		})),
	});

	addx({
		sign: ["Item", [Types.boolean], Types.select],
		expr: ((op, arg) => ({
			selected : object.target.constructor.name == "Item",
			value    : arg,
		})),
	});

	addx({
		sign: ["Art", [Types.boolean], Types.select],
		expr: ((op, arg) => ({
			selected : (
				object.target.constructor.name == "Art"
					&& !object.target.isTactical()
			),
			value    : arg,
		})),
	});

	addx({
		sign: ["Tactic", [Types.boolean], Types.select],
		expr: ((op, arg) => ({
			selected : (
				object.target.constructor.name == "Art"
					&& object.target.isTactical()
			),
			value    : arg,
		})),
	});

	addx({
		sign: ["True", [], Types.boolean],
		expr: ((op, arg) => true),
	});

	addx({
		sign: ["False", [], Types.boolean],
		expr: ((op, arg) => false),
	});

	addx({
		sign: ["Rework", [], Types.boolean],
		expr: ((op, arg) => false),
	});

	addx({
		sign: ["None", [], Types.boolean],
		expr: ((op, arg) => false),
	});

	return ctx;
}

return {
	createContext : createContext,
};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Compatible;

}

/* exported Compatible */
