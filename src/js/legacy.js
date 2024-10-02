
/* global
	Version,
	uniqueID
*/

/* global Class */
/* global Characters */
/* global
	Ability, Art, Item
*/

/* global CampaignConfiguration */

const Legacy = (function() {

function batch_from_4_3_0(old) {

	for (let each of old.elements) {
		each.active = (old.active == each.id);
	}

	delete old.active;

	return old;
}

function batch_from_4_2_0(old) {

	const fresh = {
		version  : "4.3.0",
		active   : old.active,
		elements : []
	};

	for (let each in old.elements) {
		fresh.elements.push({
			id    : each,
			group : "",
			data  : old.elements[each],
		});
	}

	return fresh;
}

function batch_item_from_4_2_0(old) {
	
	old = batch_from_4_2_0(old);

	for (let each of old.elements) {
		each.group = each.data.inventory ? "inventory" : "convoy";
	}

	return old;
}

function batchOfItems(obj, to=Version.CURRENT) {
	
	if (obj.version === undefined) {
		obj.version = "4.2.0";
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("4.3.0")) {
		obj = batch_item_from_4_2_0(obj);
	}

	if (version.older("4.4.0")) {
		obj = batch_from_4_3_0(obj);
	}

	obj.version = Version.CURRENT.toString();

	return obj;

}

function batch_character_from_4_2_0(old) {

	old = batch_from_4_2_0(old);

	return old;
}

function batchOfCharacters(obj, to=Version.CURRENT) {
	
	if (obj.version === undefined) {
		obj.version = "4.2.0";
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("4.3.0")) {
		obj = batch_character_from_4_2_0(obj);
	}

	if (version.older("4.4.0")) {
		obj = batch_from_4_3_0(obj);
	}

	obj.version = Version.CURRENT.toString();

	return obj;
}

function batch_battalion_from_4_2_0(old) {
	
	old = batch_from_4_2_0(old);

	return old;
}

function batchOfBattalions(obj, to=Version.CURRENT) {
	
	if (obj.version === undefined) {
		obj.version = "4.2.0";
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("4.3.0")) {
		obj = batch_battalion_from_4_2_0(obj);
	}

	if (version.older("4.4.0")) {
		obj = batch_from_4_3_0(obj);
	}

	obj.version = Version.CURRENT.toString();

	return obj;
}

function rename(state, map) {

	if (!state) return;

	if (!map) throw Error("Can't rename without map!");

	if (typeof state == "string") {
		return map.get(state) || state;
	} else {
		for (let element of state) {
			if (map.has(element.id)) {
				element.id = map.get(element.id);
			}
		}
	}
}

function character_from_4_3_0(old) {

	old.experiences = old.experiences ?? [];

	for (const each of old.equipment.added) {

		if (!Item.has(each.id)) continue;

		old.items.elements.push( {
			"id": uniqueID(),
			"group": "inventory",
			"data": {
				"version": "4.3.0",
				"name": each.id,
				"rank": 0,
				"mttype": 0,
				"price": 0,
				"template": each.id,
				"attributes": [],
				"modifiers": {
					"mt": 0,
					"prot": 0,
					"resl": 0,
					"hit": 0,
					"avo": 0,
					"crit": 0,
					"cravo": 0,
					"sp": 0,
					"tp": 0,
					"spcost": 0,
					"tpcost": 0,
					"minrng": 0,
					"maxrng": 0,
					"doubles": 0,
					"doubled": 0
				},
				"description": "",
				"replace": false,
				"tags": []
			},
			"active": each.id == old.equipment.active,
		});
	}

	old.version = "4.4.0";

	return old;
}

function character_from_4_2_0(old) {

	for (let item of old.equipment.added) {
		item.group = "";
	}

	for (let item of old.arts) {

		const art = Art.get(item.name);

		if (art.isConsideredInnate()) {
			item.group = "innate";
			continue;
		}

		if (item.group == "") {
			item.group = "equip";
			continue;
		}
	}

	for (let item of old.abilities) {

		const ability = Ability.get(item.name);
	
		if (ability.isConsideredInnate()) {
			item.group = "innate";
		}
	}

	const items = old.items.elements;

	for (let key in items)
		items[key] = item_from_4_2_0(items[key]);

	const lvls  = old.statistics.levelups;

	// if the sheet has an old levelups set of data and that set
	// of data is empty, then just delete it because there isn't
	// any historical data that has value to preserve
	if (lvls && !(lvls.levels.length > 0 || lvls.bases.any(n => n)))
		delete old.statistics.levelups;

	old.version = "4.3.0";

	return old;
}

function character_from_4_0_0(old) {

	old.skills.Morph = {
		"value": 0,
		"aptitude": "Normal"
	};

	old.version = "4.1.0";

	return old;
}

function character_from_3_7_0(old) {

	old.class = rename(old.class, new Map([
		[ "Witch Hunter" , "Hunter" ],
	]));

	rename(old.abilities, new Map([
		[ "Tomebreaker+"     , "Tomebreaker"    ],
		[ "Fistbreaker+"     , "Fistbreaker"    ],
		[ "Bowbreaker+"      , "Bowbreaker"     ],
		[ "Axebreaker+"      ,  "Axebreaker"    ],
		[ "Swordbreaker+"    , "Swordbreaker"   ],
		[ "Lancebreaker+"    , "Lancebreaker"   ],
		[ "Sword Prowess 1"  , "Sword Prowess"  ],
		[ "Sword Prowess 2"  , "Sword Prowess"  ],
		[ "Sword Prowess 3"  , "Sword Prowess"  ],
		[ "Sword Prowess 4"  , "Sword Prowess"  ],
		[ "Sword Prowess 5"  , "Sword Prowess"  ],
		[ "Axe Prowess 1"    , "Axe Prowess"    ],
		[ "Axe Prowess 2"    , "Axe Prowess"    ],
		[ "Axe Prowess 3"    , "Axe Prowess"    ],
		[ "Axe Prowess 4"    , "Axe Prowess"    ],
		[ "Axe Prowess 5"    , "Axe Prowess"    ],
		[ "Lance Prowess 1"  , "Lance Prowess"  ],
		[ "Lance Prowess 2"  , "Lance Prowess"  ],
		[ "Lance Prowess 3"  , "Lance Prowess"  ],
		[ "Lance Prowess 4"  , "Lance Prowess"  ],
		[ "Lance Prowess 5"  , "Lance Prowess"  ],
		[ "Brawl Prowess 1"  , "Brawl Prowess"  ],
		[ "Brawl Prowess 2"  , "Brawl Prowess"  ],
		[ "Brawl Prowess 3"  , "Brawl Prowess"  ],
		[ "Brawl Prowess 4"  , "Brawl Prowess"  ],
		[ "Brawl Prowess 5"  , "Brawl Prowess"  ],
		[ "Guile Prowess 1"  , "Guile Prowess"  ],
		[ "Guile Prowess 2"  , "Guile Prowess"  ],
		[ "Guile Prowess 3"  , "Guile Prowess"  ],
		[ "Guile Prowess 4"  , "Guile Prowess"  ],
		[ "Guile Prowess 5"  , "Guile Prowess"  ],
		[ "Faith Prowess 1"  , "Faith Prowess"  ],
		[ "Faith Prowess 2"  , "Faith Prowess"  ],
		[ "Faith Prowess 3"  , "Faith Prowess"  ],
		[ "Faith Prowess 4"  , "Faith Prowess"  ],
		[ "Faith Prowess 5"  , "Faith Prowess"  ],
		[ "Reason Prowess 1" , "Reason Prowess" ],
		[ "Reason Prowess 2" , "Reason Prowess" ],
		[ "Reason Prowess 3" , "Reason Prowess" ],
		[ "Reason Prowess 4" , "Reason Prowess" ],
		[ "Reason Prowess 5" , "Reason Prowess" ],
		[ "Bow Prowess 1"    , "Bow Prowess"    ],
		[ "Bow Prowess 2"    , "Bow Prowess"    ],
		[ "Bow Prowess 3"    , "Bow Prowess"    ],
		[ "Bow Prowess 4"    , "Bow Prowess"    ],
		[ "Bow Prowess 5"    , "Bow Prowess"    ],
		[ "Authority 1"      , "Authority"      ],
		[ "Authority 2"      , "Authority"      ],
		[ "Authority 3"      , "Authority"      ],
		[ "Authority 4"      , "Authority"      ],
		[ "Authority 5"      , "Authority"      ],
		[ "Omniprowess 1"    , "Omniprowess"    ],
		[ "Omniprowess 2"    , "Omniprowess"    ],
		[ "Omniprowess 3"    , "Omniprowess"    ],
		[ "Omniprowess 4"    , "Omniprowess"    ],
		[ "Omniprowess 5"    , "Omniprowess"    ],

	]));

	old.version = "3.8.0";

	return old;
}

const CLASSES_FROM_3_5_0 = new Map([
	[ "Apothacary"         , "Apothecary"   ],
	[ "Swordmaster"        , "Swordsmaster" ],
	[ "War Cleric/Priest"  , "War Priest"   ],
	[ "Summoner/Invoker"   , "Summoner"     ],
	[ "Gremory/Guru"       , "Gremory"      ],
	[ "Crow Knight"        , "Raven Knight" ],
	[ "Knight Captain"     , "General"      ],
]);

function character_from_3_5_0(old) {

	rename(old.abilities, new Map([
		["Lead by Example", "Lead by Example 1"]
	]));

	rename(old.abilities, new Map([
		["Lead by Example", "Lead by Example 1"]
	]));

	old.class = rename(old.class, CLASSES_FROM_3_5_0);
	
	const forecast = old.statistics.pointbuy.forecast;

	forecast.class = rename(forecast.class, CLASSES_FROM_3_5_0);

	for (let level of forecast.levels)
		level[0] = rename(level[0], CLASSES_FROM_3_5_0);

	old.version = "3.6.0";

	return old;
}

function MToM_v3_3_0(state, group="") {
	return state.added.map(element => {
		return {
			id     : element,
			group  : group,
			active : state.active.includes(element),
		};
	});
}

function SToM_v3_3_0(state, group="") {
	return state.added.map(element => {
		return {
			id     : element,
			group  : group,
			active : element == state.active,
		};
	});
}

function WToI_v3_3_0(text) {
	return text.replace("@{weapon:", "@{item:");
}

function character_from_3_2_0(old) {

	if (old.clart_active === null) {
		old.clart_active = [];
	}

	if (old.arts.equipped.active === null) {
		old.arts.equipped.active = [];
	}

	/* We're going to delibrately skip class features. */
	old.abilities = MToM_v3_3_0(old.abilities.equipped, "equip");
	
	/* Same with these, skip the class ones. */
	old.arts      = SToM_v3_3_0(old.arts.equipped, "equip");
	
	/* We also have to get all of these! */
	const weapons = old.weapons.elements;
	
	for (let key in weapons)
		weapons[key] = item_from_3_2_0(weapons[key]);

	old.items = old.weapons;
	delete old.weapons;

	const battalions = old.battalions.elements;
	
	for (let key in battalions)
		battalions[key] = battalion_from_3_2_0(battalions[key]);

	old.equipment = old.equipment.known;

	if (old.class == "Lord") old.class = "Banneret";

	old.version = "3.3.0";

	return old;
}

const OLD_CLASSES = new Set([
	"Apothacary", "Swordmaster", "War Cleric/Priest", "Summoner/Invoker",
	"Gremory/Guru", "Crow Knight", "Knight Captain", "Witch Hunter"
]);

function character_from_2_3_2(old) {

	let o = old.statistics;

	o.bases.lck = o.bases.cha;
	delete o.bases.cha;

	o.growths.lck = o.growths.cha;
	delete o.growths.cha;

	if (!("battalions" in old)) {
		old.battalions = {
			active: null,
			elements: {},
		};
	}

	let   group  = [null, 1];
	const levels = [];

	for (let level of o.levelups.levels) {

		const roll = level.rolls[level.index];
		console.log(roll);

		if (!(Class.has(roll[0]) || OLD_CLASSES.has(roll[0])))
			continue;

		if (group[0] === null) {
			group[0] = roll[0];
			continue;
		}

		if (group[0] == roll[0]) {
			group[1] += 1;
		} else {
			levels.push(group);
			group = [roll[0], 1];
		}
	}
	levels.push(group);

	// account for fact old format did not take level 1 into account
	if (levels[0]) levels[0][1] += 1;

	o.pointbuy = {
		"name"  : "",
		"bases" : {
			"hp"  : o.levelups.bases[0] || o.bases.hp,
			"str" : o.levelups.bases[1] || o.bases.str,
			"mag" : o.levelups.bases[2] || o.bases.mag,
			"dex" : o.levelups.bases[3] || o.bases.dex,
			"spd" : o.levelups.bases[4] || o.bases.spd,
			"def" : o.levelups.bases[5] || o.bases.def,
			"res" : o.levelups.bases[6] || o.bases.res,
			"lck" : o.levelups.bases[7] || o.bases.lck,
			"mov" : 0
		},
		"growths" : {
			"hp"  : Math.min(Math.max(o.growths.hp, 0), 40),
			"str" : Math.min(Math.max(o.growths.str, 0), 40),
			"mag" : Math.min(Math.max(o.growths.mag, 0), 40),
			"dex" : Math.min(Math.max(o.growths.dex, 0), 40),
			"spd" : Math.min(Math.max(o.growths.spd, 0), 40),
			"def" : Math.min(Math.max(o.growths.def, 0), 40),
			"res" : Math.min(Math.max(o.growths.res, 0), 40),
			"lck" : Math.min(Math.max(o.growths.lck, 0), 40),
		},
		"forecast": {
			"class": old.class,
			"levels": levels,
		},
		"comment": "",
		"tags": [],
		"hidden": false
	};

	old.version = "2.4.0";

	return old;
}

function character_from_2_2_0(old) {

	let o = old.skills;

	old.skills = {
		Axes      : {value: o.ranks.Axes      , aptitude: 0},
		Swords    : {value: o.ranks.Swords    , aptitude: 0},
		Lances    : {value: o.ranks.Lances    , aptitude: 0},
		Brawl     : {value: o.ranks.Brawl     , aptitude: 0},
		Bows      : {value: o.ranks.Bows      , aptitude: 0},
		Reason    : {value: o.ranks.Reason    , aptitude: 0},
		Faith     : {value: o.ranks.Faith     , aptitude: 0},
		Guile     : {value: o.ranks.Guile     , aptitude: 0},
		Authority : {value: o.ranks.Authority , aptitude: 0},
		Armor     : {value: o.ranks.Armor     , aptitude: 0},
		Riding    : {value: o.ranks.Riding    , aptitude: 0},
		Flying    : {value: o.ranks.Flying    , aptitude: 0},
	};

	old.skills[o.talent].aptitude   = "Talent";
	old.skills[o.weakness].aptitude = "Weakness";
	old.skills[o.budding].aptitude  = (
		old.skills[o.budding].aptitude == "Weakness"
			? "BuddingWeakness"
			: "Budding"
	);

	old.version = "2.3.0";

	return old;
}

function character_from_1_18_0(old) {

	let o = undefined;

	return {
		version     : Version.CURRENT.toString(), // only most current
		name        : old.name        || Characters.DEFAULT,
		description : old.description || Characters.DESCRIPTION,
		money       : old.money       || 0,
		class       : Class.has(old.class) ? old.class : "None",
		statistics  : {
			level: (
				// used to store experience points rather than level
				old.experience
					? Math.floor(old.experience / 100) + 1
					: 1
			),
			levelups: {
				bases  : [0, 0, 0, 0, 0, 0, 0, 0],
				levels : [],
			},
			bases: old.statistics || {
				hp  : 0,
				str : 0,
				mag : 0,
				dex : 0,
				spd : 0,
				def : 0,
				res : 0,
				cha : 0,
				mov : 0,
			},
			growths: old.growths || {
				hp  : 0,
				str : 0,
				mag : 0,
				dex : 0,
				spd : 0,
				def : 0,
				res : 0,
				cha : 0,
			},
		},
		skills      : {
			talent   : old.talent   || "Axes",
			weakness : old.weakness || "Axes",
			budding  : old.budding  || "Axes",
			ranks    : {
				// Archery was changed to "Bows"
				Axes      : ((o = old.skills) && o.Axes    ) || 0,
				Swords    : ((o = old.skills) && o.Swords  ) || 0,
				Lances    : ((o = old.skills) && o.Lances  ) || 0,
				Brawl     : ((o = old.skills) && o.Brawl   ) || 0,
				Bows      : ((o = old.skills) && o.Archery ) || 0,
				Reason    : ((o = old.skills) && o.Reason  ) || 0,
				Faith     : ((o = old.skills) && o.Faith   ) || 0,
				Guile     : ((o = old.skills) && o.Guile   ) || 0,
				Authority : 0,
				Armor     : ((o = old.skills) && o.Armor   ) || 0,
				Riding    : ((o = old.skills) && o.Riding  ) || 0,
				Flying    : ((o = old.skills) && o.Flying  ) || 0,
			}
		},

		// not even going to try with this one
		class_active: [],

		// this has no equivalent
		class_arts: [],

		// nor will I try with this one
		weapons: {
			active: null,
			elements: {},
		},

		// nor this one
		abilities: {
			equipped: {
				added: [],
				active: []
			},
			known: {
				added: [],
				active: []
			}
		},

		// also not this one
		arts: {
			equipped: {
				added: [],
				active: null
			}
		},

		// also also not this one
		equipment: {
			known: {
				added: [],
				active: null
			}
		}
	};
}

function character(obj, to=Version.CURRENT) {

	if (obj.version === undefined) {
		throw new TypeError (
			"undefined version is not supported"
		);
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("2.0.0")) {
		obj = character_from_1_18_0(obj);
	}

	if (version.older("2.3.0")) {
		obj = character_from_2_2_0(obj);
	}

	if (version.older("3.0.0")) {
		obj = character_from_2_3_2(obj);
	}

	if (version.older("3.3.0")) {
		obj = character_from_3_2_0(obj);
	}

	if (version.older("3.6.0")) {
		obj = character_from_3_5_0(obj);
	}

	if (version.older("4.0.0")) {
		obj = character_from_3_7_0(obj);
	}

	if (version.older("4.1.0")) {
		obj = character_from_4_0_0(obj);
	}

	if (version.older("4.3.0")) {
		obj = character_from_4_2_0(obj);
	}

	if (version.older("4.4.0")) {
		obj = character_from_4_3_0(obj);
	}

	// prevents double processing of the data
	obj.version = Version.CURRENT.toString();

	return obj;
}

function item_from_3_2_0(old) {
	old.attributes  = MToM_v3_3_0(old.attributes);
	old.description = WToI_v3_3_0(old.description);
	old.version     = "3.3.0";
	return old;
}

function item_from_4_2_0(old) {

	// this will we wiped by not being exported
	// delete old.inventory;

	for (let attribute of old.attributes) {
		attribute.group = "";
	}
	
	old.version = "4.2.0";

	return old;
}

function item(obj, to=Version.CURRENT) {

	if (obj.version === undefined) {
		throw new TypeError (
			"undefined version is not supported"
		);
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("3.3.0")) {
		obj = item_from_3_2_0(obj);
	}

	if (version.older("4.3.0")) {
		obj = item_from_4_2_0(obj);
	}

	return obj;
}

function battalion_from_3_2_0(old) {
	old.gambits     = MToM_v3_3_0(old.gambits);
	old.description = WToI_v3_3_0(old.description);
	old.version     = "3.3.0";
	return old;
}

function battalion(obj, to=Version.CURRENT) {

	if (obj.version === undefined) {
		throw new TypeError (
			"undefined version is not supported"
		);
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("3.3.0")) {
		obj = battalion_from_3_2_0(obj);
	}

	return obj;
}

function configuration(obj, to=Version.CURRENT) {

	if (obj.version === undefined) {
		throw new TypeError (
			"undefined version is not supported"
		);
	}

	if (typeof to == "string") {
		to = new Version(to);
	}

	const version = new Version(obj.version);

	if (version.older("3.4.0")) {
		obj = structuredClone(CampaignConfiguration.FbF);
	}

	return obj;
}

return {
	character,
	item,
	battalion,
	batchOfCharacters,
	batchOfItems,
	batchOfBattalions,
	configuration,
};

})();

/* exported Legacy */
