import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8 theme-transition backdrop-blur-sm bg-white/80 dark:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} <span className="gradient-text font-semibold">DeVote</span>. All rights
              reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link
              href="/about"
              className="text-sm text-gray-500 hover:text-vote-purple dark:text-gray-400 dark:hover:text-vote-purple transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-vote-blue dark:text-gray-400 dark:hover:text-vote-blue transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-vote-teal dark:text-gray-400 dark:hover:text-vote-teal transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-500 hover:text-vote-green dark:text-gray-400 dark:hover:text-vote-green transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
