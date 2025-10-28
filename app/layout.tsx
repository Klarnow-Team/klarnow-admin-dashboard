import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard with authentication and CRUD operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Override browser alerts globally
              if (typeof window !== 'undefined') {
                window.alert = function(message) {
                  console.log('Alert blocked:', message);
                  // Optionally show a custom notification instead
                };
                window.confirm = function(message) {
                  console.log('Confirm blocked:', message);
                  return true; // Default to true for confirmations
                };
                window.prompt = function(message, defaultValue) {
                  console.log('Prompt blocked:', message);
                  return defaultValue || ''; // Return default value
                };
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
