"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const { connect, disconnect, address, isConnected } = useWallet()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  return (
    <header className="border-b theme-transition backdrop-blur-sm bg-white/80 dark:bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold gradient-text">
              DeVote
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/vote" className="text-sm font-medium hover:text-vote-purple transition-colors">
              Vote
            </Link>
            <Link href="/create" className="text-sm font-medium hover:text-vote-blue transition-colors">
              Create Ballot
            </Link>
            <Link href="/results" className="text-sm font-medium hover:text-vote-teal transition-colors">
              Results
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            {mounted &&
              (isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium bg-vote-purple/10 dark:bg-vote-purple/20 text-vote-purple px-3 py-1 rounded-full">
                    {formatAddress(address || "")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    className="border-vote-red/50 text-vote-red hover:bg-vote-red/10 hover:text-vote-red"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={connect} className="bg-vote-purple hover:bg-vote-purple/90">
                  Connect Wallet
                </Button>
              ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-vote-purple">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t theme-transition backdrop-blur-sm bg-white/90 dark:bg-background/90">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/vote"
                className="text-sm font-medium hover:text-vote-purple transition-colors"
                onClick={toggleMenu}
              >
                Vote
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium hover:text-vote-blue transition-colors"
                onClick={toggleMenu}
              >
                Create Ballot
              </Link>
              <Link
                href="/results"
                className="text-sm font-medium hover:text-vote-teal transition-colors"
                onClick={toggleMenu}
              >
                Results
              </Link>
            </nav>
            <div className="pt-4 border-t">
              {mounted &&
                (isConnected ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium bg-vote-purple/10 dark:bg-vote-purple/20 text-vote-purple px-3 py-1 rounded-full text-center">
                      {formatAddress(address || "")}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnect}
                      className="border-vote-red/50 text-vote-red hover:bg-vote-red/10 hover:text-vote-red"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connect} className="w-full bg-vote-purple hover:bg-vote-purple/90">
                    Connect Wallet
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
