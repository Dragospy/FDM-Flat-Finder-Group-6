/**
 * EditListingModal.jsx — Modal component for editing a listing.
 */

import React, { useState, useEffect } from 'react';
import '../stylesheets/EditListingModal.css';

export default function EditListingModal({ isOpen, onClose, listing, onSave, isCreate }) {
  const [editedListing, setEditedListing] = useState(listing || {});
  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    setEditedListing(listing || {});
    setNewAmenity('');
  }, [listing]);

  const handleChange = (field, value) => {
    setEditedListing({ ...editedListing, [field]: value });
  };

  const handleLocationChange = (field, value) => {
    setEditedListing({ ...editedListing, location: { ...editedListing.location, [field]: value } });
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setEditedListing({
        ...editedListing,
        amenities: [...(editedListing.amenities || []), newAmenity.trim()]
      });
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setEditedListing({
      ...editedListing,
      amenities: editedListing.amenities.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedListing);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
      <h2>{isCreate ? 'Create Listing' : 'Edit Listing'}</h2>
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
            Type:
            <select
              value={editedListing.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="Studio">Studio</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Room">Room</option>
            </select>
          </label>
          <label>
            Address:
            <input
              type="text"
              value={editedListing.location?.address || ''}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              required
            />
          </label>
          <label>
            City:
            <input
              type="text"
              value={editedListing.location?.city || ''}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              required
            />
          </label>
          <label>
            Postcode:
            <input
              type="text"
              value={editedListing.location?.postcode || ''}
              onChange={(e) => handleLocationChange('postcode', e.target.value)}
              required
            />
          </label>
          <label>
            Country:
            <input
              type="text"
              value={editedListing.location?.country || ''}
              onChange={(e) => handleLocationChange('country', e.target.value)}
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
            Price Unit:
            <select
              value={editedListing.priceUnit || 'month'}
              onChange={(e) => handleChange('priceUnit', e.target.value)}
              required
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="night">Night</option>
            </select>
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
          <label>
            Images (one URL per line):
            <textarea
              value={editedListing.images ? editedListing.images.join('\n') : ''}
              onChange={(e) => handleChange('images', e.target.value.split('\n').map(url => url.trim()).filter(url => url))}
              placeholder="Enter image URLs, one per line"
            />
          </label>
          <label>
            Amenities:
            <div className="amenities-editor">
              <div className="add-amenity">
                <input
                  type="text"
                  placeholder="Add amenity"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                />
                <button type="button" onClick={addAmenity}>Add</button>
              </div>
              <div className="amenities-list">
                {(editedListing.amenities || []).map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    {amenity}
                    <button type="button" onClick={() => removeAmenity(index)}>−</button>
                  </div>
                ))}
              </div>
            </div>
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}