#!/usr/bin/env python3

import re
import sys
import json

from pathlib import Path
from argparse import ArgumentParser

TIER_ORDER = {
	"Starting": 1,
	"Advanced": 2,
	"Phantom": 3,
	"Bonus": 4,
}

SKILL_ORDER = {
	"Axes"     : 0,
	"Lances"   : 1,
	"Swords"   : 2,
	"Bows"     : 3,
	"Brawl"    : 4,
	"Faith"    : 5,
	"Guile"    : 6,
	"Reason"   : 7,
	"Other"    : 8,
}

RANK_ORDER = {
	"S+" : 12,
	"S"  : 11,
	"A+" : 10,
	"A"  :  9,
	"B+" :  8,
	"B"  :  7,
	"B-C":  6,
	"C+" :  5,
	"C"  :  4,
	"D+" :  3,
	"D"  :  2,
	"E+" :  1, 
	"E"  :  0,
}

OVERMAX_RANK = 13

SORTING_FUNCS = {

	"adjutants": lambda item: (
		(
			"first" not in item["tags"],
		)
	),

	"presets": lambda item: (
		(
			"first" not in item["tags"],
		)
	),

	"classes": lambda item: (
		(
			"first" not in item["tags"],
			TIER_ORDER.get(item["tier"], 1000),
			"".join(sorted(item["type"])),
			item["name"]
		)
	),

	"gambits": lambda item: (
		(
			"first" not in item["tags"],
			"Training" not in item["name"],
			"Outfitting" not in item["name"],
			RANK_ORDER.get(item["rank"], OVERMAX_RANK),
			item["name"]

		)
	),

	"battalions": lambda item: (
		(
			"first" not in item["tags"],
			item["name"]
		)
	),

	"items": lambda item: (
		(
			"first" not in item["tags"],
			SKILL_ORDER.get(item["type"], 8),
			"custom" in item["tags"],
			"secret" in item["tags"],
			"relic" in item["tags"],
			"sacred" in item["tags"],
			RANK_ORDER.get(item["rank"], OVERMAX_RANK),
		)
	),

	"arts": lambda item: (
		(
			"first" not in item["tags"],
			8 if isinstance(item["type"], list) else SKILL_ORDER.get(item["type"], 8),
			"relic" in item["tags"],
			"sacred" in item["tags"],
			RANK_ORDER.get(item["rank"], OVERMAX_RANK),
		)
	),

	"abilities": lambda item: (
		(
			"first" not in item["tags"],
			item["name"]
		)
	),

	"attributes": lambda item: (
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

def json_check_load(file):
	try:
		data = file.read_text()
	except UnicodeDecodeError as error:
		print(
			f"Error loading: {definition}\n"
			"    could not decode file as utf-8"
		)
		sys.exit(1)

	# first, try to read in file checking syntax
	try:
		data = json.loads(data)
	except json.decoder.JSONDecodeError as error:
		context = error_context(file, data, error, 3)
		print(context, file=sys.stderr)
		sys.exit(1)

	return data

def compile_definitions(omit=False):
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

		template = json_check_load(
			Path("./src/json/templates/%s.json" % file.name)
		)

		definitions = []

		for definition in file.iterdir():

			data = json_check_load(definition)
			
			# skip this stage for presets because they're too complex
			if file.name != "presets":

				# second, check structure of the file read in
				errors = error_template(definition, template, data)

				if errors:
					print(errors, file=sys.stderr)
					sys.exit(2)

			# omit files flagged for it
			if omit and "omit" in data and data["omit"]:
				continue

			# success
			definitions.append(data)

		# sort each list of definitions based on its own criteria
		if file.name in SORTING_FUNCS:
			definitions.sort(key=SORTING_FUNCS[file.name])

		compiled[file.name] = definitions

	# load the paths to all of the image resources
	icons = {}
	base  = Path("./resources/icons/")

	for each in ["item", "type", "effective", "portraits"]:
		icons[each] = sorted(f"./{str(path)}" for path in (base / each).iterdir())

	def sort_portraits(path):
		base   = re.split(r"[./]", path)[-2]
		match  = re.fullmatch(r"^((?:\w+ ?)+)(?:\((\d+)\))?$", base)
		if not match:
			raise Exception(f"Couldn't parse portrait filename {base}")
		result = (match[1], int(match[2] or 0))
		return result

	icons["portraits"].sort(key=sort_portraits)

	compiled["icons"] = icons

	return compiled

argparser = ArgumentParser(
	description="a script for building the character builder's data file"
)

argparser.add_argument(
	"-o", "--omit",
	help="omit files with {\"omit\": true} from the final data file",
	action="store_true",
)

argparser.add_argument(
	"-p", "--print",
	help="print the final data file to stdout",
	action="store_true",
)

def main():

	args = argparser.parse_args()

	compiled   = compile_definitions(args.omit)
	json_str   = json.dumps(compiled, indent=2)
	javascript = f"/* eslint-disable */\nconst definitions = {json_str};"

	Path("definitions.js").write_text(javascript)

	try:
		import markdown
		html = markdown.markdown(Path("README.md").read_text())
		Path("README.html").write_text(html)
	except ImportError:
		pass

	if args.print:
		print(json_str)	

if __name__ == "__main__":
	main()
