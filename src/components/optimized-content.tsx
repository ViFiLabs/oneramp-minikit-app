import { memo } from 'react';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Memoized content section to prevent unnecessary re-renders
export const ContentSection = memo(function ContentSection({ 
  title, 
  children, 
  className = "" 
}: ContentSectionProps) {
  return (
    <section className={className}>
      <h2 className="text-lg font-semibold mb-3 text-white">{title}</h2>
      <div className="text-gray-300 space-y-2">
        {children}
      </div>
    </section>
  );
});

// Optimized list component
interface OptimizedListProps {
  items: (string | React.ReactNode)[];
  className?: string;
}

export const OptimizedList = memo(function OptimizedList({ 
  items, 
  className = "" 
}: OptimizedListProps) {
  return (
    <ul className={`list-disc list-inside space-y-1 ml-4 ${className}`}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
});

// Optimized text paragraph
interface OptimizedParagraphProps {
  children: React.ReactNode;
  className?: string;
}

export const OptimizedParagraph = memo(function OptimizedParagraph({ 
  children, 
  className = "" 
}: OptimizedParagraphProps) {
  return (
    <p className={`text-gray-300 ${className}`}>
      {children}
    </p>
  );
});
