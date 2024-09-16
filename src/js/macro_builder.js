
/* global
	BigButton, Iter, Toggle,
	element, tooltip, uniqueID, wrap
*/

/* global Compatible */

/* global Calculator */

/* global Polish */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */

/* global definitions */

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
		return Calculator.execute(this.when);
	}

	macro(env) {
		return (
			Calculator.is(this.expr)
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

	constructor(brace=true) {
		this.base  = [];
		this.brace = brace;
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
		return `*${text}*`;
	}

	bold(text) {
		return `**${text}**`;
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
		if (this.brace) level.push("[[");

		let first = true;
		for (let arg of args) {
			if (arg == null) continue;
			if (!first) level.push("+");
			level.push(arg);
			first = false;
		}

		if (this.brace) level.push("]]");
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
		return `@{${attribute}}`;
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

	macro(gm=false) {

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

		const whisper = gm ? "/w gm " : "";
		const macro   = flatten(this.base, []).join("");

		return `${whisper}${macro}`;
	}

}

/**
 * User Interface
 */
class UserInterface {

	static HISTORY_LIMIT = 100;

	constructor(sheet) {
		this.sheet  = sheet;
		this.marker = sheet.marker;

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
		this._defend   = new Toggle("Subtract Foe's Defenses", false);
		this._export   = new BigButton("Export as VTTES Character",
			() => void this.exportVTTES()
		);
		
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

			tooltip(
				this._defend.root,
				wrap(
					"Automatically subtract selected foe's defenses when you ",
					"roll a macro with a hit chance. This only works if the ",
					"sheet for that foe has defensive macros set up."
				),
			),

			this._export.label,

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
			const jsexpr     = expression.js();
			const jsfunc     = eval(jsexpr);
			
			console.log(expression);

			this._display.value = wrap(
				"value: ", expression.execute(), "\n",
				"input: ", expression.source, "\n",
				"macro: ", expression.macro(
					0
						| (this._labels.checked  ? Calculator.Env.LABEL   : 0)
						| (this._alias.checked   ? Calculator.Env.ALIAS   : 0)
						| (this._compact.checked ? Calculator.Env.COMPACT : 0)
				), "\n",
				"jsgen: ", jsexpr, "\n",
				"jsout: ", jsfunc(
					expression.env.with(Calculator.Env.RUNTIME)
				), "\n",
			);

			this.historyPush(source);
			this._input.value = "";

		} catch (error) {

			const comperr = Calculator.CompilationError;

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
			const tokens = Calculator.tokenize(source);
			const seen   = new Set();

			for (let each of tokens) {

				const token = each[0];

				if (seen.has(token)) continue;

				if (token in Calculator.HELP) {
					for (let fn of Calculator.HELP[token]) {
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
		const env = new Calculator.Env(
			Calculator.Env.MACROGEN
				| (this._labels.checked  ? Calculator.Env.LABEL   : 0)
				| (this._alias.checked   ? Calculator.Env.ALIAS   : 0)
				| (this._compact.checked ? Calculator.Env.COMPACT : 0),
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

		const options = {seen: new Set([gambit.name]), join: false};

		/* Gambit description */
		for (let line of this.marker.toText(gambit, options)) {
			m.line(m.italic(line));
		}

		// we do want the names to show up here
		options.named = true;

		/* Arts description */
		for (let art of arts) {
			for (let line of this.marker.toText(art, options)) {
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
		const env = new Calculator.Env(
			Calculator.Env.MACROGEN
				| (this._labels.checked  ? Calculator.Env.LABEL   : 0)
				| (this._alias.checked   ? Calculator.Env.ALIAS   : 0)
				| (this._compact.checked ? Calculator.Env.COMPACT : 0),
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


		const feature = [base.name, tactic ? base.description : wpn.fullInfo()];

		const options = {seen: new Set([base.name]), join: false};

		/* Base description */
		for (let line of this.marker.toText(feature, options)) {
			m.line(m.italic(line));
		}

		// we want names on reminder text from here on
		options.named = true;
		
		if (tactic) {
			/* TODO maybe include something here for tactical arts
			   that have attribute variants (doesn't seem necessary but idk */
		} else {
			/* Include any attributes on the item if we're using one. */
			const explain = wpn.attributes.getActiveValues().filter(
				attribute => attribute.tagged("explain")
			);

			for (let attribute of explain) {
				const text = this.marker.toText(attribute, options);
				for (let line of text) m.line(m.italic(line));
			}
		}

		/* Meta description */
		for (let art of meta) {
			for (let line of this.marker.toText(art, options)) {
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


	check(display=true) {
		const m   = new Builder();
		
		/* Set up macro-generation environment */
		const env = new Calculator.Env(
			Calculator.Env.MACROGEN
				| (this._labels.checked  ? Calculator.Env.LABEL   : 0)
				| (this._alias.checked   ? Calculator.Env.ALIAS   : 0)
				| (this._compact.checked ? Calculator.Env.COMPACT : 0),
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

		(m
			.table()
			.row("name", "Check")
			.row("Roll",
				m.merge(
					roll,
					"≤",
					m.sum(env.read("unit|ease"))
				))
		);

		const macro = m.macro(true);

		if (display) {
			console.log(macro);
			this._display.value = macro;
		}

		return macro;
	}

	static SEPERATOR_ITEMS   = "==========  ITEMS  =========";
	static SEPERATOR_TACTICS = "========== TACTICS ==========";
	static SEPERATOR_GAMBITS = "========== GAMBITS ==========";
	static SEPERATOR_CHECK   = "==========  CHECK  ==========";

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

		const targets = Iter.chain(
			[UserInterface.SEPERATOR_ITEMS],
			Array.from(items.category.entries("inventory")),
			[UserInterface.SEPERATOR_TACTICS],
			arts.values(),
			[UserInterface.SEPERATOR_GAMBITS],
			gambits.values(),
			[UserInterface.SEPERATOR_CHECK],
		);

		const ref      = {target: null};
		const context  = Compatible.createContext(ref, definitions);
		const compiler = new Polish.Compiler(context);
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
				const [key, _value] = target;

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

		// Add in the macro for checks
		macros.push(this.check(false));

		if (display) this._display.value = macros.join("\n\n");
		return macros;
	}

	blurb(display=true) {

		const text  = [];
		const sheet = this.sheet;
		const env   = new Calculator.Env(Calculator.Env.RUNTIME, sheet.definez);

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

		for (let uid of sheet.wb.category.names("inventory")) {
			sheet.wb.change(uid);
			text.push(sheet.wb.model.blurb(), "\n\n");
			++added;
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

	html(display=true) {

		const text  = [];
		const sheet = this.sheet;
		const env   = new Calculator.Env(Calculator.Env.RUNTIME, sheet.definez);

		function list(title, iterable) {
			const array = Array.from(iterable);
			if (array.length == 0) return;

			text.push(title, "\n\n");

			for (let feature of array) {
				text.push(feature.html(), "\n\n");
			}
		}

		text.push("<h1>", sheet.character.name, "</h1>\n\n<pre>\n");
		for (let name of sheet.stats.names) {
			text.push(
				name.toUpperCase().padEnd(3, " "), " = ",
				env.read(`unit|total|${name}`), "\n"
			);
		}
		text.push("</pre>\n\n");

		text.push("<h2>Description</h2>\n\n");
		text.push(sheet.character.description, "\n\n");

		/* Inventory */

		let   added = 0;
		const hole  = text.length;

		text.push("");

		const active = sheet.wb.activeID;

		for (let uid of sheet.wb.category.names("inventory")) {
			sheet.wb.change(uid);
			text.push(sheet.wb.model.html(), "\n\n");
			++added;
		}

		sheet.wb.change(active);

		if (added) text[hole] = "<h2>Inventory</h2>\n\n";

		/* Other Features */

		list("<h2>Equipment</h2>", sheet.equipment.values());

		const className = sheet.character.class.name;
		if (className != "None") text.push(`<h2>${className}</h2>\n\n`);

		list("<h2>Abilities</h2>", sheet.abilities.values());

		list("<h2>Arts</h2>", sheet.arts.values());

		/* Battalion */

		if (sheet.bb.category.active) {
			text.push("<h2>Battalion</h2>\n\n", sheet.battalion.html(), "\n\n");
			list("<h3>Gambits</h3>", sheet.battalion.gambits.values());
		}

		/* The End */

		const blurb = text.join("");
		if (display) this._display.value = blurb;
		return blurb;
	}

	vttes(display=true) {

		const alias = this._alias.checked;
		this._alias.checked = true;

		let   done  = false;
		const sheet = this.sheet;
		const env   = sheet.runenv;
		const oldId = uniqueID();

		const hpID  = uniqueID();
		const spID  = uniqueID();
		const tpID  = uniqueID();

		const template = {
			schema_version: 3,
			type: "character",
			character: {
				oldId            : oldId,
				name             : sheet.character.name,
				avatar           : "",
				bio              : encodeURIComponent(this.html(false)),
				gmnotes          : "",
				defaulttoken     : JSON.stringify({
					imgsrc              : "",
					width               : 70,
					height              : 70,
					layer               : "objects",
					name                : sheet.character.name,
					represents          : oldId,
					light_multiplier    : 1,
					bar_location        : "overlap_bottom",
					compact_bar         : "compact",
					bar1_num_permission : "hidden",
					bar1_value          : env.read("unit|total|hp"),
					bar1_max            : env.read("unit|total|hp"),
					// bar1_link           : hpID,
					bar2_num_permission : "hidden",
					bar2_value          : env.read("unit|total|sp"),
					bar2_max            : env.read("unit|total|sp"),
					// bar2_link           : spID,
					bar3_num_permission : "hidden",
					bar3_value          : env.read("unit|total|tp"),
					bar3_max            : env.read("unit|total|tp"),
					// bar3_link           : tpID,
				}),
				tags             : "[]",
				controlledby      : "all",
				inplayerjournals : "all",
				attribs          : [
					{
						name    : "HP",
						current : String(env.read("unit|total|hp")),
						max     : "",
						id      : hpID,
					},
					{
						name    : "SP",
						current : String(env.read("unit|total|sp")),
						max     : "",
						id      : spID,
					},
					{
						name    : "TP",
						current : String(env.read("unit|total|tp")),
						max     : "",
						id      : tpID,
					},
					{
						name    : "Str",
						current : String(env.read("unit|base|str")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Mag",
						current : String(env.read("unit|base|mag")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Dex",
						current : String(env.read("unit|base|dex")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Spd",
						current : String(env.read("unit|base|spd")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Def",
						current : String(env.read("unit|base|def")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Res",
						current : String(env.read("unit|base|res")),
						max     : "",
						id      : uniqueID(),
					},
					{
						name    : "Lck",
						current : String(env.read("unit|base|lck")),
						max     : "",
						id      : uniqueID(),
					},
					// ...this.defensive().map(attribute => ({
					// 	name    : attribute[0],
					// 	current : attribute[1],
					// 	max     : "",
					// 	id      : uniqueID(),
					// })),
				],
				abilities        : (
					this.macros(false)

						// filter out the things we don't want
						.filter(macro => {

							if (done) return false;

							if (macro == UserInterface.SEPERATOR_ITEMS)
								return false;
							if (macro == UserInterface.SEPERATOR_TACTICS)
								return false;
							if (macro == UserInterface.SEPERATOR_GAMBITS) {
								done = true;
								return false;
							}
							return true;
						})

						// turn the rest into Roll20 abilities
						.map(macro => ({
							name          : (
								macro.match(/\{\{name=([^}]+)}}/)[1]
							),
							description   : "",
							istokenaction : true,
							action        : macro,
							order         : -1,
						}))
				),
			}
		};

		this._alias.checked = alias;
		if (display) this._display.value = JSON.stringify(template, null, 4);
		return template;
	}

	exportVTTES() {

		const a    = element("a");
		const item = this.vttes(false);
		const name = this.sheet.character.name;
		const file = new Blob(
			[JSON.stringify(item, null, 4)], {type: "application/json"}
		);
		
		a.href     = URL.createObjectURL(file);
		a.download = `${name.replace(/ /g, "_")}_vttes.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	// defensive() {

	// 	const m       = new Builder(false);
	// 	const stats   = definitions.stats.defensive;
	// 	const buckets = new Map();

	// 	const env = new Calculator.Env(
	// 		Calculator.Env.MACROGEN
	// 			| (this._labels.checked  ? Calculator.Env.LABEL   : 0)
	// 			| (this._alias.checked   ? Calculator.Env.ALIAS   : 0)
	// 			| (this._compact.checked ? Calculator.Env.COMPACT : 0),
	// 		this.sheet.definez,
	// 	);

	// 	for (let item of this.sheet.wb.iter()) {
	// 		for (let each of stats) {

	// 			const value = env.read(`item|total|${each}`);
	// 			if (value == "0") continue; 

	// 			if (!buckets.has(each)) buckets.set(each, ["Other", "0"]);
	// 			buckets.get(each).push(this.sheet.item.name, value);
			
	// 		}
	// 	}

	// 	const final = [];

	// 	for (let each of stats) {

	// 		const bucket = buckets.get(each);

	// 		final.push([capitalize(each), m.merge(
	// 			...m.sum(
	// 				env.read(`unit|received|${each}`),
	// 				bucket && bucket.length > 2
	// 					? m.prompt(
	// 						"Foe's Equipped Item?", ...bucket
	// 					).join("")
	// 					: "0"
	// 				)
	// 			).join(" ")
	// 		])
	// 	}

	// 	// if (display) this._display.value = macros.join("\n\n");
	// 	return final;
	// }
}

return {
	UserInterface : UserInterface,
	Builder       : Builder,
	CustomRow     : CustomRow,
};

})();

/* exported Macros */
