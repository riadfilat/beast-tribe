import { Montserrat, Poppins } from 'next/font/google';
import localFont from 'next/font/local';

// The app's own type: Montserrat for headings and numbers, Poppins for text, SlamDunk for the logo word.
export const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--bt-head', display: 'swap' });
export const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--bt-body', display: 'swap' });
export const slamDunk = localFont({ src: '../../app/SlamDunk.ttf', variable: '--bt-display', display: 'swap' });

export const boardFonts = `${montserrat.variable} ${poppins.variable} ${slamDunk.variable}`;
