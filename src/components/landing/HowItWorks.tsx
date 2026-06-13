
import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    { num: 1, title: "Plan your day", desc: "Organize tasks and set priorities for what matters most" },
    { num: 2, title: "Focus in Timed Sessions", desc: "Work distraction-free with customizable focus intervals" },
    { num: 3, title: "Track your Progress", desc: "Visualize your productivity patterns and celebrate wins" },
  ];

  return (
    <div className="px-6 md:px-12 lg:px-24 py-16 bg-secondary">
      <h2 className="text-2xl font-display font-bold text-center mb-12 text-foreground">How it works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, i) => (
          <motion.div 
            key={step.num}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
              {step.num}
            </div>
            <h3 className="font-display font-bold mb-2 text-foreground">{step.title}</h3>
            <p className="text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
