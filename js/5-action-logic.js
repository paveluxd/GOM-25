//Actions DATA
    class ActionObj {
        constructor(actionKey, sourceItem){
            // console.log(`>>> ${actionKey} generated.`)

            //Variable properties generated
            let props = [
                {key:'actionName'  ,val: actionKey},
                {key:'actionId'    ,val: "ac" + Math.random().toString(8).slice(2)},//gens unique id
                {key:'actionCharge',val: 10},
                {key:'actionMod'   ,val: 0},
                {key:'actionType'  ,val: 'generic'},
                {key:'desc'        ,val: ''},
                {key:'passiveStats',val: []},
                {key:'tags'        ,val: ''},

                //New props
                {key:'actionDesc'    ,val: ''},
                {key:'actionValue'   ,val: ''},
                {key:'scalingMultiplier' ,val: 1},
                {key:'chargeTime'    ,val: ''},
                {key:'chargeCounter' ,val: 0}
            ]

            //Resolves extra props
            props.forEach(property => {

                // console.log(property, actionKey) //bug

                //Find action by actionName
                let actionData = findByProperty(actionsRef, 'actionName', actionKey)

                //if no prop, set it to extra props value
                if(typeof actionData[property.key] === 'undefined' || actionData[property.key] === ''){

                    this[property.key] = property.val 

                }
                //Randomize AC values
                else if (property.key === 'actionCharge') {
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

                // console.log(this.chargeTime)
                // this.chargeTime = this.chargeTime * 10
            })

            //Increase stats based on iLvl
            this.actionValue += Math.round(sourceItem.iLvl * this.scalingMultiplier)

            //Static props
            this.flatActionCharge = this.actionCharge

        }

        //Action logic
        trigger(actor){
            // console.log(`--> ${upp(this.actionName)} triggered.`)
            el(this.actionId).setAttribute("style", "border: 2px solid red;")

            switch (this.actionName) {

                // Att
                case 'club':
                    actor.dmgDone = this.attackCalc({actor: actor})
                    break

                case 'sword':
                    actor.dmgDone = this.attackCalc({actor: actor})
                    break

                case 'mace':
                    actor.dmgDone = this.attackCalc({baseDmg: this.actionValue + gs.plObj.def, actor: actor})
                    break

                case 'dagger':
                    //Calc
                    gs.plObj.dmgDone += 1 + gs.plObj.power

                    //Apply poison stacks
                    // gs.enObj.appliedPoisonStacks += this.actionValue
                    break

                case 'great hammer':
                    actor.dmgDone = this.actionValue + gs.plObj.power
                    break

                // +def
                case 'shield':
                    actor.def += this.actionValue
                    break

                // +power
                case 'staff':
                    actor.power += this.actionValue
                    break


                //No action found case
                default:
                    console.log('UNKNOWN ACTION: ', this.actionName)
            }
        }

        //Attack formula
        attackCalc(args){
            if(!args){args = {actor: gs.enObj}} // set def args object if it doesn't exist
            if(args.baseDmg === undefined){args.baseDmg = this.actionValue}

            // Roll for crit chance
            let critRoll = rng(100)

            if(critRoll < args.actor.critChance){
                return Math.round((args.baseDmg + args.actor.power) * args.actor.critMultiplier)
            }

            return args.baseDmg + args.actor.power
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

        //Add card per player item
        el('plActionsContainer').innerHTML = ''

        gs.plObj.actions.forEach(action => {

            //Skip passives
            if(action.actionType === 'passive') return

            //Gen action card
            let actionCard = genActionCard(action)

            //Add html elem to container
            el('plActionsContainer').append(actionCard)
        })

        //Add action per ene item
        if(gs.enObj === undefined) return false
        el('enActionsContainer').innerHTML = ''

        gs.enObj.inventory.forEach(item => {

            //Skip passives
            if(item.actions[0].actionType === 'passive') return

            //Gen action card
            let actionCard = genActionCard(item.actions[0])

            //Add html elem to container
            el('enActionsContainer').append(actionCard)
        })
    }

    //Gen a single combat action card
    function genActionCard(action, type){

        //Section that contains name and desc.
        let content = document.createElement('section')  

        //Find action in actionsRef
        let referenceAction = findByProperty(actionsRef, 'actionName', action.actionName);

        //Create tile elem.
        let actionTile = document.createElement('div')

        //Add a unique id.
        actionTile.id = action.actionId
        actionTile.setAttribute('actionId', action.actionId)
        actionTile.classList.add('action')

        //Disable if on cd
        if(action.chargeTime === action.chargeCounter){
            actionTile.classList.add('disabled')
        }

        // Time 2 charge 0,1,2
        actionTile.setAttribute(
            'style',
            `
                box-shadow: inset ${182 * (action.chargeCounter / action.chargeTime)}px 0 0 rgba(255,255,255,0.05);
                transition: all 0.2s ease-in-out;
            `)
        
        //Updates button labels based on actions
        //Modifies 'content' section
        actionTile.append(content) //Add content section to button

        //Card item image
        //If item does not exist, use placeholder image
        let itemString
        let itemRef = findItemByAction(action)
        // console.log(itemRef, action)


        if(itemRef === undefined){
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

        let heading = `${upp(action.actionName)}`
        let desc = `
            ${upp(action.actionDesc)} (${action.actionValue}).<br>
            Charge time: ${action.chargeTime / 1000} seconds.
        `

        //Rewrites headings for calc
        //See if you can merge it all with action obj/functions
        if(type !== 'card'){//Remove numbers if generated for character page.
            if      (['block'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} ${gs.plObj.roll} dmg`
            }
            else if(['bow attack'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} for ${gs.plObj.roll + gs.plObj.power}`
            }
            else if(['sword attack'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} (${3 + gs.plObj.power}+${gs.plObj.swordDmgMod})`
            }
            else if(['inferno'].indexOf(referenceAction.actionName) > -1){
                heading = `${upp(action.actionName)} (${gs.plObj.power * gs.plObj.coins} dmg)`
            }
            else if(['axe attack'].indexOf(referenceAction.actionName) > -1){

    
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

        actionTile.querySelector('section').innerHTML = `
            <p class='desc'>${desc}</p>
            <img src="./img/items/${itemString}.svg">
        `
        return actionTile
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