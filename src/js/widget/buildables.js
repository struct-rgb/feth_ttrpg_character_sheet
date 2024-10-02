/**
 * A module for the Buildables element's implementation
 * @module buildables
 */

/* global
	CategoryModel, MultiActiveCategory
*/

/* global
	BigButton, Iter, SwapText, Toggle, Version,
	element, tooltip, uniqueID, wrap
 */

class BuildableModel {

	constructor() {
		this.uuid    = null;
		this.empties = false;
	}

	/**
	 * Default implementation assumes one active at a time.
	 * @param  {[type]}  key      [description]
	 * @param  {[type]}  data     [description]
	 * @param  {Boolean} doExport [description]
	 * @return {[type]}           [description]
	 */
	give(key, data, doExport=true) {

		const old    = this.uuid;
		const result = doExport ? {id: old, data: this.export()} : null;

		if (typeof data == "string" || data instanceof String) {

			// some of my models try to reach out and alter their
			// category's titles/bodies and this is to stop them from trying
			// to do that because on a new buildable, the category element
			// hasn't been added yet and doing so would be a nullptr exception
			this.uuid = null;

			// reset the model, populate defaults from the data string
			this.clear(data);

			// done afterward so clear is allowed to erase uuid beforehand
			this.uuid = key;
		} else {

			// done before in case import uses uuid
			this.uuid = key;

			// read in the data object
			this.import(data);
		}

		return result;
	}

	/**
	 * Default implementation assumes one active at a time.
	 * @param  {[type]} key [description]
	 * @return {[type]}     [description]
	 */
	take(key, copy=false) {
		return copy ? this.export() : null;
	}

	import(object) {
		return null;
	}

	clear(object) {
		return null;
	}

	export() {
		return null;
	}

	getTitle(object) {
		return "Title";
	}

	getBody(object) {
		return "Body";
	}

}

/**
 * Serves as a selection input for a Buildables object.
 */
class InteractiveSelection {

	static pass = () => void(0);

	selection(message, confirm, cancel) {
		this.message.data = message;
		this._confirm     = confirm;
		this._cancel      = cancel;
	}

	confirm() {
		this._confirm.call(undefined, this);
	}

	cancel() {
		this._cancel.call(undefined, this);
	}

	constructor(options) {

		this.data    = null;
		this.message = document.createTextNode("Default message.");
		this.dtoggle = new Toggle("Replace", false);


		this.delswap = new SwapText([
			element("span", [
				element("strong", "|", "punctuation"),
				this.dtoggle.root
			]),
			element("span"),
		], true, "span");

		this.root = element("div", [
			element("fieldset", [
				element("legend",
					element("span", this.message, "computed")
				),
				element("input", {
					class: ["simple-border"],
					attrs: {
						value   : "Confirm",
						type    : "button",
						onclick : (() => void this.confirm()),
					}
				}),
				element("input", {
					class: ["simple-border"],
					attrs: {
						value   : "Cancel",
						type    : "button",
						onclick : (() => void this.cancel()),
					}
				}),

				this.delswap.root,
				
				element("strong", "|", "punctuation"),

				element("input", {
					class: ["simple-border"],
					attrs: {
						value   : "All",
						type    : "button",
						onclick : (() => void this.setAll(true)),
					}
				}),
				element("input", {
					class: ["simple-border"],
					attrs: {
						value   : "None",
						type    : "button",
						onclick : (() => void this.setAll(false)),
					}
				}),
				element("input", {
					class: ["simple-border"],
					attrs: {
						value   : "Invert",
						type    : "button",
						onclick : (() => void this.invert()),
					}
				}),
			]),
		]);

		this._cancel  = InteractiveSelection.pass;
		this._confirm = InteractiveSelection.pass;

		this.map = new Map();

		this.model = new CategoryModel(
			options.name, this.map, options.getTitle, options.getBody, () => []
		);

		this.category = new MultiActiveCategory(this.model, {

			parent           : this.root,

			empty            : "No features to select.",
			selectable       : false,
			reorderable      : false,
			groupReorderable : false,
			groupToggleable  : true,
			removable        : false,
			defaultGroup     : options.defaultGroup ?? "",
			groupShowTitle   : this.groupShowTitle,

			ontoggle         : ((category, key) => {
				
				category.toggleActive(key);

				const element = category.element(key);

				if (element.group == category.defaultGroup)
					return;

				this._doValidateGroupActivation(element.group);

			}),

			onGroupToggle    : ((category, group) => {

				category.toggleGroupActive(group.key);

				const state = category.isGroupActive(group.key);

				for (let name of group.names())
					if (category.isActive(name) != state)
						category.toggleActive(name);
			}),
		});
	}

	_doValidateGroupActivation(name) {
		
		const group  = this.category.getGroup(name);
		const count  = (name => this.category.isActive(name));
		const active = Iter.count(group.names(), count);
		const state  = this.category.isGroupActive(group.key);

		if ((group.length / 2) == active ^ state)
			this.category.toggleGroupActive(group.key);
	}

	setAll(value) {

		for (let each of this.category.names())
			if (value != this.category.isActive(each))
				this.category.toggleActive(each);
	
		for (let each of this.category.groups.keys())
			if (value != this.category.isGroupActive(each))
				this.category.toggleGroupActive(each);
	}

	invert() {

		for (let each of this.category.names())
			this.category.toggleActive(each);

		for (let each of this.category.groups.keys())
			this._doValidateGroupActivation(each);
	}

	fill(data) {

		this.clear();

		for (let each of data.elements) {
			this.map.set(each.id, each.data);
			
			this.category.add(each.id, {
				group: each.group
			});

			this.category.toggleActive(each.id);
		}

		for (let each of this.category.groups.keys())
			this.category.toggleGroupActive(each);

		this.data = data;

	}

	getSelected() {
		return this.category.getActive();
	}

	isSelected(name) {
		return this.category.isActive(name);
	}

	clear() {
		this.map.clear();
		this.category.clear();
	}
}

/**
 * A class that allows the management of multiple instances of user created
 * content to be swapped in and out of a central model object that acts as
 * user's work area. Instances are managed from an embedded Category.
 */
class Buildables {

	static pass(x) {return x;}

	constructor(options) {

		this.name = options.name;

		this.groupShowTitle = options.groupShowTitle || Buildables.pass;
		this._updateData    = options.update      || Buildables.pass;
		this._updateBatch   = options.updateBatch || Buildables.pass;

		options    = options || {name: "NO NAME", templates: []};
		this.root  = element("div");
		this.model = options.model;

		const doImportBatchConfirm = (() => {
			this.importAll(this.selectory.data,
				!this.selectory.dtoggle.checked
			);
			this.swap.next();
		});

		const doExportBatchConfirm = (() => {
			this.exportBatch(true);
			this.swap.next();
		});

		const doBatchCancel = (() => {
			this.selectory.clear();
			this.swap.next();
		});

		this._save         = new BigButton("Save", () => void this.save());
		this._export       = new BigButton("Export", () => void this.export());
		this._batch_export = new BigButton("Batch Export", () => {

			// setup the selectory elements
			this.selectory.selection(
				"Select which items to export.",
				doExportBatchConfirm, doBatchCancel
			);

			// hide the toggle to replace existing items
			this.selectory.delswap.show(1);

			// show the selectory to the user after populating it
			this.selectory.fill(this.exportAll());
			this.swap.next();
		});
		this._copy         = new BigButton("Copy",
			(() => {
				this.copy();

				if (!("groupEntry" in this)) return;

				this.setGroup();
			}),
		);
		
		this._import       = new BigButton("Import");
		this._import.input.type   = "file";
		this._import.input.accept = ".json";
		this._import.input.addEventListener("change", (e) => {
			this.import(e);
			this._import.input.value = null;
		}, false);

		this._batch_import = new BigButton("Batch Import");
		this._batch_import.input.type   = "file";
		this._batch_import.input.accept = ".batch.json";
		this._batch_import.input.addEventListener("change",  (e) => {
			
			// setup the selectory elements
			this.selectory.selection(
				"Select which items to import.",
				doImportBatchConfirm, doBatchCancel
			);

			// show the toggle to replace existing items
			this.selectory.dtoggle.checked = false;
			this.selectory.delswap.show(0);

			// import the file and show the selectory to the user
			this.importBatch(e);
			this._batch_import.input.value = null;
			this.swap.next();

		}, false);

		const cell = ((bigbutton, tooltiptext) => {
			return element("td", [
				tooltip(bigbutton.label, tooltiptext),
				bigbutton.input
			]);
		});

		this.root.appendChild(element("table", [
			element("tr", [
				cell(this._save,
					"Save all sheet data to this web browser's local storage."
				),
				cell(this._export,
					"Download the selected item as a file."
				),
				cell(this._batch_export,
					"Download all items as a group file."
				),
			]),
			element("tr", [
				cell(this._copy,
					"Create a copy of the selected item."
				),
				cell(this._import,
					"Upload a file from the disk to edit."
				),
				cell(this._batch_import,
					"Upload a group file from the disk to edit."
				),
			]),
		]));

		/* Add button */

		this._add = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Add",
				onclick : (() => {
					this.add();

					if (!("groupEntry" in this)) return;

					this.setGroup();
				}),
			},
		});

		this.root.appendChild(this._add);

		/* Template select */

		if (options.sortfilter) {
			this._sf    = options.sortfilter;
			this.select = this._sf._select;
			this.root.appendChild(this._sf.root);
		} else {
			this.root.appendChild(this.select = element("select", {
				class   : ["simple-border"],
				content : options.templates.map(template =>
					element("option", {
						content : template,
						attrs   : {value: template},
					})
				),
			}));
		}

		const getTitle = ((x) => {
			return this.model.getTitle(x);
		});

		const getBody = ((x) => {
			return this.model.getBody(x);
		});

		if (options.groups instanceof Array) {
			this.groupEntry = element("select", {
				class   : ["simple-border"],
				content : options.groups.map(name =>
					element("option", {
						content : name,
						attrs   : {value: name},
					})
				),
			});

			const move = element("input", {
				class: ["simple-border"],
				attrs: {
					type    : "button",
					value   : "Move To",
					onclick : (() => {
						this.setGroup();
					}),
				}
			});

			this.root.appendChild(element("div", [
				move, this.groupEntry, element("br")
			]));
		} else if (options.groups == "custom") {

			const uid = uniqueID();

			this._customs = element("datalist", {
				attrs : {id: uid}
			});

			this.groupEntry = element("input", {
				class : ["simple-border"],
				attrs : {
					type       : "search",
					onkeypress : (() => {
						if (event.key == "Enter") this.setGroup();
					}),
				}
			});

			const move = element("input", {
				class: ["simple-border"],
				attrs: {
					type    : "button",
					value   : "Move To",
					onclick : (() => {
						this.setGroup();
					}),
				}
			});

			this.root.appendChild(element("div", [
				move, this.groupEntry, this._customs, element("br")
			]));

			// apparently this has to be set once both are on the document
			this.groupEntry.setAttribute("list", uid);
		}

		this.map = new Map();

		{
			// TODO this is to catch a bug; remove when resolved
		
			const bb     = this;
			const oldSet = this.map.set;

			this.map.set = function(key, value) {

				if (bb.name == "characters") {

					console.log(`Saving ${JSON.stringify(value.name)}`);

					if (Item.has(value.name)) {
						console.trace(`Character: ${value.name}`);
						alert("Press Ctrl-Shift-I and send Ryan a screenshot.");
					}

				}

				oldSet.call(this, key, value);
			};
		
		}

		
		const model   = new CategoryModel(
			options.name, this.map, getTitle, getBody, () => []
		);

		this.category = new MultiActiveCategory(model, {
			name        : options.name,
			empty       : options.empty || "Something went wrong!",
			selectable  : false,
			reorderable : true,
			removable   : true,
			ontoggle    : ((category, key) => void this.change(key)),
			onremove     : ((category, key) => void this.remove(key, true)),
			parent       : this.root,
			defaultGroup : options.defaultGroup ?? "",
			groupShowTitle : this.groupShowTitle,

			onGroupCreated : ((category, group) => {
				// console.log("CREATE", group.key);
				this._createSuggestion(group.key);
			}),

			onGroupDeleted : ((category, group) => {
				// console.log("DELETE", group.key);
				this._deleteSuggestion(group.key);
			}),

			groupRemovable : options.groups == "custom",

			onGroupRemove  : ((category, group) => {

				const active = Iter.any(category.active, (key) => {
					return group.key == category.element(key).group;
				});

				if (active) {
					alert(wrap(
						"You cannot delete the contents of a group that ",
						"contains an active item."
					));
					return;
				}

				category.deleteGroup(group.key, true);
			}),

			groupUngroupable : options.groups == "custom",

			onGroupUngroup : ((category, group) => {
				category.deleteGroup(group.key, false);
			}),

			groupToggleable : true,

			onGroupToggle : ((category, group) => {
				category.toggleGroupActive(group.key);
			})
		});

		this.selectGroup = options.selectGroup ?? this.category.defaultGroup;

		options.getTitle = getTitle;
		options.getBody  = getBody;

		this.selectory = new InteractiveSelection(options);

		this.swap = new SwapText([this.root, this.selectory.root], true);

		this.root = this.swap.root;
	}

	static GROUP_OPTIONS = {hideable: true};

	_createSuggestion(group) {

		if (!("_customs" in this)) return;

		const options = this._customs.children;
		const option  = element("option", {attrs: {value: group}});

		if (options.length == 0 || this._customs.lastChild.value < option.value) {
			this._customs.appendChild(option);
			return;
		}

		for (let i = 0; i < options.length; ++i) {
			if (option.value <= options[i].value) {
				options[i].insertAdjacentElement("beforebegin", option);
				break;
			}
		}
	}

	_deleteSuggestion(group) {

		if (!("_customs" in this)) return;

		const options = this._customs.children;

		if (options.length == 0) return;

		for (let i = 0; i < options.length; ++i) {
			if (options[i].value == group) {
				options[i].remove();
				break;
			}
		}
	}

	setGroup(group=this.groupEntry.value) {
		for (const each of this.category.active) {
			this.category.setGroupFor(each, group, Buildables.GROUP_OPTIONS);
		}
	}

	setTitle(key, title) {
		if (key == null || !this.category.has(key)) return false;
		this.category.element(key).title = title;
		return true;
	}

	setBody(key, body) {
		if (key == null || !this.category.has(key)) return false;
		this.category.element(key).description = body;
		return true;
	}
	
	recieve(retrieved) {
		
		// if we got nothing, or got something we don't own, just discard it
		if (!retrieved || !this.map.has(retrieved.id)) return;
		
		// store the updated data we got from the model
		this.map.set(retrieved.id, retrieved.data);

		// this should deactivate the element
		this.category.toggleActive(retrieved.id);
	}
	
	dummy(object) {
		return {
			name        : this.model.getTitle(object),
			description : this.model.getBody(object),
		};
	}

	add(group=this.selectGroup) {

		const freshID  = uniqueID();

		// give the new buildable to the model and take any olds it returns
		this.recieve(this.model.give(freshID, this.select.value));

		// get a copy of whatever the model just initialized
		this.map.set(freshID, this.model.take(freshID, true));
		this.category.add(freshID, {group});
		this.category.toggleActive(freshID);

		return freshID;
	}

	change(key) {

		// nothing to do for an invalid key
		if (key == null || !this.category.has(key)) return key;

		// trying to toggle off an active selection
		if (this.category.isActive(key)) {

			// try to take the data back from the model
			const data = this.model.take(key);

			// if it didn't give us anything we're done here
			if (!data) return key;

			// store the data it gave us and toggle of the selection
			this.map.set(key, data);
			this.category.toggleActive(key);

			return key;
		}
		
		// turn on the new selection
		this.category.toggleActive(key);

		// hand the data over to the model and process anything we get back
		this.recieve(this.model.give(key, this.map.get(key)));

		return key;
	}

	sync(key) {

		if (key) {
			this.map.set(key, this.model.take(key, true));
			return;
		}

		for (const key of this.category.active) {
			this.map.set(key, this.model.take(key, true));
		}
	}

	remove(key, interactive=false) {

		// nothing to do for an invalid key
		if (key == null || !this.category.has(key)) return key;

		// if the key is active that means the model owns it
		if (this.category.isActive(key)) {

			// try to take the data back from the model
			const data = this.model.take(key);

			// if we don't get anything the model still owns the data
			if (!data) {
				if (interactive) alert("Can't delete this while active.");
				return false;
			}

			// since we got it we own it and are allowed to delete it
		}

		// do the actual deletion
		this.category.delete(key);
		this.map.delete(key);
		
		return true;
	}

	save() {
		/* global sheet */
		sheet.save();
	}

	copy(key, group=this.selectGroup) {

		if (key == null) {
			for (const each of Array.from(this.category.active))
				this.copy(each, group);
			return;
		}

		// nothing to do for an invalid key
		if (!this.category.has(key)) return key;

		const freshID = uniqueID();

		const clone   = (
			this.category.isActive(key)
				? this.model.take(key, true)
				: structuredClone(this.map.get(key))
		);

		// give the new buildable to the model and take any olds it returns
		this.recieve(this.model.give(freshID, clone));

		this.map.set(freshID, clone);
		this.category.add(freshID, {group});
		this.category.toggleActive(freshID);

		return freshID;
	}

	clear() { // TODO makesure this works with the rewrite
		this.map.clear();
		this.category.clear();
		this.model.clear();

		if (this.groups == "custom") {
			while (this._customs.firstChild) {
				this._customs.removeChild(this._customs.lastChild);
			}
		}
	}

	exportAll(interactive=false) {

		this.sync();

		const data   = {
			version  : Version.CURRENT.toString(),
			active   : null,
			elements : []
		};
		
		for (let name of this.category.names()) {

			// filter out unselected elements for user exported data
			if (interactive && !this.selectory.isSelected(name))
				continue;

			const element = {
				id     : name,
				group  : this.category.element(name).group,
				active : this.category.isActive(name),
				data   : this.map.get(name),
			};
			
			data.elements.push(element);
		}

		return data;
	}

	importAll(data, interactive=false) {

		data = this._updateBatch(data);

		if (!interactive) {
			this.map.clear();
			this.category.clear();
			this.model.clear();
		}

		for (let each of data.elements) {

			// filter out unselected elements for user imported data
			if (interactive && !this.selectory.isSelected(each.id))
				continue;

			// make sure not to accidentally duplicate an element id
			if (this.category.has(each.id))
				each.id = uniqueID();

			// add the element to this buildables
			this.map.set(each.id, this._updateData(each.data));
			this.category.add(each.id, {group: each.group});

			// this should add all object the model can hold one by one
			if (each.active) this.change(each.id);
		}
	}

	exportObject(key) {
		return this.model.take(key, true);
	}

	export(key) {

		if (key == null) {
			for (const each of Array.from(this.category.active))
				this.export(each);
			return;
		}

		if (!this.category.has(key)) return;

		const a    = element("a");
		const item = this.exportObject(key);
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = `${item.name.replace(/ /g, "_")}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	exportBatch(interactive=false) {
		const a    = element("a");
		const item = this.exportAll(interactive);
		const file = new Blob([JSON.stringify(item, null, 4)], {type: "application/json"});
		a.href     = URL.createObjectURL(file);
		a.download = `${this.model.constructor.name}.batch.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	importObject(object) {
		const freshID = uniqueID();
		this.map.set(freshID, object);
		this.category.add(freshID, {group: this.selectGroup});
		this.change(freshID);
	}

	import(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			const item     = JSON.parse(e.target.result);
			this.importObject(this._updateData(item));
		};
		
		reader.readAsText(file);
	}

	importBatch(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			const item = JSON.parse(e.target.result);
			this.selectory.fill(this._updateBatch(item));
		};
		
		reader.readAsText(file);
	}

	*iter() {
		for (let key of this.map.keys()) {
			this.change(key);
			yield this.model;
		}
	}

}

/* exported Buildables */
/* exported BuildableModel */
