import type { Metadata,Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'MAYORDOMO',template:'%s · MAYORDOMO'},description:'Administra con sabiduría. Vive con propósito.'};
export const viewport:Viewport={themeColor:'#173e32',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="es"><body>{children}</body></html>;
}
