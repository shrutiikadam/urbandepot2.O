import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import Tesseract from 'tesseract.js'; // Import Tesseract.js
import './ReservationForm.css';
import { FaCar, FaMotorcycle, FaTruck, FaBicycle } from "react-icons/fa";
import ProgressBar from './ProgressBar';
import FileUpload from './FileUpload'; // Adjust the path according to your project structure
import Loading from './Loading'; // Import the Loading component


const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
};

// Get current local date in YYYY-MM-DD format
const getCurrentLocalDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

  
// Country codes list
const countryCodes = [
  { code: '+1', name: 'United States' },
  { code: '+91', name: 'India' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+61', name: 'Australia' },
  { code: '+81', name: 'Japan' },
  // Add more country codes as needed
];

const ReservationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const queryParams = new URLSearchParams(location.search);
  const addressFromURL = queryParams.get('address') || '';
  const placeFromURL = queryParams.get('id') || '';
  const [ocrText, setOcrText] = useState('');
  const [step, setStep] = useState(1); // Track the current step
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const [licenseValidationMessage, setLicenseValidationMessage] = useState(''); // State for license validation message
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    countryCode: '+91',
    checkinDate: getCurrentLocalDate(),
    checkoutDate: getCurrentLocalDate(),
    checkinTime: '',
    checkoutTime: '',
    vehicleType: '',
    licensePlate: '',
    paymentMethod: 'credit_card', // Default value
    termsAccepted: false,
    licensePhoto: null, // To store the uploaded license photo
    platePhoto: null, // To store the uploaded plate photo
    address: addressFromURL,
    place: placeFromURL,
    createdAt: new Date().toISOString(), // Capture creation date
    total_amount: "50000", // Example amount in paise
    extractedName: '' // To store the extracted name from the license
  });

  const timeOptions = generateTimeOptions();



  const getCheckoutTimeOptions = () => {
    const selectedCheckinIndex = timeOptions.indexOf(formData.checkinTime);
    if (selectedCheckinIndex === -1) {
      return timeOptions; // Return all times if no checkin time is selected
    }
    // Return only times after the selected checkin time
    return timeOptions.slice(selectedCheckinIndex + 1);
  };


  
  const handleIconClick = (vehicleType) => {
  // Toggle the vehicle type if it's already selected
  setFormData((prevData) => ({
    ...prevData,
    vehicleType: prevData.vehicleType === vehicleType ? '' : vehicleType,
  }));

  // Apply the shrink effect
  const icon = document.getElementById(vehicleType);
  icon.classList.add('shrink');

  // Remove the shrink effect after the animation
  setTimeout(() => {
    icon.classList.remove('shrink');
  }, 100); // Match the CSS transition duration
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = async (file, id) => {
    if (file) {
        // Update the form data with the uploaded file
        setFormData((prevData) => ({
            ...prevData,
            [id]: file, // Use the id to dynamically set the file in formData
        }));

        // Run OCR on the license photo to validate it
        if (id === 'licensePhoto') {
            const text = await runOCR(file);
            if (text) {
                setFormData((prevData) => ({
                    ...prevData,
                    extractedName: text.trim(), // Store the extracted name for comparison
                }));
            }
        }
    }
};


  // Function to run OCR
  const runOCR = async (file) => {
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => console.log(m),
      });

      setOcrText(text); // Set the OCR text to state

      const nameMatch = text.match(/name\s*:\s*([a-zA-Z\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        const extractedName = nameMatch[1].trim();
        setFormData((prevData) => ({
          ...prevData,
          extractedName: extractedName
        }));
      } else {
        setLicenseValidationMessage('Name not found on the license. Please ensure the photo is clear and properly scanned.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setLicenseValidationMessage('Error during OCR processing. Please try again.');
    }
  };

  const validateLicense = () => {
    const nameMatch = ocrText.match(/name\s*:\s*([a-zA-Z\s]+)/i);
    const normalizedExtractedName = nameMatch && nameMatch[1]
      ? nameMatch[1].replace(/\s+/g, ' ').trim().toUpperCase() // Normalize extracted name
      : '';

    const normalizedUserName = formData.name
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim() // Remove leading/trailing whitespace
      .toUpperCase(); // Convert to uppercase

    // Clean names to remove non-ASCII characters
    const cleanedExtractedName = normalizedExtractedName.replace(/[^\x20-\x7E]/g, '');
    const cleanedUserName = normalizedUserName.replace(/[^\x20-\x7E]/g, '');

    console.log("Extracted Name:", cleanedExtractedName);
    console.log("User Name:", cleanedUserName);

    // Compare while allowing for trailing characters
    const namesMatch = cleanedExtractedName.startsWith(cleanedUserName);

    if (!namesMatch) {
        console.error("Names do not match:", cleanedExtractedName, "!==", cleanedUserName);
    } else {
        console.log("Names match!");
    }

    return namesMatch;
  };

  const isValidLicense = (text) => {
    const keywords = [
        'DRIVER LICENSE',
        'LICENSE',
        'IDENTIFICATION',
        'ID',
        'DEPARTMENT OF MOTOR VEHICLES',
        'DMV',
        // Add more relevant terms based on your region or requirements
    ];

    const regex = new RegExp(keywords.join('|'), 'i');
    return regex.test(text);
  };

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Clear previous error messages
  setErrorMessage('');
  setLicenseValidationMessage('');
  setIsLoading(true);

  // Validate the license name against the user's name
  if (!validateLicense()) {
    setLicenseValidationMessage('The name on the license does not match the provided name. Please upload a valid license.');
    setIsLoading(false);
    return;
  }

  try {
    const formDataToSend = new FormData();

    // Append files
    formDataToSend.append('licensePhoto', formData.licensePhoto);
    formDataToSend.append('platePhoto', formData.platePhoto);

    // Append the rest of the data as a JSON string
    const data = {
      ...formData,
    };
    formDataToSend.append('data', JSON.stringify(data));

    const response = await fetch('http://localhost:5000/api/reserve', {
      method: 'POST',
      body: formDataToSend,
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || 'Reservation failed');
      return;
    }

    // Navigate to payment page with reservation data
    navigate('/payment', {
      state: {
        address: formData.address,
        place: formData.place,
        reservationData: result.reservationData,
      },
    });
  } catch (error) {
    console.error('Error submitting reservation:', error);
    setErrorMessage('An error occurred while submitting your reservation. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  if (isLoading) {
    return <Loading />; // Show loading component
  }

  const renderStep = () => {
    {errorMessage && <div className="error-message">{errorMessage}</div>} {/* Error message display */}
    {licenseValidationMessage && <div className="license-validation-message">{licenseValidationMessage}</div>}
    switch (step) {
      case 1:
        return (
          // step1-form
          <div className='reserve-step-1'>
            <div className="reserve-step1-sidetext">
              <p id='step'>Step 1</p>
              <p id='reserve-step1-sidetext1'>Welcome!Let’s Get to Know You</p>
              <p id='reserve-step1-sidetext2'>Before we proceed, we’d love to get a few details to make your reservation seamless. This information helps us tailor your experience and stay connected!</p>
            </div>
            <div className="reserve-step1-form">
              <p>We need the following info to proceed</p>
              <div className="reserve-step1-name">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  placeholder='Your Good Name'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="reserve-step1-email">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  placeholder='example@gmail.com'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="reserve-step1-contact">
                <label>Contact Number:</label>
                <div className="reserve-step1-contact-in">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  >
                    {countryCodes.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.code} {code.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="9999999999"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    required
                  />
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        );
  
      case 2:
        return (
          <div className="reserve-step2">
            <div className="reserve-step2-sidetext">
              <p id='step'>Step 2</p>
              <p id='reserve-step2-sidetext1'>When Would You Like to Reserve?</p>
              <p id='reserve-step2-sidetext2'>Let us know when you’ll be arriving and departing so we can reserve the space just for you.</p>
            </div>
            <div className="reserve-step2-form">
            <h2>Reservation Dates</h2>
            <div className='reserve-step2-date'>
            <div className='reserve-step2-checkin-date'>
            <label>Check-in Date:</label>
    
            <input
              type="date"
              name="checkinDate"
              value={formData.checkinDate}
              onChange={(e) => setFormData({ ...formData, checkinDate: e.target.value })}
              required
            /></div>
            <div class="reserve-step2-divider"></div>
            <div className='reserve-step2-checkout-date'>
            <label>Check-out Date:</label>
            <input
              type="date"
              name="checkoutDate"
              value={formData.checkoutDate}
              onChange={(e) => setFormData({ ...formData, checkoutDate: e.target.value })}
              required
            /></div>
            </div>

            <div className='reserve-step2-time'>
  <div className='reserve-step2-checkin-time'>
    <label>Check-in Time:</label>
    <select
      name="checkinTime"
      value={formData.checkinTime}
      onChange={(e) => {
        const selectedCheckinTime = e.target.value;
        setFormData({ ...formData, checkinTime: selectedCheckinTime, checkoutTime: '' }); // Reset checkout time
      }}
      required
    >
      <option value="">Select Time</option>
      {timeOptions.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  </div>
  <div className="reserve-step2-divider"></div>
  <div className='reserve-step2-checkout-time'>
    <label>Check-out Time:</label>
    <select
      name="checkoutTime"
      value={formData.checkoutTime}
      onChange={(e) => setFormData({ ...formData, checkoutTime: e.target.value })}
      required
    >
      <option value="">Select Time</option>
      {getCheckoutTimeOptions().map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  </div>
</div>

          </div>
          </div>
        );
  
      case 3:
        return (
          <div className="reserve-step3">
            <div className="reserve-step3-sidetext">
              <p id='step'>Step 3</p>
              <p id='reserve-step3-sidetext1'>Tell Us About Your Vehicle</p>
              <p id='reserve-step3-sidetext2'>We need a few details about your vehicle. Rest assured, all your data is kept secure!</p>
            </div>
            <div className="reserve-step3-form">
            <label>Which of the best describes your vehicle?</label>
            <div className="vehicle-icons">
        <div
          className={`img ${formData.vehicleType === "Car" ? "selected" : ""}`}
          onClick={() => {
            setFormData({ ...formData, vehicleType: "Car" });
            handleIconClick('car');
          }}>
          <img id="car" src="/car-icon.png" alt="Car" />
          <p>Car</p>
        </div>
        <div
          className={`img ${formData.vehicleType === "Bike" ? "selected" : ""}`}
          onClick={() => {
            setFormData({ ...formData, vehicleType: "Bike" });
            handleIconClick('bike');
          }}>
          <img id="bike" src="motorbike.png" alt="Car" />
          <p>Bike</p>
        </div>
        <div
          className={`img ${formData.vehicleType === "Scooter" ? "selected" : ""}`}
          onClick={() => {setFormData({ ...formData, vehicleType: "Scooter" });
          handleIconClick('scooter');
        }}
        >
        <img id="scooter" src="scooter.png" alt="Car" /> 
        <p>Scooter</p>
        </div>
        <div
          className={`img ${formData.vehicleType === "Bicycle" ? "selected" : ""}`}
          onClick={() => {setFormData({ ...formData, vehicleType: "Bicycle" });
          handleIconClick('bicycle');
        }}
        >
          <img id="bicycle" src="bicycle.png" alt="Car" /> 
          <p>Bicycle</p>
        </div>
        
      </div> 
      <div className="reserve-step3-license">
            <label>License Plate No:</label>
            <input
              type="text"
              name="licensePlate"
              placeholder='MU00XY0000'
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              required
            /></div>
          </div></div>
        );
        case 4:
          return (
              <div className="reserve-step4">
                  <div className="reserve-step3-sidetext">
                      <p id='step'>Step 4</p>
                      <p id='reserve-step3-sidetext1'>Verify with Photos</p>
                      <p id='reserve-step3-sidetext2'>Please upload your license and plate photos. This ensures everything is set for a smooth visit!</p>
                  </div>
                  <div className='reserve-step4-form'>
                  <h2 class="upload-photos-title">Upload Photos</h2>
                  <div className="reserve-step4-file-upload-container">
                          <FileUpload 
                              onFileChange={(file) => handleFileChange(file, 'licensePhoto')} // Triggering file change for license photo
                              label="Upload License Photo"
                              required
                              id="licensePhoto"
                          />
                      </div>
                      <div className="reserve-step4-file-upload-container">
                          <FileUpload 
                              onFileChange={(file) => handleFileChange(file, 'platePhoto')} // Triggering file change for plate photo
                              label="Upload Plate Photo"
                              required
                              id="platePhoto"
                          />
                      </div>
                      <p>{errorMessage}</p> {/* Displaying error message if necessary */}
                  </div>
              </div>
          );
      
        
      case 5:
        return (
          <div className="reserve-step5">
                {/* <div className="review-page"> */}
      <div className="review-header">
        <h2 className="reserve-step5-heading">Almost Done!</h2>
        <p className="reserve-step5-text">Take a moment to review your reservation details. When you're ready, click 'Submit' to complete your booking.</p>
      </div>

      <div className="review-container">
        {/* Personal Information Section */}
        <div className="personal-info">
          <h3 className="card-title">Personal Information</h3>
          <div className="review-item">
            <p className="review-label">Name:</p>
            <p className="review-value">{formData.name}</p>
          </div>
          <div className="review-item">
            <p className="review-label">Email:</p>
            <p className="review-value">{formData.email}</p>
          </div>
          <div className="review-item">
            <p className="review-label">Contact Number:</p>
            <p className="review-value">{`${formData.countryCode} ${formData.contactNumber}`}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="reserve-step5-divider"></div>

        {/* Booking Information Section */}
        <div className="booking-info">
          <h3 className="card-title">Booking Details</h3>
          <div className="review-item">
            <p className="review-label">Check-in:</p>
            <p className="review-value">{`${formData.checkinDate} at ${formData.checkinTime}`}</p>
          </div>
          <div className="review-item">
            <p className="review-label">Check-out:</p>
            <p className="review-value">{`${formData.checkoutDate} at ${formData.checkoutTime}`}</p>
          </div>
          <div className="review-item">
            <p className="review-label">Vehicle Type:</p>
            <p className="review-value">{formData.vehicleType}</p>
          </div>
          <div className="review-item">
            <p className="review-label">License Plate:</p>
            <p className="review-value">{formData.licensePlate}</p>
          </div>
          </div>
      </div>
    </div>

        
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="reserve-page">
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <ProgressBar
        currentStep={step}
        totalSteps={5}
        onNext={handleNextStep}
        onPrev={handlePrevStep}
      />
      {renderStep()}
      {step === 5 && (
        <button className="reserve-page-submit-button" onClick={handleSubmit}>
          Submit Reservation
        </button>
      )}
    </div>
  );
  
};

export default ReservationForm;