// Configuration Anchor
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

const catalog = [
    { id: 1, name: "Pesarlu (Green Gram)", price: 150, type: "staple" },
    { id: 2, name: "Minumulu (Black Gram)", price: 200, type: "staple" },
    { id: 3, name: "Bengal Gram", price: 120, type: "staple" },
    { id: 4, name: "Jonnalu (Jowar)", price: 100, type: "staple" },
    { id: 5, name: "Godhumalu (Wheat)", price: 100, type: "staple" },
    { id: 6, name: "Oranges", price: 200, type: "fruit", hot: true },
    { id: 7, name: "Apple", price: 200, type: "fruit" },
    { id: 8, name: "Mosambi", price: 100, type: "fruit" },
    { id: 9, name: "Guava", price: 100, type: "fruit" },
    { id: 10, name: "Watermelon", price: 80, type: "fruit" }
];

let cart = {};
let activeCategory = 'all';

function displayProducts() {
    const container = document.getElementById('products-container');
    const filtered = activeCategory === 'all' ? catalog : catalog.filter(p => p.type === activeCategory);
    
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div>
                ${p.hot ? `<span class="hot-tag">🔥 Only 12kg Left</span>` : ''}
                <div class="product-title">${p.name}</div>
            </div>
            <div>
                <div class="product-price">₹${p.price} / kg</div>
                <button class="add-basket-btn" onclick="addToCart(${p.id})">Add To Basket</button>
            </div>
        </div>
    `).join('');
}

function filterCategory(category, buttonElement) {
    activeCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    displayProducts();
}

function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    updateCartUI();
}

function updateCartUI() {
    const itemsContainer = document.getElementById('cart-items');
    let subtotal = 0;
    let html = '';

    Object.keys(cart).forEach(id => {
        const item = catalog.find(p => p.id == id);
        const cost = item.price * cart[id];
        subtotal += cost;
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.9rem;">
                    <span>${item.name} <strong>x${cart[id]}kg</strong></span>
                    <span>₹${cost}</span>
                 </div>`;
    });

    if (subtotal === 0) {
        itemsContainer.innerHTML = "Your basket is waiting for fresh harvest items...";
        itemsContainer.classList.add('empty-state');
        document.getElementById('cart-total').innerText = "0";
        document.getElementById('checkout-btn').disabled = true;
        return;
    }

    itemsContainer.classList.remove('empty-state');
    itemsContainer.innerHTML = html;
    document.getElementById('cart-total').innerText = subtotal;

    const note = document.getElementById('delivery-note');
    if (subtotal >= 399) {
        note.innerHTML = "🎉 <strong>Free Sunday Delivery</strong> unlocked!";
        note.style.color = "#143628";
    } else {
        note.innerHTML = `Add <strong>₹${399 - subtotal}</strong> more for Free Sunday Delivery.`;
        note.style.color = "#6c757d";
    }
    document.getElementById('checkout-btn').disabled = false;
}

function openVerificationModal() {
    document.getElementById('otp-modal').style.display = 'block';
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' });
}

function closeVerificationModal() { document.getElementById('otp-modal').style.display = 'none'; }

function sendSMSOTP() {
    const phone = document.getElementById('phone-number').value;
    auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then((result) => {
            window.confirmationResult = result;
            document.getElementById('phone-input-view').style.display = 'none';
            document.getElementById('otp-input-view').style.display = 'block';
        }).catch((err) => alert("Error: " + err.message));
}

function verifyCodeAndSave() {
    const code = document.getElementById('otp-code').value;
    window.confirmationResult.confirm(code).then(() => {
        saveOrderToGoogleSheets();
    }).catch(() => alert("Invalid verification pin. Please double check."));
}

function saveOrderToGoogleSheets() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('phone-number').value;
    const total = document.getElementById('cart-total').innerText;
    const summary = Object.keys(cart).map(id => `${catalog.find(p => p.id == id).name}(${cart[id]}kg)`).join(', ');

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

    fetch('YOUR_SHEETDB_API_URL_HERE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => {
        window.location.href = `upi://pay?pa=yourfather@upi&pn=NBRPurefield&am=${total}&cu=INR`;
    }).catch(err => alert("Data error: " + err));
}

window.onload = displayProducts;
