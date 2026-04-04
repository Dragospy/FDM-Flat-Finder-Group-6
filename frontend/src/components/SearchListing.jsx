import { getListings, getListing, getListingsByHost } from "../lib/api.js";



// Sort by, 
//     0 CreatedAt
//     1 bedroom count
//     2 bathroom count
//     3 maxGuests
//     4 price / (Priceunit)
//     5 rating
//     6 reviewCount
//     7 title

//      location : Will require lat+lon to compare distance?


export function SearchListings() {
    let ascending = true;
    let listings = getListings();
    console.log(listings);

    let sortFunction;


    // Selection based on target field
    sortFunction = function(a, b){return a.price > b.price};

    // Select ascending or descending
    let sortedListing;
    if (ascending){
        sortedListing = listings.toSorted(sortFunction);
    } else{
        sortedListing = listings.toReversed(sortFunction);
    }

    console.log(sortedListing)

    return (
        <div>
            <p>Test!</p>
        </div>

        
    );
    


}

