import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button'; // Using shadcn Button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Using shadcn Card
import { DollarSign, Target, Clock, LineChart, Zap, Heart, Scale, Dumbbell } from 'lucide-react'; // Importing icons
import StrengthProgressChart from '@/components/StrengthProgressChart'; // Import the new chart component
import { useSession } from '@supabase/auth-helpers-react'; // Import useSession hook
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion components

const Index: React.FC = () => {
  const session = useSession(); // Get the user session

  // Determine the destination link based on session status
  const monEspaceLink = session ? "/mon-espace" : "/login";

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        {/* Main Heading and Subtitle */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Tes outils pour <br className="hidden md:block"/>
          <span className="bg-sbf-red text-white px-3 py-1 rounded-md inline-block mt-2 md:mt-0">
            transformer ton physique
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Obtenez votre programme de musculation personnalisé pour 10x moins cher qu'un coaching classique.
        </p>

        {/* Call To Action Button */}
        <Button
          asChild
          className="bg-sbf-red text-white hover:bg-sbf-yellow hover:text-sbf-red text-lg px-8 py-6 rounded-md font-semibold shadow-lg transition-colors duration-300 border-2 border-sbf-yellow"
        >
           <Link to="/programme">Créer mon programme gratuitement</Link>
        </Button>

        {/* Mon Espace Static Preview Section */}
        <section className="mt-16 w-full max-w-4xl text-center">
            {/* Title and description for the chart */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Suivez l'évolution de vos performances !
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Enregistrez vos performances, suivez l'évolution de vos charges et restez motivé avec votre historique d'entraînement.
            </p>

            {/* Title specifically for the chart */}
            <h3 className="text-2xl font-bold text-gray-800 mb-8">
                Tes performances après nous avoir rejoint
            </h3>

            {/* Add the animated chart here */}
            <div className="w-full max-w-3xl mx-auto mb-8">
                <StrengthProgressChart />
            </div>

             <div className="mt-8">
                <Button
                   asChild
                   className="bg-sbf-red text-white hover:bg-sbf-yellow hover:text-sbf-red text-lg px-8 py-6 rounded-md font-semibold shadow-lg transition-colors duration-300 border-2 border-sbf-yellow"
               >
                  <Link to={monEspaceLink}>Aller à Mon Espace</Link>
               </Button>
             </div>
        </section>


        {/* Separator Line */}
        <hr className="w-full max-w-4xl my-12 border-gray-300" />


        {/* Benefits Section 1 */}
        <section className="mt-16 w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Le coaching réinventé, c'est surtout
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6">
              <DollarSign size={40} className="text-sbf-red mb-3" />
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-gray-800 text-xl font-semibold">ÉCONOMISEZ GROS</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600">L'efficacité d'un pro, le prix en moins.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6">
              <Target size={40} className="text-sbf-red mb-3" />
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-gray-800 text-xl font-semibold">SUR MESURE TOTAL</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600">Un programme unique, fait pour vous.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6">
              <Clock size={40} className="text-sbf-red mb-3" />
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-gray-800 text-xl font-semibold">LIBERTÉ MAXIMALE</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600">Entraînez-vous où et quand vous voulez.</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-md flex flex-col items-center text-center p-6">
              <LineChart size={40} className="text-sbf-red mb-3" />
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-gray-800 text-xl font-semibold">RÉSULTATS VISIBLES</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600">Progressez plus vite grâce à un plan optimisé.</p>
              </CardContent>
            </Card>
          </div>
        </section>


        {/* Separator Line */}
        <hr className="w-full max-w-4xl my-12 border-gray-300" />


        {/* Benefits Section 2 - Life Improvement */}
        <section className="mt-16 w-full max-w-4xl text-left">
           <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
             Comment SmoothieBananeFraise va changer votre vie
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex items-start space-x-4">
               <Zap size={30} className="text-sbf-red flex-shrink-0 mt-1" />
               <div>
                 <p className="font-bold text-gray-800">Plus d'énergie au quotidien</p>
                 <p className="text-gray-600 text-sm">Un corps plus fort, c'est une vitalité décuplée pour affronter vos journées.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Heart size={30} className="text-sbf-red flex-shrink-0 mt-1" />
               <div>
                 <p className="font-bold text-gray-800">Meilleure santé globale</p>
                 <p className="text-gray-600 text-sm">Réduisez les risques de maladies et améliorez votre bien-être général.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Scale size={30} className="text-sbf-red flex-shrink-0 mt-1" />
               <div>
                 <p className="font-bold text-gray-800">Confiance en soi boostée</p>
                 <p className="text-gray-600 text-sm">Voir votre corps se transformer renforce votre estime et votre mental.</p>
               </div>
             </div>
             <div className="flex items-start space-x-4">
               <Dumbbell size={30} className="text-sbf-red flex-shrink-0 mt-1" />
               <div>
                 <p className="font-bold text-gray-800">Des résultats concrets et durables</p>
                 <p className="text-gray-600 text-sm">Suivez un plan structuré pour atteindre vos objectifs physiques efficacement.</p>
               </div>
             </div>
           </div>
        </section>

        {/* Separator Line */}
        <hr className="w-full max-w-4xl my-12 border-gray-300" />

        {/* FAQ Section */}
        <section className="mt-16 w-full max-w-3xl text-left">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Questions Fréquentes (FAQ)
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold text-gray-800">Comment fonctionne le générateur de programme ?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Notre générateur de programme utilise un algorithme avancé qui prend en compte vos objectifs, votre niveau d'expérience, le matériel disponible et le nombre de jours d'entraînement pour créer un plan sur mesure. <Link to="/programme" className="text-sbf-red hover:underline font-semibold">Essayez-le gratuitement ici !</Link>
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
              <AccordionTrigger className="text-lg font-semibold text-gray-800">Y a-t-il un essai gratuit ?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Oui, nous offrons un essai gratuit de 14 jours pour notre abonnement Premium. Vous pouvez générer votre programme et commencer à l'utiliser sans engagement. <Link to="/tarifs" className="text-sbf-red hover:underline font-semibold">Découvrez nos tarifs et l'essai gratuit ici.</Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-semibold text-gray-800">Comment puis-je annuler mon abonnement ?</AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Vous pouvez gérer et annuler votre abonnement à tout moment via le portail de facturation Stripe, accessible depuis votre espace personnel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Index;