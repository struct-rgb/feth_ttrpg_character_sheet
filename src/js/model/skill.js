
/**
 * A module that implements a builder for Roll20 Macros
 * @module Skills
 */

/* global element, AttributeCell, Grade */

const Skills = (function() {

const POINTS = [
	// skill point gain past the "soft level cap"
	3,
	// skill point gain for each level up to the "soft cap"
	4, 1, 1, 1, 1, 2, 2, 2, 2, 2,
	3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
	4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
	5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];

/**
 * Row
 */
class Row {

	static ICONS = ["—", "⮝", "⮟", "⮙", "⮛"];

	static NAMES = ["None", "Talent", "Weakness", "Budding Talent", "Budding Weakness"];

	constructor(name, section, sheet, fix=null) {
		this.name      = name;
		this.section   = section;
		this.sheet     = sheet;
		this.old_value = 0;
		this.grade     = "E";
		this.triggers  = [this.name, `unit|rank|${this.name}`];

		const adoptions = {edit: !fix, shown: "—", min: 0, max: 4, select: Row.NAMES};

		this.aptcell  = new AttributeCell(adoptions, (x) => {
			this.cell.refresh();
			return Row.ICONS[x];
		});

		if (!fix)
			this.aptcell.root.firstChild.firstChild.classList.add("arrowhead");

		const options = {edit: !fix, shown: "E "};
		this.cell     = new AttributeCell(options, fix ? fix : (x) => {
			const points   = this.cell.value;
			const diff     = points - this.old_value;
			const total    = this.section._total;
			total.value    = total.value + diff;
			this.old_value = points;
			this.grade     = Grade.for(x, this.aptitude);

			/** TODO rank's not tied directly to authority so idk whty this exists */
			// if (this.name == "Authority" && this.sheet && this.sheet.battalion) {
			// 	this.sheet.battalion._rank.refresh();
			// }

			this.sheet.refresher.refresh(this.triggers);

			return this.grade;
		});

		this.root = element("tr", [element("th", name), this.aptcell.root, this.cell.root]);
	}

	get value() {
		return this.cell.value;
	}

	set value(value) {
		this.cell.value = value;
		this.refresh();
	}

	get aptitude() {
		return this.aptcell.value;
	}

	set aptitude(value) {
		this.aptcell.value = value;
		this.refresh();
	}

	refresh() {
		this.aptcell.refresh();
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
		this._total     = new AttributeCell({edit: false}, x => {

			let   have  = 0;
			let   level = sheet.runenv.read("unit|level");
			const cap   = POINTS.length - 1;

			// skill point gain stops accelerating at cap
			if (level > cap) {
				have   = POINTS[0] * (level - cap);
				level  = cap;
			}

			// sum point gain from each level
			while (level > 0) {
				have  += POINTS[level];
				level -= 1;
			}

			return `${x}/${have}`;
		});

		this._total.root.colSpan     = 2;
		this.rows   = new Map();

		sheet.refresher.register(this._total, ["Level", "unit|level"]);

		this._other = new Row("Other", this, sheet, (x) => {
			return Grade.fromNumber(
				Array.from(
					this.rows.values(),
					row => Grade.toNumber(row.grade)
				)
					.reduce((a, b) => Math.max(a, b))
			);
		});

		sheet.refresher.register(this._other.cell, definitions.skills, ["Other"]);

		const body = element("tbody",
			skills.map(skill => {
				const row = new Row(skill, this, sheet);
				this[skill] = row;
				this.rows.set(skill, row);
				return row.root;
			}).extend(this._other.root).extend(
				element("tr", [
					element("th", "Total"),
					this._total.root
				]),
			)
		);

		this.root = element("div", [
			element("table", [
				element("thead",
					element("strong", "Skills", "underline")
				),
				body
			])
		]);

		this.names = new Set(skills);
		this.sheet = sheet;

		this.context = sheet._predicates || {}; // todo make this a param
	}

	validate(expression) {
		return expression.exec(this.context);
	}

	number(skill) {
		
		if (!this.rows.has(skill))
			throw new Error(`invalid skill name ${skill}`);
		
		const row = this.rows.get(skill);

		return Grade.toNumber(Grade.for(row.value, row.aptitude));
	}

	grade(skill) {

		if (!this.rows.has(skill))
			throw new Error(`invalid skill name ${skill}`);
		
		const row = this.rows.get(skill);

		return Grade.for(row.value, row.aptitude);
	}

	refresh() {
		for (let row of this.rows.values()) {
			row.refresh();
		}
	}

	clear() {
		for (let row of this.rows.values()) {
			row.value    = 0;
			row.aptitude = 0;
		}
	}

	export() {

		const object = {};

		for (let row of this.rows.values()) {
			object[row.name] = {
				value    : row.value,
				aptitude : Grade.APTITUDE.asString(row.aptitude)
			};
		}

		return object;
	}

	import(object) {

		if (object == null) {
			this.clear();
			return;
		}

		for (let row of this.rows.values()) {
			row.value    = object[row.name].value || 0;
			row.aptitude = Grade.APTITUDE.asNumber(object[row.name].aptitude);
		}
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
