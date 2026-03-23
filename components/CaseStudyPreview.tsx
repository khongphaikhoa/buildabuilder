"use client";

interface CaseStudyPreviewProps {
  content: string;
  isStreaming?: boolean;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="my-2 list-disc pl-6">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="mt-8 border-b border-gray-100 pb-2 text-xl font-semibold text-ink">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="mt-6 text-lg font-semibold text-ink">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.trim()) {
      flushList();
      const parts = line.split(/(\*\*.+?\*\*)/g);
      elements.push(
        <p key={key++} className="my-4 text-ink/80">
          {parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    } else {
      flushList();
      elements.push(<div key={key++} className="h-2" />);
    }
  }
  flushList();
  return elements;
}

export function CaseStudyPreview({ content, isStreaming }: CaseStudyPreviewProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-100 border-t-primary" />
          <p className="text-sm text-ink/60">Generating your case study...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-none text-ink/80">
      <div className="space-y-1">
        {renderMarkdown(content)}
      </div>
      {isStreaming && (
        <span className="inline-block h-4 w-2 animate-pulse bg-primary/50" />
      )}
    </div>
  );
}
