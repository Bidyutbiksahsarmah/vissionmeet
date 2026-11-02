import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "VisionMeet - Meeting Intelligence",
  description: "Capture meetings, review extracted tasks, and follow up with evidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#0F1419] text-[#111827] dark:text-[#E8EBEF]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
