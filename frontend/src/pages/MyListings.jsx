/**
 * MyListings.jsx — Host-only page.
 */

import React, { useState } from "react";
import "../stylesheets/MyListings.css";
import { getCurrentUser } from "../lib/auth";
import { getListingsByHost, updateListing, createListing, deleteListing } from "../lib/api";
import ListingCard from "../components/ListingCard";
import EditListingModal from "../components/EditListingModal";

export default function MyListings() {
  const [user] = useState(getCurrentUser());
  const [listings, setListings] = useState(getListingsByHost(user.id));
  const [editingListing, setEditingListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreate, setIsCreate] = useState(false);

  const handleEdit = (listing) => {
    setEditingListing({ ...listing });
    setIsCreate(false);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingListing({});
    setIsCreate(true);
    setShowModal(true);
  };

  const handleDelete = (listingId) => {
    deleteListing(listingId);
    setListings(listings.filter(l => l.id !== listingId));
  };

  const handleArchive = (listingId) => {
    const listingToArchive = listings.find((listing) => listing.id === listingId);
    if (!listingToArchive) return;

    const archivedListing = { ...listingToArchive, available: false };
    updateListing(listingId, { available: false });
    setListings(listings.map((listing) => listing.id === listingId ? archivedListing : listing));
  };

  const handleSave = (updatedListing) => {
    if (isCreate) {
      const newListing = createListing({ ...updatedListing, hostId: user.id });
      setListings([...listings, newListing]);
    } else {
      updateListing(updatedListing.id, updatedListing);
      setListings(listings.map(listing => listing.id === updatedListing.id ? updatedListing : listing));
    }
    setShowModal(false);
    setEditingListing(null);
    setIsCreate(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingListing(null);
    setIsCreate(false);
  };

  return (
    <main>
      <h1>My Listings</h1>
      <button onClick={handleCreate} className="upload-button">Upload Listing</button>
      {listings.length === 0 ? (
        <p>You have no listings yet.</p>
      ) : (
        <div className="listings-container">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EditListingModal
        isOpen={showModal}
        onClose={handleCancel}
        listing={editingListing}
        onSave={handleSave}
        isCreate={isCreate}
      />
    </main>
  );
}
