import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const Merci2: React.FC = () => {
  const emailAddress = "equipe@smoothiebananefraise.fr";
  const subject = "Mon coaching personnalisé - Prise de contact";
  const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Merci pour votre achat !</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Votre paiement pour le coaching personnalisé a été effectué avec succès.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Félicitations pour avoir choisi le coaching personnalisé ! Pour commencer, veuillez nous envoyer un email à l'adresse ci-dessous en expliquant votre situation actuelle, vos objectifs, votre expérience et tout autre détail pertinent.
            </p>
            <p className="text-gray-800 font-semibold">
              Email : <a href={mailtoLink} className="text-sbf-red hover:underline">{emailAddress}</a>
            </p>
            <Button asChild className="w-full bg-sbf-red text-white hover:bg-red-700 text-lg py-6">
              <a href={mailtoLink}>Envoyer mon email de contact</a>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Merci2;