//Enemy
    class Enemy extends Character {
        constructor(){
            super()

            this.lvl = gs.stage //tileIdRef[1] prev. value.

            //Set boss or ene
            if (gs.playerLocationTile.boss){
                this.profile = pickEnemyProfile('boss')
            }
            else {
                this.profile = pickEnemyProfile('enemy')
            }

            //TESTING: Add specific enemy
            if(config.forceEnemyProfile !== undefined) {
                this.profile = profileRef[config.forceEnemyProfile[0]][config.forceEnemyProfile[1]]
            }

            //Set stats
            //Get column value to scale mobs
            let tileIdRef = []
            gs.playerLocationTile.tileId.split('-').forEach(val =>{
                tileIdRef.push(parseInt(val))
            })

            //Life
            this.life              = config.eneLife + Math.round((3 * this.lvl) * this.profile.lifeMod )

            //Power
            this.basePower         = 0 + Math.round((0.2 * this.lvl) * this.profile.powerMod)
            this.flatPower         = this.basePower
            this.power             = this.basePower

            //Def
            this.baseDef           = 0 + Math.round((0.2 * this.lvl) * this.profile.defMod)
            this.flatDef           = this.baseDef
            this.def               = this.baseDef

            this.reflect             = this.profile.reflect // Reflect mod

            //Override stats from profile obj
            if(typeof this.profile.statOverrides !== 'undefined'){

                this.profile.statOverrides.forEach(stat =>{
                    let statArr = stat.split('-')
                    this[statArr[0]] = statArr[1] * 1
                })
            }

                //Add item
            if(typeof this.profile.inventory !== 'undefined') {
                this.profile.inventory.forEach(itemName => {
                    addItem(itemName, undefined, this.inventory)
                })
            }
            else{
                addItem("sword", undefined, this.inventory)
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

    let profileRef = {
        enemy: {
              balanced:  {
                profileId: 'balanced',
                lifeMod:  1,
                powerMod: 1,
                defMod:   1,
                inventory: ['sword', 'shield'],

            },assassin:  {
                profileId: 'assassin',
                lifeMod:  0.75,
                powerMod: 2,
                defMod:   1,
                inventory: ['dagger'],

            },tank:      {
                profileId: 'tank',
                lifeMod:  2.5,
                powerMod: 0.5,
                defMod:   3.5,
                inventory: ['sword', 'shield', 'gambison'],


            },minion:    {
                profileId: 'minion',
                lifeMod:    1,
                powerMod: 0.5,
                defMod:   0.5,
                inventory: ['sword', 'staff'],

            },mage:      {
                profileId: 'mage',
                lifeMod:  1,
                powerMod: 1,
                defMod:   1,

            },gladiator: {
                profileId: 'gladiator',
                lifeMod:  1.5,
                powerMod: 0.5,
                defMod:   0.5,
                reflect:  100,

            }

        },
        boss: {
              boss0:     {//stage 0 (strong unit)
                profileId: 'boss0',
                lifeMod:  3,
                powerMod: 2,//required for final strike
                defMod:   2,
                statOverrides: [
                    'def-0',
                    'power-0',
                    'life-12'
                ],

            },boss1:     {//stage 1 (strong unit)
                profileId: 'boss1',
                lifeMod:  3,
                powerMod: 2,//required for final strike
                defMod:   2,
                statOverrides: [
                    'def-2',
                    'power-2',
                    'life-20'
                ]
            },boss2:     {//stage 2 (pwoer control)
                profileId: 'boss2',
                lifeMod:  3,
                statOverrides: [
                    'def-0',
                    'power-5',
                    'life-20'
                ]
            },boss3:     {//stage 3 (def control)
                profileId: 'boss3',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-10',
                    'life-30'
                ]
            },boss4:     {//stage 4 (dice control)
                profileId: 'boss4',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-5',
                    'life-60'
                ]
            },boss5:     {//stage 5 (hp check)
                profileId: 'boss5',
                lifeMod:  3,
                statOverrides: [
                    'def-0',
                    'power-0',
                    'life-100'
                ]
            },boss6:     {//stage 6 (dice control)
                profileId: 'boss6',
                lifeMod:  3,
                powerMod: 2,
                statOverrides: [
                    'def-10',
                    'power-10',
                    'life-100'
                ]
            }
        }
    }