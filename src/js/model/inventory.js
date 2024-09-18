
/* global
	SwapText,
	element
*/

/* global BuildableModel */

/* global Items */

class Inventory extends BuildableModel {

	static ITEM_IDS = new Set(["item", "equipment"]);

	constructor(sheet) {
		super();

		this.item      = new Items(sheet, {itemID: "item"});
		this.item.summaryText.data = "Implement";
		this.equipment = new Items(sheet, {itemID: "equipment"});
		this.equipment.summaryText.data = "Equipment";
		this.last      = this.item;

		this.iswap     = new SwapText([
			this.item.root,
			element("span", "Not holding a weapon or implement.")
		], true);

		this.eswap     = new SwapText([
			this.equipment.root,
			element("span", "Not wearing equipment.")
		], true);

		this.root = element("div", [
			this.iswap.root,
			this.eswap.root,
		]);

		this._indirection = new Map([
			["item"      , this.item],
			["equipment" , this.equipment],
		]);
	}

	get(key) {
		return this._indirection.get(key);
	}

	static ITEM_TYPES = ["equipment", "weapon", "implement"];

	static getItemType(item) {

		const template = Item.get(item.template);

		for (let each of Inventory.ITEM_TYPES) {

			if (template.tagged(each))
				return each;

			if (item.tags.includes(each))
				return each;
		}

		return "implement";
	}

	/* BuildableModel interface */

	import(object) {
		
		const type = Inventory.getItemType(object);

		if (type == "equipment") {
			this.last                  = this.equipment;
			this.eswap.show(0);
		} else {
			this.last                  = this.item;
			this.item.summaryText.data = capitalize(type);
			this.iswap.show(0);
		}

		this.last.import(object);
	}

	export() {
		return this.last.export();
	}

	clear(object) {
		this.last.clear();
	}

	getTitle(object=this.last) {
		return object.name;
	}

	getBody(object=this.last) {
		return element("span", object.template?.name || object.description);
	}

}

/* exported Inventory */