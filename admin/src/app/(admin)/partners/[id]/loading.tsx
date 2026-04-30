export default function PartnerDetailLoading() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-7 w-44 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-56 bg-gray-100 rounded mb-6" />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
