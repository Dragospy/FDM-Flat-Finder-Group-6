import { Link } from "react-router-dom";
import { getListings, APPLICATION_STATUS } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../lib/auth.js";
import "../stylesheets/Search.css";
import { useState } from "react";
import EnquiryButton from "./EnquiryButton";
import ReportButton from "./ReportButton";




function DisplayListing({ listing, showApplyAction }){
    const [currentImage, setCurrentImage] = useState(0);
    let distance = listing.distance;
    let displayDistance = ""; 
    if (distance || distance == 0){
        displayDistance = <p>Distance: {String(distance)+"m"}</p>;
    }

    return(

        <div className={`search-listing-card ${!listing.available ? 'archived-card' : ''}`}>
            {/* Images */}
            <section className="search-section-image">
                <div className="listing-images-search">
                    {listing.images && listing.images.length > 0 ? (
                    <>
                        <img src={listing.images[currentImage]} alt={listing.title} className="listing-image-search" />
                        {listing.images.length > 1 && (
                        <>
                            <button
                            className="image-nav-search prev"
                            onClick={() => setCurrentImage((currentImage - 1 + listing.images.length) % listing.images.length)}
                            >
                            ‹
                            </button>
                            <button
                            className="image-nav-search next"
                            onClick={() => setCurrentImage((currentImage + 1) % listing.images.length)}
                            >
                            ›
                            </button>
                            <div className="image-indicator">
                            {currentImage + 1} / {listing.images.length}
                            </div>
                        </>
                        )}
                    </>
                    ) : (
                    <div className="no-image-search">No Image Available</div>
                    )}
                </div>
            </section>
            
            <section className="search-section-information">
                {/* Title and Rating */}
                <div className="listing-header-search">
                    <h3 className="listing-title-search">{listing.title}</h3>
                    <div className="listing-rating-search">
                    {listing.rating == 0
                        ? 'No reviews yet'
                        : `⭐ ${listing.rating} (${listing.reviewCount} reviews)`}
                    </div>
                </div>

                {/* Type and Location */}
                <div className="listing-type-location-search">
                    <span className="listing-type-search">{listing.type}</span>
                    <span className="listing-location-search">
                    {listing.location.address}, {listing.location.city}, {listing.location.postcode}, {listing.location.country}
                    </span>
                </div>

                {/* Description */}
                <p className="listing-description-search">{listing.description}</p>                

                {displayDistance}

                {/* Details */}
                <h3>Details:</h3>
                <div className="listing-details-search">
                <div className="detail-item-search">
                    <strong>Bedrooms:</strong> {listing.bedrooms}
                </div>
                <div className="detail-item-search">
                    <strong>Bathrooms:</strong> {listing.bathrooms}
                </div>
                <div className="detail-item-search">
                    <strong>Max Guests:</strong> {listing.maxGuests}
                </div>
                <div className="detail-item-search">
                    <strong>Price:</strong> £{listing.price} per {listing.priceUnit}
                </div>
                <div className="detail-item-search">
                    <strong>Available:</strong> {listing.available ? 'Yes' : 'No'}
                </div>
                </div>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                    <div className="listing-amenities-search">
                    <strong>Amenities:</strong>
                    <ul>
                        {listing.amenities.map((amenity, index) => (
                        <li key={index}>{amenity}</li>
                        ))}
                    </ul>
                    </div>
                )}
            
                <div className="search-listing-actions">
                    {showApplyAction && (
                        listing.available ? (
                            <Link
                                className="search-apply-button"
                                to={`/apply/${encodeURIComponent(String(listing.id).trim())}`}
                            >
                                Apply
                            </Link>
                        ) : (
                            <span className="search-apply-disabled">Unavailable</span>
                        )
                    )}
                    <EnquiryButton accommodationId={listing.id} hostId={listing.hostId} />
                    <ReportButton listingId={listing.id} />
                </div>

                {/* Created At */}
                <div className="listing-created-search">
                    <small>Listed on {new Date(listing.createdAt).toLocaleDateString()}</small>
                </div>
            </section>
        </div>
        

    )

}

function DisplayListings({ listings, showApplyAction }){
    console.log("listings");
    console.log(listings);

    const displayListings = listings.map((listing) => (
        <DisplayListing key={listing.id} listing={listing} showApplyAction={showApplyAction} />
    ));
    if (listings.length>0){
        return displayListings;
    }
    else{
        return <div><p>No results found</p></div>;
    }
    
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

    return Math.floor(distance);
}

// city,minPrice,maxPrice, bedrooms, available
function validateParseFilter(parseFilter){
    let filter = {};

    if(Number.isInteger(parseInt(parseFilter.minPrice))){
        filter.minPrice = parseInt(parseFilter.minPrice);
    }
    
    if(Number.isInteger(parseInt(parseFilter.maxPrice))){
        filter.maxPrice = parseInt(parseFilter.maxPrice);
    }

    if(Number.isInteger(parseInt(parseFilter.bedrooms))){
        filter.bedrooms = parseInt(parseFilter.bedrooms);
    }

    if(Number.isInteger(parseInt(parseFilter.maxGuests))){
        filter.maxGuests = parseInt(parseFilter.maxGuests);
    }

    if(parseFilter.available == "available"){
        filter.available = true;
    }
    else if(parseFilter.available == "unavailable"){
        filter.available = false;
    }

    const validTypes = ["studio", "apartment", "house"];
    if (validTypes.includes(parseFilter.type)){
        filter.type = parseFilter.type;
    }


    const parseCity = parseFilter.city.trim().toLowerCase();
   
    if(parseCity != ""){
        filter.city = parseCity;
    }

    filter.status = APPLICATION_STATUS.ACCEPTED;

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

// API call to fetch
async function getGeocoding(zipcode){
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

function filterDistance(listings, maxDistance){
    const sortedListings = listings.filter((l) => l.distance <= maxDistance);
    return sortedListings;
}

export function SearchListings() {
    // State:
    const [listings, setListings] = useState(getListings({status: APPLICATION_STATUS.ACCEPTED}));    
    const { user } = useAuth();
    const showApplyAction = user?.role === ROLES.RENTEE;
    let searchParam = new URLSearchParams(window.location.search);


    function handleSearchSubmit(page){
        page.preventDefault();

        const searchForm = page.target;
        const formData = new FormData(searchForm);

        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);

        const parsedFilter = validateParseFilter({
            city : formJson.city,
            minPrice : formJson.minPrice,
            maxPrice : formJson.maxPrice,
            bedrooms : formJson.bedrooms,
            available : formJson.availability,
            type : formJson.type,
            maxGuests : formJson.maxGuest,
        });

        let newListingsOrder = getListings(parsedFilter);
        if (formJson.location.trim()!=""){
            console.log("FormJson",formJson, getGeocoding(formJson.location)
            .then(
                function(value){
                    try{
                        let newListingsSet = listingsAppendDistance(newListingsOrder,value.lat,value.lon);

                        if (Number.isInteger(parseInt(formJson.maxDistance))){
                            setListings(sortListings(filterDistance(newListingsSet, parseInt(formJson.maxDistance)),formJson.order,formJson.sortOrder));
                        }else{
                            setListings(sortListings(newListingsSet,formJson.order,formJson.sortOrder));
                        }
                        
                    }
                    catch(errorMessage){
                        console.log("API call failed: ", errorMessage)
                        setListings(sortListings(newListingsOrder,formJson.order,formJson.sortOrder))
                    }

                },
                function(){setListings(sortListings(newListingsOrder,formJson.order,formJson.sortOrder))}
            )

            );
        }
        else{
            setListings(sortListings(newListingsOrder,formJson.order,formJson.sortOrder)); 
        }

    }
    

    return (
        <main className="search-page">
            <div className="search-page-shell">
                <section className="search-page-header">
                    <form className="form-container search-field" name="searchForm" method="post" onSubmit={handleSearchSubmit}>
                        <h1>Search listings</h1>





                        <div className="sub-form-section">
                            <div className="input-set">
                                <label className="sub-form-item" for="city">City</label>
                                <input className="sub-form-item" placeholder="Search city" type ="text" name="city"></input>
                            </div>
                            <div className="input-set">
                                <label className="sub-form-item" for="location">Location</label>
                                <input className="sub-form-item" placeholder="Search by postcode" type ="text" name="location"></input> 
                            </div>
                        
                            <div className="input-set">
                                <label className="sub-form-item" for="maxDistance">Maximum distance</label>
                                <input className="sub-form-item" min="0" placeholder="Enter maximum distance" type ="number" name="maxDistance"></input>
                            </div>                            
                        </div>

                        <div className="sub-form-section">



                  
                            <div className="input-set">
                                <label className="sub-form-item" for="minPrice">Minimum price</label>
                                <input className="sub-form-item" min="0" placeholder="Enter minimum price" type ="number" name="minPrice"></input>
                            </div>

                            <div className="input-set">
                                <label className="sub-form-item" for="maxPrice">Maximum price</label>
                                <input className="sub-form-item" min="0" placeholder="Enter maximum price" type ="number" name="maxPrice"></input>
                            </div>
                            <div className="input-set">
                                <label className="sub-form-item"for="bedrooms">Number of bedrooms</label>
                                <input className="sub-form-item" min="0" placeholder="Enter number of bedrooms" type ="number" name="bedrooms"></input>      
                            </div>

                            <div className="input-set">
                                <label className="sub-form-item"for="maxGuest">Maximum number of guests</label>
                                <input className="sub-form-item" min="0" placeholder="Enter number of guests" type ="number" name="maxGuest"></input>      
                            </div>          





  

                        </div>

                        <div className="sub-form-section">
                            <div className="input-set">
                                <label className="sub-form-item" for="available">Availability</label>
                                <select className="sub-form-item" id="available" name="availability">
                                    <option value ="all">All</option>                                    
                                    <option value ="available">Available</option>
                                    <option value ="unavailable">Unavailable</option>

                                </select>
                            </div>

                           <div className="input-set">
                                <label className="sub-form-item" for="type">Type</label>
                                <select className="sub-form-item" id="type" name="type">
                                    <option value ="all">All</option>                                    
                                    <option value ="studio">Studio</option>
                                    <option value ="apartment">Apartment</option>
                                    <option value ="house">House</option>
                                </select>
                            </div>

                            <div className="input-set">
                                <label className="sub-form-item" for="sort-by">Sort by</label>
                                <select className="sub-form-item" id="sort-by" name="order">
                                    <option value ="cost">Cost</option>
                                    <option value ="name">Name</option>
                                    <option value ="ratings">Ratings</option>
                                    <option value ="reviewCount">Review count</option>
                                    <option value ="distance">Distance</option>
                                </select>
                            </div>

                            <div className="input-set">
                                <label className="sub-form-item" for="sort-order">Sort order</label>
                                <select className="sub-form-item" id="sort-order" name="sortOrder">
                                    <option value ="ascending">Ascending</option>
                                    <option value ="descending">Descending</option>
                                </select>
                            </div>
                        </div>
                    <div className="search-submit">
                        <span className="my-listings-count">{listings.length} results</span>
                        <input className="search-button" type="submit" value="Search"></input>                     
                    </div>
                    
                    </form>
                </section>

                <section className="search-listings-container">
                    <DisplayListings listings={listings} showApplyAction={showApplyAction} />
                </section>
            </div>
        </main>
        
    );
    


}

