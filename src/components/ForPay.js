import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import db from '../firebaseConfig';
import { useLocation } from 'react-router-dom';
import './ForPay.css'; // Assuming your CSS file is named Forpay.css
import Loading from './Loading'; // Import the Loading component

const Forpay = () => {
    const [datewiseReservations, setDatewiseReservations] = useState({});
    const location = useLocation();
    const { platformFee } = location.state || {};
    const [loading, setLoading] = useState(true); // Initialize loading state

    
    // Function to fetch all reservations across all places
    const fetchAllReservations = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/reservations-grouped");
    const data = await response.json();
    setDatewiseReservations(data);
  } catch (error) {
    console.error("Error fetching reservations:", error);
  } finally {
    setLoading(false);
  }
};


    useEffect(() => {
        fetchAllReservations(); // Call fetch function on component mount
    }, []);

    return (
        <div className="admin-page">
            {loading ? ( // Display Loading component while loading
                <Loading />
            ) : (
                <div>
                    {Object.keys(datewiseReservations).length > 0 ? (
                        Object.entries(datewiseReservations).map(([date, { reservations, total }]) => (
                            <div key={date}>
                                <h4>{date} (Total Earned: ₹{total})</h4>
                                {reservations.map((reservation) => (
                                    <div key={reservation.reservationId} className="reservation-card">
                                        <p><strong>Place ID:</strong> {reservation.placeId}</p>
                                        <p><strong>Reservation ID:</strong> {reservation.reservationId}</p>
                                        <p><strong>Contact:</strong> {reservation.contactNumber}</p>
                                        <p><strong>Email:</strong> {reservation.email}</p>
                                        <span className="total-amount">+{reservation.platform_fee}</span>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p>No reservations available.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Forpay;