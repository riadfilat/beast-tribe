export default function EventDetailLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />

      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>

      {/* RSVPs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-5 py-3 flex items-center justify-between border-b border-gray-50 last:border-0"
          >
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
