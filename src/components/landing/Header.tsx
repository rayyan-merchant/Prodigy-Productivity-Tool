
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import BrandLogo from '@/components/BrandLogo';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="px-6 py-4 md:px-12 lg:px-24 flex justify-between items-center">
      <BrandLogo />
      <Button 
        onClick={() => navigate('/auth')} 
        className="rounded-full bg-primary hover:bg-primary/90 text-white px-6 font-semibold"
      >
        SIGN IN
      </Button>
    </nav>
  );
};

export default Header;
