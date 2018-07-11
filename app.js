var restify = require ('restify');
var builder = require('botbuilder');
var SpaceXAPI = require('SpaceX-API-Wrapper');
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
    "All Launches" :{
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
            var adaptiveCard = {
              "type": "message",
              "text": "Information",
              "attachments": [
                {
                  "contentType": "application/vnd.microsoft.card.adaptive",
                  "content": {
                    "type": "AdaptiveCard",
                    "version": "1.0",
                    "body": [
                      {
                        "type": "TextBlock",
                        "text": data.name,
                        "size": "large"
                      },
                      {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Fondateur",
                                "value": data.founder
                            },
                            {
                                "title": "Fondée en ",
                                "value": data.founded
                            },
                            {
                                "title": "Nombres d'employés",
                                "value": data.employees
                            },
                            {
                                "title": "Adresse",
                                "value": data.headquarters.address + '<br>' + data.headquarters.city + ', ' + data.headquarters.state
                            }
                        ]
                      }
                    ],
                    "actions": [
                      {
                        "type": "Action.OpenUrl",
                        "url": "www.spacex.com/",
                        "title": "En savoir plus"
                      }
                    ]
                  }
                }
                ]
            }
            session.endDialogWithResult(adaptiveCard)
        });

    }

]);

bot.dialog('pastLaunchDialog', [
    function(session){

        session.sendTyping();
        SpaceX.getLatestLaunch( function ( err, data) {
            session.send(JSON.stringify(data))


            // console.log(info);
            // var adaptativeCard = {
            //     "type": "message",
            //     "text": "We know everything.",
            //     "attachments": [
            //         {
            //             "contentType": "application/vnd.microsoft.card.adaptive",
            //             "content": {
            //                 "type": "AdaptiveCard",
            //                 "version": "1.0",
            //                 "body": [
            //                     {
            //                         "type": "TextBlock",
            //                         "text": (data.details ? data.details : "< pas d'information >"),
            //                         "size": "large"
            //                     },
            //                     {
            //                         "type": "TextBlock",
            //                         "text": "Nous savons tout."
            //                     },
            //                     {
            //                         "type": "TextBlock",
            //                         "text": "- Anonymous",
            //                         "separation": "none"
            //                     }
            //                 ],
            //                 "actions": [
            //                     {
            //                         "type": "Action.OpenUrl",
            //                         "url": "http://adaptivecards.io",
            //                         "title": "Learn More"
            //                     }
            //                 ]
            //             }
            //         }
            //     ]
            // }
            // session.send(adaptativeCard);
        });
    }
]);


bot.dialog('allLaunchesDialog',[
    function (session) {
        session.sendTyping();
        SpaceX.getAllLaunches({}, function ( err, data) {
            session.send(JSON.stringify(data))
        });

    }

]);

bot.dialog('nextLaunchDialog',[
    function (session) {
        session.sendTyping();
        SpaceX.getAllUpcomingLaunches({}, function ( err, data) {
            session.send(JSON.stringify(data))
        });

    }

]);
