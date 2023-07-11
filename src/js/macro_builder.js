


/* global wrap */
/* global tooltip */
/* global element */
/* global Toggle */

/* global Expression */

/* global CombatArt */
/* global Ability */
/* global hitip */

/**
 * A module that implements a builder for Roll20 Macros
 * @module Macros
 */
const Macros = (function() {

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
					"tell what weapon, attribute, ability, art, etc. that it ",
					"comes from. This is mostly useful for verifying output.",
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
				this._testroll.root,
				wrap(
					"Generated macros will include a prompt on whether this ",
					"this roll is a test roll or a real roll. Dice will not ",
					"be rolled for a test roll."
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

	macro(display=true) {

		const m   = new Builder();
		const art = CombatArt.get(this.sheet.arts.equipped.getActive());
		const wpn = this.sheet.weaponz;

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

		if (art != CombatArt.EMPTY && art.tagged("depricated")) {
			alert(`${art.name}\n${art.description}`);
			return;
		}

		/* Make use of a blank default weapon for tactical arts */
		let tactical = null;
		if (art.tagged("tactical")) {
			tactical = this.sheet.wb.activeID;
			this.sheet.wb.add();
			this.sheet.weaponz.template = "Tactical Art";
		}

		(m
			.me("(FLAVOR TEXT GOES HERE)")
			.table()
			.row("name",
				(art != CombatArt.EMPTY
					? (tactical
						? art.name
						: `${wpn.name} w/ ${art.name}`)
					: wpn.name))
		);

		if (!(wpn.tagged("no hit") || art.tagged("no hit"))) {
			(m
				.row("To Hit",
					m.merge(
						roll,
						"≤",
						m.sum(env.read("unit|total|hit"))
					))
			);
		}

		if (!(wpn.tagged("no crit") || art.tagged("no crit"))) {
			(m
				.row("To Crit",
					m.merge(
						roll,
						"≤",
						m.sum(env.read("unit|total|crit"))
					))
			);
		}

		if (wpn.tagged("no might") || art.tagged("no might")) {
			/* exclude the might row */
		} else if (wpn.tagged("healing") || (tactical && art.tagged("healing"))) {
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

		if (!(wpn.tagged("no stats") || art.tagged("no stats"))) {
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
				.row("Doubles/Doubled",
					m.merge(
						m.sum(env.read("unit|total|doubles")),
						"/",
						m.sum(env.read("unit|total|doubled"))))
			);
		}

		if (!(wpn.tagged("no cost") || art.tagged("no cost"))) {
			(m
				.row("SP/TP Cost",
					m.merge(
						m.sum(env.read("unit|total|spcost")),
						"/",
						m.sum(env.read("unit|total|tpcost"))))
			);
		}

		/* List all abilities with a proc chance */
		const procs = (
			Array.from(this.sheet.abilities.equipped.getActive())
				.map(x => Ability.get(x))
				.filter(a => a.tagged("chance") && "proc" in a.modifiers)
		);

		/* Add in rolls for abilities with a proc chance */
		for (let ability of procs) {
			(m
				.row(ability.name,
					m.merge(
						roll,
						"≤",
						m.sum(Expression.macro(ability.modifiers.proc))
					))
			);
		}

		m.line("");

		const set = new Set([wpn.name]);

		const feature = [wpn.name, wpn.fullInfo()];

		/* Weapon description */
		if (!tactical) {
			for (let line of hitip.text(feature, set, false)) {
				m.line(m.italic(line));
			}
		}

		/* Arts description */
		if (this.sheet.arts.equipped.getActive()) {
			for (let line of hitip.text(art, set, false)) {
				m.line(m.italic(line));
			}
		}

		/* Proc chance ability descriptions */
		for (let ability of procs) {
			for (let line of hitip.text(ability, set, false, true)) {
				m.line(m.italic(line));
			}
		}

		const macro = m.macro();

		/* Reset weapon to equipped weapon after tactical art generation */
		if (tactical) {
			const tmp = this.sheet.wb.activeID;
			this.sheet.wb.change(tactical);
			this.sheet.wb.remove(tmp);
		}

		if (display) {
			console.log(macro);
			this._display.value = macro;
		}

		return macro;
	}

	macros(display=true) {
		/* experimental function to make macros for all possible combos */

		const macros   = [];
		const weapons  = this.sheet.wb;
		const weapon   = this.sheet.weaponz;
		const wselect  = weapons.activeID;
		const arts     = this.sheet.arts.equipped;
		const aselect  = arts.active;

		const ref      = {weapon: null};
		const compiler = new Polish.Compiler(CombatArt.compatibles(ref));

		/* Create a macro for each weapon in inventory */
		for (let key of Array.from(weapons.map.keys())) {
			weapons.change(key);

			/* We only want macros for weapons in the inventory */
			if (!weapon.inInventory) continue;

			/* First we needs a macro for the plain weapon */
			if (arts.active) arts.toggleActive(arts.active);
			macros.push(this.macro(false));

			/* Now we need ones for its compatible arts */
			ref.weapon = weapon.template;
			for (let art of arts.values()) {

				/* Skip these. We'll get them once at the end */
				if (art.tagged("tactical")) continue;

				/* Check whether this combat art and weapon are compatible */
				if (!compiler.compile(art.compatible).exec()) continue;

				/* Create the macro */
				arts.toggleActive(art.name);
				macros.push(this.macro(false));
			}
		}

		/* Now to make macros for the tactical arts */
		for (let art of arts.values()) {

			/* Skip these. We already made macros for all of them */
			if (!art.tagged("tactical")) continue;
		
			/* Create the macro */
			arts.toggleActive(art.name);
			macros.push(this.macro(false));
		}

		weapons.change(wselect);
		arts.toggleActive(aselect);

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

		/* Weapons and Spells */

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

		if (added) text[hole] = "## Weapons & Spells\n\n";

		/* Other Features */

		list("## Equipment", sheet.equipment.known.values());

		const className = sheet.character.class.name;
		if (className != "None") text.push(`## ${className}\n\n`);

		list("### Class Abilities", sheet.abilities.class.values());

		list("### Class Arts", sheet.arts.class.values());

		list("## Equipped Abilities", sheet.abilities.equipped.values());

		list("## Equipped Arts", sheet.arts.equipped.values());

		/* The End */

		const blurb = text.join("");
		if (display) this._display.value = blurb;
		return blurb;
	}
}

return {
	UserInterface: UserInterface,
	Builder: Builder,
};

})();

/* exported Macros */
