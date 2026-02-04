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
        errorMsg.textContent = '❌ Please enter a password!';
        return;
    }
    
    // Disable button during check
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking...';
    errorMsg.textContent = '';
    
    try {
        // Call Netlify function to check password
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
            errorMsg.textContent = '❌ Wrong password, try again!';
            input.value = '';
            input.style.animation = 'shake 0.5s';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        }
    } catch (error) {
        errorMsg.textContent = '❌ Error checking password. Please try again.';
        console.error('Password check error:', error);
    } finally {
        // Re-enable button
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
    let toScreen = document.getElementById(to + 'Screen');  // ← changé const en let

    if (from === 'animation') {
        toScreen = document.getElementById('mainPage');  // maintenant c'est possible
    }
    
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
    currentScreen = to;
}

// Heart animation with particles
function initHeartAnimation() {
    const canvas = document.getElementById('heartCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Particle class
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
            const colors = [
                '#ff1493', // Deep pink
                '#ff69b4', // Hot pink
                '#ffc0cb', // Pink
                '#ff91d7', // Light pink
                '#ffffff'  // White
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update(phase) {
            if (phase === 'forming') {
                // Move towards target position
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.speedX = dx * 0.05;
                this.speedY = dy * 0.05;
                this.x += this.speedX;
                this.y += this.speedY;
                
                if (this.opacity < 1) {
                    this.opacity += 0.02;
                }
            } else if (phase === 'dispersing') {
                // Disperse outward
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
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 0;
        }
    }
    
    // Create heart shape points
    function createHeartPoints() {
        const points = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = Math.min(canvas.width, canvas.height) / 4;
        
        // Generate points along heart curve
        for (let t = 0; t < Math.PI * 2; t += 0.05) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            
            points.push({
                x: centerX + x * scale / 16,
                y: centerY + y * scale / 16
            });
        }
        
        // Fill the heart with more points
        const filledPoints = [];
        for (let i = 0; i < points.length; i++) {
            filledPoints.push(points[i]);
            
            // Add intermediate points
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
    
    // Initialize particles
    const heartPoints = createHeartPoints();
    particles = [];
    
    heartPoints.forEach(point => {
        // Start particles from random positions
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        particles.push(new Particle(startX, startY, point.x, point.y));
    });
    
    let animationPhase = 'forming';
    let frameCount = 0;
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update(animationPhase);
            particle.draw();
        });
        
        frameCount++;
        
        // Check if heart is formed
        if (animationPhase === 'forming' && frameCount > 120) {
            if (!heartFormed) {
                heartFormed = true;
                showClickPrompt();
            }
        }
        
        // Remove particles that are too faded
        if (animationPhase === 'dispersing') {
            particles = particles.filter(p => p.opacity > 0);
            
            if (particles.length === 0) {
                // Animation complete, show main page
                setTimeout(() => {
                    switchScreen('animation', 'main');
                }, 500);
                return;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Show click prompt
    function showClickPrompt() {
        const prompt = document.getElementById('clickPrompt');
        setTimeout(() => {
            prompt.classList.add('show');
        }, 500);
    }
    
    // Handle click to disperse
    canvas.addEventListener('click', () => {
        if (heartFormed && !dispersing) {
            dispersing = true;
            animationPhase = 'dispersing';
            document.getElementById('clickPrompt').classList.remove('show');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // Start animation
    animate();
}

// Navigation function
function navigate(page) {
    // page est maintenant le chemin complet ex: "pages/letters"
    if (page.startsWith('pages/')) {
        window.location.href = page + '.html';
    } else {
        alert(page + " page - Coming soon! 💕");
    }
}

// Données des memories (à remplir avec tes vraies images et dates)
const memories = [
    { src: "images/memories/test.jpg", date: "2026-02-03", time: "14:30", category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2026-02-01", time: "19:15" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2026-01-28", time: "22:45" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2026-01-25", time: "12:10" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2026-01-20", time: "18:00" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-24", time: "21:30" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-22", time: "21:30" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-21", time: "21:30" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-24", time: "21:29" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-24", time: "21:28" , category: "Roblox" },
    { src: "images/memories/test.jpg", date: "2025-12-24", time: "21:27" , category: "Roblox" },
    // Ajoute-en autant que tu veux
];
// Carousel logic
const carouselTrack = document.getElementById('carouselTrack');
let currentIndex = 0;
const itemWidth = 340; // largeur item + gap

// Affichage des items
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

// Flèches
document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }
});

document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    if (currentIndex < memories.length - 1) {
        currentIndex++;
        carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }
});

// Drag / Swipe (PC + mobile)
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

carouselTrack.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - carouselTrack.offsetLeft;
    scrollLeft = carouselTrack.scrollLeft;
    carouselTrack.style.cursor = 'grabbing';
});

carouselTrack.addEventListener('mouseleave', () => {
    isDragging = false;
    carouselTrack.style.cursor = 'grab';
});

carouselTrack.addEventListener('mouseup', () => {
    isDragging = false;
    carouselTrack.style.cursor = 'grab';
});

carouselTrack.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselTrack.offsetLeft;
    const walk = (x - startX) * 2; // vitesse du drag
    carouselTrack.scrollLeft = scrollLeft - walk;
});

// Touch support (mobile swipe)
carouselTrack.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].pageX - carouselTrack.offsetLeft;
    scrollLeft = carouselTrack.scrollLeft;
});

carouselTrack.addEventListener('touchend', () => {
    isDragging = false;
});

carouselTrack.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - carouselTrack.offsetLeft;
    const walk = (x - startX) * 2;
    carouselTrack.scrollLeft = scrollLeft - walk;
});