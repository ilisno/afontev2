import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const Tarifs: React.FC = () => {
  // Get the current origin dynamically
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg"> {/* Adjust max-w as needed for the table */}
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Nos Tarifs</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Choisissez le plan qui correspond le mieux à vos objectifs.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            {/* Stripe Pricing Table */}
            {/* The script for this custom element is added in index.html */}
            <stripe-pricing-table
              pricing-table-id="prctbl_1RSM4NFv5sEu2MuC6Ai0EYZG"
              publishable-key="pk_live_51QICP2Fv5sEu2MuCHbDC5YqK9p95UIFyb2Q7LgGBeMAJ00XhFLjsEznrzslx0BALa8Bggu3Uo5j3BY3ohCkBEwWy004w6ontFa"
              success-url={`${currentOrigin}/success`} {/* Add success URL */}
              cancel-url={`${currentOrigin}/tarifs`} {/* Add cancel URL (redirect back to tarifs) */}
            >
            </stripe-pricing-table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Tarifs;