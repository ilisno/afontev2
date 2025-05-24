import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { XCircle } from 'lucide-react'; // Icon for cancel/error

const Cancel: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <XCircle size={64} className="text-red-500 mx-auto mb-4" /> {/* Cancel Icon */}
            <CardTitle className="text-2xl font-bold text-gray-800">Paiement Annulé</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Votre paiement a été annulé. Vous pouvez réessayer ou nous contacter si vous avez des questions.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent>
             {/* You can add a link back to the pricing page */}
            <a href="/tarifs" className="text-sbf-red hover:underline">Retour aux tarifs</a>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Cancel;