//INITITATE GAME
    function initGame(){

        //Create initial game and player objects
        if(typeof gs == 'undefined'){
            gs = new GameState
            gs.plObj = new Player

            //Resolve ititial items
            gs.plObj.startingItems.forEach(itemName => {addItem(itemName, undefined, gs.plObj.inventory)})

            //Generate a mapObj for this stage
            if(config.skipTutorial){
                gs.stage++
                gs.mapObj = new MapObj()
            } else{
                gs.mapObj = new MapObj('village')
            }

            //Save game once map was generated to prevent map regen
            saveGame()
        }

        //Map
        mapRef = gs.mapObj.tiles

        //Lock screen
        document.body.classList.add('lock-actions', 'darken')

        //Run after delay
        window.setTimeout(
            function(){
                //Unlock screen
                document.body.classList.remove('lock-actions', 'darken')

                //Set a custom stage for testing
                if(config.stage != undefined){
                    gs.stage = config.stage
                }

                genMap()

                //Gen remaining UI
                // genTabs()              //merge ui
                spriteBuilder('player')//create player sprite

                resolveStats(gs.plObj)
                generateSkillTree()
                syncUi()
                screen("map")

                //Configs for testing
                if(config.testCombat == true){
                    initiateCombat() //Disable if not testing combat

                    el('map').classList.add('hide')
                }

                if(config.showCombatInfoLog != true){
                    el('log').classList.add('hide')
                }

                if(config.showScreen != undefined){
                    screen(config.showScreen)
                }
            },
            config.fadeTime
        )
    }

//LOAD DATA
    let gs         // game state object
    let itemsRef   // items data
    let actionsRef // actions data

    async function fetchData() {
        //Gets data from JSONS
        let itemResponse    = await fetch('./data/items.json');
        let actionsResponse = await fetch('./data/actions.json');

        //Assign item objects etc.
        itemsRef   = await itemResponse.json();
        actionsRef = await actionsResponse.json();

        //Convert 'passiveStat' actions property to objects.
        convertStringsToArr(itemsRef)
        convertStringsToArr(actionsRef)

        //Convert action id to strings
        actionsRef.forEach(action => {
            action.keyId = `a${action.keyId}`
        })

        //GAME STARTS AFTER DATA IS LOADED
        //Clear LS if config (for testing)
        if(config.clearLs === true){
            localStorage.clear();
            console.log('Local storage cleared.');
        }

        //Checks if LS save exists
        loadGame()

        if(config.showScreen !== undefined){
            initGame()
        }
    }

//START THE GAME
    // Call the async function to fetch JSON data
    fetchData();

