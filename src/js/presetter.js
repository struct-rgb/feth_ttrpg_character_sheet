
/* global element */
/* global Preset */
/* global Class */
/* global uniqueLabel */

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
				"str": 1,
				"mag": 1,
				"dex": 0,
				"spd": 4,
				"def": 0,
				"res": 0,
				"lck": 0,
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
	"Swords": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Sword"],
				"abilities" : ["Sword Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Iron Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Steel Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 5", "Sword Crit +10"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Silver Sword"],
				"abilities" : ["Sword Prowess 5", "Sword Crit +10", "Swordfaire"],
				"arts": [],
			}
		}
	},
	"Lances": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Lance"],
				"abilities" : ["Lance Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Iron Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Steel Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 5", "Lance Crit +10"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Silver Lance"],
				"abilities" : ["Lance Prowess 5", "Lance Crit +10", "Lancefaire"],
				"arts": [],
			}
		}
	},
	"Bows": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Bow"],
				"abilities" : ["Bow Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Iron Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Steel Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 5", "Bow Crit +10"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Silver Bow"],
				"abilities" : ["Bow Prowess 5", "Bow Crit +10", "Axefaire"],
				"arts": [],
			}
		}
	},
	"Axes": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Axe"],
				"abilities" : ["Axe Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Iron Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Steel Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 5", "Axe Crit +10"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Silver Axe"],
				"abilities" : ["Axe Prowess 5", "Axe Crit +10", "Axefaire"],
				"arts": [],
			}
		}
	},
	"Reason": {
		parent: null,
		hide: true,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 5", "Reason Range +1"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : [],
				"abilities" : ["Reason Prowess 5", "Reason Range +1","Reason Tomefaire"],
				"arts": [],
			}
		},
	},
	"Ice": {
		parent: "Reason",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Blizzard"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Blizzard", "Frostbite"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Blizzard", "Frostbite", "Fimbulvetr"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Blizzard", "Frostbite", "Fimbulvetr"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Fire": {
		parent: "Reason",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Fire"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Fire", "Bolganone"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Fire", "Bolganone", "Ragnarok"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Fire", "Bolganone", "Ragnarok"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Lightning": {
		parent: "Reason",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Thundar"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Thundar", "Static Shock"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Thundar"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Thundar", "Static Shock"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Thundar"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Thundar", "Static Shock"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Thundar", "Static Shock", "Thoron"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Thundar", "Static Shock", "Thoron"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Wind": {
		parent: "Reason",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Wind"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Wind", "Cutting Gale"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Thundar", "Cutting Gale", "Excalibur"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Force": {
		parent: "Reason",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Pugni"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Pugni", "Sagittae"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Pugni", "Sagittae", "Agnea's Arrow"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Brawl": {
		parent: null,
		hide: true,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 5", "Brawl Crit +10"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : [],
				"abilities" : ["Brawl Prowess 5", "Brawl Crit +10","Fistfaire"],
				"arts": [],
			}
		},
	},
	"Metal": {
		parent: "Brawl",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Iron Fist Technique", "Steel Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Iron Fist Technique", "Steel Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Iron Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Iron Fist Technique", "Steel Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Iron Fist Technique", "Steel Fist Technique", "Silver Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Iron Fist Technique", "Steel Fist Technique", "Silver Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Beast": {
		parent: "Brawl",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Howling Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Howling Fist Technique", "Bellowing Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Howling Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Howling Fist Technique", "Bellowing Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Howling Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Howling Fist Technique", "Bellowing Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Howling Fist Technique", "Bellowing Fist Technique", "Roaring Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Howling Fist Technique", "Bellowing Fist Technique", "Roaring Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Water": {
		parent: "Brawl",
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Swift Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Swift Fist Technique", "Graceful Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Swift Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Swift Fist Technique", "Graceful Fist Technique"],
				"abilities" : [],
				"arts": [],
			}
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Swift Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Swift Fist Technique", "Graceful Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Swift Fist Technique", "Graceful Fist Technique", "Serene Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Swift Fist Technique", "Graceful Fist Technique", "Serene Fist Technique"],
				"abilities" : [],
				"arts": [],
			},
		},
	},
	"Faith": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Banish", "Heal"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Banish", "Heal", "Seraphim"],
				"abilities" : ["Faith Prowess 4"],
				"arts": [],
			},
			16 : {
				"points"    : 31,
				"weapons"   : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess 5", "Faith Range +1"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Banish", "Heal", "Seraphim", "Aura"],
				"abilities" : ["Faith Prowess 5", "Faith Range +1", "Faith Tomefaire"],
				"arts": [],
			}
		}
	},
	"Guile": {
		parent: null,
		hide: false,
		1 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Miasma"],
				"abilities" : ["Guile Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : ["Miasma"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			15 : {
				"points"    : 16,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			26 : {
				"points"    : 40,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			31 : {
				"points"    : 53,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 4"],
				"arts": [],
			},
			37 : {
				"points"    : 80,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 5"],
				"arts": [],
			},
		},
		2 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Miasma"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			4 : {
				"points"    : 4,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			9 : {
				"points"    : 8,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			16 : {
				"points"    : 18,
				"weapons"   : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			21 : {
				"points"    : 26,
				"weapons"   : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess 4"],
				"arts": [],
			},
			28 : {
				"points"    : 40,
				"weapons"   : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess 5"],
				"arts": [],
			},
		},
		3 : {
			1 : {
				"points"    : 2,
				"weapons"   : ["Miasma"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			3 : {
				"points"    : 4,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			6 : {
				"points"    : 8,
				"weapons"   : ["Miasma", "Banshee"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			11 : {
				"points"    : 19,
				"weapons"   : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : ["Miasma", "Banshee", "Mire"],
				"abilities" : ["Guile Prowess 4"],
				"arts": [],
			},
			16 : {
				"points"    : 34,
				"weapons"   : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess 5"],
				"arts": [],
			},
			28 : {
				"points"    : 78,
				"weapons"   : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess 5", "Guile Range +1"],
				"arts": [],
			},
			33 : {
				"points"    : 101,
				"weapons"   : ["Miasma", "Banshee", "Mire", "Hades"],
				"abilities" : ["Guile Prowess 5", "Guile Range +1", "Guile Tomefaire"],
				"arts": [],
			}
		},
	},
	"None": {
		parent: null,
		hide: false,
		1: {},
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
				"weapons"   : [["Iron Axe", "Bound"]],
				"abilities" : ["Axe Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess 2"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Iron Axe", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Ranged", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Iron Axe", "Refined", "Bound"],
					["Iron Axe", "Killer", "Bound"],
					["Iron Axe", "Ranged", "Bound"],
					["Iron Axe", "Devil", "Bound"]
				],
				"abilities" : ["Axe Prowess 5"],
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
				"weapons"   : [["Iron Lance", "Bound"]],
				"abilities" : ["Lance Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess 2"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Iron Lance", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Ranged", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Iron Lance", "Refined", "Bound"],
					["Iron Lance", "Killer", "Bound"],
					["Iron Lance", "Ranged", "Bound"],
					["Iron Lance", "Devil", "Bound"]
				],
				"abilities" : ["Lance Prowess 5"],
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
				"weapons"   : [["Iron Sword", "Bound"]],
				"abilities" : ["Sword Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess 2"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Iron Sword", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Ranged", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Iron Sword", "Refined", "Bound"],
					["Iron Sword", "Killer", "Bound"],
					["Iron Sword", "Ranged", "Bound"],
					["Iron Sword", "Devil", "Bound"]
				],
				"abilities" : ["Sword Prowess 5"],
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
				"weapons"   : [["Miasma", "Bound"]],
				"abilities" : ["Guile Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [
					["Miasma", "Bound"], 
					["Banshee", "Bound"]
				],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [
					["Miasma", "Bound"], 
					["Banshee", "Bound"],
					["Swarm", "Bound"]
				],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Miasma", "Bound"], 
					["Banshee", "Bound"],
					["Swarm", "Bound"],
					["Death", "Bound"]
				],
				"abilities" : ["Guile Prowess 4"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Banshee", "Bound"], 
					["Swarm", "Bound"],
					["Death", "Bound"],
					["Hades", "Bound"]
				],
				"abilities" : ["Guile Prowess 5"],
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
				"weapons"   : [["Ectoplasm", "Bound"]],
				"abilities" : ["Guile Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [
					["Ectoplasm", "Bound"], 
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess 2"],
				"arts": [],
			},
			10 : {
				"points"    : 6,
				"weapons"   : [
					["Ectoplasm", "Bound"], 
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess 3"],
				"arts": [],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Ectoplasm", "Bound"], 
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess 4", "Heartseeker"],
				"arts": [],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Ectoplasm", "Bound"], 
					["Ectoplasm", "Refined", "Bound"]
				],
				"abilities" : ["Guile Prowess 5", "Heartseeker"],
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
				"weapons"   : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess 2"],
				"arts": ["Foul Play"],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess 3", "Alert Stance"],
				"arts": ["Confusion", "Foul Play"],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess 4", "Alert Stance"],
				"arts": ["Poisoned", "Confusion", "Foul Play"],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [["Hex", "Bound"]],
				"abilities" : ["Guile Prowess 5", "Alert Stance+"],
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
				"weapons"   : [["Heal", "Bound"]],
				"abilities" : ["Faith Prowess 1"],
				"arts": [],
			},
			5 : {
				"points"    : 4,
				"weapons"   : [["Heal", "Bound"]],
				"abilities" : ["Faith Prowess 2"],
				"arts": ["Foul Play"],
			},
			10 : {
				"points"    : 8,
				"weapons"   : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"]
				],
				"abilities" : ["Faith Prowess 3", "Crit +10"],
				"arts": ["Foul Play"],
			},
			15 : {
				"points"    : 31,
				"weapons"   : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"],
					["Heal", "Treatment: Destructive", "Bound"]
				],
				"abilities" : ["Faith Prowess 4", "Crit +10"],
				"arts": ["Foul Play"],
			},
			25 : {
				"points"    : 66,
				"weapons"   : [
					["Heal", "Bound"],
					["Heal", "Treatment: Restorative", "Bound"],
					["Heal", "Treatment: Abundant", "Bound"],
					["Heal", "Treatment: Destructive", "Bound"]
				],
				"abilities" : ["Faith Prowess 5", "Crit +10"],
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

class Presetter {

	static KITS = KITS;

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

	constructor() {

		this._preset  = Preset.select();

		this._class   = Class.select(() => {

			const build = Class.get(
				this._class.value
			);

			this._preset._select.value = build.default_preset;
			this._mainarm.value        = build.default_mainarm;
			this._sidearm.value        = build.default_sidearm;
			console.log(build);
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

		this._mainarm = element("select",
			Array.from(Object.entries(KITS)
				.filter(kv => {
					const [key, value] = kv;
					return !value.hide && key != "None";
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
			"simple-border",
		);

		this._sidearm = element("select",
			Array.from(Object.entries(KITS)
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
			"simple-border",
		);

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

		this.root = element("div", [
			element("strong", "Generate NPC"), element("br"),
			
			uniqueLabel("Class", this._class.root), element("br"),
			this._class.root, element("br"),

			uniqueLabel("Build", this._preset.root), element("br"),
			this._preset.root, element("br"),

			uniqueLabel("Main Weapon", this._mainarm), element("br"),
			this._mainarm, element("br"),

			uniqueLabel("Side Weapon", this._sidearm), element("br"),
			this._sidearm, element("br"),

			uniqueLabel("Level", this._level), element("br"),
			this._level, this.confirm, element("br"),
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

}

return Presetter;

})();

/* exported Presetter */
