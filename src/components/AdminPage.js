import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { FaTrash } from 'react-icons/fa'; // Import the trash icon

import db from "../firebaseConfig";
import AdminSidebar from "./AdminSidebar";
import "./AdminPage.css";
import Forpay from "./ForPay";
import Loading from "./Loading"; // Import the Loading component

const AdminPage = () => {
  const [places, setPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState("registered");
  const [activeSubTab, setActiveSubTab] = useState("verified");
  const [loading, setLoading] = useState(true);

  const auth = getAuth(); // Initialize Firebase Auth

  // Fetch all registered places
  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "places"));
      const fetchedPlaces = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPlaces.push({
          id: doc.id,
          ...data,
        });
      });

      setPlaces(fetchedPlaces);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  const handleVerifyPlace = async (placeId) => {
    try {
      const placeRef = doc(db, "places", placeId);
      await updateDoc(placeRef, { verified: true });
      setPlaces((prevPlaces) =>
        prevPlaces.map((place) =>
          place.id === placeId ? { ...place, verified: true } : place
        )
      );
    } catch (error) {
      console.error("Error verifying place:", error);
    }
  };

  const handleDeletePlace = async (placeId) => {
    if (window.confirm("Are you sure you want to delete this place?")) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "places", placeId));
        // Update state to remove the deleted place
        setPlaces((prevPlaces) => prevPlaces.filter(place => place.id !== placeId));
        alert("Place deleted successfully"); // Optional: Add toast notification
      } catch (error) {
        console.error("Error deleting place:", error);
      }
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    // Fetch logged-in user's information
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // You can handle user info here if needed
      }
    });
    return () => unsubscribe(); // Cleanup on component unmount
  }, [auth]);

  const verifiedPlaces = places.filter((place) => place.verified);
  const nonVerifiedPlaces = places.filter((place) => !place.verified);

  return (
    <div className="admin-page">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === "registered" && (
          <div>
            {/* Notification Bar for Registration Actions */}
            <div className="notification-banner">
              {activeSubTab === "verified" && (
                <p>Displaying all verified places</p>
              )}
              {activeSubTab === "nonVerified" && (
                <p>Displaying places pending verification</p>
              )}
            </div>

            <div className="tabs">
              <button
                className={`tab-button ${activeSubTab === "verified" ? "active" : ""}`}
                onClick={() => setActiveSubTab("verified")}
              >
                Verified
              </button>
              <button
                className={`tab-button ${activeSubTab === "nonVerified" ? "active" : ""}`}
                onClick={() => setActiveSubTab("nonVerified")}
              >
                Non-Verified
              </button>
            </div>

            {loading ? (
              <Loading />
            ) : (
              <div className="place-list">
                {activeSubTab === "verified" &&
                  verifiedPlaces.map((place) => (
                    <div key={place.id} className="place-card verified-card">
                      <div className="place-info">
                        <span>
                          <b>{place.placeName || "Unknown Place"}</b>
                        </span>
                        <span> Address: {place.address}</span>
                        <span> Charge: {place.charge}</span>
                        <span>
                          {" "} Availability: {place.availability.from} -{" "}
                          {place.availability.to}
                        </span>
                        <span> Verified: Yes</span>
                      </div>
                      <FaTrash className="delete-icon" onClick={() => handleDeletePlace(place.id)} style={{ color: "red", cursor: "pointer" }} />
                    </div>
                  ))}

                {activeSubTab === "nonVerified" &&
                  nonVerifiedPlaces.map((place) => (
                    <div key={place.id} className="place-card non-verified-card">
                      <div className="place-info">
                        <span>
                          <b>{place.placeName || "Unknown Place"}</b>
                        </span>
                        <span> Address: {place.address}</span>
                        <span> Charge: {place.charge}</span>
                        <span>
                          {" "} Availability: {place.availability.from} -{" "}
                          {place.availability.to}
                        </span>
                        <span> Verified: No</span>
                      </div>
                      <button
                        className="verify-button"
                        onClick={() => handleVerifyPlace(place.id)}
                      >
                        Verify
                      </button>
                      <FaTrash className="delete-icon" onClick={() => handleDeletePlace(place.id)} style={{ color: "red", cursor: "pointer" }} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "payment" && (
          <div className="bookings-list">
            <h3>Payment History</h3>
            <Forpay />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="notifications-list">
            <h2>Notifications</h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
