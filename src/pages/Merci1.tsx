import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const Merci1: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Merci pour votre achat !</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Votre paiement a été effectué avec succès.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Vous avez maintenant accès à nos outils pour vous aider à transformer votre physique.
            </p>
            <div className="flex flex-col space-y-4">
              <Button asChild className="w-full bg-afonte-red text-white hover:bg-red-700 text-lg py-6">
                <Link to="/programme">Générer mon premier programme</Link>
              </Button>
              <Button asChild variant="outline" className="w-full text-gray-800 border-gray-300 hover:bg-gray-200 text-lg py-6">
                <Link to="/coach-virtuel">Accéder au Coach Virtuel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Merci1;