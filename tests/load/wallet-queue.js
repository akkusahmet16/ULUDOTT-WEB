import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
const base=__ENV.LOAD_BASE;
if(!/^https?:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Isolated loopback harness required");
const params={headers:{Authorization:"Bearer "+__ENV.LOAD_SECRET},responseType:"text"};
export function handleSummary(data){return {[__ENV.LOAD_RESULT]:JSON.stringify(data,null,2)};}
export const options={scenarios:{queue:{executor:"shared-iterations",vus:1,iterations:8,maxDuration:"60s"}},thresholds:{checks:["rate==1"]},summaryTrendStats:["avg","p(95)","p(99)","max"]};
export default function(){const r=http.post(base+"/queue?id="+exec.scenario.iterationInTest,null,params);check(r,{"worker batch executed":r=>r.status===200});}
