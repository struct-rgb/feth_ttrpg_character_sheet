

/* global Version */
/* global Class */
/* global Characters */

const Legacy = (function() {

function from_1_18_0(old) {

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

function current(old) {
	return old;
}

const VERS = [
	[ new Version("1.13.0") , current     ],
	[ new Version("1.16.0") , current     ],
	[ new Version("1.18.0") , current     ],
	[ new Version( "2.0.0") , from_1_18_0 ],
	[ new Version("99.0.0") , current     ],
];

function convert(obj, to=Version.CURRENT) {

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
		return from_1_18_0(obj);
	}

	return obj;
}

return {
	convert,
};

})();

/* exported Legacy */
