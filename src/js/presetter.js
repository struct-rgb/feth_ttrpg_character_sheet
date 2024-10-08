
/* global require */

/* global Notebook */

/* global CategoryModel, MultiActiveCategory */

/* global Battalions */

/* global
   BigButton, Toggle, Version
   element, capitalize, choice, nameof, tooltip, uniqueLabel, wrap
 */

/* global
   Art, Attribute, Class, Item, Preset
 */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({Notebook}                           = require("./widget/notebook.js"));
	({CategoryModel, MultiActiveCategory} = require("./widget/category.js"));
	/* eslint-enable no-global-assign */
}

const Presetter = (function() {

const DIMENSIONS = new Map([

	["Offense", new Map([
		["Power", {
			"name": "Power",
			"bases": {
				"hp": 0,
				"str": 6,
				"mag": 6,
				"dex": 0,
				"spd": -1,
				"def": 0,
				"res": 0,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 15,
				"mag": 15,
				"dex": 0,
				"spd": 5,
				"def": 0,
				"res": 0,
				"lck": 0
			},
		}],

		["Speed", {
			"name": "Speed",
			"bases": {
				"hp": 0,
				"str": 2,
				"mag": 2,
				"dex": -1,
				"spd": 4,
				"def": 0,
				"res": 0,
				"lck": -1,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 5,
				"mag": 5,
				"dex": 0,
				"spd": 15,
				"def": 0,
				"res": 0,
				"lck": 0
			},
		}],

		["Balance", {
			"name": "Balance",
			"bases": {
				"hp": 0,
				"str": 3,
				"mag": 3,
				"dex": 0,
				"spd": 2,
				"def": 0,
				"res": 0,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 10,
				"mag": 10,
				"dex": 0,
				"spd": 10,
				"def": 0,
				"res": 0,
				"lck": 0
			},
		}]
	])],

	["Defense", new Map([
		["Defense", {
			"name": "Defense",
			"bases": {
				"hp": 0,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 4,
				"res": 1,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 15,
				"res": 5,
				"lck": 0
			},
		}],

		["Resistance", {
			"name": "Resistance",
			"bases": {
				"hp": 0,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 1,
				"res": 4,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 5,
				"res": 15,
				"lck": 0
			},
		}],

		["Balance", {
			"name": "Balance",
			"bases": {
				"hp": 4,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 2,
				"res": 2,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 10,
				"res": 10,
				"lck": 0
			},
		}]
	])],

	["Rolling", new Map([
		["Luck", {
			"name": "Luck",
			"bases": {
				"hp": 2,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 7,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 5,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 15
			},
		}],

		["Dexterity", {
			"name": "Dexterity",
			"bases": {
				"hp": 2,
				"str": 0,
				"mag": 0,
				"dex": 7,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 15,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 5
			},
		}],

		["Balance", {
			"name": "Balance",
			"bases": {
				"hp": 2,
				"str": 0,
				"mag": 0,
				"dex": 3,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 3,
				"mov": 0
			},
			"growths": {
				"hp": 5,
				"str": 0,
				"mag": 0,
				"dex": 10,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 10
			},
		}]
	])]
]);

const KITS = {
	"None": {
		parent: null,
		hide: false,
		1: {},
		2: {},
		3: {},
	},
	"Swords": {
		parent: null,
		hide: false,
		training: "Swords Training",
		abilities: new Set([
			"Sword Prowess", "Sword Advantage", "Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Iron Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Steel Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess"],
				"arts": ["Swap"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess", "Sword Crit +10"],
				"arts": ["Swap"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Silver Sword"],
				"abilities" : ["Sword Prowess", "Sword Crit +10", "Swordfaire"],
				"arts": ["Swap"],
			}
		}
	},
	"Lances": {
		parent: null,
		hide: false,
		training: "Lances Training",
		abilities: new Set([
			"Lance Prowess", "Lance Advantage", "Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Iron Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Steel Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess"],
				"arts": ["Reposition"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess", "Lance Crit +10"],
				"arts": ["Reposition"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Silver Lance"],
				"abilities" : ["Lance Prowess", "Lance Crit +10", "Lancefaire"],
				"arts": ["Reposition"],
			}
		}
	},
	"Bows": {
		parent: null,
		hide: false,
		training: "Bows Training",
		abilities: new Set([
			"Bow Prowess", "Bow Advantage", "Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Iron Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Steel Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess", "Bow Crit +10"],
				"arts": ["Pivot"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Silver Bow"],
				"abilities" : ["Bow Prowess", "Bow Crit +10", "Axefaire"],
				"arts": ["Pivot"],
			}
		}
	},
	"Axes": {
		parent: null,
		hide: false,
		training: "Axes Training",
		abilities: new Set([
			"Axe Prowess", "Axe Advantage", "Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Iron Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Steel Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess"],
				"arts": ["Shove"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess", "Axe Crit +10"],
				"arts": ["Shove"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Silver Axe"],
				"abilities" : ["Axe Prowess", "Axe Crit +10", "Axefaire"],
				"arts": ["Shove"],
			}
		}
	},
	"Reason": {
		parent: null,
		hide: true,
		training: "Reason Training",
		abilities: new Set([
			"Reason Prowess", "Reason Advantage", "Reason Magic Spectrum",
			"Reason Range +1", "Reason Consumption 1", "Consumption"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			4 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			16 : {
				"points"    : 18,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			21 : {
				"points"    : 26,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			3 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			6 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			11 : {
				"points"    : 19,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			15 : {
				"points"    : 31,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			25 : {
				"points"    : 66,
				"items"     : [],
				"abilities" : ["Reason Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 78,
				"items"     : [],
				"abilities" : ["Reason Prowess", "Reason Range +1"],
				"arts": ["Draw Back"],
			},
			33 : {
				"points"    : 101,
				"items"     : [],
				"abilities" : ["Reason Prowess", "Reason Range +1","Reason Tomefaire"],
				"arts": ["Draw Back"],
			}
		},
	},
	"Ice": {
		parent: "Reason",
		hide: false,
		training: "Reason Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Blizzard", "Frostbite", "Fimbulvetr"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Blizzard", "Frostbite", "Fimbulvetr"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Fire": {
		parent: "Reason",
		hide: false,
		training: "Reason Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Fire", "Bolganone", "Ragnarok"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Fire", "Bolganone", "Ragnarok"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Lightning": {
		parent: "Reason",
		hide: false,
		training: "Reason Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Thunder"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Thunder", "Static Shock"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Thunder"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Thunder", "Static Shock"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Thunder"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Thunder", "Static Shock"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Thunder", "Static Shock", "Thoron"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Thunder", "Static Shock", "Thoron"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Wind": {
		parent: "Reason",
		hide: false,
		training: "Reason Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Thundar", "Cutting Gale", "Excalibur"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Force": {
		parent: "Reason",
		hide: false,
		training: "Reason Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Pugni", "Sagittae", "Agnea's Arrow"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Brawl": {
		parent: null,
		hide: true,
		training: "Mighty Fist Training",
		abilities: new Set([
			"Brawl Prowess", "Brawl Advantage", "Brawl Consumption 1",
			"Consumption"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			4 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			16 : {
				"points"    : 18,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			21 : {
				"points"    : 26,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			3 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			6 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			11 : {
				"points"    : 19,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			15 : {
				"points"    : 31,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			25 : {
				"points"    : 66,
				"items"     : [],
				"abilities" : ["Brawl Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 78,
				"items"     : [],
				"abilities" : ["Brawl Prowess", "Brawl Crit +10"],
				"arts": ["Pivot"],
			},
			33 : {
				"points"    : 101,
				"items"     : [],
				"abilities" : ["Brawl Prowess", "Brawl Crit +10","Fistfaire"],
				"arts": ["Pivot"],
			}
		},
	},
	"Metal": {
		parent: "Brawl",
		hide: false,
		training: "Might Fist Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Iron Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : [
					["Iron Fist Technique", "Mighty"],
					["Steel Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Iron Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": ["Fading Blow"],
			},
			4 : {
				"points"    : 4,
				"items"     : [
					["Iron Fist Technique", "Mighty"],
					["Steel Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Fading Blow"],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Iron Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": ["Fading Blow"],
			},
			3 : {
				"points"    : 4,
				"items"     : [
					["Iron Fist Technique", "Mighty"],
					["Steel Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Fading Blow"],
			},
			11 : {
				"points"    : 19,
				"items"     : [
					["Steel Fist Technique", "Rebinding", "Mighty"],
					["Silver Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : [
					["Steel Fist Technique", "Rebinding", "Mighty"],
					["Silver Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Beast": {
		parent: "Brawl",
		hide: false,
		training: "Might Fist Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
					["Bellowing Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			},
			4 : {
				"points"    : 4,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
					["Bellowing Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			},
			3 : {
				"points"    : 4,
				"items"     : [
					["Howling Fist Technique", "Mighty"],
					["Bellowing Fist Technique", "Mighty"]
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			},
			11 : {
				"points"    : 19,
				"items"     : [
					["Bellowing Fist Technique", "Rebinding", "Mighty"],
					["Roaring Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			},
			16 : {
				"points"    : 34,
				"items"     : [
					["Bellowing Fist Technique", "Rebinding", "Mighty"],
					["Roaring Fist Technique", "Mighty"],
				],
				"abilities" : [],
				"arts": ["Rushing Blow"],
			},
		},
	},
	"Water": {
		parent: "Brawl",
		hide: false,
		training: "Mystic Fist Training",
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
					["Graceful Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			},
			4 : {
				"points"    : 4,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
					["Graceful Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			},
			3 : {
				"points"    : 4,
				"items"     : [
					["Swift Fist Technique", "Mystic"],
					["Graceful Fist Technique", "Mystic"],
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			},
			11 : {
				"points"    : 19,
				"items"     : [
					["Graceful Fist Technique", "Rebinding", "Mystic"],
					["Serene Fist Technique", "Mystic"]
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			},
			16 : {
				"points"    : 34,
				"items"     : [
					["Graceful Fist Technique", "Rebinding", "Mystic"],
					["Serene Fist Technique", "Mystic"]
				],
				"abilities" : [],
				"arts": ["Dive Kick"],
			},
		},
	},
	"Faith": {
		parent: null,
		hide: false,
		training: "Faith Training",
		abilities: new Set([
			"Faith Magic Spectrum", "Faith Range +1", "Faith Prowess",
			"Faith Advantage", "Faith Consumption 1", "Consumption"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			16 : {
				"points"    : 31,
				"items"     : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess", "Faith Range +1"],
				"arts": ["Draw Back"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess", "Faith Range +1", "Faith Tomefaire"],
				"arts": ["Draw Back"],
			}
		}
	},
	"Guile": {
		parent: null,
		hide: false,
		training: "Guile Training",
		abilities: new Set([
			"Guile Magic Spectrum", "Guile Prowess",
			"Guile Advantage", "Guile Consumption 1", "Consumption"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Miasma"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Miasma"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Miasma"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Miasma"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess"],
				"arts": ["Draw Back"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess", "Guile Range +1"],
				"arts": ["Draw Back"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess", "Guile Range +1", "Guile Tomefaire"],
				"arts": ["Draw Back"],
			}
		},
	},
	"Authority": {
		parent: null,
		hide: false,
		abilities: new Set([
			"Authority", "Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Iron Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Iron Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Steel Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			},
			33 : {
				"points"    : 101,
				"items"     : ["Silver Shield"],
				"abilities" : ["Authority", "Other Prowess"],
				"arts": ["Pivot"],
			}
		}
	},
	"Fighters": { // Make the outfitting match the unit type
		parent: "Authority",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line"]
			},
			15 : {
				"points"    : 16,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line", "Initiate"]
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Mad Melee", "Hold the Line", "Initiate"]
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line"]
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line", "Initiate"]
			},
			16 : {
				"points"    : 18,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Mad Melee", "Hold the Line", "Initiate"]
			},
		},
		3: {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line"]
			},
			6 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Disturbance", "Hold the Line", "Initiate"]
			},
			11 : {
				"points"    : 19,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Mad Melee", "Hold the Line", "Initiate"]
			},
			16 : {
				"points"    : 34,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Protection",
				"training"  : [
					"Axes Training", "Lances Training", "Swords Training",
					"Mighty Fist Training", "Mystic Fist Training",
				],
				"gambits"   : ["Assault Troop", "Hold the Line", "Initiate"]
			},
		},
	},
	"Mages": { // Make the outfitting match the unit type
		parent: "Authority",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic"]
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic", "Initiate"]
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Resonant Magic", "Initiate"]
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic"]
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic", "Initiate"]
			},
			16 : {
				"points"    : 18,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Resonant Magic", "Initiate"]
			},
		},
		3: {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic"]
			},
			6 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Group Magic", "Initiate"]
			},
			11 : {
				"points"    : 19,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Resonant Magic", "Initiate"]
			},
			16 : {
				"points"    : 34,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Resiliance",
				"training"  : [
					"Reason Training", "Guile Training", "Faith Training"
				],
				"gambits"   : ["Resonant Magic", "Initiate", "Demolish"]
			},
		},
	},
	"Archers": { // Make the outfitting match the unit type
		parent: "Authority",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade"]
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade", "Initiate"]
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Poisoned Arrows", "Initiate"]
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade"]
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade", "Initiate"]
			},
			16 : {
				"points"    : 18,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Poisoned Arrows", "Initiate"]
			},
		},
		3: {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade"]
			},
			6 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Fusillade", "Initiate"]
			},
			11 : {
				"points"    : 19,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Poisoned Arrows", "Initiate"]
			},
			16 : {
				"points"    : 34,
				"items"     : [],
				"abilities" : [],
				"arts": [],

				"battalion" : "Balanced/Offense",
				"training"  : ["Bows Training"],
				"gambits"   : ["Hail of Arrows", "Initiate"]
			},
		},
	},
	"Item": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"items"     : ["Poison Flask"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : ["Poison Flask"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Poison Flask", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"items"     : ["Poison Flask", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease", "Pyrotechnics"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"items"     : ["Poison Flask"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"items"     : ["Poison Flask", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"items"     : ["Poison Flask", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"items"     : ["Poison Flask", "First Aid Kit", "Jar of Grease", "Pyrotechnics"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : ["Poison Flask", "Alchemist's Fire"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit", "Jar of Grease"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit", "Jar of Grease", "Pyrotechnics"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit", "Jar of Grease", "Pyrotechnics"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"items"     : ["Poison Flask", "Alchemist's Fire", "First Aid Kit", "Jar of Grease", "Pyrotechnics", "Enchanted Music Box"],
				"abilities" : ["Other Prowess"],
				"arts": [],
			},
		},
	},
	"Armor": {
		parent: null,
		hide: false,
		abilities: new Set([
			"Stamina +5"
		]),
		1 : {
			1 : {
				"points"    : 2,
				"items"     : [],
				"abilities" : [],
				"arts": ["Hustle"],
			},
			5 : {
				"points"    : 4,
				"items"     : [],
				"abilities" : [],
				"arts": ["Hustle"],
			},
			9 : {
				"points"    : 8,
				"items"     : [],
				"abilities" : [],
				"arts": ["Hustle", "Taunt"],
			},
			15 : {
				"points"    : 16,
				"items"     : [],
				"abilities" : [],
				"arts": ["Sprint", "Taunt"],
			},
			26 : {
				"points"    : 40,
				"items"     : [],
				"abilities" : [],
				"arts": ["Sprint", "Taunt"],
			},
			31 : {
				"points"    : 53,
				"items"     : [],
				"abilities" : [],
				"arts": ["Sprint", "Taunt"],
			},
			37 : {
				"points"    : 80,
				"items"     : [],
				"abilities" : [],
				"arts": ["Sprint", "Taunt"],
			},
		},
		2: {},
		3: {},
	},
	"Phantom": {
		parent: null,
		hide: true,
		1: {},
		2: {},
		3: {},
	},
	"Butcher": {
		parent: "Phantom",
		skill: "Axes",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Iron Axe", "Bound"]],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"items"     : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Ranged", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Iron Axe", "Refined", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Ranged", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess"],
				"arts": [],
			},
		}
	},
	"Impaler": {
		parent: "Phantom",
		skill: "Lances",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Iron Lance", "Bound"]],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"items"     : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Ranged", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Iron Lance", "Refined", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Ranged", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess"],
				"arts": [],
			},
		},
	},
	"Slasher": {
		parent: "Phantom",
		skill: "Swords",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Iron Sword", "Bound"]],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"items"     : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Ranged", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Iron Sword", "Refined", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Ranged", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess"],
				"arts": [],
			},
		},
	},
	"Banshee": {
		parent: "Phantom",
		skill: "Guile",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Miasma", "Bound"]],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [
					["Miasma", "Bound"],
					["Banshee", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"items"     : [
					["Miasma", "Bound"],
					["Banshee", "Bound"],
					["Swarm", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Miasma", "Bound"],
					["Banshee", "Bound"],
					["Swarm", "Bound"],
					["Death", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Banshee", "Bound"],
					["Swarm", "Bound"],
					["Death", "Bound"],
					["Hades", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
		}
	},
	"Lemure": {
		parent: "Phantom",
		skill:"Guile",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Ectoplasm", "Bound"]],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [
					["Ectoplasm", "Bound"],
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			10 : {
				"points"    : 6,
				"items"     : [
					["Ectoplasm", "Bound"],
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Ectoplasm", "Bound"],
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess", "Heartseeker"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Ectoplasm", "Bound"],
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess", "Heartseeker"],
				"arts": [],
			},
		},
	},
	"Poltergeist": {
		parent: "Phantom",
		skill: "Guile",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess"],
				"arts": ["Foul Play"],
			},
			10 : {
				"points"    : 8,
				"items"     : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess", "Alert Stance"],
				"arts": ["Confusion", "Foul Play"],
			},
			15 : {
				"points"    : 31,
				"items"     : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess", "Alert Stance"],
				"arts": ["Poisoned", "Confusion", "Foul Play"],
			},
			25 : {
				"points"    : 66,
				"items"     : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess", "Alert Stance+"],
				"arts": ["Poisoned", "Confusion", "Foul Play"],
			},
		}
	},
	"Martyr": {
		parent: "Phantom",
		skill: "Faith",
		hide: false,
		1 : {},
		2 : {},
		3 : {
			1 : {
				"points"    : 2,
				"items"     : [["Heal", "Bound"]],
				"abilities" : ["Faith Prowess"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"items"     : [["Heal", "Bound"]],
				"abilities" : ["Faith Prowess"],
				"arts": ["Foul Play"],
			},
			10 : {
				"points"    : 8,
				"items"     : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"]
				],
				"abilities" : ["Faith Prowess", "Crit +10"],
				"arts": ["Foul Play"],
			},
			15 : {
				"points"    : 31,
				"items"     : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"],
					["Heal", "Treatment: Destructive", "Bound"]
				],
				"abilities" : ["Faith Prowess", "Crit +10"],
				"arts": ["Foul Play"],
			},
			25 : {
				"points"    : 66,
				"items"     : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"],
					["Heal", "Treatment: Destructive", "Bound"]
				],
				"abilities" : ["Faith Prowess", "Crit +10"],
				"arts": ["Foul Play"],
			},
		},
	},
};

function add_objs(...objs) {

	const sum = {};

	for (let obj of objs) {
		for (let key in obj) {
			sum[key] = (key in sum ? sum[key] : 0) + obj[key];
		}
	}

	return sum;
}

class Tokenator {

	static Portrait = class {

		constructor(text, list, parent=null) {

			this.freshLoad = false;

			this.image = element("img", {
				class : ["no-display"],
				attrs : {
					onload : (() => {
						if (!this.parent) return;
						
						// TODO find a way to make this only happen on first load
						if (this.freshLoad) {
							this.parent.fit(this.image.width);
							this.parent.center(false);
							this.freshLoad = false;
						}
						
						this.parent.refresh();
					})
				}
			});

			this.parent = parent;

			this.input = element("input",  {
				class : ["no-display"],
				attrs : {
					type     : "file",
					onchange : ((event) => this.upload(event)),
				}
			});

			this.button = element("button", {
				content : text,
				class   : ["simple-border"],
				attrs   : {
					onclick: (event) => {
						this.input.click();
					}
				}
			});

			this.select   = element("select", {
				class   : ["simple-border"],
				content : element("option", {
					content : "None",
					attrs   : {value: ""}
				}),
				attrs   : {
					onchange : ((event) => {
						const value = this.select.value;
						if (!value) return this.clear();
						this.freshLoad = true;
						this.image.src = value;
					})
				}
			});

			this.variants = new Map();

			for (let path of list) {
				const name   = path.split(/[./]/).at(-2);
				const match  = name.match(/^((?:\w+ ?)+)(\(\d+\))?$/);
				const option = element("option", {
					content : name, attrs: {value: path},
				});

				if (match) {

					const cls = match[1].trim();

					if (this.variants.has(cls)) {
						this.variants.get(cls).push(path);
					} else {
						this.variants.set(cls, [path]);
					}
				}

				this.select.appendChild(option);
			}

			this.root = element("span",
				[this.button, this.image, this.input]
			);
		}

		upload(event) {
			const file = event.target.files[0];

			const reader = new FileReader();
			reader.readAsDataURL(file);

			reader.onload = (event) => {
				const imageURL = event.target.result;
				this.freshLoad = true;
				this.image.src = imageURL;
			};

			this.input.value  = null;
			this.select.value = "";
		}

		getRandomVariant(group) {
			const variants  = this.variants.get(group);
			return variants ? variants.random() : null;
		}

		setRandomVariant(group) {
			const random = this.getRandomVariant(group);

			if (random) {
				this.freshLoad    = true;
				this.select.value = random;
				this.image.src    = random;
				return true;
			}
			
			return false;
		}

		isCustom() {
			return this.image.hasAttribute("src") && this.select.value == "None";
		}

		clear() {
			this.image.removeAttribute("src");
		}
	};

	static Ixons = class extends MultiActiveCategory {

		constructor(parent, name, list) {

			const map   = new Map(list.map(path => {
				const name = path.split(/[./]/).at(-2);
				return [name, {name, path}];
			}));

			const model = new CategoryModel(
				name, map,
				(feature => feature.name),
				(feature => element("img", {
					class: ["no-display"],
					attrs: {
						src    : feature.path,
						onload : (() => {
							this.parent.refresh();
						}),
					},
				})),
				((feature) => null),
			);

			super(model, {
				name         : name,
				empty        : "No icons added.",
				selectable   : true,
				reorderable  : true,
				removable    : true,
				hideable     : false,
				addActive    : true,
				ontoggle     : ((category, key) => {
					category.toggleActive(key);
					this.parent.refresh();
				}),
				onremove     : ((category, key) => {
					category.delete(key);
					this.parent.refresh();
				}),
				onreorder    : ((category, key) => {
					this.parent.refresh();
				}),
				defaultGroup : name,
			});

			this.parent = parent;
		}
	};

	constructor(size, compact=false) {

		/* TODO legacy shit */
		this._updatefn = (x => x);

		this._export       = new BigButton("Export", () => void this.export());

		this._import       = new BigButton("Import");
		this._import.input.type   = "file";
		this._import.input.accept = ".json";
		this._import.input.addEventListener("change", (e) => {
			this.import(e);
			this._import.input.value = null;
		}, false);

		this._file_buttons = element("div",
			[this._import.label, this._import.input, this._export.label, this._export.input]
		);

		this.canvas        = element("canvas");
		this.canvas.width  = size;
		this.canvas.height = size;
		this.size          = size;

		const icons    = definitions.icons;
		this.portrait  = new Tokenator.Portrait("Upload", icons.portraits, this, true);
		this.skills    = new Tokenator.Ixons(this, "icons-skills"    , icons.item);
		this.types     = new Tokenator.Ixons(this, "icons-types"     , icons.type);
		this.effective = new Tokenator.Ixons(this, "icons-effective" , icons.effective);

		this.chooser       = element("div");

		this.dragging      = false;
		this.dragStartX    = null;
		this.dragStartY    = null;
		this.dragOffsetX   = null;
		this.dragOffsetY   = null;

		// zoom in or out on the portait with the mouse wheel
		this.canvas.addEventListener("wheel", (event) => {

			if (this.lockb.checked) return;

			// zoom in or out on the portrait
			const delta       = Math.sign(event.deltaY) * Number(this.scale.step);
			const old         = Number(this.scale.value);
			const scale       = delta + old;
			const centerX1    = this.portrait.image.width  * old * 0.5;
			const centerY1    = this.portrait.image.height * old * 0.5;
			const centerX2    = this.portrait.image.width  * scale * 0.5;
			const centerY2    = this.portrait.image.height * scale * 0.5;

			this.offsetX     += centerX1 - centerX2;
			this.offsetY     += centerY1 - centerY2;

			this.scale.value  = scale;
			this.scale.onchange();

			// stop the page from scolling
			event.preventDefault();
			event.stopPropagation();
		}, false);

		// drag in order to move portrait
		this.canvas.addEventListener("mousedown", (event) => {

			if (this.lockb.checked) return;

			if (event.which == 1) {
				this.dragging    = true;
				this.dragStartX  = event.offsetX;
				this.dragStartY  = event.offsetY;
				this.dragOffsetX = this.offsetX;
				this.dragOffsetY = this.offsetY;
			}
		}, false);

		this.canvas.addEventListener("mouseup", (event) => {

			if (this.lockb.checked) return;

			if (event.which == 1) {
				this.dragging = false;
				this.offsetX  = this.dragOffsetX + (event.offsetX - this.dragStartX);
				this.offsetY  = this.dragOffsetY + (event.offsetY - this.dragStartY);
				this.refresh();
			}
		}, false);

		this.canvas.addEventListener("mousemove", (event) => {

			if (this.lockb.checked) return;

			if (this.dragging) {
				this.offsetX  = this.dragOffsetX + (event.offsetX - this.dragStartX);
				this.offsetY  = this.dragOffsetY + (event.offsetY - this.dragStartY);
				this.refresh();
			}
		}, false);

		const compts = [
			"source-over", "source-in", "source-out", "source-atop", "destination-over", "destination-in",
			"destination-out", "destination-atop", "lighter", "copy", "xor", "multiply", "screen",
			"overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light",
			"difference", "exclusion", "hue", "saturation", "color", "luminosity",
		];

		this.composite2 = element("select", {
			class: ["simple-border"],
			content: compts.map(each =>
				element("option", {
					content : each,
					value   : each,
				})
			),
			attrs : {
				onchange: (() => void this.refresh()),
			}
		});

		this.offsetX       = 0;
		this.offsetY       = 0;

		this.border        = Math.floor(size / 32) + 4;
		this.scale         = element("input", {
			class: ["simple-border", "no-display"],
			attrs: {
				type     : "number",
				min      : 0.02,
				max      : 4.00,
				step     : 0.02,
				value    : 1.00,
				onchange : ((event) => {
					if (this.scale.value < this.scale.min)
						this.scale.value = this.scale.min;
					if (this.scale.value > this.scale.max)
						this.scale.value = this.scale.max;
					this.refresh();
				}),
			}
		});

		this.allegiance    = element("select", {
			class: ["simple-border"],
			content: (
				[
					[ "Player"  , "#0000FF" ],
					[ "Enemy"   , "#FF0000" ],
					[ "Ally"    , "#00FF00" ],
					[ "Other"   , "#FFFF00" ],
					[ "Fourth"  , "#FF00FF" ],
					[ "Fifth"   , "#00FFFF" ],
					[ "Sixth"   , "#FFFFFF" ],
					[ "Seventh" , "#FFFFFF" ],
				].map(pair => {
					const [label, color] = pair;
					return element("option", {
						content : label,
						attrs   : {value: color},
					});
				})
			),
			attrs: {
				onchange: ((event) => void this.refresh()),
				selectedIndex: 1,
			}
		});

		this._default_bgcolor = "#4e4337";

		this.bgcolor    = element("input", {
			class: ["simple-border"],
			attrs: {
				type    : "color",
				oninput : ((event) => void this.refresh()),
				value   : this._default_bgcolor,
			},
		});

		this.centerb    = element("button", {
			content : "Center/Fit",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this.fit();
					this.center();
				}),
			}
		});

		this.guessb    = element("button", {
			content : "Guess Icons",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this.guess(sheet, false);
				}),
			}
		});

		this.guessbb   = element("button", {
			content : "Guess Battalion Icons",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this.guess(sheet.battalion, false);
				}),
			}
		});

		this.clearb    = element("button", {
			content : "Clear All Token Options",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this.clear();
				})
			}
		});

		this.infantryb = new Toggle("Boot?", false);

		this.lockb = new Toggle("Lock?", compact);

		this.notebook = new Notebook(this.chooser);

		if (compact) this.notebook.add("View", this.canvas);

		this.notebook.add("Options", element("div", [
			tooltip(this.guessb, wrap(
				"Guess what icons the character in the main sheet should have ",
				"based on their class, items in inventory, and equipped arts."
			)),
			tooltip(this.infantryb.root, wrap(
				"Whether the Infantry movement type icon should ever be ",
				"marked or should just left implied by lack of an icon."
			)), element("br"),
			tooltip(this.guessbb, wrap(
				"Guess what icons the character's active battalion should ",
				"have based on its equipped gambits."
			)), element("br"),
			this.clearb, element("br"),
			uniqueLabel("Portrait", this.portrait.root), element("br"),
			this.portrait.root, this.centerb,
			tooltip(this.lockb.root, wrap(
				"Prevent mouse interaction on the main icon to prevent ",
				"accidental editting of the token's zoom or pan."
			)), element("br"),
			this.portrait.select, element("br"),
			uniqueLabel("Border", this.allegiance), element("br"),
			this.allegiance, element("br"),
			uniqueLabel("Background", this.bgcolor), element("br"),
			this.bgcolor, element("br"),
			uniqueLabel("File Operations", this._file_buttons), element("br"),
			this._file_buttons, element("br"),
			
		]));

		this.notebook.add("Icons", element("div", [
			element("strong", "Items"),
			this.skills.root, element("br"),
			element("strong", "Type"),
			this.types.root, element("br"),
			element("strong", "Effective"),
			this.effective.root, element("br")
		]));

		this.notebook.active = compact ? "View" : "Options";

		if (!compact) {
			this.notebook.root.style = `
				display: inline-block;
				position: absolute;
			`;
		}

		this.canvas.style = "padding: 10px;";

		if (compact) {
			this.root = this.notebook.root;
		} else {
			this.root     = element("div", [
				element("strong", "Generate Token"), element("br"),
				this.canvas,
				this.notebook.root,
			]);
		}

		this.refresh();
	}

	importObject(object) {
		this.bgcolor.value    = object.bgcolor;
		this.allegiance.value = object.border;
		this.offsetX          = object.offsetX;
		this.offsetY          = object.offsetY;
		this.scale.value      = object.scale;
		this.types.setState(object.types);
		this.skills.setState(object.skills);
		this.effective.setState(object.effective);

		/* let's see if this works first of all */
		this.portrait.image.src = object.portrait;
	}

	import(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			const item     = JSON.parse(e.target.result);
			this.importObject(this._updatefn(item));
		};
		
		reader.readAsText(file);
	}

	exportObject() {
		return {
			version   : Version.CURRENT.toString(),
			portrait  : this.portrait.image.currentSrc,
			bgcolor   : this.bgcolor.value,
			border    : this.allegiance.value,
			offsetX   : this.offsetX,
			offsetY   : this.offsetY,
			scale     : Number(this.scale.value),
			types     : this.types.getState(),
			skills    : this.skills.getState(),
			effective : this.effective.getState(),

		};
	}

	export() {
		const a    = element("a");
		const item = this.exportObject();
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = "token.json";
		a.click();
		URL.revokeObjectURL(a.href);
	}

	clear(refresh=true, portrait=true) {
		if (portrait) this.portrait.clear();
		this.allegiance.selectedIndex = 1;
		this.bgcolor.value            = this._default_bgcolor;
		this.skills.clear();
		this.types.clear();
		this.effective.clear();
		this.center(false);
		if (refresh) this.refresh();
	}

	guess(sheet, portrait=true) {
		this.clear(false, portrait);

		function addActive(category, tag) {
			// Re-adding is a no-op but don't want to double toggle.
			if (category.isActive(tag)) return false;

			// Add and toggle on the element.
			category.add(tag);
			category.toggleActive(tag);
			return true;
		}

		function addEffective(category, tags) {
			for (let tag of tags) {

				// Capture any tags that specify effectiveness.
				const match = tag.match(/^([a-z]+) effective$/);
				if (!match) continue;

				// The icon names are capitalized and the tags are lowercase.
				addActive(category, capitalize(match[1]));
			}
		}

		if (sheet instanceof Sheet) {
			sheet.wb.sync();

			// Detect whether this unit uses battalions.
			if (sheet.battalion.name != "Alone") {
				addActive(this.skills, "Authority");
			}

			// Detect which items types this unit uses.
			for (let each of sheet.wb.category.values("inventory")) {

				const item = Item.get(each.template);
				const type = item.tagged("Shield") ? "Shield" : item.type;
				
				addEffective(this.effective, item.tags);

				for (let element of each.attributes) {
					const attribute = Attribute.get(element.id);
					addEffective(this.effective, attribute.tags);
				}

				addActive(this.skills, type);
			}

			// Seek remain effectivenesses in arts.
			for (let each of sheet.arts.values()) {
				if (each.tagged("Tactical")) continue;
				addEffective(this.effective, each.tags);
			}

			// List class types.
			for (let each of sheet.character.class.type) {
				if (!this.infantryb.checked && each == "Infantry") continue;
				addActive(this.types, each);
			}

			if (!this.portrait.isCustom() && confirm("Override Portrait?")) {
				this.portrait.setRandomVariant(sheet.character.class.name);
			}

		} else if (sheet instanceof Presetter) {

			for (let kit of sheet.kits()) {

				if ("battalion" in kit) {
					addActive(this.skills, "Authority");
				}

				for (let each of kit.items) {

					const stringle    = typeof each == "string";
					const nitem       = stringle ? each : each[0];
					const nattributes = stringle ?  []  : each.slice(1);

					const item = Item.get(nitem);
					const type = item.tagged("shield") ? "Shield" : item.type;

					addEffective(this.effective, item.tags);

					for (let element of nattributes) {
						const attribute = Attribute.get(element);
						addEffective(this.effective, attribute.tags);
					}

					addActive(this.skills, type);
				}

				for (let each of kit.arts) {
					const art = Art.get(each);
					addEffective(this.effective, art.tags);
				}

			}

			const cls = Class.get(sheet.class);
			for (let each of cls.type) {
				if (!this.infantryb.checked && each == "Infantry") continue;
				addActive(this.types, each);
			}

			this.portrait.setRandomVariant(sheet.class);
			
		} else if (sheet instanceof Battalions) {

			// Add the battalion icon.
			addActive(this.types, "Battalion");

			// Guess everything from equipped gambits.
			for (let gambit of sheet.gambits.values()) {

				let match = null;

				if ((match = gambit.name.match(/^(.*) Outfitting$/))) {
					if (!this.infantryb.checked && match[1] == "Infantry") continue;
					addActive(this.types, match[1]);
				} else if ((match = gambit.name.match(/^(.*) Training$/))) {
					addActive(this.skills, match[1].includes("Fist") ? "Brawl" : match[1]);
				} else {
					addEffective(this.effective, gambit.tags);
				}

			}

		} else {
			throw new Error(
				`Expected Sheet, Presetter, or Battalions but got ${nameof(sheet)}.`
			);
		}

		this.refresh();
	}

	send(tokenator) {
		tokenator.importObject(this.exportObject());
	}

	fit(width=this.portrait.image.width || this.size) {
		this.scale.value = this.size / width;
	}

	center(refresh=true) {
		if (!this.portrait.image.src) return;
		const scale  = Number(this.scale.value);
		const height = this.portrait.image.height * scale;
		const width  = this.portrait.image.width  * scale;

		this.offsetX = this.canvas.width  / 2 - width  / 2;
		this.offsetY = this.canvas.height / 2 - height / 2;
		if (refresh) this.refresh();
	}

	refresh() {

		const canvas = this.canvas;
		const half   = canvas.width / 2;
		const ctx    = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (this.portrait.image.src) {

			const scale  = Number(this.scale.value);
			const height = this.portrait.image.height * scale;
			const width  = this.portrait.image.width  * scale;

			ctx.beginPath();
			ctx.fillStyle = "white";
			ctx.arc(half, half, half, 0, 2 * Math.PI);
			ctx.fill();

			ctx.globalCompositeOperation = "source-in";
			ctx.drawImage(this.portrait.image,
				this.offsetX, this.offsetY, width, height
			);
		}

		ctx.globalCompositeOperation = "destination-over";
		ctx.beginPath();
		ctx.fillStyle = this.bgcolor.value;
		ctx.arc(half, half, half, 0, 2 * Math.PI);
		ctx.fill();

		ctx.globalCompositeOperation = "source-over";

		ctx.beginPath();
		ctx.strokeStyle = this.allegiance.value;
		ctx.fillStyle   = "";
		ctx.lineWidth   = this.border;
		ctx.arc(half, half, half - (this.border / 2), 0, 2 * Math.PI);
		ctx.stroke();

		let y = 0;
		for (let each of this.skills.elements()) {
			if (!this.skills.isActive(each.title)) continue;
			ctx.drawImage(each.description, canvas.width - 47, y, 47, 47);
			y += 47;
		}

		y = 0;
		for (let each of this.types.elements()) {
			if (!this.types.isActive(each.title)) continue;
			ctx.drawImage(each.description, canvas.width - 94, y, 47, 47);
			y += 47;
		}

		y = 0;
		for (let each of this.effective.elements()) {
			if (!this.effective.isActive(each.title)) continue;
			ctx.drawImage(each.description, 0, y, 47, 47);
			y += 47;
		}

		// for (let [y, image] of this.skills.active()) {
		// 	ctx.drawImage(image, canvas.width - 47, y, 47, 47);
		// }

		// for (let [y, image] of this.types.active()) {
		// 	ctx.drawImage(image, canvas.width - 94, y, 47, 47);
		// }

		// for (let [y, image] of this.effective.active()) {
		// 	ctx.drawImage(image, 0, y, 47, 47);
		// }
	}
}

/**
 * This class is used as a mechanism to allow for kits to select the optinal
 * variants of class abilities and arts that those kits synergize with.
 */
class Election extends Map {

	constructor(key, ...kits) {
		super();

		for (let i = kits.length; 0 <= i; --i) {
			this.addKit(key, kits[i], i);
		}

		this.best  = 0;
		this.worst = kits.length;
	}

	static EMPTY = new Set();

	addKit(key, from, rank) {

		// get the relecant kit
		const kit = KITS[from];
		if (!kit) return;

		// read in all of the preferred names with their ranking
		const features = kit[key] ?? Election.EMPTY;
		for (let feature of features) this.set(feature, rank);

		// read in any features from the parent kit
		if (kit.parent)
			this.addKit(key, kit.parent, rank);
	}

	isBetter(key, rank) {
		return rank > (this.get(key) ?? this.worst);
	}

	reserve(key) {
		this.delete(key);
		return key;
	}

	static getElections(...kits) {

		const elections = {};

		for (let key of ["abilities", "arts"]) {
			elections[key] = new Election(key, ...kits);
		}

		return elections;
	}

	static elect(options, election) {

		// no elections, so fall back on manual choice
		if (election == null) return choice(options);

		// if not asked to choose return the passed object
		if (!(options instanceof Array)) return options;

		// if given no options choose none
		if (options.length == 0) return null;

		// if given one option choose it
		if (options.length == 1) return options[1];

		// length of the elections will be lower than any election tier
		let rank    = election.worst;

		// this is our current "best choice" as we go forward
		let elected = null;

		// check each option to see if it was elected
		for (let option of options) {

			if (election.isBetter(option, rank)) {
				rank    = election.get(option);
				elected = option;
			}

			if (rank == election.best) break;
		}

		// if we elected a candidate, then return that
		if (elected) return election.reserve(elected);

		// fall back on letting the user manually choose
		return choice(options);
	}

}

class Presetter {

	static KITS = KITS;

	static random() {
		const roll    = () => Math.floor(Math.random() * 3);
		const offense = Array.from(DIMENSIONS.get("Offense"))[roll()][1];
		const defense = Array.from(DIMENSIONS.get("Defense"))[roll()][1];
		const rolling = Array.from(DIMENSIONS.get("Rolling"))[roll()][1];
		return `${offense.name}/${defense.name}/${rolling.name}`;
	}

	static generate_presets() {

		const basic = {
			"name": "Balance",
			"bases": {
				"hp": 20,
				"str": 4,
				"mag": 4,
				"dex": 4,
				"spd": 4,
				"def": 4,
				"res": 4,
				"lck": 4,
				"mov": 4
			},
			"growths": {
				"hp": 45,
				"str": 25,
				"mag": 25,
				"dex": 25,
				"spd": 25,
				"def": 25,
				"res": 25,
				"lck": 25
			},
		};

		const presets = [{
			"name": "Custom",
			"description": "Preset for a custom character.",
			"bases": {
				"hp": 0,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 0,
				"mov": 0
			},
			"growths": {
				"hp": 0,
				"str": 0,
				"mag": 0,
				"dex": 0,
				"spd": 0,
				"def": 0,
				"res": 0,
				"lck": 0
			},
			"comment": "Items must be integers.",
			"tags": ["first"],
			"hidden": false
		}];

		function compose(...args) {

			const name = args.map(a => a.name).join("/");
			const base = add_objs(basic.bases, ...args.map(a => a.bases));
			const grow = add_objs(basic.growths, ...args.map(a => a.growths));

			presets.push({
				"name"        : name,
				"description" : "",
				"bases"       : base,
				"growths"     : grow,
				"comment"     : "",
				"tags"        : [],
				"hidden"      : false
			});
		}

		for (let i of DIMENSIONS.get("Offense").values()) {
			for (let j of DIMENSIONS.get("Defense").values()) {
				for (let k of DIMENSIONS.get("Rolling").values()) {
					compose(i, j, k);
				}
			}
		}

		return presets;
	}

	static getDefault(kits) {

		/* only one option so return it */
		if (typeof kits == "string") return kits;

		/* choose one option at random */
		if (kits instanceof Array) return kits.random();

		/* we got an invalid input, so error */
		throw Error("kits must be string or array");
	}

	static getElections = Election.getElections;

	static elect = Election.elect;

	static Tokenator = Tokenator;

	constructor() {

		this._preset  = Preset.select();

		this._class   = Class.select(() => {

			const build = Class.get(
				this._class.value
			);

			this._preset._select.value = build.default_preset;
			this._mainarm.value        = Presetter.getDefault(build.default_mainarm);
			this._sidearm.value        = Presetter.getDefault(build.default_sidearm);

			this.tokenator.guess(this);
		});

		this._level  = element("input",  {
			class: ["simple-border"],
			attrs: {
				min     : 0,
				max     : 100,
				value   : 1,
				type    : "number",
			}
		});

		this._reroll = element("button",  {
			content : "Reroll Kit",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this._class._select.oninput();
				}),
			}
		});

		this._rebuild = element("button",  {
			content : "Reroll",
			class   : ["simple-border"],
			attrs   : {
				onclick : ((event) => {
					this._preset._select.value = Presetter.random();
				}),
			}
		});

		this._mainarm = element("select", {
			class: ["simple-border"],
			content: Array.from(Object.entries(KITS)
				.filter(kv => {
					const [_key, value] = kv;
					return !value.hide;
				})
				.map(kv => {
					const [key, value] = kv;
					return element("option", {
						content : (
							value.parent === null
								? key
								: `${value.parent} (${key})`
						),
						attrs   : {
							value: key,
						}
					});
				})
			),
			attrs: {
				onchange: ((event) => {
					this.tokenator.guess(this);
				})
			},
		});

		this._sidearm = element("select", {
			class: ["simple-border"],
			content: Array.from(Object.entries(KITS)
				.filter(kv => {
					const [_key, value] = kv;
					return !value.hide;
				})
				.map(kv => {
					const [key, value] = kv;
					return element("option", {
						content : (
							value.parent === null
								? key
								: `${value.parent} (${key})`
						),
						attrs   : {
							value: key,
						}
					});
				})
			),
			attrs: {
				onchange: ((event) => {
					this.tokenator.guess(this);
				})
			}
		});

		this.confirm = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Create NPC",
				onclick : (() => {
					sheet.create_npc();
				})
			}
		});

		this._swaparms = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Swap Kits",
				onclick : (() => {
					const tmp = this._mainarm.value;
					this._mainarm.value = this._sidearm.value;
					this._sidearm.value = tmp;
				})
			}
		});

		this.tokenator = new Tokenator(256);
		// this.tokenator.allegiance.selectedIndex = "Enemy";
		this.tokenator.refresh();

		this.root = element("div", [
			element("strong", "Generate NPC"), element("br"),
			
			uniqueLabel("Class", this._class.root), element("br"),
			this._class.root, this._reroll, element("br"),

			uniqueLabel("Build", this._preset.root), element("br"),
			this._preset.root, this._rebuild, element("br"),

			uniqueLabel("Main Kit", this._mainarm), element("br"),
			this._mainarm, this._swaparms, element("br"),

			uniqueLabel("Side Kit", this._sidearm), element("br"),
			this._sidearm, element("br"),

			uniqueLabel("Level", this._level), element("br"),
			this._level, this.confirm, element("br"),

			this.tokenator.root,
		]);
	}

	get level() {
		return Number(this._level.value);
	}

	get class() {
		return this._class.value;
	}

	get preset() {
		return this._preset.value;
	}

	get sidearm() {
		return this._sidearm.value;
	}

	get mainarm() {
		return this._mainarm.value;
	}

	kits() {
		const _kits = [];

		if (this.mainarm == this.sidearm || this.sidearm == "None") {
			this.getKits(this.mainarm, 3, _kits);
		} else {
			this.getKits(this.mainarm, 2, _kits);
			this.getKits(this.sidearm, 1, _kits);
		}

		return _kits;
	}

	getKits(skill, scale, _kits=[]) {

		/* get correct skill and scale */
		const kind = Presetter.KITS[skill];
		const kits = kind[scale];

		/* find appropriate kit for level */
		let kit = null;
		for (let level in kits) {
			if (level > this.level) break;
			kit = kits[level];
		}

		/* add result */
		if (kit) _kits.push(kit);

		/* recurse */
		if (kind.parent != null) this.getKits(
			kind.parent, scale, _kits
		);


		return _kits;
	}

}

return Presetter;

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	/* global module */
	module.exports = Presetter;
}

/* exported Presetter */
