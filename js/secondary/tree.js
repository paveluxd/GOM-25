let prefix = 'treenode_'


//Spend tree points
//Adds tree node obj to playerObj
    function addTreeNode(nodeId, treeHtmlElemId){
        //Allocate new node
        if(gs.plObj.treePoints > 0){
            let node = findByProperty(treeRef, 'id', nodeId)

            // Add skill node to player obj    
            gs.plObj.treeNodes.push(node)    
            
            gs.plObj.treePoints--

            allocateTreeNode(treeHtmlElemId)

            resolveStats(gs.plObj)
            saveGame()
            lvlupUiIndication()
            syncUi()
        }
        //Not enough points
        else{
            showAlert(`All passive skill points are allocated.`)
        }
    }


//Changes state of a tree node in UI
    function allocateTreeNode(nodeElemId){
        //Find node in gs.treeObj
        gs.treeObj[nodeElemId].allocated = true

        //Add class to highlight allocated node and paths
        el(nodeElemId).classList.add('node-allocated')

        //Highlight connectors for each direction
        gs.treeObj[nodeElemId].tileConnectors.forEach(connector => {
            highlightPath(nodeElemId, connector)
        })

        //Highlight adjacent nodes
    }

    //Add class to highlight the path
    function highlightPath(elemId, direction){

        let treeElem = el(findAdjacentTile(elemId, direction))
        let n = 1

        //Repeats untill all paths are highlighted
        while(n < 5 && treeElem.classList.contains('path')){
            n++
            treeElem.classList.add('active-path')
            treeElem = el(findAdjacentTile(treeElem.id, direction))
        }
    }

    //Returns id of an adjacent cell based on direction
    function findAdjacentTile(tileId, direction){
        let column = tileId.split('_')[1].split('-')[0] * 1
        let row    = tileId.split('_')[1].split('-')[1] * 1

        if      (direction == 'T'){
            return `${prefix}${column    }-${row - 1}`
        }else if(direction == 'R'){
            return `${prefix}${column + 1}-${row    }`
        }else if(direction == 'D'){
            return `${prefix}${column    }-${row + 1}`
        }else if(direction == 'L'){
            return `${prefix}${column - 1}-${row    }`
        }else if(direction == 'RD'){
            return `${prefix}${column + 1}-${row + 1}`
        }else if(direction == 'LD'){
            return `${prefix}${column - 1}-${row + 1}`
        }else if(direction == 'RT'){
            return `${prefix}${column + 1}-${row - 1}`
        }else if(direction == 'LT'){
            return `${prefix}${column - 1}-${row - 1}`
        }
    }


//Tree UI
    function generateSkillTree(){
        
        el('skill-tree').innerHTML = ``

        let treeRows      = 9
        let treeColumns   = 21
        let column        = 0
        let row           = 0
        let nodeType
        let node

        
        //Build saved tree from gs.treeObj
            if(Object.keys(gs.treeObj).length > 0){
                Object.keys(gs.treeObj).forEach(node => {
                    // console.log(gs.treeObj[node]);
                    let treeNode = gs.treeObj[node]
                    createTreeCell(treeNode.tileColumn, treeNode.tileRow, treeNode.tileType)
                })
            }
        //Build new from treeStructure
            else{
                treeStructure.forEach(tile => {
    
                    nodeType = undefined
    
                    //Split data string
                    let tileContent = tile.split('_') // 11-4_lif_T-R-D-L

                    //Create tile object 
                    gs.treeObj[prefix + tileContent[0]] = {}
                    
                    //Set tile object properties
                    node                = gs.treeObj[prefix + tileContent[0]] // this causes gs.treeObj obj to be updated
                    node.tileColumn     = parseInt(tileContent[0].split('-')[0])
                    node.tileRow        = parseInt(tileContent[0].split('-')[1])
                    node.tileType       = tileContent[1]            //'T12'
                    node.tileConnectors = tileContent[2].split('-') //creates array of tile connector markers T,BB etc.
                    node.imgPath        = tileContent[1]            //sets tile image
    
                    createTreeCell(node.tileColumn, node.tileRow, nodeType)
                })
            }

        //Build base tree
            for(i=0; i < treeRows * treeColumns; i++){

                //Cell creation trigger
                let createCell = false

                //Set row Y id
                column++
                if(column > treeColumns){column = 1}

                //Set column X id
                if(i % treeColumns == 0){row ++}

                //Set tile images
                //Rows 
                let refRows = [1,5,9] //add 13 to extend

                if(
                       refRows.includes(row)
                    // || [3].includes(column) && [2].includes(row)
                ){
                    createCell = true
                    nodeType = 'horizontal-path'
                }

                //Columns 
                let refColumns = [1,5,9,13,17,21]
                if(
                        refColumns.includes(column) 
                    // || [2,4].includes(column) && [3].includes(row) 
                    // || [18,20].includes(column) && [2].includes(row)
                ){
                    createCell = true
                    nodeType = 'vertical-path'
                }

                //Clears
                if(
                       [6,7,8, 14,15,16, 22,23,24,  27].includes(column) && row == 1 //1st row
                    // || [2,3,4].includes(column) && row == 5                          //Guardian 2nd row
                    // || [17,21].includes(column) && [1,2,3].includes(row)             //Wanderer
                    // || [24].includes(column) && [5].includes(row)
                ){
                    createCell = false
                }

                //Abort if cell exists
                if(el(`${prefix}${column}-${row}`) != undefined){
                    createCell = false
                }

                //Set cell content
                if(createCell){
                    createTreeCell(column, row, nodeType)
                }
            }

        //Preallocate initial class node
            if      (gs.plObj.class == 'guardian'){

                gs.treeObj[`${prefix}3-1`] = {
                    tileColumn: 3,
                    tileRow: 1,
                    tileType: 'sta',
                    tileConnectors: ['R','L'],
                    allocated: true,
                    imgPath:'sta'
                }

                createTreeCell(3, 1)

            }else if(gs.plObj.class == 'crusader'){

                gs.treeObj[`${prefix}11-1`] = {
                    tileColumn: 11,
                    tileRow: 1,
                    tileType: 'sta',
                    tileConnectors: ['R','L'],
                    allocated: true,
                    imgPath:'sta'
                }

                createTreeCell(11, 1)


            }else if(gs.plObj.class == 'wanderer'){

                gs.treeObj[`${prefix}19-1`] = {
                    tileColumn: 19,
                    tileRow: 1,
                    tileType: 'sta',
                    tileConnectors: ['R','L'],
                    allocated: true,
                    imgPath:'sta'
                }

                createTreeCell(19, 1)

            }

        //Creates tree tile elem
            function createTreeCell(column, row, node){
                //Override node if paths were added in treeStructure
                if(node == 'ver'){
                    node = 'vertical-path'
                }

                //Gen path tile
                if(node == 'vertical-path' || node == 'horizontal-path'){

                    if(node == 'horizontal-path'){
                        el('skill-tree').innerHTML += `
                            <div id="${prefix}${column}-${row}" class='tree-tile path'>
                                <div class="tree-path" style="transform: rotate(90deg)"></div>
                            </div>
                        `
                    } else {
                        el('skill-tree').innerHTML += `
                            <div id="${prefix}${column}-${row}" class='tree-tile path'>
                                <div class="tree-path"></div>
                            </div>
                        `
                    }

                    el(`${prefix}${column}-${row}`).setAttribute('style',`grid-column-start:${column}; grid-row-start:${row}`)

                } 
                
                //Gen empty tile
                else if(node == 'empty'){
                    el('skill-tree').innerHTML += `
                        <div id="${prefix}${column}-${row}" class='tree-tile'></div>
                    `
                    el(`${prefix}${column}-${row}`).setAttribute('style',`grid-column-start:${column}; grid-row-start:${row}`)

                } 
                
                //Gen node
                else {
                    //Find matching obj in gs.treeObj
                    // console.log(`${prefix}${column}-${row}`);
                    let treeObjNode = gs.treeObj[`${prefix}${column}-${row}`]

                    //Set cell content
                        //Add directional connectors  
                    let directionLineElems = ''             
                    treeObjNode.tileConnectors.forEach(direction => {
                        directionLineElems  += `<div class='${direction}'></div>`
                    })
                    

                    let cellContent = `
                        <img class="btn--ico btn-frame" src="./img/tree/${treeObjNode.imgPath}.svg"> 
                        ${directionLineElems}
                    `
        
                    //Creates new tile
                    if(el(`${prefix}${column}-${row}`) == undefined){
                        
                        //Set elem type
                        let elemType = 'button'
                        if(node == 'div'){elemType = 'div'}
                    
                        //Set content
                        el('skill-tree').innerHTML += `
                            <${elemType} id="${prefix}${column}-${row}" class='tree-tile'>
                                ${cellContent}
                            </${elemType}>
                        `
        
                        //Set elem to a particular grid tile
                        el(`${prefix}${column}-${row}`).setAttribute('style',`grid-column-start:${column}; grid-row-start:${row}`)

                        //Add onclick event
                        el(`${prefix}${column}-${row}`).setAttribute('onclick', `nodePreview(this)`)
                    }
                    //Updates existing tile
                    else{
                        el(`${prefix + column}-${row}`).innerHTML = cellContent
                    }

                    //Add class for small travel nodes
                    // console.log(treeObjNode.imgPath)
                    if(['pow','def','tra','lif','inv','slo','dic','cha','sta'].indexOf(treeObjNode.imgPath) > -1){
                        el(`${prefix}${column}-${row}`).classList.add('compact-node')
                    }
                }
            }

        // Adjust tab tree icon if there are unspent skill tree points.
            lvlupUiIndication()

        //Highlight allocated nodes
            Object.keys(gs.treeObj).forEach(node => {
                if(gs.treeObj[node].allocated){
                    allocateTreeNode(node)
                }
            })
    }

    //Highlights the skill tree buttons if points are available
    function lvlupUiIndication(){
        if(gs.plObj.treePoints > 0){
            el('map-character-btn').innerHTML = `<img src="./img/ico/character-active.svg">Character`
            el('tree-btn').innerHTML = `<img src="./img/ico/tree-active.svg">Tree`
        } 
        else {
            el('map-character-btn').innerHTML = `<img src="./img/ico/character.svg">Character`
            el('tree-btn').innerHTML = `<img src="./img/ico/tree.svg">Tree`
        }
    }

//Trigger node pop-up
    function nodePreview(nodeElem){

        //Find related node
            let node = findByProperty(treeRef, 'id', gs.treeObj[nodeElem.id].tileType)
            let objNode = gs.treeObj[nodeElem.id]

        //See if adjacent nodes are allocated
            let adjacentNodeIsAllocated = false
            let nodeConnectors = gs.treeObj[nodeElem.id].tileConnectors
            let adjacentNode, newColumnVal, newRowVal

            nodeConnectors.forEach(connector => {
                //Find next node
                if(        connector == 'T'){

                    newColumnVal = objNode.tileColumn
                    newRowVal    = objNode.tileRow - 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newRowVal--
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'R' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn + 1
                    newRowVal    = objNode.tileRow

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal++
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'D' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn
                    newRowVal    = objNode.tileRow + 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newRowVal++
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'L' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn - 1
                    newRowVal    = objNode.tileRow

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal--
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } 
                  else if (connector == 'RD' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn + 1
                    newRowVal    = objNode.tileRow + 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal++
                        newRowVal++
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'LD' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn - 1
                    newRowVal    = objNode.tileRow + 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal--
                        newRowVal++
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'RT' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn + 1
                    newRowVal    = objNode.tileRow - 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal++
                        newRowVal--
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                } else if (connector == 'LT' && adjacentNodeIsAllocated == false){

                    newColumnVal = objNode.tileColumn - 1
                    newRowVal    = objNode.tileRow - 1

                    adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`]

                    while(adjacentNode == undefined){
                        newColumnVal--
                        newRowVal--
                        adjacentNode = gs.treeObj[`${prefix}${newColumnVal}-${newRowVal}`] 
                    }

                    if(adjacentNode.allocated){
                        adjacentNodeIsAllocated = true
                    }

                    // console.log(el(`${prefix}${newColumnVal}-${newRowVal}`));

                }
                                
            })

        //Update pop-up content
            if(gs.treeObj[nodeElem.id].allocated || adjacentNodeIsAllocated == false){

                el('tree-node-popup').innerHTML = `
                    <div>
                        <h4>${upp(node.name)}</h4>
                        <p> ${upp(node.desc)}.</p>
                    </div>
                `
            } 
            else {

                el('tree-node-popup').innerHTML = `
                    <div>
                        <h4>${upp(node.name)}</h4>
                        <p> ${upp(node.desc)}.</p>
                    </div>
                    <button class="btn--ico btn-frame" onclick="addTreeNode('${node.id}', '${nodeElem.id}')">
                        <img src="./img/ico/add.svg">
                    </button>
                `
            }
        
        el('tree-node-popup').classList.remove('hide')
    }


//Resolve passive checks
    //After item use
    function resolveAfterBeingHit(){
        gs.plObj.treeNodes.forEach(node => {
            if(node.id == 'T24'){

                //Check item type (due to itemless actions)
                if(gs.sourceAction.tags.includes('block') == false) return

                console.log(gs.plObj.dmgDone, gs.plObj.dmgTaken);

                // gs.plObj.dmgDone += gs.plObj.dmgTaken

                changeStat('life', -gs.enObj.dmgDone, gs.enObj)

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`)

            }
        })
    }

    //On-hit check
    function resolveOnHitPassives(){
        gs.plObj.treeNodes.forEach(node => {
            if      (node.id == 'T08'){//leech
                restoreLife(node.val)

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`)

            }else if(node.id == 'T17'){

                //Check item type (due to itemless actions)
                let item = findItemByAction(gs.sourceAction)
                if(item == undefined) return
                if(['club','mace'].includes(item.itemName) == false) return

                gs.plObj.dmgDone += 1

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`)

            }else if(node.id == 'T28'){

                //Check item type (due to itemless actions)
                if(gs.enObj.def < 1) return

                changeStat('def', -1,gs.enObj)
                // gs.enObj.def -= 1

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`) 
            }
        })
    }
    //On-action use
    function resolveOnChargeResolution(){
        gs.plObj.treeNodes.forEach(node => {
            if     (node.id == 'T10'){//Careful use
                if(rng(100) < node.val){

                    //Check item type (due to itemless actions)
                    let item = findItemByAction(gs.sourceAction)
                    if(item == undefined) return

                    gs.sourceAction.actionCharge++
                }
            }
            else if(node.id == 'T11'){//Librarian
                if(rng(100) < node.val){

                    //Check item type (due to itemless actions)
                    let item = findItemByAction(gs.sourceAction)
                    if(item == undefined) return
                    if(item.tags.includes('scroll') == false) return

                    gs.sourceAction.actionCharge += 2
                }
            }
            else if(node.id == 'T12'){//perfect block
                
                if(!gs.sourceAction.tags.includes('block')) return
                if(gs.plObj.roll != gs.enObj.roll) return
                if(['attack', 'combo', 'charged strike'].indexOf(gs.enObj.action.key) > -1 == false) return

                //Check item type (due to itemless actions)
                gs.enObj.power -= node.val

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`) 
                
            }
            else if(node.id == 'T13'){//perfect strike
                
                if(!gs.sourceAction.tags.includes('attack')) return
                if(gs.plObj.roll != gs.enObj.roll) return
                if(['block'].indexOf(gs.enObj.action.key) > -1 == false) return

                //Check item type (due to itemless actions)
                gs.enObj.forcedAction = 'sleep'

                //Log
                gs.logMsg.push(`${node.name}: ${node.desc}`) 
                
            }
        })
        
    }
    //Start of combat
    function resolveStartOfCombatPassives(){
        gs.plObj.treeNodes.forEach(node => {
            if(      node.id == 'T22'){//stealth
                gs.enObj.forcedAction = 'sleep'

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }else if(node.id == 'T21' && gs.plObj.power == 0){//static power

                changeStat('power', 1, gs.plObj)
                
                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
        })     
    }
    //End of combat check
    function resolveEndOfCombatPassives(){
        gs.plObj.treeNodes.forEach(node => {
            if(node.id == 'T07'){//recovery

                restoreLife(node.val)

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
        }) 
    }
    //On death
    function resolveOnDeathPassives(){
        gs.plObj.treeNodes.forEach(node => {
            if(node.id == 'T09' && node.activated != true){//recovery

                gs.plObj.life = node.val

                //Set variable
                node.activated = true

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
        }) 
    }
    //On stat change
    function resolveOnStatChangePassives(stat, value){
        let val = 0

        gs.plObj.treeNodes.forEach(node => {
            if    (node.id == 'T14' && stat == 'exp' && rng(100) < node.chance){//scholar

                //Calc
                gs.plObj.exp += node.val

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
            else if(node.id == 'T15' && stat == 'def' && value > 0){//bastion
                //Set return value
                val = node.val

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
            else if(node.id == 'T29' && stat == 'power' && value > 0){//power armor

                gs.plObj['def'] += 1

                //Trigger floating number
                gs.plObj[`defChangeMarker`] = true
                gs.plObj[`defChange`] += 1

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
        }) 

        return val
    }
    //On dice roll
    function resolvePostRollTreePassives(){
        gs.plObj.treeNodes.forEach(node => {
            if      (node.id == 'T16' && gs.plObj.roll == 1){//scholar
                let negativeStats = []

                //Check if player has a negative stat
                if(gs.plObj.def < 0){
                    negativeStats.push('def')
                }else if (gs.plObj.power < 0){
                    negativeStats.push('power')
                }

                let randomStat = rarr(negativeStats)

                changeStat(randomStat, Math.round((gs.plObj[randomStat]/2) * -1), gs.plObj )

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }else if(node.id == 'T18'){//def recovery

                //Check if player has a negative stat
                if(gs.plObj.def > -1) return

                changeStat('def', 1, gs.plObj)

                //Log
                gs.logMsg.push(`${upp(node.name)} ${node.desc}.`)
            }
        }) 
    }
    //On poison calculation
    function resolveOnPoisonStackCalculation(){
        gs.plObj.treeNodes.forEach(node => {
            if    (node.id == 'T26'){//plague

                let roll = rng(5)

                if (roll == 5){ //20% to increase poison stacks
                    gs.enObj.poisonStacks += 1
                    gs.logMsg.push(`poison: +1 stack. ${gs.enObj.poisonStacks - 1} stacks remaining`)
                }
            }
        })
    }


//Tree structure
    let treeStructure = [
        // NOTATION for c:
        // T -> top   / col--
        // R -> right / row++
        // D -> down  / col++
        // L -> left  / row--
        // RD -> 45    / row++ col++
        // RT -> 45    / row++ col--
        // LD -> 45    / row-- col++
        // LT -> 45    / row-- col--

        // FORMAT
        // column(x)-row(y)_id_connectors
        // '**-**_G00_T-R-D-L-RT-LT',
        // '**-**_G00_T-R-D'        ,
        // '**-**_G00_T-R'          ,
        // '**-**_G00_T'            ,
        // /*----------------------*/

        // GUARDIAN 
        //      1                          2                          3                          4                          5
        /* 1*/ '1-1_T17_R-D'            , /*----------------------*/ '3-1_def_R-L'           , /*----------------------*/ '5-1_T03_D-L'           ,
        /* 2*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 3*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 4*/ /*----------------------*/ /*----------------------*/ '3-4_T12_D'              , /*----------------------*/ /*----------------------*/
        /* 5*/ '1-5_def_T-R-D'          , /*----------------------*/ '3-5_def_T-R-L'          , /*----------------------*/ '5-5_def_T-R-D-L-LD'     ,
        
        /* 6*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ '4-6_def_RT-LD'          , /*----------------------*/
        /* 7*/ '1-7_def_T-D-R'          , '2-7_T18_L'              , '3-7_T24_RT'             , '4-7_def_R-D'            , '5-7_def_T-L-D'          ,
        /* 8*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ '4-8_T15_T'              , /*----------------------*/
        /* 9*/ '1-9_pow_T-R'            , /*----------------------*/ '3-9_pow_L-R'            , /*----------------------*/ '5-9_pow_T-R-L'          ,

        // /*10*/ /*----------------------*/ /*----------------------*/ '3-10_T19_T'             , /*----------------------*/ /*----------------------*/
        // /*11*/ /*----------------------*/ '2-11_T15_D'             , /*----------------------*/ '4-11_T25_D'             , /*----------------------*/
        // /*12*/ /*----------------------*/ '2-12_pow_LD-T'          , /*----------------------*/ '4-12_pow_RD-T'          , /*----------------------*/
        // /*13*/ '1-13_pow_T-RT-R'        , /*----------------------*/ /*----------------------*/ /*----------------------*/ '5-13_pow_T-R-L-LT'      ,
    

        // Guardian - Crusader intersection 
        //                                 6                          7                          8
        /* 5*/ /*                      */ /*----------------------*/ '7-5_T05_R-L'            , /*----------------------*/ /*                      */
        /* 6*/ /*                      */ /*----------------------*/ '7-6_T02_R'              , '8-6_inv_RT-L'           , /*                      */
        /* 7*/ /*                      */ /*----------------------*/ /*----------------------*/ '8-7_inv_D-R'            , /*                      */
        /* 8*/ /*                      */ /*----------------------*/ /*----------------------*/ '8-8_T29_T'              , /*                      */
        /* 9*/ /*                      */ /*----------------------*/ '7-9_pow_R-L'            , /*----------------------*/ /*                      */

        // /*10*/ /*                      */ /*----------------------*/ '7-10_T20_T'             , /*----------------------*/ /*                      */
        // /*11*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        // /*12*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        // /*13*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */


        // CRUSADER 
        //      9                          10                         11                         12                         13
        /* 1*/ '9-1_T01_R-D'            , /*----------------------*/ '11-1_lif_R-L'           , /*----------------------*/ '13-1_T07_D-L'           ,
        /* 2*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 3*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 4*/ /*----------------------*/ /*----------------------*/ '11-4_T13_D'             , /*----------------------*/ /*----------------------*/
        /* 5*/ '9-5_lif_T-R-D-L-RD-LD'  , /*----------------------*/ '11-5_lif_T-R-L'         , /*----------------------*/ '13-5_lif_T-R-D-L-LD'    ,

        /* 6*/ /*----------------------*/ '10-6_lif_LT-R'          , '11-6_T09_L'             , '12-6_lif_RT-LD'         , /*----------------------*/
        /* 7*/ '9-7_lif_T-D-L'          , /*----------------------*/ '11-7_T28_RT'            , '12-7_lif_R-D'           , '13-7_lif_T-D-L'         ,
        /* 8*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ '12-8_T21_T'             , /*----------------------*/
        /* 9*/ '9-9_lif_T-R-L'          , /*----------------------*/ /*----------------------*/ /*----------------------*/ '13-9_lif_T-R-L'         ,

        // /*10*/ /*----------------------*/ /*----------------------*/ '11-10_T04_T'            , /*----------------------*/ /*----------------------*/
        // /*11*/ /*----------------------*/ '10-11_T09_D'            , /*----------------------*/ '12-11_T21_D'            , /*----------------------*/
        // /*12*/ /*----------------------*/ '10-12_cha_T-LD'         , /*----------------------*/ '12-12_cha_T-RD'         , /*----------------------*/
        // /*13*/ '9-13_cha_T-R-L-RT'      , /*----------------------*/ /*----------------------*/ /*----------------------*/ '13-13_cha_T-R-L-LT'     ,


        // Crusader - Wanderer intersection 
        //                                 14                        15                          16
        /* 5*/ /*                      */ /*----------------------*/ '15-5_T38_R-L'           , /*----------------------*/ /*                      */ 
        /* 6*/ /*                      */ /*----------------------*/ '15-6_T06_R'             , '16-6_inv_L-RT'          , /*                      */
        /* 7*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        /* 8*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        /* 9*/ /*                      */ /*----------------------*/ '15-9_dic_R-L'           , /*----------------------*/ /*                      */

        // /*10*/ /*                      */ /*----------------------*/ '15-10_T35_T'            , /*----------------------*/ /*                      */
        // /*11*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        // /*12*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */
        // /*13*/ /*                      */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                      */


        // WANDERER
        //      17                         18                         19                         20                         21
        /* 1*/ '17-1_T16_R-D'           , /*----------------------*/ '19-1_slo_R-L'           , /*----------------------*/ '21-1_T10_D-L'           ,
        /* 2*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 3*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/
        /* 4*/ /*----------------------*/ /*----------------------*/ '19-4_T14_D'             , /*----------------------*/ /*----------------------*/
        /* 5*/ '17-5_slo_T-R-D-L-LD-RD' , /*----------------------*/ '19-5_slo_T-R-L'         , /*----------------------*/ '21-5_slo_T-D-L-LD'      ,

        /* 6*/ /*----------------------*/ '18-6_slo_R-LT'          , '19-6_T08_L'             , '20-6_slo_LD-RT'         , /*----------------------*/
        /* 7*/ /*----------------------*/ /*----------------------*/ '19-7_T26_RT'            , '20-7_slo_D-R'           , '21-7_slo_T-D-L'         ,
        /* 8*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ '20-8_T22_T'             , /*----------------------*/
        /* 9*/ '17-9_dic_T-R-L'         , /*----------------------*/ '19-9_dic_R-L'           , /*----------------------*/ '21-9_dic_T-L'           ,

        // /*10*/ /*----------------------*/ /*----------------------*/ '19-10_T23_T'            , /*----------------------*/ /*----------------------*/
        // /*11*/ /*----------------------*/ '18-11_T08_D'            , /*----------------------*/ '20-11_T31_D'            , /*----------------------*/
        // /*12*/ /*----------------------*/ '18-12_dic_LD-T'         , /*----------------------*/ '20-12_dic_T-RD'         , /*----------------------*/
        // /*13*/ '17-13_dic_T-R-L-RT'     , /*----------------------*/ /*----------------------*/ /*----------------------*/ '21-13_dic_T-L-LT'          ,


        // // Wanderer - Scholar intersection 
        // //                               22                       23                       24
        // /* 5*/ /*                       */ '22-5_dic_R-L'       , '23-5_dic_L'          , /*----------------------*/ /*                       */
        // /* 6*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */
        // /* 7*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */
        // /* 8*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */
        // /* 9*/ /*                       */ /*----------------------*/ '23-9_tra_R-L'       , /*----------------------*/ /*                       */

        // /*10*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */
        // /*11*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */
        // /*12*/ /*                       */ '22-12_T14_LD'         , /*----------------------*/ /*----------------------*/ /*                       */
        // /*13*/ /*                       */ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*                       */


        // // SCHOLAR
        // //      25                       26                       27                       28                       29
        // /* 1*/ '25-1_tra_R-D'       , /*----------------------*/ /*----------------------*/ /*----------------------*/ '29-1_tra_L-D'       ,
        // /* 2*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/                                                                                                                                       
        // /* 3*/ '25-3_tra_T-D'       , /*----------------------*/ '27-3_tra_D'          , /*----------------------*/ '29-3_tra_T-D'       ,       
        // /* 4*/ /*----------------------*/ /*----------------------*/ '27-4_tra_T-D'       , /*----------------------*/ /*----------------------*/                                                                                                                                           
        // /* 5*/ '25-5_tra_T-R-D'    , /*----------------------*/ '27-5_tra_T-R-L'    , /*----------------------*/ '29-5_tra_T-D-L'    , 

        // /* 6*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ 
        // /* 7*/ '25-7_tra_T-D'       , /*----------------------*/ /*----------------------*/ '28-7_pas_R'          , '29-7_tra_T-D-L'    ,  
        // /* 8*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ 
        // /* 9*/ '25-9_tra_T-R-D-L' , /*----------------------*/ '27-9_tra_R-L-D'    , /*----------------------*/ '29-9_tra_T-D-L'    , 

        // /*10*/ /*----------------------*/ /*----------------------*/ '27-10_T11_T'         , /*----------------------*/ /*----------------------*/ 
        // /*11*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ /*----------------------*/ 
        // /*12*/ /*----------------------*/ '26-12_pas_LD'         , /*----------------------*/ '28-12_pas_RD'         , /*----------------------*/ 
        // /*13*/ '25-13_tra_T-R-L-RT', /*----------------------*/ /*----------------------*/ /*----------------------*/ '29-13_tra_T-LT-L'   , 
    ]

//Tree node references
//* name: should match .svg icon name
    let treeRef = [
    //PLACEHOLDERS
        {  id:'tra', name:'connector' ,
            desc:'connector node provides no passive bonuses',

        },{id:'pas', name:'passive' ,
            desc:'description',

        },{id:'sta', name:'start' ,
            desc:'description',

        },

    // TRAVEL NODES
        {  id:'lif', name:'life' ,
            desc:'add 1 base life',
            passiveStats:[{stat:'life',  value:1}],

        },{id:'dic', name:'dice' ,
            desc:'add 0.25 to dice',
            passiveStats:[{stat:'dice-mod',  value:0.25}],

        },{id:'slo', name:'slot' ,
            desc:'add 0.25 to equipment slot',
            passiveStats:[{stat:'slots',  value:0.25}],

        },{id:'pow', name:'power' ,
            desc:'add 0.25 to base power',
            passiveStats:[{stat:'power',  value:0.25}],

        },{id:'inv', name:'inventory' ,
            desc:'add 3 to inventory capacity',
            passiveStats:[{stat:'inventory',  value:3}],

        },{id:'def', name:'defense' ,
            desc:'add 0.25 base def',
            passiveStats:[{stat:'def',  value:0.25}],

        },{id:'cha', name:'charge' ,
            desc:'add 1 charge to items',

        },

    //GUARDIAN d4
        //sq1
        {  id:'T17', name:'blunt weapon mastery',
            desc:'maces and clubs deal 1 extra damage',
            val:1,

        },{id:'T03', name:'superior defense',
            desc:'gain 1 base def',
            passiveStats:[{stat:'def',   value:1}],

        },{id:'T12', name:'perfect block',
            desc:'blocking an enemy attack with matching dice roll, will reduce enemy power by 2',
            val:2,

        },
        
        {  id:'T18',name:'living armor',
            desc:'recover 1 def if def is negative',

        },{id:'T15',name:'bastion',
            desc:'whenever you gain def, gain 1 extra point',
            val: 1,

        },{id:'T24',name:'reflect',
            desc:'when you block, unblocked dmg is reflected to enemy',
        },

        //Intersection 
        {  id:'T05', name:'greater dice',
            desc:'gain 1 to base dice',
            passiveStats:[{stat:'dice-mod',  value:1}],

        },{id:'T02', name:'greater life',
            desc:'increase base life by 10%',
            passiveStats:[{stat:'life%', value:10}],

        },{id:'T29', name:'power armor',
            desc:'gain 1 def whenever you gain power',
            val: 1,
        },

        

    //CRUSADER d6
        {  id:'T01', name:'superior life' ,
            desc:'add 30 base life',
            passiveStats:[{stat:'life',  value:30}],

        },{id:'T07', name:'recovery',
            desc:'restore 3 life at end of the combat',
            val:3,

        },{id:'T13', name:'perfect strike',
            desc:'attacking a blocking enemy with matching dice roll, will force enemy to skip the next turn',

        },

        {  id:'T09', name:'undying',
            desc:'once per encounter, when you reach 0 life, survive with 1 life',
            val: 1,

        },{id:'T21', name:'static power',
            desc:'if your power is 0 at the start of the fight, gain 1 power',
        },{id:'T28', name:'def break',
            desc:'when attacking an enemy, reduce their def by 1 extra point',

        },

        //Intersection 
        {  id:'T38', name:'lower dice',
            desc:'reduce dice by 1',
            passiveStats:[{stat:'dice-mod',  value:-1}],

        },{id:'T06', name:'equipment slot',
            desc:'gain 1 equipment slot',
            passiveStats:[{stat:'slots', value:1}],

        },{id:'T11', name:'librarian',
            desc:'25% chance to gain 1 action charge when you use a scroll',
            val:25,

        },
        
    //WANDERER d8
        {  id:'T10', name:'careful use',
            desc:'25% chance to avoid losing an action charge on action use',
            val:25,

        },{id:'T16', name:'close combat',
            desc:'on a die roll of one, restore half of a random negative attribute',

        },{id:'T14', name:'scholar',
            desc:'50% chance to gain 1 extra exp point whenever you gain exp',
            val: 1,
            chance: 50,

        },
        {  id:'T26', name:'plague',
            desc:'each stack of poison you applied has 20% chance to double instead of reducing an attribute',

        },{id:'T08', name:'leech',
            desc:'restore 1 life whenever you hit an enemy',
            val:1,

        },{id:'T22', name:'stealth',
            desc:'enemy skips 1st turn',
        },
        




        //Prototype
        {  id:'T00', name:'power armor',
            desc:'Gain 1 extra def per power',

        },{id:'T00', name:'absolute barrier',
            desc:'Barrier absorbs 100% of damage.',

        },{id:'T00', name:'speed advantage',
            desc:'Enemy skipts every 5th turn',

        },

        //Archive
        {  id:'T29', name:'power armor',
            desc:'gain 1 def whenever you gain power',
        },{id:'T20', name:'life gain',
            desc:'whenever you gain life, gain 1 extra',

        },{id:'T25', name:'shield mastery',
            desc:'your block actions additionally reduce attack damage by 1',
            val: 1,

        },{id:'T20', name:'life gain',
            desc:'whenever you gain life, gain 1 extra',

        },{id:'T30', name:'growth',
            desc:'gain 2 extra life from lesser life nodes',
        },{id:'T04', name:'sword mastery',
            desc:'..sword action.. also gains extra damage on roll 5',

        },{id:'T19', name:'layered defense',
            desc:'you can equip multiple body armors',
            val:2,

        }
    ]