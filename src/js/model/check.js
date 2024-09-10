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

function rank(sheet, name) {

	let level = 0;

	for (let skill of MAP.get(name)) {
		const apt  = sheet.skills.rows.get(skill).aptitude;
		level     += Number(apt == 1 || apt == 3);
	}

	return level;
}


function bonus(sheet, name) {
	return LEVELS[rank(sheet, name)];
}

class Row {
	constructor(check, ui, sheet) {

		this.name  = check;
		this.ui    = ui;
		this.sheet = sheet;

		this._rank    = new AttributeCell({
			edit    : false,
			shown   : 0,
			value   : 0,
			trigger : (value) => {
				return rank(this.sheet, this.name);
			}
		});

		this._bonus = new AttributeCell({
			edit    : false,
			shown   : "0%",
			value   : 0,
			before  : "(",
			after   : ")",
			trigger : (value) => {
				return `${bonus(this.sheet, this.name)}%`;
			}
		});


		this.root = element("tr", [
			element("th", this.name),
			this._rank.root,
			this._bonus.root,
		]);
	}

	get level() {
		return this._rank.value;
	}

	set level(value) {
		this._rank.value = value;
	}

	get bonus() {
		return this._bonus.value;
	}

	refresh() {
		this._rank.refresh();
		this._bonus.refresh();
	}
}

class UserInterface {
	constructor(checks, sheet) {
		
		this.rows  = new Map();

		const body = element("tbody",
			Object.keys(checks).map(check => {
				const row   = new Row(check, this, sheet);
				this[check] = row;
				this.rows.set(check, row);

				sheet.refresher.register(row, definitions.traits[check].map(
					name => `unit|rank|${name}`
				));
				return row.root;
			})
		);


		this.root = element("div",
			element("table", [
				element("thead",
					element("strong", "Traits", "underline")
				),
				body
			])
		);
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
	MAP: MAP, bonus, rank
};

})();


class Experience {

	constructor(experiences, phrase="New Experience", bonus=0) {

		this.uid         = uniqueID();
		this.experiences = experiences;

		this.experiences.records.set(this.uid, this);

		this._phrase = element("input", {
			class: ["simple-border"],
			attrs: {
				value : phrase,
				type  : "text"
			}
		});

		this._bonus  = element("input", {
			class: ["simple-border", "experience"],
			attrs: {
				value : bonus,
				type  : "number",
				step  : 5,
				min   : 0,
				max   : 100,
			}
		});

		this._delete = element("button", {
			class   : ["simple-border", "smol"],
			content : "Delete",
			attrs   : {
				onclick : (() => this.remove())
			}
		});

		this.root = element("tr",
			element("td", [this._bonus, this._phrase, this._delete])
		);
	}

	get phrase() {
		return this._phrase.value;
	}


	set phrase(value) {
		this._phrase.value = value;
	}

	get bonus() {
		return this._bonus.value;
	}

	set bonus(value) {
		this._bonus.value = value;
	}

	remove() {
		this.experiences.records.delete(this.uid);
		this.root.remove();
	}

}

class Experiences {

	constructor() {

		this.records = new Map();

		this._button = element("input",  {
			class   : ["simple-border"],
			attrs   : {
				value   : "Add New Experience",
				type    : "button",
				onclick : () => this.add(),
			},
		});


		this._table = element("table");

		this.root = element("div", [
			this._button,
			this._table,
		]);
	}

	add(phrase="New Experience", bonus=0) {
		const row = new Experience(this, phrase, bonus);
		this._table.appendChild(row.root);
	}


	clear() {
		for (let record of this.records.values()) {
			record.remove();
		}
	}

	import(experiences) {
		this.clear();

		for (let record of experiences) {
			this.add(...record);
		}
	}

	export() {

		const experiences = [];

		for (let record of this.records.values()) {
			experiences.push([record.phrase, record.bonus]);
		}

		return experiences;
	}

}

/* exported Checks */