"use client";

import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onLoginClick: () => void;
}

export function AppHeader({ onLoginClick }: AppHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Mono Log</h1>
          <Button onClick={onLoginClick}>ログイン</Button>
        </div>
      </div>
    </header>
  );
}
