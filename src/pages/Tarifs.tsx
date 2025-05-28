import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import StripePricingTable from '@/components/StripePricingTable'; // Import the new component
import { CheckCircle, Book, UserCheck, Phone, Apple, MessageSquare, Dumbbell, Scale } from 'lucide-react'; // Import additional icons

const Tarifs: React.FC = () => {
  const stripePricingTableId = "prctbl_1RSM4NFv5sEu2MuC6Ai0EYZG";
  const stripePublishableKey = "pk_live_51QICP2Fv5sEu2MuCHbDC5YqK9p95UIFyb2Q7LgGBeMAJ00XhFLjsEznrzslx0BALa8Bggu3Uo5j3BY3ohCkBEwWy004w6ontFa";

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Nos Tarifs</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Choisissez le plan qui correspond le mieux à vos objectifs.
            </CardDescriptionShadcn>
            {/* Added information about free trial and annual discount */}
            <p className="text-lg font-bold text-gray-800 mt-4">Essai gratuit de 14 jours inclus !</p>
            <p className="text-md text-gray-700 mt-1">Payez annuellement et économisez 18%.</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Use the new component */}
            <StripePricingTable
              pricingTableId={stripePricingTableId}
              publishableKey={stripePublishableKey}
            />

            {/* Detailed Plan Descriptions */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Abonnement Premium Card */}
              <Card className="bg-white shadow-md p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-bold text-gray-800">Abonnement Premium</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <Dumbbell size={20} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Changed icon */}
                      <span>Génération de programmes de musculation personnalisés illimitée.</span>
                    </li>
                     <li className="flex items-start space-x-2">
                      <CheckCircle size={20} className="text-sbf-red flex-shrink-0 mt-1" />
                      <span>Suivi de vos programmes et de votre progression semaine après semaine.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <MessageSquare size={20} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Changed icon */}
                      <span>Accès illimité au Coach Virtuel pour répondre à toutes vos questions avancées sur la musculation et la nutrition.</span>
                    </li>
                     <li className="flex items-start space-x-2">
                      <Scale size={20} className="text-sbf-red flex-shrink-0 mt-1" /> {/* Changed icon */}
                      <span>Suivi détaillé de vos performances (poids, répétitions) et de votre poids corporel.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Book size={20} className="text-sbf-red flex-shrink-0 mt-1" />
                      <span>Guide ultime gratuit sur la musculation et la nutrition (valeur 19€).</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Coaching Premium Card */}
              <Card className="bg-white shadow-md p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-bold text-gray-800">Coaching Premium 1 appel/semaine</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <UserCheck size={20} className="text-sbf-red flex-shrink-0 mt-1" />
                      <span>Coaching 100% personnalisé.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Phone size={20} className="text-sbf-red flex-shrink-0 mt-1" />
                      <span>Appel hebdomadaire de 45min avec un coach expérimenté.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Apple size={20} className="text-sbf-red flex-shrink-0 mt-1" />
                      <span>Suivi nutritionnel personnalisé.</span>
                    </li>
                     {/* Added a note about Premium features being included */}
                     <li className="flex items-start space-x-2 text-sm italic text-gray-500">
                       <CheckCircle size={16} className="text-gray-500 flex-shrink-0 mt-1" />
                       <span>Inclut toutes les fonctionnalités de l'Abonnement Premium.</span>
                     </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Tarifs;