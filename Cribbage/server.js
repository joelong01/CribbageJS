// @ts-check
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var scoring = require('./Game/scoring');
var cards = require('./Game/card');
var SelectCards = require('./Game/selectcards');
var request = require('request');
var cors = require('cors');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());


var port = process.env.port || 8080;

var router = express.Router();

router.get(['/', '/help', '/readme'], function (req, res, next)
{
    var file = __dirname + '/readme.md';
    res.download(file); // Set disposition and send it.
});
router.get('/help', function (req, res, next)
{
    var file = __dirname + '/readme.md';
    res.download(file); // Set disposition and send it.
});

router.get('/suits', function (req, res)
{
    res.send(cards.Suit.toJSON());
});

router.get('/ordinals', function (req, res)
{
    res.send(cards.Ordinal.toJSON());

});

router.get('/allcards', function (req, res)
{
    res.send(JSON.stringify(cards.Deck));
});

router.get('/card/:name', function (req, res)
{
    var card = cards.Deck[req.params.name];
    res.send(JSON.stringify(card));
});

// Add headers
app.use(function (req, res, next)
{

 /*
    addAllowHeaders(res, 'http://localhost:3000');
    addAllowHeaders(res, 'https://cribbageui.azurewebsites.net');
 */
   
 
 // Pass to next layer of middleware
    next();
});

function addAllowHeaders(res, host)
{
    console.log("addAllowHeader for " + host);

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', host);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', "false");
}


//
//  cut the cards to see who goes first
//
//  sample URLs:
//              http://localhost:8080/api/cutcards
//
//  returns: the two cut cards 
//
router.get('/cutcards/', function (req, res, next)
{
    let url = 'https://www.random.org/sequences/?min=0&max=51&col=1&format=plain&rnd=new';

    var respObj = {};

    let ret = request(url, function (error, response, body)
    {
        var nums = body.split('\n');
        let i = 0;
        while (nums[i] === nums[i + 1])
        {
            
            i += 2;
        }
        console.log ("cutcards index: %s", i);
        let ret = cutCards(nums.splice(i, 2), true, req, res, next);
        return res.send(JSON.stringify(ret));

    });

});

//
//  cut the cards to see who goes first - pass in the random numbers that you get the same result
//  the last time the api was called. useful for testing.
//
//  sample URLs:
//              http://localhost:8080/api/cutcards/31,3
//
//  returns: the two cut cards 
//
router.get('/cutcards/:sequence', function (req, res, next)
{
    let nums = req.params.sequence.split(",");
    let ret = cutCards(nums, false, req, res, next);
    return res.send(JSON.stringify(ret));
});

function cutCards(nums, addSequenceToUrl, req, res, next)
{
    let url = "http://" + req.hostname + ":" + req.connection.localPort + req.originalUrl;
    if (addSequenceToUrl)
    {
        url += "/" + nums.toString();
    }
   
    var card1 = cards.Deck[cards.CardNames[nums[0]]]
    var card2 = cards.Deck[cards.CardNames[nums[1]]]   
  
    let cutCardsObj ={CutCards: { Player: card1, Computer: card2, RepeatUrl: url}};
    return cutCardsObj;
}

//
//  score the hand (or crib)
//
//  sample URLs:
//              localhost:8080/api/scorehand/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds/FourOfDiamonds/false
//              localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/false  (should be a flush)
//              localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/true   (no flush - need 5 of same suit in crib)
//              localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfHearts/true     (should be a flush)
//              localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOFClubs/SixOfDiamonds/true     (bad card)
//              localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOfClubs/SixOfDiamonds/true     (double double run with 15s - 24 points)
//              http://localhost:8080/api/scorehand/ThreeOfSpades,TwoOfSpades,QueenOfHearts,QueenOfClubs/AceOfHearts/false
//
router.get('/scorehand/:hand/:sharedcard/:isCrib', function (req, res, next)
{
    var hand = parseCards(req.params.hand, res);
    if (hand == null)
    {
        return next(404);
    }
    if (hand.length != 4)
    {
        res.status(404).send(hand.length + ' is not the right number of cards.  expect 4');
        return next(404);
    }
    var sharedcard = cards.Deck[req.params.sharedcard];
    var isCrib = JSON.parse(req.params.isCrib);
    var standardResponse = scoring.scoreHand(hand, sharedcard, isCrib);
    res.send(standardResponse);
});

//
//  given 6 cards, return 2.  if isMyCrib is true, then optimize to make the hand + crib as big as possible
//
//  sample URLs:
//                  localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/false  
//                  localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/true   
//                  localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/true  
//                  localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/false  
//
//   
router.get('/getcribcards/:hand/:isMyCrib', function (req, res, next)
{
    var hand = parseCards(req.params.hand, res);
    if (hand == null)
    {
        return next(404);
    }
    if (hand.length != 6)
    {
        res.status(404).send(hand.length + ' is not the right number of cards.  expect 6');
        return next(404);
    }
    var isMyCrib = JSON.parse(req.params.isMyCrib);
    var crib = SelectCards.selectCribCards(hand, isMyCrib);
    res.send(crib);

});
//
//  given a CSV string of CardName - AceOfSpaces,AceOfHearts
//  parse them into an array of Card objects and return it
//  if any of the names canpt be parsed return a 404 to the caller
//  with the name of the bad token
//
function parseCards(handAsString, res)
{
    var cardNames = handAsString.split(',');
    var hand = [];
    //
    // first build up the array of cards.  these store references to our deck
    for (var i = 0; i < cardNames.length; i++)
    {
        var card = cards.Deck[cardNames[i].trim()];
        if (card != null)
        {
            hand.push(card);
        }
        else
        {
            res.status(404).send('Bad Card: ' + cardNames[i]);
            return null;
        }
    }

    return hand;
}
//
//  URL example:
//                 localhost:8080/api/getnextcountedcard/AceOfSpades,AceOfHearts,TwoOfClubs,TenOfDiamonds/0
//                 http://localhost:8080/api/getnextcountedcard/FiveOfClubs,QueenOfDiamonds/25/ThreeOfDiamonds,TenOfClubs,TwoOfSpades,QueenOfSpades
//
//  Note that the last parameters contains all the cards that have already been counted, which means it starts empty, so there are two routes.
//  I trim spaces, but Cards must be spelled correctly
//      
router.get('/getnextcountedcard/:cardsleft/:currentCount', function (req, res, next)
{
    var countedCards = [];
    if (req.param.length != 2)
    {
        res.status(404).send('Bad URL: too many parameters' + req.params.length);
        next(404);
    }
    var cardsLeft = parseCards(req.params.cardsleft);
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }
    var currentCount = Number(req.params.currentCount);
    var ret = SelectCards.selectCountedCard(countedCards, cardsLeft, currentCount);
    res.send({ countedCard: ret, Scoring: { Score: 0, ScoreInfo: [] } });
});
//
//  URL examples:
//                 localhost:8080/api/getnextcountedcard/AceOfSpades,ThreeOfClubs/4/AceOfHearts,TwoOfClubs,TenOfDiamonds
//                 localhost:8080/api/getnextcountedcard/TenOfClubs,AceOfHearts/16/AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts
//                 localhost:8080/api/getnextcountedcard/AceOfHearts/29/AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts,TenOfClubs,ThreeOfDiamonds
//
//  Note that the last parameters contains all the cards that have already been counted, which means it starts empty, so there are two routes.
//  I trim spaces, but Cards must be spelled correctly
// 
router.get('/getnextcountedcard/:cardsleft/:currentCount/:countedcards', function (req, res, next)
{

    var countedCards = [];
    //
    // first build up the array of played cards.  these store references to our deck
    countedCards = parseCards(req.params.countedcards, res);
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }

    var cardsLeft = parseCards(req.params.cardsleft);
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }
    var currentCount = Number(req.params.currentCount);
    var ret = SelectCards.selectCountedCard(countedCards, cardsLeft, currentCount);

    var standardResponse = scoring.scoreCountingCardsPlayed(countedCards, ret, currentCount);

    res.send({ countedCard: ret, Scoring: standardResponse });

});

//
//  returns a randomized hand for player1, player2, and shared  
//
//  URL example:
//                 localhost:8080/api/scorecountedcards/AceOfSpades/0
//                   
router.get('/scorecountedcards/:playedcard/:currentCount', function (req, res, next)
{
    //
    //  if there are no counted cards, there can be no score. this is here for completeness
    //  and is called only when the first card is played.  this can easily be optimized away
    res.send(scoring.NoScoreResponse());
});

//
//  URL examples:
//                 localhost:8080/api/scorecountedcards/AceOfHearts/1/AceOfSpades
//                 localhost:8080/api/scorecountedcards/AceOfClubs/2/AceOfHearts,AceOfSpades
//                 localhost:8080/api/scorecountedcards/TwoOfClubs/13/AceOfHearts,ThreeOfClubs,FiveOfDiamonds,FourOfClubs
//
//  Note: this is a GET for /scorecountedcards just like above, it just has one more parameter 
//
router.get('/scorecountedcards/:playedcard/:currentCount/:countedcards/', function (req, res, next)
{

    var countedCards = [];
    countedCards = parseCards(req.params.countedcards, res);
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }
    var playedCard = cards.Deck[req.params.playedcard];
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }
    var currentCount = Number(req.params.currentCount);

    var tempCount = 0;
    for (var i = 0; i < countedCards.length; i++)
    {
        tempCount += countedCards[i].Value;
        if (tempCount > 31)
        {
            tempCount = countedCards[i].Value;
        }
    }

    if (tempCount != currentCount)
    {
        res.status(403).send('Count should be: ' + tempCount + ' not ' + currentCount);
        return next(403);
    }

    var standardResponse = scoring.scoreCountingCardsPlayed(countedCards, playedCard, currentCount);

    res.send(standardResponse);

});

//
//
//  returns a randomized hand of 13 cards.  calls random.org to get the random numbers.
//  uses the background radiation of the universe.  go figure. 
//  
//
//  URL examples:
//                 localhost:8080/api/getrandomhand/true
//
router.get('/getrandomhand/:isComputerCrib', function (req, res, next)
{
    let url = 'https://www.random.org/sequences/?min=0&max=51&col=1&format=plain&rnd=new';

    var respObj = {};

    request(url, function (error, response, body)
    {
        var nums = body.split('\n');
        let ret = getRandomHand(nums.splice(0, 13), true, JSON.parse(req.params.isComputerCrib), req, res, next);
        return res.send(JSON.stringify(ret));

    });


});
//
//
//  this passes back in a sequence that was probably returned by the other getrandomhand call so we 
//  can have repeatable results and debug when a hand is returned wrong.
//  
//
//  URL examples:
//                 localhost:8080/api/getrandomhand/true/46,17,10,35,43,44,1,38,14,3,7,50,19,15,2,48,8,25,13,6,42,40,27,28,21,36,33,26,51,16,32,9,12,4,45,37,30,49,47,34,5,20,11,22,0,39,18,24,29,41,23,31,
//
router.get('/getrandomhand/:isComputerCrib/:sequence', (req, res, next) =>
{
    let nums = req.params.sequence.split(",");
    let ret = getRandomHand(nums, false, JSON.parse(req.params.isComputerCrib), req, res, next);
    return res.send(JSON.stringify(ret));
});

function getRandomHand(nums, addSequence, isComputerCrib, req, res, next)
{
    var randomCards = [];
    let me = "player";  // from the perspective of the dealer
    let you = "computer";
    if (isComputerCrib)
    {
        me = "computer";
        you = "player";
    }
    let computerHand = [];
    for (let i = 0; i < 12; i += 2)
    {
        let youCard = cards.Deck[cards.CardNames[nums[i]]];     // get the random card     
        youCard.Owner = you;
        randomCards.unshift(youCard);                        // put it in the list of all cards at the 0th position
        let meCard = cards.Deck[cards.CardNames[nums[i + 1]]];  // the next one belongs to the other player, get the random card from the deck             
        meCard.Owner = me;
        randomCards.unshift(meCard);

        computerHand.push(isComputerCrib ? meCard : youCard); // need this hand to get the crib cards for the client

    }
    let card = cards.Deck[cards.CardNames[nums[12]]];
    let sharedCard = card;
    sharedCard.Owner = "shared";
    randomCards.unshift(sharedCard);
    let cribCards = SelectCards.selectCribCards(computerHand, isComputerCrib);
    let url = "";
    url = "http://" + req.hostname + ":" + req.connection.localPort + req.originalUrl;
    if (addSequence)
    {
        url += "/" + nums.map(n => n).toString();
    }
    return { RandomCards: randomCards, ComputerCribCards: cribCards, SharedCard: sharedCard, HisNobs: card.Ordinal === 11 ? true : false, RepeatUrl: url };

}

app.use('/api', router);
app.listen(port);
console.log('Listening on port...' + port);
cards.Init();



