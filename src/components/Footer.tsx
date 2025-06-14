import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Instagram, Youtube, Link as LinkIcon } from 'lucide-react'; // Import Link as LinkIcon for TikTok
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

// Define schema for newsletter email validation
const newsletterFormSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
});

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

const Footer: React.FC = () => {
  const newsletterForm = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleNewsletterSubmit = async (values: NewsletterFormValues) => {
    console.log("Newsletter email submitted:", values.email);
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .insert([
          { email: values.email },
        ]);

      if (error) {
        console.error("Error subscribing to newsletter:", error);
        showError("Une erreur est survenue lors de l'inscription à la newsletter.");
      } else {
        showSuccess("Merci de votre inscription à la newsletter !");
        newsletterForm.reset(); // Clear the input field
      }
    } catch (err) {
      console.error("Unexpected error during newsletter subscription:", err);
      showError("Une erreur inattendue est survenue.");
    }
  };

  return (
    <footer className="bg-gray-800 text-gray-300 p-8 mt-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Logo and Copyright */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Link to="/" className="mb-4">
            <img src="/logo.png" alt="àFonte coaching logo" className="h-12 w-auto" />
          </Link>
          <p className="text-sm">&copy; {new Date().getFullYear()} àFonte.</p>
          <p className="text-sm">Tous droits réservés.</p>
        </div>

        {/* Column 2: About Links */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold text-white mb-4">À Propos</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white text-gray-400">Accueil</Link></li>
            <li><Link to="/confidentialite" className="hover:text-white text-gray-400">Confidentialité</Link></li>
            <li><Link to="/mentions-legales" className="hover:text-white text-gray-400">Mentions Légales</Link></li>
            <li><Link to="/a-propos" className="hover:text-white text-gray-400">À Propos</Link></li>
            <li><Link to="/faq" className="hover:text-white text-gray-400">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-white text-gray-400">Contact</Link></li>
            <li><Link to="/cgv" className="hover:text-white text-gray-400">CGV</Link></li>
          </ul>
        </div>

        {/* Column 3: Program Links */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Programmes</h3>
          <ul className="space-y-2">
            <li><Link to="/programme" className="hover:text-white text-gray-400">Générateur de programme</Link></li>
            <li><Link to="/mon-espace" className="hover:text-white text-gray-400">Mon Espace</Link></li>
            <li><Link to="/tarifs" className="hover:text-white text-gray-400">Tarifs</Link></li>
          </ul>
        </div>

        {/* Column 4: Newsletter & Social Media */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Notre Newsletter</h3>
          <p className="text-sm text-gray-400 mb-4">
            Nous vous tenons au courant de nos dernières actualités et conseils.
          </p>
          <Form {...newsletterForm}>
            <form onSubmit={newsletterForm.handleSubmit(handleNewsletterSubmit)} className="flex space-x-2 mb-6">
              <FormField
                control={newsletterForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Entrez votre email ici"
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-afonte-red"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" className="bg-afonte-red hover:bg-red-700 text-white">
                <Send size={20} />
              </Button>
            </form>
          </Form>

          <h3 className="text-lg font-semibold text-white mb-4">Suivez-nous</h3>
          <div className="flex justify-center md:justify-start space-x-4">
            <a href="https://www.instagram.com/afonte.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
              <Instagram size={24} />
            </a>
            <a href="https://www.youtube.com/@AFonte_fr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
              <Youtube size={24} />
            </a>
            <a href="https://www.tiktok.com/@afonte.fr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
              <LinkIcon size={24} /> {/* Using LinkIcon for TikTok */}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;