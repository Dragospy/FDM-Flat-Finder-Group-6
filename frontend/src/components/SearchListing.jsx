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

function DisplayImages({images}){
    const listImages = images.map(image => <img src={image} key={image} />);

    return <div>{listImages}</div>
}

function DisplayAmenities({amenities}){
    const listingAmenities = amenities.map(amenity => <p key={amenity}>{amenity}</p>);

    return <ul>{listingAmenities}</ul>
}

function DisplayListing({listing}){
    return(
        <>
            <div className="listing">
                <h2>{listing.title}</h2>
                    <h3>Details:</h3>
                        <div>
                            <p>Rating: {listing.rating}</p>
                            <p>Review count: {listing.reviewCount}</p>
                        </div>
                        <p>Price: {listing.price} per {listing.priceUnit}</p>
                        <p>Type: {listing.type}</p>
                        <p>Bedrooms:{listing.bedrooms}</p>
                        <p>Bathrooms:{listing.bathrooms}</p>
                        <p>Maximum number of guests: {listing.maxGuests}</p>

                        <h4>Amenities:</h4>
                            <DisplayAmenities amenities={listing.amenities}/>
                    <h3>Description:</h3>
                        <p>{listing.description}</p>
                    <h3>Images:</h3>
                        <DisplayImages images={listing.images}/>
                    <h3>Location:</h3>       
                        <p>Postcode: {listing.location.postcode}</p>
                        <p>Address: {listing.location.address}</p>
                        <p>City: {listing.location.city}</p>
                        <p>Country: {listing.location.country}</p>             
            </div>
        
        </>
    )

}

// function DisplayListings({listings}){
//     let listOfListing = [];
//     listOfListing.push(DisplayListing(listings[0]));


//     const displayListings = listings.map(listing => );

//     return <ul>{displayListings}</ul>
// }

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
            <DisplayListing listing={listings[0]}/>
        </div>

        
    );
    


}

