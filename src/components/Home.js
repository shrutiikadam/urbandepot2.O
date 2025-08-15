import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from "../firebaseConfig"; 
import './Home.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import TransitionSection from './TransitionSection';
import CardSlider from './CardSlider';

const Home = () => {
  const [carLoaded, setCarLoaded] = useState(false);
  const [parkingVisible, setParkingVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

   const [backendMsg, setBackendMsg] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setBackendMsg(data.message))
      .catch((err) => console.error("Error:", err));
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut(); 
      alert("Logged out successfully!"); 
      setUserEmail("");
    } catch (error) {
      alert(`Logout Error: ${error.message}`);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const data = [
    {
      title: "Real-Time Availability",
      description: "View up-to-the-minute updates on available parking spaces.",
      icon: "fas fa-clock",
    },
    {
      title: "Secure Payments",
      description: "Convenient online payments to streamline your experience.",
      icon: "fas fa-credit-card",
    },
    {
      title: "Affordable Options",
      description: "Select from a range of prices to suit your budget.",
      icon: "fas fa-dollar-sign",
    },
    {
      title: "24/7 Customer Support",
      description: "Count on us whenever you need assistance.",
      icon: "fas fa-headset",
    },
  ];

  return (
    <div className="Sachipage1">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"/>
        <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace&display=swap" rel="stylesheet" />
      </head>

      <div className="Landing-Page">
        <div className="landing">
          <div className="hero-text">
            <div className="first-line-wrapper">
              <div className="first-row">
                <div className="firstline1">Let</div>
                <div className="title1">URBANDEPOT</div>
              </div>
              <div className="firstline">take you straight to your spot!</div>
              <div className="secondline1">
                <p>Discover the easiest way to find and reserve parking in real-time—quick, convenient, and stress-free.</p>
              </div>
              <div className="nav-links1">
                <Link to="/login" className="landing-button">Secure Your Spot</Link>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img src="parkinglines3.png" alt="Parking Lines" className="parking-lines" />
            <img src="parking786.png" alt="Park" className={`park-image ${parkingVisible ? 'visible' : ''}`} />
            <img src="car1234.png" alt="Car" className={`car-image ${carLoaded ? 'loaded' : ''}`} />
          </div>
        </div>

        <div className="headicon"><h2>Why Choose Us?</h2></div>
        <div className="icon-section">  
          {data.map((item, index) => (
            <div key={index} className="icon-card">
              <div className="icon-circle">
                <i className={item.icon}></i>
              </div>
              <h3>{item.title}</h3>
              <p className="itemp">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="ticker-container">
          <div className="sponsor">Key Partners</div>
          <div className="ticker-text">
            <div className="ticker-logos">
              <div className="logo-container">
                <img src="BMC.png" alt="Logo 1" className="logo1" />
                <img src="gmaps.png" alt="Logo 2" className="logo1" />
                <img src="razor.png" alt="Logo 3" className="logo1" />
                <img src="Ola-Logo1.png" alt="Logo 4" className="logo1" />
                <img src="uber.png" alt="Logo 5" className="logo1" />
                <img src="BMC.png" alt="Logo 1" className="logo1" />
      <img src="gmaps.png" alt="Logo 2" className="logo1" />
      <img src="razor.png" alt="Logo 3" className="logo1" />
      <img src="Ola-Logo1.png" alt="Logo 4" className="logo1" />
      <img src="uber.png" alt="Logo 5" className="logo1" />              
              </div>
            </div>
          </div>
        </div>

        <div className="headicon"><h2>Hear from Our Happy Users</h2></div>
        <CardSlider />
        <TransitionSection />
      </div>

      <footer className="new_footer_area bg_color">
        <div className="new_footer_top">
          <div className="container">
            <div className="row">
              <div className="col-lg-3 col-md-6">
                <div className="f_widget company_widget wow fadeInLeft" data-wow-delay="0.2s" style={{ visibility: 'visible', animationDelay: '0.2s', animationName: 'fadeInLeft' }}>
                  <h3 className="f-title f_600 t_color f_size_18">Customer Support</h3>
                  <ul className="list-unstyled f_list">
                    <li>Support Email: <a href="#">support@urbandepot.com</a></li>
                    <li>Helpline: <a href="#">+91 800 123 4567</a></li>
                    <li>Working Hours: Monday to Friday - 9 AM to 6 PM</li>
                  </ul>
                  <form action="#" className="f_subscribe_two mailchimp" method="post" novalidate="true">
                    <input type="text" name="EMAIL" className="form-control memail" placeholder="Email" />
                    <button className="btn btn_get btn_get_two" type="submit">Subscribe</button>
                    <p className="mchimp-errmessage">There was an error. Please try again.</p>
                    <p className="mchimp-sucmessage">Thank you for subscribing!</p>
                  </form>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="f_widget about-widget pl_70 wow fadeInLeft" data-wow-delay="0.4s" style={{ visibility: 'visible', animationDelay: '0.4s', animationName: 'fadeInLeft' }}>
                  <h3 className="f-title f_600 t_color f_size_18">Download</h3>
                  <ul className="list-unstyled f_list">
                    <li><a href="#">Company</a></li>
                    <li><a href="#">Android App</a></li>
                    <li><a href="#">iOS App</a></li>
                    <li><a href="#">Desktop</a></li>
                    <li><a href="#">Projects</a></li>
                    <li><a href="#">My tasks</a></li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="f_widget about-widget pl_70 wow fadeInLeft" data-wow-delay="0.6s" style={{ visibility: 'visible', animationDelay: '0.6s', animationName: 'fadeInLeft' }}>
                  <h3 className="f-title f_600 t_color f_size_18">Help</h3>
                  <ul className="list-unstyled f_list">
                    <li><a href="#">FAQ</a></li>
                    <li><a href="#">Terms & Conditions</a></li>
                    <li><a href="#">Reporting</a></li>
                    <li><a href="#">Documentation</a></li>
                    <li><a href="#">Support Policy</a></li>
                    <li><a href="#">Privacy</a></li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="f_widget social-widget pl_70 wow fadeInLeft" data-wow-delay="0.8s" style={{ visibility: 'visible', animationDelay: '0.8s', animationName: 'fadeInLeft' }}>
                  <h3 className="f-title f_600 t_color f_size_18">Team Solutions</h3>
                  <div className="f_social_icon">
                    <a href="#" className="fab fa-facebook"></a>
                    <a href="#" className="fab fa-twitter"></a>
                    <a href="#" className="fab fa-linkedin"></a>
                    <a href="#" className="fab fa-instagram"></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer> 
    </div>
  );
};

export default Home;
