
//Map object contains info about the map that is used to generate html map element
class MapObj{
    constructor(type){
        
        this.mapId = "map" + Math.random().toString(8).slice(2) //Generates unique map id
        this.tiles = [] //Ref array for all tile objects
        let placedUniqueTiles = ''

        //Pick map profile
        gs.mapProfile = mapProfileRef[`stage${gs.stage}`]
        if(type == 'village'){
            gs.mapProfile = mapProfileRef[`village`]
        }

        //Background image ids
        let tileSetUnique = 'monument-1, monument-2, grave'.split(', ') //castle
        let tileSetRare   = 'chest-1, chest-2, house-1, house-2'.split(', ') //mine
        let tileSetCommon = 'casino, blacksmith, camp-1, camp-2, merchant-1, merchant-2, lake-1, lake-2, lake-3, dungeon-1'.split(', ') //dungeon, 
        let tileSetBase   = 'empty-1, empty-2, empty-3'.split(', ')
        let forests       = 'forest-1, forest-2, forest-3, empty-4, empty-5, empty-6, empty-7, road-1'.split(', ')
        
        //Tiles that can't repeat on the same stage
        let uniqueTiles   = 'merchant, blacksmith, enchanter, casino, camp, monument, house, dungeon'
        

        //Set map dimensions
        if(gs.mapProfile.size == undefined){
            gs.mapProfile.size = mapProfileRef.referenceMap.size
        }

        this.xAxis = gs.mapProfile.size[0] //+ gs.stage
        this.yAxis = gs.mapProfile.size[1] //+ gs.stage
        


        //Dungeon setup
        if(type == 'dungeon'){
            this.xAxis = 3
            this.yAxis = rng(3 + gs.stage, 3)

            //Generates unique map id
            this.mapId = "dungeon" + Math.random().toString(8).slice(2)

            tileSetUnique = 'road-1'.split(', ') //castle
            tileSetRare   = 'enchanter-1'.split(', ') //mine
            tileSetCommon = ''.split(', ') //dungeon, 
            tileSetBase   = 'empty-1, empty-2, empty-3'.split(', ')
            forests       = ''.split(', ')
        }
        else if (type == 'village'){
            //Set map dimensions
            this.xAxis = gs.mapProfile.size[0] //+ gs.stage
            this.yAxis = gs.mapProfile.size[1] //+ gs.stage

            //Generates unique map id
            this.mapId = "village" + Math.random().toString(8).slice(2)

            //Tiles override
            tileSetUnique = ''.split(', ') //castle
            tileSetRare   = ''.split(', ') //mine
            tileSetCommon = ''.split(', ') //dungeon, 
            tileSetBase   = 'empty-1, empty-2, empty-3'.split(', ')
            forests       = ''.split(', ')
        }

        //Vars for tile ID generation
        let yAxis = 0 
        let xAxis = 1 //Offset because i know js yes

        //Generates tiles
        for(let i = 0; i < this.yAxis * this.xAxis; i++){

            let tile = {}
            let roll = rng(100)
            
            //Modify id to match rows and columns
            if(i % this.xAxis === 0){
                xAxis = 1
                yAxis++
            }
            tile.tileId = `${xAxis++}-${yAxis}`

            //% distriburion of tilesType
            if       (roll > 95){
                tile.tileType = tileSetUnique[rng((tileSetUnique.length - 1), 0)]
            }else if (roll > 84){
                tile.tileType = tileSetRare[rng((tileSetRare.length - 1), 0)]
            }else if (roll > 65){
                tile.tileType = tileSetCommon[rng((tileSetCommon.length - 1), 0)]
            }else if (roll > 40){
                tile.tileType = forests[rng((forests.length - 1), 0)]
            }else               {
                tile.tileType = tileSetBase[rng((tileSetBase.length - 1), 0)]
            }

            //Prevent reapears of unique tiles
                let tileTypePrefix = tile.tileType.split('-')[0];
                if(uniqueTiles.includes(tileTypePrefix)){
                    if(placedUniqueTiles.includes(tileTypePrefix)){
                        tile.tileType = tileSetBase[rng((tileSetBase.length - 1), 0)]
                    }else{
                        placedUniqueTiles += `${tileTypePrefix}, `
                    }
                }

            //Add player & enemies
                //Add enemy units 30%
                let rollForEne = rng(100)
                let rollTarget

                //Takes the spawn frequency from profile
                if(gs.mapProfile.enemySpawnFrequency !== undefined){
                    rollTarget = gs.mapProfile.enemySpawnFrequency
                }else{
                    rollTarget = mapProfileRef.referenceMap.enemySpawnFrequency
                }

                //If roll passes the treshold enemy spawn value -> add enemy to tile
                if (rollForEne < rollTarget){ 
                    let eneQuant = rng(config.enemyPartyCap)
                    tile.enemyUnit = true
                    tile.enemyQuant = eneQuant
                    gs.totalEnemies += eneQuant //Counts total enemies
                }
                
                //Flip tiles
                if(1 === rng(2)){
                    tile.flip = true
                }

                //LORE: Add event id to event tiles
                if(tile.tileType.startsWith('monument')){
                    tile.loreEvent = rng(eventRef.length)
                }

                this.tiles.push(tile)
        }

        //MANDATORY TILES
            //Map position is set in last main-and-combat.js
                let overrides = [
                    {//Player starting tile
                        tileId:`${Math.round(this.xAxis/2)}-${this.yAxis}`, 
                        tileType: `entrance-1`, 
                        playerUnit: true, 
                        enemyUnit: false, 
                        flip: false
                    }, 
                    {//Exit tile
                        tileId:`${Math.round(this.xAxis/2)}-1`, 
                        tileType: 'exit-1', 
                        enemyUnit: true, 
                        enemyQuant: 1,
                        flip: false,
                        boss: true,
                    },
                ]

            //Dungeon overrides
                if(type == 'dungeon'){
                    overrides = [
                        {//Player (adds dungeon exit)
                            tileId:`${Math.round(this.xAxis/2)}-${this.yAxis}`,
                            tileType: `dungeon-exit`, 
                            playerUnit: true, 
                            enemyUnit: false, 
                        }, 
                        {//Exit (boss tile) (adds a boss)
                            tileId:`${Math.round(this.xAxis/2)}-1`, 
                            enemyUnit: true, 
                            enemyQuant: 1,
                            boss: true,
                        },
                    ]
                }
            //Village overrides
                else if(type == 'village'){
                    overrides = [
                        {//Player starting tile
                            tileId:`${Math.round(this.xAxis/2)}-${this.yAxis}`, 
                            tileType: `entrance-1`, 
                            playerUnit: true, 
                            enemyUnit: false, 
                            flip: false
                        }, 
                        {//Exit tile
                            tileId:`${Math.round(this.xAxis/2)}-1`, 
                            tileType: 'exit-1', 
                            enemyUnit: false, 
                            enemyQuant: 0,
                            flip: false,
                            boss: false,
                        },
                    ]

                    //Add 1 enemy unit for the 1st stage
                    if(gs.stage == 0){
                        overrides = [
                            {//Player starting tile
                                tileId:`${Math.round(this.xAxis/2)}-${this.yAxis}`, 
                                tileType: `entrance-1`, 
                                playerUnit: true, 
                                enemyUnit: false, 
                                flip: false
                            }, 
                            {//Exit tile
                                tileId:`${Math.round(this.xAxis/2)}-1`, 
                                tileType: 'exit-1', 
                                enemyUnit: true, 
                                enemyQuant: 2,
                                flip: false,
                                boss: false,
                            },
                        ] 
                    }
                }

            //Adds mandatory tiles from config
                config.mandatoryTiles.forEach(tile => {
                    if(type == 'dungeon') return //why dungeon was excluded?
                    overrides.push(tile) //add mandatory tile to required tiles arr
                })

            //Add mandatory tiles from stage profile
                //Resolve undefined arr
                let mandatoryTilesRefArr
                if(
                    typeof gs.mapProfile == 'undefined' ||
                    typeof gs.mapProfile.mandatoryTiles == 'undefined'
                ){
                    mandatoryTilesRefArr = mapProfileRef.referenceMap.mandatoryTiles
                }else{
                    mandatoryTilesRefArr = gs.mapProfile.mandatoryTiles
                }

                // console.log(mandatoryTilesRefArr, mapProfileRef.referenceMap.mandatoryTiles);
                mandatoryTilesRefArr.forEach(tile => {
                    if(type == 'dungeon') return //why dungeon was excluded?
                    overrides.push(tile) //add mandatory tile to required tiles arr
                })

            //Add all mandatory tiles from overrides arr
                overrides.forEach(reqTile => {
                
                    //Find tile by id
                    let tile = findByProperty(this.tiles, 'tileId', reqTile.tileId)
                    // console.log(reqTile, tile);

                    //If mandatory tiles overlap, picks new random tile id.
                    //Inf loop will check for new random id
                    if(tile == undefined || tile.required){
                        while(true){

                            //Picks random tile on the map
                            reqTile.tileId = `${rng(this.xAxis)}-${rng(this.yAxis)}`
                            tile = findByProperty(this.tiles, 'tileId', reqTile.tileId)

                            //Checks if tile is not required
                            if(!tile.required){
                                break;//Stops the loop
                            }
                        }
                    }

                    //Add required tile for loop above
                    tile.required = true

                    //Set properties
                    //Gets all props and checks for defined ones.
                    //***Add this for all other class object overrides.
                    Object.getOwnPropertyNames(reqTile).forEach(property =>{
                        if(reqTile[property] != undefined){
                            tile[property] = reqTile[property]
                        }
                    })
                })
    }
}

//MAP UI

    //Adds images and builds the map elem based on map object
    function genMap(){
        //Sets map size & description (+1 due to border)
            el('map-container').setAttribute('style',`
                max-width:${120 * gs.mapObj.xAxis +1}px;
            `)
            //+32 padding +1 border
            // el('map-frame').setAttribute('style', `
            //     max-height:${120 * gs.mapObj.yAxis + 2 + 400}px;
            // `)

        //Gen tiles
            let tiles = ``

            //Generate tile elements
            mapRef.forEach(tile => {
                //Tile bg image
                    let img = `<img src="./img/map/${tile.tileType}.svg">`
                    //Flip tile image
                    if(tile.flip){
                        img = `<img style='transform: scale(-1, 1);' src="./img/map/${tile.tileType}.svg">`
                    }

                //Add unit images
                    let unit = ``
                    if      (tile.playerUnit){ // Player unit image
                        unit = `
                            <div id="player-unit" class="map-unit">
                                <img src="./img/map/player-unit-flag.svg" id="player-unit-flag">
                                <img src="./img/map/player-unit-body.svg" id="player-unit-body">
                                <img src="./img/map/player-unit-arms.svg" id="player-unit-arms">
                            </div>
                        `
                        gs.playerLocationTile = tile
                    }else if(tile.boss){       // Boss unit
                        unit = `
                            <img src="./img/map/boss-unit-1.svg" class="map-unit">
                        `
                    }else if(tile.enemyUnit){  // Ene unit image
                        unit = `
                            <img src="./img/map/enemy-unit-${tile.enemyQuant}.svg" class="map-unit"> 
                        `
                    }


                tiles += `
                    <button id='${tile.tileId}' class='map-tile'>
                        ${img}
                        ${unit}
                    </button>
                `
            })

        //Map containers (top and bottom images)
            //Set stage decoration elems
            //Repeat stage decorations after the 2nd one
            //Village
            if(gs.mapObj.mapId.includes('village')){
                el('map').setAttribute('style', `background-color:var(--stage-bg-1);`)

                el('map-container').innerHTML = `
                    <img id="top-ext" style="height:320px; width: 360px;" src="./img/map/top-village.svg"></img>
                    ${tiles}
                    <img              style="height:320px; width: 360px;" src="./img/map/bot-village.svg"></img>
                ` 
            }
            //Dungeon
            else if(gs.mapObj.mapId.includes('dungeon')){
                el('map-container').innerHTML = `
                    <div id="top-ext" style="height:320px; width: 360px;"></div>
                    ${tiles}
                    <div              style="height:320px; width: 360px;"></div>
                `
            }
            else if (gs.stage > 2){
                //Set map bg color
                el('map').setAttribute('style', `background-color:var(--stage-bg-3);`)

                el('map-container').innerHTML = `
                    <img id="top-ext" style="height:320px; width: 360px;" src="./img/map/top-ext-2.svg"></img>
                    ${tiles}
                    <img              style="height:320px; width: 360px;" src="./img/map/bot-ext-2.svg"></img>
                `
            }else{
                el('map').setAttribute('style', `background-color:var(--stage-bg-${gs.stage});`)

                el('map-container').innerHTML = `
                    <img id="top-ext" style="height:320px; width: 360px;" src="./img/map/top-ext-${gs.stage}.svg"></img>
                    ${tiles}
                    <img              style="height:320px; width: 360px;" src="./img/map/bot-ext-${gs.stage}.svg"></img>
                `
            }
            
            

        resolveMove()

        //Scroll map to the bottom on page load
        setTimeout(function(){
            el('player-unit').scrollIntoView({block:'end'})
        }, 1);
    }
    
    //Moves unit
    function movePlayerUnit(elem){

        mapRef.forEach(tile => {
            //add player unit to target tile
            if(tile.playerUnit){ 
                tile.playerUnit = false
            }
            //remove enemy unit from target tile
            else if(tile.tileId == elem.id){ 
                tile.playerUnit = true
            }
        })
        
        //Readjust the viewport
            //Get current tile X
            let startIdRef = []
            //Add current tile location id values as int to startIdRef
            gs.playerLocationTile.tileId.split('-').forEach(val =>{
                startIdRef.push(parseInt(val))
            })

            //Get target tile Y
            let targetIdRef = []
            findByProperty(mapRef, 'tileId', elem.id).tileId.split('-').forEach(val =>{
                targetIdRef.push(parseInt(val))
            })

        //PAN MAP
            // //Right
            // if(startIdRef[0] < targetIdRef[0]){
            //     el('map').scrollBy(120,0)
            // }
            // // Left
            // else if(startIdRef[0] > targetIdRef[0]){
            //     el('map').scrollBy(-120,0)
            // }
            // //Bottom
            if(startIdRef[1] < targetIdRef[1]){
                el('map-frame').scrollBy(0,120)
            }
            //Top
            else if(startIdRef[1] > targetIdRef[1]){
                el('map-frame').scrollBy(0,-120)
            }

        //Stats for end game scores
        gs.turnCounter++

        //Update player location
        gs.playerLocationTile = findByProperty(mapRef, 'tileId', elem.id)
        
        //Save if non-combat tile
        if(gs.playerLocationTile.enemyUnit != true){
            saveGame()
        }

        //Regen move envents
        resolveMove()

        syncUi()
    }

    //Adds movement events to tiles.
    function resolveMove(){
        //Converts id to intigers
        let tileIdRef = []
        gs.playerLocationTile.tileId.split('-').forEach(val =>{
            tileIdRef.push(parseInt(val))
        })

        //Adds movement events to map tiles
        mapRef.forEach(tile => {
            // console.log(tile.tileId);

            //Relocate player image
            if(tile.playerUnit && tile.enemyUnit){
                el(tile.tileId).append(el('player-unit'))

                //Remove existing unit
                    //Remove unit image
                    el(tile.tileId).childNodes[3].remove() 

                tile.enemyUnit = false
                gs.playerLocationTile = tile
            }
            else if(tile.playerUnit){
                el(tile.tileId).append(el('player-unit'))
                gs.playerLocationTile = tile
            }

            //Add event if adjacent
            if(
                tile.tileId == gs.playerLocationTile.tileId          || //Player tile

                tile.tileId == `${tileIdRef[0]}-${tileIdRef[1]+1}`   || //+1 row
                tile.tileId == `${tileIdRef[0]}-${tileIdRef[1]-1}`   || //-1 row
                tile.tileId == `${tileIdRef[0]+1}-${tileIdRef[1]}`   || //+1 col
                tile.tileId == `${tileIdRef[0]-1}-${tileIdRef[1]}`   ||   //-1 col

                tile.tileId == `${tileIdRef[0]+1}-${tileIdRef[1]+1}` ||
                tile.tileId == `${tileIdRef[0]-1}-${tileIdRef[1]-1}` ||
                tile.tileId == `${tileIdRef[0]+1}-${tileIdRef[1]-1}` ||
                tile.tileId == `${tileIdRef[0]-1}-${tileIdRef[1]+1}`    
            ){
                //Clear all events
                el(tile.tileId).removeAttribute("onmousedown")
                if(!gs.playerLocationTile.tileType.startsWith('exit')){ //Temporary event for top-ext.
                    el('top-ext').removeAttribute("onmousedown")
                }

                //Combat event
                if(tile.enemyUnit && tile.tileId != gs.playerLocationTile.tileId){
                    el(tile.tileId).setAttribute("onmousedown", 'initiateCombat()')
                }
                //Exit event
                else if(tile.tileType.startsWith('exit')){
                    el(tile.tileId).setAttribute('onmousedown', 'enterVillage()')
                    el('top-ext').setAttribute('onmousedown', 'enterVillage()')

                    if(gs.mapObj.mapId.startsWith('village')){
                        el(tile.tileId).setAttribute('onmousedown', 'nextStage()')
                        el('top-ext').setAttribute('onmousedown', 'nextStage()')
                    }
                }
                //POI event
                else if(!tile.tileType.startsWith('empty') || !tile.tileType.startsWith('forest')){
                    if(tile == gs.playerLocationTile){
                        el(tile.tileId).setAttribute('onmousedown', 'mapEvent()') 
                    }
                }
                //Move event
                if(tile.tileId != gs.playerLocationTile.tileId){
                    el(tile.tileId).setAttribute("onmousedown", `movePlayerUnit(this), ${el(tile.tileId).getAttribute('onmousedown')}`)
                }
            }

            //Remove event from other tiles.
            else{
                el(tile.tileId).removeAttribute("onmousedown")
            }
        })
    }

    //Casino event
    function runCasino(bet){

        //Open casino
        if(bet == undefined){
            //Update player coins indicator
            el('casino-coins').innerHTML = `Your coins: ${gs.plObj.coins}<img src='./img/ico/coin.svg'>`

            screen('casino-screen')
        }
        else{

            //Check if player has enough coins
            if(gs.plObj.coins < bet) return showAlert(`Not enough coins to make a bet.`)
            gs.plObj.coins -= bet
    
            let cardQuant = 3
            let cardsValues = ['card-1','card-2','card-3','card-4','card-5']
            let rollResult = []
    
            for(i = 0; i < cardQuant; i++){
                let cardRoll = rarr(cardsValues) //Picks one of 
                rollResult.push(cardRoll) //Get random card value
                el(`card-${i}`).setAttribute('src',`./img/map/${cardRoll}.svg`)
            }

            //Update 
    
            //Get highest duplicate value
            let maxDuplicates = countDuplicatesInArr(rollResult, 'maxValue')
    
            //If at least two cards are the same give player 2x
            if(maxDuplicates > 2){
                el('casino-outcome').innerHTML = `You win ${bet * 2} coins.`
                gs.plObj.coins += bet * 3
            }
            //If 3 same give player 3x
            else if(maxDuplicates > 1){
                el('casino-outcome').innerHTML = `You win ${bet} coins.`
                gs.plObj.coins += bet * 2
            }
            //Else player looses
            else {
                el('casino-outcome').innerHTML = `You lost.`
            }

            //Update player coins indicator
            el('casino-coins').innerHTML = `Your coins: ${gs.plObj.coins}<img src='./img/ico/coin.svg'>`
        }


    }

    //Generic event.
    function mapEvent(){
        
        let eventType = gs.playerLocationTile.tileType

        // if      (eventType.startsWith('lake')){
        //     if(gs.playerLocationTile.visited != true){
        //         let numberOfFish = rng(12,4)
        //         gs.plObj.food += numberOfFish
        //         el('event-cover').setAttribute('src','./img/bg/lake.svg')
        //         el('event-desc').innerHTML =`You found ${numberOfFish} <img src="./img/ico/food.svg">`

        //         syncUi()
        //     }else{
        //         el('event-cover').setAttribute('src','./img/bg/lake.svg')
        //         el('event-desc').innerHTML =`You spent few hours trying to catch more fish, but it seems that there is no more left.`
        //     }
        //     screen('event-screen')
        // }
        if      (eventType.startsWith('chest')){
            if(gs.playerLocationTile.visited != true){
                let val = rng(parseInt(gs.playerLocationTile.tileId[0]) + parseInt(gs.playerLocationTile.tileId[2]) + 12, 6)
                gs.plObj.coins += val
                el('event-cover').setAttribute('src','./img/bg/chest.svg')
                el('event-desc').innerHTML =`You found ${val} <img src="./img/ico/coin.svg">`
                syncUi()
            }else{
                el('event-cover').setAttribute('src','./img/bg/chest.svg')
                el('event-desc').innerHTML =`The chest is empty.`
            }

            screen('event-screen')
        }else if(eventType.startsWith('merchant')){

            //Generate shop.
            if(gs.playerLocationTile.visited == undefined){
                el('merchant-container').innerHTML = ``
                genOfferedItemList(gs.merchantQuant, 'merchant')
            }

            //Regen item cards for 'sell' page.
            el('items-to-sell').innerHTML = ``
            gs.plObj.inventory.forEach(item => {
                el('items-to-sell').append(genItemCard(item, 'item-to-sell'))
            })

            //Add coins indicator
            el('merchant-coins-indicator').innerHTML = `You have: ${gs.plObj.coins}<img src="./img/ico/coin.svg">`

            //Open merchant screen.
            screen('merchant')

        }else if(eventType.startsWith('blacksmith')){
            //Generate items-to-enhance.
            el('items-to-enhance').innerHTML = ``

            //Generate items-to-repair
            el('items-to-repair').innerHTML = ``
            gs.plObj.inventory.forEach(item => {
                el('items-to-repair').append(genItemCard(item, 'item-to-repair'))
            })

            //Open merchant screen
            screen('blacksmith-repair')
        }else if(eventType.startsWith('enchanter')){
            //Generate items-to-enhance.
            el('items-to-enhance').innerHTML = ``

            gs.plObj.inventory.forEach(item => {
                el('items-to-enhance').append(genItemCard(item, 'item-to-enhance'))
            })

            //Open merchant screen
            screen('enchanter')
        }

         else if(eventType.startsWith('monument')){
            
            //Get event id from tile
                let event = eventRef[gs.playerLocationTile.loreEvent]

            //If no event, pick random one (for testing)
                if (event == undefined){
                    event = eventRef[rng(eventRef.length - 1)]
                }

            //If no img set, use placegolder
                if(event.img != undefined){
                    el('event-cover').setAttribute('src',`./img/lore/${event.img}.svg`)
                }else{
                    el('event-cover').setAttribute('src',`./img/lore/event-${event.eventId}.svg`)
                }

            //Add event description
                el('event-desc').innerHTML =`${event.eventDesc}`

            //QUIZ:
                if(event.type == 'physics-quiz'){

                    //Add answer buttons
                    let answers = ``
                    event.answers.forEach(answer => {
                        answers += `<button onclick="map">${answer}</button>` 
                    })

                    let img = event.img
                    if(img == undefined){
                        img = 'event-quiz'
                    }

                    //Reformat event screen
                    el('event-screen').innerHTML = `
                        <div class='modal-container quiz-container'>

                            <img id="event-cover" src='./img/lore/${img}.svg' class="illustration">

                            <p id="event-desc" class="body-14">
                                <span class="italic b50">You find a damaged book, you decide to take notes, but certain fragments are distorted...</span>
                                <br><br>
                                ${event.eventDesc}
                            </p>
                            <div class="quiz-btn-container">
                                ${answers}
                            </div>
                        </div>         
                    `  
                }
            
            //Add 1 exp
                resolveExpAndLvl(1)
                syncUi()
            
            //Open event screen
                screen('event-screen')

        }else if(eventType.startsWith('casino')){

            runCasino()

        }else if(eventType.startsWith('house')){

            let roll = rng(5)

            if(gs.playerLocationTile.visited == true || roll > 3){ //nothing
                el('event-cover').setAttribute('src',`./img/bg/house-placeholder.svg`)
                el('event-desc').innerHTML =`There is nothing in here.`
            }
            else if(roll == 3){ //get item
                let item = new ItemObj()
                el('event-cover').setAttribute('src',`./img/bg/house-placeholder.svg`)
                el('event-desc').innerHTML =`You approach a house, it is empty. You look around and find <b>${item.itemName}</b>.`

                //Add item to the inventory.
                gs.plObj.inventory.push(item)
            }
            else if(roll == 2){ //heal

                let heal = rng(Math.round(gs.plObj.baseLife/3))
                restoreLife(heal)

                el('event-cover').setAttribute('src',`./img/bg/house-placeholder.svg`)
                el('event-desc').innerHTML =`You approach a house, it is empty and find a <b>medical kit (+${heal}<img src='./img/ico/life.svg'>)</b>.`
                
            }
            else { //trap
                // console.log(trap);
                let dmg = rng(Math.round(gs.plObj.life/2))

                el('event-cover').setAttribute('src',`./img/bg/house-placeholder.svg`)
                el('event-desc').innerHTML =`You enter an empty house, and step into a <b>spike trap hole (-${dmg} <img src='./img/ico/life.svg'>)</b>.`

                gs.plObj.life -= dmg

                if(gs.plObj.life < 1){
                    el('event-screen').setAttribute('onclick','openStateScreen("game-end")')
                }
            }

            screen('event-screen')
            syncUi()
        }else if(eventType.startsWith('dungeon')){

            //Creates empty map array?
            if(gs.maps == undefined){
                gs.maps = []
            }

            //Check if you are in the dungeon
            //Go back to surface
            if(gs.maps.length > 0 && gs.mapObj.mapId.includes('map')){
                //Save the map state
                gs.maps[0] = gs.mapObj

                //Update the main map
                gs.mapObj = gs.maps[1]

                //Recolor bg
                el('map').classList.add('dungeon')

            } 
            
            //Return to surface
            else if (gs.maps.length > 0 && gs.mapObj.mapId.includes('dungeon')) {
                //Save the map state
                gs.maps[1] = gs.mapObj

                //Update the main map
                gs.mapObj = gs.maps[0]

                //Recolor bg
                el('map').classList.remove('dungeon')
    
            } 

            //Gen new dungeon
            else {
                let newDungeon = new MapObj('dungeon')

                //Save current maps
                gs.maps = [gs.mapObj, newDungeon]
                
                //Set dungeon as the main map
                gs.mapObj = newDungeon

                //Recolor bg
                el('map').classList.add('dungeon')
            }

            //Load map
            initGame()

        }else if(eventType.startsWith('camp')){

            if(gs.playerLocationTile.visited == true){
                el('event-cover').setAttribute('src',`./img/bg/house-placeholder.svg`)
                el('event-desc').innerHTML =`There is nothing in here.`
                
            }else{
                let heal = Math.floor(gs.plObj.baseLife * 0.5)
    
                el('event-cover').setAttribute('src',`./img/bg/camp.svg`)
                el('event-desc').innerHTML =`You approach a camp and rest,<br> you feel better ( +${heal}<img src='./img/ico/life.svg'>)</b>.`
                
                restoreLife(heal)
            }
           
            screen('event-screen')
            syncUi()
        }else{
            showAlert(`You look around.<br>There is nothing to see here.`)
        }

        //Mark as visited.
        gs.playerLocationTile.visited = true
    }

    let eventRef =[
        {
            eventId: 0,
            eventDesc: `
                You notice a monolith, but it is heavily damaged. 
                Something was depicted on it, but it's very hard to decipher.
            `
        },{
            eventId: 1,
            'eventDesc': `
                You notice a large dark monolith in the middle of the area.
                You approach it and see an engraved image...
            `
        },{
            eventId: 2,
            eventDesc: `
                You notice a large dark monolith in the middle of the area.
                You approach it and see an engraved image...
            `
        },
        //Monolith
        {     eventId: 3,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"This palce is not a place of honour..."</h3>
            `
        },{   eventId: 4,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"No highly esteemed deed is commemorated here. Nothing valued...</h3>

            `
        },{   eventId: 5,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"Nothing valued is here. What is here..."</h3>
            `
        },{   eventId: 6,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"What is here is dangerous and repulsive to us. This message..."</h3>
            `
        },{   eventId: 7,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"This message is a warning..."</h3>
            `
        },{   eventId: 8,
            img: 'event-text',
            eventDesc: `
                You find a monolith, it is mostly damaged, but you manage to decipher a phrase...<br>
                <h3>"...warning about danger..."</h3>
            `
        },
        //Physics event
        // {   eventId: 9,
        //     type: 'physics-quiz',
        //     eventDesc: `A collection of matter within a defined contiguous boundary in three-dimensional space is called ____.`,
        //     answers: ['Physical object', 'Geometric shape', 'Model', 'Matter']
        // },
    ]

    function nextStage(){
        
        //Increase stage on exit entrance
        gs.stage++

        //Generate a mapObj for this stage
        gs.mapObj = new MapObj 

        //Clear maps array to generate new stage
        gs.maps = [] 

        initGame()         
    }

    function enterVillage(){
        //Generate a villsge mapObj
        gs.mapObj = new MapObj('village')

        //Clear maps array to generate new stage
        gs.maps = [] 

        initGame()
    }

    //Stage profiles
    let mapProfileRef = {
        dungeon: {
            enemySpawnFrequency: 70, //0%-100%
        },
        village: {
            size:[3,3],
            enemySpawnFrequency: 0,
            boss:['boss0'],
            enemy:['tank'],
            mandatoryTiles:[
                {tileType: 'library', tileId:`2-2`},
                {tileType: 'merchant-1', tileId:`1-1`},
            ]
        },
        referenceMap:{
            size: [3,9],
            enemySpawnFrequency: 35, //0%-100%
            mandatoryTiles:[
                // {tileType: 'camp-1', tileId:`1-12`,enemyUnit: false},
            ]
        },
        stage1:{
            size:[3, 9],
            enemySpawnFrequency: 35, //0%-100%
            boss:['boss1'],
            enemy:['minion','balanced'],
            mandatoryTiles:[
                // {tileType: 'merchant-1', tileId:`1-${config.mapY}`, enemyUnit: false},
            ]
        },
        stage2:{
            boss:['boss2'],
            enemy:['tank','balanced','assassin'],
            mandatoryTiles:[
                // {tileType: 'merchant-1', tileId:`1-${config.mapY}`, enemyUnit: false},
            ]
        },
        stage3:{
            boss:['boss3'],
            enemy:['tank','assassin','gladiator'],
            mandatoryTiles:[
                // {tileType: 'merchant-1', tileId:`1-${config.mapY}`, enemyUnit: false},
            ]
        },
        stage4:{
            boss:['boss4'],
            enemy:['mage','assassin'],
            mandatoryTiles:[
                // {tileType: 'merchant-1', tileId:`1-${config.mapY}`, enemyUnit: false},
            ]
        },
        stage5:{
            boss:['boss5'],
            enemy:['mage','assassin','gladiator']
        },
        stage6:{
            boss:['boss6'],
            enemy:['mage','assassin','gladiator', 'tank']
        },
        stage7:{
            enemy:['mage','assassin','gladiator', 'tank']
        },
    }