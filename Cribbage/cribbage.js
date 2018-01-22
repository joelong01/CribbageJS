/*

    this file contains very specific cribbage 
    1. The enums used in Cribbage
    2. the scoring 
    3. card selection
    
*/
var Enum = require('enum');

//
// all the different ways you can score in cribbage
var ScoreName = new Enum(
    {
        'Fifteen': 0,
        'Run': 1,
        'Pair': 2,
        'ThreeOfaKind': 3,
        'FourOfAKind': 4,
        'HisNibs': 5,
        'HisNobs': 6,
        'CountedRun': 7,
        'ThirtyOne': 8,
        'Go': 9,
        'Flush': 10,
        'LastCard': 11
    }, { freez: true });

exports.ScoreName = ScoreName;

//
//  we'll have a Array of scores we return to the client, each with why the score (name) and the value (score)
var Score = function Score(name, score, playedCards, card)
{
    this.ScoreName = name;
    this.Score = score;
    this.Cards = playedCards.slice(0);
    this.Cards.push(card);
};
exports.Score = Score;

//
//  the object I will return from (most?  all?) REST API calls
//
//  Score:  the new socre (sometimes set to NaN if the api doesn't modify it)
//  Cards:  the list of cards relevent for the call (sometimes empty)
//  
var StandardScoringResponse = function StandardResponse(score, scoreInfoList)
{
    this.Score = score;
    this.ScoreInfo = scoreInfoList.slice(0);

};

exports.StandardResponse = StandardScoringResponse;


var cards = require('./models/card');

//
//  countedCards: list of cards that have already been counted
//  card: the card just played
//  currentCount: the sum of the values of countedCards
//
exports.scoreCountingCardsPlayed = scoreCountingCardsPlayed;
function scoreCountingCardsPlayed(countedCards, card, currentCount)
{
    var localScore = 0;

    var scoreObjs = [];

    if (!Array.isArray(countedCards)) return "";

    currentCount += card.Value;
    if (currentCount == 15)
    {
        var score = new Score(ScoreName.Fifteen, 2, countedCards, card);
        scoreObjs.push(score);
        localScore += 2;
    }
    if (currentCount == 31)
    {
        var score = new Score(ScoreName.ThirtyOne, 2, countedCards, card);
        scoreObjs.push(score);
        localScore += 2;
    }


    var allCards = countedCards.concat(card);

    var tempList = [];
    var samenessCount = 0;
    for (var i = allCards.length - 1; i > 0; i--) 
    {
        if (allCards[i].Rank == allCards[i - 1].Rank) 
        {
            if (!arrayContainsCard(tempList, allCards[i]))
            {
                tempList.push(allCards[i]);
            }
            if (!arrayContainsCard(tempList, allCards[i - 1])) 
            {
                tempList.push(allCards[i - 1]);
            }

            samenessCount++;
        }
        else 
        {
            break;
        }
    }

    switch (samenessCount)
    {
        case 1: // pair            
            localScore += 2;
            var score = new Score(ScoreName.Pair, 2, tempList, null);
            scoreObjs.push(score);
            break;
        case 2: // 3 of a kind
            var score = new Score(ScoreName.ThreeOfaKind, 6, tempList, null);
            scoreObjs.push(score);
            localScore += 6;
            break;
        case 3: // 4 of a kind
            var score = new Score(ScoreName.FourOfAKind, 12, tempList, null);
            scoreObjs.push(score);
            localScore += 12;
            break;
        default:
            break;
    }

    var score = ScoreCountedRun(allCards);
    if (score.Score != 0)
    {
        scoreObjs.push(score);
    }
    var standardResponse = new StandardScoringResponse(localScore, scoreObjs);
    return standardResponse;
}

function ScoreCountedRun(playedCards) // played cards is an array of cards that have been played.  
{
    if (!Array.isArray(playedCards)) return "";

    var n = 3;
    var count = playedCards.length;
    var score = 0;

    if (count <= 2) return 0;

    var cards = [];
    var retList = [];
    var longestRun = 0;
    do
    {
        cards = [];
        //
        //  add the last n cards ... starting with 3
        var i = 0;
        for (i = 0; i < n; i++)
        {
            cards.push(playedCards[count - i - 1]);
        }
        //
        //  sort them
        cards.sort(function (x, y)
        {
            if (x == null)
            {
                if (y == null)
                {
                    return 0;
                }
                else
                {
                    return -1;
                }
            }

            // If x is not null...
            // 
            if (y == null)
            {
                // ...and y is null, x is greater.
                return 1;
            }

            return x.Rank - y.Rank;
        });

        //
        //  check to see if they are in order
        for (i = 0; i < n - 1; i++)
        {
            if (cards[i].Rank != cards[i + 1].Rank - 1)
            {
                break;
            }
        }

        if (i >= n - 1)
        {
            longestRun = i;
        }
        //
        //  if we have enough cards, look for the next longest run
        n++;
    } while (n <= playedCards.length);

    if (longestRun > 1)
    {
        score += longestRun + 1;
    }

    var cardList = [];
    for (var i = 0; i < score; i++)
    {
        cardList.push(playedCards[count - i - 1]);
    }

    return new Score(ScoreName.CountedRun, score, cardList, null);

}
//
//  this function looks to see if we have exactly the same object in the array -- NOT the values
function arrayContainsCard(a, card)
{

    for (var i = 0; i < a.length; i++)
    {
        if (a[i] === card)
            return true;
    }
    return false;

}

