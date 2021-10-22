/**
 * A module that implements the main data model for the sheet
 * @module feature
 */

/* global PostfixExpression */

let CACHE, PFE_COMPILER;

/**
 * A class to represent customization features that modify a unit's statistics.
 * Instances of this class are immutable.
 */
class Feature {

	static byName;

	/**
	 * An "empty" feature instance, with completely default values
	 */
	static EMPTY;

	static kind = "feature";

	/**
	 * Immutable empty object instance to preven unnessecary allocation. 
	 * @constant
	 * @type {Object}
	 * @default
	 * @private
	 */
	static EMPTY_OBJECT = Object.freeze({});

	/**
	 * Attributes that can be either numbers or strings representing
	 * {@link PostfixExpression} instances tha must be compiled.
	 * @constant
	 * @type {Array}
	 * @default
	 * @private
	 */
	static STATS_ATTRIBUTES = Object.freeze(["modifiers", "multipliers"]);

	/**
	 * Create a feature from a template object
	 */
	constructor(template) {
		this.name        = template.name || "";
		this.description = template.description || "";
		this.type        = template.type || "";
		// this.modifiers   = Object.freeze(template.modifiers || Feature.EMPTY_OBJECT);
		// this.multipliers = Object.freeze(template.multipliers || Feature.EMPTY_OBJECT);
		this.tags        = Object.freeze(template.tags || Feature.EMPTY_OBJECT);
		this.hidden      = template.hidden || false;

		for (let attribute of Feature.STATS_ATTRIBUTES) {

			if (!(attribute in template && template[attribute])) {
				this[attribute] = Feature.EMPTY_OBJECT;
				continue;
			}

			const stats = template[attribute];

			for (let key in stats) {
				const value = stats[key];
				if (typeof value == "string") {
					// const pfe = PFE_COMPILER.compile(value, CACHE);
					// if (pfe instanceof Error) throw pfe;
					// stats[key] = pfe;
					console.log(template);
					break;
				}
			}

			this[attribute] = Object.freeze(stats);
		}

		if (!this.multipliers) {
			console.log(this);
		}

		
		// These objects are just references for value and as such should not
		// be mutable. If this is not a super() call, freeze the object.
		if (new.target === Feature) {
			Object.freeze(this);
		}
	}

	/**
	 * Populate the lookup map for this class
	 * @param {Object} defintions - json game data
	 */
	static setLookupByName(iterable) {

		// initialize the "empty" feature on first invocation
		if (this.EMPTY === undefined) {
			this.EMPTY = new this(this.EMPTY_OBJECT);
		}

		// initialize the map on first invocation
		if (this.byName === undefined) {
			this.byName = new Map();
		}

		// clear existing values and refill map
		this.byName.clear();
		for (let template of iterable[this.kind]) {
			const instance = new this(template);
			this.byName.set(instance.name, instance);
		}
	}

	/**
	 * Returns an instance of this feature. If name is passed, attempts to find
	 * a feature in the lookup table with that name. If one is not found, or
	 * name is nullish, returns an "empty" feature instance.
	 * @param {string} name - optional name of feature to get
	 * @returns {Feature} a feature instance
	 */
	static get(name) {
		return (
			name && this.byName.has(name)
				? this.byName.get(name)
				: this.EMPTY
		);
	}

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {
		return this.name + " (" + this.type + ") ";
	}

	/**
	 * Generate a feature's {@link CategoryElement} description
	 * @return {string} description for this item's {@link CategoryElement}
	 */
	body() {
		return this.description;
	}

	/**
	 * Get the value of this feature's modifier for a statistic
	 * @param {string} stat - name of the stat to get the modifier for
	 * @returns {number} the modifier for the stat, or 0 if none exists
	 */
	modifier(stat) {
		// return this.modifiers[stat] || 0;
		if (!this.modifiers[stat]) return 0;

		const value = this.modifiers[stat];
		if (value instanceof PostfixExpression) return value.result();
		return value;
	}

	/**
	 * Get the value of this feature's multipier for a statistic
	 * @param {string} stat - name of the stat to get the multiplier for
	 * @returns {number} the multiplier for the stat, or 1 if none exists
	 */
	multiplier(stat) {
		// return this.multipliers[stat] || 1;
		if (!this.multipliers[stat]) return 1;

		const value = this.multipliers[stat];
		if (value instanceof PostfixExpression) return value.result();
		return value;
	}

	/**
	 * Get the value of this feature's tag for a statistic. A "tag" in this case
	 * is an optional property that isn't a direct modifier or multiplier
	 * @param {string} name - the name of the tag
	 * @returns {boolean} the value of the tag if it exists, null otherwise
	 */
	tag(name) {
		return this.tags[name] || false;
	}
}

/**
 * A {@link Feature} subclass that heavily governs attack calculations.
 */
class AttackFeature extends Feature {

	/**
	 * Create an AttackFeature from a template object
	 */
	constructor(template) {
		super(template);
		this.rank  = template.rank || "";

		// If this is not a super() call, freeze the object.
		if (new.target === CombatArt) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a {@link CategoryElement} description
	 * @return {string} description for this feature's {@link CategoryElement}
	 */
	body() {
		return (
			(this.higherMight()
				? "Might: " + this.higherMight() + ", "
				: "")
			+ (this.modifier("hit")
				? "Hit: " + this.modifier("hit") + ", "
				: "")
			+ (this.modifier("avo") 
				? "Avo: " + this.modifier("avo") + ", "
				: "")
			+ (this.modifier("crit")
				? "Crit: " + this.modifier("crit") + ", " : "")
			+ (this.modifier("cost")
				? "Cost: " + this.modifier("cost") + ", " : "")
			+ "Range: "
				+ (this.modifier("minrng") == this.modifier("maxrng")
					? this.modifier("minrng")
					: this.modifier("minrng") + "-" + this.modifier("maxrng"))
				+ "\n"
			+ this.description
		);
	}

	/**
	 * Test whether this feature would deal magic-based damage using its
	 * "mmt" and "pmt" statistic modifiers, if it has them.
	 * @returns {boolean} true if it deals magic-based damage, false otherwise
	 */
	isMagicDamage() {
		return this.modifier("mmt") > this.modifier("pmt");
	}

	/**
	 * Access the higher might stat for the AttackFeature
	 * @returns {number} the value of the higher might stat
	 */
	higherMight() {
		return Math.max(this.modifier("pmt"), this.modifier("mmt"));
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute, additional
 * optional damage scaling based off of a stat, and boolean tags.
 */
class CombatArt extends AttackFeature {

	static kind = "combatarts";

	/**
	 * Generate a combat art's {@link CategoryElement} title
	 * @return {string} title for this combat this's {@link CategoryElement}
	 */
	title() {
		return " " + this.name + " (Rank " + this.rank + " " + this.type + " Art) ";
	}
}

/**
 * An extension of {@link Feature} that adds a skill rank attribute
 */
class Weapon extends AttackFeature {

	static kind = "weapons";

	/**
	 * Generate a weapon's {@link CategoryElement} title
	 * @return {string} title for this weapon's {@link CategoryElement}
	 */
	title() {
		return " " + this.name + " (Rank " + this.rank + " " + this.type + ") ";
	}

	static PROWESS_CONVERSION = new Map([
		["Axe"         , "Axe Prowess"],
		["Sword"       , "Sword Prowess"],
		["Lance"       , "Lance Prowess"],
		["Bow"         , "Bow Prowess"],
		["Light Magic" , "Faith"],
		["Dark Magic"  , "Guile"],
		["Anima"       , "Reason"],
		["Other"       , "Other Prowess"],
	]);

	static PROWESS_REGEXP = new RegExp("(.+) Lv (\\d)");

	/**
	 * Get the best Prowess family ability to equip when using thiw weapon from
	 * the provided iterable of abilties.
	 * @param abilities - an iterable of abilties
	 * @return the highest level compatible prowess, or null
	 */
	getBestProwessOf(abilities) {

		let   best  = null;
		let   maxlv = 0; 
		const good  = Weapon.PROWESS_CONVERSION.get(this.type);

		for (let ability of abilities) {
			
			const match = ability.name.match(Weapon.PROWESS_REGEXP);
			if (!match) continue;

			// eslint-disable-next-line no-unused-vars
			const [_, type, level] = match;
			if (type != good) continue;

			if (!best || Number(level) > maxlv) {
				best  = ability;
				maxlv = level;
			}
		}

		return best;
	}
}

/**
 * An extension of {@link Feature} that adds growths, abilities, and an optional
 * internal {@link Feature} instance representing a mount.
 */
class Class extends Feature {

	static kind = "classes";

	/**
	 * Create a class from a template object
	 */
	constructor(template) {
		super(template);
		this.abilities = template.abilities;
		this.growths   = Object.freeze(template.growths);
		this.mount     = template.mount ? new Feature(template.mount) : null;

		if (new.target === CombatArt) {
			Object.freeze(this);
		}
	}

	/**
	 * Get the value of this feature's modifier for a statistic, factoring in the
	 * modifiers of the unit's mount, if they are mounted and have one.
	 * @param {string} stat - name of the stat to get the modifier for
	 * @returns {number} the modifier for the stat, or 0 if none exists
	 */
	modifier(stat, mounted=false) {
		return (
			super.modifier(stat)
				+ (mounted && this.hasMount()
					? this.mount.modifier(stat)
					: 0)
		);
	}

	/**
	 * Get the value of this feature's growth modifier for a statistic
	 * @param {string} stat - name of the stat to get the growth modifier for
	 * @returns {number} the growth modifier for the stat, or 0 if none exists
	 */
	growth(stat) {
		return this.growths[stat] || 0;
	}

	/**
	 * Test whether this character class has an associate mount
	 * @returns {boolean} true if there is a mount, false otherwise
	 */
	hasMount() {
		return Boolean(this.mount);
	}
}

/**
 * A Feature subclass to represent abilities.
 */
class Ability extends Feature {

	static kind = "abilities";

	constructor(template) {
		super(template);
		this.weapon = template.weapon || "";

		if (new.target === Ability) {
			Object.freeze(this);
		}
	}

	/**
	 * Generate a feature's {@link CategoryElement} title
	 * @return {string} title for this item's {@link CategoryElement}
	 */
	title() {
		return (
			this.name
			+ " ("
			+ (this.weapon ? this.weapon + " " : "")
			+ this.type
			+ ") "
		);
	}

}

/**
 * A Feature subclass to repersent equipment
 */
class Equipment extends Feature {

	static kind = "equipment";

}

/* exported Ability */
/* exported Class */
/* exported CombartArt */
/* exported Weapon */ 
/* exported Equipment */
