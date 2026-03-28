export default function PartnerDashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-36 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0 flex justify-between">
            <div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
