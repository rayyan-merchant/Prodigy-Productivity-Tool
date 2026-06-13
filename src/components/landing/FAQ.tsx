
import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FAQ = () => {
  const faqs = [
    {
      question: "How does the Pomodoro technique work?",
      answer: "The Pomodoro Technique is a time management method that uses a timer to break work into intervals, typically 25 minutes in length, separated by short breaks. These intervals are known as 'pomodoros'. After four pomodoros, you take a longer break of about 15-30 minutes."
    },
    {
      question: "Can I customize the timer duration?",
      answer: "Yes, you can customize both work and break durations in the settings. The default is 25 minutes for work and 5 minutes for breaks, but you can adjust these based on your preferences."
    },
    {
      question: "Is my data saved securely?",
      answer: "All your data is stored securely in our database with encryption. We do not share your personal information with third parties. Your privacy is important to us."
    },
    {
      question: "Can I use the app offline?",
      answer: "Currently, our web application requires an internet connection to function properly. However, we're working on an offline mode for future updates."
    },
    {
      question: "How do I manage my tasks?",
      answer: "Navigate to the Tasks section of the app where you can create, edit, and delete tasks. You can also mark them as complete, set priorities, and organize them into categories."
    }
  ];

  return (
    <section className="py-16 bg-secondary">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-display font-bold text-center mb-12 text-foreground">Frequently Asked Questions</h2>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <FAQItem question={faq.question} answer={faq.answer} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-border rounded-lg overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between bg-card p-4 text-left font-medium text-card-foreground focus:outline-none">
        <span>{question}</span>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 group",
          isOpen ? "bg-primary/10" : "hover:bg-primary/10"
        )}>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform duration-200",
            isOpen ? "transform rotate-180 text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-card p-4 pt-0 text-muted-foreground border-t border-border">
        {answer}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FAQ;
