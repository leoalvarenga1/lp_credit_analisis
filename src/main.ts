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

    // Black background = fully invisible with AdditiveBlending (no purple-dot artifacts on Safari)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0,   'rgb(255, 255, 255)');
    grad.addColorStop(0.3, 'rgb(200, 200, 200)');
    grad.addColorStop(0.6, 'rgb(40,  40,  40)');
    grad.addColorStop(1,   'rgb(0,   0,   0)');

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

const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    alpha: true, 
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
    if (isMobileDevice) return;

    const cloudGeo = new THREE.PlaneGeometry(22, 14); 
    for (let i = 0; i < 15; i++) {
        const cloudMat = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            depthWrite: false,
            fog: true,
            blending: THREE.AdditiveBlending,
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

// --- NUVENS CSS PARA MOBILE (evita artefatos WebGL/purple dots) ---
let mobileCloudsContainer: HTMLDivElement | null = null;
if (isMobileDevice) {
    mobileCloudsContainer = document.createElement('div');
    mobileCloudsContainer.id = 'mobile-clouds';
    mobileCloudsContainer.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden;';
    document.body.appendChild(mobileCloudsContainer);
    const style = document.createElement('style');
    style.textContent = `@keyframes cloud-drift { from { transform:translateX(110vw); } to { transform:translateX(-120vw); } }`;
    document.head.appendChild(style);
    const cloudConfigs = [
        { top: '5%',  size: 280, duration: 35, delay: 0,   opacity: 0.35 },
        { top: '15%', size: 220, duration: 45, delay: -12,  opacity: 0.25 },
        { top: '25%', size: 320, duration: 40, delay: -20,  opacity: 0.3  },
        { top: '40%', size: 200, duration: 50, delay: -8,   opacity: 0.2  },
        { top: '55%', size: 260, duration: 38, delay: -25,  opacity: 0.3  },
        { top: '65%', size: 180, duration: 55, delay: -15,  opacity: 0.2  },
        { top: '75%', size: 300, duration: 42, delay: -30,  opacity: 0.25 },
        { top: '85%', size: 240, duration: 48, delay: -5,   opacity: 0.2  },
    ];
    for (const cfg of cloudConfigs) {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;top:${cfg.top};width:${cfg.size}px;height:${cfg.size * 0.55}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,${cfg.opacity}) 0%,rgba(255,255,255,0) 70%);animation:cloud-drift ${cfg.duration}s linear ${cfg.delay}s infinite;will-change:transform;pointer-events:none;`;
        mobileCloudsContainer.appendChild(el);
    }
}

// --- CRIAÇÃO DOS MODELOS ---

const cardGroup = new THREE.Group();

// 1. MODELO CARTÃO (Sessão 0)
const cardW = 2.65, cardH = 4.05;
loadHighResSVG('./VerticalCard.svg', 512, 828).then((frontTex) => {
    const cardGeo = new THREE.PlaneGeometry(cardW, cardH);
    const backTex = createBackTexture();
    const frontMat = new THREE.MeshPhysicalMaterial({ 
        map: frontTex, 
        transparent: true, 
        metalness: 0.1, 
        roughness: 0.4, 
        clearcoat: 0.3 
    });
    const frontMesh = new THREE.Mesh(cardGeo, frontMat);
    frontMesh.position.z = 0.01;
    cardGroup.add(frontMesh);
    const backMat = new THREE.MeshPhysicalMaterial({ 
        map: backTex, 
        transparent: true, 
        metalness: 0.1, 
        roughness: 0.4, 
        clearcoat: 0.3 
    });
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
// Hysteresis zone: card commits to a position and only leaves when scroll
// crosses a dedicated exit threshold — prevents oscillation from trackpad micro-reversals
// Zone 0 = hero (+X), Zone 1 = section 1 (-X), Zone 2 = section 2+ (+X)
let cardTargetZone = 0;
const clock = new THREE.Clock();

function render() {
    const isMob = window.innerWidth < 768;
    const time = clock.getElapsedTime();
    const scrollProgress = scrollY / window.innerHeight;

    if (activeSection === 0 && lastActiveSection !== 0) {
        cardEntryTime = time;
    }
    lastActiveSection = activeSection;

    // --- ANIMAÇÃO DAS NUVENS ---
    // Movemos apenas se houver nuvens no array (Desktop)
    if (clouds.length > 0) {
        clouds.forEach(cloud => {
            cloud.position.x -= (cloud as any).speed;
            if (cloud.position.x < -60) resetCloud(cloud);
        });
    }

    let skyFactor = 0;
    let cloudOpacityBase = 1.0;

    if (scrollProgress <= 1.0) {
        skyFactor = Math.max(0, Math.min(1, scrollProgress));
        cloudOpacityBase = 1.0 - skyFactor; 
    } else if (scrollProgress <= 2.0) {
        skyFactor = Math.max(0, Math.min(1, 1.0 - (scrollProgress - 1.0)));
        cloudOpacityBase = 1.0 - skyFactor;
    } else {
        skyFactor = Math.max(0, Math.min(1, scrollProgress - 2.0));
        cloudOpacityBase = 1.0 - skyFactor;
    }

    const currentSkyColor = skyBlue.clone().lerp(white, skyFactor);

    if (isMobileDevice) {
        scene.background = null;
        document.body.style.backgroundColor = `#${currentSkyColor.getHexString()}`;
        const mobAtm = document.getElementById('mobile-atmosphere');
        if (mobAtm) {
            mobAtm.style.opacity = (cloudOpacityBase * 0.7).toString();
        }
        if (mobileCloudsContainer) {
            mobileCloudsContainer.style.opacity = cloudOpacityBase.toString();
        }
    } else {
        scene.background = currentSkyColor;
        document.body.style.backgroundColor = 'white';
        
        // Ajustar opacidade das nuvens no Desktop
        clouds.forEach(cloud => {
            if (cloud.material instanceof THREE.MeshBasicMaterial) {
                cloud.material.opacity = cloudOpacityBase * 0.7;
            }
        });
    }

    if (scene.fog) (scene.fog as THREE.Fog).color.copy(currentSkyColor);

    let targetX = 0, targetY = 0;
    if (isMob) {
        targetX = 0; 
        targetY = 2.5; 
    } else {
        // Scale card X position on wide screens to avoid huge gap between text and card
        const widthScale = Math.min(1, 1920 / window.innerWidth);
        const cardXOffset = 3.8 * (0.5 + 0.5 * widthScale);
        // Hysteresis zones: different thresholds for entering vs leaving each zone.
        // This prevents the trackpad micro-reversal oscillation ("engasgada").
        // Enter zone going DOWN at lower sp; exit zone going UP at higher sp.
        if      (cardTargetZone === 0 && scrollProgress >= 0.20) cardTargetZone = 1;
        else if (cardTargetZone === 1 && scrollProgress <  0.40) cardTargetZone = 0;
        else if (cardTargetZone === 1 && scrollProgress >= 1.40) cardTargetZone = 2;
        else if (cardTargetZone === 2 && scrollProgress <  1.60) cardTargetZone = 1;
        const zoneX = [cardXOffset, -cardXOffset, cardXOffset];
        targetX = zoneX[cardTargetZone];
        targetY = 0;
    }

    const fovInRad = (camera.fov * Math.PI) / 180;
    const viewport3DHeight = 2 * Math.tan(fovInRad / 2) * camera.position.z;

    if (isMob) {
        curX = 0;
        const mobileLimit = 0.8;
        let targetMobileY: number;
        if (scrollProgress < mobileLimit) {
            targetMobileY = 2.5 + (scrollProgress * viewport3DHeight);
        } else {
            targetMobileY = 2.5 + (mobileLimit * viewport3DHeight) + (scrollProgress - mobileLimit) * viewport3DHeight * 0.5;
        }
        curY += (targetMobileY - curY) * 0.18;
    } else {
        // Fast easing when far from target (quickly clears text zones), slower on arrival
        const distX = Math.abs(targetX - curX);
        curX += (targetX - curX) * (distX > 2.0 ? 0.22 : 0.12);
        curY += (targetY - curY) * 0.1;
    }

    const baseCardScale = isMob ? 0.8 : 1.2;
    let cardOpacity = 1;

    if (isMob) {
        cardOpacity = Math.max(0, 1 - scrollProgress * 3.0);
    } else {
        if (scrollProgress <= 2.0) cardOpacity = 1;
        else cardOpacity = Math.max(0, 1 - (scrollProgress - 2.0));
    }
    
    if (!isMob) {
        const velocityX = (targetX - curX);
        const dist = Math.abs(velocityX);
        // Shrink card during transition to avoid overlapping text, grow back on arrival
        // Ultra-wide screens (>1920px) need more aggressive shrinking
        const distNorm = Math.min(1, dist / 7.6);
        const shrinkFactor = window.innerWidth > 1920 ? 0.82 : 0.65;
        const transitScale = baseCardScale * (1 - shrinkFactor * distNorm);
        cardGroup.scale.set(transitScale, transitScale, transitScale);

        const travelZ = -dist * 1.2;
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
        cardGroup.scale.set(baseCardScale, baseCardScale, baseCardScale);
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
