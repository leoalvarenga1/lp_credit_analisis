const https = require('https');
const fs = require('fs');

const figmaToken = "REMOVED_SECRET-xj_jCDhxo22oMWl-WiXz";
// URL: https://www.figma.com/design/CBtxLgI3KyPvwnOLeOZPJb/Web-to-App-Whatsapp-flow?node-id=19-1372...
const fileId = "CBtxLgI3KyPvwnOLeOZPJb";
const nodeId = "19:1372"; // from url node-id=19-1372 replacing - with :

const options = {
  hostname: 'api.figma.com',
  path: `/v1/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`,
  method: 'GET',
  headers: {
    'X-Figma-Token': figmaToken
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('figma_data_raw_v2.json', data);
    console.log("Figma Section Data Fetched.");
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
