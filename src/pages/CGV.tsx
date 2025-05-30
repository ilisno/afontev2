import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const CGV: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Conditions Générales de Vente (CGV)</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Informations relatives à l'achat de nos services.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-lg max-w-none mx-auto text-gray-800">
              <h2 className="text-xl font-bold mb-2">Article 1 – Objet</h2>
              <p>Les présentes conditions générales de vente régissent les ventes de programmes de musculation personnalisés sous forme d’abonnements mensuels sur le site smoothiebananefraise.fr.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 2 – Prestations proposées</h2>
              <p>L’utilisateur achète un accès personnalisé à un programme d’entraînement en ligne généré automatiquement selon les informations fournies.</p>
              <p>Le service est exclusivement numérique et accessible via un espace dédié ou par email.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 3 – Prix</h2>
              <p>Les prix sont indiqués en euros, toutes taxes comprises.</p>
              <p>Iliane Snoussi étant micro-entrepreneur, la TVA n’est pas applicable selon l’article 293 B du CGI.</p>
              <p>Le prix est celui affiché au moment de la commande.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 4 – Modalités de paiement</h2>
              <p>Le paiement s’effectue par carte bancaire via une solution sécurisée (ex : Stripe).</p>
              <p>Le paiement est exigible immédiatement à la commande.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 5 – Livraison</h2>
              <p>Les programmes sont livrés sous forme numérique dans un délai de 24 à 48 heures après validation de la commande, par email ou via un espace personnel.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 6 – Droit de rétractation</h2>
              <p>Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux contenus numériques fournis immédiatement après l’achat et sans support matériel.</p>
              <p>Le client renonce expressément à son droit de rétractation en validant sa commande.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 7 – Responsabilité</h2>
              <p>Iliane Snoussi ne saurait être tenu responsable d’une mauvaise utilisation du programme ou de résultats non conformes aux attentes.</p>
              <p>Les conseils dispensés ne remplacent en aucun cas l’avis d’un professionnel de santé.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 8 – Données personnelles</h2>
              <p>Les données collectées sont utilisées uniquement pour la gestion des commandes et ne sont jamais revendues.</p>
              <p>Conformément au RGPD, vous disposez d’un droit d’accès, de modification et de suppression de vos données.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Article 9 – Loi applicable</h2>
              <p>Les présentes CGV sont soumises au droit français. En cas de litige, une tentative de résolution amiable sera privilégiée.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CGV;