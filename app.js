const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Product Inventory Catalog with placeholder image assets
const catalog = [
    { id: 1, name: "Pesarlu (Green Gram)", basePrice: 150, img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
    { id: 2, name: "Minumulu (Black Gram)", basePrice: 200, img: "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=400" },
    { id: 3, name: "Bengal Gram", basePrice: 120, img: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400" },
    { id: 4, name: "Jonnalu (Jowar)", basePrice: 100, img: "https://images.unsplash.com/photo-1574325131876-a7999677020b?w=400" },
    { id: 5, name: "Godhumalu (Wheat)", basePrice: 100, img: "https://images.unsplash.com/photo-1574325131876-a7999677020b?w=400" },
    { id: 6, name: "Oranges", basePrice: 200, img: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400" },
    { id: 7, name: "Apple", basePrice: 200, img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400" },
    { id: 8, name: "Mosambi", basePrice: 100, img: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400" },
    { id: 9, name: "Guava", basePrice: 100, img: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400" },
    { id: 10, name: "Watermelon", basePrice: 80, img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400" }
];

// Tracking variables for UI state engine
let activeCart = {}; // Format key: "prodId-weight" -> quantity value

function displayProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = catalog.map(p => {
        return `
        <div class="product-card" id="card-${p.id}">
            <div class="product-image-frame">
                <img src="${p.img}" alt="${p.name}">
            </div>
            <div class="product-title">${p.name}</div>
            <div class="product-price-label">₹${p.basePrice} / kg</div>
            
            <div class="cta-wrapper" id="cta-container-${p.id}">
                <button class="base-add-btn" onclick="revealWeightSelection(${p.id})">Add</button>
            </div>
        </div>
        `;
    }).join('');
}

// Phase 3 Engine View Changer
function revealWeightSelection(productId) {
    const ctaContainer = document.getElementById(`cta-container-${productId}`);
    ctaContainer.innerHTML = `
        <div class="weight-selector-grid">
            <button class="weight-tier-btn" onclick="selectTierQuantity(${productId}, '250gm', 0.25)">250g</button>
            <button class="weight-tier-btn" onclick="selectTierQuantity(${productId}, '500gm', 0.5)">500g</button>
            <button class="weight-tier-btn" onclick="selectTierQuantity(${productId}, '1kg', 1)">1kg</button>
        </div>
    `;
}

// Phase 4 Engine View Changer (+ / - Counter)
function selectTierQuantity(productId, label, factor) {
    const cartKey = `${productId}-${label}`;
    if (!activeCart[cartKey]) {
        activeCart[cartKey] = { qty: 1, multiplier: factor };
    }
    renderModifierInterface(productId, label);
    updateCartUI();
}

function renderModifierInterface(productId, label) {
    const cartKey = `${productId}-${label}`;
    const ctaContainer = document.getElementById(`cta-container-${productId}`);
    const currentCount = activeCart[cartKey] ? activeCart[cartKey].qty : 0;

    if (currentCount === 0) {
        ctaContainer.innerHTML = `<button class="base-add-btn" onclick="revealWeightSelection(${productId})">Add</button>`;
        return;
    }

    ctaContainer.innerHTML = `
        <div class="quantity-adjustment-bar">
            <button class="qty-modifier-btn" onclick="modifyQty('${cartKey}', -1, ${productId}, '${label}')">−</button>
            <div class="qty-display-middle">
                <div>${currentCount} Items</div>
                <div style="font-size:11px; color:#666;">In ${label}</div>
            </div>
            <button class="qty-modifier-btn" onclick="modifyQty('${cartKey}', 1, ${productId}, '${label}')">+</button>
        </div>
    `;
}

function modifyQty(cartKey, operation, productId, label) {
    if (activeCart[cartKey]) {
        activeCart[cartKey].qty += operation;
        if (activeCart[cartKey].qty <= 0) {
            delete activeCart[cartKey];
        }
    }
    renderModifierInterface(productId, label);
    updateCartUI();
}

function updateCartUI() {
    const itemsContainer = document.getElementById('cart-items');
    let subtotal = 0;
    let html = '';

    Object.keys(activeCart).forEach(key => {
        const [prodId, label] = key.split('-');
        const item = catalog.find(p => p.id == prodId);
        const entry = activeCart[key];
        const cost = Math.round(item.basePrice * entry.multiplier * entry.qty);
        subtotal += cost;
        
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem;">
                    <span>${item.name} (${label}) x ${entry.qty}</span>
                    <span>₹${cost}</span>
                 </div>`;
    });

    if (subtotal === 0) {
        itemsContainer.innerHTML = "Your basket is waiting for fresh harvest items...";
        document.getElementById('cart-total').innerText = "0";
        document.getElementById('checkout-btn').disabled = true;
        return;
    }

    itemsContainer.innerHTML = html;
    document.getElementById('cart-total').innerText = subtotal;

    const note = document.getElementById('delivery-note');
    if (subtotal >= 399) {
        note.innerHTML = "🎉 <strong>Free Sunday Delivery</strong> unlocked!";
        note.style.color = "green";
    } else {
        note.innerHTML = `Add <strong>₹${399 - subtotal}</strong> more for Free Sunday Delivery.`;
        note.style.color = "var(--text-muted)";
    }
    document.getElementById('checkout-btn').disabled = false;
}

function resetToHome(event) {
    if(event) event.preventDefault();
    activeCart = {};
    displayProducts();
    updateCartUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterCategory(cat) {
    // Simply placeholder routine for pane functionality links
    displayProducts();
}

function openVerificationModal() { document.getElementById('otp-modal').style.display = 'block'; window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }); }
function closeVerificationModal() { document.getElementById('otp-modal').style.display = 'none'; }
function sendSMSOTP() { const phone = document.getElementById('phone-number').value; auth.signInWithPhoneNumber(phone, window.recaptchaVerifier).then((res) => { window.confirmationResult = res; document.getElementById('phone-input-view').style.display = 'none'; document.getElementById('otp-input-view').style.display = 'block'; }).catch((err) => alert(err.message)); }
function verifyCodeAndSave() { const code = document.getElementById('otp-code').value; window.confirmationResult.confirm(code).then(() => saveOrderToGoogleSheets()).catch(() => alert("Invalid Verification pin")); }

function saveOrderToGoogleSheets() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('phone-number').value;
    const total = document.getElementById('cart-total').innerText;
    const summary = Object.keys(activeCart).map(k => `${catalog.find(p => p.id == k.split('-')[0]).name}(${k.split('-')[1]} x ${activeCart[k].qty})`).join(', ');

    const payload = {
        data: [{
            Order_ID: "NBR-" + Date.now().toString().slice(-6),
            Customer_Name: name,
            Phone_Number: phone,
            Items_Ordered: summary,
            Total_Amount: total,
            Payment_Status: "Pending UPI Verification",
            Order_Date: new Date().toLocaleDateString('en-IN')
        }]
    };

    fetch('YOUR_SHEETDB_API_URL_HERE', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(() => { window.location.href = `upi://pay?pa=yourfather@upi&pn=NBRPurefield&am=${total}&cu=INR`; })
    .catch(err => alert(err));
}

window.onload = displayProducts;
