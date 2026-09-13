import {ImageResponse} from 'next/og';

export const size={width:64,height:64};
export const contentType='image/png';

export default function Icon(){
 return new ImageResponse(<div style={{display:'flex',height:'100%',width:'100%',alignItems:'center',justifyContent:'center',background:'#123d32'}}><svg width="52" height="52" viewBox="0 0 64 64" fill="none"><path d="M10 15c10 1 17 7 22 17 5-10 12-16 22-17v31c-8 0-16 4-22 12C26 50 18 46 10 46V15Z" stroke="#fffaf0" strokeWidth="4" strokeLinejoin="round"/><path d="M25 41V25m7 17V17m7 24V29" stroke="#a88645" strokeWidth="4" strokeLinecap="round"/><path d="M32 7l2.6 6.4L41 16l-6.4 2.6L32 25l-2.6-6.4L23 16l6.4-2.6L32 7Z" fill="#a88645"/></svg></div>,{...size});
}
