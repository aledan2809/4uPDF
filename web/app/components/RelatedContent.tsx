import Link from 'next/link';

interface RelatedLink {
  href: string;
  title: string;
  description: string;
  type: 'tool' | 'blog' | 'howto';
}

interface RelatedContentProps {
  links: RelatedLink[];
  title?: string;
}

export default function RelatedContent({ links, title = "Related Resources" }: RelatedContentProps) {
  const getIcon = (type: RelatedLink['type']) => {
    switch (type) {
      case 'tool':
        return '🛠️';
      case 'blog':
        return '📝';
      case 'howto':
        return '📖';
      default:
        return '🔗';
    }
  };

  const getTypeLabel = (type: RelatedLink['type']) => {
    switch (type) {
      case 'tool':
        return 'Tool';
      case 'blog':
        return 'Article';
      case 'howto':
        return 'Guide';
      default:
        return 'Link';
    }
  };

  return (
    <div className="my-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="block p-4 bg-white rounded-lg hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-400"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getIcon(link.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {getTypeLabel(link.type)}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
