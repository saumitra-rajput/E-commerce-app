// frontend/script.js
const API_URL = '/api';  // Use nginx proxy
let token = localStorage.getItem('token');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Update cart count
function updateCartCount() {
    document.getElementById('cartCount').innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Load pages
async function loadPage(page) {
    const content = document.getElementById('content');
    
    if (page === 'home') {
        content.innerHTML = `
            <div class="text-center py-12">
                <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome to ShopAI</h1>
                <p class="text-xl text-gray-600 mb-8">Your AI-powered shopping experience</p>
                <div class="grid md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow">🛍️ 1000+ Products</div>
                    <div class="bg-white p-6 rounded-lg shadow">🤖 AI Shopping Assistant</div>
                    <div class="bg-white p-6 rounded-lg shadow">🚚 Free Shipping</div>
                </div>
            </div>
        `;
    } else if (page === 'products') {
        try {
            const response = await fetch(`${API_URL}/products`);
            const products = await response.json();
            
            content.innerHTML = `
                <h2 class="text-2xl font-bold mb-6">Our Products</h2>
                <div class="grid md:grid-cols-4 gap-6">
                    ${products.map(p => `
                        <div class="bg-white rounded-lg shadow p-4">
                            <div class="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center text-4xl">
                                📦
                            </div>
                            <h3 class="font-bold text-lg">${p.name}</h3>
                            <p class="text-gray-600 text-sm">${p.description || 'No description'}</p>
                            <p class="text-purple-600 font-bold mt-2">$${p.price}</p>
                            <p class="text-sm text-gray-500">Stock: ${p.stock}</p>
                            <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})" 
                                    class="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full">
                                Add to Cart
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div class="text-red-500">Error loading products: ${error.message}</div>`;
        }
    }
}

// Cart functions
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${name} added to cart!`);
}

function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="text-gray-500">Your cart is empty</p>';
        cartTotalSpan.innerText = '0';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-sm text-gray-500">$${item.price} x ${item.quantity}</p>
                </div>
                <div>
                    <button onclick="updateQuantity(${item.id}, -1)" class="bg-gray-200 px-2 rounded">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="bg-gray-200 px-2 rounded">+</button>
                    <button onclick="removeFromCart(${item.id})" class="ml-2 text-red-500">🗑️</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalSpan.innerText = total.toFixed(2);
    }
    
    modal.classList.remove('hidden');
}

function closeCart() {
    document.getElementById('cartModal').classList.add('hidden');
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showCart(); // Refresh cart display
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
}

async function checkout() {
    if (!token) {
        alert('Please login first');
        showLogin();
        return;
    }
    
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ total, items: cart })
        });
        
        if (response.ok) {
            alert('Order placed successfully!');
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeCart();
        } else {
            alert('Failed to place order');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Auth functions
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function closeLogin() {
    document.getElementById('loginModal').classList.add('hidden');
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            document.getElementById('authBtn').innerHTML = 'Logout';
            document.getElementById('authBtn').onclick = logout;
            closeLogin();
            alert('Login successful!');
            loadPage('products');
        } else {
            alert('Login failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert('Registration failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('authBtn').innerHTML = 'Login';
    document.getElementById('authBtn').onclick = showLogin;
    alert('Logged out');
}

// Chatbot
const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const chatMessages = document.getElementById('chatMessages');

chatBubble.onclick = () => chatWindow.classList.toggle('hidden');
closeChat.onclick = () => chatWindow.classList.add('hidden');

sendChat.onclick = async () => {
    const message = chatInput.value.trim();
    if (!message) return;
    
    chatMessages.innerHTML += `<div class="message-user">${message}</div>`;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        chatMessages.innerHTML += `<div class="message-bot">🤖 ${data.response}</div>`;
    } catch (error) {
        chatMessages.innerHTML += `<div class="message-bot">❌ Error: ${error.message}</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

chatInput.onkeypress = (e) => {
    if (e.key === 'Enter') sendChat.click();
};

// Initialize
updateCartCount();
if (token) {
    document.getElementById('authBtn').innerHTML = 'Logout';
    document.getElementById('authBtn').onclick = logout;
} else {
    document.getElementById('authBtn').innerHTML = 'Login';
    document.getElementById('authBtn').onclick = showLogin;
}

loadPage('home');
