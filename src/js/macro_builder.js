
/* global chain */
/* global wrap */
/* global tooltip */
/* global element */
/* global Toggle */

/* global Expression */

/* global Art */
/* global hitip */

/* global Polish */

/**
 * A module that implements a builder for Roll20 Macros
 * @module Macros
 */
const Macros = (function() {

/**
 * Line
 */
class CustomRow {

	constructor(name, when, expr, roll=false) {
		this.name = name;
		this.when = when;
		this.expr = expr;
		this.roll = roll;
	}

	check(env) {
		return Expression.execute(this.when);
	}

	macro(env) {
		return (
			Expression.is(this.expr)
				? this.expr.macrogen(env)
				: this.expr
		);
	}

	create(builder, env, roll=false) {
		const expr = builder.sum(this.macro(env));
		const dice = builder.sum("1d100");
		const body = this.roll ? builder.merge(dice, "≤", expr) : expr;
		return builder.row(this.name, body);
	}

}

/**
 * Builder
 */
class Builder {

	constructor() {
		this.base = [];
	}

	me(action) {
		this.base.push("/em ", action, "\n");
		return this;
	}

	line(text) {
		this.base.push(text, "\n");
		return this;
	}

	italic(text) {
		return "*" + text + "*";
	}

	bold(text) {
		return "**" + text + "**";
	}

	table() {
		this.base.push("&{template:default}");
		return this;
	}

	row(head, body) {
		this.base.push("{{", head, "=", body, "}}");
		return this;
	}

	sum(...args) {
		const level = [];
		level.push("[[");

		let first = true;
		for (let arg of args) {
			if (arg == null) continue;
			if (!first) level.push("+");
			level.push(arg);
			first = false;
		}

		level.push("]]");
		return level;
	}

	merge(...args) {
		const flat = [];
		for (let arg of args) {
			if (arg == null) continue;
			if (arg instanceof Array) {
				for (let element of arg) {
					flat.push(element);
				}
			} else {
				flat.push(arg);
			}
		}
		return flat;
	}

	attribute(attribute) {
		return "@{" + attribute + "}";
	}

	selected(attribute) {
		return this.attribute("selected", attribute);
	}

	target(attribute) {
		return this.attribute("target|Other", attribute);
	}

	call(name, value) {
		return [name, "(", value,")"];
	}

	prompt(text, ...values) {
		const level = [];
		level.push("?{");
		level.push(text);

		switch (values.length) {
		case 0:
			throw new Error("Must have at least 1 value");
		
		case 1:
			level.push("|", values[0]);
			break;

		default:
			if (values.length % 2 != 0) {
				throw new Error("Must have even number of pairs");
			}
			for (let i = 0; i < values.length; i += 2) {
				level.push("|", values[i], ",", values[i + 1]);
			}
			break;
		}

		level.push("}");
		return level;
	}

	confirm(title, yes, no) {
		return this.prompt(title, "Yes", yes, "No", no);
	}

	deny(title, no, yes) {
		return this.prompt(title, "No", no, "Yes", yes);
	}

	macro() {

		const flatten = (list, accumulator) => {
			for (let element of list) {
				if (element instanceof Array) {
					flatten(element, accumulator);
				} else {
					accumulator.push(String(element));
				}
			}
			return accumulator;
		};

		return flatten(this.base, []).join("");
	}

}

/**
 * User Interface
 */
class UserInterface {

	static HISTORY_LIMIT = 100;

	constructor(sheet) {
		this.sheet    = sheet;

		const history = localStorage.getItem("history");
		this._history = history ? JSON.parse(history) : [];
		this._index   = this._history.length - 1;
		
		this._display = element("textarea", {
			class: ["simple-border", "calculator", "calculator-out"],
		});

		this._labels   = new Toggle("Roll20 Labels?", true);
		this._alias    = new Toggle("Roll20 Variables?", false);
		this._compact  = new Toggle("Compact Macro Expressions?", true);
		this._testroll = new Toggle("Test Roll Prompt?", false);
		this._ranges   = new Toggle("Explicit Attack Range?", false);
		
		this._input   = element("input", {
			class: ["simple-border", "calculator"],
			attrs: {
				type      : "text",
				onkeydown : ((event) => {
					if (event.keyCode == 13) {
						this.evaluate();
					} else if (event.keyCode == 38) {
						this.historyLast();
					} else if (event.keyCode == 40) {
						this.historyNext();
					} else {
						/* do nothing */
					}
					this.showDefined();
				}),
				oninput   : ((event) => this.showDefined()),
			},
		});

		this.varopts = element("div");
		this._defs   = element("dl");

		this.root     = element("div", [

			element("input", {
				class: ["simple-border"],
				attrs: {
					type    : "button",
					value   : "Create Blurb",
					onclick : (() => this.blurb()),
				}
			}),

			element("input", {
				class: ["simple-border"],
				attrs: {
					type    : "button",
					value   : "Create Macro",
					onclick : (() => this.macro()),
				}
			}),

			element("input", {
				class: ["simple-border"],
				attrs: {
					type    : "button",
					value   : "Batch Create Macros",
					onclick : (() => this.macros()),
				}
			}),

			element("br"),
			
			tooltip(
				this._alias.root,
				wrap(
					"This will replace the raw base stats with Roll20 ",
					"variables. I.e. instead of inserting your raw base ",
					"str value of say, 5, it'll output @{Str}. This is ",
					"mainly useful for if you don't want to have to ",
					"regenerate all of your macros every time you ",
					"level up.",
				),
			),

			tooltip(
				this._labels.root,
				wrap(
					"Label each modifier in the macro to make it easier to ",
					"tell what item, attribute, ability, art, etc. that it ",
					"comes from. This is mostly useful for verifying output.",
				),
			),

			element("br"),

			tooltip(
				this._ranges.root,
				wrap(
					"Always include a prompt asking the user to input the ",
					"range that an attack is being made at, even if no range ",
					"penalty could possibly apply.",
				),
			),

			tooltip(
				this._testroll.root,
				wrap(
					"Generated macros will include a prompt on whether this ",
					"this roll is a test roll or a real roll. Dice will not ",
					"be rolled for a test roll."
				),
			),

			element("br"),

			tooltip(
				this._compact.root,
				wrap(
					"Make generated macros more compact by eliminating ",
					"extraneous operations such as adding or subtracting zero ",
					"and multiplying or dividing by one. This may or may not ",
					"eliminate these operations if labels are also enabled.",
				),
			),

			element("br"),

			this._display,

			element("br"),

			this._input,

			element("br"),

			this.varopts,

			this._defs,
		]);
	}

	historyLast() {
		this._input.value = this._history[this._index];
		if (this._index > 0) --this._index;
	}

	historyNext() {
		this._input.value = this._history[this._index];
		if (this._index < this._history.length - 1) ++this._index;
	}

	historyPush(value) {// todo autosave
		this._history.push(value);

		if (this._history.length > 100) {
			this._history.shift();
		}

		this._index = this._history.length - 1;
	}

	historySave() {
		localStorage.setItem("history", JSON.stringify(this._history));
	}

	evaluate(source) {

		source = source || this._input.value;

		try {
			const expression = this.sheet.compiler.compile(source);

			console.log(expression);

			this._display.value = wrap(
				"value: ", expression.execute(), "\n",
				"input: ", expression.source, "\n",
				"macro: ", expression.macro(
					0
						| (this._labels.checked  ? Expression.Env.LABEL   : 0)
						| (this._alias.checked   ? Expression.Env.ALIAS   : 0)
						| (this._compact.checked ? Expression.Env.COMPACT : 0)
				), "\n",				
			);

			this.historyPush(source);
			this._input.value = "";

		} catch (error) {

			const comperr = Expression.CompilationError;

			if (error instanceof comperr) {
				
				console.error(error);

				this._display.value = wrap(
					source, "\n",
					"~".repeat(
						error.position >= 0
							? error.position
							: source.length
					), "^\n",
					error,
				);
			} else {
				throw error;
			}
		}
	}

	showDefined(source) {

		source = source || this._input.value;

		while (this._defs.firstChild) {
			this._defs.removeChild(this._defs.lastChild);
		}

		try {
			const tokens = Expression.tokenize(source);
			const seen   = new Set();

			for (let each of tokens) {

				const token = each[0];

				if (seen.has(token)) continue;

				if (token in Expression.HELP) {
					for (let fn of Expression.HELP[token]) {
						this._defs.appendChild(element("dt", fn.called));
						this._defs.appendChild(element("dd", fn.about));
					}
				}

				if (token in this.sheet.definez) {
					const fn = this.sheet.definez[token];
					this._defs.appendChild(element("dt", fn.header));
					this._defs.appendChild(element("dd", fn.about));
				}

				const macros = this.sheet.compiler.macros;
				if (token in macros) {
					const template = macros[token];
					this._defs.appendChild(element("dt", template.called));
					this._defs.appendChild(element("dd", template.about));
				}

				seen.add(token);
			}
		} catch (e) {
			/* it's fine for tokenization to fail silently */
		}
	}

	gambit(display=true) {

		const m      = new Builder();
		const gambit = this.sheet.battalion.getGambit();
		const arts   = (
			this.sheet.arts.getActiveValues()
				.filter(art => !art.isTactical() && art.tagged("metagambit"))
		);

		/* Set up macro-generation environment */
		const env = new Expression.Env(
			Expression.Env.MACROGEN
				| (this._labels.checked  ? Expression.Env.LABEL   : 0)
				| (this._alias.checked   ? Expression.Env.ALIAS   : 0)
				| (this._compact.checked ? Expression.Env.COMPACT : 0),
			this.sheet.definez,
		);

		/* Determine if this allows test rolls */
		const roll = (
			this._testroll.checked
				? m.prompt("Test Roll",
					"No"  , m.sum("1d100"),
					"Yes" , m.sum("0"))
				: m.sum("1d100")
		);

		for (let art of arts) {
			if (art.tagged("depricated")) {
				alert(`${art.name}\n${art.description}`);
				return "";
			}
		}

		const tagged = [gambit].concat(arts);

		(m
			.me("(FLAVOR TEXT GOES HERE)")
			.table()
			.row("name",
				(arts.length
					? `${gambit.name} w/ ${
						arts.map(art => art.name).join(" & ")
					}`
					:    gambit.name))
		);

		/* no hit, no might, no stats, no cost */

		if (tagged.count(f => f.tagged("no hit")) == 0) {
			(m
				.row("To Hit",
					m.merge(
						roll,
						"≤",
						m.sum(env.read("battalion|total|hit"))
					))
			);
		}

		if (tagged.count(f => f.tagged("no might")) >= 1) {
			/* exclude the might row */
		} else {
			(m
				.row("Damage is",
					m.merge(
						m.sum(env.read("battalion|total|mt")),
						" v. ",
						[
							"Error",
							"Prot",
							"Resl",
							"None"
						][
							env.read("gambit|total|mttype")
						]
					))
			);
		}

		if (tagged.count(f => f.tagged("no stats")) == 0) {
			(m
				.row("Prot/Resl/Barrier",
					m.merge(
						m.sum(env.read("battalion|total|prot")),
						"/",
						m.sum(env.read("battalion|total|resl")),
						"/",
						m.sum(env.read("battalion|total|br"))))
			);
		}

		if (tagged.count(f => f.tagged("no cost")) == 0) {
			(m
				.row("SP/EP Cost",
					m.merge(
						m.sum(env.read("unit|total|spcost")),
						"/",
						m.sum(env.read("battalion|total|epcost"))))
			);
		}

		for (let row of this.sheet.battalion.iterCustomRows(false)) {
			if (row.check(env)) row.create(m, env);
		}

		m.line("");

		const set = new Set([gambit.name]);

		/* Gambit description */
		for (let line of hitip.text(gambit, set, false)) {
			m.line(m.italic(line));
		}

		/* Arts description */
		for (let art of arts) {
			for (let line of hitip.text(art, set, false, true)) {
				m.line(m.italic(line));
			}
		}

		const macro = m.macro();

		if (display) {
			console.log(macro);
			this._display.value = macro;
		}

		return macro;
	}

	macro(display=true) {

		const m    = new Builder();
		const arts = this.sheet.arts.getActiveValues();
		const wpn  = this.sheet.item;

		/* Set up macro-generation environment */
		const env = new Expression.Env(
			Expression.Env.MACROGEN
				| (this._labels.checked  ? Expression.Env.LABEL   : 0)
				| (this._alias.checked   ? Expression.Env.ALIAS   : 0)
				| (this._compact.checked ? Expression.Env.COMPACT : 0),
			this.sheet.definez,
		);

		/* Determine if this allows test rolls */
		const roll = (
			this._testroll.checked
				? m.prompt("Test Roll",
					"No"  , m.sum("1d100"),
					"Yes" , m.sum("0"))
				: m.sum("1d100")
		);

		for (let art of arts) {
			if (art.tagged("depricated")) {
				alert(`${art.name}\n${art.description}`);
				return "";
			}
		}

		const tactic = arts.filter(art =>  art.isTactical()).at(0);
		const meta   = arts.filter(art => !art.isTactical());
		const base   = tactic ? tactic : wpn;
		const tagged = [base].concat(meta);

		(m
			.me("(FLAVOR TEXT GOES HERE)")
			.table()
			.row("name",
				(meta.length
					? `${base.name} w/ ${meta.map(art => art.name).join(" & ")}`
					:    base.name))
		);

		if (tagged.count(f => f.tagged("no hit")) == 0) {
			(m
				.row("To Hit",
					m.merge(
						roll,
						"≤",
						m.sum(env.read("unit|total|hit"))
					))
			);
		}

		if (tagged.count(f => f.tagged("no crit")) == 0) {
			(m
				.row("To Crit",
					m.merge(
						roll,
						"≤",
						m.sum(env.read("unit|total|crit"))
					))
			);
		}

		if (tagged.count(f => f.tagged("no might")) >= 1) {
			/* exclude the might row */
		} else if (tagged.count(f => f.tagged("healing")) >= 1) {
			/* this is a healing effect */
			(m
				.row("Healing",
					m.sum(env.read("unit|total|mt")))
			);
		} else {
			(m
				.row("Damage is",
					m.merge(
						m.sum(env.read("unit|total|mt")),
						" v. ",
						[
							"Error",
							"Prot",
							"Resl",
							"None"
						][
							env.read("unit|total|mttype")
						]
					))
			);
		}

		if (tagged.count(f => f.tagged("no stats")) == 0) {
			(m
				.row("Hit/Crit Avo",
					m.merge(
						m.sum(env.read("unit|total|avo")),
						"/",
						m.sum(env.read("unit|total|cravo"))))
				.row("Prot/Resl",
					m.merge(
						m.sum(env.read("unit|total|prot")),
						"/",
						m.sum(env.read("unit|total|resl"))))
				.row("Dbs/Spd/Dbd",
					m.merge(
						m.sum(env.read("unit|total|doubles")),
						"/",
						m.sum(env.read("unit|total|spd")),
						"/",
						m.sum(env.read("unit|total|doubled"))))
			);
		}

		if (tagged.count(f => f.tagged("no cost")) == 0) {
			(m
				.row("SP/TP Cost",
					m.merge(
						m.sum(env.read("unit|total|spcost")),
						"/",
						m.sum(env.read("unit|total|tpcost"))))
			);
		}

		for (let row of this.sheet.iterCustomRows(!tactic)) {
			if (row.check(env)) row.create(m, env);
		}

		m.line("");

		const set = new Set([base.name]);

		const feature = [base.name, tactic ? base.description : wpn.fullInfo()];

		/* Base description */
		for (let line of hitip.text(feature, set, false)) {
			m.line(m.italic(line));
		}
		
		if (tactic) {
			/* TODO maybe include something here for tactical arts
			   that have attribute variants (doesn't seem necessary but idk */
		} else {
			/* Include any attributes on the item if we're using one. */
			const explain = wpn.attributes.getActiveValues().filter(
				attribute => attribute.tagged("explain")
			);

			for (let attribute of explain) {
				const text = hitip.text(attribute, set, false, true);
				for (let line of text) m.line(m.italic(line));
			}
		}

		/* Meta description */
		for (let art of meta) {
			for (let line of hitip.text(art, set, false, true)) {
				m.line(m.italic(line));
			}
		}

		const macro = m.macro();

		if (display) {
			console.log(macro);
			this._display.value = macro;
		}

		return macro;
	}

	macros(display=true) {

		const macros  = [];
		const items   = this.sheet.wb;
		const arts    = this.sheet.arts;
		const item    = this.sheet.item;
		const gambits = this.sheet.battalion.gambits;

		// sync to prevent the item in the list from being stale
		items.sync();

		const state  = {
			arts   : arts.getState(),
			item   : items.activeID,
			gambit : this.sheet.battalion.getGambit(),
		};

		gambits.add("Counter");

		const targets = chain(
			["==========  ITEMS  ========="],
			Array.from(items.category.entries()),
			["========== TACTICS =========="],
			arts.values(),
			["========== GAMBITS =========="],
			gambits.values(),
		);

		const ref      = {target: null};
		const compiler = new Polish.Compiler(Art.compatibles(ref));
		const metaarts = Array.from(arts.values()).filter(art => !art.isTactical());
		const combos   = metaarts.filter(art => art.isCombo());

		for (let target of targets) {

			// Method to be used to create the macro.
			let generate = null;

			// This is used to generate the section separators.
			if (typeof target == "string") {
				macros.push(target);
				continue;
			}

			// We need the plain macro to start with.
			arts.clearActive();

			switch (target.constructor.name) {
			case "Art": {

				// Only tactical arts among arts can host macros.
				if (!target.isTactical()) continue;

				arts.toggleActive(target.name);

				generate   = this.macro;
				ref.target = target;
				break;
			}
			case "Gambit": {

				// Structure gambits can't host macros.
				if (target.tagged("structure")) continue;

				// Make sure that this is the only active non-structure.
				this.sheet.battalion.toggleGambit(target.name);

				generate   = this.gambit;
				ref.target = target;
				break;
			}
			case "Array": { // Items are handled here.

				// Unpack the array.
				const [key, value] = target;

				// Just don't load it if not in inventory.
				if (!value.inventory) continue;

				// This behaves more like a feature.
				items.change(key);
				target = item;

				// If this item is a brawl weapon with no Mystic or Mighty
				// attribute then stop macrogen and ask the user to add one
				const brawl = item.template.type == "Brawl";
				const attrs = item.attributes;

				if (brawl && !(attrs.has("Mighty") || attrs.has("Mystic"))) {
					const text = wrap(
						`${item.name} isn't Mighy or Mystic. `,
						"Abort macro generation?"
					);

					if (confirm(text)) {
						// Take the user to the location of the issue.
						items.category.toggleActive(item.name);
						this.sheet.tabs.create.active = "Inventory";
						this.sheet.tabs.main.active   = "Create";

						// No special cleanup is needed because we
						// always process all items before other features.
						return [];
					}
				}

				generate   = this.macro;
				ref.target = target.template;
				break;
			}
			default:
				throw new Error(
					`invalid host constructor '${target.constructor.name}'`
				);
			}

			// Create the plain macro for this target.
			macros.push(generate.call(this, false));

			for (let art of metaarts) {
				if (!compiler.compile(art.compatible).exec()) continue;

				// Activate this art.
				arts.toggleActive(art.name);

				// Create a macro with this combat art.
				macros.push(generate.call(this, false));

				// TODO there are technically combos where the one art
				// restricts the other one, but we'll ignore those for
				// now because I do not feel like dealing with that.

				for (let combo of combos) {
					// We neither need nor can handle doubles.
					if (art == combo) continue;

					// Check if this is compatible as well.
					if (!compiler.compile(combo.compatible).exec()) continue;
				
					// Activate this combo art.
					arts.toggleActive(combo.name);

					// Create a macro with this combination of combat arts.
					macros.push(generate.call(this, false));

					// Deactive the combo art for the next one.
					arts.toggleActive(combo.name);
				}

				// Disable the art for next run.
				arts.toggleActive(art.name);
			}
		}

		// Restore the state of things to how we found them.
		gambits.delete("Counter");
		this.sheet.battalion.toggleGambit(state.gambit.name);
		items.change(state.item);
		arts.setState(state.arts);

		// This will prevent a phantom "Counter" from remaining.
		this.sheet.battalion.refresh();

		if (display) this._display.value = macros.join("\n\n");
		return macros;
	}

	blurb(display=true) {

		const text  = [];
		const sheet = this.sheet;
		const env   = new Expression.Env(Expression.Env.RUNTIME, sheet.definez);

		function list(title, iterable) {
			const array = Array.from(iterable);
			if (array.length == 0) return;

			text.push(title, "\n\n");

			for (let feature of array) {
				text.push(feature.blurb(), "\n\n");
			}
		}

		text.push("# ", sheet.character.name, "\n\n```\n");
		for (let name of sheet.stats.names) {
			text.push(
				name.toUpperCase().padEnd(3, " "), " = ",
				env.read(`unit|total|${name}`), "\n"
			);
		}
		text.push("```\n\n");

		text.push("## Description\n\n");
		text.push(sheet.character.description, "\n\n");

		/* Inventory */

		let   added = 0;
		const hole  = text.length;

		text.push("");

		const active = sheet.wb.activeID;

		for (let uid of sheet.wb.category.names()) {
			sheet.wb.change(uid);
			if (sheet.wb.model.inInventory) {
				text.push(sheet.wb.model.blurb(), "\n\n");
				++added;
			}
		}

		sheet.wb.change(active);

		if (added) text[hole] = "## Inventory\n\n";

		/* Other Features */

		list("## Equipment", sheet.equipment.values());

		const className = sheet.character.class.name;
		if (className != "None") text.push(`## ${className}\n\n`);

		list("## Abilities", sheet.abilities.values());

		list("## Arts", sheet.arts.values());

		/* Battalion */

		if (sheet.bb.category.active) {
			text.push("## Battalion\n\n", sheet.battalion.blurb(), "\n\n");
			list("### Gambits", sheet.battalion.gambits.values());
		}

		/* The End */

		const blurb = text.join("");
		if (display) this._display.value = blurb;
		return blurb;
	}
}

return {
	UserInterface: UserInterface,
	Builder: Builder,
	CustomRow: CustomRow,
};

})();

/* exported Macros */
