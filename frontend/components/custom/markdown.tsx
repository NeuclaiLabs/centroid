/* eslint-disable react-hooks/rules-of-hooks */
import Link from "next/link";
import { useTheme } from "next-themes";
import React, { memo, useMemo, useState, useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import kotlin from "react-syntax-highlighter/dist/esm/languages/hljs/kotlin";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import ruby from "react-syntax-highlighter/dist/esm/languages/hljs/ruby";
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust";
import shell from "react-syntax-highlighter/dist/esm/languages/hljs/shell";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import swift from "react-syntax-highlighter/dist/esm/languages/hljs/swift";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import html from "react-syntax-highlighter/dist/esm/languages/hljs/xml"; // HTML uses "xml"
import { tomorrowNight, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { APIPlan } from "../tools/api-plan";

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
      setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
      <div className="relative group text-sm rounded-lg my-2 w-full">
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
        <div className="overflow-x-auto w-full scrollbar-thin" style={{ maxWidth: "calc(100vw - 4rem)" }}>
          <SyntaxHighlighter
            {...props}
            language={match[1]}
            style={style}
            showLineNumbers={true}
            customStyle={{
              margin: 0,
              padding: "1rem",
              minWidth: "100%",
              width: "fit-content",
            }}
            wrapLongLines={false}
          >
            {String(children).trim()}
          </SyntaxHighlighter>
        </div>
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
  table({ children, ...props }: any) {
    return (
      <div className="overflow-x-auto scrollbar-thin my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: any) {
    return (
      <thead className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" {...props}>
        {children}
      </thead>
    );
  },
  tbody({ children, ...props }: any) {
    return (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 " {...props}>
        {children}
      </tbody>
    );
  },
  tr({ children, ...props }: any) {
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600" {...props}>
        {children}
      </tr>
    );
  },
  th({ children, ...props }: any) {
    return (
      <th
        className="px-6 py-3 text-left text-xs  border border-gray-300 dark:border-gray-600 font-bold uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }: any) {
    return (
      <td className="px-6 py-4 whitespace-nowrap text-sm  border border-gray-300 dark:border-gray-600 " {...props}>
        {children}
      </td>
    );
  },
  apiPlan({ node }: any) {
    try {
      const summary = node.children.find((child: any) => child.tagName === "summary")?.children[0]?.value || "";

      const steps =
        node.children
          .find((child: any) => child.tagName === "steps")
          ?.children.filter((step: any) => step.tagName === "step")
          .map((step: any) => ({
            number: parseInt(step.properties.number),
            action: step.children.find((c: any) => c.tagName === "action")?.children[0]?.value || "",
            endpoint: step.children.find((c: any) => c.tagName === "endpoint")?.children[0]?.value || "",
            method: step.children.find((c: any) => c.tagName === "method")?.children[0]?.value || "",
            headers: step.children.find((c: any) => c.tagName === "headers")?.children[0]?.value || "",
            body: step.children.find((c: any) => c.tagName === "body")?.children[0]?.value || "",
            response: step.children.find((c: any) => c.tagName === "response")?.children[0]?.value || "",
          })) || [];

      const errorHandling = {
        retries: parseInt(
          node.children
            .find((child: any) => child.tagName === "errorHandling")
            ?.children.find((c: any) => c.tagName === "retries")?.children[0]?.value || "0"
        ),
        backoff:
          node.children
            .find((child: any) => child.tagName === "errorHandling")
            ?.children.find((c: any) => c.tagName === "backoff")?.children[0]?.value || "",
        timeout:
          node.children
            .find((child: any) => child.tagName === "errorHandling")
            ?.children.find((c: any) => c.tagName === "timeout")?.children[0]?.value || "",
      };

      return <APIPlan summary={summary} steps={steps} errorHandling={errorHandling} />;
    } catch (error) {
      console.error("Error rendering API Plan:", error);
      return <div className="text-red-500">Error rendering API plan</div>;
    }
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
