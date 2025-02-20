import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
      <div className="mx-auto max-w-[1600px] px-6 py-8 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-6 text-sm text-gray-600 md:flex-row dark:text-gray-400">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div>
              Data provided by{" "}
              <a
                href="https://explore.openelectricity.org.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                OpenElectricity
              </a>
            </div>
            <div className="hidden md:block">•</div>
            <div>
              Photo by{" "}
              <a
                href="https://unsplash.com/@inconstantus?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Valeriy Kryukov
              </a>{" "}
              on{" "}
              <a
                href="https://unsplash.com/photos/three-white-and-brown-smoke-zc9__sCp1sc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
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
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Nik Cubrilovic
            </a>
            <a
              href="https://github.com/nc9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
