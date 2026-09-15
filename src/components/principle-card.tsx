export function PrincipleCard({eyebrow='Principio de mayordomía',reference,principle,application,riskContext}:{eyebrow?:string;reference:string;principle:string;application?:string;riskContext?:string}){
 return <aside className="principle-card" aria-label={eyebrow}>
  <p className="eyebrow">{eyebrow}</p>
  <h3>{reference}</h3>
  <p>{principle}</p>
  {application&&<p><strong>Aplicación:</strong> {application}</p>}
  {riskContext&&<small>{riskContext}</small>}
 </aside>;
}
