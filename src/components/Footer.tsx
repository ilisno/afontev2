import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 p-6 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} SmoothieBananeFraise. Tous droits réservés.</p>
        <div className="mt-2">
          <Link to="/mentions-legales" className="text-gray-400 hover:text-white mx-2">Mentions Légales</Link>
          <Link to="/cgv" className="text-gray-400 hover:text-white mx-2">CGV</Link> {/* Added CGV link */}
          {/* Add social media links here */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;