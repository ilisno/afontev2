import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Mail, Phone } from 'lucide-react'; // Import icons

const Contact: React.FC = () => {
  const emailAddress = "equipe@smoothiebananefraise.fr";
  const phoneNumber = "[à compléter]"; // Placeholder for phone number

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Nous Contacter</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">
              Nous sommes là pour vous aider !
            </CardDescriptionShadcn>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Pour toute question, suggestion ou assistance, n'hésitez pas à nous contacter par email ou par téléphone.
            </p>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <Mail size={24} className="text-sbf-red" />
                <a href={`mailto:${emailAddress}`} className="text-sbf-red hover:underline text-lg font-semibold">
                  {emailAddress}
                </a>
              </div>
              {phoneNumber !== "[à compléter]" && ( // Only show phone if completed
                <div className="flex items-center space-x-2">
                  <Phone size={24} className="text-sbf-red" />
                  <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="text-sbf-red hover:underline text-lg font-semibold">
                    {phoneNumber}
                  </a>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Nous nous efforçons de répondre à toutes les demandes dans les plus brefs délais.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;