import React from 'react';

interface SimpleMarkdownRendererProps {
  content: string;
}

const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Handle Headings (##)
    if (trimmedLine.startsWith('## ')) {
      if (inList) {
        elements.push(<ul key={`ul-end-${index}`} className="list-disc pl-5 mb-2" />);
        inList = false;
      }
      elements.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2">{trimmedLine.substring(3)}</h2>);
    }
    // Handle List Items (-)
    else if (trimmedLine.startsWith('- ')) {
      if (!inList) {
        elements.push(<ul key={`ul-start-${index}`} className="list-disc pl-5 mb-2">);
        inList = true;
      }
      // Handle bold within list items
      const listItemContent = trimmedLine.substring(2).split('**').map((part, i) => {
        return i % 2 === 1 ? <strong key={i}>{part}</strong> : part;
      });
      elements.push(<li key={index} className="mb-1">{listItemContent}</li>);
    }
    // Handle Paragraphs and Bold text within paragraphs
    else {
      if (inList) {
        elements.push(<ul key={`ul-end-${index}`} className="list-disc pl-5 mb-2" />);
        inList = false;
      }
      if (trimmedLine) { // Only add if not an empty line
        const paragraphContent = trimmedLine.split('**').map((part, i) => {
          return i % 2 === 1 ? <strong key={i}>{part}</strong> : part;
        });
        elements.push(<p key={index} className="mb-2">{paragraphContent}</p>);
      } else {
        elements.push(<br key={index} />); // Add a line break for empty lines
      }
    }
  });

  // Close list if still open at the end
  if (inList) {
    elements.push(<ul key="ul-final-end" className="list-disc pl-5 mb-2" />);
  }

  return <>{elements}</>;
};

export default SimpleMarkdownRenderer;