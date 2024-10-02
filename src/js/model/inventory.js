
/* global
	SwapText,
	element, capitalize, choice
*/

/* global Item */

/* global BuildableModel */

/* global Items */

class Inventory extends BuildableModel {

	static ITEM_IDS = new Set(["item", "equipment"]);

	constructor(sheet) {
		super();

		this.empties = true;

		const imodel  = new Items(sheet, {itemID: "item"});
		imodel.summaryText.data = "Implement";
		
		const emodel  = new Items(sheet, {itemID: "equipment"});
		emodel.summaryText.data = "Equipment";

		const iswap   = new SwapText([
			element("div", [
				element("span", "Weapon or Implement", "underline", "bold"),
				element("br"),
				element("p", "Not wielding a weapon or implement."),
			]),
			imodel.root,
		], true);

		const eswap   = new SwapText([
			element("div", [
				element("span", "Equipment", "underline", "bold"),
				element("br"),
				element("p", "Not wielding any special equipment."),
			]),
			emodel.root,
		], true);

		this.root = element("div", [
			iswap.root,
			eswap.root,
		]);

		this._indirection = new Map([
			["item"      , imodel],
			["equipment" , emodel],
		]);

		this.item        = {
			model : imodel,
			swap  : iswap,
		};

		this.equipment   = {
			model : emodel,
			swap  : eswap,
		};

		this.byType = new Map([
			["equipment" , this.equipment],
			["implement" , this.item     ],
			["weapon"    , this.item     ],
		]);

		this.byUUID = new Map();

		this.uuid = new Map();
	}

	getByUUID(uuid) {
		return this.byUUID.get(uuid).model;
	}

	get(key) {
		return this._indirection.get(key);
	}

	has(key) {
		return Boolean(this.get(key).uuid);
	}

	equipped(key) {
		const model = this.get(key);
		return model.uuid ? model : null;
	}

	getByType(name) {
		return this.byType.get(Inventory.getItemType(name)).model;
	}

	*[Symbol.iterator]() {
		
		if (this.item.model.uuid)
			yield this.item.model;

		if (this.equipment.model.uuid)
			yield this.equipment.model;

	}

	*pairs() {
		if (this.item.model.uuid)
			yield this.item;

		if (this.equipment.model.uuid)
			yield this.equipment;
	}

	static isTaggedBB(bb, tag) {
		return Item.get(bb.template).tagged(tag) || bb.tags.includes(tag);
	}

	static getItemType(item) {

		if (typeof item == "string" || item instanceof String) {
			return Item.get(item).getItemType();
		}

		const template = Item.get(item.template);

		for (let each of Item.SUBTYPES) {

			if (template.tagged(each))
				return each;

			if (item.tags.includes(each))
				return each;
		}

		return "implement";
	}

	/* BuildableModel interface */

	give(key, data, doExport=true) {

		let   result = null;
		const type   = Inventory.getItemType(data);
		const item   = this.byType.get(type);
		
		if (doExport && item.swap.mode) {
			result = {id: item.model.uuid, data: item.model.export()};
		}

		item.model.uuid = key;
		item.model.summaryText.data = capitalize(type);
		item.swap.show(1);

		this.byUUID.set(key, item);

		if (typeof data == "string" || data instanceof String) {
			item.model.clear(data);
		} else {
			item.model.import(data);
		}

		return result;
	}

	take(key, copy=false) {

		if (!this.byUUID.has(key)) return null;

		const item = this.byUUID.get(key);
		const data = item.model.export();

		if (copy) return data;

		this.byUUID.delete(key);
		item.model.uuid = null;
		item.model.clear();
		item.swap.show(0);

		return data;
	}

	import(object) {
		
		const type                  = Inventory.getItemType(object);
		const item                  = this.byType.get(type);
		
		item.model.summaryText.data = capitalize(type);
		item.swap.show(1);

		item.model.import(object);
	}

	export(key) {

		if (!key) {
			const options = Array.from(this._indirection.keys());
			const chosen  = choice(options);
			return this._indirection.get(chosen).export();
		}

		return this.take(key, true);
	}

	clear(object) {

		if (object == null) {
			for (const {model, swap} of this.pairs()) {
				model.clear();
				swap.show(0);
			}
			return;
		}

		const type = Inventory.getItemType(object);
		const item = this.byType.get(type);
		
		// item.model.uuid             = null;
		
		item.model.summaryText.data = capitalize(type);
		item.swap.show(1);

		item.model.clear(object);
	}

	getTitle(object) {
		return object.name;
	}

	getBody(object) {
		return element("span", object.description || object.template);
	}

}

/* exported Inventory */