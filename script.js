// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// These global variables would be provided by the environment in a real-world scenario.
// For local development, you would replace them with your actual Firebase config.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : { 
        apiKey: "YOUR_API_KEY", 
        authDomain: "YOUR_AUTH_DOMAIN", 
        projectId: "YOUR_PROJECT_ID" 
        // ... other config properties
    };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-pos-app';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const landingPage = document.getElementById('landing-page');
const posPage = document.getElementById('pos-page');

// --- New Auth Views and Forms ---
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// --- Buttons to switch between login/signup ---
const showLoginBtnHeader = document.getElementById('show-login-btn-header');
const showLoginBtnForm = document.getElementById('show-login-btn-form');
const showSignupBtnForm = document.getElementById('show-signup-btn-form');

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const productList = document.getElementById('product-list');
const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');

const messageModal = document.getElementById('message-modal');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// App state
let cart = [];

// MOCK PRODUCT DATA
const products = [
    { id: 1, name: 'Espresso', price: 2.50, imageUrl: 'https://placehold.co/300x200/d1c4e9/673ab7?text=Espresso' },
    { id: 2, name: 'Latte', price: 3.50, imageUrl: 'https://placehold.co/300x200/b2dfdb/009688?text=Latte' },
    { id: 3, name: 'Cappuccino', price: 3.50, imageUrl: 'https://placehold.co/300x200/ffcdd2/f44336?text=Cappuccino' },
    { id: 4, name: 'Americano', price: 3.00, imageUrl: 'https://placehold.co/300x200/c5cae9/3f51b5?text=Americano' },
    { id: 5, name: 'Croissant', price: 2.75, imageUrl: 'https://placehold.co/300x200/fff9c4/ffeb3b?text=Croissant' },
    { id: 6, name: 'Muffin', price: 2.25, imageUrl: 'https://placehold.co/300x200/f8bbd0/e91e63?text=Muffin' },
    { id: 7, name: 'Bagel', price: 3.25, imageUrl: 'https://placehold.co/300x200/dcedc8/8bc34a?text=Bagel' },
    { id: 8, name: 'Iced Tea', price: 2.50, imageUrl: 'https://placehold.co/300x200/bbdefb/2196f3?text=Iced+Tea' },
];

// --- UTILITY FUNCTIONS ---
const showMessage = (message) => {
    modalMessage.textContent = message;
    messageModal.classList.remove('hidden');
};

modalCloseBtn.addEventListener('click', () => {
    messageModal.classList.add('hidden');
});

// --- AUTHENTICATION & VIEW SWITCHING ---
onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        // User is signed in and email is verified.
        landingPage.classList.add('hidden');
        posPage.classList.remove('hidden');
        posPage.classList.add('flex'); // Make it flex container
        
        userEmailSpan.textContent = user.email;
        if(productList.innerHTML === '') {
            renderProducts();
        }
        updateCartView();
    } else {
        // User is signed out or email is not verified.
        landingPage.classList.remove('hidden');
        posPage.classList.add('hidden');
        posPage.classList.remove('flex');

        if (user && !user.emailVerified) {
            showMessage("Please verify your email to login. A new verification link has been sent if needed.");
        }

        cart = [];
        productList.innerHTML = '';
    }
});

const switchToLoginView = () => {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginView.classList.add('flex');
};

const switchToSignupView = () => {
    loginView.classList.add('hidden');
    loginView.classList.remove('flex');
    signupView.classList.remove('hidden');
};

showLoginBtnHeader.addEventListener('click', switchToLoginView);
showLoginBtnForm.addEventListener('click', switchToLoginView);
showSignupBtnForm.addEventListener('click', switchToSignupView);

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send verification email
        await sendEmailVerification(user);
        
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: user.email,
            createdAt: new Date(),
        });

        // Inform the user and sign them out to force login after verification
        showMessage("Account created! Please check your email to verify your account before signing in.");
        await signOut(auth);
        
    } catch (error) {
        console.error("Signup error:", error);
        showMessage(`Signup Failed: ${error.message}`);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            await signOut(auth);
            showMessage("Please verify your email before logging in. Check your inbox for the verification link.");
        }
        // onAuthStateChanged will handle UI switch if login is successful and verified
    } catch (error) {
        console.error("Login error:", error);
        showMessage(`Login Failed: ${error.message}`);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        switchToLoginView(); // Show login page after logout
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(`Error: ${error.message}`);
    }
});

// --- POS Functionality ---
function renderProducts() {
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card text-white';
        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-40 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/300x200/cccccc/ffffff?text=Image+Error';">
            <div class="p-4">
                <h3 class="font-bold text-lg">${product.name}</h3>
                <p class="text-gray-400">$${product.price.toFixed(2)}</p>
                <button data-id="${product.id}" class="add-to-cart-btn mt-4 w-full btn btn-primary">Add to Cart</button>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

function updateCartView() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        emptyCartMessage.classList.remove('hidden');
    } else {
        emptyCartMessage.classList.add('hidden');
        cart.forEach(item => {
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'flex justify-between items-center';
            cartItemEl.innerHTML = `
                <div><p class="font-semibold">${item.name}</p><p class="text-sm text-gray-400">$${item.price.toFixed(2)} x ${item.quantity}</p></div>
                <div class="flex items-center gap-2"><span class="font-bold">$${(item.price * item.quantity).toFixed(2)}</span><button data-id="${item.id}" class="remove-from-cart-btn text-red-500 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg></button></div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
    }
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

productList.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = parseInt(e.target.dataset.id);
        const product = products.find(p => p.id === productId);
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartView();
    }
});

cartItemsContainer.addEventListener('click', (e) => {
    const removeButton = e.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = parseInt(removeButton.dataset.id);
        cart = cart.filter(item => item.id !== productId);
        updateCartView();
    }
});

clearCartBtn.addEventListener('click', () => {
    cart = [];
    updateCartView();
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showMessage("Your cart is empty. Add some products before checking out.");
        return;
    }
    const total = totalEl.textContent;
    showMessage(`Checkout successful! Total: ${total}. Your cart has been cleared.`);
    cart = [];
    updateCartView();
});
