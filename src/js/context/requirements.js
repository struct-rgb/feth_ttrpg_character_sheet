
/* global require */

/* global Polish */

/* global
	Grade,
	element, delimit, tag, wrap
*/

/* global Iter */

/* global ReqWidget */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({
		Grade,
		element, delimit, tag, wrap,
	}              = require("../common.js"));
	(  Polish      = require("../lang/polish.js"));
	({ ReqWidget } = require("../widget/dynamic.js"));
	/* eslint-enable no-global-assign */
}

const Requirements = (function () {

const defineTypes = (definitions) => ({

	string: Polish.Type.STRING,

	tribool: new Polish.Type("tribool", (sym) => {
		throw new Polish.CompilationError(
			"cannot construct tribool from string",
			sym.index
		);
	}),

	rank: new Polish.Type("rank", (sym) => {

		if (!sym.value.match(/[A-ES]\+?/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as rank`,
				sym.index
			);
		}
	}),

	classtype: new Polish.Type("classtype", (sym) => {

		if (!sym.value.match(/Armor|Cavalry|Flying|Infantry|Morph/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as class type`,
				sym.index
			);
		}
	}),

	outfitting: new Polish.Type("outfitting", (sym) => {

		if (!sym.value.match(/Armor|Cavalry|Flying|Infantry|Monstrous/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as outfitting`,
				sym.index
			);
		}
	}),

	training: new Polish.Type("training", (sym) => {

		if (!sym.value.match(/Axes|Bows|Faith|Guile|Lances|Mighty Fist|Mystic Fist|Reason|Swords/)) {
			throw new Polish.CompilationError(
				`cannot parse ${JSON.stringify(sym.value)} as training`,
				sym.index
			);
		}
	}),

	number: Polish.Type.NUMBER,

	any: Polish.Type.ANY,
	
	variadic: Polish.Type.VARIADIC,

	class: Polish.Type.fromCategories({
		name        : "name",
		categories  : ["classes"],
		definitions : definitions,
		mapping     : (feature => feature.name),
	}),

	gambit: Polish.Type.fromCategories({
		name        : "name",
		categories  : ["gambits"],
		definitions : definitions,
		mapping     : (feature => feature.name),
		extra       : ["Counter"],
	}),

	item: Polish.Type.fromCategories({
		name        : "name",
		categories  : ["items"],
		definitions : definitions,
		mapping     : (feature => feature.name),
	}),

});

function createContext(base, host, definitions) {

	const ctx   = base || {};
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

	function autopass() {
		return (op) => ({
			require: false,
			succeed: false,
			boolean: true
		});
	}

	function autofail() {
		return (op) => ({
			require: false,
			succeed: false,
			boolean: false
		});
	}

	addx({
		sign: ["All", [Types.tribool, Types.tribool, Types.variadic], Types.tribool],
		expr: ((op, ...args) => args.reduce((x, y) => ({
			require: x.require || y.require,
			succeed: false,
			boolean: (
				(x.boolean || (y.succeed && !x.require))
					&&
				(y.boolean || (x.succeed && !y.require))
			),
		}))),
	});

	addx({
		sign: ["Any", [Types.tribool, Types.tribool, Types.variadic], Types.tribool],
		expr: ((op, ...args) => args.reduce((x, y) => ({
			require: x.require || y.require,
			succeed: x.succeed || y.succeed,
			boolean: x.boolean || y.boolean,
		}))),
	});

	addx({
		sign: ["Required", [Types.tribool], Types.tribool],
		expr: ((op, x) => {
			x.require = true;
			return x;
		}),
	});

	addx({sign: ["Permission", [Types.string], Types.tribool], expr: autopass()});
	// addx({sign: ["Morph", [Types.rank], Types.tribool], expr: autopass()});
	addx({sign: ["Unknown", [], Types.tribool], expr: autofail()});
	addx({sign: ["None", [], Types.tribool], expr: autopass()});
	addx({sign: ["Barrier", [], Types.tribool], expr: autopass()});
	addx({sign: ["Innate", [], Types.tribool], expr: autopass()});
	addx({sign: ["Unfinished", [], Types.tribool], expr: autofail()});

	addx({
		sign: ["Level", [Types.number], Types.tribool],
		expr: (op, level) => ({
			require: true,
			succeed: false,
			boolean: host.stats.level >= level
		}),
	});

	for (let each of definitions.skills) {
		const skill = each;

		addx({
			sign: [skill, [Types.rank], Types.tribool],
			expr: ((name, grade) => {
				const diff = (
					Grade.toNumber(host.skills[skill].grade)
						-
					Grade.toNumber(grade)
				);

				return {
					require: false,
					succeed: diff >= 1,
					boolean: diff >= 0,
				};
			}),
		});
	}

	addx({
		sign: ["Other", [Types.rank], Types.tribool],
		expr: ((name, grade) => {
			let diff = 0;
			for (let each of definitions.skills) {
				diff = (
					Grade.toNumber(grade)
						-
					Grade.toNumber(host.skills[each].grade)
				);

				if (diff <= 0) break;
			}

			return {
				require: false,
				succeed: false,
				boolean: diff <= 0,
			};
		}),
	});

	addx({
		sign: ["Generic", [Types.rank], Types.tribool],
		expr: ctx["Other"].bind({}),
	});

	addx({
		sign: ["ClassType", [Types.classtype], Types.tribool],
		expr: ((name, type) => {
			return {
				require: true,
				succeed: false,
				boolean: host.character.class.type.includes(type),
			};
		}),
	});

	addx({
		sign: ["Class", [Types.class], Types.tribool],
		expr: ((op, name) => {
			return {
				require: true,
				succeed: false,
				boolean: !name || host.character.class.name == name,
			};
		}),
	});

	addx({
		sign: ["Equipment", [Types.equipment], Types.tribool],
		expr: ((op, name) => {
			const active = host.equipment.active;

			return {
				require: true,
				succeed: false,
				boolean: active ? active == name : false,
			};
		}),
	});

	addx({
		sign: ["Item", [Types.item], Types.tribool],
		expr: ((op, name) => {
			return {
				require: true,
				succeed: false,
				boolean: Iter.any(host.inv, (item) => item.template.name == name)
			};
		}),
	});

	addx({
		sign: ["Gambit", [Types.gambit], Types.tribool],
		expr: ((op, name) => {
			let found = false;
			for (let each of host.battalion.gambits.active) {
				if (each.includes(name)) found = true;
			}

			return {
				require: true,
				succeed: false,
				boolean: found,
			};
		}),
	});

	addx({
		sign: ["Training", [Types.training], Types.tribool],
		expr: ((op, name) => {
			let found = false;
			for (let each of host.battalion.gambits.active) {
				if (each.includes(`${name} Training`)) found = true;
			}

			return {
				require: true,
				succeed: false,
				boolean: found,
			};
		}),
	});

	addx({
		sign: ["Outfitting", [Types.outfitting], Types.tribool],
		expr: ((op, name) => {
			let found = false;
			for (let each of host.battalion.gambits.active) {
				if (each.includes(`${name} Outfitting`)) found = true;
			}

			return {
				require: true,
				succeed: false,
				boolean: found,
			};
		}),
	});

	addx({
		sign: ["Crest", [Types.any], Types.tribool],
		expr: ((op, name) => {
			let found = false;
			for (let each of host.abilities.getActiveKeys()) {
				if (each.includes(name)) found = true;
			}

			return {
				require: true,
				succeed: false,
				boolean: found,
			};
		}),
	});

	addx({
		sign: ["Adjutant", [Types.any], Types.tribool],
		expr: ((op, name) => {
			return {
				require: true,
				succeed: false,
				boolean: host.battalion.adjutant.name == name,
			};
		}),
	});

	host._predicates = ctx;
	return ctx;
}

function andblurb(marker) {
	return marker.toLinks(marker.context.get("const").get("all").text, true);
}

function toHTML(node, top=true) {

	if (Polish.is(node)) node = node.ast;

	const fn   = node[0].value;
	const args = node.slice(1);

	if (top) {
		return wrap(
			`<stong>Requires ${fn}</b><ul>`,
			fn == "All" || fn == "Any"
				? args.map(e => tag("li", toHTML(e, false))).join("")
				: tag("li", toHTML(node, false)),
			"</ul>"
		);
	}

	switch (fn) {

	case "All":
		return args.map(e => toHTML(e, false)).join(" and ");

	case "Any":
		return args.map(e => toHTML(e, false)).join(" or ");

	case "Required":
		return `${toHTML(args[0].value, false)} (required)`;

	case "Permission":
		return fn;

	case "Crest":
		return `Crest of ${args[0].value}`;

	case "ClassType":
		return `${args[0].value} Class`;

	case "Class":
		return `Class is ${args[0].value}`;

	case "Item":
	case "Equipment":
		return `${args[0].value} equipped`;

	default:
		return node.map(e => e.value).join(" ");
	}
}

function toText(node, top=true) {

	if (Polish.is(node)) node = node.ast;

	const fn   = node[0].value;
	const args = node.slice(1);

	if (top) {
		return wrap(
			`Requires ${fn}\n`,
			fn == "All" || fn == "Any"
				? args.map(e => `  * ${toText(e, false)}`).join("\n")
				: `  * ${toText(node, false)}`
		);
	}

	switch (fn) {

	case "All":
		return args.map(e => toText(e, false)).join(" and ");

	case "Any":
		return args.map(e => toText(e, false)).join(" or ");

	case "Required":
		// this expects its argument to be a whole expression so no .value
		return `${toText(args[0], false)} (required)`;

	case "Permission":
		return fn;

	case "Crest":
		return `Crest of ${args[0].value}`;

	case "ClassType":
		return `${args[0].value} Class`;

	case "Class":
		return `Class is ${args[0].value}`;

	case "Item":
	case "Equipment":
		return `${args[0].value} equipped`;

	default:
		return node.map(e => e.value).join(" ");
	}
}

/**
 * Creates a tree of HTMLElements that represent a requirements expression;
 * intended to be used to display those requirements to user in a human readable
 * format. I feel like this fits better in this module, but doing that has the
 * unpleasant side effect of either exposing some Markup functions that could
 * otherwise be private to that module or forcing us to inefficiently generate
 * markup which is then parsed (not ideal because it's error prone).
 * @param  {CompiledExpression} node     Polish CompiledExpression representing
 * a requirements expression when called externally. Internally, the ast of the
 * CompiledExpression is passed in this parameter for internal use.
 * @param  {Boolean}            dead     Whether tooltip links should be
 * expanded or simply left highlighted. This is necessary in order to prevent
 * double tooltips or infinite recursion in certain callers.
 * @param  {Refresher}          dynamics A Refreshed object, because expanded
 * links may contain content that needs to be updated dynamically.
 * @param  {Boolean}            top      Whether this function is being called
 * by an extrenal function or if this is the recursive case.
 * @return {HTMLElement}                 tree of HTMLElements representing the
 * requirements expression
 */

function toDOM(marker, node, dead=false, top=true) {

	if (top) {

		const ast  = node.ast;

		const reqs = new ReqWidget(node, "", andblurb(marker), dead);
		marker.refresher.register(reqs, Array.from(node.depends));

		const title = element("span", [
			element("strong", `Requires ${ast[0].value} `),
			element("span", [
				element("strong", "("),
				reqs.root,
				element("strong", ")"),
			])
		]);

		const body  = element("ul", {
			class   : ["compact-list"],
			content : ast[0].value == "All" || ast[0].value == "Any"
				? ast.slice(1).map(e => element("li", toDOM(marker, e, dead, false)))
				: element("li", toDOM(marker, ast, dead, false)),
		});

		return element("div", [title, body]);
	}

	const fn   = node[0];
	const args = node.slice(1);

	switch (fn.value) {

	case "All":
		return delimit(" and ",
			args.map(e => toDOM(marker, e, dead, false))
		);

	case "Any":
		return delimit(" or ",
			args.map(e => toDOM(marker, e, dead, false))
		);

	case "Required":
		return element("span",
			[toDOM(marker, args[0], dead, false), " (required)"]
		);

	case "Permission":
		return element("strong", fn);

	case "Gambit": {
		return element("span", [
			marker.link("gambit", [args[0].value], {dead}),
			element("strong", " equipped")
		]);
	}

	case "Training": {
		return element("span",
			marker.link("gambit", [`${args[0].value} Training`], {
				display: args[0].value, dead
			})
		);
	}

	case "Outfitting": {
		return element("span",
			marker.link("gambit", [`${args[0].value} Outfitting`], {
				display: args[0].value, dead
			})
		);
	}
	
	case "Crest": {
		const name  = `Crest of ${args[0].value}`;
		return element("span", element("strong",
			marker.link("ability", [`Major ${name}`, `Minor ${name}`], {
				display: name, dead
			})
		));
	}

	case "ClassType":
		return element("strong", [args[0].value, " Class"]);

	case "Class":
		return args.length >= 1
			? element("strong", ["Class is ", args[0].value])
			: element("strong", "Class");

	case "Item":
		return element("span", [
			marker.link("item", [args[0].value], {dead}),
			element("strong", " equipped")
		]);

	case "Equipment":
		return element("span", [
			marker.link("equipment", [args[0].value], {dead}),
			element("strong", " equipped")
		]);

	default:
		return element("strong", delimit(" ", node));
	}
}


return {
	createContext : createContext,
	toDOM         : toDOM,
	toText        : toText,
	toHTML        : toHTML,
};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Requirements;

}

/* exported Requirements */
