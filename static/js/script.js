'use strict';

/**
 * PRELOAD
 * 
 * loading will be end after document is loaded
 */

const preloader = document.querySelector("[data-preload]");

window.addEventListener("load", function() {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
});

/**
 * add event listener on multiple elements
 */

const addEventOnElements = function(elements, eventType, callback) {
    for (let i = 0, len = elements.length; i < len; i++) {
        elements[i].addEventListener(eventType, callback);
    }
}

/**
 * NAVBAR
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function() {
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNavbar);

/**
 * HEADER & BACK TOP BTN
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

let lastScrollPos = 0;

const hideHeader = function() {
    const isScrollBottom = lastScrollPos < window.scrollY;
    if (isScrollBottom) {
        header.classList.add("hide");
    } else {
        header.classList.remove("hide");
    }

    lastScrollPos = window.scrollY;
}

window.addEventListener("scroll", function() {
    if (window.scrollY >= 50) {
        header.classList.add("active");
        backTopBtn.classList.add("active");
        hideHeader();
    } else {
        header.classList.remove("active");
        backTopBtn.classList.remove("active");
    }
});

/**
 * HERO SLIDER
 */

const heroSlider = document.querySelector("[data-hero-slider]");
const heroSliderItems = document.querySelectorAll("[data-hero-slider-item]");
const heroSliderPrevBtn = document.querySelector("[data-prev-btn]");
const heroSliderNextBtn = document.querySelector("[data-next-btn]");

let currentSlidePos = 0;
let lastActiveSliderItem = heroSliderItems[0];

const updateSliderPos = function() {
    lastActiveSliderItem.classList.remove("active");
    heroSliderItems[currentSlidePos].classList.add("active");
    lastActiveSliderItem = heroSliderItems[currentSlidePos];
}

const slideNext = function() {
    if (currentSlidePos >= heroSliderItems.length - 1) {
        currentSlidePos = 0;
    } else {
        currentSlidePos++;
    }

    updateSliderPos();
}

heroSliderNextBtn.addEventListener("click", slideNext);

const slidePrev = function() {
    if (currentSlidePos <= 0) {
        currentSlidePos = heroSliderItems.length - 1;
    } else {
        currentSlidePos--;
    }

    updateSliderPos();
}

heroSliderPrevBtn.addEventListener("click", slidePrev);

/**
 * auto slide
 */

let autoSlideInterval;

const autoSlide = function() {
    autoSlideInterval = setInterval(function() {
        slideNext();
    }, 7000);
}

addEventOnElements([heroSliderNextBtn, heroSliderPrevBtn], "mouseover", function() {
    clearInterval(autoSlideInterval);
});

addEventOnElements([heroSliderNextBtn, heroSliderPrevBtn], "mouseout", autoSlide);

window.addEventListener("load", autoSlide);

/**
 * PARALLAX EFFECT
 */

const parallaxItems = document.querySelectorAll("[data-parallax-item]");

let x, y;

window.addEventListener("mousemove", function(event) {
    x = (event.clientX / window.innerWidth * 10) - 5;
    y = (event.clientY / window.innerHeight * 10) - 5;

    // reverse the number eg. 20 -> -20, -5 -> 5
    x = x - (x * 2);
    y = y - (y * 2);

    for (let i = 0, len = parallaxItems.length; i < len; i++) {
        x = x * Number(parallaxItems[i].dataset.parallaxSpeed);
        y = y * Number(parallaxItems[i].dataset.parallaxSpeed);
        parallaxItems[i].style.transform = `translate3d(${x}px, ${y}px, 0px)`;
    }
});

// Function to display the selected image immediately
function displaySelectedImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('uploaded-image');
        const label = document.getElementById('add-img-label');
        label.innerHTML = '';  // Clear previous content
        label.appendChild(img);
    };
    reader.readAsDataURL(file);
}

// Function to handle image upload and display result
function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('resultText').innerText = data.error;
            } else {
                const tumorResult = data.result.toUpperCase();
                document.getElementById('resultText').innerHTML = 
                `<strong id="tumorName" class="hover-underline"   onclick="getTumorInfo('${tumorResult}')">${tumorResult}</strong>`;            }
            document.getElementById('analysisResult').style.display = 'flex';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('resultText').innerText = 'An error occurred';
            document.getElementById('analysisResult').style.display = 'block';
        });
}



// Function to get tumor information from the API
function getTumorInfo(tumorType) {
    $.ajax({
        url: '/get_tumor_info',
        type: 'GET',
        data: { tumor_type: tumorType },
        success: function(response) {
            document.getElementById('tumorInfo').innerText = response.info;
            document.getElementById('tumorInfoContainer').style.display = 'flex';
             // Play the sound
            var sound = document.getElementById('clickSound');
            sound.volume=.3;
            sound.play();
        },
        error: function(error) {
            console.log(error);
            document.getElementById('tumorInfo').innerText = 'An error occurred while fetching tumor information';
            document.getElementById('tumorInfoContainer').style.display = 'block';
        }
    });
}


// // Function to hide the tumor info container when overlay-login is clicked
// document.getElementById('overlay-login').addEventListener('click', function() {
//     document.getElementById('tumorInfoContainer').classLists.add('hidden');
//     console.log('hiii')
// });

// Event listener for file input change
function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        displaySelectedImage(file);
    }
}

// Function to handle form submission
function submitForm(event) {
    event.preventDefault();
    const fileInput = document.getElementById('add-single-img');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        uploadImage(file);  // Upload the image when form is submitted
    } else {
        alert("Please select a file first.");
    }
}

// Attach the onchange event to the file input
document.getElementById('add-single-img').addEventListener('change', handleFileInputChange);



                 ///////////Handle Login and Sign up/////////////

                 document.addEventListener('DOMContentLoaded', () => {
                    // Get references to DOM elements
                    const elements = {
                        bookBtns: document.querySelectorAll('.bookBtn'),
                        home: document.getElementById('home'),
                        loginForm: document.getElementById('loginForm'),
                        signUpForm: document.getElementById('signUpForm'),
                        overlayLogin: document.getElementById('overlay-login'),
                        showSignUp: document.getElementById('showSignUp'),
                        showLogin: document.getElementById('showLogin'),
                    };
                
                    // Helper function to toggle forms
                    const toggleForms = (showLoginForm) => {
                        elements.loginForm.classList.toggle('hidden', !showLoginForm);
                        elements.signUpForm.classList.toggle('hidden', showLoginForm);
                    };
                
                    // Handle form submissions
                    const handleFormSubmission = async (formId, url) => {
                        const form = document.getElementById(formId);
                        form.addEventListener('submit', async (event) => {
                            event.preventDefault();
                
                            const username = form.querySelector('input[type="text"]').value;
                            const password = form.querySelector('input[type="password"]').value;
                
                            try {
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ username, password }),
                                });
                
                                const result = await response.json();
                                alert(result.message);
                
                                if (response.ok && formId === 'signup') {
                                    elements.showLogin.click(); // Redirect to login form after signup
                                }

                                else if(response.ok && formId ==='login')
                                { 
                                    elements.loginForm.classList.add('hidden');
                                    elements.signUpForm.classList.add('hidden');
                                    elements.overlayLogin.style.display = 'none';
                                    elements.home.classList.remove('Blur');
                                    welcomeMessage.textContent = `Welcome, ${result.username}!`; // Show the welcome message
                                    welcomeMessage.style.display = 'block'; // Make the message visible
                                    setTimeout(() => {
                                        welcomeMessage.style.display = 'none'; // Hide the message after 5 seconds
                                    }, 10000);

                                }
                            } catch (error) {
                                alert('An error occurred');
                            }
                        });
                    };
                
                    // Initialize form submission handlers
                    handleFormSubmission('signup', '/signup');
                    handleFormSubmission('login', '/login');
                
                    // Handle book button clicks
                    elements.bookBtns.forEach((btn) => {
                        btn.addEventListener('click', (event) => {
                            event.preventDefault();
                
                            const userRegistered = false; // Simulate user registration status
                            elements.home.classList.add('Blur');
                            toggleForms(userRegistered);
                
                            elements.overlayLogin.style.display = 'block';
                        });
                    });
                
                    // Toggle between login and sign-up forms
                    elements.showSignUp.addEventListener('click', (event) => {
                        event.preventDefault();
                        toggleForms(false);
                    });
                
                    elements.showLogin.addEventListener('click', (event) => {
                        event.preventDefault();
                        toggleForms(true);
                    });
                
                    // Close overlay and hide forms
                    elements.overlayLogin.addEventListener('click', (event) => {
                        if (event.target === elements.overlayLogin) {
                            elements.loginForm.classList.add('hidden');
                            elements.signUpForm.classList.add('hidden');
                            elements.overlayLogin.style.display = 'none';
                            elements.home.classList.remove('Blur');
                        }
                    });
                
                    // Prevent event propagation on form containers
                    document.querySelectorAll('.form-container').forEach((container) => {
                        container.addEventListener('click', (event) => {
                            event.stopPropagation();
                        });
                    });
                });
                
                