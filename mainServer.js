
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)   
var totUsers = []
var allResult = []

app.use("/static", express.static('./static/'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/start.html');
});


io.on('connection',(socket) => {    
  socket.on('disconnect', () => {
        disconnectPlayer(socket.id)
    })
    socket.on("disconnectedPlayer", (d)=>{
        disconnectPlayer(d)
    })
    function disconnectPlayer(ids) {
        let room
        for (let i = 0; i < totUsers.length; i++) { 
            for (let k = 0; k < 4; k++) {
                if (totUsers[i].room != undefined && totUsers[i].playersid[k] == ids) {
                    room = totUsers[i].room
                    break
                }
            }
        }
        let index = getIdFromRoom(room)
        let playerLeft = ""
        if (totUsers[index] == undefined)
            return
        if (totUsers[index].players.length < 4) {
            for (let i = 0; i < 4; i++) {
                if(totUsers[index].playersid[i] == socket.id) {
                    for (let k = 0; k < 4; k++) {
                        if (totUsers[index].playersid[k] != socket.id)
                            io.to(totUsers[index].playersid[k]).emit("changePlayer",totUsers[index].players.length - 1,totUsers[index].players[i])
                    }
                    if (i == 0){
                        totUsers[index].playersid.shift()
                        playerLeft = totUsers[index].players[i]
                        totUsers[index].players.shift()
                    }
                    else{
                        totUsers[index].playersid.splice(i)
                        playerLeft = totUsers[index].players[i]
                        totUsers[index].players.splice(i)
                    }
                    socket.leave(totUsers[index].room)
                    if(totUsers[index].players.length == 0){
                        removeRoomCode(totUsers[index].room)
                        if (index == 0)
                            totUsers.shift()
                        else
                            totUsers.splice(index)
                    }
                    return
                }
            }
        }
        else if(totUsers[index].players.length == 4){
            var turn = totUsers[index].turn
            io.to(totUsers[index].room).emit("playerLeft",playerLeft)
            if (turn == totUsers[index].playersid.indexOf(socket.id) && totUsers[index].campoMoved == false && totUsers[index].anim) {
                totUsers[index].turn++
                if (totUsers[index].turn == 4)
                    totUsers[index].turn = 0
                io.to(totUsers[index].room).emit("othersTurno",totUsers[index].players[totUsers[index].turn])
            }
            socket.leave(socket.id)
            totUsers[index].playersLeft++
            if (totUsers[index].playersLeft == 3){
                io.to(totUsers[index].room).emit("gameOver")
                removeRoomCode(totUsers[index].room)
                if (index == 0)
                    totUsers.shift()
                else
                    totUsers.splice(index)
                return
            }
        }
    }
  socket.on("createGame",(nick) =>{
        roomCode = generateCodice()
        let isRoom = true
        totUsers.push(
            {
                room : roomCode,
                players : new Array(),
                playersid : new Array(),
                turn : 0,
                previeX : -1,
                previeY : -1,
                anim : false,
                campoMoved : true,
                base  : [false,false,false,false],
                winners : [false,false,false,false],
                playersLeft : 0,
                points : [0,0,0,0]
            }
        )
        socket.join(roomCode)
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        totUsers[index].players.push(nick)
        totUsers[index].playersid.push(socket.id)
        io.to(socket.id).emit("players",isRoom,totUsers[index].room,totUsers[index].players.length)
  })
    socket.on("randomGame",(nick) =>{
        for (let i = 0; i < totUsers.length; i++) {
            if (totUsers[i].playersid.length <4) {
                var code = totUsers[i].room
                for (let  k= 0; k < 4; k++) {
                    if (totUsers[i].players[k] == nick) {
                        io.to(socket.id).emit("noGameFound")
                        return
                    }
                }
                totUsers[i].players.push(nick)
                totUsers[i].playersid.push(socket.id)
                var pLength =totUsers[i].players.length
                socket.join(code)
                if(totUsers[i].players.length == 4)
                    startGame(code,totUsers[i].players)
                io.to(code).emit("players",true,code,pLength)
                io.to(socket.id).emit("gameFound")
                return
            }
        }
        io.to(socket.id).emit("noGameFound")
    })
    socket.on("checkRoom", (code,nick) =>{
        let isRoom = false
        let pLength
        for (let i = 0; i < totUsers.length; i++) {
            if (totUsers[i].room == code) {
                isRoom = true
                for (let  k= 0; k < 4; k++) {
                    if (totUsers[i].players[k] == nick) {
                        io.to(socket.id).emit("errorPlayer",nick)
                        return
                    }
                }
                totUsers[i].players.push(nick)
                totUsers[i].playersid.push(socket.id)
                pLength =totUsers[i].players.length
                socket.join(code)
                if(totUsers[i].players.length == 4)
                    startGame(code,totUsers[i].players)
                io.to(code).emit("players",isRoom,code,pLength)
                return
            }
        }
        io.to(socket.id).emit("noGameFound")
    })
    socket.on("checkPlayerLeft",function(rm,id){
        let index = getIdFromRoom(rm)
        if (index == undefined)
            return
        var turno = totUsers[index].turn
        totUsers[index].playersLeft--
        if (totUsers[index].playersLeft == 0) {
            io.to(totUsers[index].room).emit("backPlay")
        }
        else
            io.to(socket.id).emit("playerLeft")
        totUsers[index].playersid[id] = socket.id
        socket.join(rm)
        io.to(socket.id).emit("backInGame",totUsers[index].players,totUsers[index].points,id,totUsers[index].room,totUsers[index].items[id],totUsers[index].itemsStatus[id],totUsers[index].ped,totUsers[index].campo,totUsers[index].bonusCella,totUsers[index].previeX,totUsers[index].previeY,totUsers[index].arrDirection)
        checkOverlaps(totUsers[index].ped)
        io.to(socket.id).emit("othersTurno",totUsers[index].players[turno])
        if (turno == id){
            if (!totUsers[index].campoMoved)
                io.to(socket.id).emit("setSecondTurn")
            else
                io.to(socket.id).emit("yourTurn")
        }
    })
    function getIdFromRoom(codes) {
        for (let i = 0; i < totUsers.length; i++) {
            if (totUsers[i].room == codes) {
                return i
            }
        }
    }
    function startGame(codeRoom,nicksRoom) {
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        for (let i = 0; i < 4; i++) {
            io.to(totUsers[index].playersid[i]).emit("starting",nicksRoom,codeRoom,i)
        }
        //io.to(codeRoom).emit("starting",nicksRoom,codeRoom,totUsers[index].playersid.indexOf(ides));
        campoBeta = 
        [
            [22,0,33,0,33,0,23],
            [0,0,0,0,0,0,0],
            [32,0,32,0,32,0,30],
            [0,0,0,0,0,0,0],
            [32,0,31,0,33,0,30],
            [0,0,0,0,0,0,0],
            [21,0,31,0,31,0,20],
        ]
        let itemsGen=getTargetPosition()
        let randomVet = createRandomVector(24)
        let allcampo = generateCella(campoBeta)
        campo =allcampo[1]
        cellaBonus = allcampo[0]
        let turno= 0
        let cont = 0
        for (let i = 0; i < 7; i++) {
            for (let k = 0; k < 7; k++) {
                    if (itemsGen[i][k] == 1) {
                        campo[i][k].hasTarget = true
                        campo[i][k].target = new Target(randomVet[cont],cont%4,0,k,i)
                        cont++
                    }
                }
        }
        pedine=new Array()
        pedine.push(new Pedina(0,0,0,3,"blue"))
        pedine.push(new Pedina(6,0,1,2,"red"))
        pedine.push(new Pedina(0,6,2,1,"green"))
        pedine.push(new Pedina(6,6,3,0,"yellow"))
        io.to(Array.from(socket.rooms).pop()).emit("othersTurno",totUsers[index].players[turno])
        io.to(totUsers[index].playersid[0]).emit("yourTurn")
        io.to(codeRoom).emit("campoCreated",campo,cellaBonus)
        totUsers[index].campo = campo
        totUsers[index].bonusCella = cellaBonus
        targ = createTargets()
        totUsers[index].items = targ[0]
        totUsers[index].itemsStatus = targ[1]
        totUsers[index].ped = pedine
    }

    //chat
    socket.on("chat",(myMessage,thisNickname,time) =>{
        room =  Array.from(socket.rooms).pop()
        io.to(Array.from(socket.rooms).pop()).emit("message",myMessage,thisNickname,time)
    })
    socket.on("setStatus",function(i,k,stat){
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        campo = totUsers[index].campo
        campo[i][k].target.status = stat
        totUsers[index].campo = campo
    })
    socket.on("logCampo",function(){
        console.log(totUsers)
        return
        for (let i = 0; i < 7; i++) {
            for (let k = 0; k < 7; k++) {
                if (campo[i][k].hasTarget) 
                    console.log(campo[i][k].target);
            }
        }
    })
    function createTargets(){
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        campo = totUsers[index].campo
        targetVect=[]
        targetStatus=[]
        for (let i = 0; i < 4; i++) {
            targetVect[i]=[]
            targetStatus[i]=[1,0,0,0,0,0]
        }

        for (let i = 0; i < 7; i++) {
            for (let k = 0; k < 7; k++) {
                if (campo[i][k].hasTarget) 
                    targetVect[campo[i][k].target.player].push(campo[i][k].target.type)  
            }
        }
        for (let i = 0; i < 4; i++) {
            targetVect[i].sort(() => Math.random() - 0.5)
            io.to(totUsers[index].playersid[i]).emit("getTargets",targetVect[i])
        }
        return [targetVect,targetStatus]
    }
    //setPedina
    socket.on("setPedina",function(oldPedine){
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        totUsers[index].ped = oldPedine
    })
    //movimento campo
    socket.on("moveCella", function(x,y,arrowDirection){
        putCella(x,y,arrowDirection,socket.rooms)
        })
    //bonusCella
    socket.on("emitRotateCella", function(){
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        var bonusCella = totUsers[index].bonusCella
        bonusCella.rotate(1)
        bonusCella.print(socket.rooms)
        totUsers[index].bonusCella = bonusCella
    })
    socket.on("skipTurn", function(){
        let index = getIdFromRoom(Array.from(socket.rooms).pop())
        var ANIMATION = totUsers[index].anim
        var winnerPlayers = totUsers[index].winners
        var turno = totUsers[index].turn
        if (ANIMATION)
            return
        isCampoMoved = true
        turno++
        if (turno == 4)
            turno = 0
        while(winnerPlayers[turno]){
            turno++
            if (turno == 4)
                turno = 0
        }
        if (turno == 4)
            turno = 0
        totUsers[index].turn = turno
        totUsers[index].campoMoved = isCampoMoved
        io.to(Array.from(socket.rooms).pop()).emit("othersTurno",totUsers[index].players[turno])
        io.to(totUsers[index].playersid[turno]).emit("yourTurn")
    })
    function putCella(x,y,arrowDirection,socketid) {
        let index = getIdFromRoom(Array.from(socketid).pop())
        totUsers[index].arrDirection = arrowDirection
        var campo = totUsers[index].campo
        var isCampoMoved = totUsers[index].campoMoved
        var bonusCella = totUsers[index].bonusCella
        var previewDirectionX = totUsers[index].previeX
        var previewDirectionY = totUsers[index].previeY
        var pedine = totUsers[index].ped
        if (isCampoMoved) {
            if (arrowDirection == "dirDown") {
                if (x == previewDirectionX && previewDirectionY == 0 ) { 
                    io.to(socket.id).emit("error")
                    return
                }
                isCampoMoved = false
                let tempBonus = campo[0][x]
                for (let  i = 1;  i< 7; i++) {
                    campo[i-1][x] = campo[i][x]
                    if (campo[i-1][x].hasTarget)
                        campo[i-1][x].target.y--
                    io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[i-1][x],x,i-1)
                }
                campo[6][x] = bonusCella
                if (campo[6][x].hasTarget){
                    campo[6][x].target.x = x
                    campo[6][x].target.y = 6
                }
                io.to(Array.from(socket.rooms).pop()).emit("setAsCella",campo[6][x])
                io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[6][x],x,6)
                bonusCella = tempBonus
                io.to(Array.from(socket.rooms).pop()).emit("setAsBonus",bonusCella)
                io.to(Array.from(socket.rooms).pop()).emit("setXYCella",bonusCella,9,3)
                //muovo la macchina
                for (let k=0;k<4;k++){
                    for (let i=0;i<7;i++){
                        if (pedine[k].x==x && pedine[k].y==i){
                            io.to(Array.from(socket.rooms).pop()).emit("shiftCar",k,1)
                            break
                        }
                    }
                }
                previewDirectionX = x;
                previewDirectionY = 6;
            }
            else if(arrowDirection  == "dirRight"){
                if (previewDirectionX == 0 && previewDirectionY == y ) { 
                    io.to(socket.id).emit("error")
                    return
                }
                isCampoMoved = false
                tempBonus = campo[y][0]
                for (let  i = 1;  i< 7; i++) {
                    campo[y][i-1] = campo[y][i]
                    if (campo[y][i-1].hasTarget)
                        campo[y][i-1].target.x--
                    io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[y][i-1],i-1,y)
                }
                campo[y][6] = bonusCella
                if ( campo[y][6].hasTarget){
                     campo[y][6].target.x = 6
                     campo[y][6].target.y = y
                }
                io.to(Array.from(socket.rooms).pop()).emit("setAsCella",campo[y][6])
                io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[y][6],6,y)
                bonusCella = tempBonus
                io.to(Array.from(socket.rooms).pop()).emit("setAsBonus",bonusCella)
                io.to(Array.from(socket.rooms).pop()).emit("setXYCella",bonusCella,9,3)
                //muovo la macchina
                for (let k=0;k<4;k++){
                    for (let i=0;i<7;i++){
                        if (pedine[k].x==i && pedine[k].y==y){
                            io.to(Array.from(socket.rooms).pop()).emit("shiftCar",k,0)
                            break
                        }
                    }
                }
                previewDirectionX = 6;
                previewDirectionY = y;
            }
            else if(arrowDirection  == "dirTop"){
                if (x == previewDirectionX && previewDirectionY == 6 ) { 
                    io.to(socket.id).emit("error")
                    return
                }
                isCampoMoved = false
                tempBonus = campo[6][x]
                for (let  i = 5;  i> -1; i--) {
                    campo[i+1][x] = campo[i][x]
                    if (campo[i][x].hasTarget)
                        campo[i+1][x].target.y++
                    io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[i+1][x],x,i+1)
                }
                campo[0][x] = bonusCella
                if (campo[0][x].hasTarget){
                    campo[0][x].target.x = x
                    campo[0][x].target.y = 0
                }
                io.to(Array.from(socket.rooms).pop()).emit("setAsCella",campo[0][x])
                io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[0][x],x,0)
                bonusCella = tempBonus
                io.to(Array.from(socket.rooms).pop()).emit("setAsBonus",bonusCella)
                io.to(Array.from(socket.rooms).pop()).emit("setXYCella",bonusCella,9,3)
                //muovo la macchina
                for (let k=0;k<4;k++){
                    for (let i=0;i<7;i++){
                        if (pedine[k].x==x && pedine[k].y==i){
                            io.to(Array.from(socket.rooms).pop()).emit("shiftCar",k,3)
                            break
                        }
                    }
                }
                previewDirectionX = x;
                previewDirectionY = 0;
            }
            else if(arrowDirection  == "dirLeft"){
                if (previewDirectionX == 6 && previewDirectionY == y ) { 
                    io.to(socket.id).emit("error")
                    return;
                }
                isCampoMoved = false
                tempBonus = campo[y][6]
                for (let  i = 5 ;  i >-1; i--) {
                    campo[y][i+1] = campo[y][i]
                    if (campo[y][i+1].hasTarget)
                        campo[y][i+1].target.x++
                    io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[y][i+1],i+1,y)

                }
                campo[y][0] = bonusCella
                if (campo[y][0].hasTarget){
                    campo[y][0].target.x = 0
                    campo[y][0].target.y = y    
                }
                io.to(Array.from(socket.rooms).pop()).emit("setAsCella",campo[y][0])
                io.to(Array.from(socket.rooms).pop()).emit("setXY",campo[y][0],0,y)
                bonusCella = tempBonus
                io.to(Array.from(socket.rooms).pop()).emit("setAsBonus",bonusCella)
                io.to(Array.from(socket.rooms).pop()).emit("setXYCella",bonusCella,9,3)
                //muovo la macchina
                for (let k=0;k<4;k++){
                    for (let i=0;i<7;i++){
                        if (pedine[k].x==i && pedine[k].y==y){
                            io.to(Array.from(socket.rooms).pop()).emit("shiftCar",k,2)
                            break
                        }
                    }
                }
                previewDirectionX = 0;
                previewDirectionY = y;
            }
            totUsers[index].campo = campo 
            totUsers[index].campoMoved = isCampoMoved 
            totUsers[index].bonusCella = bonusCella
            totUsers[index].previeX = previewDirectionX 
            totUsers[index].previeY = previewDirectionY
            totUsers[index].ped = pedine
            io.to(socket.id).emit("setSecondTurn")
            io.to(Array.from(socket.rooms).pop()).emit("disableDirection",arrowDirection,x,y)
        }
    }
    socket.on("emitMovePedina", function(x,y){
        movePedina(x,y)
    })
function movePedina(x,y){
    var index = getIdFromRoom(Array.from(socket.rooms).pop())
    var campo = totUsers[index].campo
    var isCampoMoved = totUsers[index].campoMoved
    var turno = totUsers[index].turn 
    var pedine = totUsers[index].ped
    var ANIMATION = totUsers[index].anim
    var winnerPlayers = totUsers[index].winners
    var returnBaseVect = totUsers[index].base
    var targetStatus = totUsers[index].itemsStatus
    var targetVect = totUsers[index].items
    endX = parseInt(x),endY = parseInt(y)
    matr =[
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0]
    ]

    startX = pedine[turno].x
    startY = pedine[turno].y
    if (startX == endX && startY == endY && isCampoMoved == false){
        checkForPoints(pedine,turno,targetStatus,returnBaseVect,campo,targetVect)
        checkForWin(returnBaseVect,turno,pedine,winnerPlayers) // controlla vittoria
        isCampoMoved = true
        turno++
        if (turno == 4)
            turno = 0
        while(winnerPlayers[turno]){
            turno++
            if (turno == 4)
                turno = 0
        }
        if (turno == 4)
            turno = 0
        totUsers[index].turn = turno
        totUsers[index].campoMoved = isCampoMoved
        io.to(Array.from(socket.rooms).pop()).emit("othersTurno",totUsers[index].players[turno])
        io.to(totUsers[index].playersid[turno]).emit("yourTurn")
        return
    }
    matr[startY][startX]=1
    let tmp=checkPathV2(startX,startY,endX,endY,campo)
    // controlla il percorso
    if(!Number.isFinite(tmp.distance) || isCampoMoved){
        io.to(socket.id).emit("error")
    }
    else if (Number.isFinite(tmp.distance)){
        let path=tmp.path
        let k=1
        totUsers[index].anim=true
        let clock=setInterval(function(){ // funzione per far muovere effettivamente la macchina
            let newX = path[k].split(".")[0]
            let newY = path[k].split(".")[1]
            if (newX>startX)
                io.to(Array.from(socket.rooms).pop()).emit("rotateCar",turno,2)
            else if (newX<startX)
                io.to(Array.from(socket.rooms).pop()).emit("rotateCar",turno,0)
            else if (newY>startY)
                io.to(Array.from(socket.rooms).pop()).emit("rotateCar",turno,3)
            else if (newY<startY)
                io.to(Array.from(socket.rooms).pop()).emit("rotateCar",turno,1)
            startX=newX
            startY=newY
            removeOverlaps(pedine,turno)
            io.to(Array.from(socket.rooms).pop()).emit("moveCar",turno,startX,startY,totUsers[index].ped)
            pedine[turno].x = parseInt(x)
            pedine[turno].y = parseInt(y)
            k++
            if (k==tmp.distance+1){
                totUsers[index].anim = false
                clearInterval(clock) // blocca l'animazione quando la macchina finisce di muoversi
                checkForPoints(pedine,turno,targetStatus,returnBaseVect,campo,targetVect)
                checkForWin(returnBaseVect,turno,pedine,winnerPlayers) // controlla vittoria
                checkOverlaps(pedine) // check se le macchine sono una sopra l'altra
                totUsers[index].campoMoved = true
                turno++
                if (turno == 4)
                    turno = 0
                while(winnerPlayers[turno]){
                    turno++
                    if (turno == 4)
                        turno = 0
                }
                if (turno == 4)
                    turno = 0
                totUsers[index].turn = turno
                io.to(Array.from(socket.rooms).pop()).emit("othersTurno",totUsers[index].players[turno])
                io.to(totUsers[index].playersid[turno]).emit("yourTurn")
                return
            }
        },300,k)
    }
}
function targetFound(i,k,activePlayer,targetStatus,returnBaseVect,campo,targetVect) {
    let index = getIdFromRoom(Array.from(socket.rooms).pop())
    if (index == undefined)
        return
    io.to(Array.from(socket.rooms).pop()).emit("emitFoundItem",activePlayer,campo[i][k].target.type,totUsers[index].players[activePlayer])
    totUsers[index].points[activePlayer]++
    campo[i][k].target.status = 2
    campo[i][k].target.obfuscated = true
    last=false
    next=0
    for (let i = 0; i < 6; i++) {
        if (targetStatus[activePlayer][i]==1){
            targetStatus[activePlayer][i]=2
            if (i==5)
                last=true
            else{
                next=i+1
                targetStatus[activePlayer][i+1]=1
            }
            break
        }
    }
    if (last)
        returnBaseVect[activePlayer]=true
    else{
        for (let i = 0; i < 7; i++) {
            for (let k = 0; k < 7; k++) {
                if (campo[i][k].hasTarget && campo[i][k].target.player==activePlayer && campo[i][k].target.type==targetVect[activePlayer][next]) {
                    campo[i][k].target.status=1
                }
            }
        }
    }
    totUsers[index].itemsStatus = targetStatus
    totUsers[index].base = returnBaseVect
    totUsers[index].campo = campo
    io.to(socket.id).emit("emitNewTargetStatus",targetStatus[activePlayer])
    
}
function checkForPoints(pedine,turno,targetStatus,returnBaseVect,campo,targetVect) {
    for (let i = 0; i <7; i++) {
        for (let k = 0; k < 7; k++) {
            if (campo[i][k].target != undefined) {
                if ((pedine[turno].x == campo[i][k].target.x && pedine[turno].y == campo[i][k].target.y && campo[i][k].target.player == turno && campo[i][k].target.status == 1)){
                    setTimeout((activePlayer,targetStatus,returnBaseVect,campo,targetVect) => {
                        targetFound(i,k,activePlayer,targetStatus,returnBaseVect,campo,targetVect)
                    }, 300,turno,targetStatus,returnBaseVect,campo,targetVect);    
                }
            }
        }
    }
}

function checkForWin(returnBaseVect,turno,pedine,winnerPlayers){
    let index = getIdFromRoom(Array.from(socket.rooms).pop())
    if (index == undefined )
        return
    if (!returnBaseVect[turno])
        return
    var x = pedine[turno].x
    var y = pedine[turno].y
    switch (turno) {
        case 0:
            checkX = 0
            checkY = 0
            break;
        case 1:
            checkX = 6
            checkY = 0
            break;
        case 2:
            checkX = 0
            checkY = 6
            break;
        case 3:
            checkX = 6
            checkY = 6
            break;            
    }
    let cont = 0
    if (x==checkX && y==checkY){
        var vinto = false
        for (let i = 0; i <4; i++) {
            if (totUsers[index].winners[i])
                vinto = true
        }
        winnerPlayers[turno] = true
        for (let i = 0; i < 4; i++) {
            if (winnerPlayers[i])
                cont++
        }
        if (cont == 3)
            io.to(Array.from(socket.rooms).pop()).emit("gameOver")
        else{
            winnerNick = totUsers[index].players[turno]
            for (let i = 0; i < 4; i++) {
                if (socket.id == totUsers[index].playersid[i]) 
                    io.to(socket.id).emit("emitYourWin",turno,vinto)
                else{
                    if (!totUsers[index].winners[i])
                        io.to(totUsers[index].playersid[i]).emit("emitWin",turno,winnerNick,vinto)
                }
            }
            totUsers[index].hasWon = true
        }
    }
    totUsers[index].winners = winnerPlayers
}

function checkOverlaps(pedine) {
    let index = getIdFromRoom(Array.from(socket.rooms).pop())
    for (let i = 0; i < 4; i++) {
        for (let j = i+1; j < 4; j++) {
            if (pedine[i].x == pedine[j].x && pedine[i].y == pedine[j].y) {
                io.to(Array.from(socket.rooms).pop()).emit("reduceCar",i)
                io.to(Array.from(socket.rooms).pop()).emit("reduceCar",j)
            }
        }
    }
}
function removeOverlaps(pedine,turno) {
    let index = getIdFromRoom(Array.from(socket.rooms).pop())
    io.to(Array.from(socket.rooms).pop()).emit("maximizeCar",turno)
    let x=pedine[turno].x
    let y=pedine[turno].y
    let cont=0;
    let maximize=0;
    for (let i = 0; i < 4; i++) {
        if (i!=turno && pedine[i].x==x && pedine[i].y==y ){
            cont++
            maximize=i
        }
    } 
    if (cont==1)
        io.to(Array.from(socket.rooms).pop()).emit("maximizeCar",maximize)
}
function printBonusCellaSocket(ids,ImgUrl,rot,x,y,socketid){
    io.to(Array.from(socketid).pop()).emit("rotateCellaBonus",ids,ImgUrl,rot,x,y)
}
function rotateTargetCella(type,c1,c2,socketid){
    io.to(Array.from(socketid).pop()).emit("rotateTargetCellaBonus",type,c1,c2)
}

function generateCella(campo) {
    /*
    0,1,2 sta per i tipi di casella (0 dritta, 1 a L, 2 con tre uscite)
    0,1,2,3 stanno per le direzioni
    numeri random per fare tutto casuale, uso il ciclo for perche ci sono un numero predefinito di caselle
    */
    //variabili per il massimo numero di celle generabili
    //for per scorrere la matrice
    var contDritta = 0
    var contL = 0
    var contTre = 0
    for (let i = 0; i < 7; i++) {   
        for (let k = 0; k < 7; k++) {
            if (i%2==1 || (k%2==1 && i%2==0)) {
                let generato=false
                while(!generato)
                {
                    randomRotation = Math.floor(Math.random()*4)
                    num = Math.floor(Math.random()*3)
                    if( num == 0 && contDritta<12){
                        campo[i][k] = new Cella(k, i, 1, randomRotation, false)
                        contDritta++;
                        generato=true                        
                    }
                    else if(num == 1 && contL<16){
                        campo[i][k] = new Cella(k, i, 2, randomRotation, false)
                        contL++;
                        generato=true
                    }
                    else if(num == 2 && contTre<6){
                        campo[i][k] = new Cella(k, i, 3, randomRotation, false)
                        contTre++;
                        generato=true
                    }
                }
              }
            else{
                let tmp = campo[i][k]
                campo[i][k] = new Cella(k, i, parseInt(tmp/10), tmp%10, true)
            }
        }
    }
    //capire quale casella manca e va portata sotto
    randomRotation = Math.floor(Math.random()*4)
    if (contDritta <12){
        tempbonusCellaName = 1
    }
    else if(contL < 16){
        tempbonusCellaName = 2
    }
    else if(contTre <6){
        tempbonusCellaName = 3
    }
    bonusCella = new Cella(9, 3, tempbonusCellaName, randomRotation, false)
    return [bonusCella,campo]
}
function getTargetPosition(){
    let itemsGen = [[2,0,1,0,1,0,2], // 2 è la base, non lo puoi generare sopra di essa
                    [0,0,0,0,0,0,0], 
                    [1,0,1,0,1,0,1],
                    [0,0,0,0,0,0,0],
                    [1,0,1,0,1,0,1],
                    [0,0,0,0,0,0,0],
                    [2,0,1,0,1,0,2]]
    let contaItem = 0
    rX = Math.floor(Math.random()*7)
    rY = Math.floor(Math.random()*7)
    while(contaItem<12){
        if (itemsGen[rX][rY] == 0) {
            itemsGen[rX][rY]  = 1
            contaItem++
        }
        else{
            rX = Math.floor(Math.random()*7)
            rY = Math.floor(Math.random()*7)
        }
    }
    return itemsGen
}
function createRandomVector(nEl){
    let randomVet = []
    for (let i=0;i<nEl;i++){
        let num
        do{
            num=Math.floor(Math.random()*nEl)
        }while( isInVet(randomVet,num) )
        randomVet.push(num)
    }
    return randomVet
}

function  isInVet(randomVet,num){
    for (let i=0;i<randomVet.length;i++)
        if (randomVet[i]==num)
            return true
    return false        
}

//parte delle classi









//dijkstra
function checkPathV2(startX,startY,endX,endY,campo){
	let graph = createGraph(campo)
	return findShortestPath(graph,startX+"."+startY,endX+"."+endY)
}

function createGraph(campo){
	let graph = new Map()
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 7; x++) {
			let key=x+"."+y
			let value = getCollg(x,y,campo)
			graph.set(key,value)	
		}
	} 
	return Object.fromEntries(graph)
}

function getCollg(x,y,campo){
	var ret = new Map()
	if(x>0 && campo[y][x].collg[0] && campo[y][x-1].collg[2]){
		let key=(x-1)+"."+y
		ret.set(key,1)
    }
    if(x<6 && campo[y][x].collg[2] && campo[y][x+1].collg[0]){

		let key=(x+1)+"."+y
		ret.set(key,1)
    }
    if(y>0 && campo[y][x].collg[1] && campo[y-1][x].collg[3]){

		let key=x+"."+(y-1)
		ret.set(key,1)
    }
    if(y<6 && campo[y][x].collg[3] && campo[y+1][x].collg[1]){

		let key=x+"."+(y+1)
		ret.set(key,1)
    }
	return Object.fromEntries(ret)
}

const shortestDistanceNode = (distances, visited) => {
	let shortest = null;

	for (let node in distances) {
		let currentIsShortest =
			shortest === null || distances[node] < distances[shortest];
		if (currentIsShortest && !visited.includes(node)) {
			shortest = node;
		}
	}
	return shortest;
};

const findShortestPath = (graph, startNode, endNode) => {
	// establish object for recording distances from the start node
	let distances = {};
	distances[endNode] = "Infinity";
	distances = Object.assign(distances, graph[startNode]);

	// track paths
	let parents = { endNode: null };
	for (let child in graph[startNode]) {
		parents[child] = startNode;
	}

	// track nodes that have already been visited
	let visited = [];

	// find the nearest node
	let node = shortestDistanceNode(distances, visited);

	// for that node
	while (node) {
		// find its distance from the start node & its child nodes
		let distance = distances[node];
		let children = graph[node];
		// for each of those child nodes
		for (let child in children) {
			// make sure each child node is not the start node
			if (String(child) === String(startNode)) {
				continue;
			} else {
				// save the distance from the start node to the child node
				let newdistance = distance + children[child];
				// if there's no recorded distance from the start node to the child node in the distances object
				// or if the recorded distance is shorter than the previously stored distance from the start node to the child node
				// save the distance to the object
				// record the path
				if (!distances[child] || distances[child] > newdistance) {
					distances[child] = newdistance;
					parents[child] = node;
				}
			}
		}
		// move the node to the visited set
		visited.push(node);
		// move to the nearest neighbor node
		node = shortestDistanceNode(distances, visited);
	}

	// using the stored paths from start node to end node
	// record the shortest path
	let shortestPath = [endNode];
	let parent = parents[endNode];
	while (parent) {
		shortestPath.push(parent);
		parent = parents[parent];
	}
	shortestPath.reverse();

	// return the shortest path from start node to end node & its distance
	let results = {
		distance: distances[endNode],
		path: shortestPath,
	};

	return results;
};
class Pedina {
    constructor(x,y,id,rotaz,color){
        this.x = x 
        this.y = y 
        this.id = id + "car"
        this.rotaz= rotaz //0= ovest, poi in senso orario
        this.color = color
    }
}
class Cella {
    //x, y -> cella position 
    //tipo -> 1,2,3 immagine della cella
    //rotaz -> 0 = 0deg, 1 = 90deg, 2 = 180deg ,3 = 270deg rotazione della cella
    //coolg -> collegamenti, 1 == collegato, 0 == scollegato, collg[0] == ovest, senso orario
    //fisso -> variabile bool, vero se la cella è fissa
    constructor(x, y, tipo, rotaz, fissa){
        this.x = x
        this.y = y
        this.id = (x==9) ? 49 : 7*y+x
        this.tipo = tipo
        this.collg = [0,0,0,0]
        this.rotaz = 0
        this.fissa = fissa
        this.hasTarget=false
        switch(tipo) {
            case 1:
                this.collg[1] = 1
                this.collg[3] = 1                
                break
            case 2:
                this.collg[0] = 1
                this.collg[1] = 1                
                break
            case 3:
                this.collg[0] = 1
                this.collg[1] = 1
                this.collg[3] = 1                  
                break
        }
        this.rotate(rotaz)
    }
    //gira di k volte in senso orario
    rotate(k){
        k = k%4
        for(let i=0; i<k; i++){
            let temp = this.collg[3]
            for(let j=3; j>0; j--){
                this.collg[j] = this.collg[j-1]
            }
            this.collg[0] = temp
        }
        this.rotaz = ( this.rotaz + k )
    }
    getImgUrl(){
        if(this.id==0)
            return "url(static/img/baseBlu.png)"
        else if(this.id==6)
            return "url(static/img/baseRossa.png)"
        else if(this.id==42)
            return "url(static/img/baseVerde.png)"
        else if(this.id==48)
            return "url(static/img/baseGialla.png)"
        return "url(static/img/img"+this.tipo+".png)"
    }
    print(socketid){
        printBonusCellaSocket(this.id,this.getImgUrl(),"rotate("+this.rotaz*90+"deg)",this.x,this.y,socketid)
        if (this.hasTarget){
            this.target.print(this.rotaz,socketid)
        }
    }
}
class Target {
    constructor(type,player,status,x,y){
        this.status = status
        this.type=type;
        this.player=player;
        this.x = x
        this.y = y
        this.obfuscated = false
    }
    print(parentRotaz,socketid){
        rotateTargetCella("item"+this.type,"url(static/img/"+this.type+".png)" ,"rotate("+parentRotaz*(-90)+"deg)",socketid)
    }
    
}
});

function removeRoomCode(room) {
    for (let i = 0; i < allResult.length; i++) {
        if (allResult[i] == room) {
            if (i==0)
                allResult.shift()
            else
                allResult.splice(i)
        }
        
    }
}
function generateCodice() {
    var alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
    var numbers = [1,2,3,4,5,6,7,8,9,0]
    var result = ""
    for (let i = 0; i < 3; i++) {
        rlet = Math.floor(Math.random()*26)
        result += alphabet[rlet].toUpperCase()
        rnum = Math.floor(Math.random()*9)
        result += numbers[rnum]
    }
    for (let i = 0; i < allResult.length; i++) {
       if (result == allResult[i]) {
            generateCodice()
            return
        }
    }
    allResult.push(result)
    return result

}
server.listen(process.env.PORT || 5000,() => {
  console.log('listening on *:9999');
});