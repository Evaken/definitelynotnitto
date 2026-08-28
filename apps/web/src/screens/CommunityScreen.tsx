import {useState} from 'react';
import {api,type OnlineProfile} from '../onlineApi.js';

export function CommunityScreen({token,profile}:{token:string;profile:OnlineProfile|null}){
  const [query,setQuery]=useState(''),[players,setPlayers]=useState<OnlineProfile[]>([]),[message,setMessage]=useState('Search the member directory by racer name.');
  if(!token||!profile)return <div className="screen community-center"><header><span>1320 Network</span><h2>Community</h2><b>Guest</b></header><section className="community-gate"><h3>Member directory offline</h3><p>Sign in from Main to find racers, inspect records and send a challenge from Challenge Info.</p></section></div>;
  const search=()=>void api.players(token,query).then(results=>{setPlayers(results);setMessage(results.length?`${results.length} racer${results.length===1?'':'s'} found.`:'No matching racers.');}).catch(error=>setMessage(error instanceof Error?error.message:'Search failed.'));
  return <div className="screen community-center"><header><span>1320 Network</span><h2>Community</h2><b>{profile.username}</b></header><section className="community-search"><h3>Member Search</h3><div><input value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>event.key==='Enter'&&search()} placeholder="Racer name"/><button onClick={search}>Search</button></div></section><section className="community-results">{players.map(player=><article key={player.id}><i/><div><span>Member</span><strong>{player.username}</strong><small>Selected car: {player.selectedCarId}</small></div><b>{player.record.wins}–{player.record.losses}</b></article>)}</section><p className="challenge-message">{message}</p></div>;
}
