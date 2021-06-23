
import json

from pathlib import Path
from jinja2 import Template

jinja2_template_string = Path("three_houses_template.html").read_text()

template    = Template(jinja2_template_string)
literal     = Path("definitions.json").read_text();
definitions = json.loads(literal);

Path("index.html").write_text(
	template.render(
		definitions=definitions,
		definition_literal=literal,
	)
)
