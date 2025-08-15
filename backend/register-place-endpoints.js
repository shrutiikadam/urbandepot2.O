// Add these endpoints to your backend/index.js file

const express = require("express");
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Register a new parking place
app.post("/api/register-place", authenticateToken, upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'nocLetter', maxCount: 1 },
  { name: 'buildingPermission', maxCount: 1 },
  { name: 'placePicture', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      placeName,
      address,
      name,
      ownerEmail,
      parkingNumber,
      fromTime,
      toTime,
      fromDate,
      toDate,
      landmark,
      accessType,
      hasCameras,
      hasSecurityGuard,
      guardName,
      guardContact
    } = req.body;

    // Validate required fields
    if (!placeName || !address || !fromTime || !toTime || !fromDate || !toDate || !landmark) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }

    // Upload files to Firebase Storage
    const fileUrls = {};
    if (req.files) {
      const uploadPromises = [];
      
      Object.keys(req.files).forEach((key) => {
        const file = req.files[key][0];
        const fileName = `${ownerEmail}/${uuidv4()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        
        uploadPromises.push(
          fileUpload.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          }).then(() => {
            return fileUpload.getSignedUrl({
              action: 'read',
              expires: '03-01-2500',
            });
          }).then((urls) => {
            fileUrls[key] = urls[0];
          })
        );
      });
      
      await Promise.all(uploadPromises);
    }

    // Prepare place data
    const placeData = {
      placeName,
      address,
      name,
      ownerEmail,
      parkingNumber: parkingNumber || 'N/A',
      availability: { from: fromTime, to: toTime },
      dateRange: { from: fromDate, to: toDate },
      landmark: JSON.parse(landmark),
      accessType: accessType || 'public',
      verified: false,
      hasCameras: hasCameras || 'no',
      hasSecurityGuard: hasSecurityGuard || 'no',
      guardName: guardName || '',
      guardContact: guardContact || '',
      documents: {
        aadharCard: fileUrls.aadharCard || '',
        nocLetter: fileUrls.nocLetter || '',
        buildingPermission: fileUrls.buildingPermission || '',
        placePicture: fileUrls.placePicture || '',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    const placeId = `${placeName.replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Save to user's register collection
    await db.collection('users').doc(ownerEmail).collection('register').doc(placeId).set(placeData);
    
    // Save to global places collection
    await db.collection('places').doc(placeId).set(placeData);

    res.status(201).json({
      message: "Place registered successfully",
      placeId,
      placeData
    });

  } catch (error) {
    console.error("Error registering place:", error);
    res.status(500).json({ error: "Failed to register place" });
  }
});

// Get user's registered places
app.get("/api/profile/places/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const snapshot = await db.collection("users").doc(email).collection("register").get();
    const places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(places);
  } catch (err) {
    console.error("Error fetching places:", err);
    res.status(500).json({ error: "Error fetching registered places" });
  }
});

// Delete a registered place
app.delete("/api/profile/places/:email/:placeId", authenticateToken, async (req, res) => {
  try {
    const { email, placeId } = req.params;
    
    // Delete from user's register collection
    await db.collection("users").doc(email).collection("register").doc(placeId).delete();
    
    // Delete from global places collection
    await db.collection("places").doc(placeId).delete();
    
    res.status(200).json({ message: "Place deleted successfully" });
  } catch (err) {
    console.error("Error deleting place:", err);
    res.status(500).json({ error: "Failed to delete place" });
  }
});
