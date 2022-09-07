
import json

from pathlib import Path
from jinja2 import Template

json_template_string = Path("definitions.json").read_text()
definitions_literal  = json_template_string
definitions          = json.loads(definitions_literal);

# html_template_string = Path("three_houses_template.html").read_text()
# html_template        = Template(html_template_string)


# Path("index.html").write_text(
# 	html_template.render(
# 		definitions=definitions,
# 		definition_literal=definitions_literal,
# 	)
# )

Path("definitions.js").write_text(
	f"const definitions = {json_template_string};"
)
