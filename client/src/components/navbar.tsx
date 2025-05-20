"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/public/logo.png";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@mysten/dapp-kit";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto">
        <div>
          <a href="/" className="flex items-center gap-2">
            <img
              src={Logo}
              alt="OTTER Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-bold text-foreground">OTTER</span>
          </a>
        </div>

        <nav className="hidden lg:flex gap-6 justify-end flex-1">
          <a
            href="/"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="/governance"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Governance
          </a>
          <a
            target="_blank"
            href="https://github.com/blockdeep/otter"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Docs
          </a>
          <a
            href="/about"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            About
          </a>
        </nav>

        <div className="hidden lg:flex gap-6 ml-6 justify-end">
          <Button asChild variant="secondary">
            <a href="/governance/launch">Launch Governance</a>
          </Button>
          <ConnectButton className="whitespace-nowrap !bg-primary !hover:bg-primary/90 !text-primary-foreground" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground"
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
            <a
              href="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Home
            </a>
            <a
              href="/governance"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Governance
            </a>
            <a
              href="#"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Docs
            </a>
            <a
              href="#"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              About
            </a>
          </nav>
          <div className="flex flex-col gap-2 mt-4">
            <ConnectButton />
            <Button
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <a href="/governance/launch">Launch Governance</a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
