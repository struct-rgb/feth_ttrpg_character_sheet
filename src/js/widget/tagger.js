
/* global element, ellipse, wrap, tooltip, uniqueLabel */

/* global Markup */

class Tagger {

	static TIPS = {

		combo: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: you can combine multiple tooltips from the same ",
				"namespace into one by typing || between the names ",
				"in the center field."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{art}{Shelter R||Shelter F}{Shelter}"
			)),
		]),

		custom: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: the \"tooltip\" namespace lets you make custom tooltips. ",
				"Unlike other namespaces, the display text goes in the center ",
				"field and the tooltip text in the rightmost.",
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{tooltip}{display text}{tooltip text}"
			))
		]),

		const: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: the \"const\" namespace contains commonly used ",
				"prewritten tooltips."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"gbp: shown for status conditions that apply a generic ",
				"statistic bonus or penalty, i.e. [Stat +X] or [Stat -X]."
			)),
			element("br"), element("br"),
			element("span", wrap(
				"variant: explanation for how reason metamagic ",
				"variants work (special effect with specific spells)"
			)),
			element("br"), element("br"),
			element("span", wrap(
				"ap: attack plurality table"
			)),
		]),

		style: element("div", [
			element("br"),
			element("span", wrap(
				"Tip: you can apply multiple styles at once by typing || ",
				"between the names in the center field.",
			)),
			element("br"), element("br"),
			element("span", wrap(
				"@{style}{bold||italic}{extra emphasis}"
			)),
		]),
	};

	constructor(target, lookup, callback) {

		this.target   = target;
		this.callback = callback; 

		class Thorax {
			constructor(feature) {
				
				this.textnode = document.createTextNode(feature.name);
				this.select   = feature.select(() => {
					this.textnode.data = ellipse(this.select._select.value, 10);
				});

				this.root = this.select.root;

				const div      = this.select.root.firstChild;
				const dropdown = div.firstChild;
				dropdown.remove();

				div.firstChild.prepend(element("br"));
				div.firstChild.prepend(dropdown);
				div.firstChild.prepend(element("br"));
				div.firstChild.prepend(element("strong", feature.name));
				div.prepend(element("span", this.textnode, "datum"));				
			}

			get value() {
				return this.select._select.value;
			}
		}

		this._silent = element("select", {
			class   : ["simple-border"],
			content : (
				[["Verbose", "@"], ["Silent", "#"]]
					.map(pair => {
						const [text, sigil] = pair;
						return element("option", {
							attrs   : {value: sigil},
							content : text
						});
					})
			),
			attrs   : {
				onchange: (() => {
					this._sil_tn.data = this._silent.value;
				})
			}
		});

		this._tags = element("select", {
			class   : ["simple-border", "selectable"],
			content : (
				Array.from(lookup.keys())
					.filter(n => n != "")
					.map(n =>
						element("option", {attrs: {value: n}, content: n}))
			),
			attrs   : {
				onchange: (() => {
					const data        = this._tags.value;
					this._tag_tn.data = data ? data : "\xA0\xA0\xA0";
					this._span.firstChild.remove();
					this._span.appendChild(this._map.get(data).root);
					this._tips.firstChild.remove();
					this._tips.appendChild(Tagger.TIPS[
						data == "tooltip"
							? "custom"
							: data == "style"
								? "style"
								: data == "const"
									? "const"
									: "combo"
					]);
				})
			}
		});

		const exclude = new Set([""]);

		this._map = new Map(
			Array.from(lookup.entries())
				.filter(e => !exclude.has(e[0]))
				.map(e => { e[1] = new Thorax(e[1]); return e; })
		);

		this._span = element("span", this._map.get("item").root);

		this._tool = element("input", {
			class : ["simple-border", "selectable", "adder-field"],
			attrs : {
				type: "text",
			}
		});

		this._text = element("textarea", {
			class : ["simple-border", "selectable", "adder-field"],
			attrs : {
				placeholder : "Enter custom display text here...",
				onchange    : (() => {
					this._txt_tn.data = ellipse(this._text.value, 6);
				}),
			}
		});

		this._tips = element("div", Tagger.TIPS["combo"]);

		this._tag_tn = document.createTextNode("namespace");
		this._txt_tn = document.createTextNode("...");
		this._sil_tn = document.createTextNode("@");

		this.root = element("span", [
			tooltip(
				element("input", {
					class  : ["simple-border"],
					attrs  : {
						value   : "Add",
						type    : "button",
						onclick : (() => {
							this.insert(this.text());
							this.callback.call();
						})
					},
				}),
				wrap(
					"Add your own tooltips to your custom item description; ",
					"mouse over the highlighted text to the right to select ",
					"a feature to add."
				)
			),
			element("span", [
				tooltip(element("span", this._sil_tn, "datum"), [
					uniqueLabel("Visibility:", this._silent), element("br"),
					this._silent, element("br"),
					wrap(
						"Verbose tags appear as reminder text inside blurbs ",
						"and macros, while silent tags do not. Both appear as ",
						"tooltips while within the builder."
					)
				]),
				"{",
				tooltip(element("span", this._tag_tn, "datum"), [
					uniqueLabel("Choose a namespace:", this._tags), element("br"),
					this._tags, this._tips
				]),
				"}{",
				this._span,
				"}{",
				tooltip(element("span", this._txt_tn, "datum"), [
					uniqueLabel("Enter display text:", this._text), element("br"),
					this._text,
					element("br"),
					element("span", wrap(
						"Tip: if left empty, display text will be the name of ",
						"the feature selected in the center field.",
					))
				]),
				"}"
			])
		]);
	}

	text() {
		const namespace = this._tags.value;
		const names     = [this._map.get(namespace).value];
		const display   = this._text.value;
		const silent    = this._silent.value == "#";
		return Markup.compose(namespace, names, display, silent);
	}

	insert(text) {
		const start  = this.target.selectionStart;
		const end    = this.target.selectionEnd;
		const old    = this.target.value;
		this.target.value = (
			`${old.substring(0, start)}${text}${old.substring(end)}`
		);

		this.target.setSelectionRange(start + text.length, end + text.length);
		this.target.focus();
	}

}

/* exported Tagger */
