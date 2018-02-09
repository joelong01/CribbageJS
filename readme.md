CribbageJS

this project implements a set of REST APIs that allow you to build a cribbage application.

Layout
<html>
<table>
+CribbageJS
    +Cribbage
        +Game
            card.js:        implements a simple card class.
            scoring.js:     implements all of the cribbage scoring (counting, hand, and crib)
            selectcard.js   implements the api to pick the crib or the next card to count
        server.js           implements the REST API
</table>
</html>
the response is (usually) a JSON object encapsulated in scoreing.js\StandardResponse.  it will return the score along with a list
that contains the reason for the score ("ScoreName"), the value of the score, and the list of cards that contributed the score. eg.

        "ScoreName": "Fifteen",
        "Score": 2,
        "Cards": [
            {
                "Ordinal": "Four",
                "Rank": 4,
                "Value": 4,
                "Suit": "Hearts"
            },
            {
                "Ordinal": "Five",
                "Rank": 5,
                "Value": 5,
                "Suit": "Hearts"
            },
            {
                "Ordinal": "Six",
                "Rank": 6,
                "Value": 6,
                "Suit": "Hearts"
            }
        ]

APIs
====

GET: /scorehand/:hand/:sharedcard/:isCrib
score the hand (or crib)
sample URLs:
            localhost:8080/api/scorehand/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds/FourOfDiamonds/false
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/false  (should be a flush)
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/true   (no flush - need 5 of same suit in crib)
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfHearts/true     (should be a flush)
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOFClubs/SixOfDiamonds/true     (bad card)
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOfClubs/SixOfDiamonds/true     (double double run with 15s - 24 points)


GET: /getcribcards/:hand/:isMyCrib

given 6 cards, return 2.  if isMyCrib is true, then optimize to make the hand + crib as big as possible
sample URLs:

                localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/false  
                localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/true   
                localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/true  
                localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/false  

sample return

GET /getnextcountedcard/:cardsleft/:currentCount
GET /getnextcountedcard/:cardsleft/:currentCount/:countedcards

URL example:
               localhost:8080/api/getnextcountedcard/AceOfSpades,AceOfHearts,TwoOfClubs,TenOfDiamonds/0
               localhost:8080/api/getnextcountedcard/AceOfSpades,ThreeOfClubs/4/AceOfHearts,TwoOfClubs,TenOfDiamonds
                localhost:8080/api/getnextcountedcard/TenOfClubs,AceOfHearts/16/AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts
                localhost:8080/api/getnextcountedcard/AceOfHearts/29/AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts,TenOfClubs,ThreeOfDiamonds

Note that the last parameters contains all the cards that have already been counted, which means it starts empty, so there are two routes.
I trim spaces, but Cards must be spelled correctly

GET /scorecountedcards/:playedcard/:currentCount
GET /scorecountedcards/:playedcard/:currentCount/:countedcards/

URL examples:
                localhost:8080/api/scorecountedcards/AceOfSpades/0
               localhost:8080/api/scorecountedcards/AceOfHearts/1/AceOfSpades
               localhost:8080/api/scorecountedcards/AceOfClubs/2/AceOfHearts,AceOfSpades
               localhost:8080/api/scorecountedcards/TwoOfClubs/13/AceOfHearts,ThreeOfClubs,FiveOfDiamonds,FourOfClubs




    
