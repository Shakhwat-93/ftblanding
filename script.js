// Modal Controls
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
};

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('show'); }, 10);
    }
}

// Supabase Setup Placeholder
const SUPABASE_URL = 'https://drbpysumezfjbudxzxzj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYnB5c3VtZXpmamJ1ZHh6eHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzE0MzQsImV4cCI6MjA4ODU0NzQzNH0.Ki7U_uXoTxZ4B9x1ExBuYOnTBZwXS9acMkx7CzlT2sA';
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// IP Fetching
let customerIP = '';
async function fetchCustomerIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        customerIP = data.ip;
    } catch (e) {
        console.warn('ipify failed, trying fallback...');
        try {
            const fallback = await fetch('https://ipinfo.io/json');
            const fbData = await fallback.json();
            customerIP = fbData.ip;
        } catch (err) {
            console.error('Could not fetch IP', err);
        }
    }
}
fetchCustomerIP();

// Smooth scrolling for anchor links
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

// Sticky header styling on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        header.style.padding = '0';
    } else {
        header.style.boxShadow = 'none';
        header.style.padding = '5px 0';
    }
});

// Product Variants & Cart Logic
let productVariants = [
    {
        id: "black",
        name: "Canvas Family Travel Bag - Black",
        colorCode: "#111827",
        image: "images/bag-black.jpeg",
        price: 1280,
        inStock: true
    },
    {
        id: "navy",
        name: "Canvas Family Travel Bag - Navy Blue",
        colorCode: "#1D3557",
        image: "images/bag-navy.jpeg",
        price: 1280,
        inStock: false
    },
    {
        id: "red",
        name: "Canvas Family Travel Bag - Maroon/Red",
        colorCode: "#8B0000",
        image: "images/bag-red.jpeg",
        price: 1280,
        inStock: true
    }
];

async function fetchProductsFromDB() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) {
            console.warn('Could not fetch products from DB, using default.');
            return;
        }
        
        if (data && data.length > 0) {
            // Update the productVariants with live DB data
            productVariants = productVariants.map(pv => {
                const liveData = data.find(d => d.id === pv.id);
                if (liveData) {
                    return { ...pv, price: liveData.price, inStock: liveData.inStock, name: liveData.name };
                }
                return pv;
            });
            // Re-render UI with new data
            renderProductSelection();
            updateCartUI();
        }
    } catch (err) {
        console.error("Failed to fetch products:", err);
    }
}

let cart = {
    "black": 1,
    "navy": 0,
    "red": 0
};

const enToBnNumbers = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

function formatBengaliNumber(num) {
    return num.toLocaleString('en-IN').split('').map(char => enToBnNumbers[char] || char).join('');
}

const productSelectionList = document.getElementById('product-selection-list');
const cartContainer = document.getElementById('cart-items-container');
const subtotalDisplay = document.getElementById('subtotal-display');
const totalPriceDisplay = document.getElementById('total-price-display');
const submitBtn = document.getElementById('submit-btn');
const btnTotal = document.getElementById('btn-total');
const shippingRadios = document.querySelectorAll('input[name="shipping_zone"]');

function renderProductSelection() {
    if (!productSelectionList) return;
    productSelectionList.innerHTML = '';

    productVariants.forEach(variant => {
        const qty = cart[variant.id] || 0;
        const isSelected = qty > 0;
        const isOutOfStock = !variant.inStock;

        let cardClass = "product-select-card";
        if (isSelected) cardClass += " selected";
        if (isOutOfStock) cardClass += " stock-out";

        const cardHtml = `
            <div class="${cardClass}" id="card-${variant.id}" onclick="toggleProductSelection('${variant.id}')">
                <div class="custom-check-wrap">
                    <input type="checkbox" class="custom-checkbox" id="check-${variant.id}" ${isSelected ? 'checked' : ''} ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); toggleProductSelection('${variant.id}')">
                </div>
                <img src="${variant.image}" alt="${variant.name}" class="card-img">
                <div class="card-details">
                    <h4>${variant.name}</h4>
                    <div class="card-controls">
                        <div class="qty-control" onclick="event.stopPropagation()">
                            <button type="button" class="qty-btn" onclick="updateQuantity('${variant.id}', -1)" ${!isSelected ? 'disabled' : ''}>-</button>
                            <span class="qty-val" id="qty-val-${variant.id}">${qty || 1}</span>
                            <button type="button" class="qty-btn" onclick="updateQuantity('${variant.id}', 1)" ${!isSelected ? 'disabled' : ''}>+</button>
                        </div>
                        <div class="card-price">${variant.price}৳</div>
                        ${isOutOfStock ? `<span class="stock-out-badge">STOCK OUT</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        productSelectionList.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function toggleProductSelection(id) {
    const variant = productVariants.find(v => v.id === id);
    if (!variant || !variant.inStock) return;

    if (cart[id] > 0) {
        cart[id] = 0; // unselect
    } else {
        cart[id] = 1; // select with qty 1
    }
    renderProductSelection();
    updateCartUI();
}

function updateQuantity(id, change) {
    if (!cart[id]) return; // Cannot change quantity if not selected
    
    let newQty = cart[id] + change;
    if (newQty < 1) newQty = 1; // Minimum 1 if selected
    cart[id] = newQty;
    
    // Update local val instead of full re-render for smooth experience
    document.getElementById(`qty-val-${id}`).innerText = newQty;
    updateCartUI();
}

function updateCartUI() {
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '';
    let subtotal = 0;
    let totalItems = 0;

    productVariants.forEach(variant => {
        const qty = cart[variant.id] || 0;
        if (qty > 0) {
            subtotal += qty * variant.price;
            totalItems += qty;

            const itemHtml = `
                <div class="cart-item">
                    <div class="item-info">
                        <img src="${variant.image}" alt="${variant.name}">
                        <div>
                            <span class="item-name">${variant.name}</span>
                            <span class="item-qty">x ${qty}</span>
                        </div>
                    </div>
                    <div class="item-price">${qty * variant.price}৳</div>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', itemHtml);
        }
    });

    // Get selected shipping
    let shippingCost = 60;
    const selectedShipping = document.querySelector('input[name="shipping_zone"]:checked');
    if (selectedShipping && selectedShipping.value === 'Outside dhaka') {
        shippingCost = 130;
    }

    if (totalItems === 0) {
        shippingCost = 0;
    }

    const total = subtotal + shippingCost;

    if (subtotalDisplay) subtotalDisplay.innerText = `${subtotal}৳`;
    if (totalPriceDisplay) totalPriceDisplay.innerText = `${total}৳`;
    if (btnTotal) btnTotal.innerText = `${total}৳`;
    
    if (submitBtn) {
        if (totalItems === 0) {
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#6C757D';
            submitBtn.classList.remove('pulse');
        } else {
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '';
            submitBtn.classList.add('pulse');
        }
    }
}

if (shippingRadios) {
    shippingRadios.forEach(radio => {
        radio.addEventListener('change', updateCartUI);
    });
}

// Initial render
renderProductSelection();
updateCartUI();


// Function to convert Bengali numbers to English
function convertBnToEn(str) {
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    return str.replace(/[০-৯]/g, match => bnToEn[match]);
}

// Traffic Source Detection
function detectTrafficSource() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. utm_source
    const utmSource = urlParams.get('utm_source');
    if (utmSource) return utmSource;
    
    // 2. platform click IDs
    if (urlParams.has('fbclid')) return 'Facebook';
    if (urlParams.has('gclid')) return 'Google Ads';
    if (urlParams.has('ttclid')) return 'TikTok';
    if (urlParams.has('msclkid')) return 'Bing Ads';
    
    // 3. document.referrer domain matching
    const referrer = document.referrer;
    if (referrer) {
        try {
            const referrerUrl = new URL(referrer);
            const hostname = referrerUrl.hostname.toLowerCase();
            
            if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'Facebook';
            if (hostname.includes('instagram.com')) return 'Instagram';
            if (hostname.includes('tiktok.com')) return 'TikTok';
            if (hostname.includes('google.com') || hostname.includes('google.com.bd')) return 'Google';
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
            if (hostname.includes('whatsapp.com') || hostname.includes('wa.me')) return 'WhatsApp';
            if (hostname.includes('linkedin.com')) return 'LinkedIn';
            if (hostname.includes('x.com') || hostname.includes('twitter.com') || hostname.includes('t.co')) return 'Twitter/X';
            if (hostname.includes('bing.com')) return 'Bing';
            if (hostname.includes('pinterest.com')) return 'Pinterest';
        } catch (e) {
            // Ignore invalid URLs
        }
    }
    
    // 4. fallback
    return 'Direct';
}

// Handle Checkout Form Submission
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneInput = document.getElementById('phone');
        const phoneError = document.getElementById('phone-error');
        let phoneNumber = '';
        
        if (phoneInput && phoneError) {
            phoneNumber = phoneInput.value;
            // Convert Bengali digits to English for validation
            phoneNumber = convertBnToEn(phoneNumber);
            
            // Bangladesh phone validation: starts with 013-019 and is exactly 11 digits
            const phoneRegex = /^01[3-9]\d{8}$/;
            
            if (!phoneRegex.test(phoneNumber)) {
                phoneError.style.display = 'block';
                phoneInput.style.borderColor = 'var(--error)';
                phoneInput.focus();
                return;
            } else {
                phoneError.style.display = 'none';
                phoneInput.style.borderColor = 'var(--border)';
            }
        }
        
        const btn = submitBtn;
        const originalText = btn.innerHTML;
        
        function resetBtn() {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = '';
            btn.classList.add('pulse');
        }
        
        // Indicate processing state
        btn.innerHTML = 'প্রসেসিং হচ্ছে...';
        btn.disabled = true;
        btn.style.backgroundColor = '#6C757D';
        btn.classList.remove('pulse');

        // --- Anti-Spam & Fraud Prevention Checks ---
        if (supabaseClient) {
            try {
                // A. Blocked IP Check
                const { data: blockedIp } = await supabaseClient
                    .from('blocked_ip_addresses')
                    .select('ip_address')
                    .eq('ip_address', customerIP)
                    .eq('is_active', true)
                    .maybeSingle();
                    
                if (blockedIp) {
                    showModal('blocked-modal');
                    resetBtn();
                    return;
                }
                
                // B. Rate Limit / Duplicate Check
                if (phoneNumber !== '01953986982' && phoneNumber !== '01315183993') {
                    const now = Date.now();
                    const threeHoursMs = 3 * 60 * 60 * 1000;
                    
                    // LocalStorage Check
                    const lastOrderTime = localStorage.getItem('last_order_time');
                    if (lastOrderTime && (now - parseInt(lastOrderTime)) < threeHoursMs) {
                        showModal('rate-limit-modal');
                        resetBtn();
                        return;
                    }
                    
                    const threeHoursAgoDate = new Date(now - threeHoursMs).toISOString();
                    
                    // DB Check by Phone
                    const { data: duplicatePhone } = await supabaseClient
                        .from('orders')
                        .select('id')
                        .eq('phone', phoneNumber)
                        .gte('created_at', threeHoursAgoDate)
                        .limit(1);
                        
                    // DB Check by IP
                    const { data: duplicateIp } = await supabaseClient
                        .from('orders')
                        .select('id')
                        .eq('ip_address', customerIP)
                        .gte('created_at', threeHoursAgoDate)
                        .limit(1);
                        
                    if ((duplicatePhone && duplicatePhone.length > 0) || (duplicateIp && duplicateIp.length > 0)) {
                        showModal('rate-limit-modal');
                        resetBtn();
                        return;
                    }
                }
            } catch (err) {
                console.error('Error during anti-spam verification', err);
            }
        }
        
        // Prepare final order data
        const orderId = `FTB-${Math.floor(100000 + Math.random() * 900000)}`;
        
        let totalAmount = 0;
        let totalItems = 0;
        const orderedItemsList = Object.keys(cart).map(variantId => {
            const variant = productVariants.find(v => v.id === variantId);
            const qty = cart[variantId];
            if (qty > 0 && variant) {
                totalAmount += qty * variant.price;
                totalItems += qty;
                return { name: variant.name, price: variant.price, quantity: qty };
            }
            return null;
        }).filter(item => item !== null);

        let shippingCost = 60;
        const selectedShipping = document.querySelector('input[name="shipping_zone"]:checked');
        if (selectedShipping && selectedShipping.value === 'Outside dhaka') {
            shippingCost = 130;
        }
        totalAmount += shippingCost;
        
        const orderData = {
            id: orderId,
            customer_name: document.getElementById('name') ? document.getElementById('name').value : '',
            phone: phoneNumber,
            address: document.getElementById('address') ? document.getElementById('address').value : '',
            shipping_zone: selectedShipping ? selectedShipping.value : '',
            ordered_items: orderedItemsList,
            amount: totalAmount,
            items: totalItems,
            product_name: 'Family Travel Bag',
            quantity: 1, // Defaulting to 1 bundle/order as per sample
            source: 'stb-landing',
            traffic_source: detectTrafficSource(),
            ip_address: customerIP
        };
        
        console.log('Order Data prepared for DB:', orderData);
        
        // Insert into Supabase
        if (supabaseClient) {
            try {
                const { error: insertError } = await supabaseClient
                    .from('orders')
                    .insert([orderData]);
                    
                if (insertError) {
                    console.error('Order insertion failed:', insertError);
                    alert('দুঃখিত! কোনো কারণে অর্ডারটি গ্রহণ করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
                    resetBtn();
                    return;
                }
            } catch (err) {
                console.error('Network error during order insertion:', err);
                alert('দুঃখিত! নেটওয়ার্ক সমস্যার কারণে অর্ডারটি গ্রহণ করা সম্ভব হয়নি।');
                resetBtn();
                return;
            }
        }

        // Save success timestamp and order data for GTM dataLayer
        localStorage.setItem('last_order_time', Date.now().toString());
        localStorage.setItem('latest_order', JSON.stringify(orderData));

        btn.innerHTML = '✔ অর্ডার সম্পন্ন হয়েছে';
        btn.style.backgroundColor = '#2A9D8F';
        
        setTimeout(() => {
            window.location.href = `success.html?order_id=${orderId}`;
        }, 500);
    });
}

// GA4 Ecommerce view_item event tracking on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Fetch products dynamically from DB
    await fetchProductsFromDB();
    
    window.dataLayer = window.dataLayer || [];
    
    const items = productVariants.map(v => ({
        item_name: v.name,
        price: v.price,
        item_variant: v.id,
        quantity: cart[v.id]
    })).filter(item => item.quantity > 0);
    
    // If no items in cart initially, just send the first variant as viewed
    if (items.length === 0 && productVariants.length > 0) {
        items.push({
            item_name: productVariants[0].name,
            price: productVariants[0].price,
            item_variant: productVariants[0].id,
            quantity: 1
        });
    }

    window.dataLayer.push({
        event: "view_item",
        ecommerce: {
            currency: "BDT",
            value: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            items: items
        }
    });
});
