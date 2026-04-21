import fs from 'fs';
fetch("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RkNDZkZDU0M2MwNDRmZWQ5YTgyMDQ0NmMyYTI4MWU2EgsSBxCd5_njtwcYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg0OTQwNzMzNzgxMDI3MjI2Mg&filename=&opi=96797242")
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync("/tmp/stitch_reg.html", t);
    console.log("Downloaded");
  });
