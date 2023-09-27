
/* global element */
/* global tooltip */
/* global wrap */
/* global AttributeCell */
/* global Toggle */

/* global Class */
/* global Expression */
/* global AttackFeature */

/* global PointBuy */

/**
 * Record of the statistical information associated with a level up
 */
class LevelAttempt {

	static NAMES = [
		"hp", "str", "mag", "dex", "spd", "def", "res", "lck",
	];

	static NAME_INDEX = new Map([
		["hp"  , 0],
		["str" , 1],
		["mag" , 2],
		["dex" , 3],
		["spd" , 4],
		["def" , 5],
		["res" , 6],
		["lck" , 7],
	]);

	static WEIGHT = [
		0.50, 1.0, 1.0, 0.50, 1.50, 1.0, 1.0, 0.50
	];

	/**
	 * Create an instance
	 * @param {string} cls - name of the class this levelup was rolled in
	 * @param {string} method - increase assignment methodology name
	 * @param {array} increases - array (8) of point increases to each stat
	 * @param {string?} mercy - mercy increase assignment methodology name
	 */
	constructor(cls, method, increases, mercy="None") {
		this.class     = cls;
		this.method    = method;
		this.increases = increases;
		this.mercy     = mercy;
		this.total     = 0;
		this.weight    = 0;

		this._total();
		this._weight();
	}

	/**
	 * Sum the statistic increases for this level
	 * @return {number} sum of statistic increases for this level
	 */
	_total() {
		this.total = LevelAttempt.total(i => this.increases[i]);

	}

	/**
	 * Weighted sum of statistic increases for this level
	 * @return {number} weighted sum of statistic increases for this level
	 */
	_weight() {
		this.weight = LevelAttempt.weight(i => this.increases[i]);
	}

	/**
	 * Create JSON serializable representation of this instance
	 * @return {object} JSON serializable representation
	 */ 
	export() {
		return [this.class, this.method, this.increases, this.mercy];
	}

	difference(that) {

		const diffs = [];

		for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
			diffs.push(this.increases[i] - that.increases[i]);
		}

		return new LevelAttempt("None", "None", diffs, "None");
	}

	clear() {
		for (let i = 0; i < this.increases.length; ++i) {
			this.increases[i] = 0;
		}
		this.total     = 0;
		this.weight    = 0;
	}

	static weight(element) {
		let total = 0;

		for (let i = 0; i < LevelAttempt.WEIGHT.length; ++i) {
			total += LevelAttempt.WEIGHT[i] * element(i);
		}

		/* remove the lower of Strength and Magic (both weigh 1) */
		total -= Math.min(element(1), element(2));

		return total;
	}

	static total(element) {
		let total = 0;

		for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
			total += element(i);
		}

		return total;
	}
}

/**
 * Record of multiple LevelAttempt associated with the same level
 */
class Level {

	/**
	 * Create an instance
	 * @param {array} levels - array of LevelAttempt objects
	 * @param {number?} index - array index of active LevelAttempt; default 0
	 */
	constructor(levels, index=0) {
		this.index  = index;
		this.levels = levels;
	}

	/**
	 * Get the active LevelAttempt in this set of attempts
	 * @return {LeveUp} active LevelAttempt in from this set of attempts
	 */
	get active() {
		return this.levels[this.index];
	}

	/**
	 * Create JSON serializable representation of this instance
	 * @return {object} JSON serializable representation
	 */ 
	export() {
		return {
			index : this.index,
			rolls : this.levels.map(level => level.export()),
		};
	}

	/**
	 * Create an instance from a JSON serializable representation
	 * @param {array} levels - array of LevelAttempt.export() objects
	 * @param {number?} index - array index of active LevelAttempt
	 * @return {Level} created instance
	 */ 
	static import(rolls, index=0) {
		return new Level(
			rolls.map(roll => new LevelAttempt(...roll)), index
		);
	}

}

/**
 * Data necessary for the level up animation for {@link LevelHistory}
 */
class LevelAnimation {

	/**
	 * Create an instance
	 * @param {Array.HTMLElement} titles - array of HTMLElements to animate 
	 * @param {Array.HTMLElement} inputs - inputs to disable as animation plays
	 */
	constructor(titles, inputs=[], incr_cls="incr-bell", decr_cls="decr-bell") {

		this.titles    = titles;
		this.inputs    = inputs;
		this._incrBell = new Audio("./resources/ding-126626_trimmed.wav");
		this._decrBell = new Audio("./resources/cowbell_os_1-89685.mp3");
		this._dings    = [];
		this.disabled  = false;
		this._incr_cls = incr_cls;
		this._decr_cls = decr_cls;

		this._incrBell.addEventListener("ended", (event) => this.next());
		this._decrBell.addEventListener("ended", (event) => this.next());
	}

	/**
	 * Add input to disable while animation plays
	 * @param {HTMLElement} input - input to disable
	 */
	addLock(input) {
		this.inputs.push(input);
		return input;
	}

	/**
	 * Disable inputs; used to prevent interference while animation plays
	 * @param {boolean} value - whether to lock or unlock
	 */
	lock(value) {
		for (let input of this.inputs) {
			input.disabled = value;
		}
	}

	/**
	 * Play the animation
	 * @param {LevelAttempt} levelattempt - levelattempt to animate
	 */
	async play(levelattempt) {
		if (this.disabled) return;
		this.set(levelattempt);
		this.next();
	}

	/**
	 * Queue which of the titles to highlight when animation plays next
	 * @param {LevelAttempt} levelattempt - levelattempt to animate
	 */
	set(levelattempt) {
		this.lock(true);
		const array = levelattempt.increases;

		this._dings.length = 0;
		for(let i = array.length; i >= 0; --i) {
			if (array[i]) this._dings.push(i, array[i]);
		}
	}

	/**
	 * Clear applied styles on all highlighted elements
	 */
	clear() {
		for (let title of this.titles) {
			const classes = title.classList;
			if (classes.contains(this._incr_cls)) {
				classes.remove(this._incr_cls);
			}
			if (classes.contains(this._decr_cls)) {
				classes.remove(this._decr_cls);
			}
		}
		this.lock(false);
	}

	/**
	 * Play the next sound effect/highligh in the queue
	 */
	async next() {
		if (this._dings.length) {

			const color = this._dings.pop();
			const title = this.titles[this._dings.pop()];

			if (color > 0) {
				title.classList.add(this._incr_cls);
				this._incrBell.play();
			} else if (color < 0) {
				title.classList.add(this._decr_cls);
				this._decrBell.play();
			} else {
				throw new Error(
					`recieved invalid bell modifier ${color}`
				);
			}
		} else {
			setTimeout(() => this.clear(), 2000);
		}
	}
}

/**
 * Widgit used to inspect and edit a LevelHistory instance
 */
class LevelHistory {

	static EMPTY = {bases: [0, 0, 0, 0, 0, 0, 0, 0], levels: []};

	static levelUpOptions = new Map([
		["Random/Prompt", "Roll to increase each stat. If less than two, user chooses one instead."],
		["Random/Random", "Roll to increase each stat. If no stats increase, increase one at random."],
		["Random/Average", "Roll to increase each stat. If less than two, choose one with this priority: most screw, hightest growth, leftmost."],
		["Average/None", "Increase each of the stats that has more than zero screw."],
		["Manual/None", "Choose whether or not to increase each of the stats."],
		["Bonus/None", "Increase a choosen stat by a choosen amount. This is a good way to apply boosting items."],
	]);

	constructor(sheet) {
		this.sheet = sheet;

		this._toadd = element("input", {
			class: ["simple-border", "short-meter"],
			attrs: {
				type    : "number",
				value   : 1,
				min     : 1,
				oninput : (() => console.log("TODO")), 
			},
		});

		this._methodText = document.createTextNode("");

		const updateMethodText = () => {
			const key   = this._method.value;
			const value = LevelHistory.levelUpOptions.get(key); 
			this._methodText.data = `${key}: ${value}`;
		};

		this._method = element("select", {
			class   : ["simple-border"],
			attrs   : {
				value   : "Random/Prompt",
				oninput : updateMethodText,
			},

			content : Array.from(LevelHistory.levelUpOptions.keys()).map(name => (
				element("option", name)
			)),
		});

		updateMethodText();

		this._records  = [];

		this._maxLevel = 1;
		this._maxBonus = 0;
		
		const weightTT = tooltip("Weight", [
			"Sum of stats in this row weighted by their relative values: ",
			element("ul", [
				element("li", "1.5x SPD "),
				element("li", "0.5x HP, DEX, and CHA"),
				element("li", "1.0x the others"),
			]),
		]);

		const titles = LevelAttempt.NAMES.map(name => {
			return element("th", name.toUpperCase());
		});

		this.bells = new LevelAnimation(titles);

		this._tbody = element("tbody",
			element("tr",
				["", "Level", "Source", "Total", weightTT]
					.map(title => element("th", title))
					.concat(titles)
			),
		);

		function totalsCell(getter) {
			return new AttributeCell({
				edit    : false,
				shown   : "0",
				value   : 0,
				min     : 0,
				trigger : (() => {

					let total = 0;

					for (let i = 0; i < LevelAttempt.WEIGHT.length; ++i) {
						total += Number(getter(i));
					}

					return total;
				}),
			});
		}

		function weightCell(getter) {
			return new AttributeCell({
				edit    : false,
				shown   : "0.00",
				value   : 0,
				min     : 0,
				trigger : (() => {

					let total = 0;

					for (let i = 0; i < LevelAttempt.WEIGHT.length; ++i) {
						total += LevelAttempt.WEIGHT[i] * Number(getter(i));
					}

					/* remove the lower of Strength and Magic (both weigh 1) */
					total -= Math.min(Number(getter(1)), Number(getter(2)));

					return total.toFixed(2);
				}),
			});
		}

		this._bases = LevelAttempt.NAMES.map(name => new AttributeCell({
			edit    : true,
			shown   : "0",
			value   : 0,
			min     : 0,
			trigger : (base => {

				const index = LevelAttempt.NAME_INDEX.get(name);
				this._totals[index].refresh();
				this._averages[index].refresh();

				this._bases_totals.refresh();
				this._bases_weight.refresh();

				this._totals_totals.refresh();
				this._totals_weight.refresh();

				this._averages_totals.refresh();
				this._averages_weight.refresh();

				this._screw_totals.refresh();
				this._screw_weight.refresh();

				return base;
			}),
		}));

		this._bases_totals = totalsCell((i) => this._bases[i].value);
		this._bases_weight = weightCell((i) => this._bases[i].value);

		this._totals = LevelAttempt.NAMES.map(name => new AttributeCell({
			edit    : false,
			shown   : "0",
			value   : 0,
			min     : 0,
			trigger : (() => {

				const index = LevelAttempt.NAME_INDEX.get(name);
				let   total = this._bases[index].value;

				for (let level of this.levels()) {
					total += level.increases[index];
				}

				return total;
			}),
		}));

		this._totals_totals = totalsCell((i) => this._totals[i].shown);
		this._totals_weight = weightCell((i) => this._totals[i].shown);

		this._averages = LevelAttempt.NAMES.map(name => new AttributeCell({
			edit    : false,
			shown   : "0",
			value   : 0,
			min     : 0,
			trigger : (() => {
				const index = LevelAttempt.NAME_INDEX.get(name);
				let   total = this._bases[index].value;
				return total + Math.floor(this.averages("None", 0).average[index]);
			}),
		}));

		this._averages_totals = totalsCell((i) => this._averages[i].shown);
		this._averages_weight = weightCell((i) => this._averages[i].shown);

		this._screw = LevelAttempt.NAMES.map(name => new AttributeCell({
			edit    : false,
			shown   : "+0",
			value   : 0,
			min     : 0,
			trigger : (() => {
				const index = LevelAttempt.NAME_INDEX.get(name);
				const screw = Number(this._averages[index].shown) - Number(this._totals[index].shown);
				return (screw >= 0 ? "+" : "") + String(screw);
			}),
		}));

		this._screw_totals = new AttributeCell({
			edit    : false,
			shown   : "+0",
			value   : 0,
			min     : 0,
			trigger : (() => {
				const screw = Number(this._averages_totals.shown) - Number(this._totals_totals.shown);
				return (screw >= 0 ? "+" : "") + String(screw);
			}),
		});

		this._screw_weight = new AttributeCell({
			edit    : false,
			shown   : "+0.00",
			value   : 0,
			min     : 0,
			trigger : (() => {
				const screw = Number(this._averages_weight.shown) - Number(this._totals_weight.shown);
				return (screw >= 0 ? "+" : "") + screw.toFixed(2);
			}),
		});

		this._chlvls = [];

		const addHeadRow = ((name, list, totals, weight) => {
			
			const checked = new AttributeCell({
				edit    : false,
				shown   : "1",
				value   : 1,
				min     : 1,
				trigger : (() => this.level()),
			});

			this._chlvls.push(checked);

			this._tbody.appendChild(element("tr",
				[
					element("td", ""),
					checked.root,
					element("td", name),
					totals.root,
					weight.root
				]
					.concat(list.map(x => x.root))
			));
		});

		addHeadRow("Mean",
			this._averages,
			this._averages_totals,
			this._averages_weight
		);

		addHeadRow("Total",
			this._totals,
			this._totals_totals,
			this._totals_weight
		);

		addHeadRow(
			tooltip("Screw", [
				"Amount this unit's stats are behind the projected averages ",
				"for this level. Stats with negative screw are those higher ",
				"than the average."
			].join("")),
			this._screw,
			this._screw_totals,
			this._screw_weight
		);

		this._radio = element("input", {
			attrs: {
				type     : "radio",
				name     : "levelv",
				checked  : true,
				onchange : (() => this.select(-1)),
			}
		});

		this._tbody.appendChild(
			element("tr",
				[this._radio, "1", "None"].map(name => element("td", name))
					.concat([this._bases_totals.root, this._bases_weight.root])
					.concat(this._bases.map(x => x.root)))
		);

		this._checked = -1;
		
		this._lrows  = [];
		this._radios = [];

		this._enable_warnings = new Toggle("Roll with Warnings", true);

		this._enable_animation = new Toggle("Level Up Animation", true, () => {
			this.bells.disabled = !this.bells.disabled;
		});

		this.root = element("div", [
			/* level up button */
			this.bells.addLock(element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Up",
					type    : "button",
					onclick : (() => this.up(Number(this._toadd.value)))
				},
			})),
			this._toadd,
			tooltip(this._method, this._methodText),
			this.bells.addLock(element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Erase",
					type    : "button",
					onclick : (() => {
						if (!confirm("Really erase all level data?")) return;
						this.clear();
					}),
				},
			})),
			element("br"),

			/* level down button */
			this.bells.addLock(element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Revert Level",
					type    : "button",
					onclick : (() => this.revert(this._checked))
				},
			})),

			/* reroll level button */
			this.bells.addLock(element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Reroll Level",
					type    : "button",
					onclick : (() => this.reroll(this._checked))
				},
			})), 

			/* revert reroll button */
			this.bells.addLock(element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Revert Reroll",
					type    : "button",
					onclick : (() => this.unroll(this._checked))
				},
			})),

			element("br"),

			/* button to copy bases level to sheet */
			element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Copy Level to Sheet",
					type    : "button",
					onclick : (() => {

						const replace = confirm([
							"This action will replace the values for the ",
							"stats on the main sheet. Continue?",
						].join(""));

						if (!replace) return;

						for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
							const name  = LevelAttempt.NAMES[i];
							const value = Number(this._totals[i].shown);
							this.sheet.stats.stats[name].value = value;
						}

						this.sheet.stats.level = this.level();
					})
				},
			}),

			/* button to copy bases from sheet */
			element("input",  {
				class   : ["simple-border"],
				attrs   : {
					value   : "Get Bases from Sheet",
					type    : "button",
					onclick : (() => {

						for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
							const name  = LevelAttempt.NAMES[i];
							const value = this.sheet.stats.stats[name].value;
							this._bases[i].value = value;
						}

						this.refresh();
					})
				},
			}),

			element("br"),

			tooltip(this._enable_warnings.root,
				"Enable warnings for various potential pitfalls when rolling."
			),

			tooltip(this._enable_animation.root, [
				"Highlight changes with bell sounds. (Sound Effects by ",
				element("a", {
					content : "u_31vnwfmzt6 ",
					attrs   : {
						href: wrap(
							"https://pixabay.com/users/u_31vnwfmzt6-31480456/",
							"?utm_source=link-attribution&utm_medium=referra",
							"l&utm_campaign=music&utm_content=126626",
						)
					}
				}),
				"and ",
				element("a", {
					content : "timgormly ",
					attrs   : {
						href: wrap(
							"https://pixabay.com/sound-effects/",
							"cowbell-os-1-89685/",
						)
					}
				}),
				"from ",
				element("a", {
					content : "Pixabay",
					attrs   : {
						href: wrap(
							"https://pixabay.com/sound-effects//?utm_source=l",
							"ink-attribution&utm_medium=referral&",
							"campaign=music&utm_content=126626",
						)
					}
				}),
				")",
			]),

			element("table", this._tbody, "level-table"),
		]);
	}

	/**
	 * Convenience method for range checking to standardize it across the class
	 * @param {number} row - an index; throws a RangeError if out of range
	 */
	rangeException(row) {
		if (row < -1 || this._records.length <= row) {
			throw new RangeError(`row ${row} is out of range`);
		}
	}

	/**
	 * Get an iterator over each other active rows on the table
	 * @param {until} row - iterate until this row; defaults to selected row
	 * @yield {Level} level object associated with each active row
	 */
	*levels(until=this._checked) {

		this.rangeException(until);

		++until;
		for (let i = 0; i < until; ++i) {
			yield this._records[i].active;
		}
	}

	/**
	 * Get the level number for an active row on the table.
	 * @param {number} row - row index, no value defaults to selected row
	 * @return level number of that row
	 */
	level(row=this._checked) {

		this.rangeException(row);

		if (row == -1) return 1;

		let checked = 1, bonus = 0;
		for (let level of this.levels(row)) {

			if (level.method == "Bonus") {
				bonus   += 1;
			} else {
				checked += 1;
				bonus    = 0;
			}
		}

		return Number(checked + (bonus ? "." + bonus : 0));
	}

	/**
	 * Select the radio button associated with a row on the table; 
	 * @param {number} row - index of row to select
	 */
	select(row) {

		this.rangeException(row);

		this._checked = row;

		this.refreshHead();
		this.refreshSelect();
	}

	mercyPrompt(level, reroll=false) {

		if (level.total > 1) return level;
		level.clear();

		let   choosen     = null;
		const prompt_text = (
			"Enter one of: " + LevelAttempt.NAMES.join(" ")
		);

		while (!LevelAttempt.NAMES.includes(choosen)) {

			choosen = prompt(prompt_text);

			if (choosen === null) {
				if (confirm("Choose at random?")) return this.mercyRandom(level);
			} else {
				choosen = choosen.toLowerCase();
			}
		}

		level.increases[LevelAttempt.NAME_INDEX.get(choosen)] = 1;
		level.mercy = "Prompt";

		level._total();
		level._weight();

		return level;
	}

	mercyRandom(level, reroll=false) {

		if (level.total != 0) return level;

		level.increases[Math.floor(Math.random() * 8)] = 1;
		level.total = 1;
		level.mercy = "Random";

		level._total();
		level._weight();

		return level;
	}

	mercyAverage(level, reroll=false) {

		if (level.total > 1) return level;
		level.clear();

		const {actual, average} = this.averages(level.class, 1, reroll);
		const growths = this.growthsFor(level.class);

		/*
		 * Choose the stat with the most screw; if tied, then from those,
		 * choose the stat with the highest growth; if tied, then from those,
		 * choose the first stat.
		 */

		let s = 0, g = 0, x = 0;
		for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
			const screw  = average[i] - actual[i];
			const growth = growths[i];

			if (screw > s) {
				s = screw;
				g = growth;
				x = i;
			} else if (screw == s && growth > g) {
				g = growth;
				x = i;
			}
		}

		level.increases[x] = 1;
		console.log(`chose ${LevelAttempt.NAMES[x]}`);
		level.mercy = "Average";

		level._total();
		level._weight();

		return level;
	}

	averages(cls, number, reroll=false) {

		const map  = new Map();
		const sums = LevelAttempt.NAMES.map(() => 0);
	
		for (let level of this.levels()) {

			/* bonus levels exist outside normal growth so don't count */
			if (level.method == "Bonus") continue;

			/* if this is a reroll, skip the level to be rerolled */
			if (reroll && level == this._records[this._checked]) continue;

			const count = map.has(level.class) ? map.get(level.class) + 1 : 1;
			map.set(level.class, count);

			for (let i = 0; i < level.increases.length; ++i) {
				sums[i] += level.increases[i];
			}
		}

		map.set(cls, map.has(cls) ? map.get(cls) + number : number);

		const avgs = LevelAttempt.NAMES.map(() => 0);

		for (let [cls, levels] of map.entries()) {
			const growths = this.growthsFor(cls);
			for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
				avgs[i] += (growths[i] / 100) * levels;
			}
		}

		return {map, actual: sums, average: avgs};
	}

	growthsFor(name) {

		const results  = [];
		const template = Class.get(name);

		for (let each of LevelAttempt.NAMES) {

			const sum = Math.max(
				this.sheet.stats.growths[each].value + template.growths[each],
				0
			);

			const cap = Math.min(
				Math.floor((60 - sum) / 10) * 5,
				0
			);

			results.push(sum + cap);
		}

		return results;
	}

	upManual(cls, reroll=false) {

		const results = [];

		for (let name of LevelAttempt.NAMES) {
			results.push(confirm("Increase " + name + "?") ? 1 : 0);
		}

		return new LevelAttempt(cls, "Manual", results);
	}

	upBonus(cls, reroll=false) {
		let   choosen     = null;
		let   bonus       = NaN;
		const prompt_text = (
			"Enter one of: " + LevelAttempt.NAMES.join(" ")
		);

		while (!LevelAttempt.NAMES.includes(choosen)) {

			choosen = prompt(prompt_text);

			if (choosen === null) {
				continue;
			} else {
				choosen = choosen.toLowerCase();
			}
		}

		while (Number.isNaN(bonus)) {
			bonus = Number(prompt("Increase by how much?"));
		}

		const mercy = prompt("Enter a note?") || "None";

		return new LevelAttempt("Bonus", "Bonus", LevelAttempt.NAMES.map((name) => (
			name == choosen ? bonus : 0
		)), mercy);
	}

	upRandom(cls, reroll=false) {
		const results = [];
		
		this.growthsFor(cls).forEach(growth => {
			results.push(Math.random() * 100 <= growth ? 1 : 0);
		});

		return new LevelAttempt(cls, "Random", results);
	}

	upAverage(cls, reroll=false) {

		const results = [];
		const {actual, average} = this.averages(cls, 1, reroll);

		for (let i = 0; i < LevelAttempt.NAMES.length; ++i) {
			const change = actual[i] < Math.floor(average[i]) ? 1 : 0;
			results.push(change);
			actual[i] += change;
		}

		return new LevelAttempt(cls, "Average", results);
	}

	static Row(radio, number, attempt) {
		return element("tr", [
			radio,
			number,
			tooltip(attempt.class, [
				`Method: ${attempt.method}`,
				element("br"),
				`Mercy: ${attempt.mercy}`,
			]),
			attempt.total,
			attempt.weight.toFixed(2),
		].map(
			content => element("td", content)
		).concat(
			attempt.increases.map(value => (
				element("td", String(value || ""))
			))
		), radio ? "attempt-enabled" : "attempt-disabled");
	}

	addRow(record, exists=null) {

		if (exists === null) {
			this._records.push(record);
		}

		const method = record.levels[
			record.index
		].method;

		if (method == "Bonus") {
			this._maxBonus += 1;
		} else {
			this._maxLevel += 1;
			this._maxBonus  = 0;
		}

		const index = (exists === null ? this._records.length - 1 : exists);

		for (let i = 0; i < record.levels.length; ++i) {

			const level  = record.levels[i];
			const active = (i == record.index);
			const number = String(
				this._maxLevel + (this._maxBonus ? "." + this._maxBonus : "")
			);

			const radio = (() => {

				if (!active) return "";

				const radio = element("input", {
					attrs: {
						type     : "radio",
						name     : "levelv",
						checked  : this._checked == index,
						onchange : (() => this.select(index)),
					}
				});

				this._radios.push(radio);
				return radio;

			})();

			const row = LevelHistory.Row(radio, number, level);

			this._lrows.push(row);
			this._tbody.appendChild(row);
		}

		/* refresh computed cells with new information */
		this.refreshHead();
	}

	refresh() {

		this.refreshSelect();
		this.refreshBody();
		this.refreshHead();
	
	}

	refreshBody() {

		this._maxLevel = 1;
		this._maxBonus = 0;

		while (this._radios.length) {
			this._radios.pop().remove();
		}

		while (this._lrows.length) {
			this._lrows.pop().remove();
		}

		for (let i = 0; i < this._records.length; ++i) {
			this.addRow(this._records[i], i);
		}
	}

	refreshHead() {

		this._bases_totals.refresh();
		this._bases_weight.refresh();

		for (let each of this._totals) {
			each.refresh();
		}

		this._totals_totals.refresh();
		this._totals_weight.refresh();

		for (let each of this._averages) {
			each.refresh();
		}

		this._averages_totals.refresh();
		this._averages_weight.refresh();

		for (let each of this._screw) {
			each.refresh();
		}

		this._screw_totals.refresh();
		this._screw_weight.refresh();
	}

	refreshSelect() {
		if (this._checked >= this._records.length) {
			this._checked = this._records.length - 1;
		}

		if (this._checked > -1) {
			this._radios[this._checked].checked = true;
		} else if (this._checked == -1) {
			this._radio.checked = true;
		}

		for (let lvl of this._chlvls) {
			lvl.refresh();
		}
	}

	static methodMap = new Map([
		["Random",  (instance, cls, reroll) => instance.upRandom(cls, reroll)],
		["Average", (instance, cls, reroll) => instance.upAverage(cls, reroll)],
		["Manual",  (instance, cls, reroll) => instance.upManual(cls, reroll)],
		["Bonus",   (instance, cls, reroll) => instance.upBonus(cls, reroll)],
	]);

	static mercyMap = new Map([
		["Random",  (instance, level, reroll) => instance.mercyRandom(level, reroll)],
		["Average", (instance, level, reroll) => instance.mercyAverage(level, reroll)],
		["Prompt",  (instance, level, reroll) => instance.mercyPrompt(level, reroll)],
		["None",    (instance, level, reroll) => level],
	]);

	roll(method, mercy, cls, reroll=false) {

		if (!LevelHistory.methodMap.has(method)) {
			throw new Error(`Invalid level up method '${method}'`);
		}

		if (!LevelHistory.mercyMap.has(mercy)) {
			throw new Error(`Invalid level up mercy '${mercy}'`);
		}

		const level = LevelHistory.methodMap.get(method)(this, cls, reroll);
		return LevelHistory.mercyMap.get(mercy)(this, level, reroll);
	}

	static WARNINGS = {
		"class-none" : [
			"You're rolling a level with your character's class as None. ",
			"You're being shown this message just in case that's a mistake; ",
			"typically you want to set your class to something else first ",
			"using the drop down under Create > Characters tab, in the center ",
			"section of the builder.",
		].join(""),

		"method-bonus-multiple-levels" : [
			"Are you sure you want to add multiple bonuses? ",
			"If you click OK, you will have to manually enter each one until ",
			"you finish. (You cannot cancel in the middle of doing so).",
		].join(""),

		"method-manual-multiple-levels" : [
			"Are you sure you want to add multiple manual levels? ",
			"If you click OK, you will have to manually enter each one until ",
			"you finish. (You cannot cancel in the middle of doing so).",
		].join(""),

		"mercy-random-zero-growth" : [
			"You are using random Mercy points with a zero growth in one or ",
			"more stats. This has the possibility of resulting in a nonzero ",
			"value for one or more of those zero growth stats. Continue?",
		].join(""),

		"advanced-class-below-level-15" : [
			"You may be trying to roll a level lower than 16 as an advanced ",
			"class (characters over level 15 should typically be built with ",
			"their first 15 levels in one or more starting classes). This ",
			"warning is being shown to ensure this is delibrate. Continue?",
		].join(""),

		"starting-class-above-level-15" : [
			"You may be trying to roll a level above 15 as a starting ",
			"class (characters over level 15 will normally be using an ",
			"advanced class rather than a starting one, except Dancer). This ",
			"warning is being shown to ensure this is delibrate. Continue?",
		].join(""),

		"reroll-different-class" : [
			"You are attempting to reroll a level as a different class than ",
			"that level was initially rolled as. This is permitted, but this ",
			"warning is being shown to ensure this is delibrate. Continue?",
		].join(""),

		"zero-growths" : [
			"You are attempting to roll using a level up method that needs ",
			"growths while having no base growths on your character sheet. ",
			"This warning is shown to ensure this is delibrate. Continue?",
		].join(""),
	};

	warnings(levels, method, mercy, cls, reroll) {

		if (!this._enable_warnings.checked) return true;

		if (cls == "None" && method != "Bonus") {
			if (!confirm(LevelHistory.WARNINGS["class-none"]))
				return false;
		}

		if (method == "Manual" && levels > 1) {
			if (!confirm(LevelHistory.WARNINGS["method-manual-multiple-levels"]))
				return false;
		}

		if (method == "Bonus" && levels > 1) {
			if (!confirm(LevelHistory.WARNINGS["method-bonus-multiple-levels"]))
				return false;
		}

		if (   mercy == "Random"
			&& this.growthsFor(cls).some(x => x == 0)
		) {
			if (!confirm(LevelHistory.WARNINGS["mercy-random-zero-growth"]))
				return false;
		}

		if (   reroll
			&& method != "Bonus"
			&& cls != this._records[this._checked].active.class
		) {
			if (!confirm(LevelHistory.WARNINGS["reroll-different-class"]))
				return false;
		}

		if (   method != "Manual"
			&& method != "Bonus"
			&& LevelAttempt.NAMES.every(
				name => this.sheet.stats.growths[name].value == 0
			)
		) {
			if (!confirm(LevelHistory.WARNINGS["zero-growths"]))
				return false;
		}

		/* Dancer has good growths despite being Starting tier */
		if (   cls != "Dancer"
			&& Class.get(cls).tier == "Starting"
			&& (   this.level(this._records.length - 1) >= 16
				|| this.level() > 15
			)
		) {
			if (!confirm(LevelHistory.WARNINGS["starting-class-above-level-15"]))
				return false;
		}

		if (Class.get(cls).tier == "Advanced" && (this.level(this._records.length - 1) < 15 || (this.level() <= 15 && reroll))) {
			if (!confirm(LevelHistory.WARNINGS["advanced-class-below-level-15"]))
				return false;
		}

		return true;
	}

	up(value) {

		const [method, mercy] = this._method.value.split("/");
		const cls = this.sheet.character.class.name;

		if (!this.warnings(value, method, mercy, cls, false)) return;

		const incrs = LevelAttempt.NAMES.map(name => 0);

		for (let i = 0; i < value; ++i) {
			const level = new Level([this.roll(method, mercy, cls, false)]);
			this.addRow(level);

			level.active.increases.forEach((incr, i) => {incrs[i] += incr;});

			this._checked = this._records.length - 1;
		}

		this._checked = this._records.length - 1;
		this.refreshSelect();
		this.refreshHead();

		this.bells.play(new LevelAttempt("None", "None", incrs));
	}

	revert(row) {

		const level = row + 2;

		if (!confirm(`Really revert maximum level to ${level}?`)) return;

		const decrs = LevelAttempt.NAMES.map(name => 0);

		while(row + 1 < this._records.length) {
			const level = this._records.pop();
			level.active.increases.forEach((decr, i) => {decrs[i] -= decr;});
		}

		this.refresh();

		this.bells.play(new LevelAttempt("None", "None", decrs));
	}

	levelAt(row=null) {
		const record = this._records[
			row === null ? this._records.length - 1 : row
		];
		return record.active;
	}

	reroll(row) {

		if (row < -1 || this._records.length < row) {
			throw new Error(`Cannot reroll row ${row} (out of range).`);
		}

		if (row == -1) {
			return alert("Cannot reroll base stats, please edit those by hand.");
		}

		const [method, mercy] = this._method.value.split("/");
		const level = this.levelAt(row);

		if (method == "Bonus" && level.method != "Bonus") {
			return alert("Normal levels cannot be rerolled as Bonus levels.");
		}

		if (method != "Bonus" && level.method == "Bonus") {
			return alert("Bonus levels must be rerolled as Bonus levels.");
		}

		const cls = this.sheet.character.class.name;

		if (!this.warnings(1, method, mercy, cls, true)) return;

		const fresh  = this.roll(method, mercy, cls, true);

		const record = this._records[row];
		const stale  = record.active;
		record.levels.push(fresh);

		const summary = [];
		for (let i = 0; i < fresh.increases.length; ++i) {
			if (fresh.increases[i]) {
				summary.push(LevelAttempt.NAMES[i]);
			}
		}

		const use = confirm(`Use new level?\n${summary.join(" ")}`);

		if (use) {
			record.index = record.levels.length - 1;
		}

		this.refresh();

		if (use) {
			this.bells.play(fresh.difference(stale));
		}
	}

	unroll(row) {

		if (row < -1 || this._records.length < row) {
			throw new Error(`Cannot revert row ${row} (out of range).`);
		}

		if (row == -1) {
			return alert("Cannot revert base stats, please edit those by hand.");
		}

		const record = this._records[row];

		if (record.levels.length <= 1) {
			return alert("Cannot revert row with out rerolls.");
		}

		const trash = record.levels.pop();

		if (record.index >= record.levels.length) {
			record.index = record.levels.length - 1;
		}

		this.refresh();

		this.bells.play(record.active.difference(trash));
	}

	clear() {
		for (let i = 0; i < this._bases.length; ++i) {
			this._bases[i].value = 0;
		}

		this._records = [];
		this._checked = -1;
		this.refresh();
	}

	export() {
		const levels = [];

		for (let record of this._records) {
			levels.push(record.export());
		}

		const bases = this._bases.map(cell => cell.value);

		return {bases, levels};
	}

	import(object) {

		this._records = object.levels.map(
			record => Level.import(record.rolls, record.index)
		);

		for (let i = 0; i < this._bases.length; ++i) {
			this._bases[i].value = object.bases[i];
		}

		this.refresh();
	}
}

class Stats {

	static BASE_OPTIONS = {
		value : 0,
		shown : "0",
		edit  : true,
	};

	static GROW_OPTIONS = {
		value  : 0,
		shown  : "0%",
		before : "(",
		after  : ")",
		edit   : true,
		step   : 5,
	};

	constructor(stats, sheet) {
		this.root     = element("div");
		this.names    = stats;
		this.sheet    = sheet;
		this.levelups = new LevelHistory(sheet);
		this.pointbuy = new PointBuy();

		const primes  = element("tbody");

		this._level = new AttributeCell({
			edit    : true,
			value   : 1,
			shown   : "1",
			min     : 1,
			max     : 100,
			trigger : ((level) => {
				this.refreshSecondary();
				this.stats.mov.refresh();
				return level;
			}),
		});

		const edit = element("input", {
			class : ["simple-border"],
			attrs : {
				type    : "button",
				value   : "Edit",
				onclick : (() => {
					const tabs = this.sheet.tabs;
					tabs.main.active   = "Assign";
					tabs.assign.active = "Levels";
				}),
			},
		});

		primes.appendChild(
			element("tr", [
				element("th", "Level"), this._level.root, element("td", edit),
			]),
		);

		this.stats   = {};
		this.growths = {};

		for (let item of stats) {
			const stat = item;

			const baseFunction = new Expression.Env(
				Expression.Env.RUNTIME, this.sheet.definez
			).func(`unit|total|${stat}`);

			const base = new AttributeCell(Stats.BASE_OPTIONS, (base) => {
				
				this.refreshSecondary();
				
				if (stat == "dex" || stat == "lck") {
					this.sheet.battalion.refresh(false);
				}

				return Math.max(baseFunction(), 0);
			});

			this.stats[stat] = base;

			const grow = ((stat) => {

				if (stat == "mov") return element("td");

				const growFunction = new Expression.Env(
					Expression.Env.RUNTIME, this.sheet.definez
				).func(`unit|total|growth|${stat}`);

				const cell = new AttributeCell(Stats.GROW_OPTIONS, (x) => {
					return Math.max(growFunction(), 0) + "%";
				});

				this.growths[stat] = cell;
				return cell.root;
			})(stat);

			primes.appendChild(
				element("tr", [
					element("th", stat.toUpperCase()), base.root, grow,
				])
			);
		}

		this.secondary = {};

		const lconf = {edit: false, root: "span", value: 0, shown: "0", after : ","};
		const rconf = {edit: false, root: "span", value: 0, shown: "0"};
		const cconf = {edit: false, root: "span", value: 0, shown: "0"};

		const defsec = (key, config, fn) => {
			const cell          = new AttributeCell(config, fn);
			this.secondary[key] = cell; 
			return cell;
		};

		const wide = (title, key, trig) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center"],
					attrs   : {colSpan: 2},
					content : defsec(key, cconf, trig).root,
				}),
			]);
		};

		const dual = (title, key1, key2) => {
			return element("tr", [
				element("th", title),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec(key1, lconf).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec(key2, rconf).root
				}),
			]);
		};

		const baseFunction = new Expression.Env(
			Expression.Env.RUNTIME, this.sheet.definez
		).func("unit|total|mttype");

		const second = element("tbody", [
			wide("Might", "mt"),
			wide("Based on", "mttype", (base) => {
				const value = baseFunction();
				const text  = AttackFeature.MTTYPE.asString(value);
				return text.toUpperCase();
			}),
			dual("Prot/Resl", "prot", "resl"),
			dual("Hit/Avo", "hit", "avo"),
			dual("Crit/Avo", "crit", "cravo"),
			dual("Dbs/Dbd", "doubles", "doubled"),
			dual("SP/TP", "sp", "tp"),
			element("tr", [
				element("th", "Costs"),
				element("td", {
					class   : ["center", "padded-cell-left"],
					content : defsec("spcost", lconf).root,
				}),
				element("td", {
					class   : ["center", "padded-cell-right"],
					content : defsec("tpcost", rconf).root
				}),
			]),
			element("tr", [
				element("th", "Range"),
				element("td", {
					attrs   : {colSpan: 2},
					class   : ["center", "padded-cell"],
					content : [
						defsec("minrng", cconf).root,
						element("span", " - ", "computed"),
						defsec("maxrng", cconf).root,
					],
				}),
			]),
		]);

		this.root = element("div", [
			element("table", primes),
			element("hr"),
			element("table", second),
		]);
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
	 * depending on equipped abilities, items, and/or arts.
	 */
	clear() {
		this.level = 1;
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
		this.pause = true;

		for (let name of this.names) {
			this.stats[name].refresh();
			if (name == "mov") continue;
			this.growths[name].refresh();
		}

		this.pause = false;
	}

	/**
	 * Recompute display values for secondary stats.
	 */
	refreshSecondary() {

		/* This should improve load times a bit. */
		if (this.pause) return;

		if (!this.VarS) {
			this.VarS = [];
			for (let key in this.secondary) {
				this.VarS.push([key, `unit|total|${key}`]);
			}
		}

		for (let [key, variable] of this.VarS) {
			this.secondary[key].value = Math.max(
				this.sheet.runenv.read(variable), (
					key == "spcost" || key == "tpcost"
						? -100
						: 0
				)
			);
		}
	}

	/**
	 * Set primary statistic and growth values from an object. The object should
	 * have the fields "statistics" for primary stats, and "growths" for the 
	 * growths, each consisting of accurate stat names and integer values.
	 * This is based on the format of the sheet export data file.
	 * @param {object} object - object to set stats and growths from
	 */
	import(object) {
		
		this.level = object.level || 1;

		for (let name of this.names) {
			this.stats[name].value   = object.bases[name];
			if (name == "mov") continue;
			this.growths[name].value = object.growths[name];
		}

		this.levelups.import(object.levelups || LevelHistory.EMPTY);

		if ("pointbuy" in object) {
			this.pointbuy.import(object.pointbuy);
		} else {
			this.pointbuy.clear();
		}

		// We want it to look fresh, not have modifiers.
		this.pointbuy.bells.clear();
	}

	/**
	 * Return a collection of current values for primary statistics and growths.
	 * @returns {object} a collection of primary statistics and growths.
	 */
	export() {

		const object = {
			level    : this.level,
			levelups : this.levelups.export(),
			pointbuy : this.pointbuy.export(),
			bases    : {},
			growths  : {},
		};

		for (let name of this.names) {
			object.bases[name] = this.stats[name].value;
			if (name == "mov") continue;
			object.growths[name] = this.growths[name].value;
		}

		return object;
	}
}

/* exported Stats */
