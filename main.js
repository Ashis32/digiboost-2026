import { init3D } from './three-scene.js';

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
            prevBtn.style.opacity = slideIndex === 0 ? '0.4' : '1';
            nextBtn.style.opacity = slideIndex === maxIndex ? '0.4' : '1';
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
});

// 7. Interactive Mock Contact Form handler
window.handleFormSubmit = () => {
    const contactForm = document.getElementById('contact-form');
    const successPanel = document.getElementById('form-success');
    
    if (contactForm && successPanel) {
        // Simple visual transition
        contactForm.style.opacity = '0';
        setTimeout(() => {
            contactForm.style.display = 'none';
            successPanel.classList.add('active');
        }, 300);
    }
};

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
            }, 50);
        }, 300);
    }
};
