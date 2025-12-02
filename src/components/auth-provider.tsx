"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AuthAPI from "@/lib/api/auth"

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated")
      setIsAuthenticated(auth === "true")
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && pathname === "/login") {
        router.push("/payment")
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const login = () => {
    localStorage.setItem("isAuthenticated", "true")
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await AuthAPI.logout()
      localStorage.removeItem("isAuthenticated")
      setIsAuthenticated(false)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      // Still redirect to login even if API call fails
      localStorage.removeItem("isAuthenticated")
      setIsAuthenticated(false)
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {!isLoading && <>{!isAuthenticated && pathname !== "/login" ? null : children}</>}
    </AuthContext.Provider>
  )
}
