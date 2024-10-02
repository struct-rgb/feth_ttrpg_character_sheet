/**
 * @module Variables
 */

/* global
	Grade, Iter,
	capitalize, element,  uniqueID, wrap
 */

/* global
	Attribute, Action, Equipment, Item, Gambit
 */

/* global Macros */

/* global Forecast */

/* global Calculator */

if (typeof require !== "undefined") {

	/* global require */

	/* eslint-disable no-global-assign */

	/* eslint-enable no-global-assign */
}

const Variables = (function () {

function sum(env, ...args) {
	return (
		env.runtime
			? args.reduce((a, b) => a + b, 0)
			: args.reduce((a, b) =>
				a != 0
					? (b != 0
						? `${a} + ${b}`
						: a)
					: b,
			0)
	);
}

function label(env, text, value) {
	if (!env.runtime && env.label && value != "0") {
		if (typeof value == "string" && value.includes(" ")) {
			return `(${value}) [${text}]`;
		}
		return `${value} [${text}]`;
	}
	return value;
}

const funcsum = (add, ...names) => {

	const vars = [];

	for (let name of names) {
		const type = typeof name;
		if (type == "function") {

			// a hash name has already been made for this
			if (this._js_vmap.has(name)) {
				vars.push(this._js_vmap.get(name));
				continue;
			}

			// create a hash name for this function
			const uid = `uid|${uniqueID().replace(/-/g, "_")}`;

			add({
				name  : uid,
				about : "Anonymous function.",
				expr  : name,
			});

			this._js_vmap.set(name, uid);
			vars.push(uid);

		} else if (type == "string") {

			vars.push(name);

		} else {
			throw new Error(`type ${type} is invalid`);
		}
	}

	return vars.join("\n  + ");
};

function createContext(compiler, host, definitions) {

	if (this._context) return this._context;

	const base = compiler.context;

	/* this.macros must be initialized before this is called */
	const vardiv = this.macros.varopts;
	const varsen = [];
	const ctx    = base || {};

	const add = (template) => {
		const fn = compiler.define(template);
		varsen.push(fn.called);
		return fn.called;
	};

	this._js_vmap = new Map();

	const multisum = (getter, filter) => {

		if (!filter) filter = (x => true);

		return (field) => {
			return (env) => {

				// Unfortunate but necessary; uninitialized in outer scope.
				const category = getter();

				let a = 0;
				for (let each of category.getActive()) {
					const feature  = category.model.get(each);
					if (!filter(feature)) continue;
					const modifier = feature.modifier(field, env);
					if (modifier == 0) continue;

					a = sum(env, a, label(env, feature.name, modifier));
				}

				return a;
			};
		};
	};

	const abilityfunc = multisum(() => this.abilities);
	const artfunc     = multisum(() => this.arts);
	const combatfunc  = multisum(() => this.arts, (art) => !art.isTactical());
	const tacticfunc  = multisum(() => this.arts, (art) =>  art.isTactical());

	const gambitfunc = (desig, onlyActive=true) => {
		const name   = desig;
		const active = onlyActive;

		return ((env) => {

			let a = 0;

			const iter = (
				active
					? this.battalion.gambits.getActive()
					: this.battalion.gambits.names()
			);

			for (let each of iter) {

				const gambit = Gambit.get(each);
				// if (ability.tagged("art")) continue;
				const modifier = gambit.modifier(name, env);
				if (modifier == 0) continue;

				a = sum(env, a, label(env, gambit.name, modifier));
			}

			return a;
		});
	};

	const gambitoverfunc = (desig, onlyActive=true) => {
		const name   = desig;
		const active = onlyActive;

		return ((env) => {

			let a = 0, s = true;

			const iter = (
				active
					? this.battalion.gambits.getActive()
					: this.battalion.gambits.values()
			);

			for (let each of iter) {
				const g = Gambit.get(each);
				const m = g.modifier(name, env);

				if (!g.tagged("structure")) s = false;
				a = s ? sum(env, a, label(env, g.name, m)) : m;
			}

			return a;
		});
	};


	
	// .88b  d88. d888888b .d8888.  .o88b.
	// 88'YbdP`88   `88'   88'  YP d8P  Y8
	// 88  88  88    88    `8bo.   8P
	// 88  88  88    88      `Y8b. 8b
	// 88  88  88   .88.   db   8D Y8b  d8
	// YP  YP  YP Y888888P `8888Y'  `Y88P'

	add({
		name  : "other|trigger",
		about : "SBAC trigger modifier",
		expr  : abilityfunc("trigger"),
	});

	add({
		name  : "unit|level",
		about : "This unit's level",
		expr  : ((env) => this.stats.level)
	});

	add({
		name  : "unit|size",
		about : "Unit's length and width in tiles (units are squares).",
		expr  : ((env) => this.stats.size)
	});

	add({
		name  : "other|recursion",
		about : "If the interpreter is broken this will freeze the page.",
		expr  : "other|recursion",
	});

	add({
		name  : "other|range_penalty",
		about : wrap(
			"The hit penalty for attacking past maximum weapon range."
		),
		expr : (env) => {

			// this is only ever relevant in macrogen
			if (env.runtime) return 0;

			const rnv    = env.clone(Calculator.Env.RUNTIME);
			const max    = rnv.read("unit|total|maxrng");
			const cut    = rnv.read("host|maxrng");
			const diff   = max - cut;

			// we don't need anything for this unless the user asks
			// us to explicitly put it in, so otherwise save on clutter
			const hasCloseCounter = (
				this.abilities.active.has("Close Counter")
					&&
				rnv.read("host|type|bows")
			);

			const hasFarCounter = (
				this.abilities.active.has("Far Counter")
					&&
				rnv.read("host|type|brawl")
			);

			if (
				diff == 0
					&&
				!this.macros._ranges.checked
					&&
				!hasCloseCounter
					&&
				!hasFarCounter
			) return "0";

			const m      = new Macros.Builder();
			const min    = rnv.read("unit|total|minrng");
			const prompt = ["Range?"];

			const option = ((start, stop, penalty) => {
				if (start == stop) {
					return `Range ${start} (Hit -${penalty})`;
				}
				return `Range ${start}-${stop} (Hit -${penalty}`;
			});

			let range = min, start = min, last = 0;
			for (range = min; range <= max; ++range) {
				const raw     = 20 * (range - cut);
				const penalty = Math.min(60, Math.max(0, raw));

				if (last !== penalty) {
					prompt.push(option(start, range - 1, last), -last);
					start = range;
				}

				last = penalty;
			}
			prompt.push(option(start, range - 1, last), -last);

			if (hasCloseCounter) {
				prompt.push("Close Counter (Hit -0)", -0);
			}

			if (hasFarCounter) {
				prompt.push("Far Counter (Hit -0)", -0);
			}

			// in case we only end up with one range grouping such as
			// at times when this.macros._ranges.checked is set to true
			if (prompt.length == 3) prompt.push("No Penalty", 0);

			return m.merge(m.prompt(...prompt)).join("");
		}
	});

	for (let each of definitions.skills) {
		const skill = each;

		add({
			name  : `unit|rank|${Calculator.asIdentifier(skill)}`,
			about : wrap(
				`Unit's numerical ${skill} rank.`
			),
			expr  : ((env) => Grade.toNumber(this.skills[skill].grade))
		});
	}

	add({
		name  : "unit|rank|max",
		about : wrap(
			"Unit's highest numerical skill rank."
		),
		expr  : ((env) => {
			let highest = 0;
			for (let name of this.skills.names) {
				const grade = Grade.toNumber(this.skills[name].grade);
				highest     = Math.max(highest, grade);
			}
			return highest;
		}),
	});

	// d888888b d8888b. d888888b  .d8b.  d8b   db  d888b  db      d88888b
	// `~~88~~' 88  `8D   `88'   d8' `8b 888o  88 88' Y8b 88      88'
	//    88    88oobY'    88    88ooo88 88V8o 88 88      88      88ooooo
	//    88    88`8b      88    88~~~88 88 V8o88 88  ooo 88      88~~~~~
	//    88    88 `88.   .88.   88   88 88  V888 88. ~8~ 88booo. 88.
	//    YP    88   YD Y888888P YP   YP VP   V8P  Y888P  Y88888P Y88888P

	add({
		name  : "other|triangle",
		about : wrap(
			"The numerical value of the selected option of the Triangle ",
			"Effect select widget in the Create => Characters tab of the ",
			"unit builder.",
		),
		expr  : ((env) => this.character.triangle)
	});

	add({
		name  : "other|triangle|advantage",
		about : "Weapon triangle advantage value.",
		expr  : "+15",
	});

	add({
		name  : "other|triangle|neutral",
		about : "Weapon triangle neutral value.",
		expr  : "0",
	});

	add({
		name  : "other|triangle|disadvantage",
		about : "Weapon triangle disadvantage value.",
		expr  : "-15",
	});

	add({
		name  : "other|mounted",
		about : "Whether unit is mounted or not.",
		expr  : ((env) => Number(this.character.mounted)),
	});

	add({
		name  : "other|triangle|prompt",
		about : wrap(
			"Code that generates a prompt asking for the user to select ",
			"a Triangle Effect value when converted into a Roll20 macro. ",
			"Evaluates to 0 in the character builder.",
		),
		expr  : `
			ask [Triangle Effect?]
				else Neutral      {0}
				case Advantage    {+15}
				case Disadvantage {-15}
			end
		`,
	});

	add({
		name  : "other|triangle|conditional",
		about : wrap(
			"Takes into account whether this is codegen, in which case it ",
			"evaluates to other|triangle, or macrogen, in which cast it ",
			"evaluates to other|triangle|prompt. Additionally, if an art or ",
			"item that has the 'no triangle' tag is equipped, instead ",
			"evaluates to 0."
		),
		expr : `
			bothif not(item|tagged|no_triangle or arts|tagged|no_triangle) then
				other|triangle|prompt
			else
				0
			end
		`
	});

	add({
		name  : "other|initiative",
		about : wrap(
			"The numerical value of the selected option of the Combat ",
			"Initiative select widget in the Create => Characters tab of ",
			"the unit builder."
		),
		expr  : ((env) => this.character.initiative)
	});

	add({
		name  : "other|initiative|n_a",
		about : "Combat initiative value for not applicable.",
		expr  : "0",
	});

	add({
		name  : "other|initiative|unit",
		about : "Combat initiative value for unit initiated.",
		expr  : "1",
	});

	add({
		name  : "other|initiative|foe",
		about : "Combat initiative value for foe initiated.",
		expr  : "2",
	});

	// d8888b. d8888b. d888888b .88b  d88.  .d8b.  d8888b. db    db
	// 88  `8D 88  `8D   `88'   88'YbdP`88 d8' `8b 88  `8D `8b  d8'
	// 88oodD' 88oobY'    88    88  88  88 88ooo88 88oobY'  `8bd8'
	// 88~~~   88`8b      88    88  88  88 88~~~88 88`8b      88
	// 88      88 `88.   .88.   88  88  88 88   88 88 `88.    88
	// 88      88   YD Y888888P YP  YP  YP YP   YP 88   YD    YP

	for (let each of this.data.stats.first) {

		const name = each;

		const prime = [];

		add({
			name  : `unit|base|${name}`,
			about :
				`The unit's base ${name} statistic before modifiers.`
			,
			expr  : ((env) => {
				const value =  this.stats.stats[name].value;
				return label(env, `base ${name}`, value);
			}),
		});

		add({
			name  : `unit|growth|${name}`,
			about : `The unit's base ${name} growth before modifiers.`,
			expr  : ((env) => {
				return this.stats.growths[name].value;
			})
		});

		prime.push(add({
			name  : `unit|var_base|${name}`,
			about : wrap(
				"The unit's base ${name} statistic before modifiers, but",
				"gets replaced with a Roll20 variable name when used ",
				"to generate a Roll20 macro."
			),
			expr  : `${capitalize(name)} {unit|base|${name}}`,
		}));

		prime.push(add({
			name  : `class|base|${name}`,
			about : `The unit's class's ${name} modifier.`,
			expr  : ((env) => {
				const value = this.character.class.modifier(name, env);
				return label(env, "cls", value);
			}),
		}));

		add({
			name  : `class|growth|${name}`,
			about : `The unit's class's ${name} growth modifier.`,
			expr  : ((env) => {
				return this.character.class.growth(name);
			})
		});

		add({
			name  : `unit|total|growth|${name}`,
			about : `The unit's total ${name} growth after modifiers.`,
			expr  : ((env) => {

				// read out components
				const unit = env.read(`unit|growth|${name}`);
				const cls  = env.read(`class|growth|${name}`);

				// the normal sum of the growths
				const sum  = Math.max(0, unit + cls);

				// add limiter (negative) to sum growth to get final
				const grow = sum + Forecast.diminish(sum, name);

				return grow;
			}),
		});

		if (name == "mov") {
			add({
				name  : `class|mounted|${name}`,
				about : wrap(
					`Evaluates to the unit's class's mount's ${name} `,
					"modifier if the 'Mounted?' checkbox under Create => ",
					"Characters is checked, otherwise always evaluates to 0.",
				),
				expr  : ((env) => {
					const cls = this.character.class;
					return label(env, "mnt",
						cls.hasMount() && this.character.mounted
							? cls.mount
							: 0
					);
				}),
			});

			add({ /* not added to prime because we want it conditional */
				name  : `class|mount|${name}`,
				about : wrap(
					`The unit's class's mount's ${name} modifier. If `,
					"the unit's class has not mount, evaluates to 0.",
				),
				expr  : ((env) => {
					const cls = this.character.class;
					return label(env, "mount",
						cls.hasMount()
							? cls.mount
							: 0
					);
				}),
			});

			prime.push(add({
				name  : `class|ask_mounted|${name}`,
				about : wrap(
					`Evaluates to class|mounted|${name} in the character `,
					"builder, but creates a prompt in the generated Roll20 ",
					`macro for class|mount|${name}, so long as the value `,
					`of class|mount|${name} is not 0.`,
				),
				expr  : `
					metaif builtins|macrogen then
						metaif class|mount|${name} then 
							ask cat([Mounted? #], class|mount|${name})
								else Yes {class|mount|${name}}
								case No  {0}
							end
						else
							0
						end
					else
						class|mounted|${name}
					end
				`,
			}));
		}

		prime.push(add({ // TODO HIDDEN CODE
			name  : `abilities|${name}`,
			about :
				`The sum of all ${name} modifiers from active abilities.`
			,
			expr  : abilityfunc(name),
		}));

		prime.push(add({ // TODO HIDDEN CODE
			name  : `equipment|${name}`,
			about : wrap(
				`The total ${name} modifier provided by the equipped `,
				"equipment. If none is equipped then evaluates to 0.",
			),
			expr  : ((env) => {
				const key   = this.equipment.getActive();
				if (key == null) return 0;
				const equip = Equipment.get(key);
				return label(env, equip.name, equip.modifier(name, env));
			}),
		}));

		add({
			name  : `unit|modifier|${name}`,
			about : `The sum of all ${name} modifiers.`,
			expr  : funcsum(...prime),
		});

		add({
			name  : `unit|total|${name}`,
			about : wrap(
				`The unit's total ${name} statistic after `,
				"modifiers.",
			),
			expr  : funcsum(...prime),
		});
	}

	// d888888b  .d8b.   d888b   d888b  d88888b d8888b.
	// `~~88~~' d8' `8b 88' Y8b 88' Y8b 88'     88  `8D
	//    88    88ooo88 88      88      88ooooo 88   88
	//    88    88~~~88 88  ooo 88  ooo 88~~~~~ 88   88
	//    88    88   88 88. ~8~ 88. ~8~ 88.     88  .8D
	//    YP    YP   YP  Y888P   Y888P  Y88888P Y8888D'
	
	add({
		name  : "unit|tagged|healing",
		about : wrap(
			"A flag; 1 if art is tagged with 'healing' and 0 if ",
			"art is not tagged with 'healing'. The 'healing' tag ",
			"indicates whether the art's might is applied as healing ",
			"or as damage. Used in the macro builder.",
		),
		expr : `
			bothif item|tagged|healing
				then item|tagged|healing
				else arts|tagged|healing
			end
		`
	});

	let item_tags = new Set();

	for (let item of Iter.chain(definitions.items, definitions.attributes)) {
		for (let tag of item.tags) {
			
			const name       = tag;
			const identifier = Calculator.asIdentifier(tag);
			if (item_tags.has(tag)) continue;

			add({
				name  : `item|tagged|${identifier}`,
				about : wrap(
					`A flag; 1 if item is tagged with '${tag}' and 0 if `,
					`item is not tagged with '${tag}'.`
				),
				expr  : ((env) => {
					const active = this.item.attributes.getActiveValues();

					for (let each of active) {
						if (each.tagged(name)) return true;
					}

					return Number(this.item.tagged(name));
				}),
			});

			add({
				name  : `inventory|${identifier}`,
				about : wrap(
					`The number of inventory items tagged with '${tag}'`,
				),
				expr  : ((env) => {
					this.wb.sync();

					let count = 0;

					for (let each of this.wb.category.values("inventory")) {

						// Check the item's custom tags.
						if (each.tags.includes(tag)) {
							++count; continue;
						}

						// Check the item's template tags.
						const item = Item.get(each.template);

						if (item.tagged(tag)) {
							++count; continue;
						}

						// Check tags on attributes.
						for (let attr of each.attributes) {
							const attribute = Attribute.get(attr.id);
							if (attribute.tagged(tag)) {
								++count; break;
							}
						}
					}

					return count;
				}),
			});

			item_tags.add(tag);
		}
	}

	const art_tags = new Set();

	for (let art of definitions.arts) {
		for (let tag of art.tags) {

			const name = tag;
			if (art_tags.has(tag)) continue;

			const id = Calculator.asIdentifier(tag);

			add({
				name  : `arts|tagged|${id}`,
				about : wrap(
					`A flag; 1 if any active art is tagged with '${tag}' and 0 otherwise.`
				),
				expr : ((env) => {
					const active = this.arts.getActiveValues();

					for (let each of active) {
						if (each.tagged(name)) return 1;
					}

					return 0;
				}),
			});

			add({
				name  : `tactical|tagged|${id}`,
				about : wrap(
					`A flag; 1 if any active tactical art is tagged with '${tag}' and 0 otherwise.`
				),
				expr  : ((env) => {
					return Number(this.arts.getActiveValues().any((art) =>
						art.isTactical() && art.tagged(name)
					));
				}),
			});

			art_tags.add(tag);
		}
	}

	for (let each of item_tags.intersect(art_tags)) {

		const tag = Calculator.asIdentifier(each);

		add({
			name  : `host|tagged|${tag}`,
			about : wrap(
				`A flag; 1 if host is tagged with '${tag}' and 0 otherwise.`
			),
			expr  : `item|tagged|${tag} or tactical|tagged|${tag}`,
		});
	}

	add({
		name  : "unit|multiplier|healing",
		about : wrap(
			"Used to halve base magic for healing spell might; value is ",
			"0.5 if item is tagged with 'healing' and is 1.0 if not."
		),
		expr  : `
			bothif arts|tagged|healing or item|tagged|healing
				then 0.5
				else 1.0
			end
		`,
	});

	// d88888b db       .d8b.   d888b  .d8888.
	// 88'     88      d8' `8b 88' Y8b 88'  YP
	// 88ooo   88      88ooo88 88      `8bo.
	// 88~~~   88      88~~~88 88  ooo   `Y8b.
	// 88      88booo. 88   88 88. ~8~ db   8D
	// YP      Y88888P YP   YP  Y888P  `8888Y'

	add({
		name  : "item|passes",
		about : wrap(
			"A flag; whether a the equipped item passes requirements."
		),
		expr  : ((env) => {
			const item      = this.item;
			const rank      = item._rank._trigger(item.rank);
			const type      = item.template.type;
			const source    = type ? `${type} ${rank}` : "None";
			const predicate = this.predicator.compile(source);
			return Number(predicate.exec().boolean);
		}),
	});

	for (let each of Item.TYPE.strings.entries()) {

		const [num, str] = each;

		add({
			name  : `item|type|${str.toLowerCase()}`,
			about : wrap(
				`Evaluates to 1 if item type is ${str}, and otherwise `,
				"evaluates to 0."
			),
			expr  : ((env) => {
				const string = this.item.template.type;
				const number = Item.TYPE.asNumber(string);
				return number == num;
			}),
		});

		add({
			name  : `inventory|type|${str.toLowerCase()}`,
			about : wrap(
				`The number of ${str} items in the inventory.`
			),
			expr  : ((env) => {
				this.wb.sync();

				let count = 0;

				for (let each of this.wb.category.values()) {
					const string = Item.get(each.template).type;
					const number = Item.TYPE.asNumber(string);
					if (number == num) count++;
				}

				return count;
			}),
		});
	}

	/* has to use the raw data because Attributes isn't populated yet */
	for (let each of definitions.attributes) {

		const name       = each.name;
		const identifier = Calculator.asIdentifier(name);

		add({
			name  : `item|has_attribute|${identifier}`,
			about : wrap(
				`Evaluates to 1 if item has the ${name} attribute, `,
				"and otherwise evaluates to 0."
			),
			expr  : ((env) => {
				return Number(this.item.attributes.active.has(name));
			}),
		});
	}

	add({
		name  : "item|type|weapon",
		about : wrap(
			"Evaluates to 1 if item skill type is Axes, Swords, Lances, ",
			"Brawling, or Bows, and otherwise evaluates to 0.",
		),
		expr  : ((env) => {
			const string = this.item.template.type;
			const number = Item.TYPE.asNumber(string);
			return 1 <= number && number <= 5;
		}),
	});

	add({
		name  : "item|type|spell",
		about : wrap(
			"Evaluates to 1 if item skill type is Faith, Guile, or Reason, ",
			"and otherwise evaluates to 0.",
		),
		expr  : ((env) => {
			const string = this.item.template.type;
			const number = Item.TYPE.asNumber(string);
			return 6 <= number && number <= 8;
		}),
	});

	for (let each of Item.TYPE.strings.entries()) {

		const [_num, str] = each;

		add({
			name  : `arts|type|${str.toLowerCase()}`,
			about : wrap(
				`The number of combat arts with the ${str} skill type.`
			),
			expr  : ((env) => {
				const type = Item.TYPE.asNumber(str);
				return this.arts.getActiveValues().count((art) =>{
					const number = Item.TYPE.asNumber(art.type);
					return !art.isTactical() && type == number;
				});
			}),
		});

		add({
			name  : `tactical|type|${str.toLowerCase()}`,
			about : wrap(
				`The whether an active tactical art is ${str} skill type.`
			),
			expr  : ((env) => {
				const type = Item.TYPE.asNumber(str);
				return this.arts.getActiveValues().count((art) =>{
					const number = Item.TYPE.asNumber(art.type);
					return art.isTactical() && type == number;
				});
			}),
		});

		add({
			name  : `host|type|${str.toLowerCase()}`,
			about : wrap(
				`The whether equipped item or active tactical art is ${str} skill type.`
			),
			expr  : `
				bothif arts|tactical
					then tactical|type|${str.toLowerCase()}
					else item|type|${str.toLowerCase()}
				end
			`,
		});
	}

	add({
		name  : "tactical|type",
		about : wrap(
			"The skill type of the equipped tactical art or 0 if none."
		),
		expr  : ((env) => {
			for (let each of this.arts.getActiveValues()) {
				if (each.isTactical()) return Item.TYPE.asNumber(each.type);
			}
			return 0;
		}),
	});

	add({
		name  : "item|type",
		about : wrap(
			"The skill type of the equipped item or 0 if none."
		),
		expr  : ((env) => {
			const string = this.item.template.type;
			const number = Item.TYPE.asNumber(string);
			return number;
		}),
	});

	add({
		name  : "host|type",
		about : wrap(
			"The skill type of the equipped tactical art or item or 0 if none."
		),
		expr  : `
			bothif arts|tactical
				then tactical|type
				else item|type
			end
		`,
	});

	add({
		name  : "arts|type|weapon",
		about : wrap(
			"The number of combat arts with an Axes, Swords, Lances, Brawl, ",
			"or Bows skill type."
		),
		expr  : ((env) =>
			this.arts.getActiveValues().count((art) => {
				const number = Item.TYPE.asNumber(art.type);
				return !art.isTactical() && 1 <= number && number <= 5;
			})
		)
	});

	add({
		name  : "arts|type|spell",
		about : wrap(
			"The number of combat arts with a Faith, Guile, or Reason skill type."
		),
		expr  : ((env) =>
			this.arts.getActiveValues().count((art) => {
				const number = Item.TYPE.asNumber(art.type);
				return !art.isTactical() && 6 <= number && number <= 8;
			})
		)
	});
	add({
		name  : "arts|combat",
		about : wrap(
			"Number of combat arts active.",
		),
		expr  : ((env) => {
			return Number(this.arts.getActiveValues().any(
				art => !art.tagged("tactical")
			));
		}),
	});

	add({
		name  : "arts|tactical",
		about : wrap(
			"A flag; 1 if a tactial art is active and 0 otherwise.",
		),
		expr  : ((env) => { // TODO make more efficient
			return Number(this.arts.getActiveValues().any(
				art => art.tagged("tactical")
			));
		}),
	});

	add({
		name  : "arts|active",
		about : wrap(
			"Number of arts equipped."
		),
		expr  : ((env) => {
			return this.arts.getActive().size;
		}),
	});
	
	// d8888b. .88b  d88.  d888b    d8888b.  .d8b.  .d8888. d88888b
	// 88  `8D 88'YbdP`88 88' Y8b   88  `8D d8' `8b 88'  YP 88'
	// 88   88 88  88  88 88        88oooY' 88ooo88 `8bo.   88ooooo
	// 88   88 88  88  88 88  ooo   88~~~b. 88~~~88   `Y8b. 88~~~~~
	// 88  .8D 88  88  88 88. ~8~   88   8D 88   88 db   8D 88.
	// Y8888D' YP  YP  YP  Y888P    Y8888P' YP   YP `8888Y' Y88888P

	add({
		name  : "item|attributes|mttype",
		about : wrap(
			"Which statistic this item uses to calculate Mt: str, mag, ",
			"none, or else (no effect). Taken from the first attribute ",
			"listed to have a value other than else."
		),
		expr  : ((env) => {
			let a = 0;
			for (let each of this.item.attributes.getActiveValues()) {
				a = a || Action.MTTYPE.asNumber(each.mttype);
			}
			return a;
		}),
	});

	add({
		name  : "item|template|mttype",
		about : wrap(
			"What statistic this item's might is based off of; either ",
			"unit|total|str or unit|total|mag or none. This is the ",
			"base might type variable, every other overrides it.",
		),
		expr  : ((env) => {
			return  (
				Action.MTTYPE.asNumber(this.item.template.mttype)
			);
		}),
	});

	add({
		name  : "item|custom|mttype",
		about : wrap(
			"What statistic this item's might is based off of; either ",
			"unit|total|str or unit|total|mag or none. Overrides both ",
			"item|template|mttype and item|attributes|mttype.",
		),
		expr  : ((env) => {
			return this.item.mttype;
		}),
	});

	add({
		name  : "item|total|mttype",
		about : wrap(
			"What statistic this item's might is based off of; either ",
			"unit|total|str or unit|total|mag or none.",
		),
		expr  : `
			bothif item|custom|mttype
				// manual entry overrides all others
				then item|custom|mttype
			elseif item|attributes|mttype
				// attributes override template
				then item|attributes|mttype
			else
				// fallback is template value
				then item|template|mttype
			end
		`
	});

	add({
		name  : "arts|mttype",
		about : wrap(
			"Which statistic equipped arts use to calculate Mt: str, mag, ",
			"none, or else (no effect). Taken from the first art listed ",
			"to have a value other than else."
		),
		expr  : ((env) => {
			let a = 0;
			for (let each of this.arts.getActiveValues()) {
				a = a || Action.MTTYPE.asNumber(each.mttype);
			}
			return a;
		}),
	});

	add({
		name  : "gambit|structure|mttype",
		about : wrap(
			"What statistic this gambit's might deals damage against based ",
			"on this battalion's equipped structure gambits. Training ",
			"gambits serve as the base and can be overriden by others."
		),
		expr  : ((env) => {
			let mttype = 0;

			for (let gambit of this.battalion.gambits.values()) {
				
				if (!gambit.tagged("structure")) continue;

				mttype = Action.MTTYPE.asNumber(gambit.mttype);

				/* some structure that overrides a training gambit */
				if (!gambit.name.includes("Training")) {
					return mttype;
				}
			}

			return mttype;
		}),
	});

	add({
		name  : "gambit|active|mttype",
		about : wrap(
			"What statistic the active gambit's might is targets.",
		),
		expr  : ((env) => {
			return Action.MTTYPE.asNumber(
				this.battalion.getGambit().mttype
			);
		}),

	});

	add({
		name  : "gambit|arts|mttype",
		about : wrap(
			"What statistic a metagambit's might is based off of.",
		),
		expr  : ((env) => {
			let a = 0;
			for (let each of this.arts.getActiveValues()) {
				if (!each.tagged("metagambit")) continue;
				a = a || Action.MTTYPE.asNumber(each.mttype);
			}
			return a;
		}),

	});

	add({
		name  : "gambit|total|mttype",
		about : wrap(
			"What statistic this gambit's might targets",
		),
		expr  : `
			bothif gambit|arts|mttype
				// meta gambit overrides active gambit
				then gambit|arts|mttype
			elseif gambit|active|mttype
				// active gambit overrides structure value
				then gambit|active|mttype
			elseif gambit|structure|mttype
				// structure value serves as fallback
				then gambit|structure|mttype
			else
				// fallback is not to assume N/A
				then mttype|none
			end
		`
	});

	add({
		name  : "unit|total|mttype",
		about : wrap(
			"What statistic this unit's might is based off of; either ",
			"unit|total|str or unit|total|mag or none. Defaults to ",
			"none if nothing overrides it with another option.",
		),

		expr  : `
			bothif arts|mttype
				// art overrides item value
				then arts|mttype
			elseif item|total|mttype
				// item value serves as fallback
				then item|total|mttype
			else
				// fallback is not to assume N/A
				then mttype|none
			end
		`,
	});

	for (let each of Action.MTTYPE.strings.entries()) {

		const [num, str] = each;
		
		add({
			name  : `mttype|${str}`,
			about : wrap(
				`Constant value for the ${str} mttype.`
			),
			expr  : String(num)
		});

		add({
			name  : `unit|total|mttype|${str}`,
			about : wrap(
				`Evaluates to 1 if unit|total|mttype is ${str}, and `,
				"evaluates to 0 otherwise."
			),
			expr  : `unit|total|mttype == mttype|${str}`
		});
	}

	// .d8888. d88888b  .o88b.  .d88b.  d8b   db d8888b.  .d8b.  d8888b. db    db
	// 88'  YP 88'     d8P  Y8 .8P  Y8. 888o  88 88  `8D d8' `8b 88  `8D `8b  d8'
	// `8bo.   88ooooo 8P      88    88 88V8o 88 88   88 88ooo88 88oobY'  `8bd8'
	//   `Y8b. 88~~~~~ 8b      88    88 88 V8o88 88   88 88~~~88 88`8b      88
	// db   8D 88.     Y8b  d8 `8b  d8' 88  V888 88  .8D 88   88 88 `88.    88
	// `8888Y' Y88888P  `Y88P'  `Y88P'  VP   V8P Y8888D' YP   YP 88   YD    YP


	for (let each of this.data.stats.second) {
		const name   = each;
		const second = [];

		second.push(add({
			name  : `item|custom|${name}`,
			about : wrap(
				`User provided ${name} modifier for equipped item under `,
				"Create => Inventory => Customize Statistics."
			),
			expr  : ((env) => {
				return label(env,
					`${this.item.name} base`,
					this.item.stats[name].value,
				);
			}),
		}));

		second.push(add({
			name  : `item|template|${name}`,
			about : wrap(
				`Equipped item's ${name} from the template it uses.`
			),
			expr  : ((env) => {
				return label(env,
					this.item.name,
					this.item.template.modifier(name, env),
				);
			}),
		}));

		add({
			name  : `item|noattr|${name}`,
			about : wrap(
				`Equipped item's ${name} without modifiers from attributes.`
			),
			expr  : `item|template|${name} or item|custom|${name}`,
		});

		second.push(add({
			name  : `item|attributes|${name}`,
			about : wrap(
				`Sum of equipped item's ${name} modifiers from attributes.`
			),
			expr  : ((env) => {
				let a = 0;
				for (let attr of this.item.attributes.getActive()) {

					const attribute = Attribute.get(attr);
					const modifier  = attribute.modifier(name, env);
					if (modifier == 0) continue;

					a = sum(env, a, label(env, attribute.name, modifier));
				}

				return a;
			}),
		}));

		add({
			name  : `item|total|${name}`,
			about : wrap(
				`Equipped item's total ${name} after all modifiers.`
			),
			expr  : funcsum(...second),
		});

		add({
			name  : `item|dynamic|${name}`,
			about : wrap(
				`A flag; 1 if equipped item has dynamic modifiers to ${name}, otherwise 0.`
			),
			expr  : ((env) => {

				let a = false;
				for (let attr of this.item.attributes.getActive()) {

					const attribute = Attribute.get(attr);
					const modifier  = (
						typeof attribute.modifiers[name] != "number"
					);

					a = a || modifier;
				}

				return a || (
					typeof this.item.template.modifiers[name] != "number"
				);
			}),
		});

		add({
			name  : `tactical|${name}`,
			about : wrap(
				`Active tactical art's ${name} statistic (zero if none).`
			),
			expr  : tacticfunc(name),
		});

		/* clear what we have so far */
		second.length = 0;

		add({ // TODO remove this when possible
			name  : `arts|${name}`,
			about : wrap(
				`Total ${name} from active arts.`
			),
			expr  : artfunc(name),
		});

		second.push(add({
			name  : `combatarts|${name}`,
			about : wrap(
				`Total ${name} from active combat arts.`
			),
			expr  : combatfunc(name),
		}));

		second.push(add({
			name  : `equipment|${name}`,
			about : wrap(
				`Total ${name} from equipped equipment.`
			),
			expr  : ((env) => {
				const key   = this.equipment.getActive();
				if (key == null) return 0;
				const equip = Equipment.get(key);
				return label(env, equip.name, equip.modifier(name, env));
			}),
		}));

		second.push(add({
			name  : `abilities|${name}`,
			about :
				`Total ${name} from active abilities.`
			,
			expr  : abilityfunc(name),
			// vars  : (() => Ability.getDynamics(name))

		}));

		add({
			name  : `unit|modifier|no_item|${name}`,
			about : `The sum of all ${name} modifiers excluding from items.`,
			expr  : funcsum(...second),
		});

		second.push(add({
			name  : `host|${name}`,
			about : wrap(
				`Equal to item|total|${name} if no tactical art is `,
				"active, but if one is active, equal to 0."
			),
			expr  : `
				bothif arts|tactical
					then tactical|${name}
					else item|total|${name}
				end
			`,
		}));

		add({
			name  : `unit|modifier|${name}`,
			about : `The sum of all ${name} modifiers.`,
			expr  : funcsum(...second),
		});
	}

	add({
		name  : "battalion|charm",
		about : wrap(
			"Higher of dexterity and luck; this variable gets replaced ",
			"with a Roll20 variable called \"Charm\" when variables are ",
			"enabled within macrogen. Use for battalion macros."
		),
		expr  : "[Charm] {max(unit|total|lck, unit|total|dex)}"
	});

	add({
		name  : "unit|charm",
		about : wrap(
			"Higher of dexterity and luck. Use for non-battalion macros.",
		),
		expr  : "max(unit|total|lck, unit|total|dex)"
	});

	add({
		name  : "unit|total|mt",
		about : wrap(
			"The amount of damage an attack does before it is reduced by",
			"a foe's unit|total|prot or their unit|total|resl, as ",
			"determined by unit|total|mttype",
		),
		expr  : `
			// detemine base stat to compute mt from
			floor(
				(bothif unit|total|mttype == mttype|mag
					then unit|total|mag
				elseif unit|total|mttype == mttype|str
					then unit|total|str
					else 0
				end)
					// healing (Heal, Recover) halves Mt
					* unit|multiplier|healing
			)

				// weapon triangle +3 Mt bonus
				+ bothif not(host|tagged|no_triangle)
					then (max(
						metaif builtins|macrogen
							then other|triangle|prompt
							else other|triangle
						end,
						0
					) / 5)
					else 0
				end

				// other modifiers
				+ host|mt
				+ abilities|mt
				+ combatarts|mt
				+ equipment|mt
		`,
	});

	add({
		name  : "unit|received|prot",
		about : wrap(
			"This unit's protection when it's receiving an attack. ",
			"Used in roll20 macro generation."
		),
		expr  : "unit|total|def + unit|modifier|no_item|prot",
	});

	add({
		name  : "unit|received|resl",
		about : wrap(
			"This unit's resiliance when it's receiving an attack. ",
			"Used in roll20 macro generation."
		),
		expr  : "unit|total|res + unit|modifier|no_item|resl",
	});

	add({
		name  : "unit|received|avo",
		about : wrap(
			"This unit's avoid when it's receiving an attack. ",
			"Used in roll20 macro generation."
		),
		expr  : "unit|total|lck + unit|modifier|no_item|avo",
	});

	add({
		name  : "unit|received|cravo",
		about : wrap(
			"This unit's critical avoid when it's receiving an attack. ",
			"Used in roll20 macro generation."
		),
		expr  : "unit|total|dex + unit|modifier|no_item|cravo",
	});


	add({
		name  : "unit|received|doubled",
		about : wrap(
			"This unit's threshold to be doubled when it's receiving an attack. ",
			"Used in roll20 macro generation."
		),
		expr  : "unit|total|spd + unit|modifier|no_item|doubled",
	});

	add({
		name  : "unit|damage",
		about : wrap(
			"Evaluates to unit|total|mt if unit|total|mttype is not equal ",
			"to other|base|none, which is the enum value used for when a ",
			"feature does not heal or do damage and to 0 if it is equal.",
		),
		expr  : `
			bothif unit|total|mttype == mttype|none
				then 0
				else unit|total|mt
			end
		`,
	});

	add({
		name  : "unit|total|prot",
		about : wrap(
			"Reduces incoming 'strength-based' damage before it is ",
			"applied to the unit's hit points.",
		),
		expr  : funcsum("unit|total|def", "unit|modifier|prot"),
	});

	add({
		name  : "unit|total|resl",
		about : wrap(
			"Reduces incoming 'magic-based' damage before it is ",
			"applied to the unit's hit points.",
		),
		expr  : funcsum("unit|total|res", "unit|modifier|resl"),
	});

	if (V3) {
		add({
			name  : "unit|total|crit",
			about : wrap(
				"The unit's chance to score a critical hit."
			),
			expr  : "unit|total|lck + unit|modifier|crit",
		});

		add({
			name  : "unit|total|cravo",
			about : wrap(
				"Reduces foe's chance to score a critical hit on this unit."
			),
			expr  : "unit|total|dex + unit|modifier|cravo",
		});

		add({
			name  : "unit|total|hit",
			about : wrap(
				"The unit's chance to score a hit."
			),
			expr  : `
				unit|total|dex
					+ unit|modifier|hit
					+ other|range_penalty
			`,
		});

		add({
			name  : "unit|total|avo",
			about : wrap(
				"Reduces foe's chance to score a hit on this unit."
			),
			expr  : "unit|total|lck + unit|modifier|avo",
		});
	} else {
		add({
			name  : "unit|total|crit",
			about : wrap(
				"The unit's chance to score a critical hit."
			),
			expr  : `
				(floor((unit|total|dex) / 2)
					+ unit|total|lck
					+ unit|modifier|crit)
			`,
		});

		add({
			name  : "unit|total|cravo",
			about : wrap(
				"Reduces foe's chance to score a critical hit on this unit."
			),
			expr  : "unit|total|lck + unit|modifier|cravo",
		});

		add({
			name  : "unit|total|hit",
			about : wrap(
				"The unit's chance to score a hit."
			),
			expr  : `
				(unit|total|dex
					+ unit|modifier|hit
					+ other|triangle|conditional)
			`,
		});

		add({
			name  : "unit|total|avo",
			about : wrap(
				"Reduces foe's chance to score a hit on this unit."
			),
			expr  : `
				(unit|total|spd
					+ unit|modifier|avo
					+ metaif builtins|codegen
						then other|triangle
						else 0
					end)
			`,
		});
	}

	add({
		name  : "doubling_threshold",
		about : wrap(
			"Number of points of speed one unit's speed must exceed another to double it."
		),
		expr  : `
			4
		`,
	});

	add({
		name  : "unit|total|doubles",
		about : wrap(
			"Maximum attack speed that of foes this unit can double."
		),
		expr  : `
			(unit|total|spd + unit|modifier|doubles - doubling_threshold)
		`,
	});

	add({
		name  : "unit|total|doubled",
		about : wrap(
			"Minimum attack speed that foe needs to double this unit."
		),
		expr  : `
			(unit|total|spd + unit|modifier|doubled + doubling_threshold)
		`,
	});

	add({
		name  : "unit|base|maxrng",
		about : wrap(
			"The base maximum range at which this unit can use a item ",
			"or art. This defaults to the maximum range of the item, ",
			"but if an art is used, the art's maximum range supercedes it.",
		),
		expr  : `
			bothif combatarts|maxrng
				then combatarts|maxrng
			elseif tactical|maxrng
				then tactical|maxrng
			else
				then item|total|maxrng
			end
		`
	});

	add({
		name  : "unit|total|maxrng",
		about : wrap(
			"The maximum range at which this unit can use a item or art."
		),
		expr  : `
			unit|base|maxrng
				+ abilities|maxrng
				+ equipment|maxrng
		`,
	});

	add({
		name  : "unit|base|minrng",
		about : wrap(
			"The base minimum range at which this unit can use a item ",
			"or art. This defaults to the minimum range of the item, ",
			"but if an art is used, the art's minimum range supercedes it.",
		),
		expr  : `
			bothif combatarts|minrng
				then combatarts|minrng
			elseif tactical|minrng
				then tactical|minrng
			else
				then item|total|minrng
			end
		`
	});

	add({
		name  : "unit|total|minrng",
		about : wrap(
			"The minimum range at which this unit can use a item or art."
		),
		expr  : `
			unit|base|minrng
				+ abilities|minrng
				+ equipment|minrng
		`,
	});

	add({
		name  : "unit|base|sp",
		about : wrap(
			"The base stamina points available ",
			"to this unit (i.e. from levels)."
		),
		expr  : "10 * floor(unit|level / 10) + 15",
	});

	add({
		name  : "unit|total|sp",
		about : "The total stamina points available to this unit.",
		expr  : funcsum("unit|base|sp", "unit|modifier|sp"),
	});

	add({
		name  : "unit|total|spcost",
		about : "The total cost in stamina points to use an art.",
		expr  : "unit|modifier|spcost",
	});

	add({
		name  : "unit|base|tp",
		about : wrap(
			"The base technique points available ",
			"to this unit (i.e. from skill ranks)."
		),
		expr  : ((env) => {

			const skills = this.skills;
			const grades = (
				/* for each skill */
				Array.from(skills.names)
					/* convert letter grade into number grade */
					.map((name) => Grade.toNumber(skills[name].grade))
					/* sort descending order*/
					.sort((a, b) => b - a)
			);

			let sum = 0;
			/* we only want the highest three; ignore the rest */
			for (let i = 0; i < 3; ++i) {
				/* start from the grade and sum each rank down */
				for (let j = grades[i]; j >= 0; --j) {
					sum += Grade.TPTABLE[i][j];
				}
			}

			return sum;
		}),
	});

	add({
		name  : "unit|total|tp",
		about : "The total technique points available to this unit.",
		expr  : funcsum("unit|base|tp", "unit|modifier|tp"),
	});

	add({
		name  : "unit|total|tpcost",
		about : "The total cost in technique points to use an item.",
		expr  : "unit|modifier|tpcost",
	});

	// d8888b.  .d8b.  d888888b d888888b  .d8b.  db      d888888b  .d88b.  d8b   db
	// 88  `8D d8' `8b `~~88~~' `~~88~~' d8' `8b 88        `88'   .8P  Y8. 888o  88
	// 88oooY' 88ooo88    88       88    88ooo88 88         88    88    88 88V8o 88
	// 88~~~b. 88~~~88    88       88    88~~~88 88         88    88    88 88 V8o88
	// 88   8D 88   88    88       88    88   88 88booo.   .88.   `8b  d8' 88  V888
	// Y8888P' YP   YP    YP       YP    YP   YP Y88888P Y888888P  `Y88P'  VP   V8P

	/* has to use the raw data because Gambits isn't populated yet */
	for (let each of definitions.gambits) {

		const name       = each.name;
		const identifier = Calculator.asIdentifier(name);

		if (name == "Counter") continue;

		add({
			name  : `gambit|is_active|${identifier}`,
			about : wrap(
				`Evaluates to 1 if ${name} in an active gambit, `,
				"and otherwise evaluates to 0."
			),
			expr  : ((env) => {
				return Number(this.battalion.gambits.active.has(name));
			}),
		});
	}

	add({
		name  : "gambit|is_active|Counter",
		about : wrap(
			"Evaluates to 1 if Counter in an active gambit, ",
			"and otherwise evaluates to 0."
		),
		expr  : ((env) => {
			return Number(this.battalion.getGambit().name == "Counter");
		}),
	});

	add({
		name  : "battalion|modifier|cap",
		about : wrap(
			"The total capacity cost of equipped gambits.",
		),
		expr  : gambitfunc("cap", false),
	});

	add({
		name  : "battalion|rank",
		about : wrap(
			"The numerical value of a battalion's rank."
		),
		expr  : ((env) => {
			return this.battalion.rank;
		}),
	});

	add({
		name  : "battalion|template|cap",
		about : wrap(
			"The battalion's template capcity statistic before modifiers."
		),
		expr  : ((env) => {
			return this.battalion.template.modifier("cap");
		}),
	});

	add({
		name  : "battalion|rank|cap",
		about : wrap(
			"The a battalion's capacity modifier from its rank."
		),
		expr  : ((env) => {
			return this.battalion.rank + 1;
		}),
	});

	add({
		name  : "battalion|total|cap",
		about : wrap(
			"The total number of capacity points afforded to the ",
			"equipped battalion. If none then evaluates to zero.",
		),
		expr  : funcsum(
			"battalion|template|cap",
			"battalion|rank|cap",
			"battalion|modifier|cap"
		),
	});

	add({
		name  : "battalion|level",
		about : wrap(
			"The equipped battalion's level. Used to scale its stats."
		),
		expr  : "unit|level",
	});

	for (let each of this.data.stats.battalion.first) {

		const name = each;
		const second = [];

		second.push(add({
			name  : `battalion|template|${name}`,
			about : wrap(
				`The battalion's template ${name} statistic before modifiers.`
			),
			expr  : ((env) => {
				const value = this.battalion.template.modifiers[name];
				return label(env, `template ${name}`, value);
			}),
		}));

		if (this.data.stats.battalion.growths.includes(name)) {
			add({
				name  : `battalion|level|${name}`,
				about : wrap(
					`The battalion's ${name} bonus from its level.`,
				),
				expr  : ((env) => {
					const growth = this.battalion.template.growth(name);
					const level  = this.battalion.level;
					const bonus  = Math.floor((level * growth)/100);
					return label(env, `level ${level}`, bonus);
				}),
			});

			add({
				name  : `battalion|growth|${name}`,
				about : wrap(
					`The battalion's template ${name} growth.`
				),
				expr  : ((env) => {
					return this.battalion.template.growth(name);
				}),
			});

			add({
				name  : `battalion|mult|${name}`,
				about : wrap(
					`The battalion's template ${name} growth as a real number.`
				),
				expr  : ((env) => {
					return label(env,
						`${this.battalion.name} ${name} growth`,
						this.battalion.template.growth(name) / 100
					);
				}),
			});

			second.push(add({
				name  : `battalion|long|${name}`,
				about : wrap(
					`The battalion's ${name} bonus from its level written out.`,
				),
				expr  : `
					floor(battalion|mult|${name} * Level {unit|level})
				`,
			}));
		}

		second.push(add({
			name  : `battalion|modifier|${name}`,
			about : wrap(
				`The adjutant's ${name} statistic; zero if no adjutant.`
			),
			expr  : gambitfunc(name),
		}));

		add({
			name  : `battalion|total|${name}`,
			about : wrap(
				`The battalion's base ${name} statistic before modifiers.`
			),
			expr  : funcsum(...second),
		});

		add({
			name  : `battalion|leveled|${name}`,
			about : wrap(
				`The battalion's leveled ${name} statistic before modifiers.`
			),
			expr  : (
				this.data.stats.battalion.growths.includes(name)
					? `battalion|template|${name} + battalion|long|${name}`
					: `battalion|template|${name}`
			)
		});
	}

	for (let each of this.data.stats.battalion.second) {

		const name = each;

		add({
			name  : `battalion|modifier|${name}`,
			about : wrap(
				`The battalion's ${name} modifier; zero if no adjutant.`
			),
			expr  : (
				(name == "minrng" || name == "maxrng")
					? gambitoverfunc(name)
					: gambitfunc(name)
			),
		});
	}

	add({
		name  : "battalion|total|cha",
		about : wrap(
			"The battalion's total charm statistic."
		),
		expr  : funcsum((env) => env.read("battalion|charm"), gambitfunc("cha")),
	});

	add({
		name  : "battalion|modifier|br",
		about : wrap(
			"The battalion's endurance statistic."
		),
		expr  : abilityfunc("br"),
	});

	for (let each of [
		["gmt", "might"], ["ghit", "hit"], ["gepcost", "ep cost"],
		["gminrng", "min range"], ["gmaxrng", "max range"],
		["gplu", "plurality"], ["gauto", "autonomy"]
	]) {

		const [stat, name] = each;
		const sum          = [];

		sum.push(add({
			name  : `abilities|${stat}`,
			about : wrap(
				`The battalion's gambit ${name} statistic bonuses from employer's abilities.`
			),
			expr  : abilityfunc(stat),
		}));

		sum.push(add({
			name  : `combatarts|${stat}`,
			about : wrap(
				`The battalion's gambit ${name} statistic bonuses from employer's combat arts.`
			),
			expr  : artfunc(stat),
		}));
		
		add({
			name  : `battalion|modifier|${stat}`,
			about : wrap(
				`The battalion's gambit ${name} statistic bonuses from employer.`
			),
			expr  : funcsum(...sum),
		});
	}

	add({
		name  : "battalion|total|mt",
		about : wrap(
			"The battalion's might statistic."
		),
		expr  : "battalion|total|atk + battalion|modifier|mt + battalion|modifier|gmt",
	});

	add({
		name  : "battalion|total|hit",
		about : wrap(
			"The battalion's hit statistic."
		),
		expr  : "battalion|charm + battalion|modifier|hit + battalion|modifier|ghit",
	});

	add({
		name  : "battalion|total|ep",
		about : wrap(
			"The battalion's endurance statistic."
		),
		expr  : "battalion|charm + battalion|total|end",
	});

	add({
		name  : "battalion|total|cha",
		about : wrap(
			"The battalion's charm statistic."
		),
		expr  : "battalion|charm",
	});

	add({
		name  : "battalion|total|epcost",
		about : wrap(
			"The battalion's hit statistic."
		),
		expr  : "battalion|modifier|epcost + battalion|modifier|gepcost",
	});

	add({
		name  : "battalion|total|minrng",
		about : wrap(
			"The battalion's minimum range statistic."
		),
		expr  : "battalion|modifier|minrng + battalion|modifier|gminrng",
	});

	add({
		name  : "battalion|total|maxrng",
		about : wrap(
			"The battalion's minimum range statistic."
		),
		expr  : "battalion|modifier|maxrng + battalion|modifier|gmaxrng",
	});

	add({
		name  : "battalion|total|br",
		about : wrap(
			"The battalion's barrier statistic."
		),
		expr  : (
			"battalion|modifier|br"
		),
	});

	const CONTRACT = [
		300, 400, 600, 900, 1400, 1900, 2500, 3200, 4000, 4900, 5900, 7000
	];

	add({
		name  : "battalion|total|contract",
		about : wrap(
			"The battalion's initial contract cost."
		),
		expr  : ((env) => {
			return CONTRACT[this.battalion.rank];
		}),
	});

	const uid = uniqueID();

	vardiv.append(
		element("datalist", {
			attrs   : {id: uid},
			content : varsen.sort().map(e => {
				return element("option", {
					attrs: {
						value   : e,
						onclick : () => alert(e),
					},
				});
			})
		})
	);

	this.macros._input.setAttribute("list", uid);
	this._context = ctx;

	for (let variable in this._context) {
		this.compiler.compute_dependants(variable);
	}

	return ctx;
}

return {
	createContext,
};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Variables;

}

/* exported Module */
