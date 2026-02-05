// State management
let currentScreen = 'password';
let particles = [];
let heartFormed = false;
let dispersing = false;

console.log('SCRIPT.JS VERSION LIVE - Chargé le : ' + new Date().toISOString() + ' - Pas de mode dev ici !');

// Password validation using Netlify function
async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');
    const password = input.value;
    
    if (!password) {
        errorMsg.textContent = 'Please enter a password!';
        return;
    }
    
    // Disable button during check
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking...';
    errorMsg.textContent = '';
    
    try {
        const response = await fetch('/.netlify/functions/check-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            errorMsg.textContent = '';
            showAnimation();
        } else {
            errorMsg.textContent = 'Wrong password, try again!';
            input.value = '';
            input.style.animation = 'shake 0.5s';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        }
    } catch (error) {
        errorMsg.textContent = 'Error checking password. Please try again.';
        console.error('Password check error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enter';
    }
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Handle Enter key for password
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        passwordInput.focus();
    }
});

// Show animation screen
function showAnimation() {
    switchScreen('password', 'animation');
    setTimeout(() => {
        initHeartAnimation();
    }, 300);
}

// Screen switching
function switchScreen(from, to) {
    const fromScreen = document.getElementById(from + 'Screen');
    let toScreen = document.getElementById(to + 'Screen');

    if (from === 'animation') {
        toScreen = document.getElementById('mainPage');
    }
    
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
    currentScreen = to;
}

// Heart animation with particles
function initHeartAnimation() {
    const canvas = document.getElementById('heartCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    class Particle {
        constructor(x, y, targetX, targetY) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.startX = x;
            this.startY = y;
            this.size = Math.random() * 3 + 2;
            this.speedX = 0;
            this.speedY = 0;
            this.opacity = 0;
            this.color = this.getColor();
        }
        
        getColor() {
            const colors = ['#ff1493', '#ff69b4', '#ffc0cb', '#ff91d7', '#ffffff'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update(phase) {
            if (phase === 'forming') {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.speedX = dx * 0.05;
                this.speedY = dy * 0.05;
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.opacity < 1) this.opacity += 0.02;
            } else if (phase === 'dispersing') {
                const angle = Math.atan2(this.y - canvas.height / 2, this.x - canvas.width / 2);
                this.speedX = Math.cos(angle) * 5;
                this.speedY = Math.sin(angle) * 5;
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= 0.03;
            }
        }
        
        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    function createHeartPoints() {
        const points = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = Math.min(canvas.width, canvas.height) / 4;
        
        for (let t = 0; t < Math.PI * 2; t += 0.05) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            points.push({
                x: centerX + x * scale / 16,
                y: centerY + y * scale / 16
            });
        }
        
        const filledPoints = [];
        for (let i = 0; i < points.length; i++) {
            filledPoints.push(points[i]);
            for (let j = 0; j < 5; j++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * scale * 0.6;
                filledPoints.push({
                    x: centerX + Math.cos(angle) * radius * 1.2,
                    y: centerY + Math.sin(angle) * radius * 0.9 - scale * 0.2
                });
            }
        }
        return filledPoints;
    }
    
    const heartPoints = createHeartPoints();
    particles = [];
    
    heartPoints.forEach(point => {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        particles.push(new Particle(startX, startY, point.x, point.y));
    });
    
    let animationPhase = 'forming';
    let frameCount = 0;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update(animationPhase);
            particle.draw();
        });
        
        frameCount++;
        
        if (animationPhase === 'forming' && frameCount > 120) {
            if (!heartFormed) {
                heartFormed = true;
                showClickPrompt();
            }
        }
        
        if (animationPhase === 'dispersing') {
            particles = particles.filter(p => p.opacity > 0);
            if (particles.length === 0) {
                setTimeout(() => {
                    switchScreen('animation', 'main');
                }, 500);
                return;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    function showClickPrompt() {
        const prompt = document.getElementById('clickPrompt');
        setTimeout(() => prompt.classList.add('show'), 500);
    }
    
    canvas.addEventListener('click', () => {
        if (heartFormed && !dispersing) {
            dispersing = true;
            animationPhase = 'dispersing';
            document.getElementById('clickPrompt').classList.remove('show');
        }
    });
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    animate();
}

// Navigation function
function navigate(page) {
    if (page.startsWith('pages/')) {
        window.location.href = page + '.html';
    } else {
        alert(page + " page - Coming soon! 💕");
    }
}

// Memories data (ajoute tes vraies images)
const memories = [
    { src: "images/memories/test.jpg", date: "03/02/2026", time: "13:44", category: "Roblox" },
    { src: "images/memories/test.jpg", date: "01/02/2026", time: "19:15", category: "Our walk" },
    { src: "images/memories/test.jpg", date: "28/01/2026", time: "22:45", category: "Cute moment" },
    // Ajoute tes images ici
];

// Carousel Memories amélioré
const carouselTrack = document.getElementById('carouselTrack');
let currentIndex = 0;
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// Drag/Swipe (PC + mobile)
function startDragging(e) {
    isDragging = true;
    startX = (e.type.includes('touch') ? e.touches[0].pageX : e.pageX) - carouselTrack.offsetLeft;
    scrollLeft = carouselTrack.scrollLeft;
    carouselTrack.style.cursor = 'grabbing';
    carouselTrack.style.userSelect = 'none';
}

function stopDragging() {
    isDragging = false;
    carouselTrack.style.cursor = 'grab';
    carouselTrack.style.userSelect = 'auto';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const x = (e.type.includes('touch') ? e.touches[0].pageX : e.pageX) - carouselTrack.offsetLeft;
    const walk = (x - startX) * 1.8; // sensibilité
    carouselTrack.scrollLeft = scrollLeft - walk;
}

carouselTrack.addEventListener('mousedown', startDragging);
carouselTrack.addEventListener('touchstart', startDragging);
carouselTrack.addEventListener('mouseleave', stopDragging);
carouselTrack.addEventListener('mouseup', stopDragging);
carouselTrack.addEventListener('touchend', stopDragging);
carouselTrack.addEventListener('mousemove', drag);
carouselTrack.addEventListener('touchmove', drag);

// Flèches clavier ← →
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        carouselTrack.scrollTo({ left: currentIndex * 340, behavior: 'smooth' });
    }
    if (e.key === 'ArrowRight' && currentIndex < memories.length - 1) {
        currentIndex++;
        carouselTrack.scrollTo({ left: currentIndex * 340, behavior: 'smooth' });
    }
});

// Flèches visuelles
document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        carouselTrack.scrollTo({ left: currentIndex * 340, behavior: 'smooth' });
    }
});

document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    if (currentIndex < memories.length - 1) {
        currentIndex++;
        carouselTrack.scrollTo({ left: currentIndex * 340, behavior: 'smooth' });
    }
});

// Populate carousel
if (carouselTrack && memories.length > 0) {
    memories.forEach(mem => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.style.backgroundImage = `url(${mem.src})`;

        const info = document.createElement('div');
        info.className = 'carousel-item-info';
        
        const dateTime = document.createElement('div');
        dateTime.className = 'date-time';
        dateTime.textContent = `${mem.date}, ${mem.time}`;
        
        const category = document.createElement('div');
        category.className = 'category';
        category.textContent = `(${mem.category})`;
        
        info.appendChild(dateTime);
        info.appendChild(category);
        item.appendChild(info);
        
        carouselTrack.appendChild(item);
    });
} else {
    console.error("Carousel track not found or no memories data");
}