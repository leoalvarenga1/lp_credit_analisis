const fs = require('fs');

try {
  const fileContent = fs.readFileSync('figma_data_raw_v2.json', 'utf8');
  const data = JSON.parse(fileContent);
  
  if (data.status === 403) {
      console.error("Figma API Error: 403 Forbidden. The token might be invalid or expired.");
      process.exit(1);
  }
  
  console.log("Figma Section Data Loaded. Document Name:", data.name);
  
  const colors = new Set();
  const textStyles = new Set();
  
  function traverse(node) {
    if (!node) return;
    
    if (node.fills) {
      node.fills.forEach(fill => {
         if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
            const r = Math.round(fill.color.r * 255);
            const g = Math.round(fill.color.g * 255);
            const b = Math.round(fill.color.b * 255);
            colors.add(`rgb(${r}, ${g}, ${b})`);
         }
      });
    }
    if (node.type === "TEXT" && node.style) {
       textStyles.add(`${node.style.fontFamily} - ${node.style.fontWeight} - ${node.style.fontSize}px`);
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  if (data.nodes) {
      Object.values(data.nodes).forEach(nodeObj => {
          traverse(nodeObj.document);
      });
  } else {
      console.log("No nodes found in JSON");
  }
  
  console.log("\n--- Extracted Colors ---");
  console.log(Array.from(colors).join('\n'));
  
  console.log("\n--- Extracted Typography ---");
  console.log(Array.from(textStyles).join('\n'));
  
} catch(e) {
  console.error("Failed to parse", e.message);
}
