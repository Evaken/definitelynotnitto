export function NoCarScreen({title,message,onVisitShowroom}:{title:string;message:string;onVisitShowroom:()=>void}){
  return <div className="screen no-car-screen"><section><span>Empty Garage</span><h2>{title}</h2><p>{message}</p><strong>$1,000,000 TEST CREDIT AVAILABLE</strong><button type="button" onClick={onVisitShowroom}>Visit Car Showroom</button></section></div>;
}
