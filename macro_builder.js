
class MacroBuilder {
	
	constructor(name) {
		this.name = name;
		this.base = [];
	}

	me(action) {
		this.base.push("/me ", action, "\n");
		return this;
	}

	table() {
		this.base.push("&{template:default}");
		return this;
	}

	row(head, body) {
		this.base.push("{{", head, "=", body, "}}");
		return this;
	}

	sum(...args) {
		const level = [];
		level.push("[[")

		let first = true;
		for (let arg of args) {
			if (arg == null) continue;
			if (!first) level.push("+");
			level.push(arg);
			first = false;
		}

		level.push("]]");
		return level;
	}

	attribute(character, attribute) {
		return "@{" + character + "|" + attribute + "}";
	}

	character(attribute) {
		return this.attribute(this.name, attribute);
	}

	selected(attribute) {
		return this.attribute("selected", attribute);
	}

	target(attribute) {
		return this.attribute("target|Other", attribute);
	}

	call(name, value) {
		return [name, "(", value,")"];
	}

	prompt(text, ...values) {
		const level = [];
		level.push("?{");
		level.push(text);

		switch (values.length) {
			
			case 0:
				throw new Error("Must have at least 1 value");
			
			case 1:
				level.push("|", values[0]);
				break;

			default:
				if (values.length % 2 != 0) {
					throw new Error("Must have even number of pairs");
				}
				for (let i = 0; i < values.length; i += 2) {
					level.push("|", values[i], ",", values[i + 1]);
				}
				break;
		}

		level.push("}");
		return level;
	}

	macro() {

		const flatten = (list, accumulator) => {
			for (let element of list) {
				if (element instanceof Array) {
					flatten(element, accumulator);
				} else {
					accumulator.push(String(element));
				}
			}
			return accumulator;
		};

		return flatten(this.base, []).join("");
	}

}
