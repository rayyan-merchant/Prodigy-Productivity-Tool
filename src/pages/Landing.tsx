
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import FeaturePreview from '@/components/landing/FeaturePreview';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import useForceLightMode from '@/hooks/useForceLightMode';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
  viewport: { once: true, margin: "-100px" }
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Force light mode for landing page
  useForceLightMode();

  return (
    <div className="bg-background min-h-screen text-foreground overflow-x-hidden">
      <Header />
      
      <motion.div {...fadeInUp}>
        <Hero />
      </motion.div>
      
      <motion.div {...fadeInUp}>
        <HowItWorks />
      </motion.div>
      
      <motion.div {...fadeInUp}>
        <FeaturePreview />
      </motion.div>
      
      <motion.div {...fadeInUp}>
        <Testimonials />
      </motion.div>
      
      <motion.div {...fadeInUp}>
        <FAQ />
      </motion.div>
      
      <motion.div {...fadeInUp}>
        <CTABanner />
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default Landing;
