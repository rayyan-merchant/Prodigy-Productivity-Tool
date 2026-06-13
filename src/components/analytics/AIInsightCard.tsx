import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Clock, 
  Brain, 
  Zap 
} from 'lucide-react';

interface AIInsightCardProps {
  title: string;
  description: string;
  insight: string;
  confidence: number;
  actionable?: boolean;
  trend?: 'up' | 'down' | 'stable';
  category?: 'productivity' | 'focus' | 'wellbeing' | 'learning';
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({
  title,
  description,
  insight,
  confidence,
  actionable = false,
  trend = 'stable',
  category = 'productivity',
}) => {
  const getCategoryIcon = () => {
    switch (category) {
      case 'focus': return <Target className="h-4 w-4" />;
      case 'wellbeing': return <Sparkles className="h-4 w-4" />;
      case 'learning': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'focus': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'wellbeing': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'learning': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return <div className="h-3 w-3 rounded-full bg-muted" />;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor().split(' ')[0]} opacity-60`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getCategoryColor()} text-xs`}
            >
              {getCategoryIcon()}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
            {getTrendIcon()}
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">
              AI Confidence
            </div>
            <div className="flex items-center gap-2">
              <Progress value={confidence} className="h-1 w-12" />
              <span className="text-xs font-medium">
                {confidence}%
              </span>
            </div>
          </div>
        </div>
        
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground font-medium">
              {insight}
            </p>
          </div>
        </div>
        
        {actionable && (
          <Button variant="outline" size="sm" className="w-full">
            <Target className="h-4 w-4 mr-2" />
            Apply Suggestion
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;