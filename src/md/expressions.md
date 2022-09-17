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
The following variables are supported:

   * `hp`  is the character's maximum hitpoint total (after modifiers)
   * `str` is the character's Strength statisitic (after modifiers)
   * `mag` is the character's Magic statisitic (after modifiers)
   * `dex` is the character's Dexterity statisitic (after modifiers)
   * `spd` is the character's Speed statisitic (after modifiers)
   * `def` is the character's Defense statisitic (after modifiers)
   * `res` is the character's Resistance statisitic (after modifiers)
   * `cha` is the character's Charm statisitic (after modifiers)
   * `current_hp` is the character's current hitpoint total (before modifiers)
   * `base_hp`  is the character's maximum hitpoint total (before modifiers)
   * `base_str` is the character's Strength statisitic (before modifiers)
   * `base_mag` is the character's Magic statisitic (before modifiers)
   * `base_dex` is the character's Dexterity statisitic (before modifiers)
   * `base_spd` is the character's Speed statisitic (before modifiers)
   * `base_def` is the character's Defense statisitic (before modifiers)
   * `base_res` is the character's Resistance statisitic (before modifiers)
   * `base_cha` is the character's Charm statisitic (before modifiers)
   * `pmt` is the physical might from weapons (after modifiers)
   * `mmt` is the magical might from easpons (after modifiers)
   * `pdr` is physical damage reduction (after modifiers)
   * `mdr` is magical damage reduction (after modifiers)
   * `hit` is the character's Hit statistic (after modifiers)
   * `avo` is the character's Avoid statisitic (after modifiers)
   * `crit` is the character's Critical statisitic (after modifiers)
   * `newcrit` is the character's Critcal statistic (accounding for Charm, after modifiers)
   * `cravo` is the character's Critical Avoid statisitic (after modifiers)
   * `mov` is the character's Movement statisitic (after modifiers)
   * `maxrng` is the character's maximum attack range (after modifiers)
   * `minrng` is the character's minimum attack range (after modifiers)

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



