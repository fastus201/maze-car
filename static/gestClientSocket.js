    var room
    var pedin = []
    var thisNickname
    var campo = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
    ]
    var bonusCella  
    var socket = io.connect('https://maze-car.herokuapp.com/');
        function backButton() {
            socket.emit("disconnectedPlayer",socket.id)
            document.getElementById("backImage").style.display= "none"
            for (let i = 0; i < 3; i++) {
                document.getElementsByClassName("gameButton").item(i).style.display = "block"
            }
            document.getElementById("createForm").style.display = "none"
            document.getElementById("joinForm").style.display = "none"
        }
        function obfusceAll() {
            for (let i = 0; i < 3; i++) {
                document.getElementsByClassName("gameButton").item(i).style.display = "none"
            }
            document.getElementById("backImage").style.display = "block"
        }
        function createGame(){
            obfusceAll()
            socket.emit("createGame",thisNickname)
        }
        function joinGame(){
            obfusceAll()
            socket.emit("disconnectedPlayer",socket.id)
            document.getElementById("joinForm").style.display = "block"
        }
        function checkGame() {
            socket.emit("disconnectedPlayer",socket.id)
            socket.emit("randomGame",thisNickname)
        }
        socket.on("noGameFound",function(){
            document.getElementById("message").style.display = "block"
            setTimeout(() => {
                document.getElementById("message").style.display = "none"
            }, 1000);
        })
        socket.on("gameFound",function(){
            obfusceAll()
            document.getElementById("message").style.display = "none"
            document.getElementById("createForm").style.display = "block"
        })
        function joinRoom() {
            cod = document.getElementById("codInput").value.toUpperCase()
            if (cod.length != 6)
                return
            socket.emit("checkRoom",cod,thisNickname)
        }
        function searchGameEvent(e) {
        if(e.key == "Enter")
            joinRoom()
        }
        function copyCode(v) {
            text = v.innerText
            navigator.clipboard.writeText(text)
        }
        socket.on("errorPlayer",function(name){
            backButton()
            document.getElementById("confirmOk").style.display = "block"
            document.getElementById("nickname").style.display = "block"
            document.getElementsByClassName("containerButton").item(0).style.display = "none"
            document.getElementById("joinForm").style.display = "none"
            document.getElementById("nickMessage").style.display = "block"
            document.getElementById("searchGame").disabled = false
            document.getElementById("searchGame").style.cursor = "pointer"
            document.getElementById("nickMessage").innerText = "Il nickname "+name+ " è già utilizzato in quella stanza"
            document.getElementById("nickMessage").style.color = "red"
            setTimeout(()=>{
                document.getElementById("nickMessage").innerHTML = "Inserisci il nickname per iniziare a giocare"
                document.getElementById("nickMessage").style.color = "black"
            },2000)
        })
        socket.on("changePlayer",function(n,nick){
            document.getElementById("playersFound").innerHTML = "Giocatori trovati: "+n + "/4"
            document.getElementById("nick").innerText = nick
            document.getElementById("nickDiv").style.display = "block"
            setTimeout(() => {
                document.getElementById("nickDiv").style.display = "none"
            }, 2000);
        })
        socket.on("players", function (checked,room,numb) {
            if (!checked)
                return
            document.getElementById("createForm").style.display = "block "
            document.getElementById("joinForm").style.display = "none"
            document.getElementById("roomCode").innerHTML = room
            document.getElementById("playersFound").innerHTML = "Giocatori trovati: "+numb + "/4"
            document.getElementById("yourNick").innerHTML = "Nickname: " + thisNickname
        })
        socket.on("backPlay",function(){
            document.getElementById("myModal").style.display = "none"
            document.getElementById("winnerMessage").style = "text-align: center;font-size: 25px;margin-top: 70px;"
        })
        socket.on("starting", function (users,rooms,ind) {
            setCookie("roomcode",rooms,1)
            setCookie("idPlayer",ind,1)
            setTimeout(() => {
                document.getElementById("logindocument").style.display = "none"
                document.getElementById("gamedocument").style.display = "block"
                tablePlayers = document.getElementsByClassName("playertd")
                for (let i = 0; i < 4; i++) {
                    tablePlayers.item(i).innerHTML = users[i]
                }
                tablePlayers.item(ind).style.color ="red"
            }, 1000);
        })
//gest chat
function enterMessage(e) {
    if(e.key == "Enter"){
        if (document.getElementById("logindocument").style.display == "none")
            sendMessage()
    }
}
function getTime(){
    let d = new Date()
    let min = d.getMinutes()
    if (min < 10)
        min = "0"+min
    let hour = d.getHours()
    let time = hour + ":" + min
    return time
}
function sendMessage() {
    var myMessage = document.getElementById("inputMessage").value
    if (myMessage == "")return
    var position = "135px"
    var isMe = true
    var time = getTime()
    createMessage(myMessage,thisNickname,position,isMe,time)
    socket.emit('chat', myMessage,thisNickname,time)
    document.getElementById("messageForm").scrollTo(0,100000000)
    document.getElementById("inputMessage").value = ""
}
function createMessage(text,nick,position,isMe,time,img) {
    var messageDiv = document.getElementById("messageForm")
    newDiv = document.createElement("div")
    newDiv.setAttribute("class","message")
    newDiv.style.setProperty("margin-left",position)

    messageName = document.createElement("div")
    messageName.setAttribute("class","messageName")
    messageName.innerHTML = nick
    if (isMe)
        messageName.innerHTML+= " (Tu)"

    messageText = document.createElement("div")
    messageText.setAttribute("class","messageText")
    messageText.innerHTML = text

    messageTime = document.createElement("div")
    messageTime.setAttribute("class","messageTime")
    messageTime.innerHTML = time 
    if (img!= undefined) {
        imgDiv = document.createElement("div")
        imgDiv.style.background = img
        imgDiv.style.width = "40px"
        imgDiv.style.height = "40px"
        imgDiv.style.marginLeft = "100px"
        newDiv.style.width = "235px"
        newDiv.style.backgroundColor = "lightgreen"
        messageText.style.width = "auto"
        messageText.style.textAlign = "center"
        messageTime.style.display = "none"
        messageName.style.fontSize = "15px"
    }

    newDiv.appendChild(messageName)
    newDiv.appendChild(messageText)
    if (img!= undefined)
        newDiv.appendChild(imgDiv)
    newDiv.appendChild(messageTime)
    messageDiv.appendChild(newDiv)

}
//chat
socket.on("message", function(textMessage,nickname,timeMessage){
    isMe = false
    if (thisNickname == nickname)return
    position = "20px"
    createMessage(textMessage,nickname,position,isMe,timeMessage)
    document.getElementById("messageForm").scrollTo(0,100000000)
})
//moveimento campo
socket.on("error",function (){
    animationError()
})
socket.on("setXY", function(campoOld,x,i){
    newcampo = new Cella(campoOld.x, campoOld.y, campoOld.tipo,campoOld.rotaz, campoOld.fissa)
    newcampo.setXY(x,i)   
})
socket.on("setXYCella", function(cellaBonus2,x,y){
    bonusCella = new Cella(cellaBonus2.x, cellaBonus2.y, cellaBonus2.tipo,cellaBonus2.rotaz,cellaBonus2.fissa)
    bonusCella.setXY(x,y)   
})
socket.on("setAsCella", function(campoOld){
    newcampo = new Cella(campoOld.x, campoOld.y, campoOld.tipo,campoOld.rotaz, campoOld.fissa)
    newcampo.setAsCella() 
})
socket.on("setAsBonus", function(cellaBonus2){
    bonusCella = new Cella(cellaBonus2.x, cellaBonus2.y, cellaBonus2.tipo,cellaBonus2.rotaz,cellaBonus2.fissa)
    bonusCella.setAsBonus()  
})
socket.on("setSecondTurn", function(){
    //attiva il pulsante per skippare il turno
    document.getElementById("campo").style.pointerEvents = "initial"
    document.getElementById("campo").style.opacity = "1"
    document.getElementById("skipDiv").style.pointerEvents = "initial"
    document.getElementById("skipDiv").style.opacity = "1"
    //cambia testo
    document.getElementById("infoMessageText").innerHTML = "<b>É il tuo turno</b>: muovi la pedina o finisci il turno"
    //disabilita bonus cella
})
socket.on("shiftCar", function(k,i){
    pedine[k].shiftCar(i)
    socket.emit("setPedina",pedine)
})
socket.on("rotateCar", function(turno,g){
    pedine[turno].rotate(g)
})

socket.on("moveCar", function(turno,startX,startY){
    pedine[turno].move(startX,startY)
    socket.emit("setPedina",pedine)
})
socket.on("maximizeCar", function(turno){
    pedine[turno].maximizeCar()
})
socket.on("reduceCar", function(s){
    pedine[s].reduceCar()
})
//target casuali
function logCampo() {
    socket.emit("logCampo",campo)
}
socket.on("emitFoundItem",function(player,type,name){
    document.getElementById("item"+type).style.opacity = "0.5"
    currentPoint = parseInt(document.getElementById("color"+player).innerHTML)
    document.getElementById("color"+player).innerHTML = currentPoint + 1
    var txt = "Il giocatore <b>" + name+ "</b> ha trovato<br>"
    var img = "url(static/img/item"+type+".png)"
    createMessage(txt,"","10px",false,getTime(),img)
    document.getElementById("messageForm").scrollTo(0,100000000)
    
})
socket.on("emitYourWin",function(player,vinto){
    colors = ["RGB(72, 93, 150)","RGB(200, 62, 41)","RGB(86, 158, 74)","yellow"]
    document.getElementById("myModal").style.display = "block";
    document.getElementById("winnerMessage").style.color = colors[player]
    if(!vinto)
        document.getElementById("winnerMessage").innerHTML = "Complimenti hai vinto!"
    else
        document.getElementById("winnerMessage").innerHTML = "Complimenti hai finito la partita"
})
socket.on("emitWin",function(player,nameNick,vinto){
    colors = ["RGB(72, 93, 150)","RGB(200, 62, 41)","RGB(86, 158, 74)","yellow"]
    document.getElementById("myModal").style.display = "block";
    document.getElementById("winnerMessage").style.color = colors[player]
    if (!vinto)
        document.getElementById("winnerMessage").innerHTML = nameNick + " ha vinto!"
    else    
        document.getElementById("winnerMessage").innerHTML = nameNick + " ha finito la partita!"
    setTimeout(() => {
        document.getElementById("myModal").style.display = "none"
    }, 5000)
})
socket.on("gameOver",function(){
    document.getElementById("myModal").style.display = "block";
    document.getElementById("winnerMessage").innerHTML = "La partita è finita!"
    document.getElementById("winnerMessage").style.color = "#2196f3"
    setCookie("roomcode","",0)
    setCookie("idPlayer","",0)
    setTimeout( function(){
        location.reload()
    },3000)
})
socket.on("disableDirection",function(dir,i,k){
    disableDirect(dir,i,k)
})
function disableDirect(dir,i,k){
    if (dir == undefined)
        return
    x = parseInt(i/2)
    y = parseInt(k/2)
    allTop = document.getElementsByClassName("dirTop")
    allDown = document.getElementsByClassName("dirDown")
    allLeft = document.getElementsByClassName("dirLeft")
    allRight = document.getElementsByClassName("dirRight")
    for (let i = 0; i < 3; i++) {
        allTop.item(i).style.borderTopColor = "red";
        allTop.item(i).style.cursor = "pointer"
        allDown.item(i).style.borderBottomColor = "red";
        allDown.item(i).style.cursor = "pointer"
        allLeft.item(i).style.borderLeftColor = "red";
        allLeft.item(i).style.cursor = "pointer"
        allRight.item(i).style.borderRightColor = "red";
        allRight.item(i).style.cursor = "pointer"
    }
    switch (dir) {
        case "dirTop":
            document.getElementById("down"+x).style.borderBottomColor = "gray"
            document.getElementById("down"+x).style.cursor = "default"
            break;
        case "dirLeft":
            document.getElementById("right"+y).style.borderRightColor = "gray"
            document.getElementById("right"+y).style.cursor = "default"
            break;
        case "dirRight":
            document.getElementById("left"+y).style.borderLeftColor = "gray"
            document.getElementById("left"+y).style.cursor = "default"
            break;
        case "dirDown":
            document.getElementById("top"+x).style.borderTopColor = "gray"
            document.getElementById("top"+x).style.cursor = "default"
            break;
    }
}
socket.on("getTargets", function(targVect){
    for (let i = 0; i < 7; i++) {
        for (let k = 0; k < 7; k++) {
            if (campo[i][k].hasTarget && campo[i][k].target.type == "item"+targVect[0]) {
                campo[i][k].target.status = 1
                socket.emit("setStatus",i,k,1)
            }
        }
    }
    var vect = [1,0,0,0,0,0]
    sessionStorage.setItem("targetVect",targVect)
    sessionStorage.setItem("targetStatus",vect)
    drawTargets(1,1,false)
})
socket.on("emitNewTargetStatus",function(targStat){
    sessionStorage.setItem("targetStatus",targStat)
    drawTargets(1,1,false)
})
function showItem(item){
    back = item.style.background
    backImage = back.split("img/")[1].split('.png")')[0]
    document.getElementById(backImage).style.zIndex = 1000
    document.getElementById(backImage).style.background = "yellow"
    document.getElementById(backImage).style.width = "60px"
    document.getElementById(backImage).style.height = "60px"
    setTimeout(() => {
        document.getElementById(backImage).style.background = ""
        document.getElementById(backImage).style.width = "40px"
        document.getElementById(backImage).style.height = "40px"
    }, 500);
}
function drawTargets(targVect,targStat,drawAgain){
    if(!drawAgain){
        targVect=sessionStorage.getItem("targetVect").split(',')
        targStat=sessionStorage.getItem("targetStatus").split(',')
    }
    var allClass = document.getElementsByClassName("items")

    for (let j = 0; j < 6; j++) {
        if (targStat[j] == 0) {
            allClass.item(j).style.background = "url(static/img/questionMark.png)"
        }
        else{
            allClass.item(j).style.background = "url(static/img/item"+targVect[j] + ".png"
            allClass.item(j).setAttribute("onclick","")
            allClass.item(j).style.cursor = "default"
            allClass.item(j).style.border=0
            if (targStat[j] == 1){
                allClass.item(j).setAttribute("onclick","showItem(this)")
                allClass.item(j).style.cursor = "pointer"
                allClass.item(j).style.border="3px solid green"
                allClass.item(j).style.borderRadius = "4px"
            }
        }
      }
    if (targStat[5]==2)
      document.getElementById("returnBaseMSG").style.display="block"
}

//ruota cella bonus
socket.on("rotateCellaBonus", function(idz,ImgUrl,rot){
    document.getElementById(idz).style.background = ImgUrl
    document.getElementById(idz).style.transform = rot
})
socket.on("rotateTargetCellaBonus", function(type,c1,c2){
    document.getElementById(type).style.content = "static/"+c1
    document.getElementById(type).style.transform = c2
})
socket.on("othersTurno",function(turnoNick){
    document.getElementById("infoMessageText").innerText = "É il turno di "+ turnoNick
    document.getElementById("campo").style.pointerEvents = "none"
    document.getElementById("campo").style.opacity = "0.5"
    document.getElementById("skipDiv").style.pointerEvents = "none"
    document.getElementById("skipDiv").style.opacity = "0.5"
})
socket.on("yourTurn",function(){
    document.getElementById("infoMessageText").innerHTML = "<b>É il tuo turno</b>: inserisci la tessera"
    document.getElementById("campo").style.pointerEvents = "initial"
    document.getElementById("campo").style.opacity = "1"
})
socket.on("playerLeft",function(){
    document.getElementById("myModal").style.display = "none"
    document.getElementById("myModal").style.display = "block"
    document.getElementById("winnerMessage").style = "text-align: center;margin-top: 40px;font-size:15px"
    document.getElementById("winnerMessage").innerHTML = "Uno o più giocatori si sono disconessi durante la partita <br><br> In attesa del loro ritorno.."
})
socket.on("backInGame",function(players,points,id,rooms,targVect,targStat,ped,campoOld,cellaBonus2,x,y,dir,turn,end){
    createBoard(ped) 
    bonusCella = new Cella(cellaBonus2.x,cellaBonus2.y,cellaBonus2.tipo,cellaBonus2.rotaz,cellaBonus2.fissa)
    if (cellaBonus2.target != undefined) {
        bonusCella.setTarget(cellaBonus2.target.type,cellaBonus2.target.player)
    }
    bonusCella.printAgain(9,3);
    bonusCella.setAsBonus() 
    for (let i = 0; i < 7; i++) {
        for (let k = 0; k < 7; k++) {
            campo[i][k] = new Cella(campoOld[i][k].x,campoOld[i][k].y, campoOld[i][k].tipo,campoOld[i][k].rotaz, campoOld[i][k].fissa)
            if (campoOld[i][k].target != undefined) {
                campo[i][k].setTarget(campoOld[i][k].target.type,campoOld[i][k].target.player,campoOld[i][k].target.obfuscated)
                if (campo[i][k].target.obfuscated) {
                    document.getElementById(campo[i][k].target.type).style.opacity = "0.5"
                }
            }
                campo[i][k].printAgain(k,i)
                campo[i][k].setAsCella()
        }     
    }
    document.getElementById("logindocument").style.display = "none"
    document.getElementById("gamedocument").style.display = "block"
    disableDirect(dir,x,y)
    thisNickname = players[id]
    drawTargets(targVect,targStat,true)
    setCookie("roomcode",rooms,1)
    setCookie("idPlayer",id,1)
    tablePlayers = document.getElementsByClassName("playertd")
    tablePoints = document.getElementsByClassName("pointstd")
    for (let i = 0; i < 4; i++) {
        tablePlayers.item(i).innerHTML = players[i]
        tablePoints.item(i).innerHTML = points[i]
    }
    tablePlayers.item(id).style.color ="red"
    for (let i = 0; i < 4; i++) {
        pedine[i].print()
        /*document.getElementById(i+"car").style.setProperty("--x",ped[i].x)
        document.getElementById(i+"car").style.setProperty("--y",ped[i].y)     
        let angle=(90*(ped[i].rotaz+1))%360
        document.getElementById(i+"car").style.transform = "rotate("+angle+"deg)" */
    }
})
//gest generazione campo        
    socket.on("campoCreated", function (campoOld, cellaBonus2) {
        createBoard()
        document.getElementById("logindocument").style.display = "none"
        document.getElementById("gamedocument").style.display = "block"
            for (let i = 0; i < 7; i++) {
                for (let k = 0; k < 7; k++) {
                    campo[i][k] = new Cella(campoOld[i][k].x, campoOld[i][k].y, campoOld[i][k].tipo,campoOld[i][k].rotaz, campoOld[i][k].fissa,0,false,campoOld[i][k].hasTarget,campoOld[i][k].target)
                    if (campoOld[i][k].target != undefined) {
                        campo[i][k].setTarget(campoOld[i][k].target.type,campoOld[i][k].target.player)
                        }
                }
            }
            bonusCella = new Cella(cellaBonus2.x, cellaBonus2.y, cellaBonus2.tipo,cellaBonus2.rotaz,cellaBonus2.fissa,0,false)
            drawCampo(campo, bonusCella)
        })