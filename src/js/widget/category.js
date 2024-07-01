
/**
 * A module that implements various enhanced html dl elements
 * @module category
 */

/* global Refresher */
/* global SwapText */
/* global element */
/* global assume */

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
		this._hidden      = false;
		this._title       = document.createTextNode(options.title || "");
		this._description = element("span", options.description || "");
		this.onremove     = options.onremove  || CategoryElement.pass;
		this.ontoggle     = options.ontoggle  || CategoryElement.pass;
		this.onreorder    = options.onreorder || CategoryElement.pass;
		this.group        = options.group     || "";
		this.resources    = options.resources || null;

		// go about building the DOM nodes
		this.dt = document.createElement("dt");

		if (typeof options.key == "string" || typeof options.key == "number") {
			this.dt.setAttribute("data-key", options.key);
		}

		this.updown = element("input", {
			class : ["updown-buttons"],
			attrs : {
				type     : "number",
				value    :  0,
				max      : +1,
				min      : -1,
				onchange :  (() => {
					this.shift(Number(this.updown.value));
					this.updown.value = 0;
					this.updown.focus();

					// TODO maybe make this work like onremove and ontoggle?
					this.onreorder.call();
				}),
				hidden   : !options.reorderable,
			}
		});

		this.dt.appendChild(this.updown);

		// add title content
		this.span = element("span", {
			content : this._title,
			class   : ["selectable"],
			attrs   : {
				onclick : (() => {
					this.ontoggle.call();
					this.updown.focus(); // allows movement with arrow keys
				}),
			}
		});

		this.dt.appendChild(this.span);

		this.group_mark = element("span", this.group, "smol", "computed");
		if (options.markGroup) this.dt.appendChild(this.group_mark);

		// make a "remove" button
		this.removeButton = element("button",  {
			class   : ["toggle-off", "smol"],
			content : "Delete",
			attrs   : {
				onclick : (() => void this.onremove.call()),
				hidden  : !options.removable,
			},
		});

		this.dt.appendChild(this.removeButton);

		const hidden = element("span", "\xA0", "punctuation");
		this.swap    = new SwapText([this._description, hidden], true);

		this._hidetext = document.createTextNode("Hide");

		this.hideButton = element("button",  {
			class   : ["toggle-off", "smol"],
			content : this._hidetext,
			attrs   : {
				onclick : (() => void this.hide()),
				hidden  : !options.hideable,
			}
		});

		this.dt.appendChild(this.hideButton);

		// add entry content description
		this.dd = document.createElement("dd");
		this.dd.appendChild(this.swap.root);

		// this belongs to no category by default
		this.parent = null;

		// hide the text if it is mean to be hidden
		this.hidden = assume(options.hidden, false);
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
		// return this._description.data;
		return this._description.lastChild;
	}

	set description(value) {

		if (typeof value == "string") {
			value = element("span", value);
		}

		const last = this._description.lastChild;
		if (last) last.remove();

		this._description.appendChild(value);
	}

	/**
	 * Whether this element is active or not; controls title styling.
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
	 * Whether the user should be able to hide the body of this element.
	 * @type {boolean}
	 */
	get hideable() {
		return !this.hideButton.hidden;
	}

	set hideable(value) {
		this.hideButton.hidden = !value;
	}

	/**
	 * Whether the user should be able to reorder this element in the list.
	 * @type {boolean}
	 */
	get reorderable() {
		return !this.updown.hidden;
	}

	set reorderable(value) {
		this.updown.hidden = !value;
	}

	/**
	 * Whether the usser should be able to remove thie element from the list.
	 * @type {boolean}
	 */
	get removable() {
		return !this.removeButton.hidden;
	}

	set removable(value) {
		this.removeButton.hidden = !value;
	}

	/**
	 * Toggle the active state of this element
	 * @returns the new active state after the toggle is performed
	 */
	toggle() {
		this.active = !this.active;
		return this.active;
	}

	get hidden() {
		return this._hidden;
	}

	set hidden(value) {
		if (value == this._hidden) return;
		this.hide();
	}

	hide() {
		this.swap.next();

		const list = this.hideButton.classList;

		if (this._hidden) {
			list.remove("toggle-on");
			list.add("toggle-off");
			this._hidetext.data = "Hide";
			this._hidden = false;
		} else {
			list.remove("toggle-off");
			list.add("toggle-on");
			this._hidetext.data = "Show";
			this._hidden = true;
		}
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
	 * Shift this element offset elements backwards or fowards.
	 * If the offset is too large, the element is placed as far as possible.
	 * @param {number} offset - number of places to shift
	 */
	shift(offset) {
		if (offset > 0) {
			this.shiftForward(offset);
		} else if (offset < 0) {
			this.shiftBackward(-offset);
		} else {
			/* do nothing */
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

	description(key, refresher) {
		return this._body.call(undefined, this._lookup.get(key), refresher);
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
 * @property {Filter.Select?} select - an optional Filter.Select
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
		this.name        = options.name      || "";
		this.empty       = options.empty     || "";
		this.ontoggle    = options.ontoggle  || Category.succeed;
		this.onremove    = options.onremove  || Category.succeed;
		this.onreorder   = options.onreorder || Category.succeed;
		this.onadd       = options.onadd     || Category.succeed;
		this.reorderable = Boolean(options.reorderable);
		this.removable   = Boolean(options.removable);
		this.hideable    = Boolean(options.hideable);
		this.selectable  = Boolean(options.selectable);
		this.markGroup   = Boolean(options.markGroup);
		this.addActive   = Boolean(options.addActive);
		this.parent      = null;
		this._elements   = new Map();
		this.root        = document.createElement("div");
		this.refresher   = options.refresher || new Refresher();

		// go about building the DOM nodes
		if (!this.selectable) {
			this.select = null;
		} else {

			// create a button to add a new element

			this.addButton = element("input", {
				class : ["simple-border"],
				attrs : {
					value   : "Add",
					type    : "button",
					onclick : (() => {

						const name  = category.select.value;
						const added = category.add(name, {group: this.name});
						if (!added) return;

						if (this.addActive) {
							this.ontoggle.call(undefined, this, name);
						}

						this.onadd.call(undefined, this, name);
					})
				}
			});

			this.root.appendChild(this.addButton);

			if (options.select) {
				this._sf    = options.select;
				this.select = this._sf._select;
				this.root.appendChild(this._sf.root);
			} else {
				this.select = element("select", {
					class   : ["simple-border"],
					content : Array.from(this.model._lookup.keys()).map(key => 
						element("option", {content: key, attrs: {src: key}})
					),
				});
				this.root.appendChild(this.select);
			}	
		}

		this._textnode  = document.createTextNode(this.empty);
		const paragraph = document.createElement("div");
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
		return this._elements.size;
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
	isActive(name) { // eslint-disable-line no-unused-vars
		return false;
	}

	/**
	 * Toggles whether an element is active or inactive
	 * @abstract
	 * @param {string} name - name of the element to toggle
	 * @param {boolean=} quiet - if true, never triggers a toggle callback
	 * @returns {boolean} whether the toggle was successful
	 */
	toggleActive(name, quiet=false) { // eslint-disable-line no-unused-vars
		return false;
	}

	/**
	 * Access the names of any active elemets
	 * @abstract
	 * @returns names of acive elements
	 */
	getActive() {
		return null;
	}

	/**
	 * Make it so that no element is active
	 * @abstract
	 */
	clearActive() {
		
	}

	/* modify what is and is not hidden */

	toggleHide(name) {
		// user cannot hide an element that isn't present
		if (!this.has(name)) return false;
		this.element(name).hide();
	}

	/* modify the state from an object */

	getState() {
		
		const elements = [];

		for (let name of this.names()) {
			const element = this.element(name);
			elements.push({
				id     : name,
				group  : element.group || "",
				hidden : element.hidden,
			});
		}
		
		return elements;
	}

	setState(elements) {

		let added = 0;

		this.clear();
		for (let each of elements) {
			added += Number(this.add(each.id, {
				group  : assume(each.group, ""),
				hidden : assume(each.hidden, false)
			}));
		}

		return added;
	}

	/* methods for adding and removing elements */

	/**
	 * Return whether this has a specific element
	 * @param {string} name - the name of the element
	 * @returns {boolean} true if it is present, else false
	 */
	has(name) {
		return this._elements.has(name);
	}

	get(name) {
		if (!this.has(name)) return undefined;
		return this.model.get(name);
	}

	element(name) {
		return this._elements.get(name);
	}

	/**
	 * Adds an element with the given name. The name must exist in this
	 * Category's feature's lookup table.
	 * @param {string} name - the name of the element to add
	 * @returns {boolean} true if an element was added, else false
	 */
	add(name, options={}) {
		// prevent adding illegal items
		if (!this.model.has(name)) {
			console.error(name);
			return false;
		}

		// prevent the addition of duplicate items
		if (this.has(name)) return false;

		if (this.size == 0) {
			this._textnode.data = "";
		}

		const refresher   = assume(options.refresher, this.refresher);
		const onremove    = assume(options.onremove, this.onremove);
		const onreorder   = assume(options.onreorder, this.onreorder);
		const ontoggle    = assume(options.ontoggle, this.ontoggle);
		const resources   = refresher.createGroup();
		const description = this.model.description(name, refresher);

		const element  = new CategoryElement({
			key         : name,
			title       : this.model.title(name),
			description : description,
			resources   : [resources, refresher],
			triggers    : this.model.triggers(name),
			reorderable : assume(options.reorderable, this.reorderable),
			removable   : assume(options.removable, this.removable),
			hideable    : assume(options.hideable, this.hideable),
			onremove    : (() => {
				return onremove.call(undefined, this, name);
			}),
			ontoggle    : (() => {
				return ontoggle.call(undefined, this, name);
			}),
			onreorder   : (() => {
				return onreorder.call(undefined, this, name);
			}),
			markGroup   : assume(options.markGroup, this.markGroup),
			group       : assume(options.group, ""),
			hidden      : assume(options.hidden, false),
		});

		this._elements.set(name, element);
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
		if (!this.has(name)) return false;

		// if the element is active, deactivate it 
		if (this.isActive(name)) {
			this.toggleActive(name, false);
		}

		const element = this.element(name);

		if (element.resources) {
			const [resources, refresher] = element.resources;
			refresher.delete(resources);
		}

		element.remove();
		this._elements.delete(name);

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
		if (!this.has(name)) return false;

		const element       = this.element(name);
		// element.title       = this.model.title(name);
		element.description = this.model.description(name);

		return true;
	}

	/**
	 * Clears the current elements
	 */
	clear() {
		this.clearActive();
		for (let element of this._elements.values()) {
			// if (element.resources) {
			// 	const [resources, refresher] = element.resources;
			// 	console.log(`${element._title.data}: `, refresher.delete(resources));
			// }
			element.remove();
		}
		this._elements.clear();
		this._textnode.data = this.empty;
	}

	/* iterable */

	/**
	 * Get an iterator of all of the names of the feature elements in this category in display order
	 * @return iterator over the names of the feature elements of this category in display order
	 */
	*names(group) {
		for (let child of this.dl.children) {
			const name    = child.getAttribute("data-key");
			const element = this.element(name); 
			const matches = name && (!group || element.group === group);
			if (matches) yield name;
		}
	}

	/**
	 * Get an iterator of all of the feature elements of this category in display order
	 * @return iterator over the feature elements of this category in display order
	 */
	*values(group) {
		for (let name of this.names(group)) {
			yield this.model.get(name);
		}
	}

	*elements(group) {
		for (let child of this.dl.children) {
			const name    = child.getAttribute("data-key");
			const element = this.element(name);
			const matches = name && (!group || element.group === group);
			if (matches) yield element;
		}
	}

	*entries(group) {
		for (let name of this.names(group)) {
			yield [name, this.model.get(name)];
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
		if (!this.has(name)) return false;

		const element = this.element(name);

		if (this.active !== null) {
			if (this.active == name) {
				element.active = false;
				this.active    = null;
			} else {
				const previous = this.element(this.active);
								
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
		this.clearActive();

		super.setState(added);
		if (active !== null && this.has(active)) {
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
		if (!this.has(name)) return false;

		const element = this.element(name);

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

	getActiveKeys() {
		return this.active;
	}

	getActiveValues() {
		return Array.from(this.active).map(key => this.model.get(key));
	}

	getActiveElements() {
		return Array.from(this.active).map(key => this._elements.get(key));
	}

	/**
	 * Make it so that no elements are active
	 */
	clearActive() {
		this.active.clear();
		for (let element of this.elements()) {
			if (element.active) {
				element.active = false;
			}
		}
	}

	setState(state) {
		super.setState(state);

		for (let element of state) {
			if (this.has(element.id) && element.active) {
				this.toggleActive(element.id);
			}
		}
	}

	getState() {
		return super.getState().map(element => {
			element.active = this.isActive(element.id);
			return element;
		});
	}
}

// only execute this in node; not browser
if (typeof module !== "undefined") {
	/* global module */
	module.exports = {
		CategoryModel, SingleActiveCategory, MultiActiveCategory
	};
}

/* exported SingleActiveCategory */
/* exported MultiActiveCategory */
/* exported CategoryModel */