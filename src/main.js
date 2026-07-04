import './index.css';
import { init3D } from './three-scene.js';
import { worksData } from './works-data.js';

// Eagerly import all processed brand logos as URLs
const brandLogos = import.meta.glob('/src/assets/brands/processed/*.webp', { eager: true, query: '?url', import: 'default' });

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize the WebGL 3D Canvas Scene
    init3D();

    // 2. Entrance Reveal Animations via Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.02,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // 3. Floating Capsule Nav Active Highlights & Smooth Scrolling
    const navLinks = document.querySelectorAll('.nav-links a, .drawer-links a:not(.btn-talk)');
    const sections = document.querySelectorAll('section');

    const updateActiveSection = () => {
        let currentActiveSectionId = 'hero';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150; // offset for floating nav
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentActiveSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentActiveSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', updateActiveSection);

    // Smooth Scroll Click Handlers
    const allScrollLinks = document.querySelectorAll('a[href^="#"]');
    allScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            // Close mobile drawer if open
            const drawer = document.querySelector('.mobile-drawer');
            const hamburger = document.querySelector('.hamburger');
            if (drawer && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                hamburger.classList.remove('active');
            }

            const headerOffset = 120;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });

    // 4. Mobile Hamburger & Drawer Controls
    const hamburger = document.querySelector('.hamburger');
    const mobileDrawer = document.querySelector('.mobile-drawer');

    if (hamburger && mobileDrawer) {
        hamburger.addEventListener('click', () => {
            mobileDrawer.classList.toggle('open');
            hamburger.classList.toggle('active');
        });

        // Close drawer if clicking outside the nav capsule area
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileDrawer.contains(e.target)) {
                mobileDrawer.classList.remove('open');
                hamburger.classList.remove('active');
            }
        });
    }

    // 5. Capabilities Cards Horizontal Scroll Drag-to-Scroll
    const capSliderWrapper = document.querySelector('.capabilities-slider-wrapper');
    if (capSliderWrapper) {
        let isDown = false;
        let startX;
        let scrollLeft;

        capSliderWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            capSliderWrapper.classList.add('active-drag');
            startX = e.pageX - capSliderWrapper.offsetLeft;
            scrollLeft = capSliderWrapper.scrollLeft;
        });

        capSliderWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            capSliderWrapper.classList.remove('active-drag');
        });

        capSliderWrapper.addEventListener('mouseup', () => {
            isDown = false;
            capSliderWrapper.classList.remove('active-drag');
        });

        capSliderWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - capSliderWrapper.offsetLeft;
            const walk = (x - startX) * 1.5; // scroll speed multiplier
            capSliderWrapper.scrollLeft = scrollLeft - walk;
        });
    }

    // 6. Testimonials Carousel Slider Logic
    const testimonialsTrack = document.querySelector('.testimonials-track');
    const testimonialsCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (testimonialsTrack && testimonialsCards.length > 0 && prevBtn && nextBtn) {
        let slideIndex = 0;
        
        const getSlidesPerView = () => {
            return window.innerWidth > 1024 ? 2 : 1;
        };

        const updateSliderPosition = () => {
            const slidesPerView = getSlidesPerView();
            const cardWidth = testimonialsCards[0].offsetWidth;
            const gap = parseFloat(window.getComputedStyle(testimonialsTrack).gap) || 0;
            
            const maxIndex = testimonialsCards.length - slidesPerView;
            if (slideIndex > maxIndex) slideIndex = maxIndex;
            if (slideIndex < 0) slideIndex = 0;

            const translation = slideIndex * (cardWidth + gap);
            testimonialsTrack.style.transform = `translateX(-${translation}px)`;

            // Toggle button states
            prevBtn.style.opacity = slideIndex === 0 ? '0.3' : '1';
            prevBtn.style.pointerEvents = slideIndex === 0 ? 'none' : 'auto';
            nextBtn.style.opacity = slideIndex === maxIndex ? '0.3' : '1';
            nextBtn.style.pointerEvents = slideIndex === maxIndex ? 'none' : 'auto';
        };

        nextBtn.addEventListener('click', () => {
            const maxIndex = testimonialsCards.length - getSlidesPerView();
            if (slideIndex < maxIndex) {
                slideIndex++;
                updateSliderPosition();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (slideIndex > 0) {
                slideIndex--;
                updateSliderPosition();
            }
        });

        // Re-align on resize
        window.addEventListener('resize', updateSliderPosition);
        
        // Initial setup
        setTimeout(updateSliderPosition, 100);
    }

    // 6.5. Dynamic Portfolio Grid rendering and filtering
    const portfolioGrid = document.getElementById('portfolio-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (portfolioGrid && filterButtons.length > 0) {
        const renderWorks = (filterCategory = 'all') => {
            portfolioGrid.innerHTML = '';
            
            const filteredWorks = filterCategory === 'all' 
                ? worksData 
                : worksData.filter(work => work.category === filterCategory);

            filteredWorks.forEach((work, index) => {
                const card = document.createElement('div');
                card.className = 'portfolio-card fade-in';
                card.style.animationDelay = `${index * 0.03}s`;

                const tagsHTML = work.tags.map(tag => `<span>${tag}</span>`).join('');

                card.innerHTML = `
                    <div class="portfolio-image-wrapper">
                        <div class="project-thumbnail project-${work.category}">
                            ${work.initials}
                        </div>
                    </div>
                    <div class="portfolio-info">
                        <span class="project-category">${work.sector}</span>
                        <h3>${work.title}</h3>
                        <p>${work.desc}</p>
                        <div class="project-tech">
                            ${tagsHTML}
                        </div>
                    </div>
                `;

                portfolioGrid.appendChild(card);
            });
        };

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                portfolioGrid.style.opacity = '0';
                setTimeout(() => {
                    renderWorks(btn.dataset.filter);
                    portfolioGrid.style.opacity = '1';
                }, 150);
            });
        });

        renderWorks();
    }

    // 6.8. Dynamic Brands Showcase Marquee Rendering
    const track1 = document.getElementById('marquee-track-1');
    const track2 = document.getElementById('marquee-track-2');
    
    if (track1 && track2) {
        const getAltText = (filePath) => {
            const filename = filePath.split('/').pop().split('.')[0];
            const decoded = decodeURIComponent(filename)
                .replace(/[\-_]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            return decoded;
        };

        const html = Object.entries(brandLogos).map(([path, url]) => {
            const alt = getAltText(path);
            return `<img src="${url}" alt="${alt}" />`;
        }).join('\n');
        
        track1.innerHTML = html;
        track2.innerHTML = html;
    }
});

// 7. Interactive Contact Form handler with FormSubmit API
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const successPanel = document.getElementById('form-success');
    
    if (contactForm && successPanel) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Visual feedback: Disable button and show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin" style="margin-left: 8px;"></i>';
            }

            const formData = new FormData(contactForm);
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/support@digiboostsolutions.com', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    // Successful submission transition
                    contactForm.style.opacity = '0';
                    setTimeout(() => {
                        contactForm.style.display = 'none';
                        successPanel.classList.add('active');
                    }, 300);
                } else {
                    alert('Oops! There was a problem submitting your form. Please try again.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Submit Inquiry <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>';
                    }
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Connection error. Please check your internet and try again.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Inquiry <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>';
                }
            }
        });
    }
});

window.resetFormState = () => {
    const contactForm = document.getElementById('contact-form');
    const successPanel = document.getElementById('form-success');
    
    if (contactForm && successPanel) {
        successPanel.classList.remove('active');
        setTimeout(() => {
            contactForm.reset();
            contactForm.style.display = 'block';
            setTimeout(() => {
                contactForm.style.opacity = '1';
                // Reset submit button text
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Inquiry <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>';
                }
            }, 50);
        }, 300);
    }
};
