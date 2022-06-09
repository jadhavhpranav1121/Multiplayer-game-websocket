const v4=require("uuid").v4;
const http=require('http');
const app=require("express")();
app.listen("8000",()=>{
    console.log("listening to 8000");
}); 

app.get("/",(req,res)=>{ res.sendFile(__dirname+"/index.html")});
const websocketServer=require("websocket").server;
const httpServer=http.createServer();
httpServer.listen(4200,()=>{
    console.log("listening.. on 4200");
})

const clients={};
const games={};
let currentClientId=0;
const wsServer=new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request",request=>{
    
    const connection = request.accept(null,request.origin);
    connection.on("open",()=> console.log("opened"));
    connection.on("close",()=> console.log("Closed"));
    connection.on("message",message=>{
        const result=JSON.parse(message.utf8Data);
        if(result.method==="create"){
            const clientId=result.clientId;
            currentClientId=clientId;
            const gameId=v4();
            games[gameId]={
                "id":gameId,
                "balls":9,
                "clients":[]
            }
            const payLoad={
                "method":"create",
                "game":games[gameId]
            }
            clients[clientId].nickname=result.nickname;
            const con=clients[clientId].connection;
            con.send(JSON.stringify(payLoad)); 
        }
        if(result.method==="join"){
            const clientId=result.clientId;
            const gameId=result.gameId;
            const game=games[gameId];

            if(currentClientId==clientId && game.clients.length<1){
                console.log("current Memberr");
                return;
            }
            if(game.clients.length<2){
                const color={"0":"Red","1":"green"}[game.clients.length];
                game.clients.push({
                    'clientId':clientId,
                    "color":color,
                    "nickname":result.nickname
                })
                if(game.clients.length===2) updateGameState();
                let payLoad={
                    "method":"join",
                    "game":game
                }
                game.clients.forEach(c=>{
                    clients[c.clientId].connection.send(JSON.stringify(payLoad));
                }) 
            }
            
        }
        if(result.method=="play"){
            const clientId=result.clientId;
            const gameId=result.gameId;
            const ballId=result.ballId;
            const color=result.color;
            let state=games[gameId].state;
            if(!state){
                state={};
            }
            state[ballId]=color;
            games[gameId].state=state;

        }
    })

    const clientId=v4();
    clients[clientId]={
        "connection":connection
    };
    
    const payLoad={
        "method":"connect",
        "clientId":clientId
    }

    connection.send(JSON.stringify(payLoad));
})

function updateGameState(){
    for(const g of Object.keys(games)){
        const game=games[g]
        const payLoad={
            "method":"update",
            "game":game
        }
        game.clients.forEach(c=>{
            clients[c.clientId].connection.send(JSON.stringify(payLoad));
        })
    }
    setTimeout(updateGameState,500);
}
