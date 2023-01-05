#!/usr/bin/env python3


import sys
import json

from pathlib import Path


TIER_ORDER = {
	"Starting": 1,
	"Advanced": 2,
}

SKILL_ORDER = {
	"Axes"     : 0,
	"Lances"   : 1,
	"Swords"   : 2,
	"Bows"     : 3,
	"Brawling" : 4,
	"Faith"    : 5,
	"Guile"    : 6,
	"Reason"   : 7,
	"Other"    : 8,
}

RANK_ORDER = {
	"S": 5,
	"A": 4,
	"B": 3,
	"B-C": 2.5,
	"C": 2,
	"D": 1,
	"E": 0,
}

SORTING_FUNCS = {

	"classes": lambda item: (
		(
			"first" not in item["tags"],
			TIER_ORDER.get(item["tier"], 3),
			"".join(sorted(item["type"])),
			item["name"]
		)
	),

	"weapons": lambda item: (
		(
			"first" not in item["tags"],
			SKILL_ORDER.get(item["type"], 8),
			"relic" in item["tags"],
			"sacred" in item["tags"],
			RANK_ORDER.get(item["rank"], 6),
			# item["name"],
		)
	),

	"arts": lambda item: (
		(
			"first" not in item["tags"],
			SKILL_ORDER.get(item["type"], 8),
			"relic" in item["tags"],
			"sacred" in item["tags"],
			RANK_ORDER.get(item["rank"], 6),
		)
	),

	"abilities": lambda item: (
		(
			"first" not in item["tags"],
			item["name"]
		)
	),

	"conditions": lambda item: item["name"],

	"tiles": lambda item: item["name"],

	"equipment": lambda item: (
		(item["type"], item["name"])
	),
}

def check_template(template, instance, depth=1):

	errors = []

	for key, value in template.items():

		if key not in instance:
			errors.append('missing key-value pair for "%s"' % key)
			continue

		if isinstance(value, dict):

			if instance[key] is None:
				continue

			recurse = check_template(template[key], instance[key], depth + 1)

			if not recurse:
				continue

			errors.append('inside value for key "%s":' % key)

			for error in recurse:
				errors.append('%s%s' % (" " * depth * 4, error))

	return errors

def error_template(source, template, instance):

	errors = check_template(template, instance)

	if errors:
		return (
			"Error loading: " + str(source) + "\n" + "\n".join(errors)
		)

	return ""

def error_context(source, data, error, context):
	"""
	This creates a little display of the context surronding the line and column
	number of a json.decoder.JsonDecodeError for use in troubleshooting.
	"""

	lines  = data.split("\n")
	center = error.lineno - 1
	start  = max(center - context, 0);
	stop   = min(center + context, len(lines) - 1);
	digits = len(str(error.lineno))
	out    = "%%%dd: %%s" % digits
	text   = ["Error loading: " + str(source)]

	for index in range(start, stop + 1):
		text.append(out % (index + 1, lines[index]))
		if index == center:
			text.append("-" * (digits + error.colno + 1) + "^")

	text.append(str(error))

	return "\n".join(text)

def compile_definitions():
	"""
	Gathers up and compiles all of the features defined in ./src/json into one
	giant javascript file that can be linked to from index.html
	"""

	compiled = json.loads(Path("./src/json/definitions.json").read_text())

	# compile all of the json data into a monolithic file
	for file in Path("./src/json").iterdir():
		
		# we want every folder except the templates
		if not file.is_dir() or file.name == "templates":
			continue

		template = json.loads(
			Path("./src/json/templates/%s.json" % file.name).read_text()
		)

		definitions = []

		for definition in file.iterdir():

			try:
				data = definition.read_text()
			except UnicodeDecodeError as error:
				print(
					f"Error loading: {definition}\n"
					"    could not decode file as utf-8"
				)
				continue

			# first, try to read in file checking syntax
			try:
				data = json.loads(data)
			except json.decoder.JSONDecodeError as error:
				context = error_context(definition, data, error, 3)
				print(context, file=sys.stderr)
				sys.exit(1)

			
			# skip this stage for presets because they're too complex
			if file.name != "presets":

				# second, check structure of the file read in
				errors = error_template(definition, template, data)

				if errors:
					print(errors, file=sys.stderr)
					sys.exit(2)

			# success
			definitions.append(data)

		# sort each list of definitions based on its own criteria
		if file.name in SORTING_FUNCS:
			definitions.sort(key=SORTING_FUNCS[file.name])

		compiled[file.name] = definitions

	return compiled

def main():

	compiled   = compile_definitions()
	json_str   = json.dumps(compiled, indent=2)
	javascript = f"/* eslint-disable */\nconst definitions = {json_str};"

	Path("definitions.js").write_text(javascript)

	print(json_str)	

if __name__ == "__main__":
	main()
