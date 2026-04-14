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
    const listImages = images.map(image => <img className="listingImage" src={image} key={image} />);

    return <div>{listImages}</div>
}

function DisplayAmenities({amenities}){
    const listingAmenities = amenities.map(amenity => <p key={amenity}>{amenity}</p>);

    return <ul>{listingAmenities}</ul>
}

function DisplayListing({listing}){
    let distance = listing.distance;
    let displayDistance = ""; 
    if (distance || distance == 0){
        displayDistance = <p>Distance: {String(distance)+"m"}</p>;
    }


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
                            {displayDistance}

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

    return Math.round(distance);
}



function fetchListings(){

}

function validateParseFilter(city,minPrice,maxPrice, bedrooms, unavailable){
    let filter = {};

    if(Number.isInteger(parseInt(minPrice))){
        filter.minPrice = parseInt(minPrice);
    }
    
    if(Number.isInteger(parseInt(maxPrice))){
        filter.maxPrice = parseInt(maxPrice);
    }

    if(Number.isInteger(parseInt(bedrooms))){
        filter.bedrooms = parseInt(bedrooms);
    }

    if(unavailable == "on" || unavailable == true){
        filter.available = false;
    
    }
    // else{
    //     filter.available = true;
    // }

    const parseCity = city.trim().toLowerCase();
   
    if(parseCity != ""){
        filter.city = parseCity;
    }

    return filter;
}

function sortListings(listings, sortByOrder,ascending){

    let sortFunction;
    // Selection based on target field

    if(sortByOrder == "cost"){
        sortFunction = function(a, b){return a.price > b.price};
    }
    else if(sortByOrder == "ratings"){
        sortFunction = function(a, b){return a.rating > b.rating};
    }
    else if(sortByOrder == "reviewCount"){
        sortFunction = function(a, b){return a.reviewCount > b.reviewCount};
    }
    else if(sortByOrder == "distance"){
        sortFunction = function(a, b){return a.distance > b.distance};
    }
    else if(sortByOrder == "name"){
        sortFunction = function(a, b){return a.title > b.title};
    }
    else{
        sortFunction = function(a, b){return a.id > b.id};
    }
    
    // Select ascending or descending
    let sortedListing;
    console.log(ascending, sortByOrder, listings, sortFunction);
    sortedListing = listings.toSorted(sortFunction);
    if (ascending!="ascending"){
        sortedListing = sortedListing.toReversed(sortFunction);
    } 
    console.log("Listing",sortedListing);
    return sortedListing;
}

function listingsAppendDistance(listings,lat,lon){
    for(let i = 0 ;i < listings.length; i++){
        listings[i].distance = GetDistanceBetweenCoordinates(listings[i].location.latitude, listings[i].location.longitude, lat, lon);
    }
    return listings;
}

export function SearchListings() {
    console.log("Missing",getListings());
    // Allow search by location and name.
    

    async function getGeocoding(){
        let zipcode = "SE15 4DH"
        try{
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${zipcode},GB&appid=437218189febbb7451a26102eb3ef8af`);
            if (!response.ok) { 
                throw new Error(`Response status: ${response.status}`);
            }            
            const result = await response.json();  
            return result;
        } 
        catch(error){

        }
        
    }   


    // State:
    const [listings, setListings] = useState(getListings());

    const [sortOrder, setSortOrder] = useState(true);
    

    console.log(document);
    
    let searchParam = new URLSearchParams(window.location.search);
    const [addressGeocode, setGeocode] = useState();
    console.log(searchParam);

    function handleSearchSubmit(page){
        page.preventDefault();

        const searchForm = page.target;
        const formData = new FormData(searchForm);

        const formJson = Object.fromEntries(formData.entries());

        let newListingsOrder = getListings(validateParseFilter(formJson.city,formJson.minPrice,formJson.maxPrice,formJson.bedrooms,formJson.unavailable));

        if (formJson.order == "distance"){
            console.log("THIS",formJson, getGeocoding()
            .then(
                function(value){
                    console.log(value);
                    let newListingsSet = listingsAppendDistance(newListingsOrder,value.lat,value.lon);
                    setListings(sortListings(newListingsSet,formJson.order,formJson.sortOrder))
                },
                function(){setListings(sortListings(newListingsOrder,formJson.order,formJson.sortOrder))}
            )

            );
        }
        else{
            setListings(sortListings(newListingsOrder,formJson.order,formJson.sortOrder)); 
        }

        console.log(addressGeocode);

        
        
    }
    

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
                    <option value ="name">Name</option>
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
                <DisplayListings listings={listings}/>
            </div>
        </>
        
    );
    


}

