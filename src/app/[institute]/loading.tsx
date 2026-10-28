// Mirrors the institute layout so content doesn't jump when it arrives.
export default function Loading() {
  return (
    <div className="page pb-24" aria-busy="true" aria-label="Chargement">
      <div className="space-y-4 pb-8 pt-10 md:pt-14">
        <div className="skeleton h-3 w-56" />
        <div className="skeleton h-14 w-72 max-w-full" />
        <div className="skeleton h-4 w-[28rem] max-w-full" />
      </div>
      <div className="flex gap-7 border-b border-line py-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="grid gap-14 pt-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="skeleton h-11 w-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3 border-t border-line py-6">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-4 lg:col-span-4 lg:block">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
