/* ============================================
   南境十里·墨染春水 | Personal Portfolio - Main JS
   ============================================ */

// ============================================
// Custom Cursor
// ============================================
const cursor = document.getElementById('cursor');
const cursorBlur = document.getElementById('cursor-blur');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorBlur.style.left = e.clientX + 'px';
    cursorBlur.style.top = e.clientY + 'px';
});

document.querySelectorAll('a, button, .project-card, .skill-item, .stat-card, .contact-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(2)';
        cursorBlur.style.transform = 'scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursorBlur.style.transform = 'scale(1)';
    });
});

// ============================================
// Particle Animation (Hero Section)
// ============================================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let particleCount;
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particleCount = Math.floor((canvas.width * canvas.height) / 15000);
    particleCount = Math.max(30, Math.min(100, particleCount));
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
            const force = (150 - dist) / 150 * 0.5;
            this.x -= dx * force * 0.01;
            this.y -= dy * force * 0.01;
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 106, 255, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}
initParticles();

let connectionDistance = 150;
function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
                const opacity = (1 - dist / connectionDistance) * 0.3;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.strokeStyle = `rgba(124, 106, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ============================================
// Typing Effect (Terminal)
// ============================================
const typingCmd = document.querySelector('.typing-cmd');
if (typingCmd) {
    const commands = [
        './build.sh --target future',
        'g++ -std=c++17 main.cpp -o app',
        'git push origin main',
        'make && ./server',
        'gdb ./program core.dump'
    ];
    let cmdIdx = 0, chIdx = 0, isDeleting = false;

    function typeCmd() {
        const current = commands[cmdIdx];
        if (isDeleting) {
            typingCmd.textContent = current.substring(0, chIdx - 1);
            chIdx--;
        } else {
            typingCmd.textContent = current.substring(0, chIdx + 1);
            chIdx++;
        }
        if (!isDeleting && chIdx === current.length) {
            isDeleting = true;
            setTimeout(typeCmd, 2000);
            return;
        }
        if (isDeleting && chIdx === 0) {
            isDeleting = false;
            cmdIdx = (cmdIdx + 1) % commands.length;
            setTimeout(typeCmd, 500);
            return;
        }
        setTimeout(typeCmd, isDeleting ? 30 : 60);
    }
    typeCmd();
}

// ============================================
// Navbar Scroll
// ============================================
const navbar = document.getElementById('navbar');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
});

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

function updateActiveLink() {
    const sections = ['home', 'about', 'skills', 'projects', 'contact'];
    let current = '';
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) current = id;
        }
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}

// ============================================
// Scroll Animations (Intersection Observer)
// ============================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Trigger number counter when stat cards appear
            if (entry.target.classList.contains('stat-number')) {
                animateCounter(entry.target);
            }
            // Trigger skill bar animation
            if (entry.target.classList.contains('skill-progress')) {
                entry.target.style.width = entry.target.dataset.width + '%';
            }
        }
    });
}, { threshold: 0.15 });

// Observe skill bars
document.querySelectorAll('.skill-progress').forEach(el => observer.observe(el));

// Observe stat numbers
document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));

// Observe stat cards
document.querySelectorAll('.stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    observer.observe(el);
});

// Observe project cards
document.querySelectorAll('.project-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                }, i * 150);
            }
        });
    }, { threshold: 0.1 });
    cardObserver.observe(el);
});

// Observe sections
document.querySelectorAll('section').forEach(el => observer.observe(el));

// ============================================
// Number Counter Animation
// ============================================
function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    if (!target || el.classList.contains('counted')) return;
    el.classList.add('counted');

    let current = 0;
    const increment = target > 50 ? Math.ceil(target / 60) : 1;
    const duration = 1500;
    const stepTime = Math.floor(duration / (target / increment));

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.textContent = target + (el.dataset.target == 50 ? 'K+' : '+');
            clearInterval(timer);
        } else {
            el.textContent = current;
        }
    }, stepTime);
}

// ============================================
// Smooth Scroll (fallback for Safari)
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============================================
// Parallax Effect on Hero
// ============================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroContainer = document.querySelector('.hero-container');
    const terminal = document.querySelector('.terminal-decoration');
    if (heroContainer && scrollY < window.innerHeight) {
        heroContainer.style.transform = `translateY(${scrollY * 0.15}px)`;
        heroContainer.style.opacity = 1 - scrollY / (window.innerHeight * 0.8);
    }
    if (terminal && scrollY < window.innerHeight) {
        terminal.style.transform = `translateY(${scrollY * 0.08}px)`;
    }
});

// ============================================
// Loading animation
// ============================================
window.addEventListener('load', () => {
    document.querySelector('.hero-title').style.opacity = '1';
});

console.log('%c 南境十里·墨染春水 ',
    'background:linear-gradient(135deg,#c4b5fd,#f9a8d4,#fbbf24); color:white; font-size:18px; font-weight:bold; padding:10px 20px; border-radius:8px; font-family:serif;');
console.log('%c C/C++ Developer | Open to opportunities ',
    'color:#8888a0; font-size:13px; padding:5px; font-family:monospace;');
console.log('%c 南境十里，墨染春水。笔耕不辍，码上生花。 ',
    'color:#b8a9ff; font-size:12px; padding:3px 5px; font-family:serif;');

// ============================================
// 网站运行天数
// ============================================
(function updateSiteAge() {
    const el = document.getElementById('site-age');
    if (!el) return;
    const startDate = new Date('2026-06-14');
    const now = new Date();
    const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    el.textContent = `Running ${diff} days`;
})();

// ============================================
// 访问计数器
// ============================================
(function checkViewCount() {
    const checkExist = setInterval(() => {
        const pv = document.getElementById('busuanzi_value_site_pv');
        if (pv && pv.textContent && pv.textContent !== '0' && pv.textContent !== '') {
            clearInterval(checkExist);
        }
    }, 500);
    // 10秒后停止检查
    setTimeout(() => clearInterval(checkExist), 10000);
})();
