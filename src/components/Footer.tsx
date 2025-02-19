import { Github } from "lucide-react"

export function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
            <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div>
                            Data provided by{" "}
                            <a
                                href="https://explore.openelectricity.org.au"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
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
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Valeriy Kryukov
                            </a>{" "}
                            on{" "}
                            <a
                                href="https://unsplash.com/photos/three-white-and-brown-smoke-zc9__sCp1sc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
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
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Nik Cubrilovic
                        </a>
                        <a
                            href="https://github.com/nc9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
