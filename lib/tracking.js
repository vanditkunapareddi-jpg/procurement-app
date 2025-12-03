// Utility to build a tracking URL for common carriers.
export const getTrackingUrl = (carrier, trackingNumber) => {
  if (!trackingNumber) return null;
  const normalized = (carrier || "").toLowerCase();

  switch (normalized) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
    case "fedex":
    case "fedex express":
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
    case "dhl":
    case "dhl express":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${encodeURIComponent(trackingNumber)}`;
    default:
      // Fallback to a Google search if we don't have a specific URL
      return `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}+tracking`;
  }
};
