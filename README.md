
# Character Creator for Bradley B.'s Fire Emblem: Three Houses TTRPG

## About

This webapp serves as a character creator and virtual character sheet for Bradley B.'s homebrew TTRPG based on Fire Emblem: Three Houses.

The main game is accessible [here](https://app.roll20.net/campaigns/details/10892166/fire-emblem-three-houses-interest-gathering) for those with a Roll20 account.

## Building

Currently, the main document must be generated from the [html template](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/three_houses_template.html) and the [json definitions file](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/definitions.json) by running [this python script](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/three_houses.py). The file generated as output must be placed in the same folder as [the main script](https://github.com/struct-rgb/feth_ttrpg_character_sheet/blob/main/three_houses.js). It can then be used by openning it in a web browser, no internet connection needed. I am looking for a means to simplify this situation as this project currently depends on [jinja2](https://jinja2docs.readthedocs.io/en/stable/) to build.