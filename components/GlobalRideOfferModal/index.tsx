import { useRideOffer } from "@/context/RideOfferContext";
import RideOfferModal from "../RideOffer";

/**
 * Global Ride Offer Modal Component
 *
 * This component renders the RideOfferModal using the RideOfferContext.
 * It's placed after all the bid-related providers to avoid context issues.
 */
export default function GlobalRideOfferModal() {
  const {
    isRideOfferModalVisible,
    currentOffer,
    hideRideOfferModal,
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
    isSkipLoading,
    isHideLoading,
  } = useRideOffer();

  return (
    <RideOfferModal
      visible={isRideOfferModalVisible}
      onClose={hideRideOfferModal}
      offer={currentOffer as any}
      bidable={currentOffer?.bidable || false}
      onAccept={acceptRideOffer}
      onSkipPrice={skipRideOfferPrice}
      onHide={hideRideOffer}
      isSkipLoading={isSkipLoading}
      isHideLoading={isHideLoading}
    />
  );
}
