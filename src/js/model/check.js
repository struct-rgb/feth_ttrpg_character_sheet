/**
 * A module that implements checks
 * @module Checks
 */

/* global AttributeCell, element */

/* TODO this directive is to condense the many
 * violations that not having this here makes below
 * I probably don't want to use defintions globally,
 * but until I decide to change this, this todo will
 * remain here to remind me of the various uses below.
 */
 
/* global definitions */

const Checks = (function() {

const LEVELS = [0, 10, 20, 25, 30];

const MAP = new Map();

for (let [trait, skills] of Object.entries(definitions.traits)) {

	MAP.set(trait, new Set(skills));

	for (const skill of skills) {
		if (MAP.has(skill)) {
			MAP.get(skill).add(trait);
		} else {
			MAP.set(skill, new Set([trait]));
		}
	}
}

class Row {
	constructor(check, ui, sheet) {

		this.name  = check;
		this.ui    = ui;
		this.sheet = sheet;

		this._level    = new AttributeCell({
			edit    : false,
			shown   : 0,
			value   : 0,
			trigger : (value) => {

				let level = 0;

				for (let skill of MAP.get(this.name)) {
					const apt  = sheet.skills.rows.get(skill);
					level     += Number(apt == 1 || apt == 3);
				}
			
				return level;
			}
		});

		this._bonus = new AttributeCell({
			edit    : false,
			shown   : 0,
			value   : 0,
			trigger : (value) => {
				return LEVELS[this.level.value];
			}
		});


		this.root = element("tr", [
			element("th", name),
			this.level.root,
			this.bonus.root,
		]);
	}

	get level() {
		return this._level.value;
	}

	set level(value) {
		this._level.value = value;
	}

	get bonus() {
		return this._bonus.value;
	}

	// refresh() {
	// 	this.level.refresh();
	// 	this.bonus.refresh();
	// }
}

class UserInterface {
	constructor(checks, sheet) {
		
		this.rows  = new Map();

		const body = element("tbody",
			Object.keys(checks).map(check => {
				const row   = new Row(check, this, sheet);
				this[check] = row;
				this.rows.set(check, row);
				return row.root;
			})
		);


		this.root = element("div", element("table", body));
	}

	refresh() {
		for (let row of this.rows.values()) {
			row.refresh();
		}
	}

	clear() {
		for (let row of this.rows.values()) {
			row.value    = 0;
		}
	}

	export() {

		const object = {};

		for (let row of this.rows.values()) {
			object[row.name] = row.value;
		}

		return object;
	}

	import(object) {

		if (object == null) {
			this.clear();
			return;
		}

		for (let row of this.rows.values()) {
			row.value    = object[row.name] || 0;
		}
	}
}

return {
	UserInterface: UserInterface,
	MAP: MAP,
};

})();

/* exported Checks */