import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
const base=__ENV.LOAD_BASE;
if(!/^https?:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Isolated loopback harness required");
const params={headers:{Authorization:"Bearer "+__ENV.LOAD_SECRET},responseType:"text"};
export function handleSummary(data){return {[__ENV.LOAD_RESULT]:JSON.stringify(data,null,2)};}
export const options={scenarios:{race:{executor:"shared-iterations",vus:2,iterations:24,maxDuration:"60s"}},thresholds:{checks:["rate==1"]},summaryTrendStats:["avg","p(95)","p(99)","max"]};
export default function(){const id=exec.scenario.iterationInTest;const r=http.post(base+"/race?id="+id,null,params);check(r,{"winner or capacity conflict":r=>[201,409].includes(r.status)});}
