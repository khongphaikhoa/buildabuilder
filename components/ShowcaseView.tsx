"use client";

interface ShowcaseProject {
  name: string;
  content: string;
}

interface ShowcaseViewProps {
  title: string;
  projects: ShowcaseProject[];
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
        <h2 key={key++} className="mt-8 border-b border-stone-200 pb-2 text-xl font-semibold text-stone-900">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="mt-6 text-lg font-semibold text-stone-900">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.trim()) {
      flushList();
      elements.push(
        <p key={key++} className="my-4 text-stone-700">
          {line.split(/(\*\*.+?\*\*)/g).map((part, i) =>
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

export function ShowcaseView({ title, projects }: ShowcaseViewProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-12 text-3xl font-bold text-stone-900">{title}</h1>
        <div className="space-y-16">
          {projects.map((project, i) => (
            <section key={i}>
              <h2 className="mb-6 text-2xl font-semibold text-stone-900">
                {project.name}
              </h2>
              <div className="prose prose-stone max-w-none">
                <div className="space-y-1 text-stone-700">
                  {renderMarkdown(project.content)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
