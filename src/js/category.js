
/**
 * A module that implements various enhanced html dl elements
 * @module category
 */

/**
 * @typedef {function() : boolean} CategoryElementCallback
 */

/**
 * Options for initializing a new CategoryElement
 * @typedef {object} CategoryElementOptions
 * @property {string} title - a title for the element
 * @property {string} description - a description for the element
 * @property {boolean} reorderable - whether this element should be reorderable
 * @property {boolean} removable - whether this element should have a remove button
 * @property {CategoryElementCallback} onremove - called when element is removed; action canceled if falsy value returned
 * @property {CategoryElementCallback} ontoggle - called when element is toggled; action canceled if falsy value returned
 * @property {string} key - string to embed as a data attribute on this element's dt
 */

/**
 * Compound html element for creating toggleable/removable dl tag entries
 * intended to be used as members of a {@link Category} object.
 */
class CategoryElement {

	/**
	 * Does nothing; used to prevent allocating new useless callbacks whenever
	 * the constructor is given undefined values for ontoggle or onremove
	 * @private
	 */
	static pass() {}

	/**
	 * Create an element
	 * @param {CategoryElementOptions} options - the optional parameters for this type
	 */
	constructor(options) {

		// assign attributes
		this._active      = false;
		this._title       = document.createTextNode(options.title || "");
		this._description = document.createTextNode(options.description || "");
		this.onremove     = options.onremove || CategoryElement.pass;
		this.ontoggle     = options.ontoggle || CategoryElement.pass;

		// go about building the DOM nodes
		this.dt = document.createElement("dt");

		if (typeof options.key == "string" || typeof options.key == "number") {
			this.dt.setAttribute("data-key", options.key);
		}

		if (options.reorderable) {

			const updown    = document.createElement("input");
			updown.type     = "number";
			updown.value    =  0;
			updown.max      = +1;
			updown.min      = -1;
			updown.onchange = (() => {
				switch (Number(updown.value)) {
				case +1:
					this.shiftForward(1);
					break;
				case -1:
					this.shiftBackward(1);
					break;
				default:
					break;
				}
				updown.value = 0;
				updown.focus();
			});

			updown.classList.add("updown-buttons");
			this.dt.appendChild(updown);
			this.updown = updown;
		} else {
			this.updown = null;
		}

		// add title content
		const span = document.createElement("span");
		span.appendChild(this._title);
		span.classList.add("selectable");
		this.doToggleEvent = (() => {
			this.ontoggle.call();
			// Giving the number input focus allows it to be controlled by, and
			// this element to be moved up and down via, the arrow keys.
			if (this.updown) this.updown.focus();
		});

		span.onclick = this.doToggleEvent;

		this.span = span;
		this.dt.appendChild(span);

		// if remove function is defined, make a "remove" button
		if (options.removable) {

			this.doRemoveEvent = (() => {
				this.onremove.call();
			});

			this.removeButton         = document.createElement("input");
			this.removeButton.value   = "❌";
			this.removeButton.type    = "button";
			this.removeButton.onclick = this.doRemoveEvent;
			this.removeButton.classList.add("simple-border");
			this.removeButton.classList.add("remove-button");
			this.dt.appendChild(this.removeButton);
		} else {
			this.removeButton = null;
		}

		// add entry content description
		this.dd = document.createElement("dd");
		this.dd.appendChild(this._description);

		// this belongs to no category by default
		this.parent = null;
	}

	/* getters and setters */

	/**
	 * The title for this element/the text content for the dt tag
	 * @type {string}
	 */
	get title() {
		return this._title.data;
	}

	set title(value) {
		this._title.data = value;
	}

	/**
	 * The description for this element/the text content for the dd tag
	 * @type {string}
	 */
	get description() {
		return this._description.data;
	}

	set description(value) {
		this._description.data = value;
	}

	/**
	 * Whether this element is active or not; controls title styling
	 * @type {boolean}
	 */
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

		this._active = value;
	}

	/**
	 * Toggle the active state of this element
	 * @returns the new active state after the toggle is performed
	 */
	toggle() {
		this.active = !this.active;
		return this.active;
	}

	/**
	 * Shift this element toward the front of the {@link Category}.
	 * If the offset is too large, the element is placed at the front
	 * @param {number} offset - number of places forward to shift
	 */
	shiftForward(offset) {
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
	 * Shift this element toward the back of the {@link Category}.
	 * If the offset is too large, the element is placed at the back
	 * @param {number} offset - number of places backward to shift
	 */
	shiftBackward(offset) {
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
 * The model for a Category instance
 */
class CategoryModel {

	/**
	 * Create new model
	 * @param {string} name - an identifer for this model
	 * @param {Map} lookup - a map from ids to objects
	 * @param {Function} getTitle - function that produces a title string for a CategoryElement from an object
	 * @param {Function} getBody - function that produces a description string for a CategoryElement from an object
	 */
	constructor (name, lookup, getTitle, getBody, getTriggers) {
		this.name      = name;
		this._lookup   = lookup;
		this._title    = getTitle;
		this._body     = getBody;
		this._triggers = getTriggers;
	}

	/* delegate access methods to map; only access ones though, Category should not mutate its model */

	has(key) {
		return this._lookup.has(key);
	}

	get(key) {
		return this._lookup.get(key);
	}

	keys() {
		this._lookup.keys();
	}

	values() {
		return this._lookup.values();
	}

	/* methods for producing element titles and definitions */

	title(key) {
		return this._title.call(undefined, this._lookup.get(key));
	}

	description(key) {
		return this._body.call(undefined, this._lookup.get(key));
	}

	triggers(key) {
		return this._triggers.call(undefined, this._lookup.get(key));
	}
}

/**
 * @typedef {function(Category, string) : boolean} CategoryCallback
 */

/**
 * Options for initializing a new Category
 * @typedef {object} CategoryOptions
 * @property {string} name - an identifer for this category
 * @property {string} empty - text to display when there are no items
 * @property {boolean} selectable - whether a select input should be provided to insert elements
 * @property {boolean} reorderable - whether this category's elements should be reorderable
 * @property {boolean} removable - whether this category's elements should have a remove button
 * @property {CategoryCallback} ontoggle - called when an element is toggled; action canceled if falsy value returned
 * @property {CategoryCallback} onremove - called when an element is removed; action canceled if falsy value returned
 * @property {HTMLElement} parent - parent element to add this item to
 */

/**
 * A compound element composed of a dl tag, with the option to add
 * toggleable/removable entries with a select tag.
 */
class Category {

	static succeed(category, key) { // eslint-disable-line no-unused-vars
		return true;
	}

	/**
	 * Create a category
	 * @param {CategoryModel} model - data model for this category
	 * @param {CategoryOptions} options - options for configuring this category
	 */
	constructor(model, options) {

		const category = this;

		this.model       = model;
		this.name        = options.name     || "";
		this.empty       = options.empty    || "";
		this.ontoggle    = options.ontoggle || Category.succeed;
		this.onremove    = options.onremove || Category.succeed;
		this.reorderable = Boolean(options.reorderable);
		this.removable   = Boolean(options.removable);
		this.selectable  = Boolean(options.selectable);
		this.parent      = null;
		this.next        = null;
		this.prev        = null;
		this.elements    = new Map();
		this.root        = document.createElement("div");
		this.triggers    = new Map();

		// go about building the DOM nodes
		if (!this.selectable) {
			this.select = null;
		} else {

			// create a button to add a new element
			this.addButton         = document.createElement("input");
			this.addButton.value   = "Add";
			this.addButton.type    = "button";
			this.addButton.onclick = () => {
				category.add(category.select.value);
			};
			this.addButton.classList.add("simple-border");
			this.root.appendChild(this.addButton);

			// create a selector of valid values
			this.select = document.createElement("select");
			this.select.classList.add("simple-border");
			for (let item of this.model.values()) {
				if ("hidden" in item && item.hidden) continue;
				const option = document.createElement("option");
				option.value = item.name;
				option.appendChild(document.createTextNode(item.name));
				this.select.appendChild(option);
			}
			this.root.appendChild(this.select);
		}

		this._textnode  = document.createTextNode(this.empty);
		const paragraph = document.createElement("p");
		paragraph.appendChild(this._textnode);
		this.root.appendChild(paragraph); 

		this.dl = document.createElement("dl");
		this.dl.classList.add("scrolls");
		this.root.appendChild(this.dl);

		if (options.parent) {
			this.addTo(options.parent);
		}
	}

	get size() {
		return this.elements.size;
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
		this.parent.appendChild(this.root);
	}

	/**
	 * Remove this Category from its parent html element
	 */
	remove() {
		// cannot remove this if it has no parent
		if (!this.parent) return;

		this.parent = null;
		this.root.parentNode.removeChild(this.root);
	}

	/* methods for managing active items*/

	/**
	 * Test whether an element with the given name is active
	 * @abstract
	 * @param {string} name - name of the element to test
	 * @returns {boolean} whether the element is active
	 */
	isActive (name) { // eslint-disable-line no-unused-vars
		return false;
	}

	/**
	 * Toggles whether an element is active or inactive
	 * @abstract
	 * @param {string} name - name of the element to toggle
	 * @param {boolean=} quiet - if true, never triggers a toggle callback
	 * @returns {boolean} whether the toggle was successful
	 */
	toggleActive (name, quiet=false) { // eslint-disable-line no-unused-vars
		return false;
	}

	/**
	 * Access the names of any active elemets
	 * @abstract
	 * @returns names of acive elements
	 */
	getActive() { // eslint-disable-line no-unused-vars
		return null;
	}

	/**
	 * Make it so that no element is active
	 * @abstract
	 */
	clearActive () {
		
	}

	/* modify the state from an object */

	getState() {
		
		const elements = [];

		for (let element of this.names()) {
			elements.push(element);
		}
		
		return elements;
	}

	setState(elements) {

		let added = 0;

		this.clear();
		for (let element of elements) {
			added += Number(this.add(element));
		}

		return added;
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

	// unlink(that) {
	// 	if (this.next == that && that.prev)
	// }

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
		if (!this.model.has(name)) return false;

		// prevent the addition of duplicate items
		if (this.elements.has(name)) return false;

		if (this.size == 0) {
			this._textnode.data = "";
		}

		const element = new CategoryElement({
			key         : name,
			title       : this.model.title(name),
			description : this.model.description(name),
			triggers    : this.model.triggers(name),
			reorderable : this.reorderable,
			removable   : this.removable,
			onremove    : (() => {
				return this.onremove.call(undefined, this, name);
			}),
			ontoggle    : (() => {
				return this.ontoggle.call(undefined, this, name);
			}),
		});

		this.elements.set(name, element);
		element.addTo(this.dl);
		this._addTriggers(name);
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
			this.toggleActive(name, false);
		}

		// if there is a cascade, delete the from the next category first
		if (this.next && this.next.elements.has(name)) {
			this.next.delete(name);
		}

		this.elements.get(name).remove();
		this.elements.delete(name);
		this._deleteTriggers(name);

		if (this.size == 0) {
			this._textnode.data = this.empty;
		}

		return true;
	}

	/**
	 * Refreshes the contents of an element with the given name, if present.
	 * @param {string} name - the name of the element to refreshed
	 * @returns {boolean} true if an element was refreshed, else false
	 */
	refresh(name) {

		// can't refresh an element that isn't present
		if (!this.elements.has(name)) return false;

		const element       = this.elements.get(name);
		// element.title       = this.model.title(name);
		element.description = this.model.description(name);

		return true;
	}

	_addTriggers(name) {
		for (let trigger of this.model.triggers(name)) {

			if (this.triggers.has(trigger)) {
				this.triggers.get(trigger).add(name);
			} else {
				this.triggers.set(trigger, new Set([name]))
			}

		}
	}

	_deleteTriggers(name) {

		for (let trigger of this.model.triggers(name)) {

			if (!this.triggers.has(trigger)) continue;
			const triggers = this.triggers.get(trigger);
			triggers.delete(name);

			if (triggers.size == 0) {
				this.triggers.delete(trigger);
			}
			
		}
	}

	trigger(trigger) {

		if (!this.triggers.has(trigger)) return false;

		for (let name of this.triggers.get(trigger)) {
			this.refresh(name);
		}

		return true;
	}

	/**
	 * Clears the current elements and adds new ones from the given iterable.
	 * The names must exist in this Category's feature's lookup table.
	 * @todo remove this function
	 * @param names - an iterable collection of strings
	 * @returns {number} the number of elements added
	 */
	fill_from(names) {

		let added = 0;

		this.clear();
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
		this._textnode.data = this.empty;
	}

	/* iterable */

	/**
	 * Get an iterator of all of the names of the feature elements in this category in display order
	 * @return iterator over the names of the feature elements of this category in display order
	 */
	*names() {
		for (let child of this.dl.children) {
			const name = child.getAttribute("data-key");
			if (name) yield name;
		}
	}

	/**
	 * Get an iterator of all of the feature elements of this category in display order
	 * @return iterator over the feature elements of this category in display order
	 */
	*values() {
		for (let name of this.names()) {
			yield this.model.get(name);
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
 * An extension of {@link Category} that allows a single element to be 'activated'
 */
class SingleActiveCategory extends Category {

	/**
	 * Create a category
	 * @param {CategoryModel} model - data model for this category
	 * @param {CategoryOptions} options - options for configuring this category
	 */
	constructor(model, options) {
		super(model, options);
		this.active = null;
	}

	/**
	 * Test whether a specific element is active
	 * @param {string} name - the name of the element to test
	 * @returns {boolean} true if active, false if not present, another element is active, or no element is active
	 */
	isActive(name) {
		return this.active === name;
	}

	/**
	 * Toggle whether a specific element is active. If there is no value with
	 * a given name in the category's model or set of elements, nothing happens
	 * and false is returned. Otherwise are cases for this method:
	 *	 - "name" is active; "name" is made inactive
	 *	 - "name" not active but another element is; their states are swapped
	 *	 - no element is active; "name" is made active
	 * @param {string} name - name of the element to toggle
	 * @returns {boolean} true if the toggle was successful, false otherwise
	 */
	toggleActive(name) {
		// user cannot toggle an element that isn't present
		if (!this.elements.has(name)) return false;

		const element = this.elements.get(name);

		if (this.active !== null) {
			if (this.active == name) {
				element.active = false;
				this.active    = null;
			} else {
				const previous = this.elements.get(this.active);
				
				console.log(this.active, previous);
				
				/*@TODO this is a hack to cover an issue, figure out what causes it */
				if (previous != null) {
					previous.active = false;
				}
				
				element.active = true;
				this.active = name;
			}
		} else {
			element.active = true;
			this.active    = name;
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
		if (this.active !== null) {
			this.toggleActive(this.active, true);
		}
	}

	setState(state) {
		const {added, active} = state;
		this.clearActive()

		super.setState(added);
		if (active !== null && this.elements.has(active)) {
			this.toggleActive(active, true);
		}
	}

	getState() {
		return {
			added: super.getState(),
			active: this.getActive(),
		};
	}
}

/**
 * An extension of {@link Category} that allows a multiple elements to be 'activated'
 */
class MultiActiveCategory extends Category {

	/**
	 * Create a category
	 * @param {CategoryModel} model - data model for this category
	 * @param {CategoryOptions} options - options for configuring this category
	 */
	constructor(model, options) {
		super(model, options);
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
	 * Toggle whether a specific element is active. If there is no value with
	 * a given name in the category's model or set of elements, nothing happens
	 * and false is returned.
	 * @param {string} name - name of the element to toggle
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
		for (let element of this) {
			if (element.active) {
				element.active = false;
			}
		}
	}

	setState(state) {
		const {added, active} = state;
		super.setState(added);

		for (let element of active) {
			if (this.elements.has(element)) {
				this.toggleActive(element);
			}
		}
	}

	getState() {
		return {
			added: super.getState(),
			active: Array.from(this.getActive()),
		};
	}
}

/* exported SingleActiveCategory */
/* exported MultiActiveCategory */
/* exported CategoryModel */