
import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturePreview: React.FC = () => {
  return (
    <div className="px-6 md:px-12 lg:px-24 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-2xl shadow-md p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-card-foreground">Productivity Trend</h3>
          <Calendar className="text-primary" size={20} />
        </div>
        <div className="h-40 flex items-end space-x-2">
          {[
            { day: "Mon", height: "40%" },
            { day: "Tue", height: "25%" },
            { day: "Wed", height: "35%" },
            { day: "Thu", height: "75%", highlight: true },
            { day: "Fri", height: "60%" },
            { day: "Sat", height: "45%" },
            { day: "Sun", height: "70%" }
          ].map((item) => (
            <div key={item.day} className="flex flex-col items-center flex-1">
              <div 
                className={`w-full rounded-t ${item.highlight ? 'bg-primary/20' : 'bg-transparent'}`}
                style={{ height: item.height }}
              ></div>
              <span className="text-xs mt-2 text-muted-foreground">{item.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-card rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border border-border"
      >
        <div className="w-40 h-40 rounded-full border-8 border-primary/20 border-t-primary relative flex items-center justify-center">
          <div className="text-2xl font-display font-bold text-card-foreground">25:00</div>
          <div className="absolute -bottom-3 bg-card px-2">
            <span className="text-primary text-sm font-bold">FOCUS</span>
          </div>
        </div>
      </motion.div>

      {/* Tasks */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card rounded-2xl shadow-md p-6 flex flex-col justify-center border border-border"
      >
        <div className="space-y-4">
          <button className="bg-primary text-white py-2 px-4 rounded-full w-full hover:bg-primary/90 transition-colors font-medium">
            Complete Project
          </button>
          <button className="bg-secondary text-secondary-foreground py-2 px-4 rounded-full w-full hover:bg-secondary/80 transition-colors">
            Manage Tasks
          </button>
          <button className="bg-secondary text-secondary-foreground py-2 px-4 rounded-full w-full hover:bg-secondary/80 transition-colors">
            Increase Productivity
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FeaturePreview;
