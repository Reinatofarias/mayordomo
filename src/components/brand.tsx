import Link from 'next/link';

type BrandProps={
 href?:string;
 tagline?:string;
 compact?:boolean;
 className?:string;
};

export function BrandMark({compact=false}:{compact?:boolean}){
 return <span className="brand-mark" aria-hidden="true" data-compact={compact}>
  <svg viewBox="0 0 64 64" role="img" focusable="false">
   <path d="M10 15c10 1 17 7 22 17 5-10 12-16 22-17v31c-8 0-16 4-22 12C26 50 18 46 10 46V15Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
   <path d="M25 41V25m7 17V17m7 24V29" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round"/>
   <path d="M32 7l2.6 6.4L41 16l-6.4 2.6L32 25l-2.6-6.4L23 16l6.4-2.6L32 7Z" fill="var(--gold)"/>
  </svg>
 </span>;
}

export function Brand({href,tagline='Tu vida. En buenas manos.',compact=false,className=''}:BrandProps){
 const content=<><BrandMark compact={compact}/><span className="brand-text"><strong>MAYORDOMO</strong>{!compact&&<small>{tagline}</small>}</span></>;
 const cls=['brand','brand-lockup',className].filter(Boolean).join(' ');
 if(href)return <Link className={cls} href={href}>{content}</Link>;
 return <span className={cls}>{content}</span>;
}
