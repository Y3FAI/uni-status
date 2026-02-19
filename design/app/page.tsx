import Link from "next/link"

const designs = [
  {
    slug: "glass",
    name: "Soft Glass",
    description: "Frosted glass cards, pastel accents, blur effects. Apple/Linear inspired.",
    preview: "bg-gradient-to-br from-slate-100 to-blue-50",
    accent: "bg-blue-400/20 border border-blue-200/50 backdrop-blur-sm",
  },
  {
    slug: "warm",
    name: "Warm Minimal",
    description: "Cream background, serif headings, earthy tones. Newspaper-meets-Notion.",
    preview: "bg-gradient-to-br from-amber-50 to-orange-50",
    accent: "bg-amber-100 border border-amber-200",
  },
  {
    slug: "playful",
    name: "Playful & Rounded",
    description: "Bright colors, chunky rounded cards, bouncy feel. Duolingo vibes.",
    preview: "bg-gradient-to-br from-emerald-100 to-teal-50",
    accent: "bg-emerald-200 border-2 border-emerald-300 rounded-2xl",
  },
  {
    slug: "brutalist",
    name: "Neo-Brutalist",
    description: "Bold black borders, raw mono type, high contrast, off-grid cards.",
    preview: "bg-white",
    accent: "bg-yellow-300 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  },
  {
    slug: "aurora",
    name: "Gradient Aurora",
    description: "Rich flowing gradients, glowing indicators, vibrant. Vercel/Stripe feel.",
    preview: "bg-gradient-to-br from-slate-900 to-indigo-950",
    accent: "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30",
  },
  {
    slug: "flat",
    name: "Flat Illustration",
    description: "Solid flat colors, geometric accents, clean sans-serif. Figma/Slack style.",
    preview: "bg-gradient-to-br from-sky-50 to-indigo-50",
    accent: "bg-sky-100 border-l-4 border-sky-500",
  },
]

export default function DesignPicker() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="mx-auto max-w-4xl px-4 py-16 flex flex-col gap-12 sm:px-6 sm:py-24">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Pick a Design
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Same UX, same layout, same data -- six completely different visual approaches for the Blackboard status page. Click any to preview.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <Link
              key={d.slug}
              href={`/${d.slug}`}
              className="group flex flex-col gap-0 rounded-xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-all hover:shadow-lg hover:shadow-white/5 hover:-translate-y-1"
            >
              <div className={`h-32 ${d.preview} relative flex items-center justify-center p-4`}>
                <div className={`w-full h-14 rounded-lg ${d.accent}`} />
              </div>
              <div className="flex flex-col gap-1.5 p-4 bg-neutral-900/80">
                <h2 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {d.name}
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">{d.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 pt-8 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 text-center">
            Each variant uses the same useStatus hook and API. All functional -- just different aesthetics.
          </p>
        </div>
      </main>
    </div>
  )
}
