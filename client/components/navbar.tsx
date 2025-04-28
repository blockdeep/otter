"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ConnectButton } from "@mysten/dapp-kit";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DUGONG Logo"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="text-xl font-bold">DUGONG</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/governance"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Governance
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Docs
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            About
          </Link>
        </nav>
        <div className="hidden md:flex gap-4">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="#">Launch Governance</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
      {isMenuOpen && (
        <div className="container md:hidden px-4 pb-4">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/governance"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Governance
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              About
            </Link>
          </nav>
          <div className="flex flex-col gap-2 mt-4">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="#">Launch Governance</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
