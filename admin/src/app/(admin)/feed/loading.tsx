export default function FeedLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex gap-2 mb-2">
              <div className="h-5 w-14 bg-gray-200 rounded-full" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded ml-auto" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded mb-1" />
            <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
            <div className="flex gap-4">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
