
var Enum = require('enum');
var Helpers = require('./globalhelpers');

//
// all the different ways you can score in cribbage
var ScoreName = new Enum(
    {
    "Fifteen": 0, 
    "Run": 1,
    "Pair": 2,
    "ThreeOfaKind": 3,
    "FourOfAKind": 4,
    "HisNibs": 5,
    "HisNobs": 6,
    "CountedRun": 7,
    "ThirtyOne": 8,
    "Go": 9,
    "Flush": 10,
    "LastCard": 11,
    "None" : 12
}, { freez: true });

//
//  we'll have a Array of scores we return to the client, each with why the score (name) and the value (score)
var Score = function Score(name, score, playedCards, card)
{   
    this.ScoreName = name;
    this.Score = score;
          
    this.Cards = [];
    if (playedCards.constructor === Array)
    {
        this.Cards = playedCards.slice(0);
    }
    else
    {
        this.Cards.push(playedCards);
    }
    if (card != null)
    {
        this.Cards.push(card);
    }
};


//
//  the object I will return from (most?  all?) REST API calls
//
//  Score:  the new score (sometimes set to NaN if the api doesn't modify it)
//  Cards:  the list of cards relevent for the call (sometimes empty)
//  
function StandardResponse(score, scoreInfoList)
{
    this.Score = score;
    this.ScoreInfo = scoreInfoList.slice(0);

};

function NoScoreResponse()
{
    var score = new Score(ScoreName.None, 0, [], null);
    return new StandardResponse(0, [] = [score]);
}


//
//  countedCards: list of cards that have already been counted
//  card: the card just played
//  currentCount: the sum of the values of countedCards
//

function scoreCountingCardsPlayed(countedCards, card, currentCount)
{
    var localScore = 0;

    var scoreObjs = [];

    if (!Array.isArray(countedCards) && countedCards != null) return null;

    currentCount += card.Value;
    if (currentCount == 15)
    {
        let score = new Score(ScoreName.Fifteen, 2, countedCards, card);
        scoreObjs.push(score);
        localScore += 2;
    }
    if (currentCount == 31)
    {
        let score = new Score(ScoreName.ThirtyOne, 2, countedCards, card);
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
            if (!Helpers.arrayContainsCard(tempList, allCards[i]))
            {
                tempList.push(allCards[i]);
            }
            if (!Helpers.arrayContainsCard(tempList, allCards[i - 1])) 
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
        score = new Score(ScoreName.Pair, 2, tempList, null);
        scoreObjs.push(score);
        break;
    case 2: // 3 of a kind
        score = new Score(ScoreName.ThreeOfaKind, 6, tempList, null);
        scoreObjs.push(score);
        localScore += 6;
        break;
    case 3: // 4 of a kind
        score = new Score(ScoreName.FourOfAKind, 12, tempList, null);
        scoreObjs.push(score);
        localScore += 12;
        break;
    default:
        break;
    }

    var score = ScoreCountedRun(allCards);
    if (score != null)
    {
        if (score.Score != 0)
        {
            localScore += score.Score;
            scoreObjs.push(score);
        }
    }
    var standardResponse = new StandardResponse(localScore, scoreObjs);
    return standardResponse;
}

function ScoreCountedRun(playedCards) // played cards is an array of cards that have been played.  
{
    if (!Array.isArray(playedCards)) return null;
    var n = 3;
    var count = playedCards.length;
    var score = 0;
    if (count <= 2) return null;
    var cards = [];    
    var longestRun = 0;
    do
    {
        cards = [];
        //
        //  add the last n cards ... starting with 3
        let i = 0;
        for (i = 0; i < n; i++)
        {
            cards.push(playedCards[count - i - 1]);
        }
        //
        //  sort them
        cards.sort(function (x, y)
        {
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
    for (let i = 0; i < score; i++)
    {
        cardList.push(playedCards[count - i - 1]);
    }

    return new Score(ScoreName.CountedRun, score, cardList, null);

}

//
//  expect card1 and card2 to be numbers
function getCardValueToMyCrib(rank1, rank2)
{

    var aceDrop = [5.38, 4.23, 4.52, 5.43, 5.45, 3.85, 3.85, 3.80, 3.40, 3.42, 3.65, 3.42, 3.41];
    var twoDrop = [4.23, 5.72, 7.00, 4.52, 5.45, 3.93, 3.81, 3.66, 3.71, 3.55, 3.84, 3.58, 3.52];
    var threeDrop = [4.52, 7.00, 5.94, 4.91, 5.97, 3.81, 3.58, 3.92, 3.78, 3.57, 3.90, 3.59, 3.67];
    var fourDrop = [5.43, 4.52, 4.91, 5.63, 6.48, 3.85, 3.72, 3.83, 3.72, 3.59, 3.88, 3.59, 3.60];
    var fiveDrop = [5.45, 5.45, 5.97, 6.48, 8.79, 6.63, 6.01, 5.48, 5.43, 6.66, 7.00, 6.63, 6.66];
    var sixDrop = [3.85, 3.93, 3.81, 3.85, 6.63, 5.76, 4.98, 4.63, 5.13, 3.17, 3.41, 3.23, 3.13];
    var sevenDrop = [3.85, 3.81, 3.58, 3.72, 6.01, 4.98, 5.92, 6.53, 4.04, 3.23, 3.53, 3.23, 3.26];
    var eightDrop = [3.80, 3.66, 3.92, 3.83, 5.48, 4.63, 6.53, 5.45, 4.72, 3.80, 3.52, 3.19, 3.16];
    var nineDrop = [3.40, 3.71, 3.78, 3.72, 5.43, 5.13, 4.04, 4.72, 5.16, 4.29, 3.97, 2.99, 3.06];
    var tenDrop = [3.42, 3.55, 3.57, 3.59, 6.66, 3.17, 3.23, 3.80, 4.29, 4.76, 4.61, 3.31, 2.84];
    var jackDrop = [3.65, 3.84, 3.90, 3.88, 7.00, 3.41, 3.53, 3.52, 3.97, 4.61, 5.33, 4.81, 3.96];
    var queenDrop = [3.42, 3.58, 3.59, 3.59, 6.63, 3.23, 3.23, 3.19, 2.99, 3.31, 4.81, 4.79, 3.46];
    var kingDrop = [3.41, 3.52, 3.67, 3.60, 6.66, 3.13, 3.26, 3.16, 3.06, 2.84, 3.96, 3.46, 4.58];

    var dropTable = [];
    dropTable.push(aceDrop);
    dropTable.push(twoDrop);
    dropTable.push(threeDrop);
    dropTable.push(fourDrop);
    dropTable.push(fiveDrop);
    dropTable.push(sixDrop);
    dropTable.push(sevenDrop);
    dropTable.push(eightDrop);
    dropTable.push(nineDrop);
    dropTable.push(tenDrop);
    dropTable.push(jackDrop);
    dropTable.push(queenDrop);
    dropTable.push(kingDrop);

    return dropTable[rank1][rank2];

}

function getCardValueToYourCrib(rank1, rank2)
{
    var aceDrop = [6.02, 5.07, 5.07, 5.72, 6.01, 4.91, 4.89, 4.85, 4.55, 4.48, 4.68, 4.33, 4.30];
    var twoDrop = [5.07, 6.38, 7.33, 5.33, 6.11, 4.97, 4.97, 4.94, 4.70, 4.59, 4.81, 4.56, 4.45];
    var threeDrop = [5.07, 7.33, 6.68, 5.96, 6.78, 4.87, 5.01, 5.05, 4.87, 4.63, 4.86, 4.59, 4.48];
    var fourDrop = [5.72, 5.33, 5.96, 6.53, 7.26, 5.34, 4.88, 4.94, 4.68, 4.53, 4.85, 4.46, 4.36];
    var fiveDrop = [6.01, 6.11, 6.78, 7.26, 9.37, 7.47, 7.00, 6.30, 6.15, 7.41, 7.76, 7.34, 7.25];
    var sixDrop = [4.91, 4.97, 4.87, 5.34, 7.47, 7.08, 6.42, 5.86, 6.26, 4.31, 4.57, 4.22, 4.14];
    var sevenDrop = [4.89, 4.97, 5.01, 4.88, 7.00, 6.42, 7.14, 7.63, 5.26, 4.31, 4.68, 4.32, 4.27];
    var eightDrop = [4.85, 4.94, 5.05, 4.94, 6.30, 5.86, 7.63, 6.82, 5.83, 5.10, 4.59, 4.31, 4.20];
    var nineDrop = [4.55, 4.70, 4.87, 4.68, 6.15, 6.26, 5.26, 5.83, 6.39, 5.43, 4.96, 4.11, 4.03];
    var tenDrop = [4.48, 4.59, 4.63, 4.53, 7.41, 4.31, 4.31, 5.10, 5.43, 6.08, 5.63, 4.61, 3.88];
    var jackDrop = [4.68, 4.81, 4.86, 4.85, 7.76, 4.57, 4.68, 4.59, 4.96, 5.63, 6.42, 5.46, 4.77];
    var queenDrop = [4.33, 4.56, 4.59, 4.46, 7.34, 4.22, 4.32, 4.31, 4.11, 4.61, 5.46, 5.79, 4.49];
    var kingDrop = [4.30, 4.45, 4.48, 4.36, 7.25, 4.14, 4.27, 4.20, 4.03, 3.88, 4.77, 4.49, 5.65];

    var dropTable = [];
    dropTable.push(aceDrop);
    dropTable.push(twoDrop);
    dropTable.push(threeDrop);
    dropTable.push(fourDrop);
    dropTable.push(fiveDrop);
    dropTable.push(sixDrop);
    dropTable.push(sevenDrop);
    dropTable.push(eightDrop);
    dropTable.push(nineDrop);
    dropTable.push(tenDrop);
    dropTable.push(jackDrop);
    dropTable.push(queenDrop);
    dropTable.push(kingDrop);

    return dropTable[rank1][rank2];
}

//
//  hand - an array of cards (4 of them)
//  sharedCard - 1 card
//  isCrib - Crib or Hand
function scoreHand(hand, sharedCard, isCrib)
{
    var localScore = 0;
    var scoreList = [];
    var score = scoreNibs(hand, sharedCard); // this is the only one where it matters which particular card is shared
    if (score != null)
    {
        scoreList.push(score);
        localScore += 1;
    }

    //
    //   DON't SORT BEFORE NIBS!!!
    var cards = [];
    cards = hand.slice(0);
    if (sharedCard != null) // sharedCard null when calculating value of hand prior to seeing the shared card
    {
        cards.push(sharedCard);
    }

    cards.sort(function (x, y)
    {
        return x.Rank - y.Rank;
    });

    var scores = scoreFifteens(cards);
    if (scores.Score > 0)
    {
        scoreList.push(scores.ScoreInfo.slice(0));
        localScore += scores.Score;
    }

    scores = scorePairs(cards);
    if (scores.Score > 0)
    {
        scoreList.push(scores.ScoreInfo.slice(0));
        localScore += scores.Score;
    }

    scores = scoreRuns(cards);
    if (scores.Score > 0)
    {
        scoreList.push(scores.ScoreInfo.slice(0));
        localScore += scores.Score;
    }

    scores = scoreFlush(cards, isCrib);
    if (scores != null)
    {
        scoreList.push(scores.ScoreInfo.slice(0));
        localScore += scores.Score;
    }


    var standardResponse = new StandardResponse(localScore, scoreList);
    return standardResponse;

}
function scoreFlush(hand, isCrib)
{
    hand.sort(function (card1, card2)
    {
        return (card1.Suit.value - card2.Suit.value);
    });
    var max = 0;
    var run = 1;
    for (var i = 0; i < hand.length - 1; i++)
    {
        if (hand[i].Suit == hand[i + 1].Suit)
        {
            run++;
        }
        else
        {
            if (run > max)
            {
                max = run;
            }

            run = 1;
        }
    }

    if (run > max)
    {
        max = run;
    }

    if (max < 4) return null;

    if (isCrib && max < 5)
    {

        return null;

    }

    var flushCards = [];
    for (let i = 0; i < max; i++)
    {
        flushCards.push(hand[i]);
    }
    var score = new Score(ScoreName.Flush, max, flushCards);
    var scoreList = [];
    scoreList.push(score);
    var standardResponse = new StandardResponse(max, scoreList);
    return standardResponse;
}

function scoreRuns(hand)
{
    var cardLists = DemuxPairs(hand);

    var runs = [];
    for (var i = 0; i < cardLists.length; i++)
    {
        var cards = cardLists[i];
        var l = getRuns(cards);
        if (l !== null && l.length > 0)
        {
            runs.push(l);
        }
    }

    //
    //  eliminate duplicate lists - this happens if you have a hand that looks like 5, 5, 7, 8, 9 where the pair is not in the run
    if (runs.length == 2)
    {
        if (runs[0].length == runs[1].length) // same length
        {
            var same = false;
            for (let i = 0; i < runs[0].length; i++)
            {
                if (runs[0][i] != runs[1][i])
                {
                    same = false;
                    break;
                }

                same = true;
            }

            if (same)
            {
                runs.pop();
            }
        }
    }


    //
    //  runs now how the list of cards that have runs in them
    var localScore = 0;
    var scoreList = [];
    var len = runs.length;
    for (let i = 0; i < len; i++)
    {
        let cards = runs[i];
        if (cards.length > 2)
        {
            let score = new Score(ScoreName.Run, cards.length, cards, null);
            scoreList.push(score);
            localScore += cards.length;

        }
    }

    var standardResponse = new StandardResponse(localScore, scoreList);
    return standardResponse;

}

function getRuns(list)
{
    var count = list.length;
    if (count < 3)
    {
        return null;
    }

    if (Is3CardRun(list[0], list[1], list[2]))
    {
        if (count > 3 && list[2].Rank == list[3].Rank - 1)
        {
            if (count > 4 && list[3].Rank == list[4].Rank - 1)
            {
                return list.splice(0); // 5 card run
            }

            if (count > 4)
            {
                list.splice(4, 1); // list.RemoveAt(4)                
            }

            return list.splice(0); // 4 card run
        }
        else
        {
            if (count > 4)
            {
                list.splice(4, 1); //list.RemoveAt(4);
            }

            if (count > 3)
            {
                list.splice(3, 1); // list.RemoveAt(3);
            }

            return list.splice(0); // 3 card run
        }
    }

    if (count > 3 && Is3CardRun(list[1], list[2], list[3]))
    {
        if (count > 4 && list[3].Rank == list[4].Rank - 1)
        {
            list.splice(0, 1);
            return list.splice(0); // 4 card run
        }
        else
        {
            if (count > 4)
            {
                list.splice(4, 1); //list.RemoveAt(4);
            }

            if (count > 3)
            {
                list.splice(0, 1); //list.RemoveAt(0);
            }

            return list.splice(0); // 3 card run
        }
    }

    if (count > 4 && Is3CardRun(list[2], list[3], list[4]))
    {
        list.splice(1, 1);
        list.splice(0, 1);
        return list.splice; // 3 card run
    }

    return null;
}

function scorePairs(hand)
{
    var retList = [[]];
    for (var i = 0; i < hand.length; i++)
    {
        var cardList = [hand[i]];
        for (var j = i + 1; j < hand.length; j++)
        {
            if (hand[i].Rank == hand[j].Rank)
            {
                cardList.push(hand[j]);
            }
        }
        if (cardList.length != 1) retList.push(cardList);
        i += cardList.length - 1;
    }

    var score = 0;
    var scoreList = [];
    for (let i = 0; i < retList.length; i++)    
    {
        var lst = retList[i];
        if (lst.length == 0) continue;
        switch (lst.length)
        {
        case 4:
            scoreList.push(new Score(ScoreName.FourOfAKind, 12, lst, null));
            score += 12;
            break;
        case 3:
            scoreList.push(new Score(ScoreName.ThreeOfaKind, 6, lst, null));
            score += 6;
            break;
        case 2:
            scoreList.push(new Score(ScoreName.Pair, 2, lst, null));
            score += 2;
            break;
        default:
            console.log("Bug in score pairs!");
        }
    }

    var ret = new StandardResponse(score, scoreList);
    return ret;
}

function scoreNibs(hand, sharedCard)
{
    
    if (sharedCard != null)
    {
        for (var i = 0; i < 4; i++)
        {
            if (hand[i].Rank == 11) //Jack -- 1 indexed
            {
                if (hand[i].Suit.key == sharedCard.Suit.key)
                {
                    var scoringCards =
                        [
                            hand[i], sharedCard
                        ];
                    var score = new Score(ScoreName.HisNibs, 1, scoringCards, null);
                    return score;

                }
            }
        }
    }

    return null;
}
function scoreFifteens(cards)
{
    var localScore = 0;
    var scoreList = [];
    for (var i = 0; i < cards.length; i++)
    {
        var iVal = cards[i].Value;
        for (var j = i + 1; j < cards.length; j++)
        {
            var ijVal = cards[j].Value + iVal;
            if (ijVal > 15)
            {
                break; //because we are ordered;
            }

            if (ijVal == 15)
            {
                localScore += 2;
                let scoringCards =
                    [
                        cards[i], cards[j]
                    ];
                let score = new Score(ScoreName.Fifteen, 2, scoringCards, null);
                scoreList.push(score);
            }
            else
            {
                for (let k = j + 1; k < cards.length; k++)
                {
                    let ijkVal = cards[k].Value + ijVal;
                    if (ijkVal > 15)
                    {
                        break;
                    }

                    if (ijkVal == 15)
                    {
                        let scoringCards =
                            [
                                cards[i],
                                cards[j],
                                cards[k]
                            ];
                        let score = new Score(ScoreName.Fifteen, 2, scoringCards, null);
                        scoreList.push(score);
                        localScore += 2;
                    }
                    else
                    {
                        for (let x = k + 1; x < cards.length; x++)
                        {
                            let ijkxVal = cards[x].Value + ijkVal;
                            if (ijkxVal > 15)
                            {
                                break;
                            }

                            if (ijkxVal == 15)
                            {
                                let scoringCards =
                                    [
                                        cards[i],
                                        cards[j],
                                        cards[k],
                                        cards[x]
                                    ];
                                let score = new Score(ScoreName.Fifteen, 2, scoringCards, null);
                                scoreList.push(score);
                                localScore += 2;
                            }

                            if (cards.length != 5) continue;

                            let sumAll = ijkVal + cards[3].Value + cards[4].Value;
                            if (sumAll == 15) // takes all 5...
                            {

                                let score = new Score(ScoreName.Fifteen, 2, cards, null);
                                scoreList.push(score);
                                localScore += 2;
                            }

                            if (sumAll < 15) // not enough points to get to 15 with all 5 cards
                            {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    var ret = new StandardResponse(localScore, scoreList);

    return ret;
}
//
//  given an list of cards like 4s,5c,5d,6s,6d build a list like
//
//      cardList[0]=4s5c6s
//      cardList[1]=4s5c6d
//      cardList[1]=4s5d6s
//      cardList[1]=4s5d6d
//
//
function DemuxPairs(list)
{
    var cardList = []; // an array that contains arrays of dumux'd cards

    var previousCard = null;
    var consecutive = 0;
    var pairs = 0;
    for (let i = 0; i < list.length; i++)
    {
        var thisCard = list[i];

        if (previousCard == null)
        {
            let templist = [];
            templist.push(thisCard);
            cardList.push(templist);
        }
        else if (previousCard.Rank != thisCard.Rank) // not a pair, add to all of the lists we are maintaining
        {
            consecutive = 0;
            for (let j = 0; j < cardList.length; j++)
            {
                cardList[j].push(thisCard);
            }
        }
        else if (previousCard.Rank == thisCard.Rank) // pair
        {
            consecutive++;
            pairs++;

            if (consecutive == 1 && pairs == 1 || consecutive == 2 && pairs == 2)
            {
                let count = cardList.length;
                let newList = cardList[count - 1].slice(0);
                cardList.push(newList);
                newList.pop(previousCard);
                newList.push(thisCard);
            }
            else if (consecutive == 1 && pairs == 2)
            {
                for (let k = 0; k < 2; k++)
                {
                    let newList = cardList[k].slice(0);
                    newList.pop(previousCard);
                    newList.push(thisCard);
                    cardList.push(newList);
                }
            }
        }

        previousCard = thisCard;
    }

    return cardList;
}

function Is3CardRun(card1, card2, card3)
{
    if (card1.Rank == card2.Rank - 1 &&
        card2.Rank == card3.Rank - 1)
    {
        return true;
    }

    return false;
}

exports.scoreHand = scoreHand;
exports.getCardValueToMyCrib = getCardValueToMyCrib;
exports.getCardValueToYourCrib = getCardValueToYourCrib;
exports.ScoreName = ScoreName;
exports.StandardResponse = StandardResponse;
exports.scoreCountingCardsPlayed = scoreCountingCardsPlayed;
exports.Score = Score;
exports.NoScoreResponse = NoScoreResponse;

