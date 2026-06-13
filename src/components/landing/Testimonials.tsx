import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "500k+", label: "Tasks Completed" },
    { value: "250k+", label: "Focus Sessions" },
    { value: "4.9/5", label: "User Rating" },
  ];

  const testimonials = [
    {
      text: "This app completely transformed how I manage my time. The Pomodoro timer with task integration is brilliant!",
      name: "Sarah Chen",
      role: "Product Designer",
      initials: "SC"
    },
    {
      text: "Finally, a productivity app that actually helps me focus. The analytics insights are incredibly valuable.",
      name: "Marcus Johnson",
      role: "Software Engineer",
      initials: "MJ"
    },
    {
      text: "The goal tracking and habit building features have made such a difference in my daily routine.",
      name: "Emma Rodriguez",
      role: "Project Manager",
      initials: "ER"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 max-w-5xl mx-auto text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Loved by 10,000+ users</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">See what people are saying about their productivity transformation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-card rounded-2xl shadow-sm p-6 border border-border flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-card-foreground mb-6 flex-grow">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-semibold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
