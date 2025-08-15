import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import db from '../firebaseConfig';
import './RazorpayPayment.css';
import emailjs from 'emailjs-com';
import Loading from './Loading';

const razorpayApiKey = process.env.REACT_APP_RAZORPAY_API_KEY;

const RazorpayPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, place, reservationData } = location.state;
  const { checkinDate, checkoutDate, checkinTime, checkoutTime, name, email, contactNumber, vehicleType } = reservationData;

  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location.state || !place) {
      console.error("location.state or place is missing. Check if 'place' is correctly passed.");
      return;
    }

    const fetchOwnerEmail = async () => {
      try {
        const placeDocRef = doc(db, 'places', place);
        const placeDoc = await getDoc(placeDocRef);
        
        if (placeDoc.exists()) {
          const ownerEmail = placeDoc.data().ownerEmail;
          setOwnerEmail(ownerEmail);
          console.log('Owner Email:', ownerEmail);
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error("Error fetching owner email:", error);
      }
    };

    fetchOwnerEmail();
  }, [place, location.state]);

  const calculateTotalAmount = () => {
    const checkin = new Date(`${checkinDate}T${checkinTime}`);
    const checkout = new Date(`${checkoutDate}T${checkoutTime}`);
    const differenceInHours = (checkout - checkin) / (1000 * 60 * 60); // Hours difference

    console.log("Check-in Date & Time:", checkin);
    console.log("Check-out Date & Time:", checkout);
    console.log("Difference in Hours:", differenceInHours);
    
    const hourlyRates = {
        car: 30,         
        bike: 20,  
        scooter: 20,     
        bicycle: 10      
    };
    
    const hourlyRate = hourlyRates[vehicleType.toLowerCase()] || 0; 
    console.log("Vehicle Type:", vehicleType);
    console.log("Hourly Rate:", hourlyRate);
    
    const platformFeePercentage = 0.05; 
    console.log("Platform Fee Percentage:", platformFeePercentage);
    
    const totalAmount = differenceInHours * hourlyRate; 
    console.log("Total Amount (before platform fee):", totalAmount);
    
    const platformFee = totalAmount * platformFeePercentage; 
    console.log("Platform Fee:", platformFee);
    
    const finalTotalAmount = totalAmount + platformFee; 
    console.log("Final Total Amount (after adding platform fee):", finalTotalAmount);
    
    return {
        differenceInHours,
        hourlyRate,
        platformFee: platformFee.toFixed(2), 
        totalAmount: finalTotalAmount.toFixed(2) 
    };
  };

  const { differenceInHours, hourlyRate, platformFee, totalAmount } = calculateTotalAmount();

  const handlePayment = async () => {
  setLoading(true);

  try {
    const orderRes = await fetch('http://localhost:5000/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalAmount })
    });

    const order = await orderRes.json();
    
    const options = {
      key: razorpayApiKey,
      amount: order.amount,
      currency: order.currency,
      name: "UrbanDepot",
      description: "Parking Reservation Payment",
      order_id: order.id,
      handler: async function (response) {
        // Verify the payment
        const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });

        const verifyData = await verifyRes.json();

        if (verifyData.verified) {
          await sendEmailToOwner(response.razorpay_payment_id);
          setLoading(false);

          navigate('/ticket', {
            state: {
              paymentId: response.razorpay_payment_id,
              address,
              place,
              reservationData,
              totalAmount
            }
          });
        } else {
          setLoading(false);
          alert('Payment verification failed');
        }
      },
      prefill: {
        name,
        email,
        contact: contactNumber,
      },
      theme: {
        color: "#F37254"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment error:", err);
    alert("Payment failed. Please try again.");
    setLoading(false);
  }
};

  const sendEmailToOwner = async (paymentId) => {
    console.log("Entered emailing function");
    const templateParams = {
      to_email: ownerEmail,
      user_name: name,
      user_email: email,
      contactnumber: contactNumber,
      place: place,
      checkinDate: checkinDate,
      checkoutDate: checkoutDate,
      checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      vehicleType: vehicleType,
      paymentId: paymentId,
      totalAmount: totalAmount // Total amount in INR
    };
  
    try {
      console.log("Sending email with parameters:", templateParams);
      const response = await emailjs.send(
        'service_dxp7k7a',
        'template_9jt8h3k',
        templateParams,
        'WfUPqJH0cRzftZSDI'
      );
      console.log('Email sent successfully!', response.status, response.text);
      alert('NOTIFIED THE OWNER SUCCESSFULLY!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    }
  };

  return (
    <div className="rzp-container">
      {loading ? (
        <Loading />
      ) : (
        <>
          <h2 className="rzp-title">Pay with Razorpay</h2>
          <h4 className="rzp-subtitle">Reservation Details:</h4>
          <p className="rzp-paragraph"><strong>Address:</strong> {address}</p>
          <p className="rzp-paragraph"><strong>Place:</strong> {place}</p>
          <p className="rzp-paragraph">Check-in Date: {checkinDate}</p>
          <p className="rzp-paragraph">Check-out Date: {checkoutDate}</p>
          <p className="rzp-paragraph">Check-in Time: {checkinTime}</p>
          <p className="rzp-paragraph">Check-out Time: {checkoutTime}</p>
          <p className="rzp-paragraph">Vehicle Type: {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</p>
          
          <div className="billing-details">
            <h4 className="rzp-bill-header">Billing Details:</h4>
            <div className="rzp-bill">
              <div className="rzp-bill-item">
                <span>Duration of Stay:</span>
                <span>{differenceInHours.toFixed(2)} hours</span>
              </div>
              <div className="rzp-bill-item">
                <span>Hourly Rate (for {vehicleType}):</span>
                <span>₹{hourlyRate.toFixed(2)}</span>
              </div>
              <div className="rzp-bill-item">
                <span>Subtotal:</span>
                <span>₹{(differenceInHours * hourlyRate).toFixed(2)}</span>
              </div>
              <div className="rzp-bill-item">
                <span>Platform Fee (5%):</span>
                <span>₹{platformFee}</span>
              </div>
              <div className="rzp-bill-item">
                <span>Total Amount:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </div>
      
          <button className="rzp-button" onClick={handlePayment}>Pay Now</button>
        </>
      )}
    </div>
  );
};

export default RazorpayPayment;
