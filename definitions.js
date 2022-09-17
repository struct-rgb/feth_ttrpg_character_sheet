const definitions = {
  "stats": {
    "names": [
      "hp",
      "str",
      "mag",
      "dex",
      "spd",
      "def",
      "res",
      "cha",
      "mov"
    ],
    "linked": [
      [
        "str",
        "pmt"
      ],
      [
        "mag",
        "mmt"
      ],
      [
        "dex",
        "hit"
      ],
      [
        "dex",
        "crit"
      ],
      [
        "cha",
        "cravo"
      ],
      [
        "cha",
        "newcrit"
      ],
      [
        "spd",
        "avo"
      ],
      [
        "def",
        "pdr"
      ],
      [
        "res",
        "mdr"
      ],
      [
        null,
        "minrng"
      ],
      [
        null,
        "maxrng"
      ]
    ]
  },
  "skills": [
    "Axes",
    "Swords",
    "Lances",
    "Brawl",
    "Archery",
    "Reason",
    "Faith",
    "Guile",
    "Authority",
    "Armor",
    "Riding",
    "Flying"
  ],
  "classes": [
    {
      "name": "Commoner",
      "abilities": [],
      "mastery": {
        "abilities": [
          "HP +5"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Noble",
      "abilities": [],
      "mastery": {
        "abilities": [
          "HP +5"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Dancer",
      "abilities": [
        "Dance"
      ],
      "mastery": {
        "abilities": [
          "HP +5"
        ],
        "combatarts": [
          "Special Dance"
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 5,
        "spd": 0,
        "def": -5,
        "res": -5,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 1,
        "mag": 0,
        "dex": 5,
        "spd": 3,
        "def": 2,
        "res": 1,
        "cha": 2,
        "mov": 2
      }
    },
    {
      "name": "Myrmidon",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Speed +2"
        ],
        "combatarts": [
          "Swap"
        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 5,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 1,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Soldier",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Defense +2"
        ],
        "combatarts": [
          "Reposition"
        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 0,
        "dex": 5,
        "spd": 0,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Fighter",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Strength +2"
        ],
        "combatarts": [
          "Shove"
        ]
      },
      "growths": {
        "hp": 10,
        "str": 5,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 1,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Monk",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Magic +2"
        ],
        "combatarts": [
          "Draw Back"
        ]
      },
      "growths": {
        "hp": 5,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 1,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Lord",
      "abilities": [
        "Charm"
      ],
      "mastery": {
        "abilities": [
          "Resistance +2"
        ],
        "combatarts": [
          "Subdue"
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 10,
        "spd": 0,
        "def": 5,
        "res": 0,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 0,
        "dex": 1,
        "spd": 1,
        "def": 0,
        "res": 0,
        "cha": 2,
        "mov": 1
      }
    },
    {
      "name": "Mercenary",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Vantage"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 20,
        "str": 5,
        "mag": 0,
        "dex": 0,
        "spd": 5,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 1,
        "mag": 0,
        "dex": 0,
        "spd": 1,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Thief",
      "abilities": [
        "Steal",
        "Locktouch"
      ],
      "mastery": {
        "abilities": [
          "Steal",
          "Master Thief"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 10,
        "spd": 10,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 2,
        "spd": 2,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Armored Knight",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Armored Blow"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": -10,
        "def": 10,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 3,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": -2,
        "def": 4,
        "res": -1,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Cavalier",
      "abilities": [
        "Canto"
      ],
      "mastery": {
        "abilities": [
          "Desperation"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 20,
        "str": 5,
        "mag": 0,
        "dex": 5,
        "spd": -10,
        "def": 5,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 1,
        "mag": 0,
        "dex": 2,
        "spd": 1,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 0
      },
      "mount": {
        "name": "Horse",
        "description": "A steed with excellent movement, but slow reactions",
        "modifiers": {
          "spd": -2,
          "mov": 3
        }
      }
    },
    {
      "name": "Brigand",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Death Blow"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 2,
        "str": 2,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Archer",
      "abilities": [
        "Bowrange +1"
      ],
      "mastery": {
        "abilities": [
          "Hit +20"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 5,
        "str": 0,
        "mag": 0,
        "dex": 15,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 4,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Brawler",
      "abilities": [
        "Unarmed Combat"
      ],
      "mastery": {
        "abilities": [
          "Unarmed Combat"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 30,
        "str": 0,
        "mag": -10,
        "dex": 10,
        "spd": 10,
        "def": 0,
        "res": -10,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 0,
        "dex": 2,
        "spd": 2,
        "def": 0,
        "res": -1,
        "cha": 0,
        "mov": 1
      },
      "hidden": true
    },
    {
      "name": "Mage",
      "abilities": [
        "Fire"
      ],
      "mastery": {
        "abilities": [
          "Fiendish Blow"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 5,
        "str": -5,
        "mag": 10,
        "dex": 5,
        "spd": 0,
        "def": -5,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 1,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 2,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Dark Mage",
      "abilities": [
        "Miasma",
        "Heartseeker"
      ],
      "mastery": {
        "abilities": [
          "Poison Strike"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 5,
        "str": -5,
        "mag": 5,
        "dex": 5,
        "spd": 0,
        "def": -5,
        "res": 5,
        "cha": 0
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 2,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 1,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Priest",
      "abilities": [
        "Heal",
        "Light Magic Heal +5"
      ],
      "mastery": {
        "abilities": [
          "Miracle"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 5,
        "str": -5,
        "mag": 5,
        "dex": 5,
        "spd": 0,
        "def": -5,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 3,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Pegasus Knight",
      "abilities": [
        "Canto",
        "Avoid +10"
      ],
      "mastery": {
        "abilities": [
          "Darting Blow"
        ],
        "combatarts": [
          "Triangle Attack"  
        ]
      },
      "growths": {
        "hp": 15,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 10,
        "def": 0,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 2,
        "spd": 1,
        "def": 0,
        "res": 2,
        "cha": 0,
        "mov": 0
      },
      "mount": {
        "name": "Pegasus",
        "description:": "A winged horse with high reaction speed and movement",
        "modifiers": {
          "spd": 2,
          "mov": 2
        }
      }
    },
    {
      "name": "Witch Hunter",
      "abilities": [],
      "mastery": {
        "abilities": [
          "Tomebreaker"
        ],
        "combatarts": [
          
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 10,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 2,
        "spd": 0,
        "def": 0,
        "res": 2,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Hero",
      "abilities": [
        "Swordfaire",
        "Vantage"
      ],
      "mastery": {
        "abilities": [
          "Defiant Strength"  
        ],
        "combatarts": [
         
        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": 10,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 3,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 2,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Swordmaster",
      "abilities": [
        "Swordfaire",
        "Sword Critical +10"
      ],
      "mastery": {
        "abilities": [

        ],
        "combatarts": [
          "Astra"  
        ]
      },
      "growths": {
        "hp": 25,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": 20,
        "def": 0,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 4,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Assassin",
      "abilities": [
        "Swordfaire",
        "Locktouch",
        "Stealth"
      ],
      "mastery": {
        "abilities": [
          "Lethality"
        ],
        "combatarts": [
          "Assassinate"  
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 20,
        "spd": 20,
        "def": 0,
        "res": 0,
        "cha": 0
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 4,
        "spd": 5,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 2
      }
    },
    {
      "name": "Fortress Knight",
      "abilities": [
        "Axefaire",
        "Weight -5"
      ],
      "mastery": {
        "abilities": [
          "Pavise"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": -10,
        "def": 15,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 5,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": -6,
        "def": 10,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Paladin",
      "abilities": [
        "Canto",
        "Lancefaire",
        "Terrain Resistance"
      ],
      "mastery": {
        "abilities": [
          "Aegis"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 10,
        "spd": -10,
        "def": 5,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 2,
        "str": 2,
        "mag": 0,
        "dex": 2,
        "spd": 1,
        "def": 2,
        "res": 2,
        "cha": 0,
        "mov": 2
      },
      "mount": {
        "type": "Horse",
        "modifiers": {
          "spd": -2,
          "mov": 2
        }
      }
    },
    {
      "name": "Wyvern Rider",
      "abilities": [
        "Canto",
        "Axefaire"
      ],
      "mastery": {
        "abilities": [
          "Seal Defense"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": -5,
        "dex": 0,
        "spd": 0,
        "def": 5,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 1,
        "def": 2,
        "res": 0,
        "cha": 0,
        "mov": 1
      },
      "mount": {
        "name": "Wyvern",
        "description": "A two winged dragon-like creature.",
        "modifiers": {
          "str": 1,
          "spd": 2,
          "mov": 2
        }
      }
    },
    {
      "name": "Warrior",
      "abilities": [
        "Axefaire",
        "Axe Critical +10"
      ],
      "mastery": {
        "abilities": [
          "Wrath"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 40,
        "str": 15,
        "mag": -5,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 3,
        "str": 3,
        "mag": 0,
        "dex": 1,
        "spd": 1,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Sniper",
      "abilities": [
        "Bowfaire",
        "Bowrange +1"
      ],
      "mastery": {
        "abilities": [

        ],
        "combatarts": [
          "Hunter’s Volley"
        ]
      },
      "growths": {
        "hp": 10,
        "str": 5,
        "mag": 0,
        "dex": 30,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 1,
        "mag": 0,
        "dex": 8,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Grappler",
      "abilities": [
        "Fistfaire",
        "Unarmed Combat"
      ],
      "mastery": {
        "abilities": [
          "Tomebreaker"
        ],
        "combatarts": [
          "Fierce Iron Fist"
        ]
      },
      "growths": {
        "hp": 40,
        "str": 10,
        "mag": 0,
        "dex": 10,
        "spd": 10,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 2,
        "str": 1,
        "mag": 0,
        "dex": 3,
        "spd": 3,
        "def": 1,
        "res": -1,
        "cha": 0,
        "mov": 2
      },
      "hidden": true
    },
    {
      "name": "Warlock",
      "abilities": [
        "Anima Tomefaire",
        "Anima Magic Uses x2"
      ],
      "mastery": {
        "abilities": [
          "Bowbreaker"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": 0,
        "spd": 0,
        "def": -5,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 3,
        "dex": 1,
        "spd": 1,
        "def": 0,
        "res": 4,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Dark Bishop",
      "abilities": [
        "Miasma",
        "Heartseeker",
        "Fiendish Blow"
      ],
      "mastery": {
        "abilities": [
          "Lifetaker"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": -5,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 0
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 4,
        "dex": 2,
        "spd": 0,
        "def": 0,
        "res": 3,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Bishop",
      "abilities": [
        "Light Magic Uses x2",
        "Light Magic Heal +10",
        "Terrain Resistance"
      ],
      "mastery": {
        "abilities": [
          "Renewal"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": 5,
        "spd": 0,
        "def": -5,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 2,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Cleric",
      "abilities": [
        "Axefaire",
        "Light Magic Heal +5"
      ],
      "mastery": {
        "abilities": [
          "Blessed Fortitude"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 5,
        "mag": 5,
        "dex": 0,
        "spd": 0,
        "def": 5,
        "res": 0,
        "cha": 10
      },
      "modifiers": {
        "hp": 2,
        "str": 2,
        "mag": 2,
        "dex": 0,
        "spd": 0,
        "def": 4,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Monster Hunter",
      "abilities": [
        "Swordfaire",
        "Bowfaire",
        "Hide Piercer",
        "Monster Wrangler"
      ],
      "mastery": {
        "abilities": [
          "Monster Slayer"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 25,
        "str": 10,
        "mag": 0,
        "dex": 5,
        "spd": 0,
        "def": 10,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 0,
        "dex": 3,
        "spd": 2,
        "def": 0,
        "res": 3,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "Knight Captain",
      "abilities": [
        "Swordfaire",
        "Lancefaire",
        "Formation"
      ],
      "mastery": {
        "abilities": [
          "Plot Armor"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 5,
        "spd": 0,
        "def": 10,
        "res": -5,
        "cha": 10
      },
      "modifiers": {
        "hp": 3,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 0,
        "def": 3,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Wanderer",
      "abilities": [
        "Swordfaire",
        "Lancefaire",
        "Axefaire",
        "Bowfaire",
        "Light Shield Mastery",
        "Wander"
      ],
      "mastery": {
        "abilities": [
          "Resourceful"
        ],
        "combatarts": [
         
        ]
      },
      "growths": {
        "hp": 30,
        "str": 5,
        "mag": 0,
        "dex": 5,
        "spd": 5,
        "def": 5,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 2,
        "str": 2,
        "mag": 0,
        "dex": 2,
        "spd": 2,
        "def": 1,
        "res": 1,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Knight Captain",
      "abilities": [
        "Swordfaire",
        "Lancefaire",
        "Formation"
      ],
      "mastery": {
        "abilities": [
          "Plot Armor"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 5,
        "spd": 0,
        "def": 10,
        "res": -5,
        "cha": 10
      },
      "modifiers": {
        "hp": 3,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 0,
        "def": 3,
        "res": 0,
        "cha": 0,
        "mov": 0
      }
    },
    {
      "name": "Butterfly Knight",
      "description": "A knight which excels at helping their allies in many different, unusual ways while providing an option on horseback. Mounted or unmounted, they are an inspiration on the battlefield. Excels in Cha and Res.",
      "abilities": [
        "Canto",
        "Cheer/Enforce",
        "Transmute"
      ],
      "mastery": {
        "abilities": [
          "Inspiration"          
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 5,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 1,
        "dex": 1,
        "spd": 0,
        "def": 0,
        "res": 3,
        "cha": 2,
        "mov": 1
      },
      "mount": {
        "name": "Horse",
        "description": "A fancy steed.",
        "modifiers": {
          "mov": 1
        }
      }
    },
    {
      "name": "Falcon Knight",
      "abilities": [
        "Canto",
        "Lancefaire",
        "Avoid +10"
      ],
      "mastery": {
        "abilities": [
          "Defiant Avoid"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": 20,
        "def": 0,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 4,
        "spd": 3,
        "def": 0,
        "res": 4,
        "cha": 0,
        "mov": 2
      },
      "mount": {
        "name": "Pegasus",
        "description:": "A winged horse with high reaction speed and movement",
        "modifiers": {
          "str": 1,
          "spd": 2,
          "mov": 2
        }
      }
    },
    {
      "name": "Wyvern Lord",
      "abilities": [
        "Canto",
        "Axefaire",
        "Avoid +10"
      ],
      "mastery": {
        "abilities": [
          "Defiant Critical"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 15,
        "mag": -5,
        "dex": 0,
        "spd": 10,
        "def": 5,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 2,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 2,
        "def": 3,
        "res": 0,
        "cha": 0,
        "mov": 2
      },
      "mount": {
        "name": "Wyvern",
        "description": "A two winged dragon-like creature.",
        "modifiers": {
          "str": 2,
          "spd": 2,
          "mov": 2
        }
      }
    },
    {
      "name": "Mortal Savant",
      "abilities": [
        "Swordfaire",
        "Anima Tomefaire"
      ],
      "mastery": {
        "abilities": [
          "Warding Blow"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 20,
        "str": 10,
        "mag": 20,
        "dex": 10,
        "spd": -10,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 1,
        "mag": 2,
        "dex": 1,
        "spd": 1,
        "def": 2,
        "res": 2,
        "cha": 0,
        "mov": 2
      }
    },
    {
      "name": "Great Knight",
      "abilities": [
        "Canto",
        "Lancefaire",
        "Axefaire"
      ],
      "mastery": {
        "abilities": [
          "Defiant Defense"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 0,
        "dex": 0,
        "spd": -10,
        "def": 5,
        "res": -5,
        "cha": 5
      },
      "modifiers": {
        "hp": 5,
        "str": 1,
        "mag": 0,
        "dex": 0,
        "spd": -2,
        "def": 6,
        "res": 0,
        "cha": 0,
        "mov": 0
      },
      "mount": {
        "name": "Horse",
        "description": "A sturdy steed with good movement but slow reactions.",
        "modifiers": {
          "spd": -2,
          "def": 2,
          "mov": 3
        }
      }
    },
    {
      "name": "Bow Knight",
      "abilities": [
        "Canto",
        "Bowfaire",
        "Bowrange +2"
      ],
      "mastery": {
        "abilities": [
          "Defiant Speed"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": -5,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 2,
        "str": 1,
        "mag": 0,
        "dex": 4,
        "spd": 3,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 2
      },
      "mount": {
        "name": "Horse",
        "description": "A steed with good movement, but slow reactions.",
        "modifiers": {
          "spd": -2,
          "mov": 2
        }
      }
    },
    {
      "name": "Dark Knight",
      "abilities": [
        "Canto",
        "Anima Tomefaire",
        "Dark Tomefaire"
      ],
      "mastery": {
        "abilities": [
          "Seal Resistance"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 5,
        "mag": 10,
        "dex": 0,
        "spd": -5,
        "def": 5,
        "res": 10,
        "cha": 5
      },
      "modifiers": {
        "hp": 1,
        "str": 1,
        "mag": 2,
        "dex": 2,
        "spd": 1,
        "def": 1,
        "res": 3,
        "cha": 0,
        "mov": 1
      },
      "mount": {
        "name": "Horse",
        "description": "A steed with moderate defense and movement, but slow reactions",
        "modifiers": {
          "spd": -2,
          "def": 1,
          "mov": 1
        }
      }
    },
    {
      "name": "Holy Knight",
      "abilities": [
        "Canto",
        "Lancefaire",
        "Light Tomefaire",
        "Light Magic Heal +10"
      ],
      "mastery": {
        "abilities": [
          "Defiant Resistance"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": 10,
        "spd": -5,
        "def": 5,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 2,
        "str": 1,
        "mag": 1,
        "dex": 2,
        "spd": 1,
        "def": 0,
        "res": 4,
        "cha": 0,
        "mov": 2
      },
      "mount": {
        "name": "Horse",
        "description": "A steed with moderate defense and movement, but slow reactions",
        "modifiers": {
          "spd": -2,
          "def": 1,
          "mov": 1
        }
      }
    },
    {
      "name": "War Hero",
      "abilities": [
        "Swordfaire",
        "Axefaire",
        "Critical +20"
      ],
      "mastery": {
        "abilities": [
          "Quick Riposte"
        ],
        "combatarts": [
          "War Hero’s Strike"
        ]
      },
      "growths": {
        "hp": 40,
        "str": 15,
        "mag": 0,
        "dex": 0,
        "spd": 10,
        "def": 0,
        "res": 0,
        "cha": 5
      },
      "modifiers": {
        "hp": 3,
        "str": 5,
        "mag": 0,
        "dex": 1,
        "spd": 2,
        "def": 1,
        "res": 0,
        "cha": 0,
        "mov": 2
      }
    },
    {
      "name": "Gremory/Guru",
      "abilities": [
        "Anima Magic Uses x2",
        "Dark Magic Uses x2",
        "Light Magic Uses x2"
      ],
      "mastery": {
        "abilities": [
          "Defiant Magic"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": 10,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 5,
        "dex": 2,
        "spd": 1,
        "def": 0,
        "res": 4,
        "cha": 2,
        "mov": 1
      }
    },
    {
      "name": "Sorcerer",
      "abilities": [
        "Dark Tomefaire",
        "Dark Magic Uses x2",
        "Transmute"
      ],
      "mastery": {
        "abilities": [
          "Defiant Magic"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": 10,
        "spd": 0,
        "def": 5,
        "res": 10,
        "cha": 0
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 5,
        "dex": 2,
        "spd": 0,
        "def": 2,
        "res": 4,
        "cha": 0,
        "mov": 1
      },
      "hidden": false
    },
    {
      "name": "Trickster",
      "abilities": [
        "Locktouch",
        "Stealth",
        "Lucky Seven"
      ],
      "mastery": {
        "abilities": [
          "Duelist's Blow"
        ],
        "combatarts": [
          "Foul Play"
        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 25,
        "spd": 20,
        "def": 0,
        "res": 5,
        "cha": 0
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 6,
        "spd": 4,
        "def": 0,
        "res": 1,
        "cha": 0,
        "mov": 1
      }
    },
    {
      "name": "War Monk/War Cleric",
      "abilities": [
        "Fistfaire",
        "Unarmed Combat",
        "Heal"
      ],
      "mastery": {
        "abilities": [
          "Brawl Avoid +20"
        ],
        "combatarts": [
          "Pneuma Gale"
        ]
      },
      "growths": {
        "hp": 40,
        "str": 10,
        "mag": 5,
        "dex": 10,
        "spd": 0,
        "def": 0,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 3,
        "str": 2,
        "mag": 0,
        "dex": 1,
        "spd": 0,
        "def": 1,
        "res": 1,
        "cha": 0,
        "mov": 2
      },
      "hidden": true
    },
    {
      "name": "Dark Flier",
      "abilities": [
        "Canto",
        "Anima Tomefaire",
        "Transmute"
      ],
      "mastery": {
        "abilities": [
          "Transmute"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 20,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 10,
        "def": 0,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 3,
        "spd": 2,
        "def": 0,
        "res": 3,
        "cha": 0,
        "mov": 1
      },
      "mount": {
        "name": "Pegasus",
        "description:": "A winged horse with high reaction speed and movement",
        "modifiers": {
          "spd": 2,
          "mov": 2
        }
      }
    },
    {
      "name": "Valkyrie",
      "abilities": [
        "Canto",
        "Anima Magic Range +1",
        "Dark Magic Range +1"
      ],
      "mastery": {
        "abilities": [
          "Uncanny Blow"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 5,
        "str": 0,
        "mag": 5,
        "dex": 5,
        "spd": -5,
        "def": 5,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 4,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 1,
        "cha": 2,
        "mov": 0
      },
      "mount": {
        "name": "Horse",
        "description": "A decently resilient steed with good movement, but slow reactions",
        "modifiers": {
          "spd": -2,
          "res": 1,
          "mov": 2
        }
      }
    },
    {
      "name": "Death Knight",
      "abilities": [
        "Canto",
        "Lancefaire",
        "Counterattack"
      ],
      "growths": {
        "hp": 30,
        "str": 10,
        "mag": 10,
        "dex": 0,
        "spd": -5,
        "def": 0,
        "res": 5,
        "cha": 5
      },
      "modifiers": {
        "hp": 5,
        "str": 3,
        "mag": 0,
        "dex": 0,
        "spd": 3,
        "def": 2,
        "res": 3,
        "cha": 2,
        "mov": 1
      },
      "mount": {
        "name": "Horse",
        "description": "A decently sturdy steed with good movement but slow reactions",
        "modifiers": {
          "spd": -2,
          "def": 1,
          "mov": 2
        }
      }
    },
    {
      "name": "Summoner",
      "abilities": [
        "Dark Magic Uses x2",
        "Seal Magic",
        "Bestowal"
      ],
      "mastery": {
        "abilities": [
          "Invocation"
        ],
        "combatarts": [

        ]
      },
      "growths": {
        "hp": 10,
        "str": 0,
        "mag": 10,
        "dex": -5,
        "spd": 0,
        "def": 5,
        "res": 10,
        "cha": 10
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 1,
        "dex": 0,
        "spd": 0,
        "def": 2,
        "res": 3,
        "cha": 2,
        "mov": 0
      },
      "hidden": false
    },
    {
      "name": "Phantom",
      "abilities": [
        "Immaterial",
        "Pass"
      ],
      "growths": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      },
      "hidden": false
    },
    {
      "name": "Wild One",
      "abilities": [
        "Unarmed Combat",
        "Fistfaire",
        "Terrain Resistance",
        "Stealth"
      ],
      "growths": {
        "hp": 25,
        "str": 15,
        "mag": 0,
        "dex": 15,
        "spd": 20,
        "def": 0,
        "res": 0,
        "cha": 0
      },
      "modifiers": {
        "hp": 3,
        "str": 4,
        "mag": 0,
        "dex": 5,
        "spd": 5,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      },
      "hidden": true
    },
    {
      "name": "Chess Piece",
      "abilities": [
        "Chess Piece",
        "Mystical Bypass",
        "Pass"
      ],
      "growths": {
        "hp": 0,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0
      },
      "modifiers": {
        "hp": 1,
        "str": 0,
        "mag": 0,
        "dex": 0,
        "spd": 0,
        "def": 0,
        "res": 0,
        "cha": 0,
        "mov": 0
      },
      "hidden": false
    }
  ],
  "abilities": [
    {
      "name": "None",
      "description": "This is a template ability; it doesn't do anything.",
      "type": "None",
      "modifiers": {},
      "multipliers": {},
      "hidden": false
    },
    {
      "name": "Riposte",
      "description": "If you can roll a hit, you can nullify a second attack the enemy makes against a friendly unit.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Sword Prowess Lv 1",
      "description": "Grants Hit +5, Avo +7, and Crit Avo +5 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "hit": 5,
        "avo": 7,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Prowess Lv 2",
      "description": "Grants Hit +6, Avo +10, and Crit Avo +6 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "hit": 6,
        "avo": 10,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Prowess Lv 3",
      "description": "Grants Hit +7, Avo +13, and Crit Avo +7 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "hit": 7,
        "avo": 13,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Prowess Lv 4",
      "description": "Grants Hit +8, Avo +16, and Crit Avo +8 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "hit": 8,
        "avo": 16,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Prowess Lv 5",
      "description": "Grants Hit +10, Avo +20, and Crit Avo +10 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "hit": 10,
        "avo": 20,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axebreaker",
      "description": "Grants Hit/Avo +20 when using an sword against axe users.",
      "type": "Prompt",
      "weapon": "Sword",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Attack of Opportunity",
      "description": "If an enemy was within 1 space of you at the start of the enemy phase and that enemy moves out of that space, you may make an attack against that enemy.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Lance Prowess Lv 1",
      "description": "Grants Hit +6, Avo +6, and Crit Avo +5 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "hit": 6,
        "avo": 6,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Prowess Lv 2",
      "description": "Grants Hit +8, Avo +8, and Crit Avo +6 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "hit": 8,
        "avo": 8,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Prowess Lv 3",
      "description": "Grants Hit +10, Avo +10, and Crit Avo +7 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "hit": 10,
        "avo": 10,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Prowess Lv 4",
      "description": "Grants Hit +12, Avo +12, and Crit Avo +8 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "hit": 12,
        "avo": 12,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Prowess Lv 5",
      "description": "Grants Hit +15, Avo +15, and Crit Avo +10 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "hit": 15,
        "avo": 15,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Swordbreaker",
      "description": "Grants Hit/Avo +20 when using an lance against sword users.",
      "type": "Prompt",
      "weapon": "Lance",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sunder (Attack)",
      "description": "If you can roll a hit, you decrease an enemy’s ATK or DEF by 5.",
      "type": "Support",
      "modifiers": {
        "pmt": -5,
        "mmt": -5
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Sunder (Defense)",
      "description": "If you can roll a hit, you decrease an enemy’s ATK or DEF by 5.",
      "type": "Support",
      "modifiers": {
        "pdr": -5,
        "mdr": -5
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Axe Prowess Lv 1",
      "description": "Grants Hit +7, Avo +5, and Crit Avo +5 when using a axe.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "hit": 7,
        "avo": 5,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Prowess Lv 2",
      "description": "Grants Hit +10, Avo +6, and Crit Avo +6 when using a axe.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "hit": 10,
        "avo": 6,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Prowess Lv 3",
      "description": "Grants Hit +13, Avo +7, and Crit Avo +7 when using a axe.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "hit": 13,
        "avo": 7,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Prowess Lv 4",
      "description": "Grants Hit +16, Avo +8, and Crit Avo +8 when using a axe.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "hit": 16,
        "avo": 8,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Prowess Lv 5",
      "description": "Grants Hit +20, Avo +10, and Crit Avo +10 when using a axe.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "hit": 20,
        "avo": 10,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lancebreaker",
      "description": "Grants Hit/Avo +20 when using an axe against lance users.",
      "type": "Prompt",
      "weapon": "Axe",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Covering Fire",
      "description": "Halve ranged damage inflicted upon a friendly unit.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Bow Prowess Lv 1",
      "description": "Grants Hit +6, Avo +6, and Crit Avo +5 when using a bow.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "hit": 6,
        "avo": 6,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Prowess Lv 2",
      "description": "Grants Hit +8, Avo +8, and Crit Avo +6 when using a bow.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "hit": 8,
        "avo": 8,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Prowess Lv 3",
      "description": "Grants Hit +10, Avo +10, and Crit Avo +7 when using a bow.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "hit": 10,
        "avo": 10,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Prowess Lv 4",
      "description": "Grants Hit +12, Avo +12, and Crit Avo +8 when using a bow.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "hit": 12,
        "avo": 12,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Prowess Lv 5",
      "description": "Grants Hit +15, Avo +15, and Crit Avo +10 when using a bow.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "hit": 15,
        "avo": 15,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Close Counter",
      "description": "Allows unit to counterattack adjacent foes.",
      "type": "Passive",
      "modifiers": {
        "minrng": -1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Ice Block",
      "description": "Create a block of impassable terrain.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Reason Lv 1",
      "description": "Grants Hit +7, Avo +5, and Crit Avo +5 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "hit": 7,
        "avo": 5,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Reason Lv 2",
      "description": "Grants Hit +10, Avo +6, and Crit Avo +6 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "hit": 10,
        "avo": 6,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Reason Lv 3",
      "description": "Grants Hit +13, Avo +7, and Crit Avo +7 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "hit": 13,
        "avo": 7,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Reason Lv 4",
      "description": "Grants Hit +16, Avo +8, and Crit Avo +8 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "hit": 16,
        "avo": 8,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Reason Lv 5",
      "description": "Grants Hit +20, Avo +10, and Crit Avo +10 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "hit": 20,
        "avo": 10,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bless",
      "description": "Allow an ally to reroll an attack.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Faith Lv 1",
      "description": "Grants Hit +5, Avo +7, and Crit Avo +5 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "hit": 5,
        "avo": 7,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Faith Lv 2",
      "description": "Grants Hit +6, Avo +10, and Crit Avo +6 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "hit": 6,
        "avo": 10,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Faith Lv 3",
      "description": "Grants Hit +7, Avo +13, and Crit Avo +7 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "hit": 7,
        "avo": 13,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Faith Lv 4",
      "description": "Grants Hit +8, Avo +16, and Crit Avo +8 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "hit": 8,
        "avo": 16,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Faith Lv 5",
      "description": "Grants Hit +10, Avo +20, and Crit Avo +10 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "hit": 10,
        "avo": 20,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Curse",
      "description": "Force an enemy to reroll an attack.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Guile Lv 1",
      "description": "Grants Hit +7, Avo +5, and Crit Avo +5 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "hit": 7,
        "avo": 5,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Guile Lv 2",
      "description": "Grants Hit +10, Avo +6, and Crit Avo +6 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "hit": 10,
        "avo": 6,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Guile Lv 3",
      "description": "Grants Hit +13, Avo +7, and Crit Avo +7 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "hit": 13,
        "avo": 7,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Guile Lv 4",
      "description": "Grants Hit +16, Avo +8, and Crit Avo +8 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "hit": 16,
        "avo": 8,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Guile Lv 5",
      "description": "Grants Hit +20, Avo +10, and Crit Avo +10 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "hit": 20,
        "avo": 10,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defend",
      "description": "Halve melee damage inflicted upon a friendly unit.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Armored Combatant",
      "description": "Gain an additional +15 Avo and +15 Hit against Heavy Armor units.",
      "type": "Support",
      "modifiers": {
        "hit": 15,
        "avo": 15
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Pack Mule",
      "description": "Unit can now equip 2 accessory items or doubles carrying slots, idk, tbd.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Give a Lift",
      "description": "Give an ally +1 movement for their turn.",
      "type": "Support",
      "modifiers": {
        "mov": 1
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Mounted Combatant",
      "description": "Gain an additional +15 Avo and +15 Hit against Mounted units.",
      "type": "Support",
      "modifiers": {
        "hit": 15,
        "avo": 15
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Wing Buffet",
      "description": "Move any unit one space in any direction.",
      "type": "Support",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Swordfaire",
      "description": "Grants Might +5 when using a sword.",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "pmt": 5,
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lancefaire",
      "description": "Grants Might +5 when using a lance.",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "pmt": 5,
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axefaire",
      "description": "Grants Might +5 when a axe is equipped.",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "pmt": 5,
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bowfaire",
      "description": "Grants Might +5 when using a bow or using a ballista.",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "pmt": 5,
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Fistfaire",
      "description": "Grants Might +5 when using a Gauntlet or when the Unarmed Combat Skill is active or using an onagler.",
      "type": "Passive",
      "weapon": "Fist",
      "modifiers": {
        "pmt": 5
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Anima Tomefaire",
      "description": "Grants Might +5 when using anima magic.",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Light Tomefaire",
      "description": "Grants Might +5 when using light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dark Tomefaire",
      "description": "Grants Might +5 when using dark magic.",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Critical +10",
      "description": "Grants Critical +10 when using a sword",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Critical +10",
      "description": "Grants Critical +10 when using a lance",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Critical +10",
      "description": "Grants Critical +10 when using a axe",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Critical +10",
      "description": "Grants Critical +10 when using a bow",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Brawl Critical +10",
      "description": "Grants Critical +10 when using a gauntlet or the Unarmed Combat skill is active",
      "type": "Passive",
      "weapon": "Fist",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Anima Magic Critical +10",
      "description": "Grants Critical +10 when using anima magic",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Light Magic Critical +10",
      "description": "Grants Critical +10 when using light magic",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dark Magic Critical +10",
      "description": "Grants Critical +10 when using dark magic",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Sword Avoid +20",
      "description": "Grants Avoid +20 when using a sword",
      "type": "Passive",
      "weapon": "Sword",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lance Avoid +20",
      "description": "Grants Avoid +20 when using a lance",
      "type": "Passive",
      "weapon": "Lance",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Axe Avoid +20",
      "description": "Grants Avoid +20 when using a axe",
      "type": "Passive",
      "weapon": "Axe",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bow Avoid +20",
      "description": "Grants Avoid +20 when using a bow",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Brawl Avoid +20",
      "description": "Grants Avoid +20 when using a gauntlet or the Unarmed Combat skill is active",
      "type": "Passive",
      "weapon": "Fist",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Anima Magic Avoid +20",
      "description": "Grants Avoid +20 when using anima magic",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Light Magic Avoid +20",
      "description": "Grants Avoid +20 when using light magic",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dark Magic Avoid +20",
      "description": "Grants Avoid +20 when using dark magic",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "HP +5",
      "description": "Increases maximum HP by 5",
      "type": "Passive",
      "modifiers": {
        "hp": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Strength +2",
      "description": "Increases Str by 2",
      "type": "Passive",
      "modifiers": {
        "str": 2
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Magic +2",
      "description": "Increases Mag by 2.",
      "type": "Passive",
      "modifiers": {
        "mag": 2
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dexterity +4",
      "description": "Increases Dexterity by 4",
      "type": "Passive",
      "modifiers": {
        "dex": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Speed +2",
      "description": "Increases Spd by 2.",
      "type": "Passive",
      "modifiers": {
        "spd": 2
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Pomp & Circumstance",
      "description": "Grants Dex/Cha +4.",
      "type": "Passive",
      "modifiers": {
        "dex": 4,
        "cha": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defense +2",
      "description": "Increases Def by 2.",
      "type": "Passive",
      "modifiers": {
        "def": 2
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Resistance +2",
      "description": "Increases Res by 2.",
      "type": "Passive",
      "modifiers": {
        "res": 2
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Movement +1",
      "description": "Increases Movement by 1",
      "type": "Passive",
      "modifiers": {
        "mov": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Hit +20",
      "description": "Increases Hit by 20.",
      "type": "Passive",
      "modifiers": {
        "hit": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Avoid +10",
      "description": "Raises Avoidance by 10.",
      "type": "Passive",
      "modifiers": {
        "avo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Critical +20",
      "description": "Grants its user a 20% bonus to their Critical rate.",
      "type": "Passive",
      "modifiers": {
        "crit": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Strength",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Strength +8.",
      "type": "Prompt",
      "modifiers": {
        "str": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Magic",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Magic +8.",
      "type": "Prompt",
      "modifiers": {
        "avo": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Speed",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Speed +8.",
      "type": "Prompt",
      "modifiers": {
        "spd": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Resistance",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Resistance +8.",
      "type": "Prompt",
      "modifiers": {
        "res": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Defense",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Defense +8.",
      "type": "Prompt",
      "modifiers": {
        "def": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Avoid",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Avoid +30.",
      "type": "Prompt",
      "modifiers": {
        "avo": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Critical",
      "description": "At start of turn, if unit's HP ≤ 25%, Grants Critical +50.",
      "type": "Prompt",
      "modifiers": {
        "crit": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Death Blow",
      "description": "If unit initiates combat, grants Str +6 during combat.",
      "type": "Prompt",
      "modifiers": {
        "str": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Fiendish Blow",
      "description": "If unit initiates combat, grants Magic +6 during combat.",
      "type": "Prompt",
      "modifiers": {
        "mag": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Darting Blow",
      "description": "If unit initiates combat, grants AS +6 during combat.",
      "type": "Prompt",
      "modifiers": {
        "spd": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Armored Blow",
      "description": "If unit initiates combat, grants Def +6 during combat.",
      "type": "Prompt",
      "modifiers": {
        "def": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Warding Blow",
      "description": "When user triggers the battle, grants Resistance +20",
      "type": "Prompt",
      "modifiers": {
        "res": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Charm",
      "description": "Allies within 1 space inflict +3 damage in combat.",
      "type": "Battlefield",
      "modifiers": {
        "pmt": 3,
        "mmt": 3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Seal Strength",
      "description": "If unit damages foe during combat, foe suffers Str -6 for 1 turn after combat.",
      "type": "Battlefield",
      "modifiers": {
        "str": -6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Seal Defense",
      "description": "If unit damages foe during combat, foe suffers Def -6 for 1 turn after combat.",
      "type": "Battlefield",
      "modifiers": {
        "def": -6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Seal Resistance",
      "description": "If unit damages foe during combat, foe suffers Res -6 for 1 turn after combat.",
      "type": "Battlefield",
      "modifiers": {
        "res": -6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Seal Magic",
      "description": "If unit damages foe during combat, foe suffers Mag -6 for 1 turn after combat.",
      "type": "Battlefield",
      "modifiers": {
        "mag": -6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Seal Movement",
      "description": "If unit damages foe during combat, foe suffers Mov -1 for 1 turn after combat.",
      "type": "Battlefield",
      "modifiers": {
        "mov": -1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Heartseeker",
      "description": "If foes is within a 1-space radius, grants foes Avoid -20",
      "type": "Battlefield",
      "modifiers": {
        "avo": -20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Tomebreaker",
      "description": "Grants Hit/Avo +20 against magic users.",
      "type": "Prompt",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bowbreaker",
      "description": "Grants Hit/Avo +20 against bow users.",
      "type": "Prompt",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Fistbreaker",
      "description": "Grants Hit/Avo +20 against brawlers.",
      "type": "Prompt",
      "modifiers": {
        "hit": 20,
        "avo": 20
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Fire",
      "description": "Grants access to Fire. If unit has already learned Fire, mulitplies its uses per battle by 2x.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "Fire": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Miasma",
      "description": "Grants access to Miasma. If unit has already learned Miasma, mulitplies its uses per battle by 2x.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "Miasma": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Heal",
      "description": "Grants access to Heal. If unit has already learned Heal, multiplies its uses per battle by 2×.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "Heal": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Renewal",
      "description": "Unit recovers up to 20% of max HP at the start of each turn.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Poison Strike",
      "description": "If unit initiates combat and lands a hit, targeted foe loses up to 20% of max HP after combat.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lifetaker",
      "description": "Unit recovers HP equal to 50% of damage dealt after defeating a foe.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lethality",
      "description": "Chance to instantly kill a foe when dealing damage.",
      "type": "dex/4",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Poison",
      "description": "Chance to inflict poison on a foe when dealing damage.",
      "type": "dex",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Pavise",
      "description": "Chance to reduce sword/lance/axe/brawling damage by half.",
      "type": "player.dex",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Aegis",
      "description": "Chance to reduce bow/magic damage by half.",
      "type": "player.dex",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Miracle",
      "description": "Chance to survive lethal damage with 1 HP, if HP is > 1.",
      "type": "player.dex",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Terrain Resistance",
      "description": "Nullifies damage from terrain.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Special Dance",
      "description": "When using the Dance ability, grant Dex/Spd to target ally.",
      "type": "Battlefield",
      "modifiers": {
        "dex": 4,
        "spd": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Vantage",
      "description": "If foe initiates combat, and if HP is ≤ 50%, unit still attacks first",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Desperation",
      "description": "If unit initiates combat with HP ≤ 50%, unit’s follow-up attack (if possible) occurs before foe’s counterattack.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Quick Riposte",
      "description": "If Unit's HP ≥ 50%, if attacked by a foe, treats unit's Attack Speed as 4 higher than the foe's, granting the unit a follow up attack and denying the enemy's.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Wrath",
      "description": "If foe initiates combat while unit’s HP is ≤ 50%, grants Crit +50.",
      "type": "Prompt",
      "modifiers": {
        "crit": 50
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dance",
      "description": "Use Dance to allow an ally to move again.",
      "type": "Command",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Steal",
      "description": "Allows unit to steal a non-weapon item form a foe with a lower Spd stat.",
      "type": "Command",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Locktouch",
      "description": "Allows the user to open normal doors and chests without keys",
      "type": "Command",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Stealth",
      "description": "Enemies can't target the user if an ally not possessing stealth is in range.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Canto",
      "description": "After performing an action, user can user their leftover movement.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Pass",
      "description": "Move through enemy spaces.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bowrange +1",
      "description": "Maximum Bow range +1",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "maxrng": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Bowrange +2",
      "description": "Maximum Bow range +2",
      "type": "Passive",
      "weapon": "Bow",
      "modifiers": {
        "maxrng": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Anima Magic Range +1",
      "description": "Maximum anima magic range +1",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": {
        "maxrng": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dark Magic Range +1",
      "description": "Maximum dark magic range +1",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": {
        "maxrng": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Light Magic Range +1",
      "description": "Maximum light magic range +1",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "maxrng": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Unarmed Combat",
      "description": "User is able to fight barehandedly.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Anima Magic Uses x2",
      "description": "Multiplies the number of uses for anima magic by 2",
      "type": "Passive",
      "weapon": "Anima Magic",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "anima": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Dark Magic Uses x2",
      "description": "Multiplies the number of uses for dark magic by 2",
      "type": "Passive",
      "weapon": "Dark Magic",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "dark": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Light Magic Uses x2",
      "description": "Multiplies the number of uses for light magic by 2",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "light": 2
        }
      },
      "hidden": false
    },
    {
      "name": "Light Magic Heal +5",
      "description": "Adds 5 additional HP when healing with light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "mmt": 5
      },
      "multipliers": null,
      "tags": {
        "healing": true
      },
      "hidden": false
    },
    {
      "name": "Light Magic Heal +10",
      "description": "Adds 10 additional HP when healing with light magic.",
      "type": "Passive",
      "weapon": "Light Magic",
      "modifiers": {
        "mmt": 10
      },
      "tags": {
        "healing": true
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Unsealable Magic",
      "description": "Prevents unit from being silenced.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Immune Status",
      "description": "Nullifies status effects and debuffs.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "General",
      "description": "Nullifies instant death effects.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Commander",
      "description": "Nullifies instant death effects, status effects, and movement effects.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Infinite Magic",
      "description": "Removes the limitation on the number of times magic can be used.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Magic Bind",
      "description": "If the unit lands a hit, targeted foe is unable to use magic for 1 turn.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Infantry Effect Null",
      "description": "Nullifies any extra effectiveness against infantry units.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Armored Effect Null",
      "description": "Nullifies any extra effectiveness against armored units.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Cavalry Effect Null",
      "description": "Nullifies any extra effectiveness against cavalry units.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Flying Effect Null",
      "description": "Nullifies any extra effectiveness against flying units.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Dragon Effect Null",
      "description": "Nullifies any extra effectiveness against dragons.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Monster Effect Null",
      "description": "Nullifies any extra effectiveness against monsters.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Effect Null",
      "description": "Cancels all types of effectiveness.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Vital Defense",
      "description": "Makes critical hits against this unit impossible.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Giant Wings",
      "description": "Grants Avoid +30 against sword, lance, and axe users.",
      "type": "Passive",
      "modifiers": {
        "avo": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Anti-magic Armor",
      "description": "Nullifies damage from magical attacks.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Noncombatant",
      "description": "Unit cannot be targetted by foes.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Cursed Power",
      "description": "Unit recovers HP on swamp terrain.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Anchor",
      "description": "Prevents unit from being moved.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Counterattack",
      "description": "Allows unit to counterattack regardless of distance to attacker.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Anima Magic Uses x4",
      "description": "Multiplies the number of uses for anima magic by 4",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "anima": 4
        }
      },
      "hidden": false
    },
    {
      "name": "Dark Magic Uses x4",
      "description": "Multiplies the number of uses for dark magic by 4",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "dark": 4
        }
      },
      "hidden": false
    },
    {
      "name": "Light Magic Uses x4",
      "description": "Multiplies the number of uses for light magic by 4",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "light": 4
        }
      },
      "hidden": false
    },
    {
      "name": "Alert Stance",
      "description": "If unit takes no action except Wait, grants Avo +15 for 1 turn.",
      "type": "Prompt",
      "modifiers": {
        "avo": 15
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Alert Stance+",
      "description": "If unit takes no action except Wait, grants Avo +30 for 1 turn.",
      "type": "Prompt",
      "modifiers": {
        "avo": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Agarthan Technology",
      "description": "Adjacent foes deal 3 less damage during combat.",
      "type": "Prompt",
      "modifiers": {
        "pdr": 3,
        "mdr": 3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Lucky Seven",
      "description": "Each turn, grants +5 to one of the following stats: Str, Mag, Spd, Def, Res, Hit, or Avo.",
      "type": "Passive",
      "modifiers": {
        "str": 5,
        "mag": 5,
        "spd": 5,
        "def": 5,
        "res": 5,
        "hit": 5,
        "avo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Transmute",
      "description": "If unit is hit with a magic attack during enemy phase, grants +3 to all stats until next player phase ends.",
      "type": "Prompt",
      "modifiers": {
        "str": 3,
        "mag": 3,
        "spd": 3,
        "def": 3,
        "dex": 3,
        "res": 3,
        "cha": 3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Duelist's Blow",
      "description": "Grants Avoid +20 when user triggers battle.",
      "type": "Prompt",
      "modifiers": {
        "avo": 20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Uncanny Blow",
      "description": "If unit initiates combat, grants Hit Rate +30 during combat.",
      "type": "Prompt",
      "modifiers": {
        "hit": 30
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Combat Medic",
      "description": "Unit's knowledge of anatomy grants Crit +10 in combat.",
      "type": "Passive",
      "modifiers": {
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Try Your Best",
      "description": "Allies within 1 space are granted Str +3 and Def +3 during combat.",
      "type": "Battlefield",
      "modifiers": {
        "str": 3,
        "def": 3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Hesitant Prodigy",
      "description": "Use can choose to increase the might of an attack by 4 at the cost of 4 HP",
      "type": "Prompt",
      "modifiers": {
        "pmt": 4,
        "mmt": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Hesitant Prodigy (Debuff)",
      "description": "If the user is within 1 space of an ally, attacks deal 4 less damage, but 4 more damage otherwise",
      "type": "Passive",
      "modifiers": {
        "pmt": -4,
        "mmt": -4
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Hesitant Prodigy (Buff)",
      "description": "If the user is within 1 space of an ally, attacks deal 4 less damage, but 4 more damage otherwise",
      "type": "Passive",
      "modifiers": {
        "pmt": 4,
        "mmt": 4
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Brittle Bones",
      "description": "Inflicts Def -2 and Res -2 when attacked, but grants +4 Spd,",
      "type": "Prompt",
      "modifiers": {
        "def": -4,
        "res": -4,
        "spd": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Painless",
      "description": "When a non-adjacent enemy initiates combat, -4 damage taken.",
      "type": "Prompt",
      "modifiers": {
        "mdr": 4,
        "pdr": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Painless Conduit",
      "description": "Immune to status effects from enemy mana-wells, and takes half damage from mana-wells. While HP is below 50% and an enemy initiates combat with him, Nico takes -2 damage and gains 15 avoid.",
      "type": "Prompt",
      "modifiers": {
        "pdr": 2,
        "mdr": 2,
        "avo": 15
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Primed for Danger",
      "description": "While Clara is at 80% HP or above, she attacks first in combat.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Self Restraint",
      "description": "If this unit does not attack on player phase, on this unit's first combat of enemy phase, grants +4 damage dealt and -4 damage taken and any abilities that would activate \"if unit initiates combat\" activate.",
      "type": "Prompt",
      "modifiers": {
        "pmt": 4,
        "mmt": 4,
        "pdr": 4,
        "mdr": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Indirect Aggression",
      "description": "When this unit when heals an ally, that unit gains Str +4 and Mag +4 for one turn.",
      "type": "Prompt",
      "modifiers": {
        "str": 4,
        "mag": 4
      },
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Blessed Fortitude",
      "description": "Healing effects on this unit are increased by +5",
      "type": "Passive",
      "modifiers": {
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Defiant Protection",
      "description": "When user’s HP is <25%, use your highest stat between DEF and RES to reduce damage from all attacks, regardless of if physical or magical damage",
      "type": "Prompt",
      "modifiers": {
        "mdr": "if def > res then 0 else res - def",
        "pdr": "if res > def then 0 else def - res"
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Weight -3",
      "description": "The threshold to double this character is increased by 3.",
      "type": "Passive",
      "modifiers": {
        "weight": -3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Weight -5",
      "description": "The threshold to double this character is increased by 5.",
      "type": "Passive",
      "modifiers": {
        "weight": -5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Umbral Leech",
      "description": "Unit absorbs HP from phantoms.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Manifest Phantom",
      "description": "Unit births phantoms",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Summon",
      "description": "Grants access to Summon. If unit has already learned Summon, mulitplies its uses per battle by 2x.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "uses": {
          "Summon": 2
        }
      },
      "hidden": true
    },
    {
      "name": "Bestowal",
      "description": "User's equipped abilities and combat arts, excluding personal and class abilities, are also equipped by any lesser phantom the user summons.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Invocation",
      "description": "Instead of moving normally, the user may choose to use their remaining movement to warp to a space adjacent to a phantom they have summoned. The user cannot warp to a space they would not normally be able to occupy.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Hide Piercer",
      "description": "Monster shields do not mitigate the unit’s damage.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Monster Wrangler",
      "description": "This unit gets +15% AVO against Monster attacks.",
      "type": "Prompt",
      "modifiers": {
        "avo": 15
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Monster Slayer",
      "description": "Monster shields do not mitigate the unit’s damage and this unit gets +15% AVO against Monster attacks.",
      "type": "Prompt",
      "modifiers": {
        "avo": 15
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Formation",
      "description": "Adjacent allied units take 3 less damage in combat.",
      "type": "Battlefield",
      "modifiers": {
        "pdr": 3,
        "mdr": 3
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Plot Armor",
      "description": "This unit is immune to critical hits but for a roll of 1.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Master Thief",
      "description": "Grants +1 skill proficiency or +1 skill expertise.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Immaterial",
      "description": "User's movement type is flight, but user does not take effective damage from being a flyer.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Infernal Chorus",
      "description": "Enables user to summon and control more than one phantom at once, however only one can still benefit from Bestowal.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Hero Complex",
      "description": "Increases Might of combat arts by +5 when targeted foe is in range to attack an ally.",
      "type": "Prompt",
      "modifiers": {
        "pmt": 5,
        "mmt": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Animal Affinity",
      "description": "Damage taken from mounted foes is reduced by 10 but so is damage done to mounted foes.",
      "type": "Passive",
      "modifiers": {
        "pmt": -10,
        "mmt": -10,
        "pdr": 10,
        "mdr": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Near Miss",
      "description": "If attacking foes's attack roll is within 10 of its to hit, damage is reduced by 10 and the attack is not a critical hit.",
      "type": "Passive",
      "modifiers": {
        "pdr": 10,
        "mdr": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Opportunist",
      "description": "Damage increases by 4 if this unit initiates combat and the foe cannot counterattack.",
      "type": "Prompt",
      "modifiers": {
        "pmt": 4,
        "mmt": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Eclipse",
      "description": "At the start of every other turn, Unit and adjacent allies heal 10% of their Max HP. While Unit's HP => 50%, Unit and foe cannot make follow-up attacks during combat.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Blacksmith's Experience",
      "description": "Simdell doesn’t lose durability points on a combat art attack that misses, and his special weapons are granted +5 durability, +4 DEF when using a combat art",
      "type": "Prompt",
      "modifiers": {
        "def": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Reckless Charger",
      "description": "If Willifort moves at least 4 spaces on his turn, he may attack as if he had Darting Blow (+6 SPD). In addition, he gets +1 MOVE, but the additional space must be used to make an attack. Willifort cannot use Reckless Charger on the same target more than once in succession.",
      "type": "Passive",
      "modifiers": {
        "spd": 6,
        "mov": 1
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Agarthan Tactics",
      "description": "When this unit is attacked or attacks a unit with a different weapon type, foes deal 2 less damage and this unit deals 2 more damage and critical +10.",
      "type": "Passive",
      "modifiers": {
        "pmt": 2,
        "mmt": 2,
        "pdr": 2,
        "mdr": 2,
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Spell Sink",
      "description": "This unit gains +5 resistance against spells, and spells cast on this unit have their uses reduced by twice the normal amount.",
      "type": "Prompt",
      "modifiers": {
        "res": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Undying Bloodlust",
      "description": "Triples maximum HP and grants immunity to critical hits, but unit treats all others as foes.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "hp": 3
      },
      "hidden": false
    },
    {
      "name": "Chess Piece",
      "description": "This unit moves as though it were a chess piece. It is not removed from the board when defeated and may move after it is defeated, creating an obstruction until captured.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": true
    },
    {
      "name": "Mystical Bypass",
      "description": "This unit ignores magically created obstructions.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": {
        "def": 2,
        "res": 2
      },
      "hidden": true
    },
    {
      "name": "Other Prowess Lv 1",
      "description": "Grants Hit +6, Avo +6, and Crit Avo +5 when using a nonstandard weapon type.",
      "type": "Passive",
      "modifiers": {
        "hit": 6,
        "avo": 6,
        "cravo": 5
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Other Prowess Lv 2",
      "description": "Grants Hit +8, Avo +8, and Crit Avo +6 when using a nonstandard weapon type.",
      "type": "Passive",
      "modifiers": {
        "hit": 8,
        "avo": 8,
        "cravo": 6
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Other Prowess Lv 3",
      "description": "Grants Hit +10, Avo +10, and Crit Avo +7 when using a nonstandard weapon type.",
      "type": "Passive",
      "modifiers": {
        "hit": 10,
        "avo": 10,
        "cravo": 7
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Other Prowess Lv 4",
      "description": "Grants Hit +12, Avo +12, and Crit Avo +8 when using a nonstandard weapon type.",
      "type": "Passive",
      "modifiers": {
        "hit": 12,
        "avo": 12,
        "cravo": 8
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Other Prowess Lv 5",
      "description": "Grants Hit +15, Avo +15, and Crit Avo +10 when using a nonstandard weapon type.",
      "type": "Passive",
      "modifiers": {
        "hit": 15,
        "avo": 15,
        "cravo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Spectral Armor",
      "description": "Unit can only be dmaged after it has been hit by both a physical and magical based attack. A critical hit nullifies this effect and deals damage as normal.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Cold Tempered",
      "description": "Unit gains +4 to offensive and defensive when within three spaces of an ice wall.",
      "type": "Prompt",
      "modifiers": {
        "str": 4,
        "mag": 4,
        "def": 4,
        "res": 4,
        "avo": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Fear of Fire",
      "description": "Unit is penalized -4 to defensive stats and speed for one turn when hit with a fire attack.",
      "type": "Prompt",
      "modifiers": {
        "def": -4,
        "res": -4,
        "spd": -4,
        "avo": -20
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Freak of Nature",
      "description": "Unit gains +4 to Defense and Resistance when within three spaces of monster, and monsters within three spaces of this unit gain monster resistance.",
      "type": "Prompt",
      "modifiers": {
        "def": 4,
        "res": 4
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Ambush Predator",
      "description": "If unit takes the wait action, gains +15 Avoid and +10 Crit during enemy phase.",
      "type": "Prompt",
      "modifiers": {
        "avo": 15,
        "crit": 10
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Wilder",
      "description": "Unit ignores movement penalty from difficult terrain.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Cheer/Enforce",
      "description": "Mounted, the unit can enforce allies with the vigor to finish the fight. Allies within 2 spaces gain +15 Hit/Crit Avo for 1 turn. Unmounted, the unit can cheer on one of their allies to continue fighting. The Unit can use Cheer to grant an adjacent ally another action, using their action. The Unit can use Cheer/Enforce 1 time for every 3 points of Cha this Unit has.",
      "type": "Battlefield",
      "modifiers": {
        "hit": 15,
        "cravo": 15,
        "uses": "floor(cha / 3)"
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Inspiration",
      "description": "For every 4 points of Cha this Unit has, Allies within 2 spaces take -1 less damage and deal +1 more damage.",
      "type": "Battlefield",
      "modifiers": {
        "pdr": "floor(cha / 4)",
        "mdr": "floor(cha / 4)",
        "pmt": "floor(cha / 4)",
        "mmt": "floor(cha / 4)"
      },
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Light Shield Mastery",
      "description": "Unit ignores the negative effects of equpping shields with Prot <= 2.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Resourceful",
      "description": "Unit gains one additional use from consumable items.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Obstruct",
      "description": "While a foe is with in two spaces of this unit either vertically or horizontally, they can only move along that axis. If a foe is within two units' perpendicular obstruct areas they may choose to move along either axis. Units with the Pass ability ignore these restrictions.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    },
    {
      "name": "Wander",
      "description": "Grants use of the Wander combat art.",
      "type": "Passive",
      "modifiers": null,
      "multipliers": null,
      "hidden": false
    }
  ],
  "weapons": [
    {
      "name": "Unarmed",
      "type": "Generic",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Spider Bite",
      "type": "Other",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Spider Ice",
      "type": "Other",
      "description": "Inflicts -1 to Mov and -3 to Spd to foe for 1 turn. Deals magic-based damage. Cannot follow-up.",
      "rank": "E",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Sword",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 100,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Sword+",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 100,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Sword",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Sword+",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 100,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Venin Edge",
      "type": "Sword",
      "description": "Inflicts poison on hit.",
      "rank": "E",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Sword",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Sword+",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Sword",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Sword+",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Sword",
      "type": "Sword",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Sword+",
      "type": "Sword",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Sword",
      "type": "Sword",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Sword+",
      "type": "Sword",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 16,
        "mmt": 0,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killing Edge",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 25,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killing Edge+",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 35,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Levin Sword",
      "type": "Sword",
      "description": "Deals magic-based damage.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Levin Sword+",
      "type": "Sword",
      "description": "Deals magic-based damage.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Armorslayer",
      "type": "Sword",
      "description": "Effective against Armoured foes.",
      "rank": "D",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Armorslayer+",
      "type": "Sword",
      "description": "Effective against Armoured foes.",
      "rank": "D",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Dagger",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Hunting Knife",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Kukri",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Cursed Ashiya Sword",
      "type": "Sword",
      "description": "Deals 5 damage to user after combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 40,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Lance+",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Lance+",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Lance+",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Lance+",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 14,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Lance",
      "type": "Lance",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Lance+",
      "type": "Lance",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Lance",
      "type": "Lance",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 16,
        "mmt": 0,
        "hit": 62,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Lance+",
      "type": "Lance",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 19,
        "mmt": 0,
        "hit": 62,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 25,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Lance+",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 35,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Javelin",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 2,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Short Spear",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Spear",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Saintslayer",
      "type": "Lance",
      "description": "The form given to a hateful curse against the Church of Seiros. Effective against those who bear a Crest of Chichol, Cethleann, Indech, Macuil, Aubin, Timotheos, Chevalier, Noa, Seiros, or Flames. Restores HP equal to 50% of damage dealt to a foe bearing one of these crests.",
      "rank": "A",
      "modifiers": {
        "pmt": 16,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Axe+",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Axe+",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Axe+",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 16,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Axe+",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 17,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Axe",
      "type": "Axe",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Axe+",
      "type": "Axe",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Axe",
      "type": "Axe",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 18,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Devil Axe+",
      "type": "Axe",
      "description": "Inflicts 10 damage to the wielder after combat.",
      "rank": "D",
      "modifiers": {
        "pmt": 21,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 25,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Axe+",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 35,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Bolt Axe",
      "type": "Axe",
      "description": "Deals magic-based damage.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 14,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Hand Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Short Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Tomahawk",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Hammer",
      "type": "Axe",
      "description": "Effective against armor units.",
      "rank": "D",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Bow",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Training Bow+",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Bow",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Iron Bow+",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "E",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 85,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Bow",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Steel Bow+",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Bow",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Silver Bow+",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Bow",
      "type": "Bow",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Brave Bow+",
      "type": "Bow",
      "description": "2 consecutive hits when initiating combat.",
      "rank": "B",
      "modifiers": {
        "pmt": 11,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Bow",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 25,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Killer Bow+",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 35,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Magic Bow",
      "type": "Bow",
      "description": "Deals magic-based damage.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Magic Bow+",
      "type": "Bow",
      "description": "Deals magic-based damage.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 3,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Miasma",
      "type": "Dark Magic",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 5,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Phase",
      "type": "Dark Magic",
      "description": "Enchant a friendly unit to gain the “Pass” feature for one turn, allowing them to move through enemy occupied spaces. Also grants +10 Avoid to the target for one turn.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Hex",
      "type": "Dark Magic",
      "description": "Curse an enemy unit within range of 5. Until the start of your next turn, the cursed unit must make attack rolls twice, taking the highest Hit result of the two.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Mire",
      "type": "Dark Magic",
      "description": "Inflicts Def -5 to foe for 1 turn.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 3,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 8
      },
      "hidden": false
    },
    {
      "name": "Swarm",
      "type": "Dark Magic",
      "description": "Inflicts Spd -5 to foe for 1 turn.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 4,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 8
      },
      "hidden": false
    },
    {
      "name": "Banshee",
      "type": "Dark Magic",
      "description": "Inflicts reduced Mov to foe for 1 turn.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 9,
        "hit": 75,
        "avo": 0,
        "crit": 7,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Death",
      "type": "Dark Magic",
      "description": "No special effect.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 6,
        "hit": 70,
        "avo": 0,
        "crit": 20,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 4
      },
      "hidden": false
    },
    {
      "name": "Confusion",
      "type": "Dark Magic",
      "description": "Befuddle an enemy unit within range of 5. The unit must use all of its available movement to move in a randomly determined direction. Roll a 1d4. 1: up, 2: right, 3: down, 4: left.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "uses": -1
      },
      "hidden": false
    },
    {
      "name": "Ethereal Weapon",
      "type": "Dark Magic",
      "description": "Summons an Ethereal weapon for the duration of the battle or until the caster dies. If the wielder of the weapon dies, weapon returns to caster's inventory.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 1
      },
      "hidden": true
    },
    {
      "name": "Enshroud",
      "type": "Dark Magic",
      "description": "Grants Def +7 to the user; effect diminishes with each turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 2
      },
      "hidden": true
    },
    {
      "name": "Luna",
      "type": "Dark Magic",
      "description": "Ignores enemy’s Resistance; cannot trigger follow-up attacks.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 1,
        "hit": 65,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Dark Spikes",
      "type": "Dark Magic",
      "description": "Effective against Cavalry foes.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 13,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Invisibility",
      "type": "Dark Magic",
      "description": "Become untargetable until the start of your next turn. Still subject to area of effect attacks.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 0,
        "maxrng": 0,
        "cost": 0,
        "uses": -1
      },
      "hidden": false
    },

    {
      "name": "Summon",
      "type": "Dark Magic",
      "description": "Summon a minor phantom at a level equivalent to the caster. See the Roll20 handout for detailed summoning rules.",
      "rank": "B-A",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Hades",
      "type": "Dark Magic",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 18,
        "hit": 65,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Vesper",
      "type": "Dark Magic",
      "description": "Inflicts Res -5 to foe for 1 turn.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 13,
        "hit": 75,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Paradox",
      "type": "Dark Magic",
      "description": "Inflicts -3 to Dex and Spd to foe for 1 turn. Cannot follow-up.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 14,
        "hit": 80,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Severance",
      "type": "Dark Magic",
      "description": "On hit, reduces unit's max by one half, cannot follow up or crit. Can be cured using Restore. Spell can only be earned by players through RP.",
      "rank": "S",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Bohr",
      "type": "Dark Magic",
      "description": "Reduces foe’s HP to 1; cannot trigger follow-up attacks. Enemies only.",
      "rank": "S",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 60,
        "avo": 0,
        "crit": 0,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Quake",
      "type": "Dark Magic",
      "description": "Damages all units except Flying; cannot trigger follow-up attacks. Enemies only.",
      "rank": "S",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 50,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 99,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Eurydice",
      "type": "Dark Magic",
      "description": "Summon a major phantom from the dead. Enemies only. See the Roll20 handout for detailed summoning rules.",
      "rank": "S",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 1
      },
      "hidden": true
    },
    {
      "name": "Wind",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 2,
        "hit": 100,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Fire",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 3,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Blizzard",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 3,
        "hit": 70,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Thunder",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 3,
        "hit": 80,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Ice Wall",
      "type": "Anima Magic",
      "description": "Create adjacent blocks of ice that prevent movement. Creates one block per 5pts of magic. Cannot be cast on occupied tiles. Blocks may be destroyed by one attack. Lasts until destroyed or dispelled as a free action on the user’s turn",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 5,
        "tiles": "floor(mag / 5)"
      },
      "hidden": false
    },
    {
      "name": "Bolganone",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 85,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Cutting Gale",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 7,
        "hit": 95,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 6
      },
      "hidden": false
    },
     {
      "name": "Frostbite",
      "type": "Anima Magic",
      "description": "Inflicts Mov -1 to foe for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 4,
        "hit": 70,
        "avo": 0,
        "crit": 15,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Thoron",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 9,
        "hit": 75,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 4
      },
      "hidden": false
    },
    {
      "name": "Sagittae",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 7,
        "hit": 90,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 10
      },
      "hidden": false
    },
    {
      "name": "Fire Wall",
      "type": "Anima Magic",
      "description": "Create adjacent patches of fire that damage units that start their turn there. Additional patches per 5pts of magic. Deals damage equal to ½ of Magic, minus enemy’s Resistance.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": -1,
        "tiles": "floor(mag / 5)"
      },
      "hidden": false
    },
    {
      "name": "Wind Wall",
      "type": "Anima Magic",
      "description": "Create adjacent torrents of wind. If cast on spaces with units in them, the caster may move the unit to an adjacent space. Ranged attacks cannot be made over wind tiles. It costs an extra point of movement to traverse wind tiles. Additional patches per 5pts of magic.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": -1,
        "tiles": "floor(mag / 5)"
      },
      "hidden": false
    },
    {
      "name": "Excalibur",
      "type": "Anima Magic",
      "description": "Effective against Flying foes.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 11,
        "hit": 100,
        "avo": 0,
        "crit": 15,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 4
      },
      "hidden": false
    },
    {
      "name": "Fimbulvetr",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 12,
        "hit": 60,
        "avo": 0,
        "crit": 25,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Lightning Wall",
      "type": "Anima Magic",
      "description": "Create adjacent patches of lightning. The first time a unit enters a patch of lightning, it loses all remaining movement until the end of its turn. Additional patches per 5pts of magic. Deals damage equal to ½ Magic, minus enemy’s Resistance. Cannot be cast on occupied tiles.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": -1,
        "tiles": "floor(mag / 5)"
      },
      "hidden": false
    },
    {
      "name": "Meteor",
      "type": "Anima Magic",
      "description": "Magic that also hits targets adjacent to the point of impact. Cannot trigger follow-up attacks.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 10,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Niflheim",
      "type": "Anima Magic",
      "description": "Magic that also hits targets adjacent to the point of impact. Inflicts Mov -1 to foes for 1 turn. Cannot trigger follow-up attacks.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 9,
        "hit": 65,
        "avo": 0,
        "crit": 20,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Bolting",
      "type": "Anima Magic",
      "description": "Cannot trigger follow-up attacks.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 12,
        "hit": 65,
        "avo": 0,
        "crit": 15,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Ragnarok",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 15,
        "hit": 80,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Agnea's Arrow",
      "type": "Anima Magic",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 16,
        "hit": 70,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Anima Wall",
      "type": "Anima Magic",
      "description": "Create adjacent blocks of force that prevent movement. Creates one block per 5pts of magic. Cannot be cast on occupied tiles. Blocks have 50 hit points. Lasts until destroyed or dispelled as a free action on the user’s turn",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 1,
        "tiles": "floor(mag / 5)"
      },
      "hidden": false
    },
    {
      "name": "Nosferatu",
      "type": "Light Magic",
      "description": "Restores HP equal to 50% of damage dealt to foe.",
      "rank": "D",
      "modifiers": {
        "pmt": 0,
        "mmt": 1,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Heal",
      "type": "Light Magic",
      "description": "Restores HP to an ally.",
      "rank": "D",
      "tags": {
        "healing": true
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 10
      },
      "hidden": false
    },
    {
      "name": "Bless",
      "type": "Light Magic",
      "description": "Bless a friendly unit within range of 5. Until the start of your next turn, the blessed unit makes attack rolls twice, taking the better hit result of the two.",
      "rank": "D",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "uses": 0
      },
      "hidden": false
    },
    {
      "name": "Recover",
      "type": "Light Magic",
      "description": "Restores HP to an ally.",
      "rank": "C",
      "tags": {
        "healing": true
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 30,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Physic",
      "type": "Light Magic",
      "description": "Restores HP to a distant ally.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": -1,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Guiding Bolt",
      "type": "Light Magic",
      "description": "On hit, attack rolls made against the target during its next combat have advantage. Cannot trigger follow-up attacks.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 5,
        "hit": 90,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 3,
        "cost": 0,
        "uses": 8
      },
      "hidden": false
    },
    {
      "name": "Restore",
      "type": "Light Magic",
      "description": "Cures status effects on all allies in range.",
      "rank": "C",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": -1,
        "cost": 0,
        "uses": 10
      },
      "hidden": false
    },
    {
      "name": "Ward",
      "type": "Light Magic",
      "description": "Grants Res +7 to an ally; effect diminishes with each turn.",
      "rank": "C",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 5
      },
      "hidden": false
    },
    {
      "name": "Silence",
      "type": "Light Magic",
      "description": "Prevents foe from using magic for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 100,
        "avo": 0,
        "crit": 0,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Seraphim",
      "type": "Light Magic",
      "description": "Effective against monster foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 8
      },
      "hidden": false
    },
    {
      "name": "Purge",
      "type": "Light Magic",
      "description": "Effective against units wielding dark magic. Enemy units only.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 8
      },
      "hidden": false
    },
    {
      "name": "Rescue",
      "type": "Light Magic",
      "description": "Moves an ally to a space next to the user.",
      "rank": "B",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": "floor(mag/4)",
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Warp",
      "type": "Light Magic",
      "description": "Moves an ally to a specified tile within range.",
      "rank": "B",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": -1,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Sanctuary",
      "type": "Light Magic",
      "description": "Enchant a friendly unit. This unit can only be targeted by the enemy if an enemy unit has no other targets available to it.",
      "rank": "B",
      "tags": {
        "healing": false
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Fortify",
      "type": "Light Magic",
      "description": "Restores HP for all allies in range.",
      "rank": "A",
      "tags": {
        "healing": true
      },
      "modifiers": {
        "pmt": 0,
        "mmt": 15,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": -1,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Aura",
      "type": "Light Magic",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 12,
        "hit": 70,
        "avo": 0,
        "crit": 20,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 3
      },
      "hidden": false
    },
    {
      "name": "Abraxas",
      "type": "Light Magic",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 14,
        "hit": 90,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 2
      },
      "hidden": false
    },
    {
      "name": "Flame Strike",
      "type": "Light Magic",
      "description": "(PENDING APPROVAL) Magic that also hits targets within two spaces of the point of impact. Cannot trigger follow-up attacks.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 70,
        "avo": 0,
        "crit": 5,
        "minrng": 3,
        "maxrng": 10,
        "cost": 0,
        "uses": 1
      },
      "hidden": false
    },
    {
      "name": "Ethereal Spear (Opaque)",
      "type": "Lance",
      "description": "Can only be wielded using the Ethereal Weapon spell. Enables the use of the Hook combat art.",
      "rank": "B",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Edge (Opaque)",
      "type": "Sword",
      "description": "Can only be wielded using the Ethereal Weapon spell. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Lance (Opaque)",
      "type": "Lance",
      "description": "Can only be wielded using the Ethereal Weapon spell. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Axe (Opaque)",
      "type": "Axe",
      "description": "Can only be wielded using the Ethereal Weapon spell. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 12,
        "mmt": 0,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Spear (Translucent)",
      "type": "Lance",
      "description": "Can only be wielded using the Ethereal Weapon spell. Deals magic-based damage. Enables the use of the Hook combat art.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 6,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 2,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Edge (Translucent)",
      "type": "Sword",
      "description": "Can only be wielded using the Ethereal Weapon spell. Deals magic-based damage. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 7,
        "hit": 90,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Lance (Translucent)",
      "type": "Lance",
      "description": "Can only be wielded using the Ethereal Weapon spell. Deals magic-based damage. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 8,
        "hit": 80,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Ethereal Axe (Translucent)",
      "type": "Axe",
      "description": "Can only be wielded using the Ethereal Weapon spell. Deals magic-based damage. Enables the use of the Displaced Strike combat art.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 10,
        "hit": 70,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Balthraz",
      "type": "Lance",
      "description": "Possesses a modified weapon triangle, and is strong against all magic and weak to Swords, Lances, and Axes except for its twin, Mistilaz. Sacred weapon (Crest of the Watcher) that restores HP every turn. (Effect increased with Crest.)",
      "rank": null,
      "modifiers": {
        "pmt": 19,
        "mmt": 0,
        "hit": 75,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Mistilaz_",
      "type": "Axe",
      "description": "Possesses a modified weapon triangle, is strong against Swords, Lances, and Axes, except for its twin, Balthraz and weak to all magic. Deals magic-based damage. Sacred weapon (Crest of the Watcher) that restores HP every turn. (Effect increased with Crest.)",
      "rank": null,
      "modifiers": {
        "pmt": 0,
        "mmt": 12,
        "hit": 80,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    },
    {
      "name": "Mistilaz",
      "type": "Axe",
      "description": "Deals magic-based damage. Sacred weapon (Crest of the Noa) blood bonded to Rosalie Nedler. (Effect increased with Crest or if Rosalie Nedler.)",
      "rank": null,
      "modifiers": {
        "pmt": 0,
        "mmt": 12,
        "hit": 80,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0,
        "uses": 0
      },
      "hidden": true
    }
  ],
  "equipment": [
    {
      "name": "Placeholder",
      "description": "This is a template.",
      "type": "Generic"
    },
    {
      "name": "Leather Shield",
      "description": "Prot +1",
      "type": "Shield",
      "modifiers": {
        "pdr": 1
      }
    },
    {
      "name": "Iron Shield",
      "description": "Prot +2",
      "type": "Shield",
      "modifiers": {
        "pdr": 2
      }
    },
    {
      "name": "Steel Shield",
      "description": "Prot +3",
      "type": "Shield",
      "modifiers": {
        "pdr": 3
      }
    },
    {
      "name": "Silver Shield",
      "description": "Prot +4",
      "type": "Shield",
      "modifiers": {
        "pdr": 4
      }
    },
    {
      "name": "Talisman Shield",
      "description": "Prot +1 and Resl +2",
      "type": "Shield",
      "modifiers": {
        "pdr": 1,
        "mdr": 2
      }
    },
    {
      "name": "Hexlock Shield",
      "description": "Prot +2 and Resl +4",
      "type": "Shield",
      "modifiers": {
        "pdr": 2,
        "mdr": 4
      }
    },
    {
      "name": "Aegis Shield",
      "description": "Relic shield. Prot +6 and Resl +3, may halve damage for Crest of Fraldarius",
      "type": "Shield",
      "modifiers": {
        "pdr": 6,
        "mdr": 3
      }
    },
    {
      "name": "Ochain Shield",
      "description": "Sacred shield (Crest of Chichol). Prot +6, restores hp each turn and negates foe's critical hits.",
      "type": "Shield",
      "modifiers": {
        "pdr": 6
      }
    },
    {
      "name": "Seiros Shield",
      "description": "Sacred shield (Crest of Seiros). Prot +5, restores hp each turn and halves damage from monsters.",
      "type": "Shield",
      "modifiers": {
        "pdr": 5
      }
    },
    {
      "name": "Aurora Shield",
      "description": "Prot +3. Nullifies user's Flying-type weakness.",
      "type": "Shield",
      "modifiers": {
        "pdr": 3
      }
    },
    {
      "name": "Kadmos Shield",
      "description": "Prot +3. Nullifies user's Armoured-type weakness.",
      "type": "Shield",
      "modifiers": {
        "pdr": 3
      }
    },
    {
      "name": "Lampos Shield",
      "description": "Prot +3. Nullifies user's Cavalry-type weakness.",
      "type": "Shield",
      "modifiers": {
        "pdr": 3
      }
    },
    {
      "name": "Accuracy Ring",
      "description": "Hit +10",
      "type": "Ring",
      "modifiers": {
        "hit": 10
      }
    },
    {
      "name": "Critical Ring",
      "description": "Crit +5",
      "type": "Ring",
      "modifiers": {
        "hit": 5
      }
    },
    {
      "name": "Evasion Ring",
      "description": "Avo +10",
      "type": "Ring",
      "modifiers": {
        "avo": 10
      }
    },
    {
      "name": "Speed Ring",
      "description": "Spd +2",
      "type": "Ring",
      "modifiers": {
        "spd": 2
      }
    },
    {
      "name": "March Ring",
      "description": "Mov +1",
      "type": "Ring",
      "modifiers": {
        "mov": 1
      }
    },
    {
      "name": "Goddess Ring",
      "description": "Dex +4; restores HP each turn",
      "type": "Ring",
      "modifiers": {
        "hit": 10
      }
    },
    {
      "name": "Prayer Ring",
      "description": "Grants Miracle ability; restores HP each turn",
      "type": "Ring"
    },
    {
      "name": "Magic Staff",
      "description": "Increases might of spells by 3.",
      "type": "Staff",
      "modifiers": {
        "mmt": 3
      }
    },
    {
      "name": "Healing Staff",
      "description": "Increases healing power by 10.",
      "type": "Staff",
      "modifiers": {
        "mmt": 10
      }
    },
    {
      "name": "Magic Staff",
      "description": "Increases might of spells by 3.",
      "type": "Staff",
      "modifiers": {
        "mmt": 3
      }
    },
    {
      "name": "Cadeuseus Staff",
      "description": "Sacred staff (Crest of Cethleann). Range +1 for offensive magic, restores hp each turn.",
      "type": "Staff",
      "modifiers": {
        "maxrng": 1
      }
    },
    {
      "name": "Thyrsus",
      "description": "Relic staff (Crest of Gloucester). Range +2 for offensive magic, may halve damage receives.",
      "type": "Staff",
      "modifiers": {
        "maxrng": 2
      }
    },
    {
      "name": "Rafail Gem",
      "description": "Relic gem (Crest of Lamine). Nullifies user’s class type weaknesses, prevents foe’s critical hits, and may halve damage received.",
      "type": "Gem"
    },
    {
      "name": "Black Eagle Pendant",
      "description": "Cha +2",
      "type": "Accessory",
      "modifiers": {
        "cha": 2
      }
    },
    {
      "name": "Blue Lion Brooch",
      "description": "Cha +2",
      "type": "Accessory",
      "modifiers": {
        "cha": 2
      }
    },
    {
      "name": "Golden Deer Bracelet",
      "description": "Cha +2",
      "type": "Accessory",
      "modifiers": {
        "cha": 2
      }
    },
    {
      "name": "White Dragon Scarf",
      "description": "Cha +2",
      "type": "Accessory",
      "modifiers": {
        "cha": 2
      }
    },
    {
      "name": "Fetters of Dromi",
      "description": "Relic ring (Crest of Aubin). Movement +1, user can continue moving after taking certain actions, and may halve damage received.",
      "type": "Ring",
      "modifiers": {
        "mov": 1
      }
    },
    {
      "name": "Tactiball Trophy",
      "description": "Cha +1, Avo +5. Enables the use of the Super Juke combat art.",
      "type": "Accessory",
      "modifiers": {
        "cha": 1,
        "avo": 5
      }
    },
    {
      "name": "Hematurgic Vessel",
      "description": "HP +5. When a unit is reduced to 0 HP by physical damage, stabilizes the unit, then permanently shatters.",
      "type": "Accessory",
      "modifiers": {
        "hp": 5
      }
    }
  ],
  "combatarts": [
    {
      "name": "Standard Attack",
      "type": "Generic",
      "description": "This is a combat art that represents not using a combat art. Serves as a template/placeholder",
      "rank": "E",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Healing Focus",
      "type": "Generic",
      "description": "Restores 50% of the user’s HP.",
      "rank": "Unknown",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 0,
        "maxrng": 0,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Swap",
      "type": "Generic",
      "description": "User swaps places with the ally.",
      "rank": "Class Mastery",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Shove",
      "type": "Generic",
      "description": "User pushes ally forward 1 space.",
      "rank": "Class Mastery",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Reposition",
      "type": "Generic",
      "description": "User moves ally to the space behind the user.",
      "rank": "Class Mastery",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Draw Back",
      "type": "Generic",
      "description": "User moves 1 space backwards and ally is moved to where the user was previously.",
      "rank": "Class Mastery",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Smite",
      "type": "Generic",
      "description": "User pushes ally forward 2 spaces.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Wander",
      "type": "Generic",
      "description": "Unit may move 2 additional spaces while ignoring movement penalties.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Triangle Attack",
      "type": "Generic",
      "description": "Can only be triggered when 3 allied Flying units (including the user) are adjacent to the same enemy.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 40,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Foul Play",
      "type": "Generic",
      "description": "Unit swaps positions with an ally in range. Exclusive to the Trickster class.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Super Juke",
      "type": "Generic",
      "description": "Tactiball Trophy only; Once per combat, +2 move for a turn.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 0,
        "maxrng": 0,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Sunder",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 15,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Wrath Strike",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Grounder",
      "type": "Sword",
      "description": "Effective against Flying foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Haze Slice",
      "type": "Sword",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 2,
        "mmt": 0,
        "hit": 0,
        "avo": 30,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Bane of Monsters",
      "type": "Sword",
      "description": "Effective against Monster foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Soulblade",
      "type": "Sword",
      "description": "Deals magic-based damage. Might increases based on user’s Resistance",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": "2 + floor(res * 0.3)",
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": "res"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Soulmonger",
      "type": "Sword",
      "description": "Deals magic-based damage. Might increases based on user's Dexterity. Earned through RP.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": "4 + floor(dex * 0.3)",
        "hit": 0,
        "avo": 0,
        "crit": 15,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": null,
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Flowing Blade",
      "type": "Sword",
      "description": "Activate to adopt a flowing stance, granting the user +30% AVO until the start of their next turn. In addition, in the next combat at range 1, the user may counter attack twice, regardless of speed.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 30,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": null,
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Hexblade",
      "type": "Sword",
      "description": "Deals magic-based damage.",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 7,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Finesse Blade",
      "type": "Sword",
      "description": "Might increases based on user’s Dexterity.",
      "rank": "A",
      "modifiers": {
        "pmt": "2 + floor(dex * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 10,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": "dex"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Windsweep",
      "type": "Sword",
      "description": "Prevent enemy counter-attack.",
      "rank": "A",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Subdue",
      "type": "Sword",
      "description": "Leaves foe with at least 1 HP.",
      "rank": "Class Mastery",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 2
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Foudroyant Strike",
      "type": "Sword",
      "description": "Thunderbrand only; effective against Armoured and Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 30,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Beast Fang",
      "type": "Sword",
      "description": "Blutgang only; effective against Cavalry and Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 30,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Ruptured Heaven",
      "type": "Sword",
      "description": "Sword of the Creator only; Might increases based on user’s Magic, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "7 + floor(mag * 0.3)",
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": "mag"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Heaven’s Fall",
      "type": "Sword",
      "description": "Dark Creator Sword only; Might increases based on user’s Magic.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "10 + floor(mag * 0.3)",
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": "mag"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Assassinate",
      "type": "Sword",
      "description": "Assassin only; Avoid +15, can kill enemies instantly.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 15,
        "avo": 15,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Astra",
      "type": "Sword",
      "description": "Swordmaster only; triggers 5 consecutive hits at 30% Might.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": -10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 9
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": true,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Sublime Heaven",
      "type": "Sword",
      "description": "Sublime Creator Sword only; Might increases based on user’s Magic, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "10 + floor(mag * 0.3)",
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 20,
        "minrng": 1,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": "mag"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Sword Dance",
      "type": "Sword",
      "description": "Might increases based on user’s Charm.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "1 + floor(cha * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 20,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 2
      },
      "multipliers": {
        "scale": "cha"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Tempest Lance",
      "type": "Lance",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Hit and Run",
      "type": "Lance",
      "description": "After combat, user moves 1 space backwards.",
      "rank": "D",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 10,
        "avo": 20,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Knight Kneeler",
      "type": "Lance",
      "description": "Effective against Cavalry foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Shatter Slash",
      "type": "Lance",
      "description": "After combat, inflicts Def -5 on foe for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Vengeance",
      "type": "Lance",
      "description": "Damage increases in relation to the user’s missing HP.",
      "rank": "C-B",
      "modifiers": {
        "pmt": "2 + floor((hp - current_hp)/2)",
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": true
      },
      "hidden": false
    },
    {
      "name": "Monster Piercer",
      "type": "Lance",
      "description": "Effective against Monster foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 7,
        "mmt": 0,
        "hit": 0,
        "avo": 10,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Frozen Lance",
      "type": "Lance",
      "description": "Deals magic-based damage. Might increases based on user’s Dexterity.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": "3 + floor(dex * 0.3)",
        "hit": 5,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": "dex"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Hook",
      "type": "Lance",
      "description": "On hit, draws the target one space closer to the user.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Redirection",
      "type": "Lance",
      "description": "Until start of user’s next turn, the user is granted +5 RES. If the user takes any spell damage, they may apply their next attack as Magic damage.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5,
        "res": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Swift Strikes",
      "type": "Lance",
      "description": "Triggers 2 consecutive hits.",
      "rank": "A",
      "modifiers": {
        "pmt": 2,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Lance Jab",
      "type": "Lance",
      "description": "Might increases based on user’s Speed.",
      "rank": "A",
      "modifiers": {
        "pmt": "3 + floor(spd * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": "spd"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Glowing Ember",
      "type": "Lance",
      "description": "Might increases based on user’s Defence.",
      "rank": "A",
      "modifiers": {
        "pmt": "2 + floor(def * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 10,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": "def"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Ruined Sky",
      "type": "Lance",
      "description": "Lance of Ruin only; Avoid +10, effective against Flying and Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 13,
        "mmt": 0,
        "hit": 10,
        "avo": 10,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Atrocity",
      "type": "Lance",
      "description": "Areadbhar only; effective against all foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 15,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Burning Quake",
      "type": "Lance",
      "description": "Lúin only; Might increases based on user’s Speed, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "8 + floor(spd * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 10,
        "crit": 20,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": "spd"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Paraselene",
      "type": "Lance",
      "description": "Great Lord only; After combat, user moves 1 space backwards.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 0,
        "avo": 10,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Smash",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 20,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Spike",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 15,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Helm Splitter",
      "type": "Axe",
      "description": "Effective against Armoured foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 7,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 5,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Focused Strike",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Wild Abandon",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": -30,
        "avo": 0,
        "crit": 30,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Lightning Axe",
      "type": "Axe",
      "description": "Deals magic-based damage. Might increases based on user’s Resistance.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": "4 + floor(res * 0.3)",
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": "res"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Monster Breaker",
      "type": "Axe",
      "description": "Effective against Monster foes.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 9,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Shield Axe",
      "type": "Axe",
      "description": "The user makes a skilled attack while also using the broadside of the axe as a shield. The user is granted temporary HP equal to half of damage inflicted by this attack until the start of next turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Armored Strike",
      "type": "Axe",
      "description": "Might increases based on user’s Defence.",
      "rank": "A",
      "modifiers": {
        "pmt": "3 + floor(def * 0.3)",
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": "def"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Diamond Axe",
      "type": "Axe",
      "description": "No special effect.",
      "rank": "A",
      "modifiers": {
        "pmt": 14,
        "mmt": 0,
        "hit": -20,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 7
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Exhaustive Strike",
      "type": "Axe",
      "description": "One use.",
      "rank": "A",
      "modifiers": {
        "pmt": 14,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 35,
        "minrng": 1,
        "maxrng": 1,
        "cost": 1
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Nedler's Amputator",
      "type": "Axe",
      "description": "Deals magic-based damage. Might increases based on user’s Speed",
      "rank": "A",
      "modifiers": {
        "pmt": 0,
        "mmt": 4,
        "hit": 15,
        "avo": 0,
        "crit": 15,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": "spd"
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": true
    },
    {
      "name": "Apocalyptic Flame",
      "type": "Axe",
      "description": "Freikugel only; inflicts Str -5 on foe for 1 turn, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 15,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Dust",
      "type": "Axe",
      "description": "Crusher only; inflicts Def -5 on foe for 1 turn, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 20,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Raging Storm",
      "type": "Axe",
      "description": "Aymr only; if attack lands, user can move again, effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 14,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Flickering Flower",
      "type": "Axe",
      "description": "Emperor only; prevents foe from moving for 1 turn.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 10,
        "minrng": 1,
        "maxrng": 1,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "War Hero’s Strike",
      "type": "Axe",
      "description": "War Hero only; effective against all foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Curved Shot",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "D",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 3,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Monster Blaster",
      "type": "Bow",
      "description": "Effective against Monster foes.",
      "rank": "D",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 10,
        "minrng": 2,
        "maxrng": 2,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Deadeye",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 6,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 3,
        "maxrng": 5,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Waning Shot",
      "type": "Bow",
      "description": "After combat, inflicts Str -5 on foe for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 3,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Break Shot",
      "type": "Bow",
      "description": "After combat, inflicts Def -5 on foe for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 5,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 3,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Schism Shot",
      "type": "Bow",
      "description": "After combat, inflicts Res -5 on foe for 1 turn.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 15,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 3,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Heavy Draw",
      "type": "Bow",
      "description": "No special effect.",
      "rank": "C-B",
      "modifiers": {
        "pmt": 8,
        "mmt": 0,
        "hit": 10,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Covering Fire",
      "type": "Bow",
      "description": "Activate to adopt a stance providing suppressive fire. A friendly target within attack range of equipped bow is granted +5 DEF and RES against ranged attacks. In addition, the user may counter-attack units who attack the covered friendly target with ranged attacks, regardless of range. The user and the covered unit cannot both counter attack if they can, but must choose one to counter attack. ",
      "rank": "C-B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Point-Blank Volley",
      "type": "Bow",
      "description": "Triggers 2 consecutive hits.",
      "rank": "A",
      "modifiers": {
        "pmt": 2,
        "mmt": 0,
        "hit": 10,
        "avo": 10,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 4
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Encloser",
      "type": "Bow",
      "description": "Prevents foe from moving for 1 turn.",
      "rank": "A",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 15,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Ward Arrow",
      "type": "Bow",
      "description": "Prevents foe from using magic for 1 turn.",
      "rank": "A",
      "modifiers": {
        "pmt": 4,
        "mmt": 0,
        "hit": 15,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Fallen Star",
      "type": "Bow",
      "description": "Failnaught only; avoids all attacks during the next round of combat; effective against Dragon foes.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 10,
        "mmt": 0,
        "hit": 30,
        "avo": 0,
        "crit": 10,
        "minrng": 2,
        "maxrng": 3,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Hunter’s Volley",
      "type": "Bow",
      "description": "Sniper only; triggers 2 consecutive hits.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 1,
        "mmt": 0,
        "hit": 15,
        "avo": 0,
        "crit": 10,
        "minrng": 2,
        "maxrng": 3,
        "cost": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Wind God",
      "type": "Bow",
      "description": "Barbarossa only.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 5,
        "mmt": 0,
        "hit": 20,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 5,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Conduit of Faith",
      "type": "Axe",
      "description": "Deals magic-based damage. Expends a usage of a Light Magic spell and adds its might to the attack and 1/3 of its might to the cost.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 1,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 1,
        "cost": 1
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": true
    },
    {
      "name": "Displaced Strike",
      "type": "Generic",
      "description": "Only usable with ethereal weapons.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": 3,
        "mmt": 0,
        "hit": -5,
        "avo": 0,
        "crit": 0,
        "minrng": 2,
        "maxrng": 2,
        "cost": 3
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": true
    },
    {
      "name": "Inspiration of Awe",
      "type": "Generic",
      "description": "Something that need not be seen.",
      "rank": "Exclusive",
      "modifiers": {
        "pmt": "1 + floor(abs(level - cha) * 0.5)",
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 0,
        "maxrng": 0,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": true
    },
    {
      "name": "Taunt",
      "type": "Armor",
      "description": "Choose an enemy within five spaces; during the next player phase, if that enemy attacks a unit other than the user, it suffers -30 hit during that combat.",
      "rank": "C+",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Save from Weapons",
      "type": "Armor",
      "description": "+5 DEF; Choose one allied unit within two spaces, whenever that unit is targeted by an attack that calculates damage using Strength, you enter combat instead of them, as if you were in their space.",
      "rank": "B+",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "def": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Save from Magic",
      "type": "Armor",
      "description": "+5 RES; Choose one allied unit within two spaces, whenever the unit is targeted by an attack that calculates damage using Magic, you enter combat instead of them, as if you were in their space.",
      "rank": "B+",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0,
        "res": 5
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Shelter F",
      "type": "Flying",
      "description": "While mounted, choose an allied Infantry or Armored unit in an adjacent space; that unit enters into the user's space and moves along with the user while the user is mounted. A unit that is sheltered cannot use or be target by attacks, spells, or combat arts. At any point during the player phase, the sheltered unit can choose to leave the shelter and use all of their remaining movement to enter into an adjacent space. If a unit reduced to zero hitpoints while sheltering another unit, that sheltered unit then occupies the space previously occupied by the sheltering unit.",
      "rank": "C",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    },
    {
      "name": "Shelter R",
      "type": "Riding",
      "description": "While mounted, choose an allied Infantry or Armored unit in an adjacent space; that unit enters into the user's space and moves along with the user while the user is mounted. A unit that is sheltered cannot use or be target by attacks, spells, or combat arts. At any point during the player phase, the sheltered unit can choose to leave the shelter and use all of their remaining movement to enter into an adjacent space. If a unit reduced to zero hitpoints while sheltering another unit, that sheltered unit then occupies the space previously occupied by the sheltering unit.",
      "rank": "B",
      "modifiers": {
        "pmt": 0,
        "mmt": 0,
        "hit": 0,
        "avo": 0,
        "crit": 0,
        "minrng": 1,
        "maxrng": 5,
        "cost": 0
      },
      "multipliers": {
        "scale": null
      },
      "tags": {
        "astra": null,
        "vengeance": null
      },
      "hidden": false
    }
  ]
}
;