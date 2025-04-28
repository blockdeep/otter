import Link from "next/link"
import { Github, Twitter, Waves } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white py-6">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">DUGONG</span>
            </Link>
            <p className="text-sm text-gray-500">Decentralized Governance for Sui</p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">Resources</h3>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Documentation
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                GitHub
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Tutorials
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">Connect</h3>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Discord
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} DUGONG. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
