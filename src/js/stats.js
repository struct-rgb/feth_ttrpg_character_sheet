


class LevelStamp {

	static NAMES = [
		"hp",
		"str",
		"mag",
		"dex",
		"spd",
		"def",
		"res",
		"cha",
	];

	static SHIFT = BigInt(32);

	static MASK  = BigInt(0xFFFFFFFF);

	constructor(level, increases, date) {
		this.level     = level;
		this.increases = increases;
		this.date      = date;
	}

	*words() {
		let word = 0;
		for (let i = 0; i < 8; ++i) {
			const name       = LevelStamp.NAMES[i];
			const increased  = this.increases.has(name);
			word            |= increased << i;
		}
		word |= this.level << 8;
		yield word;
		
		const integer = BigInt(this.date.getTime());

		yield Number(integer >> LevelStamp.SHIFT);
		yield Number(integer &  LevelStamp.MASK);
	}

	pack() {
		return LevelStamp.pack(this);
	}

	static read(block, start) {
		const level     = block[start] >> 8;
		const increases = new Set();
		for (let i = 0; i < 8; ++i) {
			if (block[start] & (1 << i)) {
				increases.add(LevelStamp.NAMES[i]);
			}
		}
		const timestamp = Number(
			(BigInt(block[start + 1])
				<< LevelStamp.SHIFT) | BigInt(block[start + 2])
		);
		return new LevelStamp(level, increases, new Date(timestamp));
	}

	static write(block, sub, stamp) {
		const iter     = stamp.words();
		block[sub]     = iter.next().value;
		block[sub + 1] = iter.next().value;
		block[sub + 2] = iter.next().value;
		return block;
	}

	static pack(data) {

		if (data instanceof LevelStamp) {
			return LevelStamp.write(new Uint32Array(3), 0, data);
		}
		
		const block = new Uint32Array(data.length * 3);
		for (let i = 0; i < data.length; ++i) {
			LevelStamp.write(block, i * 3, data[i]);
		}
		return block;
	}

	static unpack(block) {
		const array = [];
		for (let i = 0; i < block.length; i += 3) {
			array.push(LevelStamp.unpackTriple(block, i));
		}
		return array;
	}
}

class Stats {

	static BASE_OPTIONS = {
		value : 0,
		shown : "0",
		style : "datum"
	};

	static GROW_OPTIONS = {
		value  : 0,
		shown  : "0%",
		before : "(",
		after  : ")",
		style  : "datum"
	};

	constructor(stats, sheet) {
		this.root   = document.createElement("div");
		this.names  = stats;
		this.sheet  = sheet;

		{
			const tbody = document.createElement("tbody");
			const table = document.createElement("table");

			/* level stuff */ {
				const tr      = document.createElement("tr");
				const th      = document.createElement("th");
				th.appendChild(document.createTextNode("Level"));
				tr.appendChild(th);

				this._level = new AttributeCell({style: "datum"}, (x) => {
					return Math.floor(x / 100) + 1;
				});

				this._level.maximum = 9900;
				tr.appendChild(this._level.root);

				const td      = document.createElement("td");
				const input   = document.createElement("input");
				input.type    = "button";
				input.value   = "Up";
				input.onclick = (() => {this.levelUp()});
				input.classList.add("simple-border");
				td.appendChild(input);
				tr.appendChild(td);

				tbody.appendChild(tr);
			}

			this.stats   = {};
			this.growths = {};

			for (let item of stats) {
				const stat = item;
				const tr   = document.createElement("tr");
				tr.appendChild(element("th", stat.toUpperCase()));

				const base = new AttributeCell(Stats.BASE_OPTIONS, (base) => {

					const value = Math.max(
						((stat == "mov" ? 4 : 0)
							+ sheet.class.modifier(stat, sheet.mounted)
							+ sheet.modifier(stat)
							+ base)
						* sheet.multiplier(stat),
						0
					);

					sheet.cache.stats[stat] = value;
					sheet.cache.stats["base_" + stat] = base;

					/* get rid of this feature */
					if (stat == "hp") {
						const display   = document.getElementById("hitpoints");
						display.max     = sheet.cache.stats.hp;
						display.optimum = sheet.cache.stats.hp;
						display.high    = Math.floor(sheet.cache.stats.hp / 2);
						display.low     = Math.floor(sheet.cache.stats.hp / 4) + 1;
						sheet.refreshHealthBar();
					}

					sheet.combatarts.equipped.trigger(stat);
					sheet.combatarts.known.trigger(stat);
					sheet.weapons.known.trigger(stat);

					this.refreshSecondary();

					return value;
				});

				this.stats[stat] = base;

				tr.appendChild(base.root);

				if (stat == "mov") {
					tr.appendChild(document.createElement("td"));
				} else {
					const grow = new AttributeCell(Stats.GROW_OPTIONS, (x) => {
						
						const growth = Math.max(
							x + Number(sheet.class.growths[stat]),
							0
						);

						sheet.cache.growths[stat] = growth;
						return growth + "%";
					});

					this.growths[stat] = grow;

					tr.appendChild(grow.root);
				}

				tbody.appendChild(tr);
			}

			table.appendChild(tbody);
			this.root.appendChild(table);
		}

		this.root.appendChild(element("hr"));

		this.secondary = {};

		{
			const tbody = document.createElement("tbody");
			const table = document.createElement("table");

			const rows = [
				["Physical", ["+", "pmt"], ["-", "pdr"]],
				["Magical", ["+", "mmt"], ["-", "mdr"]],
				["Hit/Avoid", ["+", "hit"], ["-", "avo"]],
				["Range", ["≤", "maxrng"], ["≥", "minrng"]],
				["Crit/Avoid", ["+", "newcrit"], ["-", "cravo"]],
				["Critical", ["+", "crit"], null],
			];

			for (let row of rows) {
				const  tr          = document.createElement("tr");
				const [th, ...tds] = row;

				tr.appendChild(element("th", th));

				for (let td of tds) {

					if (td == null) {
						tr.appendChild(document.createElement("td"));
						continue;
					}

					const [punct, name]  = td;
					const cell           = new AttributeCell({
						style  : "computed",
						before : punct
					});

					this.secondary[name] = cell;
					tr.appendChild(cell.root);
				}

				tbody.appendChild(tr);
			}

			table.appendChild(tbody);
			this.root.appendChild(table);
		}
	}


	/**
	 * The character's level
	 * @type {number}
	 */
	get level() {
		return this._level.value;
	}

	set level(value) {
		this._level.value = value;
	}

	/**
	 * Set all stats and growths to zero. Secondary stats may not become zero
	 * depending on equipped abilities, weapons, and/or arts.
	 */
	clear() {
		for (let name of this.names) {
			this.stats[name].value = 0;
			if (name == "mov") continue;
			this.growths[name].value = 0;
		}
	}

	/**
	 * Recompute display values for all primary and secondary stats.
	 */
	refresh() {
		this.refreshPrimary();
		this.refreshSecondary();
	}

	/**
	 * Recompute display values for primary stats.
	 */
	refreshPrimary() {
		// console.log(this.stats, this.growths);
		for (let name of this.names) {
			// this.stats.cells[name].refresh();
			this.stats[name].refresh();
			if (name == "mov") continue;
			// this.growths.cells[name].refresh();
			this.growths[name].refresh();
		}
	}

	/**
	 * Recompute display values for secondary stats.
	 */
	refreshSecondary() {
		for (let [base, mod] of this.sheet.data.stats.linked) {
			const value = this.sheet.calcSecondaryStat(base, mod, this.sheet.cache);
			this.sheet.cache.stats[mod] = value;
			// document.getElementById(mod + "-total").textContent = value;
			this.secondary[mod].value = value;
		}
	}

	/**
	 * Set primary statistic and growth values from an object. The object should
	 * have the fields "statistics" for primary stats, and "growths" for the 
	 * growths, each consisting of accurate stat names and integer values.
	 * This is based on the format of the sheet export data file.
	 8 @param {object} object - object to set stats and growths from
	 */
	import(object) {
		for (let name of this.names) {
			this.stats[name].value   = object.statistics[name];
			if (name == "mov") continue;
			this.growths[name].value = object.growths[name];
		}
	}

	/**
	 * Return a collection of current values for primary statistics and growths.
	 * @returns {object} a collection of primary statistics and growths.
	 */
	export() {

		const object = {statistics: {}, growths: {}};

		for (let name of this.names) {
			object.statistics[name] = this.stats[name].value;
			if (name == "mov") continue;
			object.growths[name] = this.growths[name].value;
		}

		return object;
	}

	/**
	 * Increase the character's level by 1, with a probability for each stat to
	 * increase by 1 equal to the growth rate of that stat. If one or fewer stats
	 * increase, allow the user to choose one stat to increase by one instead.
	 */
	levelUp() {
		// statistics that increased from this level up
		const increases = new Set();
		const names     = this.names.filter(
			name => name != "mov" // This ain't Jugdral, we don't do mov growth.
		);

		// for each stat, if roll succeeds increase statistic
		for (let name of names) {
			if (Math.random() * 100 <= this.growths[name].value) {
				increases.add(name);
			}
		}

		// if only of fewer statistics increased during level up,
		// then prompt user for stat to increase with popup
		if (increases.size <= 1) {

			let   choosen     = null;
			const prompt_text = (
				"Enter one of: " + names.join(" ")
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
			this.stats[name].value += 1;
		}

		this.level += 100; // this._level stores exp points

		this.refreshSecondary();
		
		// store the levelup record for later
		// const level = Math.floor(this.level / 100) + 1;
		// this.levelups.push(new LevelStamp(level, increases, new Date()));
	}
}
