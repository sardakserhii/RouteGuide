/**
 * Geolocation service for browser-based location access
 * Provides a promise-based wrapper around the Geolocation API
 */

/**
 * Error codes returned by geolocation API
 */
export const GeolocationErrorCode = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
  NOT_SUPPORTED: 'NOT_SUPPORTED',
};

/**
 * Get user-friendly error message based on error code
 * @param {number|string} code - Error code from geolocation API
 * @returns {string} User-friendly error message
 */
export function getGeolocationErrorMessage(code) {
  switch (code) {
    case GeolocationErrorCode.PERMISSION_DENIED:
      return 'Permission denied. Please allow location access in your browser settings.';
    case GeolocationErrorCode.POSITION_UNAVAILABLE:
      return 'Position unavailable. Please check your device location settings.';
    case GeolocationErrorCode.TIMEOUT:
      return 'Request timeout. Please try again.';
    case GeolocationErrorCode.NOT_SUPPORTED:
      return 'Geolocation is not supported by your browser.';
    default:
      return 'Unable to get your location. Please try again.';
  }
}

/**
 * Get current device location using browser Geolocation API
 * @param {object} options - Geolocation options
 * @param {boolean} options.enableHighAccuracy - Use high accuracy mode
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.maximumAge - Maximum cached position age
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentLocation(options = {}) {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 0, // Don't use cached position
  };

  const geolocationOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject({
        code: GeolocationErrorCode.NOT_SUPPORTED,
        message: getGeolocationErrorMessage(GeolocationErrorCode.NOT_SUPPORTED),
      });
      return;
    }

    // Request current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
          originalError: error,
        });
      },
      geolocationOptions
    );
  });
}
