
var Enum = require('enum');
var Suit = new Enum(
    { 'Uninitialized': -1, 'Clubs': 0, 'Diamonds': 1, 'Hearts': 2, 'Spades': 3 }, { freeze: true });
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
    }, { freez: true });

exports.Ordinal = Ordinal;
exports.Suit = Suit;

//var CardNames = new Enum();
//exports.CardNames = CardNames;
var Cards = {};
exports.Cards = Cards;

function Init()
{
    console.log("Card Init called");
    for (var i = 1; i < 14; i++)
    {

        for (var j = 0; j < 4; j++)
        {
            var c = new Card(Ordinal.get(i), i, i < 10 ? i : 10, Suit.get(j));
            var name = c.toString();
            //  CardNames.push(name);
            Cards[name] = c;
        }
    }
}
exports.Init = Init;
var Card = function Card(ordinal, rank, value, suit) 
{
    this.Rank = rank;
    this.Value = value;
    this.Suit = suit;
    this.Ordinal = ordinal;
};
Card.prototype.toString = function ()
{
    return this.Ordinal.key + "Of" + this.Suit.key;
}
exports.Card = Card;




