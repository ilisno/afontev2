import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const UpgradeToPremium: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Débloquez des programmes illimités !</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Vous avez déjà généré un programme gratuit avec cet email.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Pour générer plus de programmes personnalisés, suivre votre progression et accéder à toutes nos fonctionnalités, abonnez-vous à notre plan Premium.
            </p>
            <p className="text-lg font-semibold text-afonte-red">
              Profitez d'un essai gratuit de 14 jours !
            </p>
            <Button asChild className="w-full bg-afonte-red text-white hover:bg-red-700 text-lg py-6">
              <Link to="/tarifs">Voir les tarifs et commencer l'essai</Link>
            </Button>
            <Button asChild variant="link" className="w-full text-gray-800 hover:underline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default UpgradeToPremium;