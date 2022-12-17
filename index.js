const v4=require("uuid").v4;
const http=require('http');
const app=require("express")();
const express=require("express");
let frontEnd=process.env.PORT || 2777;
const websocketServer=require("websocket").server;
const httpServer=http.createServer();
let backendEnd=process.env.PORT || 10000;
const wsServer=new websocketServer({
    "httpServer": httpServer
})

// For Developement
// app.listen(frontEnd,()=>{
//     console.log("listening to 2777");
// }); 
// websocketServer.listen(backendEnd,()=>{
//     console.log("listening.. on 3000");
// })

const clients={};
const games={};
let currentClientId=0;



app.use(express.static(__dirname+'/docs/'));
app.get("/",(req,res)=>{ res.sendFile(__dirname+"/docs/index.html")});

// httpServer.listen(backendEnd,()=>{
//     console.log(`listening.. on ${backendEnd}`);
// })
httpServer.listen(backendEnd, '0.0.0.0', err => {
    if (err) throw err
    console.log(`Listening on port ${backendEnd}`)
 })
// end





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
                "clients":[],
                "cells":Array(9).fill(''),
                "winnerStack":[],
                "completed":false,
                "prevOption":''
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
            if(!game){
                return;
            }

            // if(result.nickname==game[0].nickname && Object.keys(clients).length>1){
            //     const payLoad={
            //         "method":'error',
            //         "message":'users nickname should not be same',
            //         "type":"error"
            //     }
            //     console.log(game);
            //     game.clients.forEach(c=>{
            //         console.log(clients[c.clientId]);
            //         clients[c.clientId].connection.send(JSON.stringify(payLoad));
            //     }) 
            //     return;
            // }
          
            if(!games[gameId]["completed"]){
                // console.log( Object.keys(clients).length>=1)
                // if(currentClientId==clientId && Object.keys(clients).length>1  && game.clients.length<1){
                //     console.log("problem");
                //     return;
                // }
                if(game.clients.length<2){
                    const option={"0":"X","1":"O"}[game.clients.length];
                    game.clients.push({
                        'clientId':clientId,
                        "option":option,
                        "nickname":result.nickname
                    })
                    if(game.clients.length===2) {
                        updateGameState();
                    }
                    let payLoad={
                        "method":"join",
                        "game":game
                    }
                    // console.log(game);
                    game.clients.forEach(c=>{
                        clients[c.clientId].connection.send(JSON.stringify(payLoad));
                    }) 
                }
            }
            else{
                console.error("game is completed");
            }  
           console.log(games[gameId]);
        }
        if(result.method=='winner'){
            const game=games[result.gameId];
            let ans='';
            if(result.type=="tie"){
                const payLoad={
                    "method":'winner',
                    "winner":ans,
                    "type":result.type,
                    "completed":game["completed"],
                    "game":games[result.gameId]
                }
                game.clients.forEach(c=>{
                    clients[c.clientId].connection.send(JSON.stringify(payLoad));
                }) 
                return;
            }
            game.clients.forEach(e=>{
                if(e.clientId==result.clientId){
                    ans=e.nickname;
                }
            });
            games[result.gameId]["winnerStack"].push({"nickname":ans});
            console.log(games[result.gameId]["winnerStack"]);
            const payLoad={
                "method":'winner',
                "winner":ans,
                "type":result.type,
                "completed":game["completed"],
                "game":games[result.gameId]
            }
            game.clients.forEach(c=>{
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            }) 
        }
        if(result.method=="play"){
            if(games[result.gameId]["cells"][result.ballId-1]==''){
                const clientId=result.clientId;
                const gameId=result.gameId;
                const ballId=result.ballId;
                const option=result.option;
                let state=games[gameId].state;
                if(!state){
                    state={};
                }
                state[ballId]=option;
                games[gameId].state=state;
                games[result.gameId]["cells"][result.ballId-1]=option;
                games[result.gameId]["prevOption"]=result.option;
                let payLoad={
                    "method":"playReply",
                    "game":games[gameId]
                }
                games[gameId].clients.forEach(c=>{
                    clients[c.clientId].connection.send(JSON.stringify(payLoad));
                }) 
            }
        }
        if(result.method=='reset'){
            games[result.gameId].cells=Array(9).fill('');
            games[result.gameId].prevOption='';
            games[result.gameId].completed=false;
            games[result.gameId].state={};
            let payLoad={
                "method":"reset",
                "game":games[result.gameId],
            }
            games[result.gameId].clients.forEach(c=>{
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
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
