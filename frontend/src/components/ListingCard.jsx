/**
 * ListingCard.jsx — Component to display a listing card with all information.
 */

import React from 'react';
import '../stylesheets/ListingCard.css';

export default function ListingCard({ listing, onEdit }) {
  return (
    <div className="listing-card">
      {/* Images */}
      <div className="listing-images">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} className="listing-image" />
        ) : (
          <div className="no-image">No Image Available</div>
        )}
        {listing.images && listing.images.length > 1 && (
          <div className="image-count">+{listing.images.length - 1} more</div>
        )}
      </div>

      {/* Title and Rating */}
      <div className="listing-header">
        <h3 className="listing-title">{listing.title}</h3>
        {listing.rating && (
          <div className="listing-rating">
            ⭐ {listing.rating} ({listing.reviewCount} reviews)
          </div>
        )}
      </div>

      {/* Type and Location */}
      <div className="listing-type-location">
        <span className="listing-type">{listing.type}</span>
        <span className="listing-location">
          {listing.location.address}, {listing.location.city}, {listing.location.postcode}, {listing.location.country}
        </span>
      </div>

      {/* Description */}
      <p className="listing-description">{listing.description}</p>

      {/* Details */}
      <div className="listing-details">
        <div className="detail-item">
          <strong>Bedrooms:</strong> {listing.bedrooms}
        </div>
        <div className="detail-item">
          <strong>Bathrooms:</strong> {listing.bathrooms}
        </div>
        <div className="detail-item">
          <strong>Max Guests:</strong> {listing.maxGuests}
        </div>
        <div className="detail-item">
          <strong>Price:</strong> £{listing.price} per {listing.priceUnit}
        </div>
        <div className="detail-item">
          <strong>Available:</strong> {listing.available ? 'Yes' : 'No'}
        </div>
      </div>

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <div className="listing-amenities">
          <strong>Amenities:</strong>
          <ul>
            {listing.amenities.map((amenity, index) => (
              <li key={index}>{amenity}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Button */}
      {onEdit && (
        <button className="edit-button" onClick={() => onEdit(listing)}>
          Edit Listing
        </button>
      )}

      {/* Created At */}
      <div className="listing-created">
        <small>Listed on {new Date(listing.createdAt).toLocaleDateString()}</small>
      </div>
    </div>
  );
}