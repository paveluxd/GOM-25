//Actions DATA
    class ActionObj {
        constructor(actionKey){
            //Static props
            this.actionKey = actionKey
            

            //Variable properties generated
            let props = [
                {key:'actionName'  ,val: upp(actionKey)},
                {key:'actionId'    ,val: "ac" + Math.random().toString(8).slice(2)},//gens unique id
                {key:'actionCharge',val: 10},
                {key:'actionMod'   ,val: 0},
                {key:'cooldown'    ,val: undefined},
                {key:'actionType'  ,val: 'generic'},
                {key:'desc'        ,val: ''},
                {key:'passiveStats',val: []},
                {key:'keyId'       ,val: '???'},
                {key:'tags'        ,val: ''}
            ]

            //Resolves extra props
            props.forEach(property => {

                // console.log(property)

                //Find action by actionName
                let actionData = findByProperty(actionsRef, 'actionName', actionKey)

                //if no prop, set it to extra props vlaue
                if(typeof actionData[property.key] == 'undefined' || actionData[property.key] == ''){

                    this[property.key] = property.val 

                }
                //Randomize AC values
                else if (property.key == 'actionCharge') {
                    let actionChargeValue = rng(actionData[property.key], actionData[property.key] * config.chargeFloor)
                    if(actionChargeValue < 1){actionChargeValue = 1}
                    this[property.key] = actionChargeValue 
                } 
                //if exists in ref, set it as in ref.
                else {
                    this[property.key] = actionData[property.key] 
                }

                //Set action charge of all passive items to 1.
                if(actionData.actionType === 'passive' && property.key === 'actionCharge'){
                    this.actionCharge = 1 
                } 


            })

            // this.actionCharge = 100 //for testing

            //Static props
            this.flatActionCharge = this.actionCharge

        }  
    }

    //LOGIC: player
    class ActionLogic {

        //Attack
        a62(){// punch
            gs.plObj.dmgDone += gs.sourceAction.actionMod + gs.plObj.power
        }
        a45(){// club attack

            gs.plObj.dmgDone += 3 + gs.plObj.power
        }
        a1(){ // mace

            gs.plObj.dmgDone += gs.sourceAction.actionMod + gs.plObj.power

            if(gs.plObj.roll == 4){
                //Resolve stat change
                changeStat('def', 1, 'player')
                gs.logMsg.push('Mace: +1 def.')
            }
        }
        a2(){ // hammer "armor break"

            //Get reduction value
            let defReduction = gs.plObj.def
            if(defReduction < 1){defReduction = 0}

            //Resolve stat change
            changeStat('def', -defReduction, 'enemy') 
            changeStat('def', -1, 'player') 
        }
        a3(){ // shards "book of moon" 

            //Action cost
            if(gs.plObj.power < 1) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -1, 'player') 

            //Calc total dmg
            let mult = gs.plObj.actionSlots - gs.plObj.actions.length 
            if(mult < 1){mult = 0}
        
            //Damage
            gs.plObj.dmgDone += (gs.sourceAction.actionMod + gs.plObj.power) * mult
        }
        a4(){ // dagger pair 

            //Calc
            gs.plObj.dmgDone += (gs.sourceAction.actionMod + gs.plObj.power) * 2
        }
        a5(){ // bow

            //Calc
            gs.plObj.dmgDone += gs.plObj.roll + gs.plObj.power
        }
        a6(){ // cut 'dagger'

            //Action cost check
            if(gs.plObj.roll < 3) return showAlert('Action requires roll greater than 2.')
            
            //Resolve stat change
            changeStat('roll', -3, 'player') 

            //Damage
            gs.plObj.dmgDone = gs.sourceAction.actionMod + gs.plObj.power 
        }
        a7(){ // sword attack 

            gs.plObj.dmgDone += gs.sourceAction.actionMod + gs.plObj.power + gs.plObj.swordDmgMod

            console.log(gs.sourceAction.actionMod, gs.plObj.power, gs.plObj.swordDmgMod);
            if(gs.plObj.roll == 5 || gs.plObj.roll == 6){
                gs.plObj.swordDmgMod += 1
            }
        }
        a8(){ // "axe" 

            //Cost
                //Deal with negative power
                let powerMod = gs.plObj.power
                if (powerMod < 0){powerMod = 0}

                //Pay cost
                changeStat('life', (gs.sourceAction.actionMod + powerMod) * -1, 'player') 

            //Dmg calc
                //Deal with overcap life, sets max life to current life
                let maxLife = gs.plObj.life 
    
                //If max life is lower than max life pre combat, set max life to pre combat value
                if(gs.plObj.flatLife > gs.plObj.life){maxLife = gs.plObj.flatLife}

                //Dmg calc
                gs.plObj.dmgDone += Math.ceil((gs.plObj.flatLife - gs.plObj.life)/2)
        }
        a9(){ // ice lance "book of ice"

            //Action cost
            if(gs.plObj.power < 1) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -1, 'player') 

            //Dmg
            gs.plObj.dmgDone += gs.plObj.power
        }
        a10(){// backstab "iron dagger"

            //Resolve action cost
            if(gs.plObj.roll < 5) return showAlert('Action requires roll greater than 5.')
            
            // else if(gs.plObj.roll < 5 && gs.plObj.actions.length === 1){
            //     showAlert('You had no resources to perform your only action, your turn was skipped.');
            // } 

            gs.plObj.roll -= 5
            gs.plObj.dmgDone = gs.sourceAction.actionMod + gs.plObj.power
            gs.plObj.power += 1
        }
        a63(){// spear

            let dmg = gs.plObj.roll + gs.plObj.power
            if(dmg > gs.sourceAction.actionMod){dmg = gs.sourceAction.actionMod}

            //Calc
            gs.plObj.dmgDone += dmg
        }
        a64(){// sickle

            //Calc
            gs.plObj.dmgDone += 1 + gs.plObj.power

            //Apply poison stacks
            gs.enObj.appliedPoisonStacks += gs.sourceAction.actionMod
        }
        a65(){// great axe

            //Calc
            let dmg = Math.ceil(gs.enObj.life * (gs.sourceAction.actionMod / 100 + 0.05 * gs.plObj.power))
            if(dmg < 1){dmg = 1}
            gs.plObj.dmgDone += dmg

        }
        a54(){// "inferno" "bomb assembly kit"

            //Dmg
            gs.plObj.dmgDone += gs.plObj.power * gs.plObj.coins

            //Cost
            gs.plObj.coins = 0
        }
        a72(){// "burn" torch

            //Apply burning stacks
            if(gs.enObj.appliedBurnStacks < gs.sourceAction.actionMod){
                gs.enObj.appliedBurnStacks = gs.sourceAction.actionMod
            }
        }

        //Spells (rework)
        a11(){// lightning "book of lightning"

            //Action cost
            if(gs.plObj.power < 2) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -2, 'player') 

            //Dmg
            let dmgVal = rng(20) + gs.plObj.power
            gs.plObj.dmgDone += dmgVal
        }
        a13(){// fireball  "book of fire"
            gs.plObj.dmgDone += gs.sourceAction.actionMod + gs.plObj.power
        }
        a14(){// pyroblast "book of fire"

            //Action cost
            if(gs.plObj.power < 1) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -1, 'player') 

            //Dmg
            gs.plObj.dmgDone += gs.plObj.power * gs.plObj.roll
        }
        a26(){// freeze (stun spell) "book of ice"

            //Action cost
            if(gs.plObj.power < 1) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -1, 'player') 

            gs.enObj.state = 'Skip turn'
        }

        //Defensive
        a42(){// 'block' 'shield'
            gs.enObj.dmgDone -= gs.plObj.roll
        }
        a69(){// 'defend' 'wooden shield'
            gs.enObj.dmgDone -= gs.sourceAction.actionMod
        }
        a71(){// 'side block' 'kite shield'

            gs.enObj.dmgDone -= gs.sourceAction.actionCharge
        }
        a12(){// "spiked shield" bash
            
            //+def
            changeStat('def', 1, 'player')

            //Stun on roll 1
            if(gs.plObj.roll == 1){
                gs.enObj.state = 'Skip turn'
            }
        }
        a15(){// quick block "tower shield"

            gs.enObj.dmgDone -= gs.sourceAction.actionMod - gs.plObj.dice
        }
        a16(){// barrier
            
            gs.plObj.protection = ['Barrier']
            gs.sourceAction.cooldown = -1
        }
        a35(){// dodge % evasion "leather cape"

            let dodgePercent = 35 + gs.plObj.roll * gs.sourceAction.actionMod
            let dodgeRoll = rng(100)

            if(dodgeRoll < dodgePercent){
                gs.enObj.dmgDone = -99999 // add something better for dodge later
            }
        }
        a38(){// tank "helmet"

            //Set dmg cap property
            gs.plObj.combatState.dmgCap = gs.plObj.roll

            //Trigger cd
            gs.sourceAction.cooldown = -1

            //Set variable cooldown.  
            let referenceActionObj = findByProperty(actionsRef, 'keyId', gs.sourceAction.keyId) //Find action reference
            referenceActionObj.cooldown = rng(4,2)
        }
        a60(){// heavy block "towershield"
            gs.enObj.dmgDone -= gs.plObj.def * (gs.sourceAction.actionMod/100)
        }

        //Healing
        a33(){// healing potion
            
            //Heal value
            gs.lifeRestoredByPlayer += Math.round((gs.plObj.flatLife - gs.plObj.life) / 100 * gs.sourceAction.actionMod) 
        }
        a61(){// bandages
            
            //Heal value
            gs.lifeRestoredByPlayer += gs.sourceAction.actionMod
        }
        a57(){// "heal" "book of order"

            //Cost
            if(gs.plObj.power < 0) return showAlert('Not enough power to pay for action cost.')
            
            //Resolve stat change
            changeStat('power', -1, 'player') 

            gs.lifeRestoredByPlayer += gs.sourceAction.actionMod + gs.plObj.power + gs.plObj.def
        }

        //Utility
        a18(){// preparation "boots" (keep 50% of roll)

            //Value
            gs.plObj.rollBonus += Math.ceil(gs.plObj.roll * 0.5)
        }
        a19(){// reroll

            //Val
            gs.plObj.roll = rng(gs.plObj.dice)

            //PASSIVE: check for on-roll passives.
            resolvePostRollPassives()
        }
        a20(){// "scroll of repetition"
            //Restores charge to all items
            gs.plObj.inventory.forEach(item => {
                item.actions.forEach(action => {
                    if(action.paKeyId !== 'a20'){
                        action.actionCharge += gs.sourceAction.actionMod
                    }
                })
            })
        }
        a25(){// stun "chain"

            if(gs.plObj.roll != 1) return showAlert('Action requires roll 1.')

            gs.enObj.state = 'Skip turn'
        }
        a47(){// stun: smoke bomb

            // if(['attack', 'combo', 'final strike', 'charged strike'].indexOf(gs.enObj.action.paKey) > -1) showAlert(`Smoke bomb failed vs attack.`)
            gs.enObj.state = 'Skip turn'
        }
        a41(){// weapon poison
            
            //Marker
            gs.plObj.poisonBuff = true
        }
        a49(){// zealotry

            //Resolve stat change
            changeStat('power', gs.plObj.roll, 'player')
            changeStat('def', -gs.plObj.roll, 'player')
        }
        a50(){// defensive stance        
            changeStat('roll', -1, 'player')
        }
        a52(){// hook/swap
        
            let rollRef = gs.plObj.roll
            gs.plObj.roll = gs.enObj.roll
            gs.enObj.roll = rollRef

            //RECALC ENEMY INTENDED ACTION: if player mods roll or power as extra action.
            recalcEneAction()
        }
        a70(){// pendant/charge
        
            let powerRef = gs.plObj.power
            gs.plObj.power = gs.enObj.power
            gs.enObj.power = powerRef

            //RECALC ENEMY INTENDED ACTION: if player mods roll or power as extra action.
            recalcEneAction()
        }
        a55(){// "fear" "wizards head"

            //Marker
            gs.enObj.forcedAction = 'block'

            //Trigger cd
            gs.sourceAction.cooldown = -1
            
            //Set variable cooldown.  
            let referenceActionObj = findByProperty(actionsRef, 'keyId', gs.sourceAction.keyId) //Find action reference
            referenceActionObj.cooldown = rng(4,2)
        }
        a68(){// "stress" "wizards hand"

            //Save action to prevent
            gs.enObj.bannedAction = gs.enObj.action.key 

            //Trigger cd
            gs.sourceAction.cooldown = -1
            
            //Set variable cooldown.  
            let referenceActionObj = findByProperty(actionsRef, 'keyId', gs.sourceAction.keyId) //Find action reference
            referenceActionObj.cooldown = rng(gs.sourceAction.actionMod,3)
        }
        
        //Buff or debuff
        a21(){// (en -power)"curse of weakness"
            changeStat('power', -gs.sourceAction.actionMod, 'enemy')
        }
        a22(){// (en -def) wounds

            //Resolve stat change
            changeStat('def', -gs.sourceAction.actionMod, 'enemy')
        }
        a23(){// (en -dice) "curse of chain"

            //Resolve stat change
            changeStat('dice', -gs.sourceAction.actionMod, 'enemy')
        }
        a24(){// (en -roll) slowness "curse of slowness"

            //Resolve stat change
            changeStat('roll', -gs.sourceAction.actionMod, 'enemy')
        }
        a34(){// (pl +def) papaver somniferum
            changeStat('def', gs.sourceAction.actionMod, 'player')
        }
        a39(){// (pl +roll) adrenaline shot/ adrenaline pen

            //Resolve stat change
            changeStat('roll', gs.sourceAction.actionMod, 'player')
        }
        a40(){// (pl +power) water potion "water potion"
            changeStat('power', gs.sourceAction.actionMod, 'player')
        }
        a48(){// (pl +power) "focus" "wooden staff"

            //Resolve stat change
            changeStat('power', Math.floor(1 * gs.plObj.roll / 4), 'player')

        }
        
        //Misc
        a31(){// RING: defence charge !!! see if resolving stats at this point will cause issues. Required due to def behaviour

            // gs.plObj.def -= actionMod
            resolveCharge(gs.sourceAction)
            resolvePlayerStats()
        }
        a37(){// buff next attack with piercing "leather gloves"

            //Action cost
            if(gs.plObj.power < 1) return showAlert('Not enough power to pay for action cost.')

            //Resolve stat change
            changeStat('power', -1, 'player') 

            gs.plObj.piercing = true
            gs.sourceAction.cooldown = -1
        }
        a44(){// "restoration" "sal ammoniac"

            let restoredPoints = 0

            if(gs.plObj.def < 0){
                restoredPoints += gs.plObj.def
                gs.plObj.def = 0
            }
            if(gs.plObj.power < 0){
                restoredPoints += gs.plObj.power
                gs.plObj.power = 0
            }
            if(gs.plObj.dice < gs.plObj.flatDice){
                restoredPoints += gs.plObj.dice - gs.plObj.flatDice
                gs.plObj.dice = gs.plObj.flatDice
            }

            if(restoredPoints == undefined) return false

            gs.lifeRestoredByPlayer += (-1 * restoredPoints)
        }
        a53(){// "transmute" "alchemists paKey"
            
            //Condition check
            if(gs.plObj.roll != 1 && gs.plObj.roll != 2) return showAlert('Transmute requires roll 1 or 2.')

            //Stat mod
            gs.plObj.coins += gs.plObj.roll
        }
        a67(){// pull 'carabiner'
            
            //Set carabiner variable
            gs.plObj.carabiner = []

            //Find item by action and unequip it
            gs.sourceItem.equipped = false

            //Open choose one window
            chooseOne()
            
            console.log(gs.sourceItem);

            //Save carabiner item to restore eq after the fight
            gs.plObj.carabiner.push(gs.sourceItem.itemId)

        }
        a73(){// 'oil' 'oil jar'

            //Resolve stat change
            changeStat('dice', -gs.sourceAction.actionMod, 'enemy')

            if(gs.enObj.burnStacks > 0){
                gs.enObj.burnStacks = gs.enObj.burnStacks * 2
            }     
            if(gs.enObj.poisonStacks > 0){
                gs.enObj.poisonStacks= gs.enObj.poisonStacks * 2
            }   
        } 
    }



//Converts passiveStat to objects
    function convertStringsToArr(arr){
        arr.forEach(item => {
            //Convert passiveStat to arr
            //Check if there are passive stats
            if(item.passiveStats.length > 1){
                let passivesArr = item.passiveStats.split(', ')
                item.passiveStats = []
        
                passivesArr.forEach(stat =>{
                    statArr = stat.split(':')
                    item.passiveStats.push({'stat':statArr[0], 'value': parseInt(statArr[1])})
                })
                // console.log(item);
            }

            //Convert actions to arr
            if(item.actions == undefined) return false

            if(item.actions == ''){
                item.actions = []
            }
            else{
                item.actions = item.actions.split(', ')
            }
        })
    }



//ACTIONS UI
    //Gen combat action set
    function syncActionTiles(){
        el('cards-row').innerHTML = ''

        //Set #cards-row width to display cards in two rows.
        // el('cards-row').setAttribute('style',`width:${149 * (Math.floor(gs.plObj.actions.length/2) + 1)}px;`)
        
        //Add button per player item
        gs.plObj.actions.forEach(action => {

            if(action.actionType == 'passive') return //Skip passives

            let actionCard = genActionCard(action)

            if(action.tags.includes('attack')){//Adds action at the start of the actions set
                el('cards-row').insertBefore(actionCard, el('cards-row').firstChild);
            }
            else{
                el('cards-row').append(actionCard)
            }

        })   
    }

    //Gen a single combat action card
    function genActionCard(action, type){

        //Section that contains name and desc.
        let content = document.createElement('section')  

        //Find action in actionsRef
        let referenceAction = findByProperty(actionsRef, 'keyId', action.keyId);

        //Create button elem.
        let button = document.createElement('button')
        if(type != 'card'){
            button.setAttribute('onclick', `turnCalc(this)`) // On click run next turn
        }

        //Add a unique id.
        button.setAttribute('actionId', action.actionId)       
        button.classList.add('action')
        
        
        //Updates button labels based on actions
        //Modifies 'content' section
        button.append(content) //Add content section to button

        //!!! REPACE WITH keyID

        //Card item image
        //If item does not exist, use placeholder image
        let itemString
        let itemRef = findItemByAction(action)

        // console.log(action);

        if (action.keyId == 'a62'){//punch
            itemString = 'punch'
        } 
        else if(itemRef == undefined){
            itemString = 'placeholder'
        }
        else{
            itemString = itemRef.itemName
        }

        if(itemString.includes('scroll')){
            itemString = 'magic scroll'
        }
        else if(itemString.includes('curse')){
            itemString = 'curse scroll'
        }

        //Cooldonw management.
        let cooldownCounter = ``

        //If action is on cooldown disable the button.
        if(typeof action.cooldown != 'undefined' && action.cooldown < referenceAction.cooldown){
            cooldownCounter = `<p class='cooldown-indicator'>Recharge: ${referenceAction.cooldown - action.cooldown} turn(s)</p>` 
            button.disabled = true
        }


        let heading = `${upp(action.actionName)}`
        let desc = `${upp(action.desc)}`

        //Rewrites headings for calc
        //See if you can merge it all with action obj/functions
        if(type != 'card'){//Remove numbers if generated for character page.
            if      (['block'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} ${gs.plObj.roll} dmg`
            }else if(['bow attack'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} for ${gs.plObj.roll + gs.plObj.power}`
            }else if(['sword attack'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} (${3 + gs.plObj.power}+${gs.plObj.swordDmgMod})`
            }else if(['inferno'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} (${gs.plObj.power * gs.plObj.coins} dmg)`
            }else if(['axe attack'].indexOf(referenceAction.actionName) > -1){

    
                //Cost
                //Deal with negative power
                let powerMod = gs.plObj.power
                if (powerMod < 0){powerMod = 0}
                
                let cost = (referenceAction.actionMod + powerMod) * -1
                let dmg
                let maxLife = gs.plObj.life 
    
                //If max life is lower than max life pre combat, set max life to pre combat value
                if(gs.plObj.flatLife > gs.plObj.life){
                    maxLife = gs.plObj.flatLife
                }
    
                dmg = Math.ceil((gs.plObj.flatLife - gs.plObj.life - cost)/2)
                heading = `${upp(action.actionName)} for ${dmg}`

                desc = `Pay ${cost * -1} life, deal 1 dmg per 2 missing life`
            }
        }

        button.querySelector('section').innerHTML = `
            <span>
                <h3>${heading}</h3> 
                <p class="charge-indicator">x${action.actionCharge}</p>
                ${cooldownCounter}
            </span>
            <p class='desc'>${desc}.</p>
            <img src="./img/items/${itemString}.svg">
        `
        return button
    }

    function resolveEndOfCombatPassiveActions(){
        gs.plObj.actions.forEach(action => {
            if(action.keyId == 'a66'){
                //Heal value
                restoreLife(action.actionMod)
                
                //Log
                gs.logMsg.push(`${action.actionName}: ${action.desc}`)  
            }
        })
    }