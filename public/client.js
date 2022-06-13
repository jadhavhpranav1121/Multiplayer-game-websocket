let clientId=null;
let gameId=null;
let playerOption=null;
let ws=new WebSocket("ws://localhost:4200");
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
const btnNickName=document.getElementById("btnNickName");
const txtNickName=document.getElementById("txtNickName");
const divOptions=document.getElementById("divOptions");
const result=document.getElementById("result");
const restart=document.getElementById("restart");
let container=document.getElementsByClassName('container')[0];
let winner=document.getElementsByClassName('winner')[0];
let winnerStackDiv=document.getElementById('winnerStack');

btnCreate.addEventListener("click",e=>{
    if(txtNickName.value===''){
        alert("Please Enter your nickname");
        return;
    }
    const payLoad={
        "method":"create",
        "clientId":clientId,
        "nickname":txtNickName.value
    }
    ws.send(JSON.stringify(payLoad));
});



btnJoin.addEventListener("click",e=>{
    if(gameId===null){
        gameId=txtGameId.value;
    }
    if(txtNickName.value===''){
        alert("Please Enter your nickname");
        return;
    }
    const payLoad={
        "method":"join",
        "clientId":clientId,
        "gameId":gameId,
        "nickname":txtNickName.value
    }
    ws.send(JSON.stringify(payLoad));
})

ws.onmessage=message=>{
    const response=JSON.parse(message.data);
    if(response.method=="connect"){
        clientId=response.clientId;
    }

    if(response.method=="create"){
        gameId=response.game.id;
        txtGameId.value=gameId;
    }
    if(response.method=="join"){
        game=response.game;
        while(divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
        while(divOptions.firstChild) divOptions.removeChild(divOptions.firstChild);
        game.clients.forEach(c=>{
            const d=document.createElement("div");
            const p=document.createElement("div");
            p.textContent=c.option;
            d.style.width="200px";
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
                    if(completedOrNot==false){
                        for(let i=0;i<conditions.length;i++){
                            if( cells[conditions[i][0]]!=undefined && cells[conditions[i][1]]!=undefined && cells[conditions[i][2]]!=undefined &&  cells[conditions[i][0]]!='' && cells[conditions[i][1]]!='' && cells[conditions[i][2]]!='' && cells[conditions[i][0]]==cells[conditions[i][1]] && cells[conditions[i][1]]==cells[conditions[i][2]]){
                                const payLoad={
                                    "method":"winner",
                                    "clientId":clientId,
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
                   
            })
            divBoard.appendChild(b);
        }
        restart.addEventListener("click",(e)=>{
            container.style.display="block"; 
            winner.style.display="none";
            for(let i=1;i<=9;i++){
                document.getElementById("ball"+i).textContent='';
                document.getElementById("ball"+i).style.pointerEvents='auto';
            }
            const payLoad={
                "method":"reset",
                "gameId":gameId
            }
            completedOrNot=false;
            ws.send(JSON.stringify(payLoad));
        })
    }
    if(response.method=='winner'){  
        result.textContent=(response.winner+" is Winner");
        completedOrNot=true;
        for(let i=1;i<=9;i++){
            document.getElementById("ball"+i).style.pointerEvents='none';
        }
        container.style.display="none"; 
        winner.style.display="flex";
        game=response.game;
        winnerStack=game["winnerStack"];
        while(winnerStackDiv.firstChild) winnerStackDiv.removeChild(winnerStackDiv.firstChild);
        let winner_stats=getFrequency(winnerStack);
        let sortable = [];
        for (var f in winner_stats) {
            sortable.push([f, winner_stats[f]]);
        }       
        sortable.sort( function (a,b) { return b[1] - a[1]; } );
        for(let i=0;i<sortable.length;i++){
            let b=document.createElement("div");
            b.className='winnerHistory';
            b.textContent=`${sortable[i][0]} :- ${sortable[i][1]}`;
            winnerStackDiv.appendChild(b);
        }        
    }
    if(response.method=='playReply'){
        game=response.game;
    }
    if(response.method=='reset'){
        game=response.game;
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