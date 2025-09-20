import React, { useEffect } from 'react';

const NutrimuscleRedirect: React.FC = () => {
  useEffect(() => {
    // The target URL for Nutrimuscle
    const targetUrl = 'https://nmsquad.link/00Lf7';
    console.log(`Redirecting to: ${targetUrl}`);
    // Using window.location.replace to prevent the redirect page from being in the browser history
    window.location.replace(targetUrl);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center justify-center p-4">
      <p className="text-lg text-gray-700">Redirection vers Nutrimuscle en cours...</p>
      <p className="text-sm text-gray-500 mt-2">Si la redirection ne fonctionne pas, cliquez <a href="https://nmsquad.link/00Lf7" className="text-afonte-red hover:underline">ici</a>.</p>
    </div>
  );
};

export default NutrimuscleRedirect;