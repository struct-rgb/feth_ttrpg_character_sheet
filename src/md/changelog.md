
Forged by Fire Strategy TTRPG Character Builder Changelog
=========================================================

## Changelog

### Version 4.2.0
  * Fixed bug where the class features were always prompted on character swap
  * Fixed data errors in Shelter F, Shelter R, Pony, and Rally Strength
  * Added automatically detected Morph effective icon to token generation

### Version 4.1.2
  * Fixed issue parsing `Required` predicate in feature requirements

### Version 4.1.0
  * Added the Morph skill properly, as well as Shifter variants and Morph D arts

### Version 4.0.0

#### General
  * Reorganized the layout of the Create > Character tab
  * Added a select in Create > Character for combat initiative
  * Added a display to show how many skill points are available
  * Implemented new weapon triangle Mt bonus into damage formula
  * Fixed equip check bug with Rank C-B arts when max rank is < B.

#### Game Data
  * Combined breaker and breaker+ abilities into modal abilities 
  * Combined prowess abilities into modal abilities
  * Updated descriptions, stats, and growths for basic classes
  * Small might rebalances on various Swords and Axes
  * Bow can counter at Range 1, but now give a small Avo penalty
  * Added in spells and arts for the new Guile healer toolkit
  * Added in reworked reason spells with elemental attributes
  * Many fixes for data errors discovered using build script improvements
  * Updated all game data to use new markup style in their descriptions
  * Set status of FE:3H setting specific features to hidden

#### Markup
  * Markup syntax was changed to use `}{` as a field delimiter instead of `:`
  * The empty center field was replaced with an optional third field
  * Leading `@` can be replaced with `#` to silence reminders in textual output

#### Calculator
  * Added new `let` expression which is used to create local variables
  * Replaced more and less expressions with max and min expressions
  * Begun work on a `match` expression to cleanly map values

#### Internal
  * Removed mounts as a pseudo feature; now they're just a mov modifier
  * Removed "bowhit" template from before general universal penalty
  * Rewrote the build script in nodejs to perform much more data validation

### Version 3.7.0
  * NPC generator can now create Authority units with battalions.
  * Token generator is now able to generate tokens for battalions.
  * Sheet and rangefinder now supports larger unit sizes (2x2, 3x3, etc...)
  * Added option to export characters as VTT Enhancement Suite character files (buggy).
  * Added the option to generate HTML blurbs vs the traditional Markdown ones.
  * Add arts equipping validation to the arts section of the sheet (buggy).
  * Added mone content from Patch #6.

#### TODO
  * Add slots display to Abilities/Inventory/Arts
  * Incorperate equipment content into items.
  * Add skill checks & macros under Assign > Checks.
  * Add monster classes and presets.
  * Add an Assign > Support tab.
  * Fix definitions so Ranks are an array.

### Version 3.6.0
  * Added token generator to the Tools > NPC tab.
  * Added interactive Range and AoE displays to some Items, Arts, and Gambits.
  * Added Metal, Water, and Beast elements to arts filter.
  * Added Half-slots to abilities and arts filters.
  * (Some) requirement indicators now update automatically.
  * Dynamically computed modifiers now update automatically.
  * Overhauled how stats update when changed.

#### Calculator
  * Added line comments in the form of `// comment`
  * The `else` keword can optionally be followed with `then` in conditionals.

#### Game Data Changes
  * Rebuke rebalanced to remove bonus damage and only apply on hit after combat.
  * Lead by Example split up into Lead by Example 1 and Lead by Example 2.
  * Added Discipline Master (this was hard to implement, lol)
  * Added Lifedrinker (with explainer text for 'effect damage')
  * Lots of minor bug fixes and corrections.

### Bug Fixes
  * NPC generation crashed if it put >100 skill points in a Talent skill

### Version 3.5.0

### Improvements
  * Brawl weapons without Might or Mystic notify user on batch macrogen
  * Overhauled Range Penalty Calculation to prompt user for the attack range.
  * You can make it always prompt even with no penalty if you want to do that.
  * Includes prompt options for Close Counter and Far Counter.
  * Made it possible to import/export character, item, and battalion lists.
  * Stat change animation no longer plays when transfering stats to main sheet.

#### Bugfixes
  * Fixed bug with Combat Artist, Metamagician, and Trapper that crashes page
  * Fixed bug where Other skills doesn't take into account base skill aptitude
  * Arc Generation now correctly counts as a lightning metamagic
  * You can not import the same file more than once in a row.

#### Game Data Rebalances and Changes
  * Added new Tremor (Guile B) and Omen (Guile B)spells for playtest
  * Added new Solidarity (Faith C) and Perdition (Faith B) spells for playtest
  * Brutal's effect was reworked to apply in-combat conditions.
  * Big Dipper Strike given SP Cost +3 and it doens't apply [Rattled] now.
  * Bloodthirsty unequip effect updated to last while unit is Berserk
  * Flexible Blade nerfed to Mt +3 and Prot/Resl +3
  * Blizzard given Mt +1 and Hit +5
  * Cutting Gale given Mt -2 and Crit -5
  * Frostbite given Mt +2 and Crit +5
  * Mire given Hit +10
  * Pugni given Hit -5
  * Static Shock given Mt -1
  * Swarm given Mt +2, Hit +10, and TP Cost -1
  * Thunder given Crit +5
  * Wind given Mt -1

### Version 3.4.0

#### Character Options
  * Added playtesting versions of Brad's new shield weapons.
  * Added in automatically calculated "Other" skill to the skills UI.
  * Fist Techniques now have prices associate with them.

#### Internal Changes
  * Added in dedicated shortcircuit 'and' and 'or' logical operators.
  * Other Prowess can now just be equipped without consuming an ability slot.
  * Logical and Relative expressions are now supported in arbitrary expressions.
  * This does not mean you *should use them* outside of conditional expressions.
  * Normal "if" conditional expressions still work the same because roll20.
  * Both "metaif" and "bothif" conditionals branch off of zero/non-zero values.
  * The "when" template has been removed; use "bothif" conditionals instead.

### Version 3.3.0

#### Game Data
  * Training weapons now grant Crit -15 to curb crit stacking.
  * The names of the Banneret and Lord classes were swapped.
  * HP +5 now does not become a half slot at level 10.
  * Structure: Crossbow now only adds Mt +2
  * Addition of Rank E spells for Faith, Reason, and Guile
  * The Inevitable and Prolonged combat arts were rebalanced.

#### Changes to Abilities and Arts
  * "Class" and "Equipped" tabs were merged for both abilities and arts.
  * Optional class features are chosen instead of always listing each option.
  * Tactical arts can now now serve as hosts for combat arts.
  * Tactical arts no longer secretly use the equipped weapon as a host.
  * Combat arts that can be "used with one other" now actually can be.
  * Whether descriptions are collapsed is now preserved in the save data.
  * Batch Create Macros has been updated to incorporate these changes to arts.

#### Miscellaneous
  * Decreased load times for changing characters and inventory items.
  * Decreased time it takes to batch generate macros (above fix helped).
  * Attribute descriptions are included in generated macros when relevant.
  * Budding talent now only gives double gains after the bud threshold.
  * Budding talent threshold is now 16 (or 10 for a budding weakness).
  * Using a build preset to create a custom character now fills the point buy.
  * Added better filter popup options for character build selects.
  * Theme loads earlier so as not to flash grenade dark mode users.
  * Pointbuy shows amount that a change increases/decreases final stats.
  * Pointbuy allows you to configure these to play as an animation.
  * Added new "Hacker" theme (Boneless mode but green).
  * Changed skills aptitude from numerical to user friendly word based select.
  * Various minor bugfixes.

#### Internal Changes
  * Enshrined "bothif" as a full and proper calculator conditional construct.
  * Old "bothif" template has been renamed to "when" now but should be avoided.
  * Most references to "weapon" internally have been changed to "item".
  * Better legacy support for importing items and battalions.

### Version 3.2.0
  * Various Patch #6 features added
  * Range Penalty updated to apply to all skill types when pas weapon range

### Version 3.1.0
  * Brawl NPC presets now include Rank D combat arts.
  * Brawl NPC presets now use fewer but better fist techniques.
  * Brawl NPC presets now have default Mighty/Mystic attributes.
  * Added Item and Armor weapon kits to NPC presets.
  * Randomized the default weapon kits of some classes.
  * Updated ability filter settings to reflect v3.
  * Steal added to Thief and Trickster as a class art.
  * Added the ability to define file local calculator templates.
  * Numerous small bug fixes and corrections

### Version 3.0.0

#### General
  * Changed Create > Weapons & Spells to Create > Inventory
  * Cha in its old capacity has been changed to Lck (this may break things)
  * Cha now has a new existance as the greater of Dex and Lck
  * Old Assign > Levels has been replaced with a persistant Point Buy UI
  * Point Buy was removed from Tools > Point Buy which is Tools > NPCs now
  * Should have all v3 content up to level 5 except some Reason arts

#### Battalions
  * Added new Create > Battalions tab
  * Added battalion macro generator to Tools > Macros

### Other Stuff
  * Added new Martyr phantom type
  * Added classes for all supported phantom types
  * Added special phantom kits to the NPC generator
  * Fixed issue where batch macro generation ignored class arts
  * Depricated old "Phantom" Class
  * Depricated content now has its own hide toggle
  * Updated class select to filter by skill requirements.

### Version 2.3.2
  * Fixed a bug where chance based abilities wouldn't generate macros

### Version 2.3.1
  * Fixed a bug where requirements for certain arts were broken

### Version 2.3.0

#### General
  * Added some features from Patch #6 and Patch #Battalion
  * Added support for depricating old content

#### Skills
  * Made Brawl skill visible again
  * Skill aptitude (Talent, Weakness, Budding) can now be set per skill

#### Point Buy
  * Rebalanced point buy to minimize the effects of growths
  * Growths underline when they hit a diminished return threshold
  * Final stat preview underlines when a change increases a stat
  * Levelup preview now lets you adjust the number of levels from a class
  * Levelup preview now shows a tooltip containing a summary of the class
  * Final stats from the preview can be copied directly to the main sheet

#### NPC Generator

This is an experimental feature to make it faster to generate generic NPC and
enemy units. Simply pick a class, general build, a main weapon, a side weapon,
and a level, and the builder will set you up with a combat ready unit that
meets those specifications. For the sake of simplicity, setting the class also
sets these other values to recommended defaults, if you want to go even faster.

Generated units are balanced using the point buy demo for Patch #6.

#### Weapon Customization
  * Weapon preview now shows accurate stats and lists attributes
  * Added the ability to give weapons custom descriptions with rich text
  * Added the ability to give weapons tags that affect macro generation
  * Added templates for completely custom weapons

#### Macro Builder
  * Macros now display TP and SP costs of actions
  * Macros now display the thresholds to double/be doubled instead of speed
  * Macros for tactical arts are really easy to generate now
  * Macros for all equipped weapons/arts can be batch generated (experimental)

### Version 2.2.0

  * Minor balance adjustments and corrections to character features
  * Rebalanced the weighting of point buy demo to simplify
  * Added character stat preview to point buy

### Version 2.1.2

  * Added missing War Mage Gem equipment
  * Fixed description for Violent Gust
  * Fixed description for Telekinesis
  * Fixed Abraxas max range (reduced from 3 to 2)

### Version 2.1.1

  * Changed how Phase interacts with some player created tiles
  * Added custom weapon templates for each weapon type
  * Various small game data corrections
  * Attributes now sorted alphabetically and can filter by weapon/spell

### Version 2.1.0

This started out a fixing a few small bugs in version 2.0.0 but then I decided 
to make some improvements to small things I felt that where lacking, so eh...

#### Changes

  * Added titles to tooltips
  * Changed sorcerer to be generic to the three magic types
  * Added text to some classes specifying which class skills are choices
  * Added "||" delimiter to allow for more than one description per tooltip
  * Added "cat" keyword to allow string concatenation in the calculator
  * Added new Golden Egg, Golden Fear, and Document themes
  * Can specify custom requirements with the "Permission" keyword
  * Changed Tools > Themes tab to Tools > Configure
  * Added autosave configuration
  * Turned the checkboxes into funny buttons because I could.
  * The Hide buttons now say Show when text is hidden
  * Finished adding Blurb feature (It generates Markdown)

#### Bug Fixes

  * Minor tweaks to a number of weapons/arts/equipment/etc...
  * Fixed bug where skill validation was always failing
  * Fixed bug where macros didn't generate descriptions
  * Fixed bug where custom weapon might type wasn't saved
  * Fixed bug where budding talent would compute wrong on loading a value
  * Class requirement "pass" indicator updates with skill points
  * Added missing Tactical Art: Opening
  * Added missing Tactical Art: Battle Frenzy
  * Added missing Guile Metamagic: Special
  * Re-enabled autosave every five minutes (was off for development)

### Version 2.0.0

Version 2.0.0 was a complete overhaul to almost the entire program, and as such
version 1.19.1 character sheets and earlier are not fully compatible with it. I 
appologize for any inconvenience this causes.

#### Added

  * Prominently displayed version number
  * Prominently displayed link to github/changelog
  * Automatic reclass requirement check
  * Ability to export Version 1 autosave data
  * Manual save button to supplement autosave
  * Ability to duplicate character sheets
  * A display for reclass eligability
  * Character templates for enemy generation (in progress)
  * Maximum TP and SP calculations
  * Level up tracker and editor
  * Glossary of standard status conditions
  * Glossary of standard tile types
  * Lots and lots of tooltips

#### Removed

  * Dependancy on jinja2
  * Character name from generated macros, making them generic
  * Old critical hit calculation (newcrit is now just crit)
  * Clear character button (now just make new character)
  * Known Abilities and CombatArts (now just equip them)
  * Class Mastery options
  * Health bar
  * Homeland

#### Changed

  * Rearranged tabs to be on the side rather than the bottom
  * Removed known abilities and arts to reflect new progression system
  * Added arts from class tab for classes that grant arts
  * Formulas for dynamic values are now shown
  * Weapon, equipment, and attribute prices are now displayed

#### Weapons

  * Weapons & Spells can now be import and exported
  * Custom Weapons & Spells can now be customized with Attributes
  
#### Calculator

  * Added "ask" keyword to generate prompts
  * Added "more" and "less" expressions for min and max
  * Added "metaif" keyword for conditional compilation
  * Added "elseif" keyword for easier chaining of conditionals
  * Added "%" binary operator for modulus
  * Added "die" binary operator to allow for die rolls
  * Added "not()" operator for easier conditionals
  * Added "sign()" operator to get sign of number
  * Added "meta()" operator for compile time computation
  * Added alias names for Roll20 variables
  * Added templates and "fill" keyword so your macros can now have macros
  * Added variable suggestions
  * Added syntax and variable explanations
  * Added syntax highlighting

#### To Do

  * Refactor to remove magic element ids
  * Fix blurb feature which is now broken
  * Make it possible to select two arts for metamagic (low priority)
  * Add character templates
  * Add battalions

### Version 1.19.1

#### Bugfixes

  * Macro builder did not account for hit, crit, etc... boosts from equipment

### Version 1.19.0

#### General

  * Added in new critical hit and critical avoid to computed stats

#### Macro Generation

  * Macro design was changed to be more compact
  * Add in Prompt generation for the Battlefield ability type
  * Some abilities were changed from Passive to Prompt
  * Add in some help text to explain how to use the macro tool
  * Added a link to a document on how the macro console works

#### Point Buy

  * Added in an experimental point buy calculator for character creation
  * Stats from point buy tab can be copied to the main sheet with a button

#### Misc

  * Added in new abilities and combat arts for Armor, Riding, and Flying
  * Added in more powerful ranged swords (knives)
  * Added Wanderer class
  * Various other small new content I forgot

### Version 1.18.0

#### Themes

  * Added the ability to change the UI theme of the builder
  * Old default appearance has become the "Classic" theme
  * Added the "Dark", "Golden Deer", and "Boneless" themes

#### Autosave

  * The builder now saves your progress to the browser every five minutes
  * I added this feature because roll20 crashes my browser a lot

### Version 1.17.0

#### Skill System

  * Modified skill grade thresholds to suit new values
  * Added Talent, Weakness, and Budding Talent options
  * Skills now track total number of points

#### Weapons

  * Added more of the missing weapons from the base game
  * Made some previously hidden options visible again
  * Added O.B.R.'s Homebrew spells to the list

#### Misc
  * Overhauled the stat calculation system
  * Dynamic values for combat arts and spells now display correctly
  * Macros now show Def, Res, and Spd when attacking
  * Moved macro builder into a different tab
  * Added tiny calculator console into the macro tab

#### Bugfixes
  * Fixed bug where Reason Prowess was not added to Anima Magic macros
  * Fixed bug where active weapon persisted invisibly when changing character

### Version 1.16.0

  * Class mastery abilities can be automatically added with the "Master" button
  * Added a field to the sheet to keep track of gold pieces
  * Added Monster Hunter and Knight Captain classes
  * Tweaked Cleric and Thief classes
  * Fixed bug where stats, growth, and skills would stay when changing character

### Version 1.15.0

  * New tab based user inferface for features (Abilities, Combat Arts, etc...) 
  * Added in the remaining spells that were missing
  * Added in Killer weapons

### Version 1.14.0

  * Added the ability to import and edit multiple sheets at once
  * Added the ability to create new blank sheets without reloading the webpage
  * New character sheet format saves version number and active features
  * Old format can still be imported

### Version 1.13.0
  
  * Brawl skill removed from main page; Brawl abilities removed from drop down
  * Added new spells, abilties, and weapons
