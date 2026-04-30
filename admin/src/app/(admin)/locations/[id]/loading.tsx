export default function LocationDetailLoading() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-7 w-56 bg-gray-200 rounded mb-6" />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-32 w-full bg-gray-100 rounded-lg" />
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
