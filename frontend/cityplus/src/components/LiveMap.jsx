import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  MyLocation as MyLocationIcon,
  AddCircle as AddCircleIcon,
  LocationOn as LocationOnIcon,
  GpsFixed as GpsFixedIcon,
} from "@mui/icons-material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import "../index.css";

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LiveMap = ({ alerts, setAlerts }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [reportForm, setReportForm] = useState({
    type: "congestion",
    description: "",
    image: null,
  });

  // Set initial viewport to a default location (will be overridden by user's location)
  const defaultPosition = [20.5937, 78.9629]; // Default to India center

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationLoading(false);

        // Center map on user's location
        if (window.map) {
          window.map.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("User denied the request for Geolocation.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get user location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Get user location when component mounts
  useEffect(() => {
    getUserLocation();
  }, []);

  // Load data from Firestore
  useEffect(() => {
    // Real-time listener for projects
    const projectsUnsubscribe = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
      },
      (error) => {
        console.error("Error fetching projects:", error);
      }
    );

    // Real-time listener for reports
    const reportsUnsubscribe = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsData);
      },
      (error) => {
        console.error("Error fetching reports:", error);
      }
    );

    return () => {
      projectsUnsubscribe();
      reportsUnsubscribe();
    };
  }, [setAlerts]);

  // Function to get appropriate icon based on type
  // Function to get appropriate icon based on type - FIXED VERSION
  const createCustomIcon = (type, status) => {
    const color =
      status === "completed"
        ? "green"
        : status === "ongoing"
        ? "orange"
        : status === "planned"
        ? "blue"
        : "red";

    return divIcon({
      html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${type.charAt(0).toUpperCase()}
      </div>
    `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
      className: "custom-div-icon",
    });
  };

  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use user's current location for the report
      if (!userLocation) {
        throw new Error(
          "Unable to get your location. Please enable location services."
        );
      }

      // Create report object
      const newReport = {
        type: reportForm.type,
        description: reportForm.description,
        position: userLocation,
        status: "reported",
        timestamp: new Date(),
        reportedBy: "citizen", // You can add user ID here if you have authentication
      };

      // Add to Firestore
      await addDoc(collection(db, "reports"), newReport);

      // Reset form and close modal
      setReportForm({ type: "congestion", description: "", image: null });
      setOpen(false);

      // Show success alert
      setAlerts((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: "Report Submitted",
          message:
            "Your issue has been reported successfully using your current location!",
          type: "success",
        },
      ]);
    } catch (error) {
      console.error("Error submitting report:", error);

      // Show error alert
      setAlerts((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: "Submission Error",
          message:
            error.message ||
            "There was an error submitting your report. Please try again.",
          type: "error",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    // Request location again when opening report modal to ensure accuracy
    if (!userLocation) {
      getUserLocation();
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Component to set initial view to user's location
  const SetViewToUserLocation = () => {
    const map = useMap();

    useEffect(() => {
      if (userLocation) {
        map.setView(userLocation, 15);
      } else {
        map.setView(defaultPosition, 5);
      }
    }, [userLocation, map]);

    return null;
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <MapContainer
        center={userLocation || defaultPosition}
        zoom={userLocation ? 15 : 5}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        touchZoom={true}
        scrollWheelZoom={false} // Better for mobile
        doubleClickZoom={false} // Better for mobile
        zoomSnap={0.5} // Smoother zooming
        ref={(map) => {
          if (map) window.map = map;
        }}
      >
        <SetViewToUserLocation />

        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={
              new Icon({
                iconUrl:
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzQyODVGOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })
            }
          >
            <Popup>Your current location</Popup>
          </Marker>
        )}

        {/* Render project markers */}
        {projects.map((project) => (
          <Marker
            key={`project-${project.id}`}
            position={project.position || [project.latitude, project.longitude]}
            icon={createCustomIcon(project.type, project.status)}
            eventHandlers={{
              click: () => setSelectedLocation(project),
            }}
          />
        ))}

        {/* Render report markers */}
        {reports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={report.position || [report.latitude, report.longitude]}
            icon={createCustomIcon(report.type, report.status)}
            eventHandlers={{
              click: () => setSelectedLocation(report),
            }}
          />
        ))}

        {/* Popup for selected location */}
        {selectedLocation && (
          <Popup
            position={
              selectedLocation.position || [
                selectedLocation.latitude,
                selectedLocation.longitude,
              ]
            }
            onClose={() => setSelectedLocation(null)}
          >
            <Box sx={{ p: 1, minWidth: "200px" }}>
              <Typography variant="h6" gutterBottom>
                {selectedLocation.name || `Report #${selectedLocation.id}`}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLocation.description}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Type: {selectedLocation.type}
              </Typography>
              {selectedLocation.status && (
                <Typography variant="body2" gutterBottom>
                  Status:{" "}
                  <span
                    style={{
                      color:
                        selectedLocation.status === "completed"
                          ? "green"
                          : selectedLocation.status === "ongoing"
                          ? "orange"
                          : selectedLocation.status === "resolved"
                          ? "green"
                          : selectedLocation.status === "confirmed"
                          ? "orange"
                          : "blue",
                    }}
                  >
                    {selectedLocation.status}
                  </span>
                </Typography>
              )}
              {selectedLocation.timestamp && (
                <Typography variant="caption" color="text.secondary">
                  {selectedLocation.timestamp.toDate().toLocaleString()}
                </Typography>
              )}
            </Box>
          </Popup>
        )}
      </MapContainer>

      {/* Location Status Indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          bgcolor: "background.paper",
          p: 2,
          borderRadius: 1,
          boxShadow: 3,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {locationLoading ? (
          <>
            <CircularProgress size={20} />
            <Typography variant="body2">Getting your location...</Typography>
          </>
        ) : userLocation ? (
          <>
            <LocationOnIcon color="success" />
            <Typography variant="body2">Using your location</Typography>
          </>
        ) : (
          <>
            <LocationOnIcon color="error" />
            <Typography variant="body2">Location not available</Typography>
          </>
        )}
      </Box>

      {/* Report Issue Button */}
      <Button
        onClick={handleOpen}
        variant="contained"
        startIcon={<AddCircleIcon />}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 1000,
        }}
        disabled={!userLocation}
      >
        Report Issue
      </Button>

      {/* Get Location Button */}
      <Button
        onClick={getUserLocation}
        variant="outlined"
        startIcon={<GpsFixedIcon />}
        sx={{
          position: "absolute",
          top: 70,
          right: 20,
          zIndex: 1000,
        }}
      >
        Update My Location
      </Button>

      {/* Map legend */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 10,
          bgcolor: "background.paper",
          p: 2,
          borderRadius: 1,
          boxShadow: 3,
          zIndex: 1000,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Legend
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              bgcolor: "orange",
              mr: 1,
            }}
          />
          <Typography variant="body2">Ongoing Projects</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              bgcolor: "blue",
              mr: 1,
            }}
          />
          <Typography variant="body2">Planned Projects</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              bgcolor: "red",
              mr: 1,
            }}
          />
          <Typography variant="body2">Issues & Reports</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              bgcolor: "#4285F8",
              mr: 1,
            }}
          />
          <Typography variant="body2">Your Location</Typography>
        </Box>
      </Box>

      {/* Report Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="report-modal-title"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px", // Add padding for mobile
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}
        >
          <Typography
            id="report-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Report an Issue
          </Typography>

          {userLocation ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  p: 1,
                  bgcolor: "success.light",
                  borderRadius: 1,
                }}
              >
                <MyLocationIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Your report will use your current location
                </Typography>
              </Box>

              <Box
                component="form"
                onSubmit={handleReportSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth margin="normal">
                  <InputLabel>Issue Type</InputLabel>
                  <Select
                    value={reportForm.type}
                    label="Issue Type"
                    onChange={(e) =>
                      setReportForm({ ...reportForm, type: e.target.value })
                    }
                  >
                    <MenuItem value="congestion">Traffic Congestion</MenuItem>
                    <MenuItem value="hazard">Road Hazard</MenuItem>
                    <MenuItem value="outage">Power Outage</MenuItem>
                    <MenuItem value="sewage">Sewage Issue</MenuItem>
                    <MenuItem value="other">Other Issue</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  required
                  value={reportForm.description}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Please describe the issue in detail..."
                  margin="normal"
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{ mt: 2 }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <MyLocationIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Location Required
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                We need your location to submit a report. Please enable location
                services and try again.
              </Typography>
              <Button
                variant="contained"
                onClick={getUserLocation}
                startIcon={<GpsFixedIcon />}
                sx={{ mt: 2 }}
              >
                Enable Location
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default LiveMap;
