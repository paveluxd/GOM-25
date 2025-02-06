//Player
class PlayerObj {
    constructor(){
        //Life
            this.baseLife          = config.life   //Lvl 1 char life
            this.flatLifeMod       = 0
            this.flatLife          = this.baseLife //Life cap.
            this.life              = this.baseLife //Current life.

            this.dmgDone           = 0
            this.dmgTaken          = 0
            this.lifeChange        = 0
            this.lifeChangeMarker  = false
        //Power
            this.basePower         = config.power
            this.flatPower         = this.basePower
            this.power             = this.basePower
            this.powerChange       = 0
            this.powerChangeMarker = false
        //Def
            this.baseDef           = config.def
            this.flatDef           = this.baseDef
            this.def               = this.baseDef
            this.defChange         = 0
            this.defChangeMarker   = false
        //Dice
            this.baseDice          = config.dice //needed as ref in case flat dice is modified by item
            this.flatDice          = this.baseDice
            this.dice              = this.baseDice
            this.diceChange        = 0
            this.diceChangeMarker  = false
        //Roll
            this.roll              = 0
            this.rollBonus         = 0
            this.rollChange        = 0
            this.rollChangeMarker  = false

        //While in combat
            this.piercing          = false
            this.swordDmgMod       = 0
            this.poisonBuff        = false
            this.combatState       = {"dmgCap":undefined}
            
        //Inventory
            this.inventorySlots = config.inventory
            this.inventory      = [] //Items gained as rewards
        //Equipment slots
            this.baseSlots      = config.slots
            this.equipmentSlots = this.baseSlots //Modified by items
        //Actions
            this.actionSlots    = this.baseSlots
            this.actions        = [] //Actions gained from items
            this.tempActions    = [] //Temporary actions
                        
        //Sub-stats
            this.coins          = config.coins

        //Progression
            this.exp            = 0
            this.lvl            = 1
            this.lvlUpExp       = Math.ceil(config.expBase * (this.lvl * config.expMult) ** config.expExpo)
            this.treeNodes      = []
            this.treePoints     = config.basePassieSkillPoints
        //Misc
            this.offeredItemsArr= [] //Stores rewards
            this.class          = config.class
            this.startingItems  = config['st' + upp(this.class)]

        //Class overrides
            if(      this.class == 'guardian'){
                this.baseLife          = config.life        //Lvl 1 char life
                this.flatLife          = this.baseLife      //Life cap.
                this.life              = this.baseLife      //Current life.

                this.baseDice          = 4 //needed as ref in case flat dice is modified by item
                this.flatDice          = this.baseDice
                this.dice              = this.baseDice
            }else if(this.class == 'crusader'){
                this.baseLife          = config.life - 5   //Lvl 1 char life
                this.flatLife          = this.baseLife      //Life cap.
                this.life              = this.baseLife      //Current life.

                this.inventorySlots    = config.inventory - 5
            }else if(this.class == 'wanderer'){
                this.baseLife          = config.life - 10   //Lvl 1 char life
                this.flatLife          = this.baseLife      //Life cap.
                this.life              = this.baseLife      //Current life.

                this.baseDice          = 8 //needed as ref in case flat dice is modified by item
                this.flatDice          = this.baseDice
                this.dice              = this.baseDice

                this.coins             = config.coins + 10
                this.inventorySlots    = config.inventory - 10
            }
    }
}

function checkIfPlayerCanAttack(){

    //Check if player has an attack action
    let attack = false

    // console.log(gs.plObj.actions);
    gs.plObj.actions.forEach(action => {
        action.tags.split(', ').forEach(tag => {
            if(tag == 'attack'){
                attack = true
            }
        })
    })

    if(attack == false){
        // console.log(findByProperty(actionsRef, 'keyId', 'a62'));
        // gs.plObj.actions.unshift(findByProperty(actionsRef, 'keyId', 'a62'))
        gs.plObj.actions.unshift(new ActionObj('punch'))
    }

    //Add punch to actions
}

//* COMBAT MISC
function resetFlatStats(){
    //4.Set stats before combat
    //Restore sword dmg buff
    gs.plObj.swordDmgMod = 0

    //Restore flat def
    if(gs.plObj.def !== gs.plObj.flatDef){
        gs.plObj.def = gs.plObj.flatDef
    }

    //Restore flat power
    if(gs.plObj.power !== gs.plObj.flatPower){//see if power should stay betweeen combats, set sign to <
        gs.plObj.power = gs.plObj.flatPower
    } 

    //Recalc all items and actions
    resolvePlayerStats()
}

//Experience and level
function resolveExpAndLvl(expAmounth){
    //Add 1 exp for winning
    gs.plObj.exp += expAmounth  
    
    //TREE: On exp gain passives
    resolveOnStatChangePassives('exp')                            
    
    //Lvl up
    if(gs.plObj.exp >= gs.plObj.lvlUpExp){
        levelUp()
    }
    
    //-1 for initial lvl 1
    gs.plObj.treePoints = gs.plObj.lvl - gs.plObj.treeNodes.length - 1

    //Changes button color when you have skill points
    lvlupUiIndication()
}

function levelUp(){

    gs.plObj.lvl++

    //Reduce exp by elp required to lvl up
    gs.plObj.exp = gs.plObj.exp - gs.plObj.lvlUpExp

    //Calculate exp required for the next level
    gs.plObj.lvlUpExp = Math.ceil(config.expBase * (gs.plObj.lvl * config.expMult) ** config.expExpo)

    //Check exp to see if more than 1 level was gained
    resolveExpAndLvl(0)
}


//Resolve stats
    //Recalc stats 
    //Adds actions from items
    //Adds passive stats from items,actions and skill tree
    function resolvePlayerStats(){


        //Resets actions
        //Regen action list if the item was added, removed, equipped, unequipped
        gs.plObj.actions = []

        //Adds actions from items to players actions array.
        gs.plObj.inventory.forEach(item => {

            //Check all equipped items
            if(item.equipped){

                //Add all actions from equipped item.
                item.actions.forEach(action => {
                    if(gs.plObj.actionSlots < gs.plObj.actions.length) return
                    if(action.actionCharge < 1) return

                    //Add action to player actions
                    gs.plObj.actions.push(action)  
                })
            }
        })

        //Add temporary actions to players actions array.
        gs.plObj.tempActions.forEach(action => {
            if(gs.plObj.actionSlots > gs.plObj.actions.length){
                gs.plObj.actions.push(action)
            }
        })


        //Resolve life  
        //Add reclaculation for all stats
        let baseLife       = gs.plObj.baseLife + gs.plObj.flatLifeMod //Flat life mod for max life spell fx
        let flatLife       = 0
        let lifeMultiplier = 1
        let lifeDeviation  = gs.plObj.life - gs.plObj.flatLife// See if temporary bonuses should be included.

        let basePower      = gs.plObj.basePower
        let flatPower      = 0
        let powerDeviation = gs.plObj.power - gs.plObj.flatPower

        let baseDef        = gs.plObj.baseDef
        let flatDef        = 0
        let defDeviation   = gs.plObj.def - gs.plObj.flatDef

        let baseDice       = gs.plObj.baseDice
        let flatDice       = baseDice
        let diceDeviation  = gs.plObj.dice - gs.plObj.flatDice

        let flatSlots      = gs.plObj.baseSlots

        let flatInv        = gs.plObj.inventorySlots

        //Extracts stats from item or passive skill tree node
        function extractPassiveStats(obj){{
            obj.passiveStats.forEach(statObj => {
        
                //Flat life
                if(     statObj.stat == 'life'){
                    flatLife += statObj.value
                }
                //% life
                else if(statObj.stat == 'life%'){
                    lifeMultiplier += (statObj.value / 100)
                }
                //Flat power
                else if(statObj.stat == 'power'){
                    flatPower += statObj.value
                }
                //Def
                else if(statObj.stat == 'def'){
                    flatDef += statObj.value
                }
                //Replace dice
                else if(statObj.stat == 'dice'){
                    flatDice = statObj.value
                }
                //Mod dice
                else if(statObj.stat == 'dice-mod'){
                    flatDice += statObj.value
                }
                //Item slots
                else if(statObj.stat == 'slots'){
                    flatSlots += statObj.value
                }
                //Inventory
                else if(statObj.stat == 'inventory'){
                    flatInv += statObj.value
                }
            })
        }}

        //Check items
        gs.plObj.inventory.forEach(item => {
            if(item.passiveStats.length > 0 && item.equipped){
                extractPassiveStats(item)
            }
        })

        //Check actions
        gs.plObj.actions.forEach(action => {
            if(action.passiveStats.length > 0){
                extractPassiveStats(action)
            }
        })

        //Check skill tree nodes
        gs.plObj.treeNodes.forEach(node => {
            if(node.passiveStats !== undefined && node.passiveStats.length > 0){
                extractPassiveStats(node)
            }
        })

        //Life final calculation
        //(base + flat) + deviation + temporary
        gs.plObj.flatLife= Math.round((baseLife + flatLife) * lifeMultiplier)
        gs.plObj.life = gs.plObj.flatLife+ lifeDeviation  

        //Power final calculation
        //(base + flat) + deviation + temporary
        gs.plObj.powerUnrounded = basePower + flatPower
        gs.plObj.flatPower      = basePower + Math.floor(flatPower)
        gs.plObj.power          = gs.plObj.flatPower + powerDeviation

        //Def final calc
        gs.plObj.defUnrounded   = baseDef + flatDef
        gs.plObj.flatDef        = baseDef + Math.floor(flatDef)
        gs.plObj.def            = gs.plObj.flatDef + defDeviation

        //Dice
        gs.plObj.diceUnrounded  = flatDice
        gs.plObj.flatDice       = Math.floor(flatDice)
        gs.plObj.dice           = gs.plObj.flatDice + diceDeviation

        //Slots 
        gs.plObj.equipmentSlots = Math.floor(flatSlots)
        gs.plObj.actionSlots    = Math.floor(flatSlots)

        //Inventory
        gs.plObj.inventorySlots = Math.floor(flatInv)
    }


//CHARACTER
    //Splits fractions into two strings for UI styling purposes
    function sFrac(fraction){
        let arr = fraction.toString().split(".")
        if (arr[1] == undefined){
            arr[1] = ""
        } else {
            arr[1] = `.${arr[1]}`
        }

        return arr
    }
    function syncCharPage(){
        
        //Add text
        //Update each value

        //sFrac() and unrounded values are used to display digits after the decimal point in a different style.
        // el('.flatDice').innerHTML       = gs.plObj.flatDice

        el('.life').innerHTML           = gs.plObj.life
        el('.flatLife').innerHTML       = gs.plObj.flatLife
        el('.flatDice').innerHTML       = `${sFrac(gs.plObj.diceUnrounded)[0]}<span class="w50">${sFrac(gs.plObj.diceUnrounded)[1]}</span>`
        el('.power').innerHTML          = `${sFrac(gs.plObj.powerUnrounded)[0]}<span class="w50">${sFrac(gs.plObj.powerUnrounded)[1]}</span>`
        el('.def').innerHTML            = `${sFrac(gs.plObj.defUnrounded)[0]}<span class="w50">${sFrac(gs.plObj.defUnrounded)[1]}</span>`

        
        el('.equipmentSlots').innerHTML = `${calcEquippedItems()}/${gs.plObj.equipmentSlots}` //eq slots
        el('.coins').innerHTML          = gs.plObj.coins
        el('.inventory').innerHTML      = `${gs.plObj.inventory.length}/${gs.plObj.inventorySlots}`//inventory
        el('.level').innerHTML          = gs.plObj.lvl
        el('.exp').innerHTML            = `${gs.plObj.exp}/${gs.plObj.lvlUpExp}`//exp

        el('.stage').innerHTML          = gs.stage
        el('.playerClass').innerHTML    = upp(gs.plObj.class)


        //Add action cards
        el('action-list').innerHTML = ``
        el('passive-list').innerHTML = ``

        gs.plObj.actions.forEach(action => {
            if(action.actionType != 'passive'){
                el('action-list').append(genActionCard(action, 'card'))
            } else {
                el('passive-list').append(genActionCard(action, 'card'))
            }         
        })


        //Hide passives label if no passives
        if(el('passive-list').childNodes.length < 1){
            el('passives-label').classList.add('hide')
        }else{
            el('passives-label').classList.remove('hide')
        }
    }

    function playerClassSelection(){
        if(typeof gs == 'undefined'){
            el('state-screen').innerHTML = `
            <div class="char-selection modal-container">

                <div id='char-text-container'>
                    <h1 id="char-heading">
                        Choose a class
                    </h1>
                    <p  id="char-description" class="body-14">
                        Tap the character below
                    </p>
                </div>
                
                <div id='characters'>
                    <button id='guardian-button' onclick="showCharDetails('guardian')">
                        <div class="generic-sprite">
                            <img src="./img/character/guardian-back.svg">
                            <img src="./img/character/guardian-back-arm.svg">
                            <img src="./img/character/guardian-legs.svg">
                            <img src="./img/character/guardian-torso.svg">
                            <img src="./img/character/guardian-front-arm.svg">
                            <img src="./img/character/guardian-head.svg">
                        </div>
                    </button>
                    
                    <button id='crusader-button' onclick="showCharDetails('crusader')">
                    <div class="generic-sprite">
                        <img src="./img/character/crusader-back.svg">
                        <img src="./img/character/crusader-back-arm.svg">
                        <img src="./img/character/crusader-legs.svg">
                        <img src="./img/character/crusader-torso.svg">
                        <img src="./img/character/crusader-front-arm.svg">
                        <img src="./img/character/crusader-head.svg">
                    </div>
                    </button>
                    
                    <button id='wanderer-button' onclick="showCharDetails('wanderer')">
                    <div class="generic-sprite flip">
                        <img src="./img/character/wanderer-back.svg">
                        <img src="./img/character/wanderer-back-arm.svg">
                        <img src="./img/character/wanderer-legs.svg">
                        <img src="./img/character/wanderer-torso.svg">
                        <img src="./img/character/wanderer-front-arm.svg">
                        <img src="./img/character/wanderer-head.svg">
                    </div>
                    </button>
                </div>
                
                <button id="char-select-button" class="btn-frame hide" onclick="config.class = 'guardian', initGame()">
                    Continue
                </button>

                <img class='char-bg' src="./img/bg/char-select.svg">

            </div>
            `
        }
        else{
            initGame()
        }
    }

    function showCharDetails(char){

        clearClassOfAll('char-highlight')

        if      (char == 'guardian'){
            el('char-heading').innerHTML = 'Guardian'
            el('char-description').innerHTML = 'Uses d4, specializes in defense.'
        }
        else if (char == 'crusader'){
            el('char-heading').innerHTML = 'Crusader'
            el('char-description').innerHTML = 'Uses d6, specializes in survival.'
        }
        else if (char == 'wanderer'){
            el('char-heading').innerHTML = 'Wanderer'
            el('char-description').innerHTML = 'Uses d8, specializes in poisons.'
        }

        el(`${char}-button`).classList.add('char-highlight')

        el('char-select-button').setAttribute('onclick',`config.class = '${char}', initGame()`)
        el('char-select-button').classList.remove('hide')

    }