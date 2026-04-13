import { getListings, getListing, getListingsByHost } from "../lib/api.js";
import "../stylesheets/Search.css";
import { useState } from "react";

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
                <div>
                    <h2>{listing.title}</h2>
                </div>

                <div className ="listing-contents">
                    <div>
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
                    </div>

                    <div>
                        <h3>Description:</h3>
                            <p>{listing.description}</p>
                    </div>

                    <div>
                        <h3>Location:</h3>       
                            <p>Postcode: {listing.location.postcode}</p>
                            <p>Address: {listing.location.address}</p>
                            <p>City: {listing.location.city}</p>
                            <p>Country: {listing.location.country}</p>       
                    </div>    

                    <div>
                        <h3>Images:</h3>
                            <DisplayImages images={listing.images}/>
                    </div>

 
                </div>   
            </div>
        
        </>
    )

}

function DisplayListings({listings}){
    console.log("listings");
    console.log(listings);
    //let listOfListing = [];
    //listOfListing.push(DisplayListing(listings[0]));


    const displayListings = listings.map(listing => <DisplayListing listing={listing}/>);
    if (listings.length>0){
        return <ul>{displayListings}</ul>;
    }
    else{
        return <div><p>No results found</p></div>;
    }
    
}

// Open weather API key. 437218189febbb7451a26102eb3ef8af
function Geocoding(){

}


function GetDistanceBetweenCoordinates(latitude1, longitude1, latitude2, longitude2){
    // Haversine formula: Calculate distance between coordinates.

    // Earth radius in metres.
    const SphereRadius = 6371e3;

    function convertDegToRadians(degree){
        return degree * Math.PI/180;

    }

    const angle1 = convertDegToRadians(latitude1);
    const angle2 = convertDegToRadians(latitude2);    
    

    const latitudeDifference = convertDegToRadians(latitude2-latitude1);
    const longitudeDifference = convertDegToRadians(longitude2-longitude1);
    

    const angle = 
        Math.sin(latitudeDifference/2)*Math.sin(latitudeDifference/2)
        + Math.cos(angle1)*Math.cos(angle2)*
        Math.sin(longitudeDifference/2)*Math.sin(longitudeDifference/2);
    
    const centralAngle = 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1-angle));
    console.log(angle);

    const distance = SphereRadius*centralAngle;

    return distance;
}



export function SearchListings() {
    // Allow search by location and name.


    // State:
    const [sortOrder, setSortOrder] = useState(true);

    console.log(document);
    
    let searchParam = new URLSearchParams(window.location.search);

    console.log(searchParam);

    function handleSearchSubmit(page){
        page.preventDefault();

        const searchForm = page.target;
        const formData = new FormData(searchForm);

        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);
    }

    let ascending = sortOrder;

    const filter = {
        city: "London",
        minPrice: 0,
        maxPrice: 5,
        bedrooms: undefined,
        available: true
    };


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
        <>
            <form name="searchForm" method="post" onSubmit={handleSearchSubmit}>
                <label for="city">City</label>
                <input type ="text" name="city"></input>

                <label for="location">Location</label>
                <input type ="text" name="location"></input>


                <label for="minPrice">minPrice</label>
                <input type ="number" name="minPrice"></input>
                <label for="maxPrice">maxPrice</label>
                <input type ="number" name="maxPrice"></input>

                <label for="bedrooms">bedrooms</label>
                <input type ="number" name="bedrooms"></input>      

                <label for="unavailable">unavailable</label>
                <input type ="checkbox" name="unavailable"></input>                         

                <label for="sort-by">Sort by</label>
                <select id="sort-by" name="order">
                    <option value ="cost">Cost</option>
                    <option value ="ratings">Ratings</option>
                    <option value ="reviewCount">Review count</option>
                    <option value ="distance">Distance</option>
                </select>
                <label for="sort-order">Sort order</label>
                <select id="sort-order" name="sortOrder">
                    <option value ="ascending">Ascending</option>
                    <option value ="descending">Descending</option>
                </select>
                <input type="submit" value="Search"></input>
                    

            </form>

            <div>
                {/* <DisplayListing listing={listings[0]}/> */}
                <DisplayListings listings={sortedListing}/>
            </div>
        </>
        
    );
    


}

