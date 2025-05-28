import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Questions Fréquentes (FAQ)</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Trouvez les réponses à vos questions sur nos services.
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold text-gray-800">Comment fonctionne le générateur de programme ?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Notre générateur de programme utilise un algorithme avancé qui prend en compte vos objectifs, votre niveau d'expérience, le matériel disponible et le nombre de jours d'entraînement pour créer un plan sur mesure.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold text-gray-800">Le coach virtuel est-il un vrai coach ?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Le coach virtuel est une intelligence artificielle entraînée pour vous donner des conseils de musculation et de nutrition. Il est disponible 24h/24 et 7j/7 pour répondre à vos questions. Pour un coaching humain et personnalisé, consultez nos offres de coaching premium.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold text-gray-800">Puis-je suivre ma progression ?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Oui, dans votre espace personnel, vous pouvez enregistrer vos performances pour chaque séance et suivre l'évolution de vos charges et de votre poids corporel au fil du temps.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-semibold text-gray-800">Comment puis-je annuler mon abonnement ?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Vous pouvez gérer et annuler votre abonnement à tout moment via le portail de facturation Stripe, accessible depuis votre espace personnel.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;