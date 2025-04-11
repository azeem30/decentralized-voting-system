"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

export const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      // Check if previously connected
      const savedAddress = localStorage.getItem("walletAddress")
      if (savedAddress) {
        connectWallet()
      }
    }
  }, [])

  // Add a function to switch to Sepolia network
  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" })

        // Check if we're on Sepolia and switch if needed
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID in hex
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xaa36a7", // Sepolia chain ID in hex
                    chainName: "Sepolia Test Network",
                    nativeCurrency: {
                      name: "Sepolia ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://sepolia.infura.io/v3/"],
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  },
                ],
              })
            } catch (addError) {
              console.error("Error adding Sepolia network:", addError)
            }
          }
          console.error("Error switching to Sepolia network:", switchError)
        }

        const ethersProvider = new ethers.BrowserProvider(window.ethereum)
        const ethersSigner = await ethersProvider.getSigner()
        const walletAddress = await ethersSigner.getAddress()

        setProvider(ethersProvider)
        setSigner(ethersSigner)
        setAddress(walletAddress)
        setIsConnected(true)

        // Save connection state
        localStorage.setItem("walletAddress", walletAddress)

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet()
          } else {
            setAddress(accounts[0])
            localStorage.setItem("walletAddress", accounts[0])
          }
        })

        // Listen for chain changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload()
        })
      } else {
        alert("Please install MetaMask or another Ethereum wallet provider")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setIsConnected(false)
    localStorage.removeItem("walletAddress")
  }

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        address,
        isConnected,
        connect: connectWallet,
        disconnect: disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
