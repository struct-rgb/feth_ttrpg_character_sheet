
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
	}
};

var computed = {
	"statistics": {},
	"growths": {}
};

function ability_toggler(ability) {
	return function () { // TODO this bugs out if battlefield and known
		if (sheet.abilities.active.has(ability)) {
			sheet.abilities.active.delete(ability);
		} else {
			sheet.abilities.active.add(ability);
		}

		refresh_statistics();
		refresh_computed_statistics();
	}
}

function equip_remover(ability) {
	return function () {forget_ability("equipped", ability);
		const checkbox   = document.getElementById(
			ability.name + "-known-checkbox"
		);
		checkbox.checked = false;
	}
}

function equip_toggler(ability) {
	return function () {
		if (sheet.abilities.equipped.has(ability.name)) {
			forget_ability("equipped", ability);
		} else {
			sheet.abilities.equipped.add(ability.name);

			const parent = document.getElementById("abilities-equipped");
			add_ability(
				parent,
				"equipped",
				ability,
				ability_toggler(ability),
				equip_remover(ability)
			);
		}
	}
}

function level_up() {
	let increases  = 0;
	let max_name   = "hp";
	let max_growth = 0;
	for (let statistic of definitions.statistics.abbr) {

		if (statistic == "move") continue;
		const growth = computed.growths[statistic];
		
		if (growth > max_growth) {
			max_name   = statistic;
			max_growth = growth;
		}

		if (Math.random() <= growth) {
			increases   += 1;
			const input =  document.getElementById(statistic + "-base");
			input.value =  Number(input.value) + 1;
		}
	}

	if (increases == 0) {
		const input =  document.getElementById(max_name + "-base");
		input.value =  Number(input.value) + 1;
	}

	const level_input = document.getElementById("level-input");
	level_input.value = Number(level_input.value) + 100;

	refresh_statistics();
	refresh_computed_statistics();
	refresh_level();
}

var skill_grades = ["E", "E+", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "S", "S+"];
var grade_levels = [  0,   8,   16,   24,  32,   40,  48,   56,  64,   72,  80,   88];

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
	for (let element of object[source]) {
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

function add_ability(parent, category, ability, check_fn, remove_fn) {
	const dt = document.createElement("dt");
	dt.id    = ability.name + "-" + category + "-dt";

	// add checkbox to apply modifers/multipliers
	const checkbox   = document.createElement("input");
	checkbox.id      = ability.name + "-" + category + "-checkbox";
	checkbox.type    = "checkbox";
	checkbox.onclick = check_fn;
	dt.appendChild(checkbox);

	// add ability title content
	dt.appendChild(
		document.createTextNode(" " + ability.name + " (" + ability.activation + ") ")
	)

	// if remove function is not, make a "remove" button
	if (remove_fn != null) {
		const remove_button   = document.createElement("input");
		remove_button.value   = "✗";
		remove_button.type    = "button";
		remove_button.onclick = remove_fn;
		dt.appendChild(remove_button);
	}

	// add ability content description
	const dd = document.createElement("dd");
	dd.id    = ability.name + "-" + category + "-dd";
	dd.appendChild(document.createTextNode(ability.description));

	// add elements to parent
	parent.appendChild(dt);
	parent.appendChild(dd);
}

function learn_ability(category) {

	const ability = definitions.ability_by_name[
		document.getElementById("learn-ability-select-" + category).value
	];

	if (sheet.abilities[category].has(ability.name)) return;
	sheet.abilities[category].add(ability.name);

	const parent = document.getElementById("abilities-" + category);
	const toggle = category == "known" ? equip_toggler(ability) : ability_toggler(ability);
	add_ability(
		parent,
		category,
		ability,
		toggle,
		ability_forgetter(category, ability)
	);
}

function ability_forgetter(category, ability) {
	return function () {
		forget_ability(category, ability);
	}
}

function forget_ability(category, ability) {

	if (sheet.abilities.active.has(ability)) {
		sheet.abilities.active.delete(ability);
		refresh_statistics();
		refresh_computed_statistics();
	}

	if (category == "known" && sheet.abilities.equipped.has(ability.name)) {
		forget_ability("equipped", ability);
	}

	sheet.abilities[category].delete(ability.name);

	for (let suffix of ["-dt", "-dd"]) {
		const id      = ability.name + "-" + category + suffix;
		const element = document.getElementById(id);
		element.parentNode.removeChild(element);
	}
}

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
		const ability = definitions.ability_by_name[name];
		add_ability(abilities, "class", ability, ability_toggler(ability));
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
			computed.statistics[base] + modifier(weapon) * multiplier(weapon),
			0,
		);

		case "avo":
		return Math.max(
			computed.statistics[base]
				+ (modifier(weapon) * multiplier(weapon))
				+ (sheet.triangle > 0 ? sheet.triangle : 0),
			0,
		);

		case "hit":
		return Math.max( 
			computed.statistics[base]
				+ (sheet.weapon[weapon] + modifier(weapon)) 
					* multiplier(weapon)
				+ (sheet.triangle < 0 ? sheet.triangle : 0),
			0,
		);

		case "pmt":
		case "mmt":
		return Math.max(
			computed.statistics[base]
				+ (sheet.weapon[weapon] + modifier(weapon))
					* multiplier(weapon),
			0,
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
			  computed.statistics["dex"] / 3
			+ sheet.weapon["crit"]
			+ modifier("crit")
		) * multiplier("crit")
	);

	document.getElementById("crit-total").textContent    = crit; 
	document.getElementById("rng-min-total").textContent = sheet.weapon.min;
	document.getElementById("rng-max-total").textContent = 
		sheet.weapon.max + modifier("range");
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

function refresh_weapon() {
	sheet.weapon = definitions.weapon_by_name[
		document.getElementById("character-weapon").value
	];

	refresh_computed_statistics();
	return sheet.weapon;
}

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
	refresh_weapon();
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

    char.class            = char.class.name;
    char.weapon           = char.weapon.name;

    // these are trouble to persist so ignore them
    delete char.mounted;
    delete char.abilities.active;
    delete char.triangle;

    for (let key in char.abilities) {
    	char.abilities[key] = Array.from(sheet.abilities[key]);
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

		// minor bookeeping and intialization of data structures
		char.mounted = false;

		for (let key in char.abilities) {
    		char.abilities[key] = new Set(char.abilities[key]);
    	}
    	char.abilities.active = new Set();

    	char.class    = definitions.class_by_name[char.class];
    	char.weapon   = definitions.weapon_by_name[char.weapon];
    	char.triangle = 0;

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
    	document.getElementById("character-weapon").value      = char.weapon.name;
    	document.getElementById("character-class").value       = char.class.name;
    	document.getElementById("character-description").value = char.description;
    	document.getElementById("hitpoints-input").value       = char.hitpoints;
    	document.getElementById("level-input").value           = char.level;

    	// parent element
    	let parent;

    	// fill the known abilities
    	parent = document.getElementById("abilities-known");
    	remove_children(parent);
    	for (let name of char.abilities.known) {
    		const ability = definitions.ability_by_name[name]; 
    		add_ability(
    			parent,
    			"known",
    			ability,
    			equip_toggler(ability),
    			ability_forgetter("known", ability)
    		);
    	}

    	// fill the battlefield abilities
    	parent = document.getElementById("abilities-battlefield");
    	remove_children(parent);
    	for (let name of char.abilities.battlefield) {
    		const ability = definitions.ability_by_name[name]; 
    		add_ability(
    			parent,
    			"battlefield",
    			ability,
    			ability_toggler(ability),
    			ability_forgetter("battlefield", ability)
    		);
    	}

    	// fill the equipped abilities
    	parent = document.getElementById("abilities-equipped");
    	remove_children(parent);
    	for (let name of char.abilities.equipped) {
    		const ability = definitions.ability_by_name[name]; 
    		add_ability(
    			parent,
    			"equipped",
    			ability,
    			equip_toggler(ability),
    			equip_remover(ability)
    		);

    		const equip = document.getElementById(name + "-known-checkbox");
    		equip.checked = true;
    	}

    	sheet = char;
    	refresh_sheet();
	}
	reader.readAsText(file);
}