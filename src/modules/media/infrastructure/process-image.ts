import "server-only";
import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { MAX_BYTES, MAX_PIXELS } from "../domain/media-policy.ts";
export type ImageVariant = {
  format: "webp" | "avif" | "jpeg";
  data: Buffer;
  width: number;
  height: number;
  mimeType: string;
};
const nodeRequire = createRequire(`${process.cwd()}/package.json`);
const runtimeResolve = nodeRequire.resolve.bind(nodeRequire);
// Sabit kod ayrı worker'da çalışır; dosya/girdi kaynak koduna interpolasyon yapılmaz.
const workerCode = String.raw`
const {parentPort,workerData}=require('node:worker_threads');
(async()=>{
 const sharp=require(workerData.sharpPath);sharp.concurrency(1);sharp.cache(false);
 const bytes=Buffer.from(workerData.data);let pipeline;
 if(workerData.heic){
  const lib=require(workerData.heifPath),images=new lib.HeifDecoder().decode(bytes);
  if(images.length!==1){for(const img of images)img.free();throw Error('Tek kare gerekli');}
  const img=images[0],width=img.get_width(),height=img.get_height();
  if(width<1||height<1||width*height>workerData.maxPixels){img.free();throw Error('Piksel sınırı');}
  try{const rgba=await new Promise((resolve,reject)=>img.display({width,height,data:new Uint8ClampedArray(width*height*4)},result=>result?resolve(result.data):reject(Error('Decode başarısız'))));pipeline=sharp(Buffer.from(rgba),{raw:{width,height,channels:4},limitInputPixels:workerData.maxPixels});}finally{img.free();}
 }else{
  pipeline=sharp(bytes,{limitInputPixels:workerData.maxPixels,failOn:'warning',animated:false});
  const meta=await pipeline.metadata();if(!meta.width||!meta.height||meta.width*meta.height>workerData.maxPixels||(meta.pages??1)>1)throw Error('Piksel/kare sınırı');
  pipeline=pipeline.autoOrient();
 }
 pipeline=pipeline.resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).toColourspace('srgb');
 const variants=[];
 for(const format of ['webp','avif','jpeg']){
  const p=pipeline.clone();if(format==='webp')p.webp({quality:80});if(format==='avif')p.avif({quality:50,effort:2});if(format==='jpeg')p.flatten({background:'#f4efdf'}).jpeg({quality:82,progressive:true});
  const {data,info}=await p.toBuffer({resolveWithObject:true});const m=await sharp(data).metadata();if(m.exif||m.orientation||m.width!==info.width||m.height!==info.height)throw Error('Türev doğrulanamadı');
  variants.push({data,format,width:info.width,height:info.height,mimeType:'image/'+format});
 }
 parentPort.postMessage({variants});
})().catch(()=>parentPort.postMessage({error:'Görsel doğrulanamadı veya sınırları aşıyor'}));
`;
export async function processImage(
  data: Buffer,
  heic: boolean,
): Promise<ImageVariant[]> {
  if (!data.length || data.length > MAX_BYTES)
    throw new Error("Dosya boyutu sınırı");
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerCode, {
      eval: true,
      resourceLimits: { maxOldGenerationSizeMb: 256 },
      workerData: {
        data,
        heic,
        maxPixels: MAX_PIXELS,
        sharpPath: runtimeResolve("sharp"),
        heifPath: runtimeResolve("libheif-js/wasm-bundle"),
      },
    });
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error("Görsel işleme süresi aşıldı")),
      20_000,
    );
    function finish(error?: Error, variants?: ImageVariant[]) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();
      if (error) reject(error);
      else resolve(variants!);
    }
    worker.on(
      "message",
      (message: { error?: string; variants?: ImageVariant[] }) =>
        message.error
          ? finish(new Error(message.error))
          : finish(
              undefined,
              message.variants?.map((v) => ({
                ...v,
                data: Buffer.from(v.data),
              })),
            ),
    );
    worker.on("error", () => {
      finish(new Error("Görsel işleme başarısız"));
    });
    worker.on("exit", () => {
      if (!settled) finish(new Error("Görsel işleme durdu"));
    });
  });
}
