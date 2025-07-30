import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast'; // Import toast utilities

// Manually defined French translations
const frenchTranslations = {
  sign_in: {
    email_label: 'Adresse e-mail',
    password_label: 'Mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    password_input_placeholder: 'Votre mot de passe',
    button_label: 'Se connecter',
    loading_button_label: 'Connexion en cours...',
    link_text: 'Vous avez déjà un compte ? Connectez-vous',
  },
  sign_up: {
    email_label: 'Adresse e-mail',
    password_label: 'Mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    password_input_placeholder: 'Votre mot de passe',
    button_label: "S'inscrire",
    loading_button_label: 'Inscription en cours...',
    link_text: "Pas encore de compte ? Inscrivez-vous",
    first_name_label: 'Prénom',
    first_name_input_placeholder: 'Votre prénom',
    last_name_label: 'Nom',
    last_name_input_placeholder: 'Votre nom',
    confirmation_text: 'Vérifiez votre e-mail pour le lien de confirmation',
  },
  magic_link: {
    email_input_label: 'Adresse e-mail',
    email_input_placeholder: 'Votre adresse e-mail',
    phone_input_label: 'Numéro de téléphone',
    phone_input_placeholder: 'Votre numéro de téléphone',
    token_input_label: 'Code OTP',
    token_input_placeholder: 'Votre code OTP',
    button_label: 'Envoyer un lien magique',
    loading_button_label: 'Envoi en cours...',
    link_text: 'Connexion par lien magique',
  },
  forgotten_password: {
    email_label: 'Adresse e-mail',
    password_label: 'Nouveau mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    button_label: 'Réinitialiser le mot de passe',
    loading_button_label: 'Réinitialisation...',
    link_text: 'Mot de passe oublié ?',
  },
  update_password: {
    password_label: 'Nouveau mot de passe',
    password_input_placeholder: 'Votre nouveau mot de passe',
    button_label: 'Mettre à jour le mot de passe',
    loading_button_label: 'Mise à jour...',
  },
  verify_otp: {
    email_input_label: 'Adresse e-mail',
    email_input_placeholder: 'Votre adresse e-mail',
    phone_input_label: 'Numéro de téléphone',
    phone_input_placeholder: 'Votre numéro de téléphone',
    token_input_label: 'Code OTP',
    token_input_placeholder: 'Votre code OTP',
    button_label: 'Vérifier le code OTP',
    loading_button_label: 'Vérification...',
  },
  // Added common translations for messages like errors
  common: {
    email_not_confirmed: 'Email pas encore confirmé',
    // Add other common messages here if needed
    // e.g., 'invalid_credentials': 'Identifiants invalides',
  },
};


function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // If a session exists (user is logged in), proceed with logic
      if (session) {
        console.log("Auth state changed: User signed in or updated.", _event, session);

        // --- START: Direct email insertion into subscriber tables (without onConflict) ---
        if (session.user.email) {
          console.log(`Attempting to insert email ${session.user.email} into email_subscribers and email_subscribers_2.`);
          
          // Insert into email_subscribers
          const { error: subError1 } = await supabase
            .from('email_subscribers')
            .insert({ email: session.user.email });

          if (subError1) {
            if (subError1.code === '23505') { // Unique constraint violation
              console.log("Email already exists in email_subscribers, doing nothing.");
            } else {
              console.error("Error inserting email into email_subscribers:", subError1);
            }
          } else {
            console.log("Email inserted successfully into email_subscribers.");
          }

          // Insert into email_subscribers_2
          const { error: subError2 } = await supabase
            .from('email_subscribers_2')
            .insert({ email: session.user.email });

          if (subError2) {
            if (subError2.code === '23505') { // Unique constraint violation
              console.log("Email already exists in email_subscribers_2, doing nothing.");
            } else {
              console.error("Error inserting email into email_subscribers_2:", subError2);
            }
          } else {
            console.log("Email inserted successfully into email_subscribers_2.");
          }
        }
        // --- END: Direct email insertion ---

        // Removed Stripe customer creation logic
        // No longer need to check for or create Stripe customer ID as app is free.

        // Always redirect to Mon Espace after login/signup
        navigate('/mon-espace');
      }
    });

    // Cleanup the subscription on component unmount
    return () => subscription.unsubscribe();
  }, [navigate]); // Depend on navigate to avoid lint warnings

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Connexion / Inscription</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers for simplicity
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--afonte-red))', // Use your custom red color
                    brandAccent: 'hsl(var(--afonte-yellow))', // Use your custom yellow color
                    anchor: 'hsl(var(--afonte-red))', // Make links red
                  },
                },
              },
            }}
            theme="light" // Use light theme
            redirectTo={window.location.origin + '/mon-espace'} // Changed redirection path for Auth UI
            localization={{
              variables: frenchTranslations,
            }}
            data-attributes={{
              first_name: 'first_name',
              last_name: 'last_name',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;