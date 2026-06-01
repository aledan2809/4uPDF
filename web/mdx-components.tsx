import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-bold mt-8 mb-4 text-white">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold mt-12 mb-6 text-white border-b border-gray-800 pb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold mt-8 mb-4 text-white">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-200">{children}</h4>,
    p: ({ children }) => <p className="mb-6 text-gray-300 leading-relaxed text-lg">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2">{children}</ol>,
    li: ({ children }) => <li className="text-gray-300 leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-400 hover:text-blue-300 underline transition-colors">
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-600 pl-6 py-2 my-6 italic bg-gray-900 rounded-r">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-800 text-blue-300 px-2 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 border border-gray-800 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6">
        {children}
      </pre>
    ),
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
    hr: () => <hr className="my-8 border-gray-800" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border border-gray-800">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-gray-800 text-white px-4 py-2 border border-gray-700 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="bg-gray-900 text-gray-300 px-4 py-2 border border-gray-800">{children}</td>
    ),
    ...components,
  }
}
