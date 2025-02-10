//Game
    class GameState {
        constructor(){
            this.stage = 0
            this.version = config.version
            
            //Encounter
            this.inCombat = false
            this.encounter = 1
            this.combatTurn = 1
            this.logMsg = []      // Combat log messages.
            this.statChange = []  // Stats for UI indicator.
            this.enemyAction = [] // Last enemy action.
            
            //Stats for end game screen.
            this.turnCounter = 0 //Calc turns for win stats.
            this.enemyCounter = 0
            this.totalEnemies = config.exitDefenders + this.stage
            this.totalCombatTurns = 0

            //Skill tree
            this.treeObj = {}
            
            //Map
                //Merchant config.
                this.merchantQuant = config.merchantQuant     
        }
    }

//Saving
    function saveGame(){
        //Increase stage to scale enemies
        // gs.mapObj = new MapObj //Generate a mapObj for the next stage

        localStorage.setItem('gameState', JSON.stringify(gs))        
        console.log('Game saved');
    }

    function clearSavedGame(){
        localStorage.removeItem('gameState')
        console.log('Game save removed');
    }

    function loadGame(){
        let gameObj = JSON.parse(localStorage.getItem('gameState'))

        if (gameObj == undefined){
            console.log('New game started.');
        }
        else if(gameObj.version !== config.version){
            console.log('Version diff.');
        }
        else {
            gs = gameObj

            //Redeclare item actions to recreate methods
            let placeholderInventory = gs.plObj.inventory
            gs.plObj.inventory = []

            placeholderInventory.forEach(item =>{
               addItem(item.itemName, item.iLvl, gs.plObj.inventory)
            })

            console.log('Game loaded.');
        }
    }