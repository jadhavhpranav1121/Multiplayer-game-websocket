let clientId=null;
let gameId=null;
let gameIdSecond=null;
let playerOption=null;



// // for production
let ws=new WebSocket("wss://multiplayer-game-websocket.onrender.com");
// end



// For Developement 
// let ws=new WebSocket("ws://localhost:3000");
//end
 


let game=null;
let completedOrNot=false;
let prevArray=[];
let winnerStack=[];
const btnCreate=document.getElementById("btnCreate");
const btnJoin=document.getElementById("btnJoin");
const txtGameId=document.getElementById("txtGameId");
const divPlayers=document.getElementById("divPlayers");
const divBoard=document.getElementById("divBoard");
const id=document.getElementById("id");
const playShow=document.getElementById("playShow");
const winnerShow=document.getElementById("winnerShow");
const displayButton=document.getElementsByClassName("displayButton")[0];
const board=document.getElementsByClassName("board")[0];
const btnNickName=document.getElementById("btnNickName");
const txtNickName=document.getElementById("txtNickName");
const divOptions=document.getElementById("divOptions");
const result=document.getElementById("result");
const restart=document.getElementById("restart");
let container=document.getElementsByClassName('container')[0];
let winner=document.getElementsByClassName('winner')[0];
let winnerStackDiv=document.getElementById('winnerStack');
let heading=document.getElementsByClassName('heading')[0];
// let nextoption=document.getElementById("nextoption");
let txtnextoption;
let CreateOrNot=false;
// let heading=document.getElementsByClassName("heading")[0];
playShow.style.display="none";
displayButton.style.display="none";
winnerStackDiv.style.display="none";
heading.style.display="none";

btnCreate.addEventListener("click",e=>{
    if(txtNickName.value===''){
        alert("Please Enter your nickname");
        return;
    }
    if(txtGameId.value!==''){
        // console.log(txtNickName.value);
        alert("Game is created already");
        return;
    } 
    const payLoad={
        "method":"create",
        "clientId":clientId,
        "nickname":txtNickName.value
    }
    txtGameId.disabled=true;
    txtNickName.disabled=true;
    ws.send(JSON.stringify(payLoad));
});

function joinFunction(){
    if(gameId===null){
        gameId=txtGameId.value;
        gameIdSecond=null;
    }
    if(txtNickName.value===''){
        alert("Please Enter your nickname");
        return;
    }
    else if(txtGameId.value.length<=0){
        alert("First Create game ");
        return;
    }
        
        const payLoad={
            "method":"join",
            "clientId":clientId,
            "gameId":gameId,
            "nickname":txtNickName.value
        }
        heading.style.display="table";
        txtGameId.disabled=true;
        txtNickName.disabled=true;
        ws.send(JSON.stringify(payLoad));
}
btnJoin.addEventListener("click",e=>{
    joinFunction();
});

function showWinner(){
    winnerStackDiv.style.display="flex";
    board.style.display="none";
    playShow.style.display="block";
    winnerShow.style.display="none";
}
function showPlay(){
    winnerStackDiv.style.display="none";
    board.style.display="flex";
    winnerShow.style.display="block";
    playShow.style.display="none";
}

ws.onmessage=message=>{
    const response=JSON.parse(message.data);
    if(response.method=="connect"){
        clientId=response.clientId;
        // console.log(clientId);
    }

    if(response.method=="create"){
        gameId=response.game.id;
        txtGameId.value=gameId;
    }
    if(response.method=="join"){
        game=response.game;
        // console.log(game);
        while(divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
        while(divOptions.firstChild) divOptions.removeChild(divOptions.firstChild);
        game.clients.forEach(c=>{
            const d=document.createElement("td");
            const p=document.createElement("td");
            p.textContent=c.option;
            // d.style.width="200px";
            d.style.background=c.color;
            d.textContent=c.nickname;
            divPlayers.appendChild(d);
            divOptions.appendChild(p);
            if(c.clientId===clientId) playerOption=c.option;
        })
        while(divBoard.firstChild) divBoard.removeChild(divBoard.firstChild);
        for(let i=0;i<game.balls;i++){
            const b=document.createElement("div");
            b.className="btn";
            b.id="ball"+(i+1);
            b.tag=i+1; 
        
            b.addEventListener("click",e=>{ 
               
                const emptyCount = game["cells"].filter(a => a.length === 0).length; 
                if(game["prevOption"]!=playerOption){
                    if(game["cells"][b.tag-1]==''){
                        b.textContent=playerOption;
                        game["cells"][b.tag-1]=playerOption;
                    }
                    let conditions = [
                                        [0, 1, 2],
                                        [3, 4, 5],
                                        [6, 7, 8],
                                        [0, 3, 6],
                                        [1, 4, 7],
                                        [2, 5, 8],
                                        [0, 4, 8],
                                        [2, 4, 6]
                    ];
                    let cells=game["cells"];
                    // console.log(completedOrNot);
                    if(completedOrNot==false){
                        for(let i=0;i<conditions.length;i++){
                            if( cells[conditions[i][0]]!=undefined && cells[conditions[i][1]]!=undefined && cells[conditions[i][2]]!=undefined &&  cells[conditions[i][0]]!='' && cells[conditions[i][1]]!='' && cells[conditions[i][2]]!='' && cells[conditions[i][0]]==cells[conditions[i][1]] && cells[conditions[i][1]]==cells[conditions[i][2]]){
                                const payLoad={
                                    "method":"winner",
                                    "clientId":clientId,
                                    "type":'winner',
                                    "gameId":gameId,
                                    "completed":true
                                }
                                ws.send(JSON.stringify(payLoad));
                                break;
                            }
                        }
                    }
                    const payLoad={
                        "method":"play",
                        "clientId":clientId,
                        "gameId":gameId,
                        "ballId":b.tag,
                        "option":playerOption
                    }
                    ws.send(JSON.stringify(payLoad));
                }
                else{
                    txtnextoption=(game["prevOption"]=='X'?'O':'X');
                    for(let i of game.clients){
                        if(i.option==txtnextoption){
                            alert("it's "+i.nickname+" turn");
                            break;
                        }
                    }
                   
                }
                if(emptyCount==1){
                    const payLoad={
                        "method":"winner",
                        "clientId":clientId,
                        "type":'tie',
                        "gameId":gameId,
                        "completed":false
                    }
                    
                    ws.send(JSON.stringify(payLoad));
                }
            })
         
            divBoard.appendChild(b);
        }
        function reset_all(){
            container.style.display="block"; 
            winner.style.display="none";
            for(let i=1;i<=9;i++){
                document.getElementById("ball"+i).textContent='';
                document.getElementById("ball"+i).style.pointerEvents='auto';
                document.getElementById("ball"+i).style.padding='0 auto';
            }
            // completedOrNot=false;
        }
        restart.addEventListener("click",(e)=>{
            reset_all();
            const payLoad={
                "method":"reset",
                "gameId":gameId
            }
            completedOrNot=false;
            ws.send(JSON.stringify(payLoad));
        })
    }
    if(response.method=='winner'){  
        if(response.type=='tie'){
            result.textContent="game is tie";
        }
        else{
            result.textContent=(response.winner+" is Winner");
        }
        completedOrNot=true;
        for(let i=1;i<=9;i++){
            document.getElementById("ball"+i).style.pointerEvents='none';
        }
        container.style.display="none";
        // winnerStackDiv.style.display="none";
        winner.style.display="flex";
        game=response.game;
        winnerStack=game["winnerStack"];
        
        while(winnerStackDiv.firstChild) winnerStackDiv.removeChild(winnerStackDiv.firstChild);
        let winner_stats=getFrequency(winnerStack);
        if(winnerStack.length>0){
            displayButton.style.display="flex";
        }
        let sortable = [];
        for (var f in winner_stats) {
            sortable.push([f, winner_stats[f]]);
        }       
        sortable.sort( function (a,b) { return b[1] - a[1]; } );
        let table=document.createElement("table");
        let tr=document.createElement("thead");
            let td1=document.createElement("th");
            let td2=document.createElement("th");
            td1.textContent="Name";
            td2.textContent="Count";
            tr.appendChild(td1);
            tr.appendChild(td2);
            table.appendChild(tr);
        for(let i=0;i<sortable.length;i++){
            let tr=document.createElement("tr");
            let td1=document.createElement("td");
            let td2=document.createElement("td");
            td1.textContent=sortable[i][0];
            td2.textContent=sortable[i][1];
            tr.appendChild(td1);
            tr.appendChild(td2);
            table.appendChild(tr);
        }        
        winnerStackDiv.append(table);
    }
    if(response.method=='error'){
        // console.log(response);
        alert(response.message);
    }
    if(response.method=='playReply'){
        game=response.game;
    }
    if(response.method=='reset'){
        game=response.game;
        // console.log(game);
        container.style.display="block"; 
        winner.style.display="none";
        // winnerStackDiv.style.display="block";
        for(let i=1;i<=9;i++){
            document.getElementById("ball"+i).textContent='';
            document.getElementById("ball"+i).style.pointerEvents='auto';
        }
        completedOrNot=false;
    }
    if(response.method==="update"){
        if(!response.game.state){
            return;
        }
        for(const b of Object.keys(response.game.state)){
            const option=response.game.state[b];
            const ballObject=document.getElementById("ball"+b);
            ballObject.textContent=option;                   
        }
    }
}
const getFrequency = (array) => {
    const map = {};
    array.forEach(item => {
       if(map[item["nickname"]]){
          map[item["nickname"]]++;
       }else{
          map[item["nickname"]] = 1;
       }
    });
    return map;
 };
