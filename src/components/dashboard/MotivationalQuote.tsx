import React, { useMemo } from 'react';

interface MotivationalQuoteProps {
  initialQuote?: string;
  quotes?: string[];
}

const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({
  initialQuote,
  quotes = [],
}) => {
  const quote = useMemo(
    () => initialQuote || quotes[0] || 'Choose one clear priority, then give it your full attention.',
    [initialQuote, quotes],
  );
  return (
    <p className="hidden text-xs italic leading-relaxed text-muted-foreground sm:block">
      "{quote.trim()}"
    </p>
  );
};

export default MotivationalQuote;
