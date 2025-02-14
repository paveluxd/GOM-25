class Character {
    constructor() {
        //Life
        this.baseLife          = config.life   //Lvl 1 char life
        this.flatLifeMod       = 0
        this.flatLife          = this.baseLife //Life cap.
        this.life              = this.baseLife //Current life.
        this.lifeChange        = 0
        this.lifeChangeMarker  = false

        //Dmg
        this.dmgDone           = 0
        this.dmgTaken          = 0

        //Crit
        this.baseCritChance    = 0
        this.critChance        = 0
        this.critMultiplier    = 2

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

        //While in combat
        this.piercing          = false
        this.swordDmgMod       = 0
        this.poisonBuff        = false
        this.combatState       = {"dmgCap":undefined}

        //FROM ENEMY CLASS REVIEW
        //Dots - move to array
        this.appliedPoisonStacks = 0
        this.poisonStacks        = 0
        this.appliedBurnStacks   = 0
        this.burnStacks          = 0
        this.state               = ''                   // Used for stun, fear etc.
        this.forcedAction        = ''                   // For items that force acions

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
    }
}

//PLAYER
    class Player extends Character {
        constructor(){
            super()

            //Class overrides
            if     (this.class === 'guardian'){
                this.baseLife          = config.life        //Lvl 1 char life
                this.flatLife          = this.baseLife      //Life cap.
                this.life              = this.baseLife      //Current life.

                this.baseDice          = 4 //needed as ref in case flat dice is modified by item
                this.flatDice          = this.baseDice
                this.dice              = this.baseDice
            }
            else if(this.class === 'crusader'){
                this.baseLife          = config.life - 5   //Lvl 1 char life
                this.flatLife          = this.baseLife      //Life cap.
                this.life              = this.baseLife      //Current life.

                this.inventorySlots    = config.inventory - 5
            }
            else if(this.class === 'wanderer'){
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

//* COMBAT MISC
    function resetFlatStats(){

    //4.Set stats before combat

    //Restore flat def
    if(gs.plObj.def !== gs.plObj.flatDef){
        gs.plObj.def = gs.plObj.flatDef
    }

    //Restore flat power
    if(gs.plObj.power !== gs.plObj.flatPower){//see if power should stay betweeen combats, set sign to <
        gs.plObj.power = gs.plObj.flatPower
    } 

    //Recalc all items and actions
    resolveStats(gs.plObj)
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
    //Recalculates stats
    //Adds actions from items
    //Adds passive stats from items,actions and skill tree
    function resolveStats(target){

        //Resets actions
        //Regen action list if the item was added, removed, equipped, unequipped
        target.actions = []

        //Adds actions from items to players actions array.
        target.inventory.forEach(item => {

            //Check all equipped items
            if(item.equipped){

                //Add all actions from equipped item.
                item.actions.forEach(action => {
                    if(target.actionSlots < target.actions.length) return
                    if(action.actionCharge < 1) return

                    //Add action to player actions
                    target.actions.push(action)  
                })
            }
        })

        //Add temporary actions to players actions array.
        target.tempActions.forEach(action => {
            if(target.actionSlots > target.actions.length){
                target.actions.push(action)
            }
        })


        //Resolve life  
        //Add reclaculation for all stats
        let baseLife               = target.baseLife + target.flatLifeMod //Flat life mod for max life spell fx
        let flatLife       = 0
        let lifeMultiplier = 1
        let lifeDeviation  = target.life - target.flatLife// See if temporary bonuses should be included.

        let basePower              = target.basePower
        let flatPower      = 0
        let powerDeviation = target.power - target.flatPower

        let baseDef                = target.baseDef
        let flatDef        = 0
        let defDeviation   = target.def - target.flatDef

        let flatSlots      = target.baseSlots
        let flatInv        = target.inventorySlots

        //Crit
        let baseCritChance = target.baseCritChance

        //Extracts stats from item or passive skill tree node
        function extractPassiveStats(obj){{
            obj.passiveStats.forEach(statObj => {
        
                //Flat life
                if(     statObj.stat === 'life'){
                    flatLife += statObj.value
                }
                //% life
                else if(statObj.stat === 'life%'){
                    lifeMultiplier += (statObj.value / 100)
                }
                //Flat power
                else if(statObj.stat === 'power'){
                    flatPower += statObj.value
                }
                //Crit chance
                else if(statObj.stat === 'critChance'){
                    baseCritChance += statObj.value
                }
                //Def
                else if(statObj.stat === 'def'){
                    flatDef += statObj.value
                }
                //Item slots
                else if(statObj.stat === 'slots'){
                    flatSlots += statObj.value
                }
                //Inventory
                else if(statObj.stat === 'inventory'){
                    flatInv += statObj.value
                }
            })
        }}

        //Check items
        target.inventory.forEach(item => {
            if(item.passiveStats.length > 0 && item.equipped){
                extractPassiveStats(item)
            }
        })

        //Check actions
        target.actions.forEach(action => {
            if(action.passiveStats.length > 0){
                extractPassiveStats(action)
            }
        })

        //Check skill tree nodes
        target.treeNodes.forEach(node => {
            if(node.passiveStats !== undefined && node.passiveStats.length > 0){
                extractPassiveStats(node)
            }
        })

        //Life final calculation
        //(base + flat) + deviation + temporary
        target.flatLife= Math.round((baseLife + flatLife) * lifeMultiplier)
        target.life = target.flatLife+ lifeDeviation  

        //Power final calculation
        //(base + flat) + deviation + temporary
        target.powerUnrounded = basePower + flatPower
        target.flatPower      = basePower + Math.floor(flatPower)
        target.power          = target.flatPower + powerDeviation

        //Def final calc
        target.defUnrounded   = baseDef + flatDef
        target.flatDef        = baseDef + Math.floor(flatDef)
        target.def            = target.flatDef + defDeviation

        //Slots 
        target.equipmentSlots = Math.floor(flatSlots)
        target.actionSlots    = Math.floor(flatSlots)

        //Inventory
        target.inventorySlots = Math.floor(flatInv)

        //Crit
        target.critChance     = Math.round(baseCritChance)
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
        el('.power').innerHTML          = `${sFrac(gs.plObj.powerUnrounded)[0]}<span class="w50">${sFrac(gs.plObj.powerUnrounded)[1]}</span>`
        el('.def').innerHTML            = `${sFrac(gs.plObj.defUnrounded)[0]}<span class="w50">${sFrac(gs.plObj.defUnrounded)[1]}</span>`

        
        el('.equipmentSlots').innerHTML = `${calcEquippedItems()}/${gs.plObj.equipmentSlots}` //eq slots
        el('.coins').innerHTML          = gs.plObj.coins
        el('.inventory').innerHTML      = `${gs.plObj.inventory.length}/${gs.plObj.inventorySlots}`//inventory
        el('.level').innerHTML          = gs.plObj.lvl
        el('.exp').innerHTML            = `${gs.plObj.exp}/${gs.plObj.lvlUpExp}`//exp

        el('.stage').innerHTML          = gs.stage
        el('.playerClass').innerHTML    = upp(gs.plObj.class)

        //Crit
        el('.critChance').innerHTML     = gs.plObj.critChance


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

        if      (char === 'guardian'){
            el('char-heading').innerHTML = 'Guardian'
            el('char-description').innerHTML = 'Uses d4, specializes in defense.'
        }
        else if (char === 'crusader'){
            el('char-heading').innerHTML = 'Crusader'
            el('char-description').innerHTML = 'Uses d6, specializes in survival.'
        }
        else if (char === 'wanderer'){
            el('char-heading').innerHTML = 'Wanderer'
            el('char-description').innerHTML = 'Uses d8, specializes in poisons.'
        }

        el(`${char}-button`).classList.add('char-highlight')

        el('char-select-button').setAttribute('onclick',`config.class = '${char}', initGame()`)
        el('char-select-button').classList.remove('hide')

    }

    //Trigger ghost animation
    function triggerCombatGhosts(source){
        //Trigger ghost animation
        el('e-ghost').setAttribute('style',`transform: scale(-1, 1);`) //flip ene

        if (source === gs.plObj){
            el('p-ghost').setAttribute('src',`./img/character/ghost-${rng(4)}.svg`)
            runAnim(el(`p-ghost`), 'ghost-trigger')
        }
        if(source === gs.enObj){
            el('e-ghost').setAttribute('src',`./img/character/ghost-${rng(4)}.svg`)
            runAnim(el('e-ghost'), 'ghost-trigger')
        }
    }