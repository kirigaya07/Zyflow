import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { LoadingProvider } from "@/providers/loading-provider";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ModalProvider from "@/providers/model-provider";
import { Toaster } from "@/components/ui/sonner";

const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zyflow",
  description: "Automate your workflows with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={font.className} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LoadingProvider>
              <ModalProvider>
                {children}
                <Toaster />
              </ModalProvider>
            </LoadingProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
