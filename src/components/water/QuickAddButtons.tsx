import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CupSoda, GlassWater, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface QuickAddButtonsProps {
  onAdd: (amount: number) => void;
  isLoading?: boolean;
}

const presets = [
  { label: '250 ml', amount: 250, icon: GlassWater },
  { label: '500 ml', amount: 500, icon: CupSoda },
  { label: '1 L', amount: 1000, icon: CupSoda },
];

const QuickAddButtons: React.FC<QuickAddButtonsProps> = ({ onAdd, isLoading }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomAdd = () => {
    const amount = Number(customAmount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 2_000) {
      toast.error('Enter a whole number from 1 to 2,000 ml');
      return;
    }
    if (amount > 1_500) toast.warning('That is an unusually large single entry. Confirm the amount is correct.');
    onAdd(amount);
    setCustomAmount('');
    setShowCustom(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset, index) => (
          <motion.div key={preset.amount} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Button variant="outline" className="flex h-16 w-full flex-col gap-1" onClick={() => onAdd(preset.amount)} disabled={isLoading}>
              <preset.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{preset.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
      {showCustom ? (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-2">
          <Input type="number" aria-label="Custom water amount in milliliters" placeholder="Amount in ml" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleCustomAdd()} min={1} max={2_000} className="min-w-0 flex-1" />
          <Button onClick={handleCustomAdd} disabled={!customAmount || isLoading} size="sm">Add</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}>Cancel</Button>
        </motion.div>
      ) : (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowCustom(true)}>
          <Plus className="mr-1 h-4 w-4" />Custom amount
        </Button>
      )}
    </div>
  );
};

export default QuickAddButtons;
