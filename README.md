
# Character Creator for Bradley B.'s Fire Emblem: Three Houses TTRPG

## About

This webapp serves as a character creator and virtual character sheet for Bradley B.'s homebrew TTRPG based on Fire Emblem: Three Houses.

## Building

Currently, the main document must be generated from the [html template](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/three_houses_template.html) and the [json definitions file](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/definitions.json) by running [this python script](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/three_houses.py). The file generated as output must be placed in the same folder as [the main script](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/src/js/sheet.js). It can then be used by opening it in a web browser, no internet connection needed. I am looking for a means to simplify this situation as this project currently depends on [jinja2](https://jinja2docs.readthedocs.io/en/stable/) to build.

## Changelog

### Version 1.18.0

#### Themes

  * Added the ability to chance the UI theme of the builder
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

## Planned Changes

### Version 2.0.0

  * Feature definition overhauled; introduced dynamic modifiers and multipliers
  * Support for importing custom features added (Classes, Abilities, etc...)
  * Improvements and bugfixes in the macro generation system

