/**
 * ListingCard.jsx — Component to display a listing card with all information.
 */

import React, { useState } from 'react';
import { getCurrentUser } from '../lib/auth';
import '../stylesheets/ListingCard.css';

export default function ListingCard({ listing, onEdit, onArchive, onDelete }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const currentUser = getCurrentUser();
  const isOwner = currentUser && listing.hostId === currentUser.id;

  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(listing.id);
    setConfirmingDelete(false);
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(false);
  };

  const handleArchiveClick = () => {
    onArchive(listing.id);
  };

  return (
    <div className={`listing-card ${!listing.available ? 'archived-card' : ''}`}>
      {/* Images */}
      <div className="listing-images">
        {listing.images && listing.images.length > 0 ? (
          <>
            <img src={listing.images[currentImage]} alt={listing.title} className="listing-image" />
            {listing.images.length > 1 && (
              <>
                <button
                  className="image-nav prev"
                  onClick={() => setCurrentImage((currentImage - 1 + listing.images.length) % listing.images.length)}
                >
                  ‹
                </button>
                <button
                  className="image-nav next"
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
          <div className="no-image">No Image Available</div>
        )}
      </div>

      {/* Title and Rating */}
      <div className="listing-header">
        <h3 className="listing-title">{listing.title}</h3>
        <div className="listing-rating">
          {listing.rating == 0 ? 'No reviews yet' : 
          `⭐ ${listing.rating} (${listing.reviewCount} reviews)`
        }
          </div>
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

      {/* Buttons */}
      <div className="card-buttons">
        {onEdit && (
          <button className="edit-button" onClick={() => onEdit(listing)}>
            Edit
          </button>
        )}
        {isOwner && onArchive && (
          <button
            className="archive-button"
            onClick={handleArchiveClick}
          >
            {listing.available ? 'Archive' : 'Unarchive'}
          </button>
        )}
        {isOwner && onDelete && (
          confirmingDelete ? (
            <>
              <button className="delete-confirm-button" onClick={handleDeleteConfirm}>
                Confirm Delete
              </button>
              <button className="delete-cancel-button" onClick={handleDeleteCancel}>
                Cancel
              </button>
            </>
          ) : (
            <button className="delete-button" onClick={handleDeleteClick}>
              Delete
            </button>
          )
        )}
      </div>

      {/* Created At */}
      <div className="listing-created">
        <small>Listed on {new Date(listing.createdAt).toLocaleDateString()}</small>
      </div>
    </div>
  );
}