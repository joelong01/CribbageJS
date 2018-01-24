// @ts-check
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var scoring = require('./Game/scoring');
var cards = require('./Game/card');
var SelectCards = require('./Game/selectcards');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



var port = process.env.port || 8080;
var router = express.Router();


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
//  URL examples:
//                 localhost:8080/api/getnextcountedcard/counted:/AceOfSpades,AceOfHearts,TwoOfClubs,TenOfDiamonds/0
//                 localhost:8080/api/getnextcountedcard/counted:AceOfSpades,ThreeOfClubs/AceOfHearts,TwoOfClubs,TenOfDiamonds/4
//                 localhost:8080/api/getnextcountedcard/counted:AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts/TenOfClubs,AceOfHearts/16
//                 localhost:8080/api/getnextcountedcard/counted:AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts,TenOfClubs,ThreeOfDiamonds/AceOfHearts/29
//
//  this "counted:" business is so that I can pass an empty list.
//  
//  i trim spaces, but Cards must be spelled correctly
//      
router.get('/getnextcountedcard/:countedcards/:cardsleft/:currentCount', function (req, res, next)
{
    var inputCardsAsCsv = req.params.countedcards.split(':')[1];
    var countedCards = [];
    if (inputCardsAsCsv != '')
    {
    //
    // first build up the array of played cards.  these store references to our deck
        countedCards = parseCards(inputCardsAsCsv, res);
        if (res.statusCode != 200)
        {
            return next(res.statusCode);
        }
    }

    //
    //  note that counted cards will be null the first time 

    var cardsLeft = parseCards(req.params.cardsleft);
    if (res.statusCode != 200)
    {
        return next(res.statusCode);
    }
    var currentCount = Number(req.params.currentCount);
    var ret = SelectCards.selectCountedCard(countedCards, cardsLeft, currentCount);
    res.send(ret);

});

//
//  URL examples:
//                 localhost:8080/api/scorecountedcards/counted:/AceOfSpades/0
//                 localhost:8080/api/scorecountedcards/counted:AceOfHearts/AceOfSpades/1
//                 localhost:8080/api/scorecountedcards/counted:AceOfHearts,AceOfSpades/AceOfClubs/2
//  this "counted:" business is so that I can pass an empty list.
//      
router.get('/scorecountedcards/:countedcards/:playedcard/:currentCount', function (req, res, next)
{
    var inputCardsAsCsv = req.params.countedcards.split(':')[1];
    var countedCards = [];
    if (inputCardsAsCsv != '')
    {
    //
    // first build up the array of played cards.  these store references to our deck
        countedCards = parseCards(inputCardsAsCsv, res);
    }

    //
    //  note that counted cards will be null the first time 

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


app.use('/api', router);
app.listen(port);
console.log('Listening on port...' + port);
cards.Init();



