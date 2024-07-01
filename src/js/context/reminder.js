/**
 * @module reminder
 */

/* global
	Filter,
	element, inBrowser, tooltip
*/

/* global
	Markup
*/

/* global
	Ability, Adjutant, Art, Attribute, Class, Condition,
	Equipment, Gambit, Item, Tile 
*/

if (typeof require !== "undefined") {

	/* global require */

	/* eslint-disable no-global-assign */
	({
		Filter,
		element, inBrowser, tooltip
	}           = require("../common.js"));
	// ({
	// 	Ability, Adjutant, Art, Attribute, Class, Condition, Equipment, Gambit,
	// 	Item, Tile 
	// }           = require("../feature.js"));
	(  Markup   = require("../lang/markup.js"));
	/* eslint-enable no-global-assign */
}

const Reminder = (function () {

function getFeatureNamespace(definitions) {
	const namespaces = new Map([
		[ "item"      , Item    ],
		[ "condition" , Condition ],
		[ "ability"   , Ability   ],
		[ "art"       , Art ],
		[ "attribute" , Attribute ],
		[ "tile"      , Tile      ],
		[ "equipment" , Equipment ],
		[ "class"     , Class     ],
		[ "gambit"    , Gambit    ],
		[ "adjutant"  , Adjutant  ],

		["", {
			get: function() {
				return this;
			},

			body: function() {
				return "This feature.";
			},

			select: function(trigger) {

				trigger = trigger || (() => {});

				return new Filter.Select({
					value   : this.DEFAULT,
					trigger : trigger,
					model   : this,
					options : [],
					content : [],
				});
			}
		}],

		["const", {

			features: (function() {

				const map = new Map();

				for (let key in definitions.tooltips) {
					map.set(key, {

						name: definitions.tooltips[key].name,

						text: definitions.tooltips[key].description.join(""),

						body: function() {
							return Markup.toDeadLinks(namespaces, this.text);
						}
					});
				}

				return map;
			})(),

			get: function(link) {

				if (!this.features.has(link)) {
					throw new ReferenceError(
						`tooltip constant text for ${link} is not defined`
					);
				}

				return this.features.get(link);
			},

			DEFAULT: "gbp",

			name: "Premade Tooltip",

			select: function(trigger) {

				trigger = trigger || (() => {});

				return new Filter.Select({
					value   : this.DEFAULT,
					trigger : trigger,
					model   : this,
					options : Object.keys(definitions.tooltips).map(cls => 
						element("option", {
							attrs   : {value: cls},
							content : cls,
						})
					),
					content : [],
				});
			}
		}],

		["tooltip", {

			text: "",

			get: function() {
				return this;
			},

			body: function() {
				return "If you see this, an error has occured!";
			},

			name: "Custom Tooltip",

			select: function(trigger) {
				trigger = trigger || (() => {});

				const text = element("input", {
					class : ["simple-border"],
					attrs : {
						"placeholder" : "text",
						"type"        : "text",
					}
				});

				/* this mimics a Filter.Select object */
				return {
					_select : text,
					root    : element("span", [
						tooltip(text, []),
					]),
				};
			}
		}],

		["style", {

			text: "",

			get: function() {
				return this;
			},

			body: function() {
				return "If you see this, an error has occured!";
			},

			name: "Text Style",

			select: function(trigger) {

				trigger = trigger || (() => {});

				const styles = ["bold", "italic", "underline", "table"];

				return new Filter.Select({
					value   : this.DEFAULT,
					trigger : trigger,
					model   : this,
					options : styles.map(cls => 
						element("option", {
							attrs   : {value: cls},
							content : cls,
						})
					),
					content : [],
				});
			}

		}]

	]);

	return namespaces;
}

function mappify(list) {
			
	const map = new Map();

	for (let feature of list) {
		map.set(feature.name, feature);
	}

	return map;
}

function getValidationNamespace(definitions) {
	return new Map([
		[ "item"      , mappify(definitions["items"])      ],
		[ "condition" , mappify(definitions["conditions"]) ],
		[ "ability"   , mappify(definitions["abilities"])  ],
		[ "art"       , mappify(definitions["arts"])       ],
		[ "attribute" , mappify(definitions["attributes"]) ],
		[ "tile"      , mappify(definitions["tiles"])      ],
		[ "equipment" , mappify(definitions["equipment"])  ],
		[ "class"     , mappify(definitions["classes"])    ],
		[ "gambit"    , mappify(definitions["gambits"])    ],
		[ "const"     , (function () {

			const map = new Map();

			for (let each in definitions.tooltips) {
				map.set(each, definitions.tooltips[each]);
			}

			return map;

		})()]
	]);
}

return {
	getNamespace: inBrowser ? getFeatureNamespace : getValidationNamespace
};

})();

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = Reminder;

}

/* exported Reminder */
