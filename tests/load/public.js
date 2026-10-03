import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
const base=__ENV.LOAD_BASE;
if(!/^https?:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Isolated loopback harness required");
const params={headers:{Authorization:"Bearer "+__ENV.LOAD_SECRET},responseType:"text"};
export function handleSummary(data){return {[__ENV.LOAD_RESULT]:JSON.stringify(data,null,2)};}
export const options={stages:[{duration:"5s",target:2},{duration:"10s",target:10},{duration:"5s",target:0}],thresholds:{checks:["rate==1"]},summaryTrendStats:["avg","p(95)","p(99)","max"]};
export default function(){const r=http.get(base+"/public",params);check(r,{"production page and banner":r=>r.status===200});}
