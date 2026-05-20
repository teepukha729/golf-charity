import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Golf Charity Platform | Play. Win. Give.',
  description: 'Join the golf subscription platform that combines performance tracking, monthly prize draws, and charitable giving.',
  keywords: 'golf, charity, subscription, Stableford, prize draw, fundraising',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0f0d] text-white font-sans">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a2e23',
                color: '#fff',
                border: '1px solid #2d5c3f',
              },
              success: { iconTheme: { primary: '#4ade80', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
