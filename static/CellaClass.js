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
    setXY(x,y){
        document.getElementById(this.id).style.setProperty("--x",x)
        document.getElementById(this.id).style.setProperty("--y",y)
        this.x = x 
        this.y = y
    }
    getImgUrl(idz){
        if(idz==0)
            return "url(static/img/baseBlu.png)"
        else if(idz==6)
            return "url(static/img/baseRossa.png)"
        else if(idz==42)
            return "url(static/img/baseVerde.png)"
        else if(idz==48)
            return "url(static/img/baseGialla.png)"
        return "url(static/img/img"+this.tipo+".png)"
    }
    print(){
        document.getElementById(this.id).style.background =this.getImgUrl(this.id)
        document.getElementById(this.id).style.transform = "rotate("+this.rotaz*90+"deg)"
        document.getElementById(this.id).style.setProperty("--x",this.x)
        document.getElementById(this.id).style.setProperty("--y",this.y)
        if (this.hasTarget)
            this.target.print(this.rotaz)
    }
    printAgain(k,i){
        document.getElementById(this.id).style.background =this.getImgUrl(this.id)
        document.getElementById(this.id).style.transform = "rotate("+this.rotaz*90+"deg)"
        document.getElementById(this.id).style.setProperty("--x",k)
        document.getElementById(this.id).style.setProperty("--y",i)
        if (this.hasTarget)
            this.target.print(this.rotaz)
    }
    setAsCella(){
        document.getElementById(this.id).setAttribute("class","cella")
        document.getElementById(this.id).setAttribute("onclick","checkMovePedina(this)")
    }
    setAsBonus(){
        document.getElementById(this.id).setAttribute("class","bonusCella")
        document.getElementById(this.id).setAttribute("onclick","checkRotateCella()")
    }
    setTarget(type,player,obf){
        this.hasTarget=true;
        var parent=document.getElementById(this.id)
        this.target = new Target(type,player,parent,this.x,this.y,obf)
    }
}


class Pedina {
    constructor(x,y,id,rotaz,color){
        this.x = x 
        this.y = y 
        this.rotaz= rotaz //0= ovest, poi in senso orario
        this.color = color
        this.id = id
        let campoDiv = document.getElementById("campo")
        let pedinaDiv = document.createElement("img")
        pedinaDiv.setAttribute("class","pedina")
        pedinaDiv.setAttribute("id",this.id)
        pedinaDiv.setAttribute("onclick","checkMovePedina(this)")
        campoDiv.appendChild(pedinaDiv)
        this.print()
    }
    rotate(dir){
        this.rotaz = dir   
        let angle=(90*(dir+1))%360
        document.getElementById(this.id).style.transform = "rotate("+angle+"deg)"
    }
    print(){
        document.getElementById(this.id).style.content = "url(static/img/"+this.color+".png)"
        document.getElementById(this.id).style.transform = "rotate("+(90*(this.rotaz+1))%360+"deg)"
        document.getElementById(this.id).style.setProperty("--x",this.x); 
        document.getElementById(this.id).style.setProperty("--y",this.y); 
    }
    move(x,y) {
        this.x = parseInt(x)
        this.y = parseInt(y)
        this.print()
    }
    //dir=0 ovest e poi senso orario
    shiftCar(dir){
        switch (dir) {
            case 0:
                this.x=(this.x+6)%7
                break;
            case 1:
                this.y=(this.y+6)%7
                break;
            case 2:
                this.x=(this.x+1)%7            
                break;
            case 3:
                this.y=(this.y+1)%7
                break;
        }
        this.print()
    }
    reduceCar(){
        document.getElementById(this.id).style.width = "25px"
        document.getElementById(this.id).style.height = "25px"
        document.getElementById(this.id).style.marginLeft = this.id[0]%2 * 25 + "px"
        document.getElementById(this.id).style.marginTop = parseInt(this.id[0]/2) * 25 + "px"
    }
    maximizeCar(){
        document.getElementById(this.id).style.width = "50px"
        document.getElementById(this.id).style.height = "50px"
        document.getElementById(this.id).style.marginLeft = "0px"
        document.getElementById(this.id).style.marginTop = "0px"
    }
}


class Target {
    constructor(type,player,parent,x,y,obf){
        this.status = 0
        this.type="item"+type
        this.player=player
        this.x = x
        this.y = y
        this.obfuscated = obf
        this.draw(parent)
    }
    draw(parent){
        let items = document.createElement("div")
        items.setAttribute("class","target")
        items.setAttribute("id",this.type)
        parent.append(items)
    }
    print(parentRotaz){
            document.getElementById(this.type).style.content = "url(static/img/"+this.type+".png)" 
            document.getElementById(this.type).style.transform = "rotate("+parentRotaz*(-90)+"deg)"
    }
    
}
