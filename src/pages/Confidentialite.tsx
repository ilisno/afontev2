import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const Confidentialite: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Politique de Confidentialité</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Informations sur la collecte et l'utilisation de vos données personnelles.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-lg max-w-none mx-auto text-gray-800">
              <h2 className="text-xl font-bold mb-2">Collecte des données personnelles</h2>
              <p>Nous collectons les informations que vous nous fournissez directement, notamment lorsque vous utilisez notre générateur de programme (votre email), ou lorsque vous interagissez avec notre coach virtuel (votre email et vos messages).</p>
              <p>Ces données sont utilisées pour vous fournir nos services, améliorer votre expérience et, si vous y consentez, vous envoyer des communications pertinentes.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Utilisation des données</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul>
                <li>Générer et enregistrer vos programmes d'entraînement.</li>
                <li>Permettre l'interaction avec le coach virtuel.</li>
                <li>Améliorer nos services et personnaliser votre expérience.</li>
                <li>Vous envoyer des informations sur nos produits et services, si vous avez donné votre accord.</li>
              </ul>

              <h2 className="text-xl font-bold mt-6 mb-2">Partage des données</h2>
              <p>Nous ne partageons pas vos données personnelles avec des tiers, sauf si cela est nécessaire pour la fourniture de nos services (ex: hébergeur, service de paiement sécurisé) ou si la loi l'exige.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Vos droits</h2>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression, de limitation du traitement, d'opposition et de portabilité de vos données personnelles. Pour exercer ces droits, veuillez nous contacter à equipe@afonte.fr.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Confidentialite;