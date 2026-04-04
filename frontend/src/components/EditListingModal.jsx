/**
 * EditListingModal.jsx — Modal component for editing a listing.
 */

import React, { useState, useEffect } from 'react';
import '../stylesheets/EditListingModal.css';

export default function EditListingModal({ isOpen, onClose, listing, onSave }) {
  const [editedListing, setEditedListing] = useState(listing || {});

  useEffect(() => {
    setEditedListing(listing || {});
  }, [listing]);

  const handleChange = (field, value) => {
    setEditedListing({ ...editedListing, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedListing);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Listing</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input
              type="text"
              value={editedListing.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <textarea
              value={editedListing.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </label>
          <label>
            Price:
            <input
              type="number"
              value={editedListing.price || 0}
              onChange={(e) => handleChange('price', parseInt(e.target.value))}
              required
            />
          </label>
          <label>
            Bedrooms:
            <input
              type="number"
              value={editedListing.bedrooms || 0}
              onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
              required
            />
          </label>
          <label>
            Bathrooms:
            <input
              type="number"
              value={editedListing.bathrooms || 0}
              onChange={(e) => handleChange('bathrooms', parseInt(e.target.value))}
              required
            />
          </label>
          <label>
            Max Guests:
            <input
              type="number"
              value={editedListing.maxGuests || 0}
              onChange={(e) => handleChange('maxGuests', parseInt(e.target.value))}
              required
            />
          </label>
          <label>
            Available:
            <input
              type="checkbox"
              checked={editedListing.available || false}
              onChange={(e) => handleChange('available', e.target.checked)}
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}