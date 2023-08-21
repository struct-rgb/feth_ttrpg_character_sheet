/**
 * A module for the Notebook element's implementation
 * @module notebook
 */

/* global element */

/**
 * A class representing a page in the {@link Notebook} class
 */
class NotebookPage {

	/**
	 * Create a new page
	 * @param {string} title - title of the page
	 * @param {Array} elements - elements the page displays
	 */
	constructor(title, elements, onclick) {
		this.title     = title;
		this.elements  = elements;

		const button   = document.createElement("input");
		button.value   = title;
		button.type    = "button";
		button.onclick = onclick;
		this.button    = button;
		button.classList.add("simple-border");
		button.classList.add("notebook-tab");

		const option       = document.createElement("option");
		option.value       = title;
		option.textContent = title;
		this.option        = option;

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

class Note {

	constructor(parent, wide=true) {

		this.tabs    = element("div");
		this.buttons = element("div");
		this.select  = element("select", "simple-border");
		this.body    = element("div");
		this.parent  = parent;
		this.root    = element("div", [
			wide ? this.buttons : this.select, this.body
		]);
		this._wide   = wide;

		/* external DOM */
		if (parent) {
			parent.appendChild(this.root);
		}
	}

	get wide() {
		return this._wide;
	}

	set wide(value) {
		this.tabs.removeChild(this.tabs.firstChild);
		this.tabs.prepend(value ? this.buttons : this.select);
		this._wide = value;
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
	constructor(parents, wide=true) {

		if (parents == null) {
			parents = element("div");
		}

		if (!Array.isArray(parents)) {
			parents = [parents];
		}

		/* internal state */
		this._active = null;
		this.pages   = new Map();

		/* create main elements of notebook */
		// this.root  = document.createElement("div");
		this.notes = parents.map(parent => new Note(parent, wide));
		this.first = this.notes[0]; 
		this.root  = this.first.root;
	}

	/**
	 * Add a new page. This page cannot duplicate the title of an existing one.
	 * @param {string} title - title of the page; used as the tab name
	 * @param {HTMLElement} element - element to display when the page is active
	 * @returns {boolean} true if the page is successfully added, otherwise false
	 */
	add(title, elements) {
		// debugger;
		if (this.pages.has(title)) return false;

		if (!Array.isArray(elements)) {
			elements = [elements];
		}

		if (elements.length != this.notes.length) {
			throw new Error(`${elements} is not length ${this.notes.length}`);
		}
		
		const page = new NotebookPage(title, elements, () => {
			this.active = title;
		});

		this.pages.set(page.title, page);
		this.first.buttons.appendChild(page.button);
		this.first.select.appendChild(page.option);
		
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
		page.option.remove();

		if (this.active == page.title) {
			for (let element of this.page.elements){
				element.remove();
			}
		}

		this.pages.delete(title);
		return true;
	}

	get wide() {
		return this.first.wide;
	}

	set wide(value) {
		this.first.wide = value;
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

			for (let element of oldPage.elements) {
				element.remove();
			}

			if (title === null) return;
		}

		this._active   = title;
		const newPage  = this.pages.get(this._active);
		newPage.active = true;

		for (let i = 0; i < this.notes.length; ++i) {
			this.notes[i].body.appendChild(newPage.elements[i]);
		}
	}
}


/* exported Notebook */
