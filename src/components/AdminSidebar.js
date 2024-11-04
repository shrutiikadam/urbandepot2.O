import React from 'react';
import './AdminSidebar.css';
import { FaChartLine, FaList, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';
import { auth } from "../firebaseConfig"; // Ensure the path is correct
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AdminSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate(); // Initialize useNavigate

    const confirmLogout = () => {
        // Use window.confirm to ask for confirmation before logging out
        const isConfirmed = window.confirm("Are you sure you want to log out?");
        if (isConfirmed) {
            handleLogout(); // Proceed with logout if confirmed
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut(); // Sign out the user
            alert("Logged out successfully!"); // Use alert for feedback
            navigate('/'); // Use navigate to redirect to the root path after logging out
        } catch (error) {
            alert(`Logout Error: ${error.message}`); // Use alert to show errors
        }
    };

    const adminName = "Admin"; // Replace with dynamic admin name if available
    const initial = adminName.charAt(0).toUpperCase(); // Get the first letter of the admin's name

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h2 className="urban-depot-title" style={{ color: 'white' }}>UrbanDepot</h2>
            </div>
            <div className="sidebar-greeting" style={{ padding: '10px', color: 'white', textAlign: 'center', display: 'flex', alignItems: 'center' }}>
                <div className="avatar" style={{ 
                    backgroundColor: 'green', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '66px', 
                    height: '50px', 
                    lineHeight: '40px', 
                    textAlign: 'center', 
                    fontSize: '20px',
                    marginRight: '10px' // Margin to separate the avatar from the greeting
                }}>
                    {initial}
                </div>
                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '20px', color: 'white' }}>Welcome, {adminName}</p>
            </div>
            <hr style={{ border: '1px solid white', margin: '10px 0' }} />
            <ul className="sidebar-menu">
                <li onClick={() => setActiveTab('statistics')} className={activeTab === 'statistics' ? 'active' : ''}>
                    <FaChartLine className="iconadmin" />
                    <span>Statistics Overview</span>
                </li>
                <li onClick={() => setActiveTab('registered')} className={activeTab === 'registered' ? 'active' : ''}>
                    <FaList className="iconadmin" />
                    <span>Registered Places List</span>
                </li>
                <li onClick={() => setActiveTab('payment')} className={activeTab === 'payment' ? 'active' : ''}>
                    <FaClipboardList className="iconadmin" />
                    <span>Payment History</span>
                </li>
                {/* <li onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
                    <FaUserCircle className="icon" />
                    <span>Profile</span>
                </li> */}
                {/* <li onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>
                    <FaCog className="icon" />
                    <span>Settings</span>
                </li> */}
                {/* Logout option */}
                <li onClick={confirmLogout} className="logout">
                    <FaSignOutAlt className="iconadmin" style={{ color: 'red' }} />
                    <span style={{ color: 'red' }}>Logout</span>
                </li>
            </ul>
           
        </aside>
    );
};

export default AdminSidebar;
