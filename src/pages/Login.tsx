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

        // Check if the user's profile already has a Stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          showError("Erreur lors de la récupération de votre profil.");
          // Still navigate, but with a warning
          navigate('/mon-espace');
          return;
        }

        // If no Stripe customer ID exists for this user, create one
        if (!profile?.stripe_customer_id) {
          console.log("No Stripe customer ID found for user, attempting to create one...");
          try {
            const { data: customerData, error: invokeError } = await supabase.functions.invoke('create-stripe-customer', {
              body: {
                userId: session.user.id,
                email: session.user.email,
              },
            });

            if (invokeError) {
              console.error("Error invoking create-stripe-customer Edge Function:", invokeError);
              showError("Impossible de créer votre compte Stripe.");
            } else if (customerData && customerData.customerId) {
              console.log("Stripe customer created successfully:", customerData.customerId);
              showSuccess("Votre compte Stripe a été créé !");
              // The Edge Function itself updates the profile, so no need to do it here again.
            } else {
              console.error("create-stripe-customer Edge Function returned unexpected data:", customerData);
              showError("Réponse inattendue de l'API Stripe.");
            }
          } catch (err) {
            console.error("Unexpected error calling create-stripe-customer:", err);
            showError("Une erreur inattendue est survenue lors de la création du compte Stripe.");
          }
        } else {
          console.log("Stripe customer ID already exists for user:", profile.stripe_customer_id);
        }

        // Always redirect to Mon Espace after login/signup and Stripe customer check
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