# Expressions

These work more or less how you would expect math expressions to. They allow
for easy creation of abilities or combat arts with dynamic attributes that are
computed based off of the character's statistics. Any expression can be
surrounded with parentheses to adjust the order of evaluation.

## Arithmetic Operators

The typical basic arithmetic operations are supported.

   * Addition is `+`
   * Subtraction is `-`
   * Multiplication is `*`
   * Division is `/`

Division does floating-point/real number division. In addition to these,
negation is supported with the unary `-` operator, and a unary `+` operator is
included for the sake of completeness but doesn't do anything.

## Math Functions

The following math functions are supported.

   * Round to the next lowest whole number using `floor()`
   * Round to the next highest whole number using `ceil()`
   * Round to the nearest whole number using `round()`
   * Get the positive magnitude of any value using `abs()`

## Variables

The values of your characters different stats can be read out using variables.
A number of different variables are supported; the full list of available
variables are listed as suggestions when typing in the empty console entry.

## Conditional Expressions

A conditional expression allows you to pick one of two values based on the
result of a comparision using a relative operator. They take the form:

`if <expr> <relative operator> <expr> then <expr> else <expr>`

The expression after the `then` keyword is selected when the condition after
the `if` keyword is true, and the expression after the `else` keyword is
selected if the condition is false. For example, say we want to make an
expression that returns the higher of our defensive stats:

`if res > def then res else def`

The result will be `res` if the condition `res > def` is true, otherwise the
result will be `def`.

Be advised that conditionals generate a lot of very, very unreadable code when
expressions containing them are converted into Roll20 macros. This is especially
true for nested conditionals.

### Relative Operators

These are the supported comparison operators

   * "is equal to" is `==`
   * "is not equal to" is `<>`
   * "is less than" is `<`
   * "is greater than" is `>`
   * "is less than or equal to" is `<=`
   * "is greater than or equal to" is `>=`

There can be only one of these per conditional, and they cannot be chained
together in a sequence.

### Use inside Prompt Expressions

Due to the limitations of the Roll20 macro language, into which this language of expressions needs to be able to translate, conditional expressions cannot be
used inside of prompt expressions, but the opposite is not true. Prompt
expressions *can* be used inside of conditional expressions.

## Translation Hint Expression Types

Sometimes when writing expressions we want a bit of the expression to have
different behavior when it is evaluated in the character builder vs when it
is converted into a Roll20 Macro. These following expression types are used
for those situations:

   * Quoted Text
   * Alias Expressions
   * Prompt Expressions

## Quoted Text

Some expression types use text as part of the process of translation into
Roll20 macros. Normally, these bits of text need to resemble variable names,
being on word without spaces, however, surrounding a multiword bit of text in
backquote characters allows it to all be interpreted as one item:

\``This is an example of quoted text.`\`

Quoted text cannot contain backquote characters inside of it.

## Alias Expressions

Alias expressions allow for an expression to evaluate to a value inside of the
character builder, but to instead reference a variable when transformed into a
Roll20 macro. They take on the following form:

`<identifier | quoted text> as <expression>`

As an example, say that I want to create a Combat Art that scales its might off
of my character's charm statistic. The name of the relevant variable for my 
character's charm in the builder is `char|total|cha` but the name of the one in
my character's Roll20 sheet is `Cha` instead. I can make a an expression that
works in both using the following bit of code:

`2 + floor((Cha as char|total|cha) * 0.3)`

This will make a Combat Art with a base might of two that add additional might
equal to 30% of my character's charm statistic (rounded down). The character
builder can execute this directly to get the correct total might, and it can
also translate this into a Roll20 macro that does the same thing.

If I wanted to specify my character's name, I could write it as:

`2 + floor((`\``Cha as char|total|cha`\``) * 0.3)`

## Prompt Expressions

A prompt expression creates a dialogue box prompting input when it the outer
expression it is part of is translated into a Roll20 macro. When evaluated
inside of the character builder, it instead chooses a default option without
prompting the user (this is to allow for automatic calculations).

They begin with the form:

`ask <identifier | quoted text>`

This by itself will turn into a prompt asking for a number in Roll20 and in the
character builder will turn into the number 0.

A number of options can be specified afterward, each with this forms:

`if <expression | alias expression>`

Theis will cause the prompt in Roll20 to instead display a list of these each
of these options and selecting an option will evaluate to the result of the 
corresponding expression. If you provide an alias expression instead of just a
normal one, the option in the select will display the alias text instead.

When this is evaluated in the character builder, it will evaluate to the result
of the expression in the first provided option. If you want it to evaluate to a
later option instead, replace the `if` at the beginning as a `do`.

Putting this all together, here is a sample prompt for **Death Blow**, which
grants Strength +6 to the user when the user initiates combat:

`ask `\``Initiating Combat?`\``if No as 0 do Yes as 6`

In Roll20 this will make a dialogue box that prompts us with the question,
`Initiating Combat?` and the options `No` and `Yes` in that order. If we select
`No`, the prompt return 0 as a result, and if we select `Yes` it returns 6.

In the character builder, this just returns 6, since abilities can each be
individually toggled on and off on their respective panes.

### Use inside Conditional Expressions

Due to the limitations of the Roll20 macro language, into which this language of expressions needs to be able to translate, conditional expressions cannot be
used inside of prompt expressions, but the opposite is not true. Prompt
expressions *can* be used inside of conditional expressions.

### Use inside Prompt Expressions

Due to the limitations of the Roll20 macro language, into which this language 
of expressions needs to be able to translate, prompt expressions cannot be used 
inside of other prompt expressions.
