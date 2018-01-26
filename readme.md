CribbageJS

this project implements a set of REST APIs that allow you to build a cribbage application.  Cards are spelled as NameOfSuit (e.g. AceOfSpades or KingOfClubs).
Card names are trimmed, but CaseSensitive.  


Layout
-------
- CribbageJS
    - Cribbage
        - Game
            - card.js:        implements a simple card class.
            - scoring.js:     implements all of the cribbage scoring (counting, hand, and crib)
            - selectcard.js   implements the api to pick the crib or the next card to count
        - server.js           implements the REST API

Response
---------
The response is (usually) a JSON object encapsulated in scoreing.js\StandardResponse.  it will return the score along with a list
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

if you send a bad card, the service returns a 404 with something that looks like

    Bad Card: FourOFClubs
    
eg the mispelled card ('OF' instead of 'Of')

APIs
====

GET: /allcards
--------------

returns all the cards in JSON format.  Useful to build a deck and send back the exact right values to the service to make all the 
other APIs work.

sample URL:

     localhost:8080/api/allcards
     
return sample:{ "AceOfClubs": { "Ordinal": "Ace", "Rank": 1, "Value": 1, "Suit": "Clubs" }, "AceOfDiamonds": { "Ordinal": "Ace", "Rank": 1, "Value": 1, "Suit": "Diamonds" } } ...
        


     

GET: /scorehand/:hand/:sharedcard/:isCrib
-----------------------------------------

**score the hand (or crib)**

    hand:       CSV List of Cards in the hand.  it shoudl be 4 cards
    sharedCard  One card that represents the cut card
    isCrib      a boolean (parsed with JSON) indicating if crib scoring rules should be used

sample URLs:

            localhost:8080/api/scorehand/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds/FourOfDiamonds/false
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/false  
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfDiamonds/true   
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,SevenOfHearts,EightOfHearts/NineOfHearts/true     
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOFClubs/SixOfDiamonds/true     
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOfClubs/SixOfDiamonds/true
            localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,KingOfSpades,EightOfHearts/NineOfDiamonds/false 

sample return value:

    {
        "Score": 4,
        "ScoreInfo": [
            [
                {
                    "ScoreName": "Fifteen",
                    "Score": 2,
                    "Cards": [
                        {
                            "Ordinal": "Five",
                            "Rank": 5,
                            "Value": 5,
                            "Suit": "Hearts"
                        },
                        {
                            "Ordinal": "King",
                            "Rank": 13,
                            "Value": 10,
                            "Suit": "Spades"
                        }
                    ]
                },
                {
                    "ScoreName": "Fifteen",
                    "Score": 2,
                    "Cards": [
                        {
                            "Ordinal": "Six",
                            "Rank": 6,
                            "Value": 6,
                            "Suit": "Hearts"
                        },
                        {
                            "Ordinal": "Nine",
                            "Rank": 9,
                            "Value": 9,
                            "Suit": "Diamonds"
                        }
                    ]
                }
            ]
        ]
    }

GET: /getcribcards/:hand/:isMyCrib
----------------------------------

**Given a hand, return the cards that should go to the crib.  
This can be used to determine the computer's crib, but also offered as a suggestion to the player.**

    hand:   CSV list of six cards
    isCrib: a JSON parsed boolean indicating whose crib it is.  this is important because the service uses a drop table to determine the
            value of discarded cards.  if :isMyCrib is true, the service will maximize the value of the hand plus the discarded cards. 
            if it is false, the service will attempt to minimize the value of the cards put in the crib.

sample URLs:

                localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/false  
                localhost:8080/api/getcribcards/FiveOfHearts,FiveOfClubs,FiveOfSpades,JackOfDiamonds,SixOfClubs,FourOfDiamonds/true   
                localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/true  
                localhost:8080/api/getcribcards/FourOfHearts,FiveOfHearts,SixOfSpades,JackOfHearts,QueenOfHearts,SixOfDiamonds/false  


GET /getnextcountedcard/:cardsleft/:currentCount
------------------------------------------------
GET /getnextcountedcard/:cardsleft/:currentCount/:countedcards
--------------------------------------------------------------

    CardsLeft:      the CSV list of cards still in the players hand
    CurrentCount:   the sum % 31 of counted cards
    CountedCards:   the CSV list of cards that have been counted


the services verifies that CurrentCount is correct.  I do this instead of calculating it on the service because I think I'll like having the check from the clients perspective.

URL example:

               localhost:8080/api/getnextcountedcard/AceOfSpades,AceOfHearts,TwoOfClubs,TenOfDiamonds/0
               localhost:8080/api/getnextcountedcard/AceOfSpades,ThreeOfClubs/4/AceOfHearts,TwoOfClubs,TenOfDiamonds
               localhost:8080/api/getnextcountedcard/TenOfClubs,AceOfHearts/16/AceOfSpades,ThreeOfClubs,TwoOfClubs,TenOfHearts
           
Note that the last parameters contains all the cards that have already been counted, which means it starts empty, so there are two
routes. I trim spaces, but Cards must be spelled correctly

example return:

    {
        "Ordinal": "Ace",
        "Rank": 1,
        "Value": 1,
        "Suit": "Hearts"
    }

GET /scorecountedcards/:playedcard/:currentCount
-------------------------------------------------
GET /scorecountedcards/:playedcard/:currentCount/:countedcards/
-------------------------------------------------

    playedcard:     the card that was just played  
    currentcount:   the sum % 31 of counted cards
    countedcards:   the CSV list of cards that have been counted

URL examples:

    localhost:8080/api/scorecountedcards/AceOfSpades/0
    localhost:8080/api/scorecountedcards/AceOfHearts/1/AceOfSpades
    localhost:8080/api/scorecountedcards/AceOfClubs/2/AceOfHearts,AceOfSpades
    localhost:8080/api/scorecountedcards/TwoOfClubs/13/AceOfHearts,ThreeOfClubs,FiveOfDiamonds,FourOfClubs

returns the StandardScoring object that contains the sum of the scores that result along with a list of objects that contain the score,
reason, and cards for each score resulting from playing the card.

example return:

    {
        "Score": 2,
        "ScoreInfo": [
            {
                "ScoreName": "Pair",
                "Score": 2,
                "Cards": [
                    {
                        "Ordinal": "Ace",
                        "Rank": 1,
                        "Value": 1,
                        "Suit": "Hearts"
                    },
                    {
                        "Ordinal": "Ace",
                        "Rank": 1,
                        "Value": 1,
                        "Suit": "Spades"
                    }
                ]
            }
        ]
    }



    
