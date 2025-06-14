import React from 'react';

interface SimpleMarkdownRendererProps {
  content: string;
}

const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = []; // To hold <li> elements
  let inList = false;

  // Helper function to render any pending list
  const renderCurrentList = () => {
    if (inList && currentListItems.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 mb-2">{currentListItems}</ul>);
      currentListItems = []; // Reset for next list
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Handle Headings (##)
    if (trimmedLine.startsWith('## ')) {
      renderCurrentList(); // Render any pending list before a new block
      elements.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2">{trimmedLine.substring(3)}</h2>);
    }
    // Handle List Items (-)
    else if (trimmedLine.startsWith('- ')) {
      if (!inList) {
        inList = true;
      }
      // Handle bold within list items
      const listItemContent = trimmedLine.substring(2).split('**').map((part, i) => {
        return i % 2 === 1 ? <strong key={i}>{part}</strong> : part;
      });
      currentListItems.push(<li key={index} className="mb-1">{listItemContent}</li>);
    }
    // Handle Paragraphs and Bold text within paragraphs
    else {
      renderCurrentList(); // Render any pending list before a new block
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

  // Render any remaining list at the end of the content
  renderCurrentList();

  return <>{elements}</>;
};

export default SimpleMarkdownRenderer;