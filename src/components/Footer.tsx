import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black">
      <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-neutral-400 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:flex-row md:gap-8">
            <div>
              Data provided by{" "}
              <a
                href="https://explore.openelectricity.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 underline-offset-4 hover:text-neutral-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                OpenElectricity
              </a>
            </div>
            <div>
              Photo by{" "}
              <a
                href="https://unsplash.com/@inconstantus?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 underline-offset-4 hover:text-neutral-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                Valeriy Kryukov
              </a>{" "}
              on{" "}
              <a
                href="https://unsplash.com/photos/three-white-and-brown-smoke-zc9__sCp1sc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 underline-offset-4 hover:text-neutral-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                Unsplash
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Developed by</span>
            <a
              href="https://nikcub.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 underline-offset-4 hover:text-neutral-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              Nik Cubrilovic
            </a>
            <a
              href="https://github.com/nc9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
