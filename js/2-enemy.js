//Enemy
    class EnemyObj {
        constructor(){
            this.level = gs.stage //tileIdRef[1] prev. value.
            
            //Set enemy profile
            if (gs.playerLocationTile.boss){   
                this.profile = pickEnemyProfile('boss')
            } 
            else {
                this.profile = pickEnemyProfile('enemy')
            }

            //TESTING: Add specific enemy
            if(config.forceEnemyProfile != undefined) {
                this.profile = profileRef[config.forceEnemyProfile[0]][config.forceEnemyProfile[1]]
            }   

            //Set stats
            //Get column value to scale mobs
            let tileIdRef = []
            gs.playerLocationTile.tileId.split('-').forEach(val =>{
                tileIdRef.push(parseInt(val))
            })

            this.inventory   = []

            this.life        = config.eneLife + Math.round((3 * this.level) * this.profile.lifeMod )
            this.flatLife    = this.life
            this.dmgDone     = 0 // For dmg calc.
            this.dmgTaken    = 0 // For dmg calc.
            this.lifeChange  = 0
            this.lifeChangeMarker = false

            this.power       = 0 + Math.round((0.2 * this.level) * this.profile.powerMod) 
            this.flatPower   = this.power
            this.powerChange = 0
            this.powerChangeMarker = false

            this.def         = 0 + Math.round((0.2 * this.level) * this.profile.defMod)
            this.flatDef     = this.def
            this.defChange   = 0
            this.defChangeMarker = false

            this.dice        = 3 + Math.ceil(this.level * this.profile.diceMod)
            this.flatDice    = this.dice
            this.diceChange  = 0
            this.diceChangeMarker = false

            this.roll        = 0
            this.rollChange  = 0
            this.rollChangeMarker = false

            //Misc
            //Dots - move to array
            this.appliedPoisonStacks = 0
            this.poisonStacks        = 0
            this.appliedBurnStacks   = 0
            this.burnStacks          = 0

            this.crit         = false
            this.state        = ''                   // Used for stun, fear etc.
            this.forcedAction = ''                   // For items that force acions
            this.reflect      = this.profile.reflect // Reflect mod

            this.actionRef    = []
            this.acctionMod   = ''

            //Override stats from profile obj
            if(typeof this.profile.statOverrides !== 'undefined'){

                this.profile.statOverrides.forEach(stat =>{
                    let statArr = stat.split('-')
                    this[statArr[0]] = statArr[1] * 1
                })

            }

            //Add item
            // addItem("club", undefined, "enemy")
            // console.log(gs.enObj)
        } 
    }
    
    //Pick boss or enemy profile
    function pickEnemyProfile(enemyType) {

        //enemy type is 'boss' or 'enemy'

        let profile

        //If undefined pick from all profiles
        if(
                typeof gs.mapProfile == 'undefined'
            ||  typeof gs.mapProfile[enemyType] == 'undefined'
        ){
            profile =  profileRef[enemyType][rarr(Object.keys(profileRef[enemyType]))]
        }
        //Pick from map ref obj
        else{
            profile = profileRef[enemyType][rarr(gs.mapProfile[enemyType])]
        }

        return profile
    }

    //Recalculate current action.
    function recalcEneAction(){
        gs.enObj.action = new EnemyActionObj(gs.enObj.action.key)
        gs.logMsg.push(`enemy action recalculated`)
    }

    let profileRef = {
        enemy: {
              balanced:  {
                profileId: 'balanced',
                lifeMod:  1,
                powerMod: 1,
                defMod:   1,
                diceMod:  1,
                actionPool: [
                    //Attack
                        'attack',
                        // 'final strike', 
                        // 'combo', 
                        // 'charge', 
                    
                    //Def
                        'block', 
    
                    
                    //Hex
                        'wound',  'shatter',
                        'weaken', 'shock',
                        // 'slow', 
                        // 'drain', 
                    
                    //Buff
                        // 'fortify', 
                        // 'empower', 
                        // 'rush',
                        // 'recover',
    
                    //Misc
                        // 'sleep',
                ]
            },assassin:  {
                profileId: 'assassin',
                lifeMod:  0.75,
                powerMod: 2,
                defMod:   1,
                diceMod:  1,
                actionPool: [
                    'attack', 
                    'combo',  
                    'final strike',
    
                    'empower', 
                    'rush',
                    'charge', 
                    'wound',  'shatter',

                    //Misc
                        'sleep',
                ]
            },tank:      {
                profileId: 'tank',
                lifeMod:  2.5,
                powerMod: 0.5,
                defMod:   3.5,
                diceMod:  0.25,
    
                actionPool: [
                    //Attack
                        'attack',
                        // 'final strike', 
                        'combo', 
                        'charge',                 
                    //Def
                        'block',                 
                    //Hex
                        'wound',  'shatter',
                        // 'weaken', 'shock',
                        // 'slow', 
                        // 'drain',                 
                    //Buff
                        'fortify', 
                        // 'empower', 
                        // 'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            },minion:    {
                profileId: 'minion',
                lifeMod:    1,
                powerMod: 0.5,
                defMod:   0.5,
                diceMod:  0.5,
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        // 'combo', 
                        // 'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        // 'wound',  'shatter',
                        // 'weaken', 'shock',
                        // 'slow', 
                        // 'drain', 
                    //Buff
                        // 'fortify', 
                        // 'empower', 
                        // 'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            },mage:      {
                profileId: 'mage',
                lifeMod:  1,
                powerMod: 1,
                defMod:   1,
                diceMod:  1,
                actionPool: [
                    //Attack
                        'attack',
                        // 'final strike', 
                        // 'combo', 
                        // 'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        'wound',  'shatter',
                        'weaken', 'shock',
                        'slow', 
                        'drain', 
                    //Buff
                        // 'fortify', 
                        // 'empower', 
                        'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            },gladiator: {
                profileId: 'gladiator',
                lifeMod:  1.5,
                powerMod: 0.5,
                defMod:   0.5,
                diceMod:  0.5,
                reflect:  100,
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        // 'combo', 
                        // 'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        'wound',  'shatter',
                        // 'weaken', 'shock',
                        // 'slow', 
                        // 'drain', 
                    //Buff
                        // 'fortify', 
                        // 'empower', 
                        // 'rush',
                        // 'recover',
                    //Misc
                        'sleep',
                ]
            }
            
        },
        boss: {
              boss0:     {//stage 0 (strong unit)   
                profileId: 'boss0',
                lifeMod:  3,
                powerMod: 2,//required for final strike
                defMod:   2,
                diceMod:  2,
                statOverrides: [
                    'def-0',
                    'power-0',
                    'life-12',
                    'dice-4'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        'combo', 
                        'charge', 
                    //Def
                        'block', 

                    //Misc
                        'sleep',
                ]
            },boss1:     {//stage 1 (strong unit)   
                profileId: 'boss1',
                lifeMod:  3,
                powerMod: 2,//required for final strike
                defMod:   2,
                diceMod:  2,
                statOverrides: [
                    'def-2',
                    'power-2',
                    'life-20',
                    'dice-6'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        'combo', 
                        'charge', 
                    //Def
                        'block', 

                    //Misc
                        'sleep',
                ]
            },boss2:     {//stage 2 (pwoer control)  
                profileId: 'boss2',
                lifeMod:  3,
                statOverrides: [
                    'def-0',
                    'power-5',
                    'life-20',
                    'dice-4'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        'combo', 
                        'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        'wound',  'shatter',
                        'weaken', 'shock',
                        'slow', 
                        'drain', 
                    //Buff
                        'fortify', 
                        'empower', 
                        'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            },boss3:     {//stage 3 (def control)   
                profileId: 'boss3',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-10',
                    'life-30',
                    'dice-6'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'block',
                ]
            },boss4:     {//stage 4 (dice control)   
                profileId: 'boss4',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-5',
                    'life-60',
                    'dice-20'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        'combo', 
                        'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        'wound',  'shatter',
                        'weaken', 'shock',
                        'slow', 
                        'drain', 
                    //Buff
                        'fortify', 
                        'empower', 
                        'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            },boss5:     {//stage 5 (hp check)   
                profileId: 'boss5',
                lifeMod:  3,
                statOverrides: [
                    'def-0',
                    'power-0',
                    'life-100',
                    'dice-6'
                ],
                actionPool: [
                    //Attack
                        'final strike', 
                        'combo', 
                        'charge', 
                        'block',
                ]
            },boss6:     {//stage 6 (dice control)   
                profileId: 'boss6',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-10',
                    'pwoer-10',
                    'life-100',
                    'dice-10'
                ],
                actionPool: [
                    //Attack
                        'attack',
                        'final strike', 
                        'combo', 
                        'charge', 
                    //Def
                        'block', 
    
                    //Hex
                        'wound',  'shatter',
                        'weaken', 'shock',
                        'slow', 
                        'drain', 
                    //Buff
                        'fortify', 
                        'empower', 
                        'rush',
                        'recover',
                    //Misc
                        'sleep',
                ]
            }
        }
    }