import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

const CodeBlock = memo(({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  return !inline && match ? (
    <pre
      {...props}
      className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-3 rounded-lg mt-2 dark:bg-zinc-800`}
    >
      <code className={match[1]}>{children}</code>
    </pre>
  ) : (
    <code
      className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
      {...props}
    >
      {children}
    </code>
  );
});

CodeBlock.displayName = 'CodeBlock';

const OrderedList = memo(({ children, ...props }: any) => (
  <ol className="list-decimal list-outside ml-4" {...props}>
    {children}
  </ol>
));

OrderedList.displayName = 'OrderedList';

const ListItem = memo(({ children, ...props }: any) => (
  <li className="py-1" {...props}>
    {children}
  </li>
));

ListItem.displayName = 'ListItem';

const UnorderedList = memo(({ children, ...props }: any) => (
  <ul className="list-disc list-outside ml-4" {...props}>
    {children}
  </ul>
));

UnorderedList.displayName = 'UnorderedList';

const StrongText = memo(({ children, ...props }: any) => (
  <span className="font-semibold" {...props}>
    {children}
  </span>
));

StrongText.displayName = 'StrongText';

const Anchor = memo(({ children, ...props }: any) => (
  <Link
    className="text-blue-500 hover:underline"
    target="_blank"
    rel="noreferrer"
    {...props}
  >
    {children}
  </Link>
));

Anchor.displayName = 'Anchor';

const MarkdownComponents = {
  code: CodeBlock,
  ol: OrderedList,
  li: ListItem,
  ul: UnorderedList,
  strong: StrongText,
  a: Anchor,
};

export const Markdown = memo(({ children }: { children: string }) => {
  const memoizedComponents = useMemo(() => MarkdownComponents, []);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={memoizedComponents}>
      {children}
    </ReactMarkdown>
  );
});

Markdown.displayName = 'Markdown';
