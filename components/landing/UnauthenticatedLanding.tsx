"use client";

import { useState } from "react";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { WelcomeSection } from "@/components/welcome/WelcomeSection";

export function UnauthenticatedLanding() {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const handleOpenLogin = () => setIsLoginDialogOpen(true);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader onLoginClick={handleOpenLogin} />
      <div className="flex-1">
        <WelcomeSection onLoginClick={handleOpenLogin} />
      </div>
      <AppFooter />
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </div>
  );
}
