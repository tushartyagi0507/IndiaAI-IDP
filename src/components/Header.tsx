import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-saffron-light to-emerald rounded-xl blur-lg opacity-50" />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-display font-bold tracking-tight">
              <span className="gradient-text">India AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Document Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={() => {
              const el = document.getElementById("features");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Features
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
