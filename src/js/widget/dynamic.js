
/**
 * Module that implements dynamically updating widgets.
 * @module 
 */

/* global require */

/* global Theme, element, assume, tooltip */

/* global Calculator */

if (typeof require !== "undefined") {
	/* eslint-disable no-global-assign */
	({
		Theme,
		assume, element, tooltip,
	}              = require("../common.js"));
	(  Calculator  = require("../lang/calculator.js"));
	/* eslint-enable no-global-assign */
}


class ModWidget {

	constructor(modifier, sign, tool_tip) {

		this.tooltip  = tool_tip;
		this.modifier = modifier;
		this.sign     = sign;

		this._runtext = document.createTextNode("");
		this._mactext = document.createTextNode("");

		this._base    = element("span", {
			class   : ["computed"],
			content : (!tool_tip
				? [this._runtext, element("sup", "*")]
				:  this._runtext
			),
			attrs   : {
				onpointerenter: (() => {
					this.refresh();
				})
			}
		});

		if (!tool_tip) {
			this.root = this._base;
			this.refresh();
			return;
		}

		const code = Calculator.highlight(this.modifier.source, true);

		this.root = tooltip(this._base, [

			"Value updates on mouse over.",

			element("br"), element("br"),

			element("strong", "Calculator Expression"), element("br"),

			element("div", code, "calc-code"), element("br"),

			element("strong", "Roll20 Macro"), element("br"),

			element("div", this._mactext, "calc-code"),
		]);
		
		this.refresh();
	}

	refresh() {
		const value     = this.modifier.execute();
		const sign      = (this.sign && value >= 0 ? "+" : "");
		this._runtext.data = sign + value;
		this._mactext.data = this.modifier.macrogen();
	}
}

class ReqWidget {

	constructor(predicate, title, body, dead) {

		this.predicate = predicate;
		this.title     = title;

		this._runtext = document.createTextNode("");

		this._base    = element("span", {
			class   : ["computed"],
			content : this._runtext,
			attrs   : {
				onpointerenter: (() => {
					this.refresh();
				})
			}
		});

		if (dead) {
			this.root = this._base;
			this.refresh();
			return;
		}

		this.root = tooltip(this._base, [

			"Value updates on mouse over.",

			element("br"), element("br"),

			body,
		]);
		
		this.refresh();
	}

	refresh() {
		const result       = this.predicate.exec(this.predicate.context).boolean;
		this._runtext.data = `${this.title}${(result ? "Pass" : "Fail")}`;

		const cl = this._base.classList;

		if (result) {
			if (cl.contains("computed")) {
				cl.remove("computed");
				cl.add("datum");
			}
		} else {
			if(cl.contains("datum")) {
				cl.remove("datum");
				cl.add("computed");
			}
		}
	}
}

class RangeFinder {

	static DEFAULT_TILE_SIZE = 12;

	static cutRange(min, cut, max) {
		const section = [];

		let range = min, start = min, last = 0;
		for (range = min; range <= max; ++range) {
			const raw     = 20 * (range - cut);
			const penalty = Math.min(60, Math.max(0, raw));

			if (last !== penalty) {
				section.push([start, range - 1, last]);
				start = range;
			}

			last = penalty;
		}

		section.push([start, range - 1, last]);
		return section;
	}

	static findRange(range, cuts) {
		for (let [min, max, mod] of cuts) {
			if (min <= range && range <= max)
				return mod;
		}
		return -1;
	}

	static ON_SET_SIZE      = new Set();
	static GLOBAL_TILE_SIZE = RangeFinder.DEFAULT_TILE_SIZE;

	static setTileSize(pixels=this.DEFAULT_TILE_SIZE) {
		this.TILE_SIZE = pixels;
		this.HALF_TILE = this.TILE_SIZE / 2;
		this.QRTR_TILE = this.HALF_TILE / 2;

		// TODO this is a super hack; fix this either by making scale a
		// property of the instance so that we don't need to globaly refresh
		// or figure out a different way to do this because this could crash
		// the page if this function is called before sheet is initialized.
		// sheet.refresher.refresh("theme");

		for (let trigger of this.ON_SET_SIZE) trigger();
	}

	setTileSize(pixels=this.baseSize) {
		if (this.globalSync) {
			RangeFinder.setTileSize(pixels);
		} else {
			this.tileSize = pixels;
			this.halfTile = this.tileSize / 2;
			this.qrtrTile = this.halfTile / 2;
		}

		this.refresh();
	}
		
	constructor(action, template) {

		template        = template      || {};
		
		// synchronizes the zoom of all rangefinders for which this is true
		this.globalSync = template.global || false;

		this.baseSize   = template.size || RangeFinder.DEFAULT_TILE_SIZE;
		this.tileSize   = this.baseSize;
		this.halfTile   = this.tileSize / 2;
		this.qrtrTile   = this.halfTile / 2;
		this.lastSize   = 1;

		this.action        = action;
		this.canvas        = element("canvas", [], "simple-border");
		this.canvas.width  = Math.floor(
			(template.width || 230) / this.baseSize
		) * this.tileSize;
		this.canvas.height = 10 * this.baseSize;

		this.center();

		this.interval      = null;

		this.mouseX        = this.x;
		this.mouseY        = this.y;

		this.collapsed     = false;

		this.canvas.addEventListener("mouseenter", (event) => {
			this.interval = setInterval(() => {
				this.refresh();
			}, 10);
		});

		this.canvas.addEventListener("mouseleave", (event) => {
			clearInterval(this.interval);
		});

		this.canvas.addEventListener("dblclick", (event) => {
			this.collapse();
		});

		// zoom in or out on the portait with the mouse wheel
		this.canvas.addEventListener("wheel", (event) => {

			// zoom in or out on the animation
			const delta       = Math.sign(event.deltaY) * Number(this.scale.step);
			const old         = Number(this.scale.value);
			const scale       = Math.max(delta + old, 0);

			this.setTileSize(scale * this.baseSize);
			const coe = this.baseSize * action.modifier("maxrng") * 0.5;
			const off = (coe * old) - (coe * scale);

			this.x   += off;
			this.y   += off;

			this.scale.value  = scale;
			this.scale.onchange();

			// stop the page from scrolling
			event.preventDefault();
			event.stopPropagation();
		}, false);

		this.scale         = element("input", {
			class: ["simple-border", "no-display"],
			attrs: {
				type     : "number",
				min      : 0.02,
				max      : 4.00,
				step     : 0.05,
				value    : 1.00,
				onchange : ((event) => {
					if (this.scale.value < this.scale.min)
						this.scale.value = this.scale.min;
					if (this.scale.value > this.scale.max)
						this.scale.value = this.scale.max;
					this.refresh();
				}),
			}
		});

		this.drawDefaultTile = (x, y) => this.drawAoETile(x, y);

		// drag in order to move portrait

		this.dragging      = false;
		this.dragStartX    = null;
		this.dragStartY    = null;
		this.dragOffsetX   = null;
		this.dragOffsetY   = null;
		
		this.canvas.addEventListener("mousedown", (event) => {

			if (event.which == 1) {
				this.dragging    = true;
				this.dragStartX  = event.offsetX;
				this.dragStartY  = event.offsetY;
				this.dragOffsetX = this.x;
				this.dragOffsetY = this.y;
			}
		}, false);

		this.canvas.addEventListener("mouseup", (event) => {

			if (event.which == 1) {
				this.dragging = false;
				this.x = this.dragOffsetX + (event.offsetX - this.dragStartX);
				this.y = this.dragOffsetY + (event.offsetY - this.dragStartY);
				this.refresh();
			}
		}, false);

		this.canvas.addEventListener("mousemove", (event) => {

			this.mouseX = event.offsetX;
			this.mouseY = event.offsetY;

			if (this.dragging) {
				this.x  = this.dragOffsetX + (event.offsetX - this.dragStartX);
				this.y  = this.dragOffsetY + (event.offsetY - this.dragStartY);
				this.refresh();
			}
		}, false);

		this.collapse_button = element("button", {
			class   : ["simple-border"],
			content : "View Range",
			attrs   : {onclick: () => this.collapse()}
		});

		this.root = element("span", [this.canvas]);
		
		if (assume(template.draw, true)) this.draw(this.action);
	}

	center() {
		const offset = (this.lastSize & 1) ? 0 : this.halfTile;
		this.x = this.canvas.width  / 2 + offset;
		this.y = this.canvas.height / 2 + offset;
	}

	collapse() {
		if (this.interval) {
			clearInterval(this.interval);
		}

		if (this.collapsed) {
			this.collapse_button.remove();
			this.root.appendChild(this.canvas);
			this.center();
			this.refresh();
		} else {
			this.canvas.remove();
			this.root.appendChild(this.collapse_button);
		}

		this.collapsed = !this.collapsed;
	}

	refresh() {
		this.draw(this.action);
	}

	tileAt(x, y) {
		return [
			Math.floor((x + this.halfTile) / this.tileSize),
			Math.floor((y + this.halfTile) / this.tileSize),
		];
	}

	realX(tile) {
		return this.x + tile * this.tileSize;
	}

	realY(tile) {
		return this.y + tile * this.tileSize;
	}

	///////////////////////////////////
	// Unit and Tile Drawing Methods //
	///////////////////////////////////

	/**
	 * Draw a filled square tile at real (x, y) using the current theme.
	 * @param {number} x - real X coordinate of top left corner
	 * @param {number} y - real Y coordinate of top left corner
	 * @param {number} penalty - determines the color of the tile
	 */
	drawTile(x, y, penalty=0) {
		const ctx   = this.canvas.getContext("2d");
		const size  = this.tileSize;
		const half  = this.halfTile;
		ctx.beginPath();
		ctx.strokeStyle = this.theme.border;
		ctx.rect(x - half, y - half, size, size);
		ctx.fillStyle = this.theme.hit_penalty(penalty);
		ctx.fillRect(x - half, y - half, size, size);
		ctx.stroke();
	}

	/**
	 * Draw a starburst at real (x, y) using the current theme.
	 * @param {number} x - real X coordinate of top left corner
	 * @param {number} y - real Y coordinate of top left corner
	 */
	drawAoETile(x, y) {
		const ctx   = this.canvas.getContext("2d");
		const half  = this.halfTile;
		ctx.beginPath();
		ctx.strokeStyle = this.theme.border;

		ctx.moveTo(x, y - half + 1);
		ctx.lineTo(x, y + half - 1);
		ctx.moveTo(x + half - 1, y);
		ctx.lineTo(x - half + 1, y);
		ctx.moveTo(x - half + 1, y - half + 1);
		ctx.lineTo(x + half - 1, y + half - 1);
		ctx.moveTo(x + half - 1, y - half + 1);
		ctx.lineTo(x - half + 1, y + half - 1);
		ctx.stroke();
	}

	/**
	 * Draw a filled arrow at real (x, y) using the current theme.
	 * @param {number} x - real X coordinate of top left corner
	 * @param {number} y - real Y coordinate of top left corner
	 * @param {number} start - angle that arrow points in (radians)
	 * @param {number} size  - size in tiles to draw arrow
	 */
	drawArrow(x, y, start, size=this.unit) {
		const ctx    = this.canvas.getContext("2d");
		const half   = this.halfTile * size;

		ctx.beginPath();
		ctx.moveTo(x + half * Math.sin(start), y + half * Math.cos(start));
		ctx.strokeStyle = this.theme.border;

		start += Math.PI / 2;
		ctx.lineTo(x + half * Math.sin(start), y + half * Math.cos(start));
		ctx.lineTo(x + 0.2 * half * Math.sin(start), y + 0.2 * half * Math.cos(start));

		start += Math.PI / 2;
		ctx.lineTo(x + half * Math.sin(start - (Math.PI/8)), y + half * Math.cos(start - (Math.PI/8)));
		ctx.lineTo(x + half * Math.sin(start + (Math.PI/8)), y + half * Math.cos(start + (Math.PI/8)));

		start += Math.PI / 2;
		ctx.lineTo(x + 0.2 * half * Math.sin(start), y + 0.2 * half * Math.cos(start));
		ctx.lineTo(x + half * Math.sin(start), y + half * Math.cos(start));

		start += Math.PI / 2;
		ctx.lineTo(x + half * Math.sin(start), y + half * Math.cos(start));

		ctx.fillStyle = this.theme.unit;
		ctx.fill();
		ctx.stroke();
	}

	/**
	 * Draw a filled circle at real (x, y) using the current theme.
	 * @param {number} x - real X coordinate of top left corner
	 * @param {number} y - real Y coordinate of top left corner
	 * @param {number} size  - size in tiles to draw circle
	 */
	drawPoint(x, y, size=this.unit) {
		const ctx   = this.canvas.getContext("2d");
		const qrtr  = this.qrtrTile * size;
		ctx.beginPath();
		ctx.strokeStyle = this.theme.border;
		ctx.arc(x, y, qrtr, 0, 2 * Math.PI);
		ctx.fillStyle = this.theme.unit;
		ctx.fill();
		ctx.stroke();
	}

	////////////////////////////////////
	// Area of Effect Drawing Methods //
	////////////////////////////////////

	/**
	 * Draw a line of tiles starting at real (x, y) and extending for
	 * (length) tiles in the direction determined by (bits).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} length - number of tiles to extend tile
	 * @param {number} bits   - two lsb determine direction (North: 0, South: 2, East: 3, West: 1)
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawLine(x, y, length, bits, fn=this.drawDefaultTile) {
		const size = this.tileSize;
		// North: 0, South: 2, East: 3, West: 1
		const sign  = size * (((bits & 0x2) >> 1) || -1);
		const xsize = sign * (  bits  & 0x1);
		const ysize = sign * (~ bits  & 0x1);
		for (let i = 0; i < length; ++i)
			fn(x + xsize * i, y + ysize * i);
	}

	/**
	 * Draw a (w)x(h) box of tiles starting at real (x, y) in the direction
	 * determined by (bits).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} w - width of box in tiles
	 * @param {number} h - height of box in tiles
	 * @param {number} bits - two lsb determine direction (North: 0, South: 2, East: 3, West: 1)
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawBox(x, y, w, h, bits, fn=this.drawDefaultTile) {
		const size      = this.tileSize;
		const direction = bits & 0x3;

		switch (direction) {
		case 0x0:   // North
		case 0x2: { // South
			const centerX   = (x - (Math.floor(w / 2) * size));
			const centerY   = y;
			for (let i = 0; i < w; ++i) {
				this.drawLine(centerX + (i * size), centerY, h, direction, fn);
			}
		} break;
		case 0x1:   // East
		case 0x3: { // West
			const centerX   = x;
			const centerY   = (y - (Math.floor(w / 2) * size));
			for (let i = 0; i < w; ++i) {
				this.drawLine(centerX, centerY + (i * size), h, direction, fn);
			}
		}	break;
		default:
			throw new Error("Impossible direction.");
		}
	}

	/**
	 * Draw a (w)x(h) box of tiles starting at real (x, y).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} w - width of box in tiles
	 * @param {number} h - height of box in tiles
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawRectangle(x, y, w, h, fn=this.drawDefaultTile) {
		const size  = this.tileSize;
		const centerX   = x - (Math.floor(w / 2) * size);
		const centerY   = y + (Math.floor(h / 2) * size);
		for (let i = 0; i < w; ++i) {
			this.drawLine(centerX + (i * size), centerY, h, 0, fn);
		}
	}

	/**
	 * Draw a ring of tiles centered on real (x, y) extending from manhattan 
	 * distance (min) to manhattan distance (max) with a (unit)x(unit)
	 * square hole in its center.
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing ring
	 * @param {number} max - manhattan distance to stop drawing ring
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 * @param {number} unit - size of the square in the center of the ring
	 */
	drawRing(x, y, min, max, fn=this.drawDefaultTile, unit=this.unit) {

		if (unit > 1) return this.drawWideRing(x, y, min, max, fn, unit);

		const size = this.tileSize;
		for (let i = -max; i <= max; ++i) {
			for (let j = -max; j <= max; ++j) {
				const distance = Math.abs(i) + Math.abs(j);
				if (distance < min || max < distance) continue;
				fn(x + size * i, y + size * j);
			}
		}
	}

	/**
	 * This is a helper method that's called when drawRing is invoked with
	 * (unit > 1), as a the algorthim used for (unit == 1) doesn't work with
	 * (unit > 1) and vice versa. Don't call this method directly as it doesn't
	 * draw rings with (unit == 1) correctly.
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing ring
	 * @param {number} max - manhattan distance to stop drawing ring
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 * @param {number} unit - size of the square in the center of the ring
	 */
	drawWideRing(x, y, min, max, fn=this.drawDefaultTile, unit=this.unit) {
		const size = this.tileSize;
		
		const relX = -Math.floor(unit / 2);
		const relY = -Math.floor(unit / 2);

		let draw  = ((rX, rY, oX, oY) => {
			for (let i = Math.min(rX, oX); i <= Math.max(rX, oX); ++i) {
				for (let j = Math.min(rY, oY); j <= Math.max(rY, oY); ++j)  {
					const distanceN = Math.abs(i - rX) + Math.abs(j - rY);
					if (distanceN < min || max < distanceN) continue;
					fn(x + size * i, y + size * j);
				}
			}
		});

		const lim = unit - 1;
		for (let i = 0; i <= lim; ++i) {
			for (let j = 0; j <= lim; ++j) {
				if (i != 0 && i != lim && j != 0 && j != lim) continue;
				const xoff = i == 0 ? -1 : i == lim ? 1 : 0;
				const yoff = j == 0 ? -1 : j == lim ? 1 : 0;
				draw(relX + i, relY + j, relX + i + xoff * max, relY + j + yoff * max);
			}
		}
	}


	/**
	 * Draw an X shape of tiles centered on real (x, y) extending from manhattan 
	 * distance (min) to manhattan distance (max).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing X shape
	 * @param {number} max - manhattan distance to stop drawing X shape
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawXCross(x, y, min, max, fn=this.drawDefaultTile) {
		const size = this.tileSize;
		for (let i = -max; i <= max; ++i) {
			for (let j = -max; j <= max; ++j) {
				const distance = Math.abs(i) + Math.abs(j);
				if (distance < min * 2) continue;
				if (Math.abs(i) != Math.abs(j)) continue;
				fn(x + size * i, y + size * j);
			}
		}
	}

	/**
	 * Draw an plus shape of tiles centered on real (x, y) extending from manhattan 
	 * distance (min) to manhattan distance (max).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing plus shape
	 * @param {number} max - manhattan distance to stop drawing plus shape
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawPlus(x, y, min, max, fn=this.drawDefaultTile) {
		const size = this.tileSize;
		for (let i = -max; i <= max; ++i) {
			for (let j = -max; j <= max; ++j) {
				if (!(i == 0 || j == 0)) continue;
				const distance = Math.abs(i) + Math.abs(j);
				if (distance < min || max < distance) continue;
				fn(x + size * i, y + size * j);
			}
		}
	}

	/**
	 * Draw the special shape used for Rising Frost centered on real (x, y)
	 * extending from manhattan distance (min) to manhattan distance (max).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing the shape
	 * @param {number} max - manhattan distance to stop drawing the shape
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawFrost(x, y, min, max, fn=this.drawDefaultTile) {
		const size = this.tileSize;
		for (let i = -max; i <= max; ++i) {
			for (let j = -max; j <= max; ++j) {

				if (!(
					(j == -max && i <= 0) || (j == max && i >= 0) || i == 0
				)) continue;

				fn(x + size * i, y + size * j);
			}
		}
	}

	/**
	 * Draw a half circle arc of tiles centered on real (x, y) extending from
	 * manhattan distance (min) to manhattan distance (max) in the direction
	 * determined by (bits).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {number} min - manhattan distance to begin drawing ring
	 * @param {number} max - manhattan distance to stop drawing ring
	 * @param {number} bits - two lsb determine direction (North: 0, South: 2, East: 3, West: 1)
	 * @param {function} fn - One of this object's tile drawing methods (default: drawAoETile).
	 */
	drawHalfCircle(x, y, min, max, bits, fn=this.drawDefaultTile) {
		const size      = this.tileSize;
		const direction = bits & 0x3;
		const iStart    = direction == 0x3 ? 0 : -max;
		const iStop     = direction == 0x1 ? 0 :  max;
		const jStart    = direction == 0x2 ? 0 : -max;
		const jStop     = direction == 0x0 ? 0 :  max;

		for (let i = iStart; i <= iStop; ++i) {
			for (let j = jStart; j <= jStop; ++j) {
				const distance = Math.abs(i) + Math.abs(j);
				if (distance < min || max < distance) continue;
				fn(x + size * i, y + size * j);
			}
		}
	}

	/**
	 * Draw an AoE arrangement of tiles at real (x, y) based on the parsing of
	 * a string argument in (aoe). If the shape is directional, the direction
	 * is determined by (faces).
	 * @param {number} x - real X coordinate of top left corner of start tile
	 * @param {number} y - real Y coordinate of top left corner of start tile
	 * @param {string} aoe - AoE specification string
	 * @param (number] faces - two lsb determine direction (North: 0, South: 2, East: 3, West: 1); ignored if non-directional shape
	 */
	drawAoE(x, y, aoe, faces) {

		let match = undefined;
		const ctx = this.canvas.getContext("2d");

		// draw the area of effect, if there is one
		const composite = ctx.globalCompositeOperation;
		ctx.globalCompositeOperation = "xor";

		if ((match = aoe.match(/^(None||Variable)$/))) {
			/* do nothing */
		}
		else
		if ((match = aoe.match(/^Centered-Box (\d)x(\d)$/))) {
			this.drawRectangle(x, y, Number(match[1]), Number(match[2]));
		}
		else
		if ((match = aoe.match(/^Ring (\d)-(\d)$/))) {
			this.drawRing(x, y, Number(match[1]), Number(match[2]));
		}
		else
		if ((match = aoe.match(/^X (\d)-(\d)$/))) {
			this.drawXCross(x, y, Number(match[1]), Number(match[2]));
		}
		else
		if ((match = aoe.match(/^Plus (\d)-(\d)$/))) {
			this.drawPlus(x, y, Number(match[1]), Number(match[2]));
		}
		else
		if ((match = aoe.match(/^Box (\d)x(\d)$/))) {
			this.drawBox(x, y, Number(match[1]), Number(match[2]), faces);
		}
		else
		if ((match = aoe.match(/^Frost (\d)$/))) {
			this.drawFrost(x, y, 0, Number(match[1]));
		}
		else
		if ((match = aoe.match(/^Half Circle (\d)$/))) {
			this.drawHalfCircle(x, y, 0, Number(match[1]), faces);
		} else {
			/* do nothing */
		}

		ctx.globalCompositeOperation = composite;
	}

	///////////////////////////
	// Other Drawing Methods //
	///////////////////////////

	/**
	 * Draw text to a one line reserved header space above the main graphic.
	 * @param {string} text - the text to draw in the header of the canvas
	 */
	drawHeader(text) {

		const ctx = this.canvas.getContext("2d");

		// draw text box backpane
		ctx.beginPath();
		ctx.fillStyle   = this.theme.background;
		ctx.strokeStyle = this.theme.background;
		ctx.rect(0, 0, this.canvas.width, this.baseSize);
		ctx.fill();
		ctx.stroke();

		/// draw text box lower border
		ctx.beginPath();
		ctx.strokeStyle = this.theme.border;
		ctx.moveTo(0, this.baseSize);
		ctx.lineTo(this.canvas.width, this.baseSize);
		ctx.stroke();

		// draw text box text
		ctx.beginPath();
		ctx.fillStyle = this.theme.border;
		ctx.fillText(text, 0, 10);
		ctx.fill();
	}

	get unit() {
		return this.action.modifier("size");
	}

	/**
	 * Draw the main graphic using a given action.
	 * @param {Action} action - the action to display the range of
	 */
	draw(action) {

		this.theme  = Theme.active();
		const ctx   = this.canvas.getContext("2d");
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (!action) return;

		//////////////////
		// Computations //
		//////////////////

		// axis is the offset to make the origin a corner instead of a tile
		// center when a unit takes up an even number of tiles

		const size = action.modifier("size");
		const axis = (size & 1) ? 0 : 0.5;

		// axis but on a pixel scale rather than a tile one
		const pixelAxis = axis * this.tileSize;

		// If the size changes from odd to even or even to odd then we need to
		// offset the entire graphic so that it says centered around the same 
		// point and doesn't move up+left (that's what the math does, though).
		if ((size & 1) != (this.lastSize & 1)) {
			if (size & 1) { // even -> odd
				this.x -= this.halfTile;
				this.y -= this.halfTile;
			} else {        // odd -> even
				this.x += this.halfTile;
				this.y += this.halfTile;
			}
		}

		// the adjusted origin point to draw around
		const offsetX = this.x;
		const offsetY = this.y;

		// this is adjusted for centering
		const mouseX  = this.mouseX;
		const mouseY  = this.mouseY;

		// the tile in which the cursor is located
		const x = Math.floor(((mouseX - offsetX) + this.halfTile) / this.tileSize);
		const y = Math.floor(((mouseY - offsetY) + this.halfTile) / this.tileSize);

		// the minimum and maximum ranges of the active action
		const min  = action.modifier("minrng");
		const max  = action.modifier("maxrng");

		// the range and sections at which to apply range penalty
		const cut  = action.modifier("cutrng");
		const cuts = RangeFinder.cutRange(min, cut ? cut : max, max);
		
		// number of tiles from the origin to one of the unit's edge tiles
		const radius = Math.floor(size / 2) - axis;

		// the tile x and y coordinates of the axis point, offset for size oddness
		const axisX = x + axis;
		const axisY = y + axis;

		// the tile x and y coordinates of the nearest edge tile to the cursor
		const edgeX = (Math.sign(x) || 1) * Math.min(Math.abs(axisX), radius) - axis;
		const edgeY = (Math.sign(y) || 1) * Math.min(Math.abs(axisY), radius) - axis;

		// distance in tiles from the origin to the cursor (no axis offset)
		const axisDistance = Math.abs(x) + Math.abs(y);
		// distance in tiles from the origin to the nearest edge tile to the cursor
		const edgeDistance = Math.abs(edgeX) + Math.abs(edgeY);
		// distance in tiles from the nearest edge tile to the cursor
		const distance     = axisDistance - edgeDistance;
		// whether the cursor is in tile within valid range for the action
		const inRange      = min <= distance && distance <= max;

		// default real coords to draw cursor if cursor is not in this element
		const defX = offsetX;
		const defY = offsetY - (size / 2 + max - (size & 1) * 0.5) * this.tileSize;

		// real coords to draw the cursor at (default to northmost if !inRange)
		const drawX = inRange ? this.realX(x) : defX;
		const drawY = inRange ? this.realY(y) : defY;

		// angle at which cursor is from nearest edge tile
		const angle = Math.atan2(
			(inRange ? mouseX : drawX) - offsetX + pixelAxis,
			(inRange ? mouseY : drawY) - offsetY + pixelAxis,
		);

		// round the angle to the nearest whoe radian; factor of PI/2
		const radian = Math.round(angle / (Math.PI / 2));

		// converted back to actual radians by multiplying by PI/2
		const round  = radian * (Math.PI / 2);

		// the direction (North: 0, South: 2, East: 3, West: 1) the cursor's in
		// is relative to the center of the unit (i.e. the way it's facing)
		const faces  = (radian + 2) % 4;

		/////////////////////////
		// Drawing the Graphic //
		/////////////////////////

		// draw the range indicators for whatever is equipped
		for (let i = cuts.length - 1; i >= 0; --i) {
			const [start, stop, penalty] = cuts[i];
			const fn = (x, y) => this.drawTile(x, y, penalty);
			this.drawRing(offsetX, offsetY, start, stop, fn, size);
		}

		// draw the action's area of effect
		this.drawAoE(drawX, drawY, action.aoe, faces);

		// draw the point the cursor is on
		this.drawPoint(drawX, drawY, 1);

		// draw the arrow that represents the unit
		this.drawArrow(this.x - pixelAxis, this.y - pixelAxis, round, size);

		const face  = ["North", "West", "South", "East", "North"][faces];
		const range = (inRange ? distance : max);
		const hit   = RangeFinder.findRange(inRange ? distance : max, cuts);
		const zoom  = ((this.tileSize / this.baseSize) * 100).toFixed(0);
		const text  = `Range ${range} (${face}), Hit -${hit}, Zoom ${zoom}%`;

		this.drawHeader(text);

		// set this so we can check if it changed next time we draw this
		// if so, and it it went even -> odd or odd -> even we need to offset
		// the graphic in order to keep it centered on the same point
		this.lastSize = size;
	}
}

// only execute this in node; not browser
if (typeof module !== "undefined") {
	
	/* global module */

	module.exports = {ModWidget, ReqWidget, RangeFinder};

}

/* exported ModWidget */
/* exported ReqWidget */
/* exported RangeFinder */
