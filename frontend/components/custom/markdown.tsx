import Link from "next/link";
import { CopyToClipboard } from "react-copy-to-clipboard";

import React, { memo, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow, tomorrowNight, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import html from "react-syntax-highlighter/dist/esm/languages/hljs/xml"; // HTML uses "xml"
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/hljs/ruby";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import swift from "react-syntax-highlighter/dist/esm/languages/hljs/swift";
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go";
import kotlin from "react-syntax-highlighter/dist/esm/languages/hljs/kotlin";
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import shell from "react-syntax-highlighter/dist/esm/languages/hljs/shell";
import { useTheme } from "next-themes";

// Register languages
const languages = {
  javascript,
  python,
  bash,
  java,
  c,
  cpp,
  css,
  html,
  php,
  ruby,
  typescript,
  swift,
  go,
  kotlin,
  rust,
  markdown,
  sql,
  shell,
};

Object.entries(languages).forEach(([name, lang]) => {
  SyntaxHighlighter.registerLanguage(name, lang);
});

const OrderedList = memo(({ children, ...props }: any) => (
  <ol className="list-decimal list-outside ml-4" {...props}>
    {children}
  </ol>
));

OrderedList.displayName = "OrderedList";

const ListItem = memo(({ children, ...props }: any) => (
  <li className="py-1" {...props}>
    {children}
  </li>
));

ListItem.displayName = "ListItem";

const UnorderedList = memo(({ children, ...props }: any) => (
  <ul className="list-disc list-outside ml-4" {...props}>
    {children}
  </ul>
));

UnorderedList.displayName = "UnorderedList";

const StrongText = memo(({ children, ...props }: any) => (
  <span className="font-semibold" {...props}>
    {children}
  </span>
));

StrongText.displayName = "StrongText";

const Anchor = memo(({ children, ...props }: any) => (
  <Link className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" {...props}>
    {children}
  </Link>
));

Anchor.displayName = "Anchor";
const MarkdownComponents = {
  code({ inline, className, children, theme, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const [copied, setCopied] = useState(false);

    const style = theme === "dark" ? tomorrowNight : atomOneLight;

    const handleCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset "Copied!" after 2 seconds
    };

    return !inline && match ? (
      <div className="relative group text-sm overflow-x-scroll rounded-lg mt-2">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1 text-xs font-mono rounded-t-lg bg-zinc-100 dark:bg-zinc-700">
          <span>{match[1]}</span>
          <CopyToClipboard text={String(children).trim()} onCopy={handleCopy}>
            <Button variant="ghost" className="px-2 py-1 rounded-md text-xs">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </CopyToClipboard>
        </div>
        {/* Code Block */}
        <SyntaxHighlighter
          {...props}
          language={match[1]}
          style={style}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            padding: "1rem",
          }}
        >
          {String(children).trim()}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }: any) {
    // Ensure that <pre> is rendered directly, without wrapping in <p>
    return <div className="relative">{children}</div>;
  },
};

export const Markdown = memo(({ children }: { children: string }) => {
  const { theme } = useTheme();
  const [clientTheme, setClientTheme] = useState<"light" | "dark" | undefined>(undefined);

  // Ensure the theme is available on the client side
  useEffect(() => {
    setClientTheme(theme as "light" | "dark" | undefined);
  }, [theme]);

  const memoizedComponents = useMemo(
    () => ({
      ...MarkdownComponents,
      code: (props: any) => MarkdownComponents.code({ ...props, theme: clientTheme }),
    }),
    [clientTheme]
  );

  if (clientTheme === undefined) {
    // Render a placeholder or skeleton if theme is not yet determined
    return <div>Loading...</div>;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={memoizedComponents}>
      {children}
    </ReactMarkdown>
  );
});

Markdown.displayName = "Markdown";
