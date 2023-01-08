
/**
 * A module that implements a builder for Roll20 Macros
 * @module Skills
 */

/* global element */
/* global tooltip */
/* global wrap */
/* global uniqueLabel */
/* global AttributeCell */

/* global Grade */



const Skills = (function() {

/**
 * Row
 */
class Row {

	constructor(name, section, sheet) {
		this.name      = name;
		this.section   = section;
		this.sheet     = sheet;
		this.old_value = 0;
		this.grade     = "E";

		const options = {edit: true, shown: "E "};
		this.cell     = new AttributeCell(options, (x) => {

			const points   = this.cell.value;
			const diff     = points - this.old_value;
			const total    = this.section._total;
			total.value    = total.value + diff;
			this.old_value = points;
			this.grade     = Grade.for(x, this.name, this.section);

			/** TODO ugly way to refresh tp */
			if (this.sheet && this.sheet.stats) {
				this.sheet.stats.refreshSecondary(); 
			}
			this.sheet.character.reclass();

			return this.grade;
		});

		this.root = element("tr", {
			attrs   : {
				/** TODO this is used to hide brawling, remove for patch #5 */
				id: `skill-${name}-row`
			},
			content : [
				element("th", name), this.cell.root
			]
		});
	}

	get value() {
		return this.cell.value;
	}

	set value(value) {
		this.cell.value = value;
		this.refresh();
	}

	refresh() {
		this.cell.refresh();
	}
}

class Select {

	constructor(name, description, skills, section) {
		this.name       = name;
		this.identifier = name.toLowerCase();

		this.select     = element("select", {
			class : ["simple-border"],
			attrs : {
				oninput: (() => section.refresh()),
			},
		});

		for (let skill of skills) {
			const option       = document.createElement("option");
			option.value       = skill;
			option.textContent = skill;
			this.select.appendChild(option);
		}

		this.root = element("div", [
			tooltip([
				uniqueLabel(name, this.select), element("br"),
				this.select,
			], description),
		]);
	}
}

/**
 * @memberof UserInterface
 */
class SkillUserInterface {

	/**
	 * Initialize the skill section
	 * @param {Array} skills - names of skills to add
	 */
	constructor(skills, sheet) {
		const tbody = document.createElement("tbody");
		const table = document.createElement("table");
		this._total = new AttributeCell({edit: false}, x => x);
		this.root   = document.createElement("div");
		this.rows   = [];

		table.appendChild(tbody);
		this.root.appendChild(table);

		for (let skill of skills) {
			const row = new Row(skill, this, sheet);
			this[skill] = row;
			this.rows.push(row);
			tbody.appendChild(row.root);
		}

		const tr       = document.createElement("tr");
		const th       = document.createElement("th");
		th.textContent = "Total";
		tr.appendChild(th);

		tr.appendChild(this._total.root);
		tbody.appendChild(tr);

		this.names = new Set(skills);

		const pairs = [
			[
				"Talent",
				wrap(
					"Double the number of skill points before ",
					"calculating Rank.",
				)
			],
			[
				"Weakness",
				wrap(
					"Halve the number of skill points before ",
					"calculating Rank.",
				)
			],
			[
				"Budding",
				wrap(
					"With 32 skill points or more (25 or more if this ",
					"skill is a Weakness), treat this skill as a Talent.",
				)
			],
		];

		for (let [aptitude, description] of pairs) {
			
			const selector = new Select(
				aptitude, description, skills, this, sheet
			);
			
			this.root.appendChild(selector.root);

			Object.defineProperty(this, aptitude.toLowerCase(), {
				
				get: function () {
					return selector.select.value;
				},

				set: function (value) {
					if (!this.names.has(value)) {
						throw Error(`'${value}' is an invalid skill name`);
					}
					selector.select.value = value; 
				}

			});
		}

		this.sheet = sheet;

		this.context = {
			
			"All": ((op, ...args) => args.reduce((x, y) => ({
				require: x.require || y.require,
				succeed: false,
				boolean: (
					(x.boolean || (y.succeed && !x.require))
						&&
					(y.boolean || (x.succeed && !y.require))
				),
			}))),

			"Any": ((op, ...args) => args.reduce((x, y) => ({
				require: x.require || y.require,
				succeed: x.succeed || y.succeed,
				boolean: x.boolean || y.boolean,
			}))),

			"Required": ((op, x) => {
				x.require = true;
				return x;
			}),

			"Permission": ((op, text) => ({
				require: false,
				succeed: false,
				boolean: true,
				// boolean: confirm(text),
			})),

			"None": ((op) => ({
				require: false,
				succeed: false,
				boolean: true
			})),

			"Level": ((op, level) => ({
				require: false,
				succeed: false,
				boolean: this.sheet.stats.level >= level
			})),

		};

		for (let each of skills) {
			const skill = each;
			this.context[skill] = ((name, grade) => {
				const diff = (
					Grade.toNumber(this[skill].grade)
						-
					Grade.toNumber(grade)
				);

				return {
					require: false,
					succeed: diff >= 1,
					boolean: diff >= 0,
				};
			});
		}
	}

	validate(expression) {
		// return Polish.execute(expression, this.context);
		return expression.exec(this.context);
	}

	refresh() {
		for (let row of this.rows) {
			row.refresh();
		}
	}

	clear() {
		for (let row of this.rows) {
			row.value = 0;
		}

		this.talent   = "Axes";
		this.weakness = "Axes";
		this.budding  = "Axes";
	}

	import(object) {

		if (object == null) {
			this.clear();
			return;
		}

		this.talent   = object.talent;
		this.weakness = object.weakness;
		this.budding  = object.budding;

		for (let row of this.rows) {
			row.value = object.ranks[row.name] || 0;
		}
	}

	export() {
		return {
			talent   : this.talent,
			weakness : this.weakness,
			budding  : this.budding,
			ranks    : this.rows.reduce(
				(o, row) => (o[row.name] = row.value, o),
				{}
			),
		};
	}

	get total() {
		return Number(this._total.value);
	}
}

return {
	UserInterface: SkillUserInterface,
};

})();

/* exported Skills */
