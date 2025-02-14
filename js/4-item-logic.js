//Items
class ItemObj {
    constructor(itemName, iLvl, type, owner){
        // console.log(`>>> ${itemName} ${iLvl} ${type} generated.`)

        //Static properties taken from reference.
        this.actions = []

        //If no itemName -> get random
        if(itemName === undefined){
            itemName = rarr(genItemPool()).itemName
        }

        //Finds item data in csv itensRef
        let itemData = findByProperty(itemsRef, 'itemName', itemName)
        
        //Set iLvl to stage val
        if(iLvl !== undefined){
            this.iLvl = iLvl
        }else{
            this.iLvl = gs.stage
        }

        //Gen variable properties
        let props = [
            {key:'itemName'      ,val: upp(itemName)},
            {key:'itemSlot'      ,val: 'any'},
            {key:'tags'          ,val: ''},
            {key:'itemRarity'    ,val: 'common'},
            {key:'itemId'        ,val: "it" + Math.random().toString(8).slice(2)},//gens unique id
            {key:'equipped'      ,val: false},
            {key:'passiveStats'  ,val: []},
            {key:'cost'          ,val: rng(12, 6)},
            {key:'desc'          ,val: undefined},
        ]
        //Resolve props via default value above, or value from itemsRef object
        props.forEach(property => {
            // console.log(itemName)

            //if no prop, set it to extra props value
            if(itemData[property.key] === undefined || itemData[property.key] === ''){
                this[property.key] = property.val 
            }
            //if exists in ref, set it as ref.
            else {
                // this[property.key] = itemData[property.key] 
                
                //Json parse thing is required because passive stat propery gets linked on item and in itemsRef object.
                //And by changing the item, the ref object gets changed as well.
                this[property.key] = JSON.parse(JSON.stringify(itemData[property.key]))
            }
        })

        //Static props
        this.enhancementQuantity = 0 //Increases cost per enhancement.
        this.repairQuantity = 0

        // Resolve actions
        if(itemData.actions.length === 0){
            itemData.actions = []
        }
        else{
            itemData.actions.forEach(actionKey => {
                this.actions.push(new ActionObj(actionKey, this))
            })    
        }

        // Corruption modifier
        if(type === 'corrupted'){
            let randomAction = new ActionObj(rarr(actionsRef).actionName, this)
            this.actions.push(randomAction)
        }
    }
}
// Calc equipped items
function calcEquippedItems(){
    let equipped = 0
    gs.plObj.inventory.forEach(item => {
        if(item.equipped){
            equipped++
        }
    })

    return equipped
}
// Calculates cost for ench repair etc.
function calcCost(type, itemId){
    let targetItem = findItemById(itemId)
    let cost

    if(type == 'enhance'){
        cost = targetItem.cost * (targetItem.enhancementQuantity + 1)
    }
    else if(type == 'repair'){
        cost = targetItem.cost * (targetItem.repairQuantity + 1)
    }

    return cost
}
//Pick item rarity, drops
function genItemPool(){
    let itemPool = []

    let roll = rng(85) + gs.stage * 5
    // console.log(roll);

    if       (roll < 300){ //70%
        itemPool = itemsRef.filter(item => item.itemRarity === '') //normal
    }else if (roll < 90){ //20%
        itemPool = itemsRef.filter(item => item.itemRarity === 'magic')
    }else if (roll < 97){ //7%
        itemPool = itemsRef.filter(item => item.itemRarity === 'rare')
    }else{                //3%
        itemPool = itemsRef.filter(item => item.itemRarity === 'epic')
    }

    return itemPool
}



// ACTIONS 
    // Resolve action charges 
    function resolveCharge(action){

        //On action use passives
        //Needed here due to charge recovery passive
        resolveOnChargeResolution()

        action.actionCharge--

        if(action.actionCharge < 1){

            //Remove action
            removeFromArr(gs.plObj.actions, action)
            removeFromArr(gs.plObj.tempActions, action)

            //Resolve item on 0 charge
            let item = findItemByAction(action)

            //Delete if consumable
            //Check for undefined items in case it's a punch action
            if(item != undefined){
                if(
                    item != undefined ||
                    item.itemName.includes('potion') ||
                    item.itemName.includes('scroll') ||
                    item.itemName.includes('curse')
                ){
                    removeItem(item.itemId)
                }
                //Else unequip
                else if(item.passiveStats.length === 0){
                    equipUnequipItem(item.itemId)
                }
            }

            //Loose passive stat
            resolveStats(gs.plObj)  
        }
    }
    // Resolve post-roll passives
    function resolvePostRollPassives(){
        gs.plObj.actions.forEach(action => {

        })

        resolvePostRollTreePassives()
    }



//Dealing with offered items
    //Gen list 
    function genOfferedItemList(quant, event) {
        // console.log(quant,event);

        gs.plObj.offeredItemsArr = []
        let generatedReward

        //Resolve undefined quant
        if(quant == undefined){quant = gs.playerLocationTile.enemyQuant}

        if(quant == "all"){//all items for testing
            itemsRef.forEach(item => {
                generatedReward =  new ItemObj(item.itemName)
                gs.plObj.offeredItemsArr.push(generatedReward)

                //Gen item html card elem
                let rewardElem = genItemCard(generatedReward, 'item-to-buy')
    
                //Add card to container
                el('merchant-container').append(rewardElem)
            })
        }

        else{
            //Gen item per quant value in function
            for(i = 0; i < quant; i++){ 
                // console.log(gs.enObj.profile);

                //Mod rewards if boss unit
                if(
                    typeof gs.enObj !== 'undefined' 
                    && Object.keys(profileRef.boss).includes(gs.enObj.profile.profileId)
                    && event != 'merchant' 
                ){
                    generatedReward = new ItemObj(...[,,], 'corrupted')
                    quant = 2 //Bosses drop 1 corrupted items
                }else{
                    generatedReward = new ItemObj()
                }
    
                //Add item to reward pool, to find them after item card is selected from html
                gs.plObj.offeredItemsArr.push(generatedReward)
                
                //Add html cards per item
                if(event == 'reward'){
                    //Gen item html card elem
                    let rewardElem = genItemCard(generatedReward, 'reward')
    
                    //Add card to container
                    el('reward-container').append(rewardElem)
                }
                else if(event == 'merchant'){
                    //Gen item html card elem
                    let rewardElem = genItemCard(generatedReward, 'item-to-buy')
    
                    //Add card to container
                    el('merchant-container').append(rewardElem)
                }
            }
        }

    }
    // Resolve
    function resolveChoosingOfferedItem(itemId, event){   

        //Find item with matching id
        gs.plObj.offeredItemsArr.forEach(targetItem => {

            if(targetItem.itemId == undefined || targetItem.itemId != itemId) return false

            //If no slots return
            if(gs.plObj.inventory.length == gs.plObj.inventorySlots){
                showAlert('No inventory slots.') 
                return
            }

            if(event == 'reward'){
                //Add item to players inventory & auto-equip
                gs.plObj.inventory.push(targetItem)
                equipUnequipItem(targetItem.itemId)
    
                //Move inventory list back to it's page
                el('inventory').childNodes[1].append(el('inventory-list'))
                
                //screen() is ran from the button.

                //Clear offered items
                gs.plObj.offeredItemsArr = []
            }
            else if(event == 'purchase'){
                if(resolvePayment(targetItem.cost) == false) return
                
                //Destroy item card
                el(itemId).remove()

                //Update coins indicator
                el('merchant-coins-indicator').innerHTML = `You have: ${gs.plObj.coins}<img src="./img/ico/coin.svg">`

                showAlert(`${upp(targetItem.itemName)} purchased for ${targetItem.cost} and added to the inventory.`)

                gs.plObj.inventory.push(targetItem)

                equipUnequipItem(targetItem.itemId)
            }

        })
    }



//ITEMS
    //Add item (to player inventory based on arguments).
    function addItem(itemName, iLvl, targetArr){

        //Check if there are slots in the inventory.
        if(gs.plObj.inventory.length < gs.plObj.inventorySlots){

            //Debug item name issue
            // console.log(key);

            //Create new item obj
            let newItem = new ItemObj(itemName, iLvl)

            //If empty equipment slots, equip item automatically.
            if(gs.plObj.equipmentSlots > calcEquippedItems()){
                newItem.equipped = true
            }

            //Add item.
            targetArr.push(newItem)

            //Resolve stats and actions added by item?
            // resolveStats(gs.plObj)
        }

        else{
            showAlert('Inventory is full.')
        }
    }
    //Equip/unequip item. 
    function equipUnequipItem(itemId){

        //Find item by id
        let item = findItemById(itemId)

        //Get item types to prevent staking
        let itemSlots = []
        gs.plObj.inventory.forEach(invItem => {
            if(!invItem.equipped || invItem.itemSlot == 'any') return false
            itemSlots.push(invItem.itemSlot)
        })


        //Equip
        if(
            !item.equipped                                   //check if equipped
            && gs.plObj.equipmentSlots > calcEquippedItems() //check if there are slots
            && !itemSlots.includes(item.itemSlot)            //check if unique type
        )
        {
            item.equipped = true
        } 
        
        
        //Unequip item
        else if (item.equipped === true){
            item.equipped = false
        }
        else if(itemSlots.includes(item.itemSlot)){
            showAlert("Can't equip two items of the same type.")
        }
        else {
            showAlert('No equippment slots.')
        }

        resolveStats(gs.plObj)//Adjust this to recalc all items
        syncUi()
    }
    //Remove/drop item (inventory). 
    function removeItem(itemId){
        let item = findByProperty(gs.plObj.inventory, 'itemId', itemId)
        
        //Remove item actions
        item.actions.forEach(action => {
            removeFromArr(gs.plObj.actions, action)
        })

        //Remove from inventory
        removeFromArr(gs.plObj.inventory, item)

        syncUi()
    }
    //Sell item (merchant).
    function sellItem(itemId){
        let item = findItemById(itemId)
        
        gs.plObj.coins += item.cost
        
        removeItem(itemId)

        showAlert(`${upp(item.itemName)} sold for ${item.cost} coins.`)

        el('merchant-coins-indicator').innerHTML = `You have: ${gs.plObj.coins}<img src="./img/ico/coin.svg">`
    }
    //Enhance item (blacksmith).
    function modifyItem(itemId, type){
        //Find item
        let targetItem = findItemById(itemId)
        console.log(targetItem);

        if(type == 'enhance'){
            if(resolvePayment(calcCost('enhance', itemId)) == false) return

            //Item enchance logic
                 //Add passive mod
                let addedStat = rarr([{stat:'life',value:6}, {stat:'power',value:1}, {stat:'def',value:2}])

                //If no mods add.
                if(targetItem.passiveStats.length < 1){
                    targetItem.passiveStats.push(addedStat)
                }
                //Check if matching stat exists -> increase stat
                else{
                    let matchingStat

                    console.log(targetItem);
                    
                    targetItem.passiveStats.forEach(statObj =>{
                        console.log(statObj);

                        if(addedStat.stat != statObj.stat) return false
                
                        matchingStat = true
                        statObj.value += addedStat.value  
                    })

                    //Else add stat
                    if(!matchingStat){
                        targetItem.passiveStats.push(addedStat)
                    }
                }

                //Increase ench quant to increase cost per enhant of the same item.
                targetItem.enhancementQuantity++

            resolveStats(gs.plObj)//Recalculates passive stats
        }
        else if(type == 'repair'){
            //Find 1st action
            let action = targetItem.actions[0]

            //If no actions return
            if(action == undefined) return showAlert("This item can't be repaired.")

            //If can't pay return
            if(resolvePayment(calcCost('repair', itemId)) == false) return

            //Add 50% of max charges
            action.actionCharge += Math.ceil(action.flatActionCharge / 2)

            //Increase ench quant to increase cost per enhant of the same item.
            targetItem.repairQuantity++

            //item repair logic
            showAlert('Item repaired.')
        }

        syncUi()
    }
    //Move function for purchasing and item here.

    //Util: resolve payment.
    function resolvePayment(cost){
        if(gs.plObj.coins < cost){
            showAlert(`You can't afford this. You need <img src="./img/ico/coin.svg"> ${cost - gs.plObj.coins} more.`)
            return false
        }
        else{
            gs.plObj.coins -= cost
            showAlert(`You paid <img src="./img/ico/coin.svg"> ${cost} coins.`)
        }
    }
    //Util: find item by action.
    function findItemByAction(action){
        let itemWihtAction

        gs.plObj.inventory.forEach(item => {

            item.actions.forEach(itemAction => {

                if(itemAction.actionId === action.actionId){

                    itemWihtAction = item

                }

            })

        })

        //Check enemy items if player is undefined
        if(itemWihtAction == undefined){
            gs.enObj.inventory.forEach(item => {

                item.actions.forEach(itemAction => {

                    if(itemAction.actionId === action.actionId){

                        itemWihtAction = item

                    }

                })

            })
        }
        
        return itemWihtAction
    }
    //Util: find item by id.
    function findItemById(itemId, sourceArr){
        let targetItem

        if(sourceArr == undefined){
            sourceArr = gs.plObj.inventory
        }

        sourceArr.forEach(item => {
            if(item.itemId != itemId) return false
            targetItem = item
        })

        if(targetItem == undefined){
            gs.plObj.offeredItemsArr

            sourceArr.forEach(item => {
                if(item.itemId != itemId) return false
                targetItem = item
            })
        }

        return targetItem
    }


    
//INVENTORY
    //Move item card generation to a separate function
    function syncItemCards(){
        
        //Sync inventory
        el('inventory-list').innerHTML = ''
        gs.plObj.inventory.forEach(item => {
            el('inventory-list').append(genItemCard(item))
        })

        //Sync market 
        el('items-to-sell').innerHTML = ``
        gs.plObj.inventory.forEach(item => {
            el('items-to-sell').append(genItemCard(item, 'item-to-sell'))
        })

        //Sync blacksmith
        el('items-to-enhance').innerHTML = ``
        gs.plObj.inventory.forEach(item => {
            el('items-to-enhance').append(genItemCard(item, 'item-to-enhance'))
        })
        el('items-to-repair').innerHTML = ``
        gs.plObj.inventory.forEach(item => {
            el('items-to-repair').append(genItemCard(item, 'item-to-repair'))
        })
    }

    //Gen item card
    function genItemCard(item, type){
        //Creates card container
            let card = document.createElement('div')
            card.classList.add('item-card', 'body-12')
            let cardId = item.itemId

            //Top container on click
            let clickAttr =`onclick="genItemModal('${item.itemId}')"`
            if(type === 'reward'){

                clickAttr =`onclick="genItemModal('${item.itemId}', 'reward')"`

            }
            else if(['item-to-enhance', 'item-to-repair'].indexOf(type) > -1){

                clickAttr =`onclick="genItemModal('${item.itemId}', 'preview')"`

            }
            else if(['item-to-buy', 'item-to-sell'].indexOf(type) > -1){
                
                clickAttr =`onclick="genItemModal('${item.itemId}', 'merchant')"`

            }


            //Image key
            let                                imgKey = item.itemName
            if     (imgKey.includes('scroll')){imgKey = 'magic scroll'} //scroll
            else if(imgKey.includes('curse') ){imgKey = 'curse scroll'} //curse

            //Item type
            let itemSlot = ``
            if(item.itemSlot !== 'any'){itemSlot = `<span class="slot-indicator">${upp(item.itemSlot)} item slot</span>`}

            //Added actions
            let actionSet = ``
            item.actions.forEach(action =>{
                if(action.actionType == 'passive'){
                    actionSet += `${upp(action.desc)} (passive).`
                }
                else {
                    actionSet += `
                        ${upp(action.actionType)} (${action.actionValue}).<br>
                        Charge time: ${action.chargeTime} seconds.
                    `
                }
            })

            //Passive stats
            let passiveSet = ``
            item.passiveStats.forEach(stat =>{
                passiveSet += `<div><img src="./img/ico/${stat.stat}.svg"> ${stat.value}</div>`
            })

            //Btns
            let btn1 = `<button class="drop-button body-12" onclick="removeItem('${item.itemId}'), this.remove()">
                            <img src="./img/ico/item-x.svg"> <p>Drop</p>
                        </button>`

            let btn2 = `<button class="equip-button body-12" onclick="equipUnequipItem('${item.itemId}'), this.classList.toggle('equipped')">
                            <p>Equip</p> <img src="./img/ico/item-equip-no.svg">
                        </button>`

            if     (type === 'reward'){
                // btn1 = `<button class="drop-button body-12" onclick="toggleModal('item-modal'), genItemModal('${item.itemId}', 'reward')">
                //             <img src="./img/ico/item-view.svg"> <p>View</p>
                //         </button>`

                btn2 = `<button class="equip-button body-12" onclick="resolveChoosingOfferedItem('${item.itemId}', 'reward'), screen('map')">
                            <p>Pick</p> <img src="./img/ico/item-pick.svg">
                        </button>`
            }
            else if(type === 'item-to-buy'){
                // btn1 = `<button class="drop-button body-12" onclick="toggleModal('item-modal'), genItemModal('${item.itemId}', 'reward')">
                //             <img src="./img/ico/item-view.svg"> <p>View</p>
                //         </button>`

                btn2 = `<button class="equip-button body-12" onclick="resolveChoosingOfferedItem('${item.itemId}', 'purchase')">
                            <p>Buy for ${item.cost}</p> <img src="./img/ico/coin.svg">
                        </button>`
            }
            else if(type === 'item-to-sell'){
                btn2 = `<button class="drop-button body-12" onclick="sellItem('${item.itemId}')">
                            <p>Sell for ${item.cost}</p> <img src="./img/ico/coin.svg">
                        </button>`

                // btn1 = `<button class="equip-button body-12" onclick="equipUnequipItem('${item.itemId}'),  this.classList.toggle('equipped')">
                //             <p>Equip</p> <img src="./img/ico/item-equip-no.svg">
                //         </button>`
                cardId += '-to-sell'//Adjust id to avoid conflicts
            }
            else if(type === 'item-to-enhance'){
                btn1 = ``

                btn2 = `<button class="equip-button body-12" onclick="modifyItem('${item.itemId}', 'enhance')">
                            <p>Enhance for ${calcCost('enhance', item.itemId)}</p> <img src="./img/ico/coin.svg">
                        </button>`
                cardId += '-to-enhance'//Adjust id to avoid conflicts
            }
            else if(type === 'item-to-repair'){
                btn2 = `<button class="equip-button body-12" onclick="modifyItem('${item.itemId}', 'repair')">
                            <p>Repair for ${calcCost('repair', item.itemId)}</p> <img src="./img/ico/coin.svg">
                        </button>`
                cardId += '-to-repair'//Adjust id to avoid conflicts
            }
            else if(type === 'item-to-choose'){

                btn2 = `<button class="drop-button body-12" onclick="chooseOne('resolve', '${item.itemId}')">
                            <p>Choose</p>
                        </button>`

                cardId += '-to-choose'//Adjust id to avoid conflicts

            }

            //Update equip state for inventory item
            if(['item-to-enhance', 'item-to-repair', 'item-to-sell'].indexOf(type) > -1 == false){
                if(item.equipped){ 
                    btn2 = `<button class="equip-button body-12 equipped" onclick="equipUnequipItem('${item.itemId}'), this.classList.toggle('equipped')">
                                <p>Equip</p> <img src="./img/ico/item-equip-yes.svg">
                            </button>`
                }
            }

            //Set rarity glow
            let itemRarityGlow = `<div class='item-glow'>`

            if(      item.itemRarity === 'magic'){
                itemRarityGlow = `<div class='item-glow magic'>`

            }else if(item.itemRarity === 'rare'){
                itemRarityGlow = `<div class='item-glow rare'>`

            }else if(item.itemRarity === 'epic'){
                itemRarityGlow = `<div class='item-glow epic'>`

            }

            card.id = cardId //has to be here, if declared aboce, it will bind html elemnts with the same id (inventory and market)
            card.innerHTML =`
                            <div class="item-top-container" ${clickAttr}>
                                <h3>${upp(item.itemName)}</h3>
                                ${itemSlot}
                                <p>${actionSet}</p>
                                <div class="passive-container">${passiveSet}</div>
                            </div>
                            
                            <div class="item-bottom-container">
                                <img src="./img/items/${imgKey}.svg">
                                ${btn2}
                                ${itemRarityGlow}
                            </div>
                        `

            return card
    }

    //Item details modal
    function genItemModal(itemId, source){
        
        let itemModal = el('item-modal')
        
        //Find item object
        let itemObj = findByProperty(gs.plObj.inventory, 'itemId', itemId)
        
        //Search reward pool if reward
        if(source == 'reward' || source == 'merchant'){
            itemObj = findByProperty(gs.plObj.offeredItemsArr, 'itemId', itemId)

            console.log(itemId, source, itemObj);
        }
        
        //Get actions
        let actionSet = ``

        if(itemObj.actions.length > 0){
            actionSet = `
                <br><br>
                <h3>Adds actions</h3>
            `
            itemObj.actions.forEach(action => {
                actionSet += `
                    <div class="action-ref">
                        <h3>${upp(action.actionName)}</h3>
                        <p>${upp(action.desc)}.</p>
                        <p>Action charges: ${action.actionCharge}</p>
                    </div>
                `
            })
        }

        //Get passives
        let passiveSet = ``

        if(itemObj.passiveStats.length > 0){
            passiveSet = `
                <br><br>
                <h3>Stat modifications</h3>
            `
            itemObj.passiveStats.forEach(passive => {
                passiveSet += `
                    <div class="stat">
                        <img src=./img/ico/${passive.stat}.svg> 
                        <p>${upp(passive.stat)}</p> ${passive.value}
                    </div>`
            })
        }

        //Get description
            let descriptionSet = ``

            if(itemObj.desc != undefined){
                descriptionSet = `
                    <br>
                        <p class="italic">${upp(itemObj.desc)}.</p>
                    <br>
                `
            }


        //Gen button
            let btn = `
                <button  class="tab" onclick="removeItem('${itemId}'), toggleModal('item-modal')">
                    <img src="./img/ico/unequip.svg">
                    Destroy item
                </button>
            `
            //Swap button if reward
            if(source == 'reward'){
                btn = `
                    <button class="tab" onclick="resolveChoosingOfferedItem('${itemId}', 'reward'), screen('map')">
                        <img src="./img/ico/equip.svg">
                        Pick item
                    </button>
                `
            }
            else if(source == 'preview' || source == 'merchant'){
                btn = ``
            }

        itemModal.innerHTML = `
            <div id="item-modal-tabs" class="tab-container btn-frame ">
                ${btn}
        
                <button class="tab" onclick="toggleModal('item-modal')">
                    <img src="./img/ico/tab-hide.svg">
                    Close
                </button>
            </div>

            <div class="modal-container ">
                <img class="item-img" src="./img/items/${itemObj.itemName}.svg">
                <h1>${upp(itemObj.itemName)}</h1>
                ${descriptionSet}
                Item type: ${upp(itemObj.tags)}<br>
                Equipment slot: ${upp(itemObj.itemSlot)}<br>
                Rarity: ${upp(itemObj.itemRarity)}

                ${actionSet}
                ${passiveSet}
            </div>
        `

        toggleModal('item-modal')
    }