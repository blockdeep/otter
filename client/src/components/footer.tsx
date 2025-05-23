import { Github, X } from "lucide-react";
import Logo from "@/public/logo.png";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-6">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <a href="/" className="flex items-center gap-2">
              <img
                src={Logo}
                alt="Otter logo"
                width={100}
                height={100}
                className="h-30 w-30"
              />
              <p className="text-sm text-muted-foreground">
                Decentralized Governance for Sui
              </p>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium text-card-foreground">
                Resources
              </h3>
              <a
                href="https://github.com/blockdeep/otter/blob/master/Readme.md"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/blockdeep/otter"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/blockdeep/otter/blob/master/Deploy.md"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Tutorials
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium text-card-foreground">
                Connect
              </h3>
              <a
                href="https://x.com/0xBlockDeep"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                X (formerly Twitter)
              </a>
              <a
                href="mailto:info@blockdeep.io"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Otter. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/0xBlockDeep"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://github.com/blockdeep/otter"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
