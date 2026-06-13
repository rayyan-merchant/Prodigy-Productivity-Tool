
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="px-6 md:px-12 lg:px-24 py-16 text-center relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-soft/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-soft/20 rounded-full blur-2xl"></div>
      <div className="absolute top-60 left-40 w-20 h-20 bg-brand-soft/20 rounded-full blur-xl"></div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-6 text-foreground"
      >
        Take Control Of Your Time.
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xl mb-4 text-foreground font-medium"
      >
        Track, Focus, and Achieve more with less stress
      </motion.p>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-2xl mx-auto mb-8 text-muted-foreground"
      >
        Turn chaos into clarity with our task management system.
        <br className="hidden sm:block" />
        Set meaningful goals, work in focused sessions, and watch your productivity soar.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <Button 
          onClick={() => navigate('/auth')} 
          className="rounded-full bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Start your Journey
        </Button>
      </motion.div>
    </div>
  );
};

export default Hero;
