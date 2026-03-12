export default function GlobalMap() {
    const mapOverlayClass =
        'absolute inset-0 bg-gradient-to-br from-slate-900/5 via-slate-900/10 to-slate-900/20'

    return (
        <section className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="relative h-[320px] md:h-[360px] lg:h-[420px] aspect-[16/9]">
                        <img
                            src="/globe.svg"
                            alt="Global logistics map"
                            className="h-full w-full object-contain px-6 py-4"
                        />
                        <div className={mapOverlayClass} />
                    </div>
                </div>
            </div>
        </section>
    )
}
