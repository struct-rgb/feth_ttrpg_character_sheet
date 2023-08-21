
/**
 * A module that implements a builder for Roll20 Macros
 * @module Skills
 */

/* global element */
/* global AttributeCell */

/* global Grade */

const Skills = (function() {

/**
 * Row
 */
class Row {

	static ICONS = ["—", "⮝", "⮟", "⮙", "⮛"];

	constructor(name, section, sheet) {
		this.name      = name;
		this.section   = section;
		this.sheet     = sheet;
		this.old_value = 0;
		this.grade     = "E";

		const adoptions = {edit: true, shown: "—", min: 0, max: 4};

		this.aptcell  = new AttributeCell(adoptions, (x) => {
			this.cell.refresh();
			return Row.ICONS[x];
		});

		this.aptcell.root.firstChild.firstChild.classList.add("arrowhead");

		const options = {edit: true, shown: "E "};
		this.cell     = new AttributeCell(options, (x) => {

			const points   = this.cell.value;
			const diff     = points - this.old_value;
			const total    = this.section._total;
			total.value    = total.value + diff;
			this.old_value = points;
			this.grade     = Grade.for(x, this.aptitude);

			/** TODO ugly way to refresh tp */
			if (this.sheet && this.sheet.stats) {
				this.sheet.stats.refreshSecondary(); 
			}

			/** TODO ugly way to refresh battalion stuff */
			if (this.name == "Authority" && this.sheet && this.sheet.battalion) {
				this.sheet.battalion._rank.refresh();
			}

			this.sheet.character.reclass();

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
		// this.cell.refresh();
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
		this._total = new AttributeCell({edit: false}, x => x);
		this._total.root.colSpan = 2;
		this.rows   = new Map();

		const body = element("tbody", 
			skills.map(skill => {
				const row = new Row(skill, this, sheet);
				this[skill] = row;
				this.rows.set(skill, row);
				return row.root;
			}).extend(
				element("tr", [
					element("th", "Total"),
					this._total.root
				])
			)
		);

		// const foot = element("tfoot", );

		this.root = element("div", element("table", body));

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
