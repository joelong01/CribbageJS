// @ts-check

/*****************************************************/
/*
    APIs to select cards for callers.  
    selectCribCards(hand, isCrib): return 2 cards from the hand that get passed to the crib
    selectCountedCard(playedCards, uncountedCards, currentCount) gets the best card to count
*/
/*****************************************************/

var Combinatorics = require('js-combinatorics');
var CardScoring = require('./scoring');
var GlobalHelpers = require('./globalhelpers');

//
//  only export 2 APIs from this file
exports.selectCribCards = selectCribCards;
exports.selectCountedCard = selectCountedCard;

function selectCribCards(hand, isMyCrib)
{
    var potentialHands;
    potentialHands = Combinatorics.combination(hand, 4);
    var maxCrib = [];
    var maxScore = -1000.0;
 
    //
    //  go through each of the 16 combinations looking for the hand
    //  that will perform best based on the value of the hand plus
    //  or minus the value of the crib
    //
    for (var index = 0; index < potentialHands.length; index++)
    {
        var cards = potentialHands.next();
        var score = CardScoring.scoreHand(cards, null, false).Score;
        var crib = getCribCards(hand, cards);
        var expectedValue = 0.0;
        if (isMyCrib) //add the points to me because it is my crib
        {
            expectedValue = CardScoring.getCardValueToMyCrib(crib[0].Rank - 1, crib[1].Rank - 1);
            if (crib[0].Suit.value === crib[1].Suit.value) expectedValue += .01;
       //     console.log ("crib: %s\t\thand value: %s\t crib value: %s", crib.map(card => card.cardName).toString(), score, expectedValue);
            score = score + expectedValue;
        }
        else // subtract from my score because the other guy gets the points
        {
            expectedValue = CardScoring.getCardValueToYourCrib(crib[0].Rank - 1, crib[1].Rank - 1);            
            if (crib[0].Suit.value === crib[1].Suit.value) expectedValue += .01;
     //       console.log ("crib: %s\t\thand value: %s\t crib value: %s", crib.map(card => card.cardName).toString(), score, expectedValue);
            score = score - expectedValue;
            
        }     

        
        
        if (score > maxScore)
        {
            
            maxScore = score;
            maxCrib = crib;
        }
    }

//    console.log ("\nmax crib: %s\t\ttotal value: %s", maxCrib.map(card => card.cardName).toString(), maxScore);

    return maxCrib;
}
/*
//  hand has 6 cards and is passed in by the client
//  heldCards has 4 cards and is generated via permutation
//  this returns the 2 cards that are in the hand but not the crib
*/
function getCribCards(hand, heldCards)
{
    var sendToCrib = [];
    for (var i = 0; i < 6; i++)
    {
        if (GlobalHelpers.arrayContainsCard(heldCards, hand[i]))
        {
            continue;
        }
        else
        {
            sendToCrib.push(hand[i]);
        }
    }
    return sendToCrib;
}

//
// countedCards: an array of cards that have already been counted
// cardsLeft: choose one of these
// currentCount = the sum of countedCards.Value
function selectCountedCard(countedCards, cardsLeft, currentCount)
{
    var maxScore = -1;
    var maxCard = null;
    var score = 0;
    
    //
    //  if you only have one card, return it if you can
    if (cardsLeft.length == 1)
    {
        if (cardsLeft[0].Value + currentCount <= 31)
        {
            return cardsLeft[0];
        }
        else
        {
            return null;
        }
    }
    cardsLeft.sort(function (x, y)
    {
        return x.Rank - y.Rank;
    });

    //
    //  see which card we can play that gives us the most points
    for (var i = 0; i < cardsLeft.length; i++)    
    {
        var card = cardsLeft[i];
        if (card.Value + currentCount > 31)
        {
            continue;
        }
        
        score = CardScoring.scoreCountingCardsPlayed(countedCards, card, currentCount).Score; // scoreCountingCardsPlayed returns a StandardResponse
        if (score > maxScore)
        {
            maxScore = score;
            maxCard = card;
        }
    }

    if (maxScore == -1)
    {
        return null; // we have no valid card to play
    }

    if (maxScore == 0) // there isn't a card for us to play that generates points
    {
        //
        //  play a card that we have a pair so we can get 3 of a kind - as long as it isn't a 5 and the 3 of a kind makes > 31
        //

        for (let i = 0; i < cardsLeft.length - 1; i++)
        {
            //  dont' do it if it will force us over 31
            if (cardsLeft[i].Value * 3 + currentCount > 31) // *3 because I'll play it, then you'll play it, then I'll play the third for 3 of a kind
            {
                continue;
            }

            if (cardsLeft[i].Value == cardsLeft[i + 1].Value)
            {
                if (cardsLeft[i].Value != 5) // if we have a pair of 5's, pick another card, otherwise play one of the pair
                {
                    cardsLeft[i];
                }
            }
        }

        //
        //  try to play a card that will create a run

        var combinations =  Combinatorics.combination(cardsLeft, 2); // at most 6 of these: 4 choose 2
        for (var index = 0; index < combinations.length; index++)
        {
            var cards = combinations.next();

            var diff = Math.abs(cards[0].CardOrdinal - cards[1].CardOrdinal);
            if (diff == 1) // they are consecutive
            {
                var val = cards[0].Value + cards[1].Value;
                if (val + currentCount > 31)
                {
                    continue;
                }
                //
                //  sorted
                if (cards[0].Ordinal > 1) // this is a port and I'm not sure why this if is here....
                {
                    //
                    //  this means we have somehing like 3 and 4 in our hand.  if we play 7 and they play 6, we can play the 8
                    if (val + currentCount + cards[0].Value - 1 <= 31)
                    {
                        if (cards[0].Value != 5)
                        {
                            cards[0];
                        }
                        else
                        {
                            cards[1];
                        }
                    }
                }
                else
                {
                    var highCardVal = cards[1].Value;
                    
                    if (val + currentCount + highCardVal <= 31)
                    {
                        if (cards[0].Value != 5)
                        {
                            return cards[0];
                        }
                        else
                        {
                            return cards[1];
                        }
                    }
                }
            }

            
        }

        //
        //  make the right choice if assuming they'll play a 10
        //
        combinations = Combinatorics.combination(cardsLeft, 2); // at most 6 of these: 4 choose 2
        for (let index = 0; index < combinations.length; index++)
        {
            let cards = combinations.next();
            var sum = cards[0].Value + cards[1].Value;
            if (sum + currentCount == 5) // i'll 15 them if they play a 10
            {
                return cards[1];
            }

            if (sum + currentCount == 21) // i'll 31 them if they play a 10
            {
                return cards[1];
            }
        }
    }

    if (maxCard.Value == 5)
    {
        for (let card of cardsLeft)    
        {            
            if (card.Value != 5 && card.Value + currentCount <= 31)
            {
                maxCard = card;
                break;
            }
        }
    }

    return maxCard;

}


