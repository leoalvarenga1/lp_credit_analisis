import './style.css';
import * as THREE from 'three';

// Detectar mobile de forma simples para ajustes específicos
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --- LÓGICA DE TEXTURAS ---
async function loadHighResSVG(url: string, width: number, height: number): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 12; 
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 16; 
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(texture);
    };
  });
}

function createBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 828;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const radius = 30;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 828, radius);
  ctx.clip(); 

  const grad = ctx.createLinearGradient(0, 0, 0, 828);
  grad.addColorStop(0, '#3E91F7'); 
  grad.addColorStop(1, '#74F9F1'); 
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 828);

  ctx.fillStyle = '#111111';
  ctx.fillRect(20, 0, 80, 828);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText('NOME DO CLIENTE', 130, 400);
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText('**** **** **** 1234', 130, 460);
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('DATA EXP', 130, 540);
  ctx.fillText('CÓD. SEGURANÇA', 300, 540);
  ctx.font = '22px Inter, sans-serif';
  ctx.fillText('12/30', 130, 575);
  ctx.fillText('999', 300, 575);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    
    // No Mobile, usamos menos paradas de gradiente e cores mais sólidas para evitar artefatos de precisão
    if (isMobileDevice) {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); 
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); 
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// CONFIGURAR O THREE.JS
const canvas = document.querySelector('#webgl-canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const skyBlue = new THREE.Color(0xBAE6FD);
const white = new THREE.Color(0xffffff);
scene.background = skyBlue;
scene.fog = new THREE.Fog(0xBAE6FD, 10, 80);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

function updateCamera() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = window.innerWidth < 768 ? 14.0 : 11; 
    camera.updateProjectionMatrix();
}
updateCamera();

// Renderer Original (Desktop Perfeito)
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    alpha: false, 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0xffffff, 2.0));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 15, 10);
scene.add(light);

// NUVENS
const cloudTexture = createCloudTexture();
const clouds: THREE.Mesh[] = [];
const cloudGroup = new THREE.Group();

function initClouds() {
    const cloudGeo = new THREE.PlaneGeometry(22, 14); 
    for (let i = 0; i < 15; i++) {
        const cloudMat = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: isMobileDevice ? 0.5 : 0.8, // Menor opacidade no mobile para suavizar bordas
            depthWrite: false,
            // Desktop mantém Fog (perfeito), Mobile desativa para tirar o roxo
            fog: isMobileDevice ? false : true,
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        resetCloud(cloud, true);
        cloudGroup.add(cloud);
        clouds.push(cloud);
    }
    scene.add(cloudGroup);
}

function resetCloud(cloud: THREE.Mesh, initial = false) {
    cloud.position.x = initial ? (Math.random() * 100 - 50) : 60;
    cloud.position.y = Math.random() * 30 - 15;
    cloud.position.z = -5 - Math.random() * 25; 
    const s = 1.2 + Math.random() * 2.5;
    cloud.scale.set(s, s * 0.6, s);
    (cloud as any).speed = 0.01 + Math.random() * 0.02;
}

initClouds();

// --- CRIAÇÃO DOS MODELOS ---

const cardGroup = new THREE.Group();

// 1. MODELO CARTÃO (Sessão 0)
const cardW = 2.65, cardH = 4.05;
loadHighResSVG('./VerticalCard.svg', 512, 828).then((frontTex) => {
    const cardGeo = new THREE.PlaneGeometry(cardW, cardH);
    const backTex = createBackTexture();
    const frontMat = new THREE.MeshPhysicalMaterial({ map: frontTex, transparent: true, metalness: 0.1, roughness: 0.4, clearcoat: 0.3 });
    const frontMesh = new THREE.Mesh(cardGeo, frontMat);
    frontMesh.position.z = 0.01;
    cardGroup.add(frontMesh);
    const backMat = new THREE.MeshPhysicalMaterial({ map: backTex, transparent: true, metalness: 0.1, roughness: 0.4, clearcoat: 0.3 });
    const backMesh = new THREE.Mesh(cardGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -0.01;
    cardGroup.add(backMesh);
    scene.add(cardGroup);
});

// --- LÓGICA DE ANIMAÇÃO ---

let scrollY = 0;
let activeSection = 0;
window.addEventListener('scroll', () => { 
    scrollY = window.scrollY;
    activeSection = Math.round(scrollY / window.innerHeight); 
});

window.addEventListener('resize', () => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let curX = 0, curY = 0;
let cardEntryTime = 0;
let lastActiveSection = -1;
const clock = new THREE.Clock();

function render() {
    const isMob = window.innerWidth < 768;
    const time = clock.getElapsedTime();
    const scrollProgress = scrollY / window.innerHeight;

    // Resetar animação de entrada ao voltar para a Sessão 1
    if (activeSection === 0 && lastActiveSection !== 0) {
        cardEntryTime = time;
    }
    lastActiveSection = activeSection;

    // Animar nuvens
    clouds.forEach(cloud => {
        cloud.position.x -= (cloud as any).speed;
        if (cloud.position.x < -60) resetCloud(cloud);
    });

    // --- LÓGICA DE COR DO CÉU E NUVENS (S1: Azul, S2: Branco, S3: Azul, FAQ: Branco) ---
    let skyFactor = 0;
    let cloudOpacityBase = 1.0;

    if (scrollProgress <= 1.0) {
        // S1 (Azul) para S2 (Branco)
        skyFactor = Math.max(0, Math.min(1, scrollProgress));
        cloudOpacityBase = 1.0 - skyFactor; 
    } else if (scrollProgress <= 2.0) {
        // S2 (Branco) para S3 (Azul)
        skyFactor = Math.max(0, Math.min(1, 1.0 - (scrollProgress - 1.0)));
        cloudOpacityBase = 1.0 - skyFactor;
    } else {
        // S3 (Azul) para FAQ (Branco) - IGUAL À S1->S2
        skyFactor = Math.max(0, Math.min(1, scrollProgress - 2.0));
        cloudOpacityBase = 1.0 - skyFactor;
    }

    scene.background = skyBlue.clone().lerp(white, skyFactor);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);

    // Ajustar opacidade das nuvens
    clouds.forEach(cloud => {
        if (cloud.material instanceof THREE.MeshBasicMaterial) {
            cloud.material.opacity = cloudOpacityBase * (isMobileDevice ? 0.4 : 0.7);
        }
    });

    let targetX = 0, targetY = 0;
    if (isMob) {
        targetX = 0; 
        targetY = 2.5; 
    } else {
        if (activeSection === 0) targetX = 3.8;
        else if (activeSection === 1) targetX = -3.8;
        else targetX = 3.8;
        targetY = 0;
    }

    const fovInRad = (camera.fov * Math.PI) / 180;
    const viewport3DHeight = 2 * Math.tan(fovInRad / 2) * camera.position.z;

    if (isMob) {
        curX = 0;
        const mobileLimit = 0.8;
        if (scrollProgress < mobileLimit) {
            curY = 2.5 + (scrollProgress * viewport3DHeight);
        } else {
            curY = 2.5 + (mobileLimit * viewport3DHeight) + (scrollProgress - mobileLimit) * viewport3DHeight * 0.5;
        }
    } else {
        curX += (targetX - curX) * 0.12; 
        curY += (targetY - curY) * 0.1;
    }

    // CARTÃO: Opacidade
    const baseCardScale = isMob ? 0.8 : 1.2; 
    let cardOpacity = 1;

    if (isMob) {
        cardOpacity = Math.max(0, 1 - scrollProgress * 1.5);
    } else {
        // Desktop: Fade out igual à transição do céu (S3 -> FAQ)
        if (scrollProgress <= 2.0) cardOpacity = 1;
        else cardOpacity = Math.max(0, 1 - (scrollProgress - 2.0));
    }
    
    cardGroup.scale.set(baseCardScale, baseCardScale, baseCardScale);
    
    if (!isMob) {
        const velocityX = (targetX - curX);
        const travelZ = -Math.abs(velocityX) * 0.5; 
        const floatingY = Math.sin(time * 1.0) * 0.10;
        cardGroup.position.set(curX, curY + floatingY, travelZ);

        const elapsedSinceEntry = time - cardEntryTime;
        const entryDuration = 1.8;
        const entryProgress = Math.min(1.0, elapsedSinceEntry / entryDuration);
        const entryEase = 1 - Math.pow(1 - entryProgress, 3);
        
        const oscX = Math.sin(time * 0.7) * 0.12;
        const oscY = Math.cos(time * 0.5) * 0.03;

        let contextualTiltY = (activeSection === 0) ? -0.3 : (activeSection === 1 ? 0.3 : -0.3);

        const targetRotZ = -velocityX * 0.15;
        const targetRotX = Math.abs(velocityX) * 0.15 + oscX;
        const targetRotY = contextualTiltY + (velocityX * 0.1) + oscY;

        cardGroup.rotation.z += (targetRotZ - cardGroup.rotation.z) * 0.05;
        cardGroup.rotation.x += (targetRotX - cardGroup.rotation.x) * 0.05;
        
        if (entryProgress < 1.0) {
            cardGroup.rotation.y = (entryEase * Math.PI * 2) + (targetRotY * entryEase);
        } else {
            let currentY = cardGroup.rotation.y;
            while (currentY > Math.PI * 2.5) currentY -= Math.PI * 2;
            while (currentY < Math.PI * 1.5) currentY += Math.PI * 2;
            cardGroup.rotation.y = currentY + ((Math.PI * 2 + targetRotY) - currentY) * 0.04;
        }
    } else {
        cardGroup.position.set(curX, curY + Math.sin(time * 1.5) * 0.05, 0);
        cardGroup.rotation.y = time * 1.5;
        cardGroup.rotation.x = Math.sin(time * 0.5) * 0.1;
    }
    
    cardGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhysicalMaterial) {
            obj.material.opacity = cardOpacity;
            obj.material.transparent = true;
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
render();
