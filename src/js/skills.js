
class SkillsRow {

	constructor(name, section) {
		this.name      = name;
		this.root      = document.createElement("tr");
		this.section   = section;

		/* this is used to hide brawling */
		this.root.id   = `skill-${name}-row`;

		this.old_value = 0;

		const th       = document.createElement("th");
		th.textContent = name;
		this.root.appendChild(th);

		const options = {style: "datum", shown: "E "};
		this.cell     = new AttributeCell(options, (x) => {

			const points   = this.cell.value;
			const diff     = points - this.old_value;
			const total    = this.section._total;
			total.value    = total.value + diff;
			this.old_value = points;

			return Grade.for(x, this.name, this.section);
		});

		this.root.appendChild(this.cell.root);
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

class SkillsSelect {

	constructor(name, skills, section) {
		this.name           = name;
		this.root           = document.createElement("div");
		this.identifier     = name.toLowerCase()

		this.select         = document.createElement("select");
		const inputID       = uniqueID(this.select);

		this.select.id      = inputID;
		this.select.oninput = (() => {section.refresh()});
		this.select.classList.add("simple-border");

		const label         = document.createElement("label");
		label.htmlFor       = inputID;
		label.textContent   = this.name;

		for (let skill of skills) {
			const option       = document.createElement("option");
			option.value       = skill;
			option.textContent = skill;
			this.select.appendChild(option);
		}

		this.root.appendChild(label);
		this.root.append(this.select);
	}
}

class Skills {

	/**
	 * Initialize the skill section
	 * @param {Array} skills - names of skills to add
	 */
	constructor(skills) {
		const tbody = document.createElement("tbody");
		const table = document.createElement("table");
		this._total = new AttributeCell({style: "computed"}, x => x);
		this.root   = document.createElement("div");
		this.rows   = [];

		table.appendChild(tbody);
		this.root.appendChild(table);

		for (let skill of skills) {
			const row = new SkillsRow(skill, this);
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

		this.valid_names = new Set(skills);

		for (let aptitude of ["Talent", "Weakness", "Budding"]) {
			
			const selector = new SkillsSelect(aptitude, skills, this);
			this.root.appendChild(selector.root);

			Object.defineProperty(this, aptitude.toLowerCase(), {
				
				get: function () {
					return selector.select.value;
				},

				set: function (value) {
					if (!this.valid_names.has(value)) {
						throw Error(`'${value}' is an invalid skill name`);
					}
					selector.select.value = value; 
				}

			});
		}
	}

	refresh() {
		for (let row of this.rows) {
			row.refresh()
		}
	}

	clear() {
		for (let row of this.rows) {
			row.value = 0;
		}
	}

	import(object) {

		if (object == null) {
			this.clear()
			return;
		}

		for (let row of this.rows) {
			row.value = object[row.name] || 0;
		}
	}

	export() {
		const object = {};
		for (let row of this.rows) {
			object[row.name] = row.value;
		}
		return object;
	}

	get total() {
		return Number(this._total.value);
	}
}

