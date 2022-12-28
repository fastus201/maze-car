var pedine //pedine[0]=blu, pedine[1]=rossa, pedine[2]=verde, pedine[3]=gialla
var ANIMATION=false
var turno
function drawCampo(campo,bonusCella) {
    for (let i = 0; i < 7; i++) {
        for (let k = 0; k < 7; k++) {           
            campo[i][k].print()
        }
    }
    bonusCella.print();
}

function checkRotateCella() {
     socket.emit("emitRotateCella")
}
function checkPutCella(name) {
    if (ANIMATION) 
        return
    var x = parseInt(getComputedStyle(name).getPropertyValue('--x'))
    var y = parseInt(getComputedStyle(name).getPropertyValue('--y'))   
    var arrowDirection = name.className
    socket.emit("moveCella",x,y,arrowDirection)
}


function skipTurn() {
    socket.emit("skipTurn")
}
function checkMovePedina(pedina) {
    if (ANIMATION)
        return
    let x = getComputedStyle(pedina).getPropertyValue('--x')
    let y = getComputedStyle(pedina).getPropertyValue('--y')
    document.getElementById("skipDiv").style.pointerEvents = "none"
    document.getElementById("skipDiv").style.opacity = "0.5"
    socket.emit("emitMovePedina",x,y)
}                             
function animationError() {
    document.getElementById("campo").style.setProperty("animation","0.25s ease 0s 1 normal none running errorCampo")
    setTimeout(() => {
         document.getElementById("campo").style.setProperty("animation","")
    }, 250);
}

function createBoard(peds) {
    pedine=new Array()
    //document.getElementById("myModal").style.display = "block";
    //creazione delle celle
    let campoDiv = document.getElementById("campo")
    for (let i = 0; i < 49; i++) {
        let cellaDiv = document.createElement("div")
        cellaDiv.classList.add("cella")
        cellaDiv.setAttribute("id",i)
        cellaDiv.setAttribute("onclick","checkMovePedina(this)")
        campoDiv.appendChild(cellaDiv)
    }

    //Creo oggetti per le 
    if (peds == undefined) {
        pedine.push(new Pedina(0,0,"0car",3,"blue"))
        pedine.push(new Pedina(6,0,"1car",2,"red"))
        pedine.push(new Pedina(0,6,"2car",1,"green"))
        pedine.push(new Pedina(6,6,"3car",0,"yellow"))   
    }
    else{
        for (let i = 0; i < 4; i++) {
            pedine[i]= new Pedina(peds[i].x,peds[i].y,peds[i].id,peds[i].rotaz,peds[i].color)    
        }
    }
    //frecce per la direzione
    for (let i = 0; i < 3; i++) {
        //sotto
        dirDown = document.createElement("div")
        dirDown.classList.add("dirDown")
        dirDown.style.setProperty('--x',i*2 +1.38)
        dirDown.setAttribute("onclick","checkPutCella(this)")
        dirDown.setAttribute("id","down"+i)  
        campoDiv.appendChild(dirDown)
        //destra
        dirRight = document.createElement("div")
        dirRight.classList.add("dirRight")
        dirRight.style.setProperty('--y',i*2 +1.38)  
        dirRight.setAttribute("onclick","checkPutCella(this)")
        dirRight.setAttribute("id","right"+i)    
        campoDiv.appendChild(dirRight) 
        //sopra 
        dirTop = document.createElement("div")
        dirTop.classList.add("dirTop")
        dirTop.style.setProperty('--x',i*2 +1.38)
        dirTop.setAttribute("onclick","checkPutCella(this)")   
        dirTop.setAttribute("id","top"+i)   
        campoDiv.appendChild(dirTop)
        //sinistra
        dirLeft = document.createElement("div")
        dirLeft.classList.add("dirLeft")
        dirLeft.style.setProperty('--y',i*2 +1.38)  
        dirLeft.setAttribute("onclick","checkPutCella(this)") 
        dirLeft.setAttribute("id","left"+i)   
        campoDiv.appendChild(dirLeft)  
    }
    //disattivazione pulsante per lo skip del turno
    document.getElementById("skipDiv").style.pointerEvents = "none"
    document.getElementById("skipDiv").style.opacity = "0.5"
}
function enterCheck(e){
    if (e.keyCode == 13 && document.getElementById("nickname").value != "") {
        sendNickname()
    }
}
function sendNickname() {
    if (document.getElementById("nickname").value != ""){
        thisNickname = document.getElementById("nickname").value
        document.getElementById("confirmOk").style.display = "none"
        document.getElementById("nickname").style.display = "none"
        document.getElementsByClassName("containerButton").item(0).style.display = "flex"
        document.getElementById("nickMessage").style.display = "none"
    }
}
function setFocus(){
    document.getElementById("nickname").focus()
}
