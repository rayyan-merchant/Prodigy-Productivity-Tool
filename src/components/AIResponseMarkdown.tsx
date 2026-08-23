import ReactMarkdown from 'react-markdown';

interface AIResponseMarkdownProps {
  children: string;
  className?: string;
}

/** Renders model output without allowing raw HTML from a model or user record. */
const AIResponseMarkdown = ({ children, className = '' }: AIResponseMarkdownProps) => (
  <div className={`space-y-2 text-sm leading-6 text-muted-foreground ${className}`}>
    <ReactMarkdown
      skipHtml
      components={{
        h1: ({ children: content }) => <h2 className="pt-2 text-lg font-semibold text-foreground">{content}</h2>,
        h2: ({ children: content }) => <h3 className="pt-2 text-base font-semibold text-foreground">{content}</h3>,
        h3: ({ children: content }) => <h4 className="pt-2 text-sm font-semibold text-foreground">{content}</h4>,
        h4: ({ children: content }) => <h5 className="pt-2 text-sm font-semibold text-foreground">{content}</h5>,
        p: ({ children: content }) => <p>{content}</p>,
        ul: ({ children: content }) => <ul className="list-disc space-y-1 pl-5">{content}</ul>,
        ol: ({ children: content }) => <ol className="list-decimal space-y-1 pl-5">{content}</ol>,
        li: ({ children: content }) => <li>{content}</li>,
        strong: ({ children: content }) => <strong className="font-semibold text-foreground">{content}</strong>,
        a: ({ href, children: content }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#b4232a] underline">{content}</a>,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default AIResponseMarkdown;
