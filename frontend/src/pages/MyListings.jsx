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
    const listingToToggle = listings.find((listing) => listing.id === listingId);
    if (!listingToToggle) return;

    const updatedAvailability = !listingToToggle.available;
    const updatedListing = { ...listingToToggle, available: updatedAvailability };
    updateListing(listingId, { available: updatedAvailability });
    setListings(listings.map((listing) => listing.id === listingId ? updatedListing : listing));
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
    <main className="my-listings-page">
      <section className="my-listings-shell">
        <div className="my-listings-header">
          <div>
            <p className="my-listings-eyebrow">Host dashboard</p>
            <h1>My Listings</h1>
            <p className="my-listings-copy">
              Manage your active, archived, and draft properties from one place.
            </p>
          </div>

          <div className="my-listings-actions">
            <span className="my-listings-count">{listings.length} listings</span>
            <button onClick={handleCreate} className="upload-button">
              Upload Listing
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="my-listings-empty">
            <h2>No listings yet</h2>
            <p>
              Upload your first property to start managing bookings and availability.
            </p>
            <button onClick={handleCreate} className="upload-button">
              Create Your First Listing
            </button>
          </div>
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
      </section>

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
