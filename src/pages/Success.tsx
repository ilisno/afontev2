import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react'; // Icon for success

const Success: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" /> {/* Success Icon */}
            <CardTitle className="text-2xl font-bold text-gray-800">Paiement Réussi !</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Merci pour votre achat. Votre compte a été mis à jour.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent>
            {/* You can add a link back to the home page or Mon Espace */}
            <a href="/" className="text-sbf-red hover:underline">Retour à l'accueil</a>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Success;