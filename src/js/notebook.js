/**
 * A module for the Notebook element's implementation
 * @module notebook
 */

/**
 * A class representing a page in the {@link Notebook} class
 */
class NotebookPage {

	/**
	 * Create a new page
	 * @param {string} title - title of the page
	 * @param {HTMLElement} element - element the page displays
	 */
	constructor(title, element, onclick) {
		this.title     = title;
		this.element   = element;

		const button   = document.createElement("input");
		button.value   = title;
		button.type    = "button";
		button.onclick = onclick;
		this.button    = button;
		button.classList.add("simple-border");
		button.classList.add("notebook-tab");

		this._active   = false;
	}

	/**
	 * Whether or not this page is active, controls styling
	 * @type {boolean}
	 */
	get active() {
		return this._active;
	}

	set active(value) {
		// nothing to do; no change occurred
		if (value == this.active) return;

		if (value) {
			this.button.classList.add("selected-text");
		} else {
			this.button.classList.remove("selected-text");
		}

		this._active = value;
	}
}

/**
 * An element that allows switching between content using tabs
 */
class Notebook {

	/**
	 * Create a new notebook
	 * @param {HTMLElement} parent - an optional parent element
	 */
	constructor(parent) {

		/* internal state */
		this._active = null;
		this.pages   = new Map();

		/* create main elements of notebook */
		this.root = document.createElement("div");

		this.tabs = document.createElement("div");
		this.root.appendChild(this.tabs);
		
		this.body = document.createElement("div");
		this.root.appendChild(this.body);

		/* external DOM */
		if (parent) {
			parent.appendChild(this.root);
		}
	}

	/**
	 * Add a new page. This page cannot duplicate the title of an existing one.
	 * @param {string} title - title of the page; used as the tab name
	 * @param {HTMLElement} element - element to display when the page is active
	 * @returns {boolean} true if the page is successfully added, otherwise false
	 */
	add(title, element) {
		if (this.pages.has(title)) return false;
		
		const page = new NotebookPage(title, element, () => {
			this.active = title;
		});

		this.pages.set(page.title, page);
		this.tabs.appendChild(page.button);
		
		if (this.active === null) {
			this.active = page.name;
		}

		return true;
	}

	/**
	 * Delete a page with the given title. Does nothing if no page exists.
	 * @param {string} title - title of the page to delete
	 * @returns {boolean} true if the page is successfully delete, otherwise false
	 */
	delete(title) {
		if (!this.pages.has(title)) return false;

		const page = this.pages.get(title);
		page.button.remove();

		if (this.active == page.title) {
			this.page.element.remove();
		}

		this.pages.delete(title);
		return true;
	}

	/**
	 * The name of the active page. Assignment fails if no such page exists.
	 * @type {string?}
	 */
	get active() {
		return this._active;
	}

	set active(title) {
		if (title !== null && !this.pages.has(title)) return;
		if (title == this._active) return;

		if (this._active) {
			const oldPage  = this.pages.get(this._active);
			oldPage.active = false;
			oldPage.element.remove();

			if (title === null) return;
		}

		this._active   = title;
		const newPage  = this.pages.get(this._active);
		newPage.active = true;
		this.body.appendChild(newPage.element);
	}
}

/* exported Notebook */
