const API_URL = '/api';
let token = localStorage.getItem('token');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) {
        const div = document.createElement('div');
        div.id = 'notification';
        div.className = `notification notification-${type}`;
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    } else {
        notification.textContent = message;
        notification.className = `notification notification-${type}`;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.innerText = count;
}

async function showProducts() {
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';
    
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <h2 class="section-title">Our Products</h2>
            <div class="products-grid">
                ${products.map(p => `
                    <div class="product-card">
                        <div class="product-image-container">
                            <img src="${p.image_url || 'https://placehold.co/400x300/6366f1/white?text=Product'}" 
                                 alt="${p.name}" 
                                 class="product-image"
                                 loading="lazy"
                                 onerror="this.src='https://placehold.co/400x300/6366f1/white?text=${p.name}'">
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${p.name}</h3>
                            <div class="product-price">$${p.price.toFixed(2)}</div>
                            <p class="product-description">${p.description ? p.description.substring(0, 80) : ''}${p.description && p.description.length > 80 ? '...' : ''}</p>
                            <div class="product-stock ${p.stock > 0 ? 'stock-in' : 'stock-out'}">
                                ${p.stock > 0 ? `✓ In Stock (${p.stock})` : '✗ Out of Stock'}
                            </div>
                            <button onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price})" 
                                    class="add-to-cart" 
                                    ${p.stock === 0 ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch(e) {
        console.error(e);
        showNotification('Error loading products', 'error');
    }
}

function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${name} added to cart!`, 'success');
}

function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>';
        document.getElementById('cartTotal').innerText = '0';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, -1)" class="quantity-btn">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="quantity-btn">+</button>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cartTotal').innerText = total.toFixed(2);
    }
    
    modal.style.display = 'block';
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
        showCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
    showNotification('Item removed from cart', 'success');
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

async function checkout() {
    if (!token) {
        showNotification('Please login first', 'error');
        showLogin();
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    checkoutBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                total: total,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification('Order placed successfully! 🎉', 'success');
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeCart();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to place order', 'error');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
    }
}

async function showOrders() {
    if (!token) {
        showNotification('Please login first', 'error');
        showLogin();
        return;
    }
    
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        const content = document.getElementById('content');
        
        if (!orders || orders.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 4rem; color: #9ca3af;"></i>
                    <p style="margin-top: 1rem;">No orders yet</p>
                    <button onclick="showProducts()" class="btn-primary" style="margin-top: 1rem; width: auto; padding: 0.5rem 2rem;">
                        Start Shopping
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <h2 class="section-title">My Orders</h2>
                <div class="orders-list">
                    ${orders.map(o => `
                        <div class="order-card">
                            <div class="order-header">
                                <span class="order-number">${o.order_number}</span>
                                <span class="order-status status-${o.status}">${o.status}</span>
                            </div>
                            <div><strong>Total:</strong> $${o.total.toFixed(2)}</div>
                            <div><strong>Date:</strong> ${new Date(o.created_at).toLocaleDateString()}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch(error) {
        console.error('Orders error:', error);
        document.getElementById('content').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444;"></i>
                <p style="margin-top: 1rem;">Error loading orders: ${error.message}</p>
                <button onclick="showOrders()" class="btn-primary" style="margin-top: 1rem; width: auto; padding: 0.5rem 2rem;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (res.ok) {
            const data = await res.json();
            token = data.token;
            localStorage.setItem('token', token);
            updateAuthUI();
            closeLogin();
            showNotification(`Welcome back, ${data.user.name}!`, 'success');
            showProducts();
        } else {
            showNotification('Invalid credentials', 'error');
        }
    } catch(e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

async function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!name || !email || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (res.ok) {
            showNotification('Registration successful! Please login.', 'success');
            showLogin();
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            const data = await res.json();
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch(e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    showProducts();
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const ordersBtn = document.getElementById('ordersBtn');
    
    if (token) {
        authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        authBtn.onclick = logout;
        if (ordersBtn) ordersBtn.style.display = 'flex';
    } else {
        authBtn.innerHTML = '<i class="fas fa-user"></i> Login';
        authBtn.onclick = showLogin;
        if (ordersBtn) ordersBtn.style.display = 'none';
    }
}

// Initialize
updateCartCount();
updateAuthUI();
showProducts();
