export default function CommunityDetailLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex-none" />
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-64 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Members */}
      <div className="mt-10">
        <div className="h-5 w-28 bg-gray-200 rounded mb-3" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <div className="h-4 w-40 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
