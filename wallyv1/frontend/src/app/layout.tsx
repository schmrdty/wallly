import './globals.css';
import { ReactNode } from "react";
import ContextProviderWrapper from "@/context/ContextProviderWrapper";

export const metadata = {
  title: "Wally App",
  description: "A Next.js + Wagmi + Reown AppKit project",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ContextProviderWrapper>{children}</ContextProviderWrapper>
      </body>
    </html>
  );
}
