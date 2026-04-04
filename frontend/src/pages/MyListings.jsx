/**
 * MyListings.jsx — Host-only page.
 */

import React, { useState } from "react";
import "../stylesheets/MyListings.css";
import { getCurrentUser } from "../lib/auth";
import { getListingsByHost, updateListing } from "../lib/api";
import ListingCard from "../components/ListingCard";
import EditListingModal from "../components/EditListingModal";

export default function MyListings() {
  const [user] = useState(getCurrentUser());
  const [listings, setListings] = useState(getListingsByHost(user.id));
  const [editingListing, setEditingListing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (listing) => {
    setEditingListing({ ...listing });
    setShowModal(true);
  };

  const handleSave = () => {
    updateListing(editingListing.id, editingListing);
    setListings(getListingsByHost(user.id)); // Refresh listings
    setShowModal(false);
    setEditingListing(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingListing(null);
  };

  const handleChange = (field, value) => {
    setEditingListing({ ...editingListing, [field]: value });
  };

  return (
    <main>
      <h1>My Listings</h1>
      {listings.length === 0 ? (
        <p>You have no listings yet.</p>
      ) : (
        <div className="listings-container">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <EditListingModal
        isOpen={showModal}
        onClose={handleCancel}
        listing={editingListing}
        onSave={handleSave}
      />
    </main>
  );
}
