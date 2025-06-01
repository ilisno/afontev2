import React, { useEffect, useState } from 'react';

interface StripePricingTableProps {
  pricingTableId: string;
  publishableKey: string;
  customerEmail?: string; // Add this prop
}

const StripePricingTable: React.FC<StripePricingTableProps> = ({
  pricingTableId,
  publishableKey,
  customerEmail, // Destructure the new prop
}) => {
  const [clientReferenceId, setClientReferenceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Access window.endorsely_referral after the component mounts.
    // The Endorsely script in index.html should make this available.
    const referralId = (window as any).endorsely_referral as string | undefined;
    if (referralId) {
      console.log("Endorsely referral ID found:", referralId);
      setClientReferenceId(referralId);
    } else {
      console.log("No Endorsely referral ID found on window.endorsely_referral.");
    }
  }, []); // Empty dependency array means this runs once after the initial render

  // Render the custom element. React handles rendering custom elements.
  // Attributes are passed as strings.
  // We use conditional spread syntax to add client-reference-id and customer-email only if they exist.
  return (
    <div className="stripe-pricing-table-container">
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        {...(clientReferenceId && { 'client-reference-id': clientReferenceId })}
        {...(customerEmail && { 'customer-email': customerEmail })}
      >
      </stripe-pricing-table>
    </div>
  );
};

export default StripePricingTable;