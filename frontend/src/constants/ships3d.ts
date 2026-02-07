export const MENU_MODEL_ID = '24ad66da5657492facfcc0066dcb5567'; // Nagato

export function getSketchfabViewerHtml(modelId: string) {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body,html{width:100%;height:100%;background:transparent;overflow:hidden}iframe{width:100%;height:100%;border:none}</style>
</head><body>
<iframe id="api-frame" allow="autoplay;fullscreen;xr-spatial-tracking"></iframe>
<script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"><\/script>
<script>
var iframe=document.getElementById('api-frame');
var client=new Sketchfab(iframe);
client.init('${modelId}',{
  success:function(api){
    api.start();
    api.addEventListener('viewerready',function(){
      api.recenterCamera(function(){
        api.getCameraLookAt(function(err,camera){
          if(err)return;
          var p=camera.position,t=camera.target,z=0.65;
          var np=[t[0]+(p[0]-t[0])*z,t[1]+(p[1]-t[1])*z,t[2]+(p[2]-t[2])*z];
          api.setCameraLookAt(np,t,1.5);
        });
      });
      setTimeout(function(){
        api.setTextureQuality('hd');
      },2000);
    });
  },
  error:function(){},
  autospin:0.5,
  ui_controls:0,
  ui_infos:0,
  ui_stop:0,
  ui_watermark:0,
  ui_watermark_link:0,
  transparent:1,
  autostart:1,
  max_texture_size:512,
  graph_optimizer:1,
  merge_materials:1
});
<\/script>
</body></html>`;
}
