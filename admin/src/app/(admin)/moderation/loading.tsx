export default function ModerationLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />

      <div className="h-6 w-36 bg-gray-200 rounded mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-36 bg-gray-100 rounded mb-3" />
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
                <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
