#!/usr/bin/env python3

import sys
import json

from pathlib import Path

def error_context(data, error, context):

	lines  = data.split("\n")
	center = error.lineno - 1
	start  = max(center - context, 0);
	stop   = min(center + context, len(lines) - 1);
	digits = len(str(error.lineno))
	out    = "%%%dd: %%s" % digits
	text   = []

	for index in range(start, stop + 1):
		text.append(out % (index + 1, lines[index]))
		if index == center:
			text.append("-" * (digits + error.colno + 1) + "^")

	return "\n".join(text)

def compile_definitions():

	compiled = json.loads(Path("./src/json/definitions.json").read_text())

	# compile all of the json data into a monolithic file
	for file in Path("./src/json").iterdir():
		
		# we want every folder except the templates
		if not file.is_dir() or file.name == "templates":
			continue

		definitions = []

		for definition in file.iterdir():

			data = definition.read_text()

			try:
				definitions.append(json.loads(data))
			except json.decoder.JSONDecodeError as error:
				print("Error loading: " + str(definition), file=sys.stderr)
				print(error_context(data, error, 3), file=sys.stderr)
				print(error, file=sys.stderr)
				sys.exit(1)

		compiled[file.name] = definitions

	# print(json.dumps(compiled, indent=2))
	return compiled

def main():

	json_template_string = Path("definitions.json").read_text()
	definitions_literal  = json_template_string
	definitions          = json.loads(definitions_literal);

	Path("definitions.js").write_text(
		f"const definitions = {json_template_string};"
	)

	# compiled = compile_definitions()

	# Path("definitions_.js").write_text(
	# 	f"const definitions = {json.dumps(compiled, indent=2)};"
	# )	

if __name__ == "__main__":
	main()
