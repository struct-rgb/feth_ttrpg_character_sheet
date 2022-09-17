#!/usr/bin/env python3

import json

from pathlib import Path

def compile_definitions():

	compiled = json.loads(Path("./src/json/template.json").read_text())

	# compile all of the json data into a monolithic file
	for file in Path("./src/json").iterdir():
		
		if not file.is_dir():
			continue

		definitions = []

		for definition in file.iterdir():
			definitions.append(json.loads(definition.read_text()))

		compiled[file.name] = definitions

	print(json.dumps(compiled, indent=2))
	return compiled

def main():

	json_template_string = Path("definitions.json").read_text()
	definitions_literal  = json_template_string
	definitions          = json.loads(definitions_literal);

	compile_definitions()

	Path("definitions.js").write_text(
		f"const definitions = {json_template_string};"
	)

if __name__ == "__main__":
	main()
