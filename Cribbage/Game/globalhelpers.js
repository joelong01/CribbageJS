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
exports.arrayContainsCard = arrayContainsCard;