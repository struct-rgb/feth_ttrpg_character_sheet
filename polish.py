
import re


GRAMMER = """
<expr>   ::= <list> | <nested>
<list>   ::= <quote> | <symbol> | <string> | <nested> | 
<nested> ::= "(" <list> ")"
<quote>  ::= "'(" <list> ")"
"""

class CompilationError(Exception):

	def __init__(self, message, position):
		super().__init__(message)
		self.position = position

class Tokens:

	class REGEXP:
		STRING     = re.compile(r"`[^`]*`")
		OPERATOR   = re.compile(r"\(|\)")
		SYMBOL     = re.compile(r"[^`() \t\n\r]+")
		WHITESPACE = re.compile(r"[ \t\n\r]+")
		BLACKSPACE = re.compile(r"^[ \t\n\r]+$")
		TOKENS     = re.compile(
			"|".join([
				STRING.pattern,
				OPERATOR.pattern,
				SYMBOL.pattern,
				WHITESPACE.pattern,
			]),
		)

	class TERMINALS:
		BEGIN = "("
		END   = ")"

def tokenize(source):

	tokens = Tokens.REGEXP.TOKENS.finditer(source)
	output = []

	index = 0
	for token in tokens:

		match = token.group(0)
		
		if index != token.start():
			raise CompilationError(
				f"Invalid token at {index}", index
			)

		if not Tokens.REGEXP.BLACKSPACE.match(match):
			output.append(token)

		index += len(match)

	if index != len(source):
		raise CompilationError(
			f"Invalid token at {index}", index
		)

	return output

class Parser:

	def __init__(self, symbols):

		self._index  = 0
		self._tokens = None
		self._length = 0
		self._depth  = 0

		self.symbols = symbols

	def _sink(self):
		self._depth += 1

	def _swim(self):
		self._depth -= 1

	def _is_toplevel(self):
		return self._depth == 0

	def _to_next(self):
		if self._index < self._length:
			self._index += 1

	def _to_prev(self):
		if self._index > self._length:
			self._index -= 1

	def _next_token(self):
		i = self._index + 1
		if i < self._length:
			return this._tokens[i].group(0)
		else:
			return None

	def _prev_token(self):
		i = self._index - 1
		if i > self._length:
			return this._tokens[i].group(0)
		else:
			return None

	def token(self):
		if self._index < self._length:
			return self._tokens[self._index].group(0)
		else:
			return None

	def position(self):
		if self._index < self._length:
			return self._tokens[self._index]._index
		else:
			return None

	def parse_source(self, source):
		tokens = tokenize(source)
		return self.parse_tokens(tokens)

	def parse_tokens(self, tokens):
		self._index  = 0
		self._tokens = tokens
		self._length = len(tokens)
		self._depth  = 0

		out = self._parse_expression()

		return out

	def _parse_expression(self):
		out  = None
		save = self._index

		self._index = save
		out = self._parse_list()
		return out

	def _parse_list(self):

		array = []

		while True:
			out  = None
			save = self._index

			self._index = save
			out = self._parse_nested()
			if out is not None:
				array.append(out)
				continue

			self._index = save
			out = self._parse_string()
			if out is not None:
				array.append(out)
				continue

			self._index = save
			out = self._parse_symbol()
			if out is not None:
				array.append(out)
				continue

			break

		return array or None

	def _parse_nested(self):

		if self.token() != Tokens.TERMINALS.BEGIN: return None
		self._to_next()

		self._sink()
		inner = self._parse_list()
		if inner is None: return inner
		self._swim()

		if self.token() != Tokens.TERMINALS.END:
			raise CompilationError(
				"unclosed nested expression", self.position()
			)
		self._to_next()

		return inner

	def _parse_symbol(self):

		if not (self.token() and Tokens.REGEXP.SYMBOL.match(self.token())):
			return None

		token = self.token()
		self._to_next()

		self.symbols.add(token)
		return token

	def _parse_string(self):

		if not (self.token() and Tokens.REGEXP.STRING.match(self.token())):
			return None

		token = self.token().replace("`", "")
		self._to_next()

		return token

def parse(source, symbols=None):
	if symbols == None:
		symbols = set()
	parser = Parser(symbols)
	return parser.parse_source(source)

class AST:

	def __init__(self, source):
		self.symbols = set()
		parser       = Parser(self.symbols)
		self.ast     = parse(source)

	def __iter__(self):
		return self.nodeiter();

	def nodeiter(self):
		index = 0
		stack = []
		node  = self.ast

		yield node
		while True:

			if index == len(node):

				if len(stack) == 0:
					break

				node  = stack.pop()
				index = stack.pop()
				continue

			if isinstance(node[index], list):
				stack.append(index + 1)
				stack.append(node)

				node  = node[index]
				index = 0
				yield node
			else:
				index += 1

	def printout(self):
		for node in self:
			print(node)

	def collect(self):

		table = {}
		for node in self:
			if len(node) == 2:
				key, value = node
				table[key] = table.get(key, []) + [value]
			else:
				continue

		return table

	def __str__(self):
		return str(self.ast)


	def __repr__(self):
		return repr(self.ast)



