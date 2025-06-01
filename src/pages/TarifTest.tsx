import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CheckCircle, Book, UserCheck, Phone, Apple, MessageSquare, Dumbbell, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

// Define the structure for a pricing plan
interface PricingPlan {
  id: string;
  title: string;
  description: string;
  features: string[];
  monthlyPrice: number; // Stored as number for calculations
  monthlyPriceId: string; // Stripe Price ID for monthly
  annualPrice: number; // Stored as number for calculations
  annualPriceId: string; // Stripe Price ID for annual
  lifetimePrice?: number; // Optional for coaching plan
  lifetimePriceId?: string; // Optional for coaching plan
  isBestOffer?: boolean;
  trialDays?: number; // Number of trial days for this plan
}

const plans: PricingPlan[] = [
  {
    id: 'premium',
    title: "Abonnement Premium",
    description: "Accès illimité à toutes les fonctionnalités de génération de programmes, suivi de programme, coach virtuel et suivi des performances et du poids. On t'envoie aussi gratuitement le guide ultime pour tout savoir sur la musculation et la nutrition d'une valeur de 19€.",
    features: [
      "Génération de programmes de musculation personnalisés illimitée.",
      "Suivi de vos programmes et de votre progression semaine après semaine.",
      "Accès illimité au Coach Virtuel pour répondre à toutes vos questions avancées sur la musculation et la nutrition.",
      "Suivi détaillé de vos performances (poids, répétitions) et de votre poids corporel.",
      "Guide ultime gratuit sur la musculation et la nutrition (valeur 19€).",
    ],
    monthlyPrice: 9,
    monthlyPriceId: "price_1RSCkwFv5sEu2MuCGZDs5oIz",
    annualPrice: 89, // Given by user
    annualPriceId: "price_1RSCkwFv5sEu2MuCpcJEtpox",
    lifetimePrice: 199, // Given by user
    lifetimePriceId: "price_1RSCkwFv5sEu2MuCKtekdVuj",
    isBestOffer: true,
    trialDays: 14,
  },
  {
    id: 'coaching',
    title: "Coaching premium 1 appel/semaine",
    description: "Coaching 100% personnalisé appel hebdomadaire de 45min et un suivi nutritionnel par un coach expérimenté.",
    features: [
      "Coaching 100% personnalisé.",
      "Appel hebdomadaire de 45min avec un coach expérimenté.",
      "Suivi nutritionnel personnalisé.",
      "Inclut toutes les fonctionnalités de l'Abonnement Premium.",
    ],
    monthlyPrice: 99,
    monthlyPriceId: "price_1RSLtIFv5sEu2MuCmH0pgSb8",
    annualPrice: 899, // Given by user
    annualPriceId: "price_1RSLtIFv5sEu2MuC8suSHcLG",
    isBestOffer: false,
    trialDays: 0, // No trial for coaching
  },
];

// Calculate general discounts for the toggle buttons (using Premium plan as reference)
const premiumMonthlyPrice = plans[0].monthlyPrice;
const premiumAnnualPrice = plans[0].annualPrice;
const premiumLifetimePrice = plans[0].lifetimePrice;

const annualDiscountPercentage = Math.round(((premiumMonthlyPrice * 12 - premiumAnnualPrice) / (premiumMonthlyPrice * 12)) * 100);
// For lifetime, compare to 5 years (60 months) of monthly payments for a meaningful percentage
const lifetimeDiscountPercentage = premiumLifetimePrice ? Math.round(((premiumMonthlyPrice * 60 - premiumLifetimePrice) / (premiumMonthlyPrice * 60)) * 100) : 0;


const TarifsTest: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual' | 'one-time'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = useSession();
  const navigate = useNavigate();

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!session?.user?.id || !session?.user?.email) {
      showError("Veuillez vous connecter pour vous abonner.");
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure Stripe customer ID exists for the user
      let customerId = session.user.user_metadata?.stripe_customer_id;

      if (!customerId) {
        // If not found in session metadata, try fetching from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile for Stripe customer ID:", profileError);
          showError("Erreur lors de la récupération de votre profil.");
          setIsSubmitting(false);
          return;
        }
        customerId = profile?.stripe_customer_id;
      }

      if (!customerId) {
        // If still no customerId, invoke the Edge Function to create one
        console.log("No Stripe customer ID found, creating one via Edge Function...");
        const { data: customerData, error: customerError } = await supabase.functions.invoke('create-stripe-customer', {
          body: {
            userId: session.user.id,
            email: session.user.email,
          },
        });

        if (customerError) {
          console.error("Error creating Stripe customer:", customerError);
          showError("Impossible de créer votre compte Stripe. Veuillez réessayer.");
          setIsSubmitting(false);
          return;
        }
        customerId = customerData.customerId;
        showSuccess("Votre compte Stripe a été créé !");
      }

      if (!customerId) {
        showError("Impossible de récupérer ou créer l'ID client Stripe.");
        setIsSubmitting(false);
        return;
      }

      // Determine the price ID based on the selected billing period
      let priceId: string;
      if (billingPeriod === 'monthly') {
        priceId = plan.monthlyPriceId;
      } else if (billingPeriod === 'annual') {
        priceId = plan.annualPriceId;
      } else if (billingPeriod === 'one-time' && plan.lifetimePriceId) {
        priceId = plan.lifetimePriceId;
      } else {
        showError("Période de facturation non valide ou prix à vie non disponible pour ce plan.");
        setIsSubmitting(false);
        return;
      }

      // Call the new Edge Function to create a Stripe Checkout Session
      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: priceId,
          customerId: customerId,
          trialPeriodDays: plan.trialDays, // Trial days apply to both monthly and annual if set
          successUrl: window.location.origin + '/merci1', // Redirect after successful payment
          cancelUrl: window.location.origin + '/tariftest', // Redirect if payment is cancelled
        },
      });

      if (invokeError) {
        console.error("Error invoking create-checkout-session Edge Function:", invokeError);
        showError("Une erreur est survenue lors de la création de la session de paiement.");
      } else if (data && data.checkoutUrl) {
        console.log("Redirecting to Stripe Checkout:", data.checkoutUrl);
        window.location.href = data.checkoutUrl; // Redirect the user to Stripe Checkout
      } else {
        console.error("create-checkout-session Edge Function returned unexpected data:", data);
        showError("Réponse inattendue de l'API de paiement.");
      }

    } catch (error) {
      console.error("Unexpected error during subscription process:", error);
      showError("Une erreur inattendue est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Nos Tarifs (Test)</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Choisissez le plan qui correspond le mieux à vos objectifs.
            </CardDescriptionShadcn>
            <p className="text-lg font-bold text-gray-800 mt-4">Essai gratuit de 14 jours inclus !</p>
            <p className="text-md text-gray-700 mt-1">Payez annuellement et économisez 18%.</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Billing Period Toggle */}
            <div className="flex justify-center mb-8">
              <ToggleGroup
                type="single"
                value={billingPeriod}
                onValueChange={(value: 'monthly' | 'annual' | 'one-time') => {
                  if (value) setBillingPeriod(value);
                }}
                className="bg-gray-200 rounded-md p-1"
              >
                <ToggleGroupItem value="monthly" className="px-4 py-2 rounded-md data-[state=on]:bg-afonte-red data-[state=on]:text-white">
                  Mensuel
                </ToggleGroupItem>
                <ToggleGroupItem value="annual" className="px-4 py-2 rounded-md data-[state=on]:bg-afonte-red data-[state=on]:text-white">
                  Annuel (-{annualDiscountPercentage}%)
                </ToggleGroupItem>
                {/* Only show 'À vie' option if the current plan has a lifetime price */}
                {plans.some(p => p.lifetimePriceId) && (
                  <ToggleGroupItem value="one-time" className="px-4 py-2 rounded-md">
                    À vie (-{lifetimeDiscountPercentage}%)
                  </ToggleGroupItem>
                )}
              </ToggleGroup>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map((plan) => (
                <Card key={plan.id} className="bg-white shadow-md p-6 flex flex-col relative">
                  {plan.isBestOffer && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-afonte-yellow text-afonte-red text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Meilleure offre
                    </div>
                  )}
                  <CardHeader className="p-0 mb-4 text-center">
                    <CardTitle className="text-2xl font-bold text-gray-800">{plan.title}</CardTitle>
                    <CardDescriptionShadcn className="text-gray-600 mt-2">{plan.description}</CardDescriptionShadcn>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="text-center my-4">
                        {billingPeriod === 'monthly' && (
                          <span className="text-4xl font-bold text-gray-800">
                            {plan.monthlyPrice} €<span className="text-gray-600 text-xl"> / mois</span>
                          </span>
                        )}
                        {billingPeriod === 'annual' && (
                          <>
                            <span className="text-4xl font-bold text-gray-800">
                              {(plan.annualPrice / 12).toFixed(2).replace('.', ',')} €<span className="text-gray-600 text-xl"> / mois</span>
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Facturé {plan.annualPrice} € par an</p>
                            {plan.monthlyPrice * 12 > plan.annualPrice && (
                              <p className="text-sm text-afonte-red font-semibold">
                                Économisez {(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(0)} € par an !
                              </p>
                            )}
                          </>
                        )}
                        {billingPeriod === 'one-time' && plan.lifetimePrice && (
                          <span className="text-4xl font-bold text-gray-800">
                            {plan.lifetimePrice} €<span className="text-gray-600 text-xl"> (à vie)</span>
                          </span>
                        )}
                        {/* Display message if lifetime is not available for this plan */}
                        {billingPeriod === 'one-time' && !plan.lifetimePrice && (
                          <span className="text-xl font-bold text-gray-500">
                            Non disponible à vie
                          </span>
                        )}
                      </div>
                      <ul className="space-y-3 text-gray-700 text-left">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle size={20} className="text-afonte-red flex-shrink-0 mt-1" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isSubmitting || (billingPeriod === 'one-time' && !plan.lifetimePriceId)} // Disable if lifetime is selected but not available
                      className="w-full bg-afonte-red text-white hover:bg-red-700 text-lg py-6 mt-6"
                    >
                      {isSubmitting ? 'Chargement...' : (plan.trialDays && billingPeriod === 'monthly' ? 'Démarrer l\'essai' : 'M\'abonner')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TarifsTest;