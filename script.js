// Simple Neuron Network Background
class Particle {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
        this.canvas = canvas;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;

        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
    if (particles.length === 0) {
        createParticles();
    }
}

function createParticles() {
    particles = [];
    const particleCount = Math.floor((canvas.width * canvas.height) / 25000);
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push(new Particle(x, y, canvas));
    }
}

function drawLines() {
    const connectionDistance = 150;
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                const opacity = 1 - distance / connectionDistance;
                ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
    });

    drawLines();
    requestAnimationFrame(animate);
}

// Event listeners
window.addEventListener('resize', resizeCanvas);

// Initialize
resizeCanvas();
animate();

// Fetch Discord news immediately and on page load
fetchDiscordNews();

// Also fetch on DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', fetchDiscordNews);

// Auto-refresh news every 30 seconds
setInterval(fetchDiscordNews, 30000);

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Discord News Block Integration
async function fetchDiscordNews() {
    try {
        const response = await fetch(DISCORD_CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to fetch news');
        
        const messages = await response.json();
        displayNews(messages);
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Display news items in the news container
function displayNews(messages) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    
    // Store messages globally for modal
    window.allNewsMessages = messages || [];
    
    if (!messages || messages.length === 0) {
        newsContainer.innerHTML = '';
        return;
    }
    
    newsContainer.innerHTML = '';
    
    messages.forEach(message => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const date = new Date(message.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Render markdown if marked library is available
        let renderedContent = message.content;
        if (typeof marked !== 'undefined') {
            renderedContent = marked.parse(message.content);
        } else {
            renderedContent = escapeHtml(message.content).replace(/\n/g, '<br>');
        }
        
        newsItem.innerHTML = `
            <div class="news-content">${renderedContent}</div>
            <span class="news-date">${date}</span>
        `;
        
        newsContainer.appendChild(newsItem);
    });
}

// Open news modal with all news
function openNewsModal() {
    const modal = document.getElementById('news-modal');
    const modalList = document.getElementById('news-modal-list');
    
    if (!window.allNewsMessages || window.allNewsMessages.length === 0) {
        modalList.innerHTML = '<p style="text-align: center; color: #888;">No news available yet.</p>';
    } else {
        modalList.innerHTML = '';
        window.allNewsMessages.forEach(message => {
            const date = new Date(message.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            let renderedContent = message.content;
            if (typeof marked !== 'undefined') {
                renderedContent = marked.parse(message.content);
            } else {
                renderedContent = escapeHtml(message.content).replace(/\n/g, '<br>');
            }
            
            const newsItem = document.createElement('div');
            newsItem.className = 'news-modal-item';
            newsItem.innerHTML = `
                <div class="news-content">${renderedContent}</div>
                <span class="news-modal-date">${date}</span>
            `;
            
            modalList.appendChild(newsItem);
        });
    }
    
    modal.classList.add('active');
}

// Close news modal
function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('news-modal');
    if (e.target === modal) {
        closeNewsModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNewsModal();
    }
});

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Post news to Discord
async function postNewsToDiscord(title, content) {
    try {
        const response = await fetch(DISCORD_CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error('Failed to post news');
        return true;
    } catch (error) {
        console.error('Failed to post news:', error);
        return false;
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.info-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
