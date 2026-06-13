import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTABanner: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-[#FFC5C5] to-[#ffdddd] text-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,white_0px,transparent_50%),radial-gradient(circle_at_80%_80%,white_0px,transparent_50%),radial-gradient(circle_at_40%_40%,white_0px,transparent_50%)]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles size={24} />
            <span className="text-lg font-medium">Ready to transform your productivity?</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Start your journey to
            <br />
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              peak productivity today
            </span>
          </h2>
          
          <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto leading-relaxed">
            Start with a focused workspace that keeps your core productivity data in one place.
            No credit card required, start for free in 30 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gray-900 text-white hover:bg-gray-800 font-semibold px-8 py-6 text-lg rounded-xl"
            >
              Start Free Today
              <ArrowRight size={20} className="ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl"
            >
              Watch Demo
            </Button>
          </div>
          
          <div className="mt-8 text-gray-700 text-sm">
            <span>✓ Free forever plan</span>
            <span className="mx-4">•</span>
            <span>✓ No setup required</span>
            <span className="mx-4">•</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
