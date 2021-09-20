
"use strict";

var definitions;

var sheet = {

	"name": "",

	"description": "",

	"class": "Commoner",

	"weapon": "Iron Sword",

	"homeland": "The Adrestian Empire",

	"hitpoints": 0,

	"triangle": 0,

	"mounted": false,

	"level": 0,

	"growths": {
		"hp": 0,
		"str": 0,
		"mag": 0,
		"dex": 0,
		"spd": 0,
		"def": 0,
		"res": 0,
		"cha": 0
	},

	"statistics": {
		"hp": 0,
		"str": 0,
		"mag": 0,
		"dex": 0,
		"spd": 0,
		"def": 0,
		"res": 0,
		"cha": 0
	},

	"skills": {
		"Axes": 0,
		"Swords": 0,
		"Lances": 0,
		"Brawl": 0,
		"Archery": 0,
		"Reason": 0,
		"Faith": 0,
		"Guile": 0,
		"Armor": 0,
		"Riding": 0,
		"Flying": 0
	},

	"abilities": {
		"active": new Set(),
		"equipped": new Set(),
		"battlefield": new Set(),
		"known": new Set()
	},

	"combatarts": {
		"active": null,
		"equipped": new Set(),
		"known": new Set()
	},

	"weapons": {
		"active": null,
		"known": new Set()
	},

	"equipment": {
		"active": null,
		"known": new Set()
	}
};

const computed = {
	"statistics": {},
	"growths": {}
};

function generate_summary() {

	const summary = [];

	for (let statistic of definitions.statistics.abbr) {
		summary.push(
			statistic.toUpperCase(),
			": ",
			computed.statistics[statistic],
			"\n",
		);
	}

	summary.push(
		"\n",
		sheet.weapon.name, "\n",
		Weapon.might(), " Mt ",
		sheet.weapon.hit, " Hit ",
	);

	if (sheet.weapon.crit > 0) {
		summary.push(sheet.weapon.crit, " Crit");
	}

	for (let ability of sheet.class.abilities) {
		const description = Ability.by_name[ability].description;
		summary.push(ability, ": ", description, "\n");
	}

	for (let ability of sheet.abilities.equipped) {
		const description = Ability.by_name[ability].description;
		summary.push(ability, ": ", description, "\n");
	}

	const text = summary.join("");

	console.log(text);
	alert(text);
}

function generate_macro() {

	const reduction_statistic =
		sheet.weapon.pmt > sheet.weapon.mmt
			? "DEF"
			: "RES";

	const text =
		  sheet.name + " attacks using their " + sheet.weapon.name + "\n"
		+ "To hit [[ceil(1d100-@{" + sheet.name + "|Skl_i}-?{Support Rank?|NS,0|None,3|C,5|B,7|A,10|S,15}-?{Ability Bonus?|0}-?{Equipment Bonus?|0}+?{Weapon Triangle?|Neutral,0|Positive,-15|Negative,15})]]\n"
		+ "Hit is less than [[" + sheet.weapon.hit + "+@{" + sheet.name + "|Skl_i}]] minus target's AVO\n"
		+ "Damage is [[" + Weapon.might() + "+@{" + sheet.name + "|Mag_i}]] minus target's " + reduction_statistic + "\n"
		+ "Reduces enemy to-hit by [[@{" + sheet.name + "|Spd_i}]]\n"
		+ "To Crit: [[1d100]]\n"
		+ "Crit is on [[floor(@{" + sheet.name + "|Skl_i}/2+?{Critical Ability Bonus?|0}+" + sheet.weapon.crit + ")]] or lower.";

	console.log(text);
	alert(text);
}

function level_up() {

	// statistics that increased from this level up
	const increases  = new Set();
	const stat_names = definitions.statistics.abbr.filter(
		name => name != "mov"
	);

	// for each stat, if roll succeeds increase statistics
	for (let name of stat_names) {
		if (Math.random() * 100 <= computed.growths[name]) {
			increases.add(name);
		}
	}

	// if onle of fewer statistics increased during level up,
	// then prompt user for stat to increase with popup
	if (increases.size <= 1) {

		let   choosen     = null;
		const prompt_text = (
			"Enter one of: " + stat_names.join(" ")
		);

		while (!stat_names.includes(choosen)) {

			choosen = prompt(prompt_text);

			if (choosen === null) {
				break;
			} else {
				choosen = choosen.toLowerCase();
			}
		}

		if (choosen !== null) {
			increases.clear();
			increases.add(choosen);
		}
	}

	// show user summary of levelup
	alert("Increases: " + Array.from(increases).join(" "));

	// update and refresh the sheet
	for (let name of increases) {
		const input = document.getElementById(name + "-base");
		input.value = Number(input.value) + 1;
	}

	const level_input = document.getElementById("level-input");
	level_input.value = Number(level_input.value) + 100;

	refresh_statistics();
	refresh_computed_statistics();
	refresh_level();
}

var skill_grades = ["E", "E+", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "S", "S+"];
var grade_levels = [  0,    1,   2,    4,   8,   12,  18,   25,  32,   40,  50, 60];

function grade_for_points(skill_points) {
	let grade = "S+";
	for (let i = 0; i < grade_levels.length; ++i) {
		if (grade_levels[i] > skill_points) {
			grade = skill_grades[i - 1];
			break;
		}
	}
	return grade;
}

function add_lookup(object, source, destination, key) {
	const table = {};
	for (let element of source) {
		table[element[key]] = element;
	}
	object[destination] = table;
}

function refresh_name() {
	sheet.name = document.getElementById("character-name").value;
	return sheet.name;
}

function refresh_mounted() {
	const check = document.getElementById("character-mounted");

	if (!("mount" in sheet.class)) {
		check.checked = false;
		sheet.mounted = false;
	} else {
		sheet.mounted = check.checked;
		refresh_statistics();
		refresh_computed_statistics();
	}
	return check;
}

function refresh_description() {
	sheet.description = document.getElementById("character-description").value;
	return sheet.description;
}

function refresh_grade(skill_name) {
	let base   = "skill-" + skill_name;
	let points = Number(document.getElementById(base).value);
	let grade  = grade_for_points(points);

	sheet.skills[skill_name] = points;

	document.getElementById(base + "-grade").textContent = grade;
	return grade;
}

function refresh_grades() {
	definitions.skills.forEach(refresh_grade);
}

function refresh_growth(statistic) {

	// TODO figure out a way to replace this with a set
	if (!definitions.statistics.abbr.includes(statistic)) {
		console.log("Tried to refresh invalid growth \"" + statistic + "\"");
		return;
	}

	if (statistic == "mov") return; // TODO fix input validation

	const display = document.getElementById(statistic + "-growth-total");
	const base    = Number(document.getElementById(statistic + "-growth-base").value);
	
	sheet.growths[statistic]    = base;

	const growth = Math.max(
		base + Number(sheet.class.growths[statistic]),
		0,
	);

	computed.growths[statistic] = growth;
	display.textContent         = growth + "%";
	return growth;
}

function unimplemented() {
	console.log("THIS FUNCTION IS UNIMLEMENTED");
}

function inherit_singleton(proto, obj) {
	obj.by_name = {};
	Object.setPrototypeOf(obj, proto);
	return Object.freeze(obj);
}

const Feature = {

	kind: "NO KIND",

	is_active: function (item) {
		return sheet[this.kind].active !== null;
	},

	toggle_active: unimplemented,

	toggler: function (item) {
		const singleton = this;
		return function () { 
			singleton.toggle_active(item);
		};
	},

	unequipper: function (item, category) {
		const singleton = this;
		category = category || "equipped"; // TODO find a way to remove
		return function () {
			singleton.forget(item, category);
			const checkbox = document.getElementById(
				item.name + "-known-checkbox"
			);
			checkbox.checked = false;
		};
	},

	equip_toggler: function (item, category) {
		const singleton = this;
		category = category || "equipped"; // TODO find a way to remove
		return function () {
			if (sheet[singleton.kind][category].has(item.name)) {
				singleton.forget(item, category);
			} else {
				sheet[singleton.kind][category].add(item.name);

				const parent = document.getElementById(
					singleton.kind + "-" + category
				);

				singleton.add(
					parent,
					category,
					item,
					singleton.toggler(item),
					singleton.unequipper(item, category)
				);
			}
		};
	},

	toggler_chooser: function (item, category) {
		return category == "known"
			? this.equip_toggler(item)
			: this.toggler(item);
	},

	import_features: function (char, category, toggle_factory, remove_factory, equip) {
		
		// remove currently present elements from details
		parent = document.getElementById(this.kind + "-" + category);
		remove_children(parent);

		// if the format is old/bad, just skill this process
		if (!(this.kind in char)) return;

		for (let name of char[this.kind][category]) {
			const item = this.by_name[name];
			this.add(
				parent,
				category,
				item,
				this[toggle_factory](item, category),
				this[remove_factory](item, category),
			);

			if (equip) {
				const equip = document.getElementById(name + "-known-checkbox");
    			equip.checked = true;
			}
		}
	},

	set_lookup_by_name: function (definitions) {

		for (let key in this.by_name) {
			delete this.by_name[key];
		}

		for (let element of definitions[this.kind]) {
			this.by_name[element.name] = element;
		}
	},

	add_entry: function (parent, identifier, title, description, check_fn, remove_fn) {
		const dt = document.createElement("dt");
		dt.id    = identifier + "-dt";

		// add checkbox to apply any modifers/multipliers
		const checkbox   = document.createElement("input");
		checkbox.id      = identifier + "-checkbox";
		checkbox.type    = "checkbox";
		checkbox.onclick = check_fn;
		dt.appendChild(checkbox);

		// add entry title content
		dt.appendChild(document.createTextNode(title))

		// if remove function is not, make a "remove" button
		if (remove_fn != null) {
			const remove_button   = document.createElement("input");
			remove_button.value   = "✗";
			remove_button.type    = "button";
			remove_button.onclick = remove_fn;
			dt.appendChild(remove_button);
		}

		// add entry content description
		const dd = document.createElement("dd");
		dd.id    = identifier + "-dd";
		dd.appendChild(document.createTextNode(description));

		// add elements to parent
		parent.appendChild(dt);
		parent.appendChild(dd);
	},

	learn: function (category) {

		const id   = "learn-" + this.kind + "-select-" + category;
		const item = this.by_name[document.getElementById(id).value];

		if (sheet[this.kind][category].has(item.name)) return;
		sheet[this.kind][category].add(item.name);

		const parent = document.getElementById(this.kind + "-" + category);

		this.add(
			parent,
			category,
			item,
			this.toggler_chooser(item, category),
			this.forgetter(item, category)
		);
	},

	forget: function (item, category) {

		if (this.is_active(item)) {
			this.toggle_active(item);
		}

		if (category == "known" && sheet[this.kind].equipped.has(item.name)) {
			this.forget(item, "equipped");
		}

		sheet[this.kind][category].delete(item.name);

		for (let suffix of ["-dt", "-dd"]) {
			const id      = item.name + "-" + category + suffix;
			const element = document.getElementById(id);
			element.parentNode.removeChild(element);
		}
	},

	forgetter: function (item, category) {
		let singleton = this;
		return function () {
			singleton.forget(item, category);
		}
	}
};

const Ability = inherit_singleton(Feature, {

	kind: "abilities",

	is_active: function (item) {
		return sheet.abilities.active.has(item);
	},

	toggle_active: function (item) { // TODO this bugs out if battlefield and known
		if (this.is_active(item)) {
			sheet.abilities.active.delete(item);
		} else {
			sheet.abilities.active.add(item);
		}

		refresh_statistics();
		refresh_computed_statistics();
	},

	add: function (parent, category, ability, check_fn, remove_fn) {
		const identifier  = ability.name + "-" + category;
		const title       = " " + ability.name + " (" + ability.activation + ") ";
		const description = ability.description;
		this.add_entry(parent, identifier, title, description, check_fn, remove_fn);
	},

});

const StatedFeature = inherit_singleton(Feature, {

	mod: function (field) {
		if (sheet[this.kind].active) {
			const item = this.by_name[sheet[this.kind].active];
			return field in item ? item[field] : 0;
		}
		return 0;
	},

	is_magic: function () {
		if (sheet[this.kind].active) {
			const item = this.by_name[sheet[this.kind].active];
			return item.mmt >= item.pmt;
		}
		return false;
	},

	might: function () {
		if (sheet[this.kind].active) {
			const weapon = this.by_name[sheet[this.kind].active];
			return Math.max(item.mmt, item.pmt);
		}
		return 0;
	},

	toggle_active: function (item) {

		const sets = sheet[this.kind];

		if (this.is_active(item)) {

			if (sets.active != item.name) {
				const checkbox = document.getElementById(
					sets.active + "-" + this.active_tab + "-checkbox"
				);
				checkbox.checked = false;

				sets.active = item.name;
			} else {
				sets.active = null;
			}
		} else {
			sets.active = item.name;
		}

		refresh_statistics();
		refresh_computed_statistics();
	},

});

const CombatArt = inherit_singleton(StatedFeature, {

	kind: "combatarts",

	active_tab: "equipped",

	add: function (parent, category, art, check_fn, remove_fn) {
		const identifier  = art.name + "-" + category;
		const title       = " " + art.name + " (Rank " + art.rank + " " + art.type + " Art) ";
		const might       = Math.max(art.pmt, art.mmt);
		const description = (
			  (might    ? "Might: " + might + ", "   : "")
			+ (art.hit  ? "Hit: " + art.hit + ", "   : "")
			+ (art.avo  ? "Avo: " + art.avo + ", "   : "")
			+ (art.crit ? "Crit: " + art.crit + ", " : "")
			+ (art.cost ? "Cost: " + art.cost + ", " : "")
			+ "Range: " + (art.minrng == art.maxrng ? art.minrng : art.minrng + "-" + art.maxrng) + "\n"
			+ art.description
		);
		this.add_entry(parent, identifier, title, description, check_fn, remove_fn);
	}
});

const Weapon = inherit_singleton(StatedFeature, {

	kind: "weapons",

	active_tab: "known",

	toggler_chooser: function (item, category) {
		return this.toggler(item);
	},

	add: function (parent, category, weapon, check_fn, remove_fn) {
		const identifier  = weapon.name + "-" + category;
		const title       = " " + weapon.name + " (Rank " + weapon.rank + " " + weapon.type + ") ";
		const might       = Math.max(weapon.pmt, weapon.mmt);
		const description = (
			  (might       ? "Might: " + might + ", "      : "")
			+ (weapon.hit  ? "Hit: " + weapon.hit + ", "   : "")
			+ (weapon.avo  ? "Avo: " + weapon.avo + ", "   : "")
			+ (weapon.crit ? "Crit: " + weapon.crit + ", " : "")
			+ "Range: " + (weapon.minrng == weapon.maxrng ? weapon.minrng : weapon.minrng + "-" + weapon.maxrng) + "\n"
			+ weapon.description
		);
		this.add_entry(parent, identifier, title, description, check_fn, remove_fn);
	},

	forget: function (item, category) {

		if (this.is_active()) {
			this.toggle_active(item);
		}

		sheet[this.kind][category].delete(item.name);

		for (let suffix of ["-dt", "-dd"]) {
			const id      = item.name + "-" + category + suffix;
			const element = document.getElementById(id);
			element.parentNode.removeChild(element);
		}
	}
});

const Equipment = inherit_singleton(Weapon, {

	kind: "equipment",

	active_tab: "known",

	add: function (parent, category, equipment, check_fn, remove_fn) {
		const identifier  = equipment.name + "-" + category;
		const title       = " " + equipment.name + " (" + equipment.type + ") ";
		const description = equipment.description;
		this.add_entry(parent, identifier, title, description, check_fn, remove_fn);
	}

});

function refresh_hitpoints() {
	const display = document.getElementById("hitpoints");
	const input   = document.getElementById("hitpoints-input");

	if (Number(input.value) > computed.statistics.hp) {
		input.value = computed.statistics.hp;
	}

	display.value   = input.value;
	sheet.hitpoints = Number(input.value); 
	return sheet.hitpoints;
}

function fill_hitpoints() {
	const display = document.getElementById("hitpoints");
	const input   = document.getElementById("hitpoints-input");
	input.value   = computed.statistics.hp;
	display.value = computed.statistics.hp;
}

function refresh_level() {
	const display = document.getElementById("level");
	const input   = document.getElementById("level-input");
	sheet.level   = Number(input.value);
	display.textContent = 1 + Math.floor(input.value / 100);
}

function remove_children(parent) {

	let removed = 0;
	while (parent.lastChild) {
		parent.removeChild(parent.lastChild);
		++removed;
	}

	return removed;
}

function refresh_class() {

	sheet.class = definitions.class_by_name[
		document.getElementById("character-class").value
	];

	// account for whether the character is mounted before stat calcs
	const mounted = document.getElementById("character-mounted");
	mounted.checked = "mount" in sheet.class;

	definitions.statistics.abbr.forEach(function(statistic) {
		refresh_statistic(statistic);
		refresh_growth(statistic);
	});

	const abilities = document.getElementById("abilities-class");

	remove_children(abilities);
	for (let name of sheet.class.abilities) {
		const ability = Ability.by_name[name];
		Ability.add(abilities, "class", ability, Ability.toggler(ability));
	}

	return sheet.class;
}

function modifier(statistic) {
	let sum = 0;
	for (let ability of sheet.abilities.active) {
		if ("modifiers" in ability && statistic in ability.modifiers) {
			sum += ability.modifiers[statistic];
		}
	}
	return sum;
}

function multiplier(statistic) {
	let product = 1;
	for (let ability of sheet.abilities.active) {
		if ("multipliers" in ability && statistic in ability.multipliers) {
			product *= ability.multipliers[statistic];
		}
	}
	return product;
}

function computed_statistic(base, weapon) {
	switch (weapon) {
		case "pdr":
		case "mdr":
		return Math.max(
			(computed.statistics[base]
				+ modifier(weapon)
				+ Equipment.mod(weapon))
				* multiplier(weapon),
			0,
		);

		case "hit":
		case "avo":
		return Math.max( 
			(computed.statistics[base]
				+ Weapon.mod(weapon)
				+ CombatArt.mod(weapon)
				+ Equipment.mod(weapon)
				+ modifier(weapon))
					* multiplier(weapon)
				+  sheet.triangle,
				// + (sheet.triangle > 0 ? sheet.triangle : 0),
			0,
		);

		case "pmt": {
			const scale     = CombatArt.mod("scale");
			const hitpoints = document.getElementById("hitpoints");
			return Math.max(
				Math.floor(
					(computed.statistics.str
						+ (CombatArt.is_magic()
							? 0
							: Weapon.mod(weapon) + CombatArt.mod(weapon))
						+ (CombatArt.mod("scale")
							? Math.floor(computed.statistics[scale] * 0.3)
							: 0)
						+ (CombatArt.mod("vengeance")
							? Math.floor(
								(-hitpoints.value + computed.statistics.hp) / 2)
							: 0)
						+ Equipment.mod(weapon)
						+ modifier(weapon))
					* multiplier(weapon)
					* (CombatArt.mod("astra") ? 0.3 : 1.0)),
				0,
			);
		}

		case "mmt": {
			const scale = CombatArt.mod("scale");
			return Math.max(
				Math.floor(
					((computed.statistics.mag
						* (Weapon.mod("healing") ? 0.5 : 1))
						+ (CombatArt.is_magic()
							? Math.max(Weapon.mod("pmt"), Weapon.mod("mmt"))
							: Weapon.mod(weapon))
						+ (Weapon.is_magic()
							? Math.max(CombatArt.mod("pmt"), CombatArt.mod("mmt"))
							: CombatArt.mod(weapon))
						+ (CombatArt.mod("scale")
							? Math.floor(computed.statistics[scale] * 0.3)
							: 0)
						+ Equipment.mod(weapon)
						+ modifier(weapon))
					* multiplier(weapon)),
				0,
			);
		}

		case "maxrng":
		case "minrng":
		return (
			((CombatArt.mod(weapon) ? CombatArt.mod(weapon) : Weapon.mod(weapon))
				+ Equipment.mod(weapon)
				+ modifier(weapon))
			* multiplier(weapon)
		);

		default:
		console.log("Invalid weapon for computed statistic");
		return;
	}
}

function refresh_computed_statistics() {
	for (let pair of definitions.statistics.linked) {
		const [base, mod]        = pair;
		const value              = computed_statistic(base, mod);
		computed.statistics[mod] = value;
		document.getElementById(mod + "-total").textContent = value;
	}
	
	const crit = Math.floor(
		(
			  computed.statistics["dex"] / 2
			+ Weapon.mod("crit")
			+ CombatArt.mod("crit")
			+ modifier("crit")
		) * multiplier("crit")
	);

	document.getElementById("crit-total").textContent    = crit;

	document.getElementById("rng-min-total").textContent = computed_statistic(
		null, "minrng"
	);

	document.getElementById("rng-max-total").textContent = computed_statistic(
		null, "maxrng"
	);
}

function refresh_statistic(statistic) {

	// TODO figure out a way to replace this with a set
	if (!definitions.statistics.abbr.includes(statistic)) {
		console.log("Tried to refresh invalid statistic \"" + statistic + "\"");
		return;
	}

	const display = document.getElementById(statistic + "-total");
	const base    = Number(document.getElementById(statistic + "-base").value);
	const value   = Math.max(
		(
			  (statistic == "mov" ? 4 : 0)
			+ ( // TODO better validation for this
				sheet.mounted && statistic in sheet.class.mount.modifiers
					? sheet.class.mount.modifiers[statistic]
					: 0
			)
			+ sheet.class.modifiers[statistic]
			+ Equipment.mod(statistic)
			+ modifier(statistic)
			+ base
		) * multiplier(statistic),
		0,
	);


	sheet.statistics[statistic]    = base;
	computed.statistics[statistic] = value;
	display.textContent            = value;

	if (statistic == "hp") {
		const display   = document.getElementById("hitpoints");
		display.max     = computed.statistics.hp;
		display.optimum = computed.statistics.hp;
		display.high    = Math.floor(computed.statistics.hp / 2);
		display.low     = Math.floor(computed.statistics.hp / 4) + 1;
		refresh_hitpoints();
	}

	refresh_computed_statistics();
	return value;
}

function refresh_statistics() {
	definitions.statistics.abbr.forEach(refresh_statistic);
}

function refresh_triangle() {
	sheet.triangle = Number(
		document.getElementById("character-triangle").value
	);

	refresh_computed_statistics();
	return sheet.triangle;
}

// function refresh_weapon() {
// 	sheet.weapon = Weapon.by_name[
// 		document.getElementById("character-weapon").value
// 	];

// 	refresh_computed_statistics();
// 	return sheet.weapon;
// }

function refresh_homeland() {
	sheet.homeland = document.getElementById("character-homeland").value;
	return sheet.homeland;
}

function refresh_sheet() {
	refresh_class();
	refresh_statistics();
	refresh_hitpoints();
	refresh_grades();
	refresh_level();
	// refresh_weapon();
	refresh_name();
	refresh_description();
	refresh_mounted();
	refresh_homeland();
}

function export_sheet() {
    const a    = document.createElement("a");
    const char = JSON.parse(
    	JSON.stringify(sheet) // dirty way to make a copy
    );

    char.class  = char.class.name;
    // char.weapon = char.weapon.name;

    // these are trouble to persist so ignore them
    delete char.mounted;
    delete char.abilities.active;
    delete char.triangle;
    delete char.combatarts.active;
    delete char.weapons.active;
    delete char.equipment.active;

    for (let kind of ["abilities", "combatarts", "weapons", "equipment"]) {
    	for (let key in char[kind]) {
    		char[kind][key] = Array.from(sheet[kind][key]);
    	}
    }
    
    const file = new Blob([JSON.stringify(char, null, 4)], {type: "application/json"});
    a.href     = URL.createObjectURL(file);
    a.download = sheet.name.replace(/ /g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
}

function import_sheet(e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (e) {
		const char = JSON.parse(e.target.result);

		if ("weapon" in char) {
			delete char.weapon;
		}

		// minor bookeeping and intialization of data structures
		char.mounted = false;

		for (let key in char.abilities) {
    		char.abilities[key] = new Set(char.abilities[key]);
    	}
    	char.abilities.active = new Set();

    	char.class    = definitions.class_by_name[char.class];
    	char.weapon   = Weapon.by_name[char.weapon];
    	char.triangle = 0;

    	// backwards compatibility
    	if ("combatarts" in char) {
    		char.combatarts = {
	    		active: null,
	    		equipped: new Set(char.combatarts.equipped),
	    		known: new Set(char.combatarts.known),
	    	}
    	} else {
	    	char.combatarts =  {
	    		active: null,
	    		equipped: new Set(),
	    		known: new Set(),
	    	}
	    }

	    // backwards compatibility
	  	if ("weapons" in char) {
    		char.weapons = {
	    		active: null,
	    		known: new Set(char.weapons.known),
	    	}
    	} else {
	    	char.weapons =  {
	    		active: null,
	    		known: new Set(),
	    	}
	    }

	    // backwards compatibility
	  	if ("equipment" in char) {
    		char.equipment = {
	    		active: null,
	    		known: new Set(char.equipment.known),
	    	}
    	} else {
	    	char.equipment =  {
	    		active: null,
	    		known: new Set(),
	    	}
	    }

    	// fill the statistics boxes
    	for (let statistic of definitions.statistics.abbr) {
    		document.getElementById(statistic + "-base").value =
    			char.statistics[statistic];

    		if (statistic == "mov") continue;
    		document.getElementById(statistic + "-growth-base").value =
    			char.growths[statistic];
    	}

    	// fill the skills boxes
    	for (let skill of definitions.skills) {
    		document.getElementById("skill-" + skill).value =
    			char.skills[skill];
    	}

    	
    	// fill the "character and backstory" section entries
    	document.getElementById("character-name").value        = char.name;
    	document.getElementById("character-homeland").value    = char.homeland;
    	// document.getElementById("character-weapon").value      = char.weapon.name;
    	document.getElementById("character-class").value       = char.class.name;
    	document.getElementById("character-description").value = char.description;
    	document.getElementById("hitpoints-input").value       = char.hitpoints;
    	document.getElementById("level-input").value           = char.level;

    	// fill the known abilities
    	Ability.import_features(
    		char,
    		"known",
    		"equip_toggler",
    		"forgetter"
    	);

    	// fill the battlefield abilities
    	Ability.import_features(
    		char,
    		"battlefield",
    		"toggler",
    		"forgetter",
    	);

    	// fill the equipped abilities
    	Ability.import_features(
    		char,
    		"equipped",
    		"toggler",
    		"unequipper",
    		true
    	);

    	// fill the known combat arts
    	CombatArt.import_features(
    		char,
    		"known",
    		"equip_toggler",
    		"forgetter"
    	)

    	// fill the equipped combat arts
    	CombatArt.import_features(
    		char,
    		"equipped",
    		"toggler",
    		"unequipper",
    		true
    	)

    	// fill the weapons and spells
    	Weapon.import_features(
    		char,
    		"known",
    		"toggler",
    		"forgetter"
    	);

    	// fill the equiptment
    	Equipment.import_features(
    		char,
    		"known",
    		"toggler",
    		"forgetter"
    	);

    	sheet = char;
    	refresh_sheet();
	}
	reader.readAsText(file);
}

function clear_sheet() {

}