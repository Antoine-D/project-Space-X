var restify = require ('restify');
var builder = require('botbuilder');
var SpaceXAPI = require('SpaceX-API-Wrapper');
var https = require('https');
var SpaceX = new SpaceXAPI();

//server
var server = restify.createServer();
server.listen(process.env.PORT || 3978,function(){
    console.log("%s listening to %s",server.name,server.url);
});
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());
//universal bot
// []= default dialog
var inMemoryStorage = new builder.MemoryBotStorage();


var bot = new builder.UniversalBot(connector, [
    function ( session ) {
        session.send('Hello, je suis le bot Space X');
        session.beginDialog( 'menu' );
    }]
).set('storage', inMemoryStorage );

bot.on('conversationUpdate', function ( message ) {
    if( message.membersAdded ){
        message.membersAdded.forEach( function ( identity ) {
            if( identity.id === message.address.bot.id ){
                bot.beginDialog( message.address, '/' );
            }
        })
    }
});

// Menu Item
var menuItems = {
    "About Space X" :{
        item : "aboutDialog"
    },
    "Next Launch" :{
        item : "nextLaunchDialog"
    },
    "Past Launch" :{
        item : "pastLaunchDialog"
    },
    "All Laucnhes" :{
        item : "allLaunchesDialog"
    },
};

bot.dialog('menu', [
    //step 1
    function(session){
        builder.Prompts.choice( session, "Voila ce que je peux faire pour toi :", menuItems, {listStyle: 3 })
    },
    //step 2
    function(session,result){
        var choice = result.response.entity;
        session.beginDialog( menuItems[choice].item )
    }
]);

function typing() {
    session.sendTyping();
}

bot.dialog('aboutDialog',[
    function (session) {
        session.sendTyping();
        SpaceX.getCompanyInfo( function ( err, data) {
            session.send(JSON.stringify(data))
        });

    }

]);
