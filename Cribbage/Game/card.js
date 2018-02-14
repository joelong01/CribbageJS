// @ts-check

var Enum = require('enum');

//
//  exported as a complete deck - allows the map of cardname ("AceOfSpades") to the Card
//
var Deck = {};


var Suit = new Enum(
    {
        'Uninitialized': -1,
        'Clubs': 0,
        'Diamonds': 1,
        'Hearts': 2,
        'Spades': 3
    }, { freeze: true });

var Ordinal = new Enum(
    {
        'Uninitialized': 0,
        'Ace': 1,
        'Two': 2,
        'Three': 3,
        'Four': 4,
        'Five': 5,
        'Six': 6,
        'Seven': 7,
        'Eight': 8,
        'Nine': 9,
        'Ten': 10,
        'Jack': 11,
        'Queen': 12,
        'King': 13
    }, { freeze: true });

    var Owner = new Enum (
        {
            'computer': 1,
            'player' : 2,
            'shared' : 3

        }, {freeze: true});

    var CardNames = [];


//
//  created a deck for us to use
//  
function Init()
{
    console.log('Card Init called');
    for (var i = 1; i < 14; i++)
    {

        for (var j = 0; j < 4; j++)
        {
            var c = new Card(Ordinal.get(i, 0), i, i < 10 ? i : 10, Suit.get(j, 0));
            var name = c.toString();
            CardNames.push(name);
            Deck[name] = c;
        }
    }
}

//
//  card object
//
var Card = function Card(ordinal, rank, value, suit) 
{
    this.Ordinal = ordinal; // an enum like AceOfSpades
    this.Rank = rank;       // 1...13 used for runs
    this.Value = value;     // 1-10 used for counting
    this.Suit = suit;       // enum like Spades
    this.name = this.Ordinal.key + "Of" + this.Suit.key;
    
};

Card.prototype.toString = function ()
{
    return this.name;
};

var ClientCard = function ClientCard(card, owner)
{
    this.name = card.name;
    this.orientation = "facedown";
    this.location = "deck";
    this.owner =  owner;
    this.value = card.Value;
}

//
//  this is the class you JSON.stringify() to return a randomized hand to the caller
//
function Hands(hand1, hand2, shared)
{
    this.hand1 = hand1;
    this.hand2 = hand2;
    this.sharedCard = shared;
    this.allCards = hand1.concat(hand2);
    this.allCards.push(shared);
}



/*
    Exports defined AT THE END of the module so that they are defined.
    painful lesson to learn.
*/
exports.Ordinal = Ordinal;
exports.Suit = Suit;
exports.Init = Init;
exports.Card = Card;
exports.Deck = Deck;
exports.Hands = Hands;
exports.CardNames = CardNames;
exports.ClientCard = ClientCard;


