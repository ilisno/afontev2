import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const APropos: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">À Propos de Nous</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Notre mission et notre vision pour votre transformation physique.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-lg max-w-none mx-auto text-gray-800">
              <p>Bienvenue chez àFonte, votre partenaire dédié à la transformation physique et à l'optimisation de vos performances en musculation.</p>
              <p>Nous croyons que chacun mérite un programme d'entraînement adapté à ses objectifs, son niveau et son matériel disponible, sans avoir à dépenser une fortune en coaching traditionnel.</p>
              <p>Notre plateforme combine l'expertise de coachs expérimentés avec la puissance de l'intelligence artificielle pour vous offrir des programmes sur mesure, un suivi de progression intuitif et un coach virtuel toujours disponible pour répondre à vos questions.</p>
              <p>Rejoignez la communauté àFonte et commencez dès aujourd'hui votre parcours vers une meilleure version de vous-même !</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default APropos;