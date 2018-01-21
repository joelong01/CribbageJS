var express = require('express');
var bodyParser = require('body-parser');
var cards = require('./models/card');
var scoring = require('./cribbage');
var app = express();

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
  res.send(JSON.stringify(cards.Cards));
});

router.get('/card/:name', function (req, res)
{
  var card = cards.Cards[req.params.name];
  res.send(JSON.stringify(card));
});

router.get('/scorecountedcards/:countedcards/:playedcard/:currentCount', function (req, res, next)
{

  var playedCardNames = req.params.countedcards.split(",");
  var countedCards = [];
 //
 // first build up the array of played cards.  these store references to our deck
  for (var i=0; i<playedCardNames.length; i++)
  {
    var card = cards.Cards[playedCardNames[i]];
    if (card != null)
    {
      countedCards.push(card);
    }
    else
    {      
      res.status(404).send("Bad Card: " + playedCardNames[i]);
      return next(404);
          
    }    
  }

  var playedCard = cards.Cards[req.params.playedcard];
  var currentCount = Number(req.params.currentCount);

  var tempCount = 0;
  for (var i =0; i<countedCards.length; i++)
  {
      tempCount += countedCards[i].Value;
      if (tempCount > 31)
      {
        tempCount = countedCards[i].Value;
      }
  }

  if (tempCount != currentCount)
  {
    res.status(403).send("Count should be: " + tempCount + " not " + currentCount);
    return next(403);
  }

  var standardResponse = scoring.scoreCountingCardsPlayed(countedCards, playedCard, currentCount);
  
  res.send(standardResponse);
  
});

/* router.post('/cities', function (req, res) {
  var city = req.body;
  console.log(city);
  for (var index = 0; index < cities.length; index++) {
    if (cities[index].name === city.name) {
      res.status(409).send({ error: "City " + city.name + " already exists" });
      return;
    }
  }

  cities.push(city);
  res.send(cities);
});

router.put('/cities/:name', function (request, response) {
  var city = request.body;
  console.log(city);
  for (var index = 0; index < cities.length; index++) {
    if (cities[index].name === request.params.name) {
      cities[index].country = city.country;
      response.send(cities);
      return;
    }
  }

  response.status(404).send({ error: 'City not found' });
});
 */
app.use('/api', router);
app.listen(port);
console.log("Listening on port..." + port);
cards.Init();

function newFunction()
{
  var enumSuit = new Enum(['Clubs', 'Diamonds', 'Hearts', 'Spades'], { freeze: true });
  return enumSuit;
}

