//0.INITIATE COMBAT
    function initiateCombat(){
        console.log('Initiating combat');
        
        //1.Reset variables for new encounter.
            gs.inCombat = true
            gs.combatTurn = 1

            if(typeof gs.encounter !== 'number'){
                gs.encounter = 1
            }  

        //2. Reset flat stats
        // This was set after enemy generation, moved up due to static power passive.
            resetFlatStats()

        //4.Generates enemy
            gs.enObj = new EnemyObj //New enemy per fight

            // addItem("shield", undefined, "enemy")
            resolveStats(gs.enObj)
            // console.log(gs.enObj)

            //PASSIVE: combat start passives
            // resolveStartOfCombatPassives()

            // Create enemy sprite
            spriteBuilder('enemy')
        
        //Check if player has a weapon
        //     checkIfPlayerCanAttack()

        //Reset once per combat passives
        //     gs.plObj.treeNodes.forEach(node => {
        //         node.activated = false
        //     })

        //6.syncUI() will generate action cards that will trigger turnCalc().
            syncUi()

            //6.1 Update the background
            if(gs.encounter === 1){
                el('combat-bg').setAttribute('src',`./img/bg/combat-${rng(config.bgCounter)}.svg`)

                if(gs.mapObj.mapId.includes('dungeon')){
                    el('combat-bg').setAttribute('src',`./img/bg/dungeon-1.svg`)
                }
            }

        //7.Open combat screen
            screen("combat")


        // LOOP
        combatLoop()
    }
    
//1.NEW COMBAT LOOP
let runCombatLoop // Var to stop the loop after combatEndCheck()
function combatLoop(){

    runCombatLoop = true;

    const intervalId = setInterval(() => {

        //Stop combat loop
        if (!runCombatLoop) {
            clearInterval(intervalId); // Stops the interval if the condition is met
            console.log("Loop stopped");
            return;
        }

        // Reset enemy state.
        gs.enObj.state = ''

        // Increase turn counter.
        gs.combatTurn++

        turnCalc()

    }, config.intervalSpeed);
}

//2.TURN CALC (triggered from loop)
    function turnCalc(buttonElem){

        resetCombatStateVariables()

        //Identify player item
        itemTriggerLoop(gs.plObj)
        itemTriggerLoop(gs.enObj)


        //Same for enemy

        //Save players previous action.
        // if(gs.sourceAction !== undefined){
        //     gs.previousAction = gs.sourceAction 
        // }

        //Find used action -> trigger action effect method
        //Get action id from button elem
        // gs.sourceAction = findObj(gs.plObj.actions, 'actionId', buttonElem.getAttribute('actionId'))

        //Find item by action
        // gs.sourceItem = findItemByAction(gs.sourceAction)

        //Add action to combat log
        // gs.logMsg.push(`${gs.sourceAction.actionName}: ${gs.sourceAction.desc}.<br>`)

        //PASSIVES post-action: Player passive effects.
        // gs.plObj.actions.forEach(action => {
        //     if      (action.keyId == 'a17'){ // combo "gloves"
        //         if(gs.plObj.roll === 6 && action.cooldown > 0){
        //
        //             gs.combatTurnState = 'extra-action'
        //             action.cooldown = 0
        //
        //         }
        //     }else if(action.keyId == 'a36'){ // critical hit "woolen gloves"
        //         if(gs.plObj.roll > 8 && action.cooldown > 0){
        //
        //             gs.plObj.dmgDone = gs.plObj.dmgDone * (action.actionMod/100)
        //             action.cooldown = 0
        //
        //         }
        //     }else if(action.keyId == 'a51'){ // overload 'exoskeleton'
        //         if(gs.plObj.roll > gs.plObj.dice){
        //
        //             gs.plObj.dmgDone = gs.plObj.dmgDone * (action.actionMod / 100 + 1)
        //
        //         }
        //     }else if(action.keyId == 'a56'){ // sigil of light
        //
        //         if(gs.plObj.life + gs.lifeRestoredByPlayer <= gs.plObj.flatLife) return
        //
        //         //Mod max life
        //         gs.plObj.flatLife += action.actionMod
        //         gs.plObj.flatLifeMod += action.actionMod
        //     }
        // })

        //PASSIVES: work for both player and enemy.
        // gs.plObj.actions.forEach(action => {
        //     if (action.keyId === 'a43'){ // throns crown
        //         if(gs.enObj.dmgDone !== undefined){
        //             gs.enObj.dmgDone = gs.enObj.dmgDone * 2
        //         }
        //         if(gs.plObj.dmgDone !== undefined){
        //             gs.plObj.dmgDone = gs.plObj.dmgDone * 2
        //         }
        //     }
        // })

        //Dmg and heal calc.
        combatCalc() 

        //Redses AC of used action.
        // resolveCharge(gs.sourceAction)

        //COMBAT LOG: Print all combat logs.
        // gs.logMsg.forEach(msg => {console.log(`${upp(msg)}`)})

        //Check if anyone is dead -> next turn
        combatEndCheck()     

        //Stats for testing.
        gs.totalCombatTurns++          

        //Run floating indicators
        indicateStatChange()

        syncUi()
    }

    //NEW Item trigger loop
    function itemTriggerLoop(actor){
        // Loop that checks and updates items in sequence
        for (const action of actor.actions) {

            //Reser items check
            //Check if it was last item triggered and reset charge counters for all to reset the loop
            if(actor.allItemsUsed){
                actor.actions.forEach(action => {
                    action.chargeCounter = 0
                })

                //Variable used to get a 1 interval pause after last item to show progress bar.
                actor.allItemsUsed = false
            }

            // Check if the chargeCounter is less than chargeTime
            if(action.chargeTime > action.chargeCounter){

                action.chargeCounter += config.intervalSpeed
                // console.log(`${action.actionName}: ${action.chargeCounter} / ${action.chargeTime}`)

                //Check if item triggered
                if(action.chargeTime === action.chargeCounter){
                    //Trigger ghost animation
                    triggerCombatGhosts(actor)

                    // console.log(action)
                    // actionLogic[action.actionName]

                    action.trigger(actor)
                    
                    //Trigger action
                    // if      (action.tags.includes("attack")){
                    //     target.dmgDone = action.actionValue
                    //
                    // }
                    // else if (action.tags.includes("gain def")){
                    //
                    // }
                    // else if (action.tags.includes("gain power")){
                    //
                    // }

                    //Set var to trigger the item reset during next interval
                    if(action === actor.actions[actor.actions.length - 1]){
                        actor.allItemsUsed = true
                    }
                }

                // Exit the loop because the first item with a difference was found
                break;
            }
        }
    }
    
    //Damage calculation.
    function combatCalc(){    

        //PLAYER DMG
        if(gs.plObj.dmgDone > 0){

            //POISON: apply if dmg is done.
                if(gs.plObj.poisonBuff || gs.plObj.poisonBuff == 'triggered'){
                    let poisonStackCount = 1
            
                    //Shards
                    if(gs.sourceAction.keyId === 'a3'){
                        let mult = gs.plObj.actionSlots - gs.plObj.actions.length 
            
                        if(mult < 1){
                            mult = 0
                        }
            
                        poisonStackCount = mult
                    } 
                    //Dagger pair
                    else if(gs.sourceAction.keyId === 'a4'){
                        poisonStackCount = 2
                    }
            
                    gs.enObj.appliedPoisonStacks += poisonStackCount
                    gs.plObj.poisonBuff = 'triggered' //For potion
                    gs.logMsg.push(`Applied ${poisonStackCount} poison stacks. Poison was triggered.`)
                }
            
            //DEF: resolve.                    
                //Def break logic
                // if(gs.sourceAction.tags.includes('breaks def') && gs.enObj.def > 0){
                //
                //     changeStat('def', -gs.plObj.dmgDone, 'enemy')
                //
                //     //Deal no dmg if def was broken
                //     gs.plObj.dmgDone = gs.enObj.def
                //
                // }else if(gs.enObj.def > 0){
                //     //Reduce dmg by def
                //     //Def break dmg should not be reduced by def
                //     gs.plObj.dmgDone -= gs.enObj.def
                //
                //     //Reduce def on hit
                //     changeStat('def', -1, 'enemy')
                //
                // }else if(gs.enObj.def < 0){
                //     gs.plObj.dmgDone -= gs.enObj.def
                // }

                //Set positive damage to 0 (if def is greater than dmg)
                if(gs.plObj.dmgDone < 0){
                    gs.plObj.dmgDone = 0
                }
                
            
            //PASSIVES CHECK: oh-hit passies
            //     resolveOnHitPassives()

            //Resolve stat change
                changeStat('life', -gs.plObj.dmgDone, 'enemy') 
            //Resolve reflect
            //     if(gs.enObj.reflect > 0 && gs.plObj.dmgDone > gs.enObj.dice){
            //         //Math floor because it's a negative number
            //         //Ceil to round down
            //         changeStat('life', Math.ceil(-gs.plObj.dmgDone * (gs.enObj.reflect / 100)), 'player')
            //     }

            //Reset piercing buff after attack was performed
            //     gs.plObj.piercing = false
        }

        //ENE DMG
        if(gs.enObj.dmgDone > 0){

            //Reduce damage if barrier
            if(gs.plObj.protection !== undefined && gs.plObj.protection[0] === 'Barrier'){

                gs.plObj.protection = '' //Reset variable

                // Convert action mod (75) to barrier reduction %
                gs.enObj.dmgDone = Math.round(gs.enObj.dmgDone * (1 - gs.sourceAction.actionMod / 100)) 
            }

            //Resolve enemy actions
            resolveOnHitDef()

            //Check for damage cap
            gs.enObj.dmgDone = resolveDmgCap(gs.enObj.dmgDone)

            //Resolve dmg
            changeStat('life', -gs.enObj.dmgDone, 'player')

            resolveAfterBeingHit()
        }

        //Player healing
        if(gs.lifeRestoredByPlayer > 0){
            restoreLife(gs.lifeRestoredByPlayer)
        }
    }

        //Floating stat number 
        function indicateStatChange(){
            ['player', 'enemy'].forEach(target =>{
                ['lifeChange', 'defChange', 'powerChange'].forEach(stat => {

                    let objStat = gs.plObj[stat]
                    let objStatMarker = gs.plObj[`${stat}Marker`]
                    let elem = el(`p-${stat}`)
                    let statValue = gs.plObj[stat]
                    
                    if (target == 'enemy'){
                        objStat = gs.enObj[stat]
                        objStatMarker = gs.enObj[`${stat}Marker`]
                        elem = el(`e-${stat}`)
                        statValue = gs.enObj[stat]
                    }

                    //Return if stat was not modified
                    if(objStatMarker == false) return
                    
                    //Update elem value
                    elem.innerHTML = statValue

                    //Set color
                    if(statValue > 0){//gain
                        elem.setAttribute('style','color:var(--green);')
                        elem.innerHTML = `+${statValue}`
                    } else if(statValue == 0){
                        elem.setAttribute('style','color:white;')
                    } else{ //loose
                        elem.setAttribute('style','color:var(--orange);')
                    }

                    //Trigger animation
                    runAnim(elem, 'stat-float')

                    //Reset 'change' properties.
                    gs.plObj[stat] = 0
                    gs.plObj[`${stat}Marker`] = false

                    if (target == 'enemy'){
                        gs.enObj[stat] = 0
                        gs.enObj[`${stat}Marker`] = false
                    }
                })

            })
        }

        //Resolve on hit def
        function resolveOnHitDef(){
            
            //Reduce damage by def
            gs.enObj.dmgDone -= gs.plObj.def

            //Reduce def on low hit
            if(gs.plObj.def > 0){
                changeStat('def', -1, 'player')
            }

            //Set positive damage to 0
            if (gs.enObj.dmgDone < 0){
                gs.enObj.dmgDone = 0
            }
        }
        function resolveDmgCap(dmgValue){
            let dmg = dmgValue
            
            if(dmg > gs.plObj.combatState.dmgCap){
                dmg = gs.plObj.combatState.dmgCap
            }

            return dmg
        }

        //Stat mod
        function changeStat(stat, value, target){
            if(target == 'player'){
                //TREE: resolve on stat gain passives
                value += resolveOnStatChangePassives(stat, value)
            
                // console.log(passiveMod + value);
                gs.plObj[stat] += value

                //Trigger floating number
                gs.plObj[`${stat}ChangeMarker`] = true
                gs.plObj[`${stat}Change`] += value
            } else { //enemy
                gs.enObj[stat] += value

                //Trigger floating number
                gs.enObj[`${stat}ChangeMarker`] = true
                gs.enObj[`${stat}Change`] += value
            }
        }
        function restoreLife(val){

            let lifeChange = parseInt(val)
            gs.plObj.life += lifeChange
            
            //Prevent overhealing
            if(gs.plObj.life > gs.plObj.flatLife){
                gs.plObj.life = gs.plObj.flatLife
                lifeChange = 0
            }
            
            //Trigger floating number
            gs.plObj.lifeChangeMarker = true
            gs.plObj.lifeChange += lifeChange
        }

//3.END TURN
    function combatEndCheck(mode){

        //DEFEAT
            //On death passives
            // if(gs.plObj.life < 1){
            //     resolveOnDeathPassives() //adds 1 life
            // }
            if(gs.plObj.life < 1){
                runCombatLoop = false;

                clearSavedGame()
                openStateScreen('game-end')
            }

        //VICTORY
            else if (gs.enObj.life < 1){
                runCombatLoop = false;

                //End game screen stat counter
                gs.enemyCounter++

                //End encounter
                if(gs.encounter == gs.playerLocationTile.enemyQuant){

                    gs.encounter = 'end'

                    //PASSIVES CHECK: end of encounter
                    resolveEndOfCombatPassives()
                    resolveEndOfCombatPassiveActions()

                    //Lock screen
                    document.body.classList.add('lock-actions', 'darken')

                    //a67 pull 'carabiner': restore equipment as at the start of the combat
                    if(gs.plObj.carabiner != undefined){
                        // console.log(gs.plObj.carabiner);

                        //Unequip equipped item
                        equipUnequipItem(gs.plObj.carabiner[1])

                        //Equip carabiner
                        equipUnequipItem(gs.plObj.carabiner[0])

                        //Reset variable
                        gs.plObj.carabiner = undefined
                    }
    
                    //Generate REWARDS after delay
                    window.setTimeout(
                        function(){
    
                            //Open reward screen
                            genRewards()
    
                            //Unlock screen
                            document.body.classList.remove('lock-actions', 'darken')
    
                            //Reset flat stats
                            resetFlatStats()
                        },
                        config.fadeTime
                    )

                    //Save game on win
                    saveGame()
                }

                //Next fight
                else{
                    console.log('combat ended')
                    if(typeof gs.encounter == 'number'){
                        gs.encounter++ 
                    }

                    setTimeout(() => {
                        initiateCombat();
                        runAnim(el('enemy-sprite'), 'enemyEntrance')
                    }, 2000);
                }     

                //Remove cooldowns from all items
                // resolveCooldowns('reset')
            }

        //NEXT TURN
        //     else if (
        //         mode != 'preventNextTurn'
        //      && gs.sourceAction.actionType !== "extra-action"
        //     ){
        //         startNextTurn()
        //     }
    }
    function resolveCooldowns(mode){
        if(mode == 'reset'){
            gs.plObj.actions.forEach(action => {

                if(
                    typeof action.cooldown != 'undefined' //if it's an item with cd
                ){
                    action.cooldown = findByProperty(actionsRef, 'keyId', action.keyId).cooldown
                }
            })
        }else{
            gs.plObj.actions.forEach(action => {
                let currentItemCd = findByProperty(actionsRef, 'keyId', action.keyId).cooldown

                if(
                    typeof action.cooldown != 'undefined' &&                                     //if it's an item with cd
                    action.cooldown < currentItemCd //if current cd value is less that ref cd value
                ){
                    action.cooldown++ //increase cd value

                    //a68 stress 'wizards hand'
                    //Check cd to reset the banned action
                    if(
                            gs.enObj.bannedAction !== undefined
                        &&  action.keyId === 'a68'
                        &&  action.cooldown === currentItemCd
                    ){
                        gs.enObj.bannedAction = undefined
                    }
                    
                    //a55 fear "wizards head"
                    //Check cd to reaply fear
                    if(action.keyId == 'a55'){
                        gs.enObj.forcedAction = 'block'
                    }

                    //a38 tank "helmet"
                    if(
                        action.keyId == 'a38'
                        &&  action.cooldown == currentItemCd
                    ){
                        gs.plObj.combatState.dmgCap = undefined
                    } else if(action.keyId == 'a38'){
                        gs.plObj.combatState.dmgCap = gs.plObj.roll
                        console.log('cap' + gs.plObj.roll);
                    }
                }
            })
        }
    }

//4.REWARD
    function genRewards(quant){
        
        //Clear item container
        el('reward-container').innerHTML = `` 
        
        //Gen item list
        genOfferedItemList(undefined, 'reward')

        //Move inventory list to 2nd slide of reward screen
        el('inventory-slide').append(el('inventory-list'))   
        
        //Update flat reward button labels
        el('exp-reward-btn').innerHTML = `<img src='./img/ico/tab-reward.svg'> ${gs.playerLocationTile.enemyQuant} experience, and ${2* gs.playerLocationTile.enemyQuant} coins`

        // toggleModal('reward-screen')         
        screen('reward-screen')        
    }
    function resolveFlatReward(rewardType){
        
        if (rewardType == 'exp'){
            gs.plObj.coins += gs.playerLocationTile.enemyQuant * 2
            resolveExpAndLvl(gs.playerLocationTile.enemyQuant)
        }

        //Move inventory list back to it's page
        el('inventory').childNodes[1].append(el('inventory-list'))
    }

    
    
//MISC
    function resetCombatStateVariables (){
        //Reset combat state vars
        gs.combatTurnState      = ''
        gs.plObj.dmgDone        = 0
        gs.plObj.dmgTaken       = 0
        gs.enObj.dmgDone        = 0
        gs.enObj.dmgTaken       = 0
        gs.lifeRestoredByPlayer = 0

        //To have a delay after the last item was triggered to show the progress bar
        // gs.plObj.allItemsUsed = false
        // gs.enObj.allItemsUsed = false

        //Clear combat log.
        gs.logMsg = [`TURN:${gs.combatTurn} ------------------------------------`]
    }
    function resolvePoison(){

        if(gs.enObj.poisonStacks > 0){

            //Reduce random stat by 1 per posion stack
            // for(i = 0; i < gs.enObj.poisonStacks; i++){

            //     //On poison resolution passive check
            //     resolveOnPoisonStackCalculation()

            //     let statRoll = rng(6)
                    
            //     if       (statRoll == 2){
            //         changeStat('def', -1, 'enemy')
            //         gs.logMsg.push(`poison: -1 def. ${gs.enObj.poisonStacks - 1} stacks remaining`)

            //     }else if (statRoll == 3){
            //         changeStat('power', -1, 'enemy')
            //         gs.logMsg.push(`poison: -1 power. ${gs.enObj.poisonStacks - 1} stacks remaining`)

            //     }else if (statRoll == 4 && gs.enObj.dice > 3){
            //         changeStat('dice', -1, 'enemy')
            //         gs.logMsg.push(`poison: -1 dice. ${gs.enObj.poisonStacks - 1} stacks remaining`)

            //     }else {
            //         changeStat('life', -1, 'enemy')
            //         gs.logMsg.push(`poison: -1 life. ${gs.enObj.poisonStacks - 1} stacks remaining`)

            //     }
            // }

            //Reduce poison stacks
            // gs.enObj.poisonStacks -= 1

            //Reduce life
            changeStat('life', -gs.enObj.poisonStacks, 'enemy')
            gs.logMsg.push(`poison: -1 life. ${gs.enObj.poisonStacks - 1} stacks remaining`)

            //Removes poison buff if it was triggered during this turn.
            if(gs.plObj.poisonBuff == 'triggered'){
                gs.plObj.poisonBuff = false
                gs.logMsg.push(`poison buff removed`)
            }
        }

        //Delay poison by 1 turn via appliedPoisonStacks var
        if(gs.enObj.appliedPoisonStacks > 0){
            gs.enObj.poisonStacks += gs.enObj.appliedPoisonStacks
            gs.enObj.appliedPoisonStacks = 0
        }

        combatEndCheck('preventNextTurn') 
    }
    function resolveBurn(){

        if(gs.enObj.burnStacks > 0){
            //Deal dmg
            changeStat('life', -gs.enObj.burnStacks, 'enemy')  

            //Reduce stack
            gs.enObj.burnStacks-- 
        }

        //Delay by 1 turn via appliedPoisonStacks var
        if(
            gs.enObj.appliedBurnStacks > 0 
         && gs.enObj.appliedBurnStacks > gs.enObj.burnStacks
        ){
            gs.enObj.burnStacks = gs.enObj.appliedBurnStacks
            gs.enObj.appliedBurnStacks = 0
        }

        combatEndCheck('preventNextTurn')
    }

//Legacy
    function startNextTurn(){

        //POISON: resolve poison stacks
        //    resolvePoison()

        //BURN
        //     resolveBurn()

        //COODLOWN: increase turn cooldowns
        //     resolveCooldowns()

        //PASSIVE: post roll passives.
        //     resolvePostRollPassives()
    }