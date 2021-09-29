
"use strict";

var sheet, definitions;

/**
 * Used to cause an error whenever an abstract base method is invoked
 */
function unimplemented() {
	throw new Error("Invocation of unimplemented function or method")
}

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
	 * @constant
	 * @type {Object}
	 * @default
	 */
	static EMPTY_OBJECT = {};

	/**
	 * Create a feature from a template object
	 */
	constructor(template) {
		this.name        = template.name || "";
		this.description = template.description || "";
		this.type        = template.type || "";
		this.modifiers   = Object.freeze(template.modifiers || Feature.EMPTY_OBJECT);
		this.multipliers = Object.freeze(template.multipliers || Feature.EMPTY_OBJECT);
		this.hidden      = template.hidden || false;
		
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
		this.byName.clear()
		for (let template of iterable[this.kind]) {
			const instance = new this(template);
			this.byName.set(instance.name, instance);
		}
	}

	/**
	 * Returns an instance of this feature. If name is passed, attempts to find
	 * a feature in the lookup table with that name. If one is not found, or
	 * name is nullish, returns an "empty" feature instance.
	 * @param {string} optional name of feature to get
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
		return this.modifiers[stat] || 0;
	}

	/**
	 * Get the value of this feature's multipier for a statistic
	 * @param {string} stat - name of the stat to get the multiplier for
	 * @returns {number} the multiplier for the stat, or 1 if none exists
	 */
	multiplier(stat) {
		return this.multipliers[stat] || 1;
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
		this.tags  = Object.freeze(template.tags || Feature.EMPTY_OBJECT);

		// If this is not a super() call, freeze the object.
		if (new.target === CombatArt) {
			Object.freeze(this);
		}
	}

	/**
	 * Get the value of this feature's tag for a statistis. A "tag" in this case
	 * is an optional property that isn't a direct modifier or multiplier
	 * @param {string} name - the name of the tag
	 * @returns {boolean} the value of the tag if it exists, null otherwise
	 */
	tag(name) {
		return this.tags[name] || false;
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
		return this.growths[datum] || 0;
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

}

/**
 * A Feature subclass to repersent equipment
 */
class Equipment extends Feature {

	static kind = "equipment";

}

/**
 * Class representing a skill grade
 */
class Grade {

	static list = [
		new Grade("E",  0), new Grade("E+",  1),
		new Grade("D",  2), new Grade("D+",  4),
		new Grade("C",  8), new Grade("C+", 12),
		new Grade("B", 18), new Grade("B+", 25),
		new Grade("A", 32), new Grade("A+", 40),
		new Grade("S", 50), new Grade("S+", 60), 
	];

	/**
	 * Converts a number of points to the corresponding letter grade
	 * @static
	 * @param {number} points - number of points
	 * @returns {string} the letter grade
	 */
	static for(points) {
		return Grade.list.reduce((a, b) => b.points > points ? a : b).name;
	}

	/**
	 * Create a grade
	 * @param {string} name - letter for the grade
	 * @param {number} points - minimum number of points to acheive the grade
	 */
	constructor(name, points) {
		this.name   = name;
		this.points = points;
	}
}

/**
 * Compound html element for creating toggleable/removable dl tag entries
 * intended to be used as members of a {@link Category} object.
 */
class CategoryElement {

	/**
	 * Create an element
	 * @param {Feature} feature - the feature for this element
	 * @param {boolean} shiftable - whether to add buttons to allow reordering
	 * @param {CategoryElement~cb} toggleFn - invoked on element toggle
	 * @param {CategoryElement~cb} removeFn - invoked on remove button click, button not added if omitted
	 */
	constructor(feature, shiftable, toggleFn, removeFn) {

		const element = this;

		const toggle  = () => {
			element.active = !element.active;
			if (this.updown) element.updown.focus();
			toggleFn();
		};

		// assign attributes
		this._active     = false;
		this.feature     = feature;
		this.title       = feature.title();
		this.description = feature.body();

		// go about building the DOM nodes
		this.dt = document.createElement("dt");
		this.dt.setAttribute("data-feature-name", feature.name);

		if (shiftable) {

			const updown   = document.createElement("input");
			updown.type    = "number";
			updown.value   =  0;
			updown.max     = +1;
			updown.min     = -1;

			const callback = (event) => {
				switch (Number(updown.value)) {
					case +1:
						element.shiftBefore(1);
						break;
					case -1:
						element.shiftAfter(1);
						break;
					default:
						break;
				}
				updown.value = 0;
				updown.focus();
			};
			
			updown.onchange = callback;
			updown.classList.add("updown-buttons");
			this.dt.appendChild(updown);
			this.updown = updown;
		} else {
			this.updown = null;
		}

		// add entry title content
		const span = document.createElement("span");
		span.appendChild(document.createTextNode(this.title));
		span.classList.add("selectable");
		span.onclick = toggle;
		this.span = span;
		this.dt.appendChild(span);

		// if remove function is not, make a "remove" button
		if (removeFn != null) {
			this.removeButton         = document.createElement("input");
			this.removeButton.value   = "❌";
			this.removeButton.type    = "button";
			this.removeButton.onclick = removeFn;
			this.removeButton.classList.add("simple-border");
			this.removeButton.classList.add("remove-button");
			this.dt.appendChild(this.removeButton);
		} else {
			this.removeButton = null;
		}

		// add entry content description
		this.dd = document.createElement("dd");
		this.dd.appendChild(document.createTextNode(this.description));

		// this belongs to no category by default
		this.parent = null;
	}

	get active() {
		return this._active;
	}

	set active(value) {
		// nothing to do; no change occurred
		if (value == this.active) return;

		if (value) {
			this.span.classList.add("selected-text");
		} else {
			this.span.classList.remove("selected-text");
		}

		this._active          = value;
	}

	/**
	 * Shift this element toward the front of the {@link Category}
	 * If the offset is too large, the element is placed at the front
	 * @param {number} offset - number of places forward to shift
	 */
	shiftBefore(offset) {
		if (!this.parent) return;

		offset *= 2;
		for (let element of [this.dt, this.dd]) {
			for (let i = 0; i < offset; ++i) {
				const sibling = element.previousElementSibling;
				
				if (!sibling) {
					offset = i;
					break;
				}

				sibling.insertAdjacentElement("beforeBegin", element);
			}
		}
	}

	/**
	 * Shift this element toward the back of the {@link Category}
	 * If the offset is too large, the element is placed at the back
	 * @param {number} offset - number of places backward to shift
	 */
	shiftAfter(offset) {
		if (!this.parent) return;

		offset *= 2;
		for (let element of [this.dd, this.dt]) {
			for (let i = 0; i < offset; ++i) {
				const sibling = element.nextElementSibling;

				if (!sibling) {
					offset = i;
					break;
				}

				sibling.insertAdjacentElement("afterEnd", element);
			}
		}
	}

	/**
	 * Add this element to a parent dl tag
	 * @param parent - an html dl tag
	 */
	addTo(parent) {
		// this should not belong to multiple parents at once
		if (this.parent) return;
		this.parent = parent;
		parent.appendChild(this.dt);
		parent.appendChild(this.dd);
	}

	/**
	 * Remove this element from its parent
	 */
	remove() {
		// cannot remove this if it has no parent
		if (!this.parent) return;
		this.dt.parentNode.removeChild(this.dt);
		this.dd.parentNode.removeChild(this.dd);
		this.parent = null;
	}
}

/**
 * An argumentless callback invoked upon interraction with a CategoryElement
 * @callback CategoryElement~cb
 */

/**
 * A compount element composed of a dl tag, with the option to add
 * toggleable/removable entries with a select tag.
 */
class Category {

	/**
	 * Create a category
	 * @param {Function} feature - the feature class to draw entries info from
	 * @param {string} name - a name to identify this category
	 * @param {boolean} learnable - whether a select element should be included
	 * @param {boolean} shiftable - whether elements should be able to be shifted up and down
	 * @param {Category~cb} ontoggle - invoked when a {@link CategoryElement} is toggled
	 * @param {Category~cb} onremove - invoked when a {@link CategoryElement}'s remove button is clicked, optional
	 */
	constructor(feature, name, learnable, shiftable, ontoggle, onremove) {

		const category = this;

		this.name      = name;
		this.feature   = feature;
		this.parent    = null;
		this.ontoggle  = ontoggle;
		this.onremove  = onremove;
		this.next      = null;
		this.prev      = null;
		this.elements  = new Map();
		this.shiftable = shiftable;

		// go about building the DOM nodes
		if (!learnable) {
			this.select = null;
		} else {

			// create a button to add a new element
			this.addButton         = document.createElement("input");
			this.addButton.value   = "Add";
			this.addButton.type    = "button";
			this.addButton.onclick = () => {
				category.add(category.select.value)
			};
			this.addButton.classList.add("simple-border");
			// parent.appendChild(this.addButton);

			// create a selector of valid values
			this.select = document.createElement("select");
			this.select.classList.add("simple-border");
			for (let item of this.feature.byName.values()) {
				if ("hidden" in item && item.hidden) continue;
				const option = document.createElement("option");
				option.value = item.name;
				option.appendChild(document.createTextNode(item.name));
				this.select.appendChild(option);
			}
			// parent.appendChild(this.select);
		}

		this.dl = document.createElement("dl");
		// parent.appendChild(this.dl);
	}

	/* methods for attaching to the DOM */

	/**
	 * Add this Category to a parent html element
	 * @param parent - the element to add to
	 */
	addTo(parent) {
		// this should not belong to multiple parents at once
		if (this.parent) return;

		this.parent = parent;

		if (this.select) {
			parent.appendChild(this.addButton);
			parent.appendChild(this.select);
		}
		parent.appendChild(this.dl);
	}

	/**
	 * Remove this Category from its parent html element
	 */
	remove() {
		// cannot remove this if it has no parent
		if (!this.parent) return;

		this.parent = null;

		if (this.select) {
			this.addButton.parentNode.removeChild(this.addButton);
			this.select.parentNode.removeChild(this.select);
		}
		this.dl.parentNode.removeChild(this.dl);
	}

	/* methods for managing active items*/

	/**
	 * Test whether an element with the given name is active
	 * @abstract
	 * @param {string} name - name of the element to test
	 * @returns {boolean} whether the element is active
	 */
	isActive (name) {
		unimplemented();
	}

	/**
	 * Toggles whether an element is active or inactive
	 * @abstract
	 * @param {string} name - name of the element to toggle
	 * @returns {boolean} whether the toggle was successful
	 */
	toggleActive (name) {
		unimplemented();
	}

	/**
	 * Access the names of any active elemets
	 * @abstract
	 * @returns names of acive elements
	 */
	getActive() {
		unimplemented();
	}

	/**
	 * Make it so that no element is active
	 * @abstract
	 */
	clearActive () {
		unimplemented();
	}

	/* link to categories to allow certain operations to cascade */

	/**
	 * Joins this to another category as elements of a doubly linked list in
	 * order to allow some actions to cascade from one category to the other.
	 * This object forms the head and the other forms the tail.
	 * @param {Category} that - the other category
	 */
	link(that) {
		this.next = that;
		that.prev = this;
	}

	/* methods for adding and removing elements */

	/**
	 * Return whether this has a specific element
	 * @param {string} name - the name of the element
	 * @returns {boolean} true if it is present, else false
	 */
	has(name) {
		return this.elements.has(name);
	}

	/**
	 * Adds an element with the given name. The name must exist in this
	 * Category's feature's lookup table.
	 * @param {string} name - the name of the element to add
	 * @returns {boolean} true if an element was added, else false
	 */
	add(name) {
		// prevent adding illegal items
		if (!this.feature.byName.has(name)) return false;

		// prevent the addition of duplicate items
		if (this.elements.has(name)) return false;

		const category    = this;
		const item        = this.feature.byName.get(name);
		
		const onremove    = !this.onremove ? null : (() => {
			category.onremove(name, category);
		});

		const ontoggle    = () => {
			category.ontoggle(name, category);
		};

		const element     = new CategoryElement(
			item, this.shiftable, ontoggle, onremove, 
		);

		this.elements.set(name, element);
		element.addTo(this.dl);
		return true;
	}

	/**
	 * Deletes an element with the given name, if present.
	 * @param {string} name - the name of the element to delete
	 * @returns {boolean} true if an element was deleted, else false
	 */
	delete(name) {

		// can't delete an element that isn't present
		if (!this.elements.has(name)) return false;

		// if the element is active, deactivate it 
		if (this.isActive(name)) {
			this.toggleActive(name);
		}

		// if there is a cascade, delete the from the next category first
		if (this.next && this.next.elements.has(name)) {
			this.next.delete(name);
		}

		this.elements.get(name).remove();
		this.elements.delete(name);
		return true;
	}

	/**
	 * Clears the current elements and adds new ones from the given iterable.
	 * The names must exist in this Category's feature's lookup table.
	 * @param names - an iterable collection of strings
	 * @returns {number} the number of elements added
	 */
	fill_from(names) {

		let added = 0;

		this.clear()
		for (let name of names) {
			added += this.add(name) ? 1 : 0;
		}

		return added;
	}

	/**
	 * Clears the current elements
	 */
	clear() {
		for (let element of this.elements.values()) {
			element.remove();
		}
		this.elements.clear();
		this.clearActive();
	}

	/* iterable */

	/**
	 * Get an iterator of all of the names of the feature elements in this category in display order
	 * @return iterator over the names of the feature elements of this category in display order
	 */
	*names() {
		for (let child of this.dl.children) {
			const name = child.getAttribute("data-feature-name");
			if (name) yield name;
		}
	}

	/**
	 * Get an iterator of all of the feature elements of this category in display order
	 * @return iterator over the feature elements of this category in display order
	 */
	*values() {
		for (let name of this.names()) {
			yield this.feature.byName.get(name);
		}
	}

	/**
	 * Defines the iterable function of this object
	 * @returns an iterator over the names of the elements
	 */
	*[Symbol.iterator]() {
		for (let value of this.values()) {
			yield value;
		}
	}
}

/**
 * A callback invoked upon interraction with one of a {@link Category}'s elements
 * @callback CategoryElement~cb
 * @param {string} name - the name of the element interacted with
 * @param {Category} category - the Category contain the element
 */

/**
 * An extension of {@link Category} that allows a single element to be 'activated'
 */
class SingleActiveCategory extends Category {

	/**
	 * Create a category
	 * @param {Feature} feature - the feature to draw entries info from
	 * @param {string} name - a name to identify this category
	 * @param {boolean} learnable - whether a select element should be included
	 * @param {boolean} shiftable - whether elements should be able to be shifted up and down
	 * @param {Category~cb} ontoggle - invoked when a {@link CategoryElement} is toggled
	 * @param {Category~cb} onremove - invoked when a {@link CategoryElement}'s remove button is clicked, optional
	 */
	constructor(name, feature, learnable, shiftable, ontoggle, onremove) {
		super(name, feature, learnable, shiftable, ontoggle, onremove);
		this.active = null;
	}

	/**
	 * Test whether a specific element is active
	 * @param {string} name - the name of the element to test
	 * @returns {boolean} true if active, false if not present, another element is active, or no element is active
	 */
	isActive(name) {
		return this.active == name;
	}

	/**
	 * Toggle whether a specific element is active.
	 * If no element is active, it will be made active, if another element is
	 * active it will be replaced with the given one, and if this element is
	 * active, no elements will be made active.
	 * The name must exist in this Category's feature's lookup table, and be
	 * present within the category, or else the operation does nothing.
	 * @param {string} name - the name of the element to toggle
	 * @returns {boolean} true if the toggle was successful, false otherwise
	 */
	toggleActive(name) {
		// user cannot toggle an element that isn't present
		if (!this.elements.has(name)) return false;

		if (this.active) {
			if (this.active != name) {
				this.elements.get(this.active).active = false;
				this.active = name;
			} else {
				this.active = null;
			}
		} else {
			this.active = name;
		}

		return true;
	}

	/**
	 * Get the name of the active element
	 * @returns {string} the name of the active element
	 */
	getActive() {
		return this.active;
	}

	/**
	 * Make it so that no element is active
	 */
	clearActive() {
		this.active = null;
	}

}

/**
 * An extension of {@link Category} that allows a multiple elements to be 'activated'
 */
class MultiActiveCategory extends Category {

	/**
	 * Create a category
	 * @param {Feature} feature - the feature to draw entries info from
	 * @param {string} name - a name to identify this category
	 * @param {boolean} learnable - whether a select element should be included
	 * @param {boolean} shiftable - whether elements should be able to be shifted up and down
	 * @param {Category~cb} ontoggle - invoked when a {@link CategoryElement} is toggled
	 * @param {Category~cb} onremove - invoked when a {@link CategoryElement}'s remove button is clicked, optional
	 */
	constructor(name, feature, learnable, shiftable, ontoggle, onremove) {
		super(name, feature, learnable, shiftable, ontoggle, onremove);
		this.active = new Set();
	}

	/**
	 * Test whether a specific element is active
	 * @param {string} name - the name of the element to test
	 * @returns {boolean} true if active, false if not present or not active
	 */
	isActive(name) {
		return this.active.has(name);
	}

	/**
	 * Toggle whether a specific element is active.
	 * The name must exist in this Category's feature's lookup table, and be
	 * present within the category, or else the operation does nothing.
	 * @param {string} name - the name of the element to toggle
	 * @returns {boolean} true if the toggle was successful, false otherwise
	 */
	toggleActive(name) {
		// user cannot toggle an element that isn't present
		if (!this.elements.has(name)) return false;
		const element = this.elements.get(name);

		if (this.isActive(name)) {
			this.active.delete(name);
			element.active = false;
		} else {
			this.active.add(name);
			element.active = true;
		}

		return true;
	}

	/**
	 * Toggle whether a group of elements are active.
	 * The names must exist in this Category's feature's lookup table, and be
	 * present within the category, or else the operation does nothing.
	 * @param {Array} names - the names of the elements to toggle
	 * @returns {number} the number that were successful
	 */
	toggleAllActive(names) {

		let successes = 0;
		for (let name of names) {
			if (this.toggleActive(name)) {
				successes += 1;
			}
		}

		return successes;
	}

	/**
	 * Get the set names of the active elements
	 * @returns {Set} the names of the active elements
	 */
	getActive() {
		return this.active;
	}

	/**
	 * Make it so that no elements are active
	 */
	clearActive() {
		this.active.clear();
	}
}

/**
 * Class representing the main body of the sheet.
 */
class Sheet {

	/**
	 * Initialize the sheet
	 * @param {Object} data - the json format game data
	 */
	constructor(data) {

		// set the lookup tables for each feature class
		for (let each of [Ability, Weapon, CombatArt, Equipment, Class]) {
			each.setLookupByName(data);
		}

		// main definition data object
		this.data = data;

		/* define attributes for document elements */

		/* level */
		this._input_level      = document.getElementById("level-input");
		this._output_level     = document.getElementById("level");

		/* hitpoints */
		this._input_hitpoints  = document.getElementById("hitpoints-input");
		this._output_hitpoints = document.getElementById("hitpoints");

		/* mounted */
		this._input_mounted    = document.getElementById("character-mounted");

		/* triangle */
		this._select_triangle  = document.getElementById("character-triangle");

		/* autogenerate properties for inputs with not special refresh effect */
		this.makePropertyForInput("name", "character-name", String);
		this.makePropertyForInput("homeland", "character-homeland", String);
		this.makePropertyForInput("description", "character-description", String);

		/* set default class name */
		this.class = "Commoner";

		/* populate skills, stats, and growths */
		this.cache   = {stats: {}, growths: {}};
		this.stats   = {};
		this.growths = {};
		for (let name of this.data.stats.names) {
			this.stats[name]   = 0;
			if (name == "mov") continue;
			this.growths[name] = 0;
		}

		this.skills  = {};
		for (let name of this.data.skills) {
			this.skills[name] = 0;
		}

		/* store this in local variable so closure scoping works correctly */
		const sheet = this;

		/* initialize event listener for upload */
		document
			.getElementById("import-sheet")
			.addEventListener("change", (e) => {sheet.import(e)}, false);

		/* create callbacks for category events */
		const refresh = (name, category) => {
			category.toggleActive(name);
			sheet.refreshAllStats();
		};

		const forget  = (name, category) => {
			category.delete(name);
			sheet.refreshAllStats();
		};

		const equip   = (name, category) => {
			const next = category.next;
			if (!category.next) return;

			if (category.isActive(name)) {
				if (category.next.isActive(name)) {
					category.next.toggleActive(name);
				}
				category.next.delete(name);
			} else {
				next.add(name);
			}

			category.toggleActive(name);
			sheet.refreshAllStats();
		};
		
		const unequip = (name, category) => {
			if (!category.prev) return;
			category.prev.elements.get(name).active = false;
			category.prev.toggleActive(name);
			category.delete(name);
			sheet.refreshAllStats();
		};

		/* create and add Category objects */
		const MAC = MultiActiveCategory;
		const SAC = SingleActiveCategory;

		this.abilities = {};
		this.addCat(new MAC(Ability , "class"       , false , false , refresh , null));
		this.addCat(new MAC(Ability , "equipped"    , false , true  , refresh , unequip));
		this.addCat(new MAC(Ability , "battlefield" , true  , true  , refresh , forget));
		this.addCat(new MAC(Ability , "known"       , true  , true  , equip   , forget));
		this.abilities.known.link(this.abilities.equipped);

		this.combatarts = {};
		this.addCat(new SAC(CombatArt , "equipped" , false , true   , refresh , unequip));
		this.addCat(new MAC(CombatArt , "known"    , true  , true   , equip   , forget));
		this.combatarts.known.link(this.combatarts.equipped);

		this.weapons = {};
		this.addCat(new SAC(Weapon, "known", true, true, refresh, forget));

		this.equipment = {};
		this.addCat(new SAC(Equipment, "known", true, true, refresh, forget));

		this.refresh();
	}

	/* methods relating to adding definitions */

	addDefinitions(definitions) {
		
	}

	/* methods relating to initialization */

	/**
	 * Add a {@link Category} to this sheet at sheet[feature][category]
	 * @param {Category} category - the category to add 
	 */
	addCat(category) {
		const identifier = category.feature.kind + "-" + category.name;
		const parent     = document.getElementById(identifier);

		this[category.feature.kind][category.name] = category;
		category.addTo(parent);
	}

	/**
	 * Create a getter/setter pair to access the an input element as a property
	 * @param {string} name - the name of the property
	 * @param {string} id - the identifer of the input element
	 * @param {Function} type - the type to convert to return the getter output as
	 */
	makePropertyForInput(name, id, type) {
		Object.defineProperty(this, name, {
			get: function () {
				return type(document.getElementById(id).value)
			},
			set: function (value) {
				document.getElementById(id).value = value;
			}
		});
	}

	/* methods relating to level */

	get level() {
		return Number(this._input_level.value);
	}

	set level(value) {
		this._input_level.value = value;
		this.refreshLevel();
	}

	/**
	 * Set the level displayed to be 1/100 of the number of experience points
	 */
	refreshLevel() {
		this._output_level.textContent = 1 + Math.floor(this.level / 100);
	}

	/**
	 * Increase the character's level by 1, with a probability for each stat to
	 * increase by 1 equal to the growth rate of that stat. If one or fewer stats
	 * increase, allow the user to choose one stat to increase by one instead.
	 */
	levelUp() {
		// statistics that increased from this level up
		const increases = new Set();
		const names     = this.data.stats.names.filter(
			name => name != "mov" // This ain't Jugdral, we don't do mov growth.
		);

		// for each stat, if roll succeeds increase statistic
		for (let name of names) {
			if (Math.random() * 100 <= this.cache.growths[name]) {
				increases.add(name);
			}
		}

		// if only of fewer statistics increased during level up,
		// then prompt user for stat to increase with popup
		if (increases.size <= 1) {

			let   choosen     = null;
			const prompt_text = (
				"Enter one of: " + stat_names.join(" ")
			);

			while (!names.includes(choosen)) {

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

		this.refreshAllStats();
		this.level = this.level + 100; // this.level stores exp points
	}

	/* methods relating to the health bar */

	get hitpoints() {
		return Number(this._input_hitpoints.value);
	}

	set hitpoints(value) {
		this._input_hitpoints.value = value;
		this.refreshHealthBar();
	}

	/**
	 * Update the hitpoint display, ensuring the value set is between 0 and the
	 * maximum hitpoint value determined by the character's hp stat.
	 */
	refreshHealthBar() {
		if (this.hitpoints > this.cache.stats.hp) {
			this.hitpoints = this.cache.stats.hp;
		} else if (this.hitpoints < 0) {
			this.hitpoints = 0;
		} else {
			// due to recursive setters, this gets once regarless of the result
			this._output_hitpoints.value = this.hitpoints;
		}
	}

	/**
	 * Fill the current hitpoints to a maximum hitpoint value determined by the
	 * character's hp stat.
	 */
	fillHealthBar() {
		this.hitpoints = this.cache.stats.hp;
		this.refreshHealthBar();
	}

	/* methods relating to character class */

	get mounted() {
		return this._input_mounted.checked;
	}

	set mounted(value) {
		this._input_mounted.checked = value;
		this.refreshMounted();
	}

	/**
	 * Recalculate stats when mounted status changes; prevent mounted from being
	 * set to true for classes that do not have access to a mount.
	 */
	refreshMounted() {
		if (this.mounted && !this.class.hasMount()) {
			// do not permit this box to be checked if there is no mount
			this.mounted = false;
		} else {
			// otherwise the state has changed an stats need recalculated
			this.refreshAllStats();
		}
	}

	/**
	 * When class is changed, change class abilities and reculculate stats 
	 */
	refreshClass() {

		this.class = Class.byName.get(
			document.getElementById("character-class").value
		);

		// account for whether the character is mounted before stat calcs
		this._input_mounted.checked = this.class.hasMount();

		this.abilities.class.clear();

		for (let name of this.class.abilities) {
			this.abilities.class.add(name);
		}

		for (let stat of this.data.stats.names) {
			this.refreshStat(stat);
			this.refreshGrowth(stat);
		}

		this.refreshSecondaryStats();
	}

	/* methods relating to weapon triangle */

	get triangle() {
		return Number(this._select_triangle.value);
	}

	/* methods relating to grades and skill levels */

	/**
	 * Compute and display the letter grade for a single skill
	 * @param {string} skill - name of the skill
	 */
	refreshGrade(name) {
		const base   = "skill-" + name;
		const points = Number(document.getElementById(base).value);
		const grade  = Grade.for(points);

		this.skills[name] = points;
		document.getElementById(base + "-grade").textContent = grade;
	}

	/**
	 * Compute and display the letter grades for all skills
	 */
	refreshGrades() {
		for (let name of this.data.skills) {
			this.refreshGrade(name);
		}
	}

	/* methods relating to stats and growths */

	/**
	 * Recompute and display the growth rate for a single stat
	 * @param {string} name - name of the stat
	 */
	refreshGrowth(name) {
		// TODO figure out a way to replace this with a set
		if (!this.data.stats.names.includes(name)) {
			console.log("Tried to refresh invalid growth \"" + name + "\"");
			return;
		}

		if (name == "mov") return; // We don't do movement growth here.

		const display = document.getElementById(name + "-growth-total");
		const base    = Number(document.getElementById(name + "-growth-base").value);
		
		this.growths[name] = base;

		const growth = Math.max(
			base + Number(this.class.growths[name]),
			0,
		);

		this.cache.growths[name] = growth;
		display.textContent      = growth + "%";
	}

	/**
	 * Recompute and display a single primary stat
	 * @param {string} name - name of the stat
	 */
	refreshStat(name) {
		// TODO figure out a way to replace this with a set
		if (!this.data.stats.names.includes(name)) {
			console.log("Tried to refresh invalid statistic \"" + name + "\"");
			return;
		}

		const display = document.getElementById(name + "-total");
		const base    = Number(document.getElementById(name + "-base").value);
		// const value   = Math.max(
		// 	(
		// 		  (name == "mov" ? 4 : 0)
		// 		+ ( // TODO better validation for this
		// 			this.mounted && name in this.class.mount.modifiers
		// 				? this.class.mount.modifiers[name]
		// 				: 0
		// 		)
		// 		+ this.class.modifiers[name]
		// 		+ this.modifier(name)
		// 		+ base
		// 	) * this.multiplier(name),
		// 	0,
		// );

		const value = Math.max(
			((name == "mov" ? 4 : 0)
				+ this.class.modifier(name, this.mounted)
				+ this.modifier(name)
				+ base)
			* this.multiplier(name),
			0
		); 

		this.stats[name]       = base;
		this.cache.stats[name] = value;
		display.textContent    = value;

		if (name == "hp") {
			const display   = document.getElementById("hitpoints");
			display.max     = this.cache.stats.hp;
			display.optimum = this.cache.stats.hp;
			display.high    = Math.floor(this.cache.stats.hp / 2);
			display.low     = Math.floor(this.cache.stats.hp / 4) + 1;
			this.refreshHealthBar();
		}

		this.refreshSecondaryStats();
	}

	/**
	 * Recompute and display a all primary stats
	 */
	refreshPrimaryStats() {
		for (let name of this.data.stats.names) {
			this.refreshStat(name);
		}
	}

	/**
	 * Recompute and display all secondary stats
	 */
	refreshSecondaryStats() {
		for (let [base, mod] of this.data.stats.linked) {
			const value = this.calcSecondaryStat(base, mod, this.cache);
			this.cache.stats[mod] = value;
			document.getElementById(mod + "-total").textContent = value;
		}
	}

	/**
	 * Preform an accumulation on a single statistic of all active class,
	 * equipped, and battlefield modifier or mulitplier objects, as if they
	 * were a collection
	 * @param {string} stat - the stat to reduce on
	 * @param {string} kind - either "modifier" or "mulitplier"
	 * @param {number} base - value to use if a property does not exist
	 * @param {function} func - the reduce function, takes two number arguments
	 * @returns {number} the result of the reduction
	 */
	accumulateAbilities(stat, kind, base, func) {

		let acc = base;

		for (let category of ["class", "equipped", "battlefield"]) {
			for (let name of this.abilities[category].getActive()) {
				acc = func(acc, Ability.get(name)[kind](stat));
			}
		}

		return acc;
	}

	abilityModifer(stat) {
		return this.accumulateAbilities(stat, "modifier", 0, (x, y) => x + y);
	}

	abilityMultiplier(stat) {
		return this.accumulateAbilities(stat, "multiplier", 1, (x, y) => x * y);
	}

	/**
	 * Preform an accumulation on single state from all active features
	 * weapons, equipment, and combat arts, as if they were a collection
	 * @param {string} property - the stat to reduce on
	 * @param {number} default_value - value to use if a property does not exist
	 * @param {string} kind - either "modifiers" or "mulitpliers" for abilties
	 * @param {function} func - the reduce function, takes two number arguments
	 * @returns {number} the result of the reduction
	 */
	accumulate(stat, kind, base, func) {

		let acc = this.accumulateAbilities(stat, kind, base, func);

		acc = func(acc, Weapon.get(this.weapons.known.getActive())[kind](stat));
		acc = func(acc, Equipment.get(this.equipment.known.getActive())[kind](stat));
		acc = func(acc, CombatArt.get(this.combatarts.equipped.getActive())[kind](stat));

		return acc;
	}

	/**
	 * Get the sum of the modifiers for a single property for all active
	 * abilities, weapons, equiptment, and combat arts
	 * @param {string} name - name of the stat property
	 * @returns {number} the sum of all modifiers
	 */
	modifier(name) {
		return this.accumulate(name, "modifier", 0, (x, y) => x + y);
	}

	/**
	 * Get the product of the multipliers for a single property for all active
	 * abilities
	 * @param {string} name - name of the stat property
	 * @returns {number} the product of all multipliers
	 */
	multiplier(name) {
		return this.accumulate(name, "multiplier", 1, (a, b) => a * b);
	}

	/**
	 * Compute the value of a secondary stat using the cached value of a primary
	 * stat and the values of all active modifiers and mulitpliers that apply
	 * @param {string} prime - name of a primary stat
	 * @param {string} second - name of a secondary stat
	 * @returns {number} the value of the secondary stat
	 */
	calcSecondaryStat(prime, second) {

		const weapon = Weapon.get(this.weapons.known.getActive());
		const equip  = Equipment.get(this.equipment.known.getActive());
		const art    = CombatArt.get(this.combatarts.equipped.getActive());

		switch (second) {
			case "pdr":
			case "mdr":
			return Math.max(
				(this.cache.stats[prime]
					+ this.modifier(second))
				* this.multiplier(second),
				0,
			);

			case "hit":
			case "avo":
			return Math.max( 
				(this.cache.stats[prime]
					+ this.modifier(second))
				* this.multiplier(second)
					+  this.triangle,
				0,
			);

			case "pmt": {
				const scale = art.multiplier("scale");
				return Math.max(
					Math.floor(
						(this.cache.stats.str
							+ (art.isMagicDamage()
								? 0
								: weapon.modifier(second) + art.modifier(second))
							+ (scale != 1
								? Math.floor(this.cache.stats[scale] * 0.3)
								: 0)
							+ (art.tag("vengeance")
								? Math.floor(
									(-this.hitpoints + this.cache.stats.hp) / 2)
								: 0)
							+ equip.modifier(second)
							+ this.abilityModifer(second))
						* this.multiplier(weapon)
						* (art.tag("astra") ? 0.3 : 1.0)),
					0,
				);
			}

			case "mmt": {
				const scale = art.multiplier("scale");
				return Math.max(
					Math.floor(
						((this.cache.stats.mag
							* (weapon.tag("healing") ? 0.5 : 1))
							+ (art.isMagicDamage()
								? weapon.higherMight()
								: weapon.modifier(second))
							+ (weapon.isMagicDamage()
								? art.higherMight()
								: art.modifier(second))
							+ (scale != 1
								? Math.floor(this.cache.stats[scale] * 0.3)
								: 0)
							+ equip.modifier(second)
							+ this.abilityModifer(second))
						* this.multiplier(weapon)),
					0,
				);
			}

			case "crit":
			return Math.max(
				Math.floor(
					(this.cache.stats[prime] / 2
						+ this.modifier(second))
					* this.multiplier(second)
				),
				0
			);

			case "maxrng":
			case "minrng":
			return (
				((art.modifier(second) || weapon.modifier(second))
					+ equip.modifier(second)
					+ this.abilityModifer(second))
				* this.multiplier(second)
			);

			case "uses":
			return (
				weapon.modifier(second)
					* this.abilityMultiplier(weapon.name)
					* this.abilityMultiplier(weapon.type)
			);

			case "cost":
			return (
				weapon.modifier(second) + art.modifier(second)
			);

			default:
			console.log("Invalid weapon '" + second + "'for computed statistic");
			return;
		}
	}

	/**
	 * Recompute and redisplay all primary and secondary stats
	 */
	refreshAllStats() {
		this.refreshPrimaryStats();
		this.refreshSecondaryStats();
	}

	/* catch all refresh method */

	/**
	 * Recompute all parts of the sheet that don't automatically update
	 */
	refresh() {
		this.refreshClass();
		this.refreshAllStats();
		this.refreshGrades();
		this.refreshLevel();
	}

	/* methods relating to persisting the sheet */

	/**
	 * Create a download prompt for a .json file to persist sheet data
	 */
	export() {
		const a    = document.createElement("a");
		const char = {
			name        : this.name,
			description : this.description,
			class       : this.class.name,
			homeland    : this.homeland,
			hitpoints   : this.hitpoints,
			level       : this.level,
			growths     : this.growths,
			statistics  : this.stats,
			skills      : this.skills,
			abilities   : {
				equipped    : Array.from(this.abilities.equipped.names()),
				battlefield : Array.from(this.abilities.battlefield.names()),
				known       : Array.from(this.abilities.known.names())
			},
			combatarts  : {
				equipped    : Array.from(this.combatarts.equipped.names()),
				known       : Array.from(this.combatarts.known.names())
			},
			weapons     : {
				known       : Array.from(this.weapons.known.names())
			},
			equipment   : {
				known       : Array.from(this.equipment.known.names())
			}
		};
		
		const file = new Blob([JSON.stringify(char, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = this.name.replace(/ /g, "_") + ".json";
		a.click();
		URL.revokeObjectURL(a.href);
	}

	/**
	 * Fill out the sheet with the data from a user uploaded .json file
	 * @param {Event} e - upload event containing sheet data
	 */
	import(e) {
		const file = e.target.files[0];
		if (!file) return;

		const sheet  = this;
		const reader = new FileReader();
		reader.onload = function (e) {
			const char = JSON.parse(e.target.result);

			console.log(char);

			sheet.class = Class.byName.get(char.class);
			if (sheet.class.hasMount()) {
				sheet._input_mounted.checked = true;
			}

			document.getElementById("character-class").value = char.class;

			// minor bookeeping and intialization of data structures
			for (let feature of [Ability, CombatArt, Weapon, Equipment]) {
				for (let category in sheet[feature.kind]) {
					if (feature.kind in char && category != "class") {
						sheet[feature.kind][category].fill_from(
							char[feature.kind][category]
						);
					} else {
						sheet[feature.kind][category].clear();
					}
				}
			}

			sheet.abilities.known.toggleAllActive(
				sheet.abilities.equipped.names()
			);

			sheet.combatarts.known.toggleAllActive(
				sheet.combatarts.equipped.names()
			);

			// fill the statistics boxes
			for (let statistic of sheet.data.stats.names) {
				document.getElementById(statistic + "-base").value =
					char.statistics[statistic];

				if (statistic == "mov") continue;

				document.getElementById(statistic + "-growth-base").value =
					char.growths[statistic];
			}

			// fill the skills boxes
			for (let skill of sheet.data.skills) {
				document.getElementById("skill-" + skill).value =
					char.skills[skill];
			}

			sheet.refresh();

			// fill the "character and backstory" section entries
			sheet.name        = char.name;
			sheet.homeland    = char.homeland || char.home;
			sheet.description = char.description;
			sheet.hitpoints   = char.hitpoints;
			sheet.level       = char.level;
		}
		reader.readAsText(file);
	}
}

/**
 * Initializes the necessary data structures for the sheet to function
 * @param {Object} definitions - the json object defining the game data
 */
function initialize(definitions) {


	sheet = new Sheet(definitions);
}
