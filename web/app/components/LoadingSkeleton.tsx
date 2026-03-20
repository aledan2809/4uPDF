export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="h-12 w-12 bg-gray-700 rounded-lg mb-4" />
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-full" />
    </div>
  );
}

export function ToolGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4 animate-pulse">
        <div className="h-12 bg-gray-800 rounded w-1/2 mb-4" />
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-12" />
        <ToolGridSkeleton />
      </div>
    </div>
  );
}
