import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {resolve} from 'node:path';
import {ApiError,GameService} from './service.js';
import {JsonStore} from './store.js';

const port=Number(process.env.PORT??8787),dataPath=process.env.NITTO_DATA_PATH??resolve('data/nitto.json'),allowedOrigin=process.env.NITTO_WEB_ORIGIN??'http://127.0.0.1:5173',adminKey=process.env.NITTO_ADMIN_KEY??'';
const store=new JsonStore(dataPath),service=new GameService(store),startedAt=Date.now();
const traffic=new Map<string,{start:number;count:number}>();

createServer(async(request,response)=>{
  secureHeaders(response);cors(response);
  if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
  try{
    const url=new URL(request.url??'/',`http://${request.headers.host??'localhost'}`);
    enforceRateLimit(request,url.pathname);
    const body=await jsonBody(request),token=bearer(request);let result:unknown;
    if(request.method==='POST'&&url.pathname==='/api/register')result=await service.register(text(body,'username'),text(body,'password'));
    else if(request.method==='POST'&&url.pathname==='/api/login')result=await service.login(text(body,'username'),text(body,'password'));
    else if(request.method==='GET'&&url.pathname==='/api/me')result=await service.account(token);
    else if(request.method==='GET'&&url.pathname==='/api/players')result=await service.search(token,url.searchParams.get('q')??'');
    else if(request.method==='POST'&&url.pathname==='/api/garage/action')result=await service.garageAction(token,body as never);
    else if(request.method==='POST'&&url.pathname==='/api/cpu-races')result=await service.cpuRace(token,body as never);
    else if(request.method==='GET'&&url.pathname==='/api/challenges')result=await service.listChallenges(token);
    else if(request.method==='POST'&&url.pathname==='/api/challenges')result=await service.createChallenge(token,body as never);
    else if(request.method==='POST'&&/^\/api\/challenges\/[^/]+\/answer$/.test(url.pathname))result=await service.answerChallenge(token,url.pathname.split('/')[3]!,body as never);
    else if(request.method==='GET'&&url.pathname==='/api/team-challenges')result=await service.listTeamChallenges(token);
    else if(request.method==='POST'&&url.pathname==='/api/team-challenges')result=await service.createTeamChallenge(token,body as never);
    else if(request.method==='POST'&&/^\/api\/team-challenges\/[^/]+\/answer$/.test(url.pathname))result=await service.answerTeamChallenge(token,url.pathname.split('/')[3]!,body as never);
    else if(request.method==='POST'&&url.pathname==='/api/teams')result=await service.createTeam(token,text(body,'name'));
    else if(request.method==='GET'&&url.pathname==='/api/teams')result=await service.listTeams(token);
    else if(request.method==='POST'&&/^\/api\/teams\/[^/]+\/apply$/.test(url.pathname))result=await service.applyToTeam(token,url.pathname.split('/')[3]!);
    else if(request.method==='POST'&&/^\/api\/teams\/[^/]+\/applicants\/[^/]+$/.test(url.pathname)){const parts=url.pathname.split('/');result=await service.decideApplicant(token,parts[3]!,parts[5]!,Boolean(body.accept));}
    else if(request.method==='POST'&&/^\/api\/teams\/[^/]+\/invites\/[^/]+$/.test(url.pathname)){const parts=url.pathname.split('/');result=await service.inviteToTeam(token,parts[3]!,parts[5]!);}
    else if(request.method==='POST'&&/^\/api\/teams\/[^/]+\/accept$/.test(url.pathname))result=await service.acceptTeamInvite(token,url.pathname.split('/')[3]!);
    else if(request.method==='POST'&&/^\/api\/teams\/[^/]+\/bank$/.test(url.pathname))result=await service.teamBank(token,url.pathname.split('/')[3]!,Number(body.amount));
    else if(request.method==='GET'&&url.pathname==='/api/admin/summary'){requireAdmin(request);result=await service.adminSummary();}
    else if(request.method==='GET'&&url.pathname==='/api/admin/ledger'){requireAdmin(request);result=await service.adminLedger();}
    else if(request.method==='GET'&&url.pathname==='/api/admin/races'){requireAdmin(request);result=await service.adminRaces();}
    else if(request.method==='POST'&&/^\/api\/admin\/accounts\/[^/]+\/moderation$/.test(url.pathname)){requireAdmin(request);result=await service.moderateAccount(url.pathname.split('/')[4]!,Boolean(body.disabled));}
    else if(request.method==='POST'&&url.pathname==='/api/admin/backup'){requireAdmin(request);result={path:await store.backup()};}
    else if(request.method==='GET'&&url.pathname==='/api/health')result={ok:true,schemaVersion:1,uptimeSeconds:Math.floor((Date.now()-startedAt)/1000)};
    else throw new ApiError(404,'Route not found.');
    send(response,200,result);
  }catch(error){const status=error instanceof ApiError?error.status:500;if(status>=500)process.stderr.write(`${new Date().toISOString()} ${error instanceof Error?error.stack:String(error)}\n`);send(response,status,{error:error instanceof Error?error.message:'Server error'});}
}).listen(port,()=>process.stdout.write(`Nitto API listening on http://127.0.0.1:${port}\n`));

function enforceRateLimit(request:IncomingMessage,path:string){const key=`${request.socket.remoteAddress??'unknown'}:${path.startsWith('/api/login')||path.startsWith('/api/register')?'auth':'general'}`,now=Date.now(),windowMs=60_000,limit=key.endsWith(':auth')?15:180,current=traffic.get(key);if(!current||now-current.start>=windowMs){traffic.set(key,{start:now,count:1});return;}current.count++;if(current.count>limit)throw new ApiError(429,'Too many requests. Try again shortly.');}
function requireAdmin(request:IncomingMessage){if(!adminKey||request.headers['x-admin-key']!==adminKey)throw new ApiError(403,'Admin access denied.');}
function secureHeaders(response:ServerResponse){response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('X-Frame-Options','DENY');response.setHeader('Referrer-Policy','no-referrer');response.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');response.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");}
function cors(response:ServerResponse){response.setHeader('Access-Control-Allow-Origin',allowedOrigin);response.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-Admin-Key');response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');response.setHeader('Vary','Origin');}
function send(response:ServerResponse,status:number,value:unknown){response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(value));}
async function jsonBody(request:IncomingMessage):Promise<Record<string,unknown>>{if(request.method==='GET')return{};const chunks:Buffer[]=[];let size=0;for await(const chunk of request){const buffer=Buffer.from(chunk);size+=buffer.length;if(size>1_000_000)throw new ApiError(413,'Request too large.');chunks.push(buffer);}if(!chunks.length)return{};try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string,unknown>;}catch{throw new ApiError(400,'Invalid JSON.');}}
function bearer(request:IncomingMessage){const value=request.headers.authorization??'';return value.startsWith('Bearer ')?value.slice(7):'';}
function text(body:Record<string,unknown>,key:string){const value=body[key];if(typeof value!=='string')throw new ApiError(400,`${key} is required.`);return value;}
