import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkinCart — One selfie. Zero guessing.',
  description:
    'Upload a selfie → YouCam Skin AI scores 7 skin concerns → matched product recommendations → preview the shade on your own photo with YouCam Virtual Try-On.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
