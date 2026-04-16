import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 font-display text-lg font-bold text-white first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 font-display text-base font-semibold text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2 text-sm font-semibold text-zinc-100 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 [&+p]:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-4 border-sky-500/40 py-0.5 pl-3 text-zinc-300 [&>p]:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-zinc-700" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-sky-400 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-300"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-zinc-900/90 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-200"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-200 last:mb-0 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 max-w-full overflow-x-auto last:mb-0">
      <table className="w-full min-w-[12rem] border-collapse border border-zinc-700 text-left text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-900/80">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-zinc-800">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-zinc-700 px-2 py-1.5 font-semibold text-zinc-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-800 px-2 py-1.5 text-zinc-300">
      {children}
    </td>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="my-2 max-h-48 max-w-full rounded-lg border border-zinc-700 object-contain"
      loading="lazy"
    />
  ),
};

/** Compact markdown for one-line / two-line previews (e.g. conversation list). */
const previewComponents: Components = {
  ...components,
  h1: ({ children }) => (
    <span className="font-semibold text-zinc-400">{children}</span>
  ),
  h2: ({ children }) => (
    <span className="font-semibold text-zinc-400">{children}</span>
  ),
  h3: ({ children }) => (
    <span className="font-semibold text-zinc-400">{children}</span>
  ),
  p: ({ children }) => (
    <p className="mb-0.5 last:mb-0 [&+p]:mt-0.5">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-0 list-inside list-disc space-y-0 pl-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-0 list-inside list-decimal space-y-0 pl-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  blockquote: ({ children }) => (
    <span className="border-l-2 border-zinc-600 pl-1.5 text-zinc-500">
      {children}
    </span>
  ),
  hr: () => <span className="text-zinc-600"> · </span>,
  a: ({ children }) => (
    <span className="text-sky-400/90 underline decoration-sky-500/40">
      {children}
    </span>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-400">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-zinc-500">{children}</em>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-zinc-800/90 px-0.5 font-mono text-[0.85em] text-sky-300/90"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-0 overflow-x-auto rounded border border-zinc-700/80 bg-zinc-950/80 p-1 text-[9px] leading-tight text-zinc-400 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="max-h-10 overflow-hidden text-[9px] leading-tight">
      <table className="w-full border-collapse border border-zinc-700/80 text-left">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-700/80 px-1 py-0.5 font-semibold text-zinc-400">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-800 px-1 py-0.5 text-zinc-500">
      {children}
    </td>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="my-0.5 max-h-6 max-w-full rounded object-contain opacity-90"
      loading="lazy"
    />
  ),
};

type Props = {
  content: string;
};

export function BippiMarkdown({ content }: Props) {
  return (
    <div className="break-words text-sm leading-relaxed text-zinc-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function BippiMarkdownPreview({ content }: { content: string }) {
  return (
    <div className="line-clamp-2 max-h-[2.75rem] break-words text-left text-[10px] leading-tight text-zinc-500 [&_*]:text-[10px] [&_li]:marker:text-zinc-600">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
