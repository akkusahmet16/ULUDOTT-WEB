import { Trend } from "k6/metrics";
const formLatency=new Trend("form_latency",true),adminLatency=new Trend("admin_latency",true);
import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
const base=__ENV.LOAD_BASE;
if(!/^https?:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Isolated loopback harness required");
const params={headers:{Authorization:"Bearer "+__ENV.LOAD_SECRET},responseType:"text"};
export function handleSummary(data){return {[__ENV.LOAD_RESULT]:JSON.stringify(data,null,2)};}
export const options={scenarios:{burst:{executor:"shared-iterations",vus:10,iterations:140,maxDuration:"30s"}},thresholds:{checks:["rate==1"]},summaryTrendStats:["avg","p(95)","p(99)","max"]};
export default function(){const id=exec.scenario.iterationInTest;const r=http.post(base+"/form?id="+id,null,params);formLatency.add(r.timings.duration);check(r,{"accepted or bounded by rate gate":r=>[201,429].includes(r.status)});const list=http.get(base+"/admin",params);adminLatency.add(list.timings.duration);check(list,{"scoped admin listing":r=>r.status===200});}
