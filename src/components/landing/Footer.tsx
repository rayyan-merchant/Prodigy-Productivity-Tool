
import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';

const Footer: React.FC = () => {
  return (
    <footer className="px-6 md:px-12 lg:px-24 py-12 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-6 md:mb-0">
          <BrandLogo className="mb-4" />
        </div>
        <div className="flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0 text-sm text-muted-foreground">
           <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
           <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
           <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          <span>&copy; {new Date().getFullYear()} Prodigy</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
