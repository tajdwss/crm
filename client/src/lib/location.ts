// Location utilities for geolocation tracking

export interface LocationData {
  latitude: string;
  longitude: string;
  address?: string;
}

export interface LocationResult {
  success: boolean;
  data?: LocationData;
  error?: string;
}

// Get current location with address resolution
export const getCurrentLocation = (): Promise<LocationResult> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: "Geolocation is not supported by this browser"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toString();
        const longitude = position.coords.longitude.toString();
        
        try {
          // Attempt to get address from coordinates
          const address = await getAddressFromCoordinates(latitude, longitude);
          resolve({
            success: true,
            data: {
              latitude,
              longitude,
              address
            }
          });
        } catch (error) {
          // Even if address lookup fails, return coordinates
          resolve({
            success: true,
            data: {
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`
            }
          });
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        resolve({
          success: false,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Reverse geocoding to get address from coordinates
const getAddressFromCoordinates = async (latitude: string, longitude: string): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TAJ-CRM-Location-Service'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }
    
    throw new Error('Address not found');
  } catch (error) {
    // Fallback to coordinates if geocoding fails
    return `${latitude}, ${longitude}`;
  }
};

// Format location for display
export const formatLocation = (latitude?: string, longitude?: string, address?: string): string => {
  if (address && address !== `${latitude}, ${longitude}`) {
    return address;
  }
  
  if (latitude && longitude) {
    return `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
  }
  
  return 'Location not available';
};

// Generate Google Maps link from coordinates
export const generateMapsLink = (latitude?: string, longitude?: string): string => {
  if (!latitude || !longitude) return '';
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

// Calculate distance between two coordinates (in km)
export const calculateDistance = (
  lat1: string, 
  lon1: string, 
  lat2: string, 
  lon2: string
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
  const dLon = (parseFloat(lon2) - parseFloat(lon1)) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(parseFloat(lat1) * Math.PI / 180) * Math.cos(parseFloat(lat2) * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};