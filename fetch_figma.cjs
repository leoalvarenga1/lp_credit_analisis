const https = require('https');
const fs = require('fs');

const figmaToken = "REMOVED_SECRET-xj_jCDhxo22oMWl-WiXz";
const fileId = "CBtxLgI3KyPvwnOLeOZPJb";
const nodeId = "232:1551"; // O ID do frame do WhatsApp conforme o link

console.log(`Buscando imagem do frame ${nodeId} no Figma...`);

const options = {
  hostname: 'api.figma.com',
  path: `/v1/images/${fileId}?ids=${nodeId}&format=png&scale=2`,
  method: 'GET',
  headers: {
    'X-Figma-Token': figmaToken
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        const imageUrl = json.images[nodeId];
        if (imageUrl) {
            console.log("URL da imagem encontrada:", imageUrl);
            downloadImage(imageUrl);
        } else {
            console.log("Erro: Não foi possível encontrar a URL da imagem. Verifique o ID do node.");
            console.log("Resposta da API:", data);
        }
    } catch (e) {
        console.error("Erro ao processar JSON:", e);
    }
  });
});

function downloadImage(url) {
    https.get(url, (res) => {
        const path = 'public/whatsapp_frame.png';
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish', () => {
            filePath.close();
            console.log('Download concluído: public/whatsapp_frame.png');
        });
    });
}

req.on('error', (e) => {
  console.error(e);
});
req.end();
