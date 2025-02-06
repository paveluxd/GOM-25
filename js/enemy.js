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

    class EnemyActionObj {
        constructor(key){

            //Gen icon path
            function ico(icoKey){
                let path = `<img src="./img/ico/${icoKey}.svg">`
                return path
            }

            this.key = key

            //Damage
                  if(key == 'attack'){

                this.rate = 1
                this.actionVal = gs.enObj.roll + gs.enObj.power 
                // this.desc = `${ico('attack')}${this.actionVal} dmg`
                this.desc = `${ico('attack')}Will attack for ${this.actionVal}`

            }else if(key == 'combo'){       //multistrike

                this.rate = 2
                this.actionVal = 1 + gs.enObj.power 
                this.desc = `
                    ${ico('combo')}
                    <span>Will attack for ${this.actionVal}</span>
                `

            }else if(key == 'block'){

                this.rate = 2
                this.actionVal = gs.enObj.roll
                this.desc = `${ico("block")}Will block ${this.actionVal} dmg`

            }else if(key == 'final strike'){//on death

                //Enable if low life
                if(gs.enObj.life < 6){
                    this.rate = 2
                }

                this.actionVal = gs.enObj.flatLife
                this.desc = `${ico('skull') + this.actionVal} dmg on death`

            }else if(key == 'charge'){      //charge crit

                this.rate = 4
                this.actionVal = rng(3)
                this.desc = `${ico("time")}Charges an attack`

            }else if(key == 'charged strike'){

                this.actionVal = Math.round((gs.enObj.dice + gs.enObj.power) * 2) 
                this.desc = `${ico("attack")}Will crit for ${this.actionVal} dmg`

            }
            
            //Buff
             else if(key == 'fortify'){//+ def

                this.rate = 3
                this.stat = 'def'
                this.actionVal = Math.ceil((gs.enObj.roll) * 0.6)

                //Enable recovery if def is negative.
                if(gs.enObj.def < 0){
                    this.rate = 1
                    this.actionVal = gs.enObj.flatDef - gs.enObj.def
                }

                this.desc = `${ico('def-buff')} Will gain ${this.actionVal} def`

            }else if(key == 'empower'){//+ power

                this.rate = 3
                this.stat = 'power'
                this.actionVal = Math.ceil(gs.enObj.roll * 0.5) //floor becase negative numbers

                //Enable recovery if def is negative.
                if(gs.enObj.power < 0){
                    this.rate = 1
                    this.actionVal = gs.enObj.flatPower - gs.enObj.power
                }

                this.desc = `${ico('power-buff')} Will gain ${this.actionVal} power`

            }else if(key == 'rush'){   //+ dice

                this.rate = 3
                this.stat = 'dice'
                this.actionVal = Math.ceil(1 + (gs.stage * 0.25))

                //Enable recovery if def is negative.
                if(gs.enObj.dice < gs.enObj.flatDice){
                    this.rate = 1
                    this.actionVal = gs.enObj.flatDice - gs.enObj.dice
                }

                this.desc = `${ico('dice-buff')}Will gain +${this.actionVal} dice`

            }else if(key == 'recover'){//+ life

                //Enable if life lost
                if(gs.enObj.flatLife > gs.enObj.life){
                    this.rate = 4
                }

                this.stat = 'life'
                this.actionVal = gs.enObj.roll * 2
                this.desc = `${ico('life-buff')}Will heal for ${this.actionVal}`

            }

            //Curse
             else if(key == 'wound'){  //- def

                this.rate = 3
                this.stat = 'def'
                this.actionVal = Math.round((gs.enObj.roll) * 0.5)
                this.desc = `${ico('curse-def')}Will hex (-${this.actionVal} def)`

            }else if(key == 'weaken'){ //- power

                this.rate = 3
                this.stat = 'power'
                this.actionVal = Math.ceil((gs.enObj.roll) * 0.25)
                this.desc = `${ico('curse-power')}Will hex (-${this.actionVal} power)`

            }else if(key == 'slow'){   //- dice

                this.rate = 5
                this.stat = 'dice'
                this.actionVal = rng(2)
                this.desc = `${ico('curse-dice')}Will hex (-${this.actionVal} dice)`

            }else if(key == 'drain'){  //- life

                this.rate = 4
                this.stat = 'life'
                this.actionVal = Math.floor(gs.enObj.roll * 1.5)
                this.desc = `${ico('curse-life')}Will hex (-${this.actionVal} life)`

            }

            //Resolve negative stats actions
             else if(key == 'shatter'){  //Crit when player def is negative
                this.rate = 0
                this.stat = 'life'
                this.subStat = 'def'
                this.actionVal = Math.round(gs.plObj.def * 2)

                //Enable if def is negative.
                if(gs.plObj.def < -4){
                    this.rate = 1
                }

                this.desc = `${ico('spell')}Will cast Shatter(${this.actionVal} life)`
            }
             else if(key == 'shock'){  //Crit when player def is negative
                this.rate = 0
                this.stat = 'life'
                this.subStat = 'power'
                this.actionVal = Math.round(gs.plObj.power * 3)

                //Enable if def is negative.
                if(gs.plObj.power < -2){
                    this.rate = 1
                }

                this.desc = `${ico('spell')}Will cast Shock(${this.actionVal} life)`
            }

            //Misc
             else if (key == 'sleep'){
                let dialogueOptions = [
                    'Surrender!',
                    'Your end nears...',
                    "Accept your fate!",
                    "No mercy!",
                    "Feel my wrath!",
                    "You won't survive!",
                    "Surrender now!",
                    "Face oblivion!",
                    "Meet your doom!",
                    "Bow before me!",
                    "Prise the Hecatocore!",
                    "Dance, fool, dance!",
                    "My blade hungers.",
                    "Annihilation!",
                    "Chaos embraces you.",
                    "Face the nightmare.",
                    "SUFFER!",
                    "Hope is a lie.",
                    "Meet your reckoning.",
                    "Why so serious?",
                    "Face the truth!",
                    "Your head is mine!",
                ]
                this.rate = 4
                this.desc = `
                    ${ico("time")}<span class="italic">"${dialogueOptions[rng(dialogueOptions.length -1)]}"</span>
                `
            }
            
            //Debuff player item
            //     // "poi att":  {rate:1,   desc: `Will attack with poison for ${dmgVal}`},
            //     // "fire att": {rate:1,   desc: `Will attack with fire for ${dmgVal}`},
            //     // "recruits": {rate:1,   desc: `Will call reinforcements`},

            //     // "disarm":   {rate:1,   desc: `Will steal item used against it during the next turn`},
            //     // "theft":    {rate:1,   desc: `Will steal random item`},   
            //     // "consume":  {rate:1,   desc: `Enemy will consume a random consumable from targets inventory`},
            //     // "escape":   {rate:1,   desc: `Will escape`},  
        }
    }


//Pick enemy action
    function genEneAction(){

        //For testing: force action
            if(config.forceEnemyAction != undefined){
                gs.enObj.forcedAction = config.forceEnemyAction
            }
        
        //Next turn roll
            gs.enObj.roll = rng(gs.enObj.dice)         

        //Get actions from ene Obj
            let actionKeys = gs.enObj.profile.actionPool 

        //Generates all enemy actions.
            gs.enObj.actionRef = []
            actionKeys.forEach(key => {
                //Remove banned action
                    // console.log(key, gs.enObj.bannedAction);
                    if(gs.enObj.bannedAction != undefined && gs.enObj.bannedAction == key) return

                //Add actions from ref arr to enObj
                gs.enObj.actionRef.push(new EnemyActionObj(key))
            })

        //Pick action
            let actionRoll = rng(100)           //Roll for action chance.

        //Prevent action selection if enemy is charging an attack.
            if(gs.enObj.action != undefined && gs.enObj.action.key == 'charge'){
                
                gs.enObj.action.actionVal--
                gs.enObj.action.desc = `<span>Charges an attack<br><span class='w50'>(${gs.enObj.action.actionVal} turns)</span></span>`

                //Switch action to charged strike on cd 0
                if(gs.enObj.action.actionVal < 1){
                    gs.enObj.action = new EnemyActionObj('charged strike')
                }

            }else if(actionRoll < 2){           //R5: 1%

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 5))

            }else if(actionRoll < 7){           //R4: 5%

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 4))

            }else if(actionRoll < 25){          //R3: 18%

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 3))

            }else if(actionRoll < 55){          //R2: 30% 

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 2))

            }else{                              //R1: 45%

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 1))

            }

        //FORCED ACTIONS
            if(
                gs.enObj.forcedAction != "" //Check if forced action exists
            ){

                //Set action
                gs.enObj.action = new EnemyActionObj(gs.enObj.forcedAction)

                //Reset var
                gs.enObj.forcedAction = ""
            }
        
        //Resolve undefined actions due to lack of rate.
            if(gs.enObj.action == undefined) {
                //Pick the random lowest rate action

                gs.enObj.action = rarr(gs.enObj.actionRef.filter(action => action.rate == 1))

                //If there ara no rate 1 actions, pick random action
                //Due to wizards hand
                if(gs.enObj.action == undefined){
                    gs.enObj.action = rarr(gs.enObj.actionRef)
                }
            }
    }

//From main-and-combat.js
    //Enemy action logic
    function enemyActionLogic(){
        //State checkd. Deals with stun and extra actions.
        if(gs.enObj.state == 'Skip turn') return                gs.logMsg.push(`enemy skipped turn due to stun`)
        if(gs.sourceAction.actionType == "extra-action") return gs.logMsg.push(`enemy skipped turn due to extra action`)

        //Resolve actions.
        if      ('attack, combo, final strike, charged strike'.slice(', ').indexOf(gs.enObj.action.key) > -1){

            gs.enObj.dmgDone += gs.enObj.action.actionVal

        }else if('block'.slice(', ').indexOf(gs.enObj.action.key) > -1){

            gs.plObj.dmgDone -= gs.enObj.action.actionVal

        }else if('recover, rush, empower, fortify'.slice(', ').indexOf(gs.enObj.action.key) > -1){

            //Resolve stat change
            changeStat(gs.enObj.action.stat, gs.enObj.action.actionVal, 'enemy')

        }else if('wound, weaken, slow, drain'.slice(', ').indexOf(gs.enObj.action.key) > -1){   

            //Resolve stat change
            changeStat(gs.enObj.action.stat, -gs.enObj.action.actionVal, 'player')

        }else if('shatter, shock'.slice(', ').indexOf(gs.enObj.action.key) > -1){              
            
            //Resolve stat change
            changeStat(gs.enObj.action.stat, gs.enObj.action.actionVal, 'player')

            //Reset substat
            changeStat(gs.enObj.action.subStat, -gs.plObj[gs.enObj.action.subStat], 'player')
        }
        
        //Records previous action for ui updates.
        gs.enemyAction = gs.enObj.action 
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

