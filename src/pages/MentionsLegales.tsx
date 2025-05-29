import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";

const MentionsLegales: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Mentions Légales</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Informations légales concernant le site àFonte.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-lg max-w-none mx-auto text-gray-800">
              <h2 className="text-xl font-bold mb-2">Éditeur du site</h2>
              <p><strong>Nom :</strong> Iliane Snoussi</p>
              <p><strong>Statut :</strong> Micro-entrepreneur</p>
              <p><strong>Adresse :</strong> Rue d'Yerres 91230 Montgeron</p>
              <p><strong>Email :</strong> equipe@afonte.fr</p>
              <p><strong>Téléphone :</strong> [à compléter]</p>
              <p><strong>SIRET :</strong> [à compléter une fois la micro-entreprise créée]</p>
              <p><strong>TVA intracommunautaire :</strong> non applicable, article 293 B du CGI</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Responsable de la publication</h2>
              <p>Iliane Snoussi</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Hébergement du site</h2>
              <p><strong>Nom de l’hébergeur :</strong> Vercel Inc.</p>
              <p><strong>Raison sociale :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p><strong>Site :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-sbf-red hover:underline">https://vercel.com</a></p>

              <h2 className="text-xl font-bold mt-6 mb-2">Propriété intellectuelle</h2>
              <p>Tous les éléments du site àfonte.fr (textes, images, vidéos, logo, etc.) sont la propriété exclusive d’Iliane Snoussi, sauf mention contraire.</p>
              <p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.</p>

              <h2 className="text-xl font-bold mt-6 mb-2">Utilisation de contenus tiers</h2>
              <p>Les images, illustrations ou textes provenant de sources externes sont utilisées avec les droits nécessaires. Les crédits sont précisés lorsqu'ils ne relèvent pas de ma propriété.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MentionsLegales;