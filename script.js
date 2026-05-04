// ──────────────────────────────────────────────
// CONSTANTS & STATE
// ──────────────────────────────────────────────
const ADMIN_USER  = 'alproduct2026';
const ADMIN_PASS  = 'Alproduct@2026';
const ADMIN_EMAIL = 'alproductinfo2026@gmail.com';
const ADMIN_WA    = '919944124864';

// ── EmailJS — set EMAILJS_ENABLED=true after creating account at emailjs.com ──
// Steps: 1) emailjs.com free account  2) Add Gmail service  3) Create template
// Template variables needed: {{to_email}}, {{otp_code}}, {{customer_name}}
const EMAILJS_ENABLED     = false;           // ← Set to true after setup at emailjs.com
const EMAILJS_SERVICE_ID  = 'service_xxxxxxx'; // Replace with your Service ID
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx'; // Replace with your Template ID
const EMAILJS_PUBLIC_KEY  = 'your_public_key'; // Replace with your Public Key

// ── Formspree Configuration (Automatic Emails) ──
const FORMSPREE_ID = 'xdabegrq'; 

// ── Google Login Configuration ──
// Get your Client ID from https://console.cloud.google.com
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// ── Intersection Observer for Scroll Reveals ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function initReveals() {
  document.querySelectorAll('.product-card, .feat, .sec-header').forEach(el => {
    el.classList.add('reveal-item');
    revealObserver.observe(el);
  });
}

let isAdmin     = false;
let currentUser = null; // { name, phone, email, deviceId }
let newImgData  = null;
let editImgData = null;
let otpStore    = { otp:null, expires:null };
let sotpStore   = { otp:null, expires:null };
let orders      = JSON.parse(localStorage.getItem('ak_orders')||'[]'); // Store all orders

// ── Device ID ──
function getDeviceId() {
  let id = localStorage.getItem('ak_device_id');
  if (!id) {
    id = 'AK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
    localStorage.setItem('ak_device_id', id);
  }
  return id;
}

// ── Cart helpers ──
function getCart()      { const s=localStorage.getItem('ak_cart'); return s?JSON.parse(s):[]; }
function saveCart(c)    { localStorage.setItem('ak_cart',JSON.stringify(c)); }

function addToCart(productId) {
  const prod = getProducts().find(p=>p.id===productId);
  if (!prod) return;
  const cart = getCart();
  const ex   = cart.find(c=>c.id===productId);
  if (ex) { ex.qty+=1; } else { cart.push({id:prod.id,name:prod.name,price:prod.price,qty:1,emoji:prod.emoji,img:prod.img||null}); }
  saveCart(cart); updateCartBadge();
  showToast(`"${prod.name}" added to cart! 🛒`);
}

function removeFromCart(id) { saveCart(getCart().filter(c=>c.id!==id)); renderCart(); updateCartBadge(); }

function updateCartQty(id,delta) {
  const cart=getCart(); const item=cart.find(c=>c.id===id);
  if (!item) return;
  item.qty=Math.max(1,item.qty+delta);
  saveCart(cart); renderCart(); updateCartBadge();
}

function updateCartBadge() {
  const total=getCart().reduce((s,c)=>s+c.qty,0);
  const b=document.getElementById('cartBadge');
  const btn=document.querySelector('.cart-nav-btn');
  if(b){ b.textContent=total; b.style.display=total>0?'flex':'none'; }
  if(total > 0 && btn) {
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 400);
  }
}

function getCartTotal() {
  return getCart().reduce((s,item)=>{ 
    const n = parseFloat(String(item.price).replace(/[^\d.]/g, '')); 
    return s + (isNaN(n) ? 0 : n * item.qty); 
  }, 0);
}

function openCart()  { renderCart(); document.getElementById('cartDrawer').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart() { document.getElementById('cartDrawer').classList.remove('open'); document.body.style.overflow=''; }

function renderCart() {
  const cart=getCart();
  const body=document.getElementById('cartBody');
  const foot=document.getElementById('cartFooter');
  if(!body) return;
  if(cart.length===0) {
    body.innerHTML='<div class="cart-empty"><div style="font-size:3rem">🛒</div><p>Your cart is empty</p><small>Add items from the store</small></div>';
    if(foot) foot.style.display='none'; return;
  }
  if(foot) foot.style.display='block';
  const hasEnq=cart.some(c=>c.price==='Enquire');
  const numTot=getCartTotal();
  body.innerHTML=cart.map(item=>{
    const n = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
    const sub=isNaN(n)?'Enquire':'₹'+(n*item.qty);
    return `<div class="cart-item">
      <div class="cart-item-thumb">${item.img?`<img src="${item.img}" alt=""/>`:`<span>${item.emoji}</span>`}</div>
      <div class="cart-item-info"><div class="cart-item-name">${escapeHtml(item.name)}</div><div class="cart-item-price">${escapeHtml(item.price)} × ${item.qty} = <b>${sub}</b></div></div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateCartQty(${item.id},-1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.id},+1)">+</button>
        <button class="cart-remove" onclick="removeFromCart(${item.id})">🗑</button>
      </div></div>`;
  }).join('');
  const tot=document.getElementById('cartTotal');
  if(tot) tot.textContent=numTot>0?`₹${numTot}${hasEnq?' + Enquire items':''}`:'Enquire for pricing';
  
  renderCartBundles(cart);
}

function renderCartBundles(cart) {
  const body = document.getElementById('cartBody');
  if (!body || cart.length === 0) return;
  
  const hasPickle = cart.some(i => i.cat === 'pickle');
  const hasSaree = cart.some(i => i.cat === 'saree');
  
  let suggestion = null;
  if (hasPickle && !cart.some(i => i.id === 6)) {
    suggestion = { id: 6, name: 'Vadangam (Side Dish)', price: '₹50', emoji: '☀️' };
  } else if (hasSaree && !cart.some(i => i.id === 9)) {
    suggestion = { id: 9, name: 'Matching Jewelry Set', price: 'Enquire', emoji: '💛' };
  }

  if (suggestion) {
    const bundleDiv = document.createElement('div');
    bundleDiv.className = 'cart-bundle-offer';
    bundleDiv.innerHTML = `
      <div class="bundle-label">Smart Pair 💡</div>
      <div class="bundle-row">
        <span>${suggestion.emoji} ${suggestion.name}</span>
        <button onclick="addToCart(${suggestion.id})">+ Add</button>
      </div>
    `;
    body.appendChild(bundleDiv);
  }
}

function checkoutCart() {
  const cart=getCart();
  if(cart.length===0){ showToast('Cart is empty!'); return; }
  if (!currentUser) { 
    showToast('Please login to continue checkout! 🔑'); 
    closeCart();
    openModal('authModal'); 
    return; 
  }
  closeCart();
  document.getElementById('o-phone1').value=(currentUser.phone&&currentUser.phone!=='via Google')?currentUser.phone:'';
  document.getElementById('o-phone2').value='';
  document.getElementById('o-address').value='';
  // Show cart summary in order modal
  const sumEl=document.getElementById('o-cart-summary');
  if(sumEl) sumEl.innerHTML=cart.map(i=>`<div class="order-summary-row"><span>${escapeHtml(i.name)}</span><span>× ${i.qty} — ${i.price}</span></div>`).join('');
  setOrderStep(1);
  openModal('orderModal');
}

// ── Utility: escape HTML special chars to prevent XSS in rendered HTML ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ── Default products ──
const defaultProducts = [
  { id:1,  name:'Raw Mango Pickle',     nameTa:'மாங்காய் ஊறுகாய்',      price:'₹80',     cat:'pickle',  badge:'Hot',     emoji:'🥭', bg:'linear-gradient(135deg,#fff3c0,#ffe082)',   origin:'Organic Farm, Madurai', img:null },
  { id:2,  name:'Garlic Pickle',        nameTa:'பூண்டு ஊறுகாய்',        price:'₹90',     cat:'pickle',  badge:'',        emoji:'🧄', bg:'linear-gradient(135deg,#e8f5e9,#c8e6c9)',   origin:'Heritage Kitchen, Tanjore', img:null },
  { id:3,  name:'Red Banana Malt',      nameTa:'நேந்திரம் மால்ட்',       price:'₹150',    cat:'drink',   badge:'New',     emoji:'🍌', bg:'linear-gradient(135deg,#fce4ec,#f8bbd0)',   origin:'Salem Orchards', img:null },
  { id:4,  name:'Karpu Kavuni Flakes',  nameTa:'கருப்பு கவுனி',          price:'₹200',    cat:'other',   badge:'Pure',    emoji:'🌾', bg:'linear-gradient(135deg,#3d1f5e,#6a3b8a)',   origin:'Karaikudi Fields', img:null },
  { id:5,  name:'Garam Masala',         nameTa:'கரம் மசாலா',             price:'₹60',     cat:'spice',   badge:'',        emoji:'🌶️',bg:'linear-gradient(135deg,#fff3e0,#ffcc80)',   origin:'Home Ground, Coimbatore', img:null },
  { id:6,  name:'Vadangam',             nameTa:'வடகம்',                   price:'₹50',     cat:'spice',   badge:'',        emoji:'☀️', bg:'linear-gradient(135deg,#fff9c4,#fff176)',   origin:'Traditional Sundried, Erode', img:null },
  { id:7,  name:'Hibiscus Tea Pack',    nameTa:'செம்பருத்தி தேயிலை',     price:'₹120',    cat:'drink',   badge:'',        emoji:'🌺', bg:'linear-gradient(135deg,#fce4ec,#f06292)',   origin:'Nilgiri Hills', img:null },
  { id:8,  name:'Butterfly Pea Tea',    nameTa:'அப்பரஞ்சி தேயிலை',      price:'₹130',    cat:'drink',   badge:'Rare',    emoji:'💙', bg:'linear-gradient(135deg,#e3f2fd,#90caf9)',   origin:'Nilgiri Hills', img:null },
  { id:9,  name:'Necklace Set',         nameTa:'மாலை செட்',              price:'Enquire', cat:'jewelry', badge:'Popular', emoji:'💛', bg:'linear-gradient(135deg,#fff8dc,#ffe680)',   origin:'Artisan Studio, Kumbakonam', img:null },
  { id:10, name:'Earrings',             nameTa:'காது மணி',               price:'Enquire', cat:'jewelry', badge:'',        emoji:'💜', bg:'linear-gradient(135deg,#ffeeff,#ffb3ff)',   origin:'Handcrafted, Chennai', img:null },
  { id:11, name:'Bangles',              nameTa:'வளையல்',                  price:'Enquire', cat:'jewelry', badge:'',        emoji:'🔶', bg:'linear-gradient(135deg,#ffecb3,#ffd54f)',   origin:'Handcrafted, Chennai', img:null },
  { id:12, name:'Hair Accessories',     nameTa:'தலை அணிகலன்',            price:'Enquire', cat:'jewelry', badge:'New',     emoji:'🌸', bg:'linear-gradient(135deg,#e0f7fa,#80deea)',   origin:'Artisan Studio, Kumbakonam', img:null },
  { id:13, name:'Khadi Cotton Sarees',  nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'🥻', bg:'linear-gradient(135deg,#fff8f2,#fef3e0)',   origin:'Weavers Colony, Kanchipuram', img:null },
  { id:14, name:'Mangalagiri Sarees',   nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'✨', bg:'linear-gradient(135deg,#e8f5e9,#c8e6c9)',   origin:'Traditional Looms, Mangalagiri', img:null },
  { id:15, name:'Mangalagiri Kurtis',   nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'👗', bg:'linear-gradient(135deg,#fce4ec,#f8bbd0)',   origin:'Traditional Looms, Mangalagiri', img:null },
];

// ──────────────────────────────────────────────
// PRODUCT STORAGE (localStorage)
// ──────────────────────────────────────────────
function getProducts() {
  const stored = localStorage.getItem('ak_products');
  return stored ? JSON.parse(stored) : defaultProducts;
}

function saveProducts(prods) {
  localStorage.setItem('ak_products', JSON.stringify(prods));
}

// ──────────────────────────────────────────────
// SECTION NAVIGATION
// ──────────────────────────────────────────────
const SECTIONS = ['foods', 'jewelry', 'sarees', 'contact', 'admin'];

function showSection(id) {
  SECTIONS.forEach(s => {
    document.getElementById('sec-' + s)?.classList.remove('active');
    document.querySelector(`.tab-btn[data-section="${s}"]`)?.classList.remove('active');
    document.getElementById('bnav-' + s)?.classList.remove('active');
  });
  document.getElementById('sec-' + id)?.classList.add('active');
  document.querySelector(`.tab-btn[data-section="${id}"]`)?.classList.add('active');
  document.getElementById('bnav-' + id)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Show/Hide search bar based on section
  const searchBar = document.querySelector('.search-filter-bar');
  if (searchBar) {
    searchBar.style.display = ['foods', 'jewelry', 'sarees'].includes(id) ? 'flex' : 'none';
  }

  if (id === 'admin') renderAdminList();
}

// ── Search, Sort & Filter State ──
let searchQuery = '';
let currentSort  = 'default';
let foodCategory = 'all';

function handleSearch(val) {
  searchQuery = val.toLowerCase().trim();
  renderProducts();
}

function handleSort(val) {
  currentSort = val;
  renderProducts();
}

function filterAndSort(prods, cat = 'all') {
  let filtered = prods;
  if (cat !== 'all') {
    filtered = filtered.filter(p => p.cat === cat);
  }
  if (searchQuery) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchQuery) || 
      (p.nameTa && p.nameTa.toLowerCase().includes(searchQuery))
    );
  }
  
  if (currentSort === 'price-low') {
    filtered.sort((a,b) => {
      const pa = parseFloat(a.price.replace('₹','')) || 999999;
      const pb = parseFloat(b.price.replace('₹','')) || 999999;
      return pa - pb;
    });
  } else if (currentSort === 'price-high') {
    filtered.sort((a,b) => {
      const pa = parseFloat(a.price.replace('₹','')) || 0;
      const pb = parseFloat(b.price.replace('₹','')) || 0;
      return pb - pa;
    });
  }
  return filtered;
}

// ──────────────────────────────────────────────
// RENDER PRODUCTS
// ──────────────────────────────────────────────
function renderProducts() {
  const prods = getProducts();
  renderGrid('foods-grid',   filterAndSort(prods.filter(p => ['pickle','drink','spice','other'].includes(p.cat)), foodCategory));
  renderGrid('jewelry-grid', filterAndSort(prods.filter(p => p.cat === 'jewelry')));
  renderGrid('sarees-grid',  filterAndSort(prods.filter(p => p.cat === 'saree')));
  initReveals(); // Re-init reveals for new grid items
}

function renderGrid(gridId, prods) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  if (prods.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px 0;grid-column:1/-1;">No products found.</p>';
    return;
  }
  // BUG FIX: Use data-product-id attribute + event delegation instead of
  // injecting product names into onclick strings (avoids quote-injection).
  grid.innerHTML = prods.map(p => `
    <div class="product-card" data-cat="${p.cat}">
      <div class="product-img" style="background:${p.bg};">
        ${p.img ? `<img src="${p.img}" alt="${escapeHtml(p.name)}" />` : `<span class="emoji-fallback">${p.emoji}</span>`}
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${p.cat === 'pickle' || p.cat === 'saree' ? `<div class="holo-seal" title="Verified Pure Authentic"></div>` : ''}
      </div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${p.nameTa ? `<div class="product-name-ta">${escapeHtml(p.nameTa)}</div>` : ''}
        <div class="product-price">${escapeHtml(p.price)}</div>
        <button class="btn-trace" onclick="traceOrigin(${p.id})">📍 Trace Origin</button>
      </div>
      <button class="btn-order-now" data-product-id="${p.id}">Order Now</button>
    </div>
  `).join('');

  // Attach click — now adds to cart instead of single-item order
  grid.querySelectorAll('.btn-order-now').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.productId)));
  });
}

function traceOrigin(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  showToast(`📍 Origin: ${p.origin || 'Annai Kitchen Artisan Studio'}`);
}

// ── Category filter ──
function filterFood(cat, btn) {
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  foodCategory = cat;
  renderProducts();
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ──────────────────────────────────────────────
// MODAL HELPERS
// ──────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',  tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

// ── Google Identity Services Integration ──
function initGoogleAuth() {
  if (typeof google === 'undefined') return;
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    // Only prompt if ID is valid
    if (!GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
      google.accounts.id.prompt(); 
    }
  } catch (e) {
    console.warn('Google Auth Init skipped or failed:', e);
  }
}

function googleLogin() {
  if (typeof google === 'undefined') {
    showToast('Google Sign-In is currently unavailable.');
    return;
  }
  
  if (GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
    showToast('🔑 [Test Mode] Google Login Simulated...');
    setTimeout(() => {
      loginSuccess('Vendhan C', 'via Google', 'varaganfinanceinfo@gmail.com');
    }, 1500);
    return;
  }
  
  google.accounts.id.prompt(); // Show the selector
}

function handleCredentialResponse(response) {
  const responsePayload = decodeJwtResponse(response.credential);
  if (responsePayload && responsePayload.email) {
    loginSuccess(
      responsePayload.name || 'Google User',
      'via Google',
      responsePayload.email
    );
  } else {
    showToast('Google Login Failed. Please try again.');
  }
}

function decodeJwtResponse(token) {
  try {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('JWT Decode Error:', e);
    return null;
  }
}

function generateOtp() { return Math.floor(100000+Math.random()*900000).toString(); }

function requestOtp() {
  const email = document.getElementById('loginEmail')?.value.trim()||'';
  const phone = document.getElementById('loginPhone').value.trim();
  if (!phone) { showToast('Enter your phone number!'); return; }
  
  // Start 30s timer
  let timeLeft = 30;
  const timerEl = document.getElementById('otpTimer');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  
  const otp = generateOtp();
  otpStore = { otp, expires: Date.now()+5*60*1000 };
  
  const timerId = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerEl.textContent = '';
      btn.disabled = false;
      btn.textContent = 'Resend OTP';
    } else {
      timerEl.textContent = `Resend available in ${timeLeft}s`;
      timeLeft--;
    }
  }, 1000);

  if (EMAILJS_ENABLED && email && EMAILJS_PUBLIC_KEY !== 'your_public_key') {
    btn.textContent='Sending...';
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {to_email:email, otp_code:otp, customer_name:'Customer'})
      .then(()=>{ document.getElementById('otpLoginSection').style.display='block'; btn.textContent='OTP Sent'; showToast('OTP sent to your email! 📧'); })
      .catch(()=>{ clearInterval(timerId); btn.textContent='Send OTP'; btn.disabled=false; showToast('Failed to send OTP!'); otpStore={otp:null,expires:null}; });
  } else {
    document.getElementById('otpLoginSection').style.display='block';
    btn.textContent='OTP Sent';
    console.log('Annai Kitchen Test OTP:', otp); 
    // PROFESSIONAL SIMULATION: Show the OTP clearly to the user
    showToast(`🔑 [TEST MODE] Your OTP is: ${otp}`, 8000); 
  }
}

function moveOtp(el, nextId) {
  if (el.value && nextId) {
    const nextEl = document.getElementById(nextId);
    nextEl?.focus();
    nextEl?.classList.add('glow-pulse');
    setTimeout(() => nextEl?.classList.remove('glow-pulse'), 500);
  } else if (!el.value) {
    // If deleted, move focus back if possible
    const prevMap = {
      'otp2':'otp1','otp3':'otp2','otp4':'otp3','otp5':'otp4','otp6':'otp5',
      'sotp2':'sotp1','sotp3':'sotp2','sotp4':'sotp3','sotp5':'sotp4','sotp6':'sotp5'
    };
    const prevId = prevMap[el.id];
    if (prevId) document.getElementById(prevId)?.focus();
  }
}

function verifyOtp() {
  const entered=['otp1','otp2','otp3','otp4','otp5','otp6'].map(id=>document.getElementById(id).value).join('');
  if (!otpStore.otp) { showToast('Request OTP first!'); return; }
  if (Date.now()>otpStore.expires) { showToast('OTP expired! Resend.'); otpStore={otp:null,expires:null}; return; }
  
  if (entered.length === 6) {
    const btn = document.getElementById('loginBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    setTimeout(() => {
      if (entered === otpStore.otp) {
        const phone = document.getElementById('loginPhone').value.trim();
        const email = document.getElementById('loginEmail')?.value.trim()||'';
        ['otp1','otp2','otp3','otp4','otp5','otp6'].forEach(id=>{document.getElementById(id).value='';});
        document.getElementById('otpLoginSection').style.display='none';
        btn.textContent = 'Send OTP';
        btn.disabled = false;
        otpStore = {otp:null, expires:null};
        loginSuccess('Customer', phone, email);
      } else {
        btn.textContent = originalText;
        btn.disabled = false;
        showToast('Access Denied: Incorrect OTP ❌');
      }
    }, 1500);
  }
}

function requestSignupOtp() {
  const email=document.getElementById('signupEmail')?.value.trim()||'';
  const phone=document.getElementById('signupPhone').value.trim();
  if (!phone) { showToast('Enter your phone number!'); return; }
  const otp=generateOtp();
  sotpStore={otp,expires:Date.now()+5*60*1000};
  const btn=document.getElementById('signupBtn');
  if (EMAILJS_ENABLED && email && EMAILJS_PUBLIC_KEY !== 'your_public_key') {
    btn.textContent='Sending...'; btn.disabled=true;
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,{to_email:email,otp_code:otp,customer_name:document.getElementById('signupName').value.trim()||'Customer'})
      .then(()=>{document.getElementById('otpSignupSection').style.display='block';btn.textContent='Resend OTP';btn.disabled=false;showToast('OTP sent to your email! 📧');})
      .catch(()=>{btn.textContent='Send OTP';btn.disabled=false;showToast('Failed to send OTP!');sotpStore={otp:null,expires:null};});
  } else {
    document.getElementById('otpSignupSection').style.display='block';
    btn.textContent='Resend OTP';
    console.log('Annai Kitchen Test OTP:', otp);
    showToast(`🔑 [TEST MODE] Your OTP is: ${otp}`, 8000);
  }
}

function verifySignupOtp() {
  const entered=['sotp1','sotp2','sotp3','sotp4','sotp5','sotp6'].map(id=>document.getElementById(id).value).join('');
  if (!sotpStore.otp) { showToast('Request OTP first!'); return; }
  if (Date.now()>sotpStore.expires) { showToast('OTP expired! Resend.'); sotpStore={otp:null,expires:null}; return; }
  
  if (entered.length === 6) {
    const btn = document.getElementById('signupBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Registering...';
    btn.disabled = true;

    setTimeout(() => {
      if (entered === sotpStore.otp) {
        const name  = document.getElementById('signupName').value.trim()||'Customer';
        const phone = document.getElementById('signupPhone').value.trim();
        const email = document.getElementById('signupEmail')?.value.trim()||'';
        ['sotp1','sotp2','sotp3','sotp4','sotp5','sotp6'].forEach(id=>{document.getElementById(id).value='';});
        document.getElementById('otpSignupSection').style.display='none';
        btn.textContent = 'Send OTP';
        btn.disabled = false;
        sotpStore = {otp:null, expires:null};
        loginSuccess(name, phone, email);
      } else {
        btn.textContent = originalText;
        btn.disabled = false;
        showToast('Access Denied: Incorrect OTP ❌');
      }
    }, 1500);
  }
}

function loginSuccess(name, phone, email='') {
  const deviceId = getDeviceId();
  currentUser = { name, phone, email, deviceId };
  localStorage.setItem('ak_user', JSON.stringify(currentUser));
  closeModal('authModal');
  showUserBadge();
  showToast(`Welcome, ${name}! 🎉`);
}

function showUserBadge() {
  if (!currentUser) return;
  document.getElementById('heroBtns').style.display      = 'none';
  document.getElementById('userBadgeWrap').style.display = 'flex';
  document.getElementById('userNameDisplay').textContent = currentUser.name;
  const did = document.getElementById('userDeviceId');
  if (did) did.textContent = 'ID: ' + (currentUser.deviceId || getDeviceId());
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('ak_user');
  
  // Clear cart on logout
  saveCart([]);
  updateCartBadge();
  renderCart();
  
  document.getElementById('heroBtns').style.display      = 'flex';
  document.getElementById('userBadgeWrap').style.display = 'none';
  showToast('Logged out & Cart cleared! 🧹');
}

// ──────────────────────────────────────────────
// ADMIN LOGIN
// ──────────────────────────────────────────────
function doAdminLogin() {
  const u = document.getElementById('admin-user').value.trim();
  const p = document.getElementById('admin-pass').value.trim();
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdmin = true;
    closeModal('adminLoginModal');
    document.getElementById('adminTabBtn').style.display = 'inline-block';
    document.getElementById('bnav-admin').style.display  = 'flex';
    showSection('admin');
    showToast('Admin login successful! 🔐');
  } else {
    showToast('Invalid credentials!');
  }
}

function adminLogout() {
  isAdmin = false;
  document.getElementById('adminTabBtn').style.display = 'none';
  document.getElementById('bnav-admin').style.display  = 'none';
  showSection('foods');
  showToast('Admin logged out!');
}

// ──────────────────────────────────────────────
// ADMIN: ADD / EDIT / DELETE PRODUCTS
// ──────────────────────────────────────────────
function handleNewImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    newImgData = e.target.result;
    const area = document.getElementById('newImgArea');
    area.querySelector('.upload-icon').style.display = 'none';
    area.querySelector('.upload-text').style.display = 'none';
    let prev = area.querySelector('.preview-img');
    if (!prev) {
      prev = document.createElement('img');
      prev.className = 'preview-img';
      area.appendChild(prev);
    }
    prev.src = newImgData;
  };
  reader.readAsDataURL(file);
}

function addProduct() {
  const name  = document.getElementById('new-name').value.trim();
  const price = document.getElementById('new-price').value.trim();
  const cat   = document.getElementById('new-cat').value;
  if (!name || !price) { showToast('Please fill name and price!'); return; }

  const prods = getProducts();
  // FIX: safe max id when products array could be empty
  const newId = prods.length > 0 ? Math.max(...prods.map(p => p.id)) + 1 : 1;

  prods.push({
    id: newId,
    name,
    nameTa: '',
    price:  price.startsWith('₹') ? price : `₹${price}`,
    cat,
    badge: 'New',
    emoji: '📦',
    bg:    'linear-gradient(135deg,#f5f5f5,#eeeeee)',
    img:   newImgData || null
  });
  saveProducts(prods);
  renderProducts();
  renderAdminList();

  // Reset form
  document.getElementById('new-name').value  = '';
  document.getElementById('new-price').value = '';
  newImgData = null;
  const area = document.getElementById('newImgArea');
  area.querySelector('.upload-icon').style.display = '';
  area.querySelector('.upload-text').style.display = '';
  const prev = area.querySelector('.preview-img');
  if (prev) prev.remove();

  showToast(`"${name}" added successfully! ✅`);
}

function renderAdminList() {
  const prods = getProducts();
  const list  = document.getElementById('adminProductList');
  if (prods.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:20px 0;">No products yet. Add one above!</p>';
    return;
  }
  list.innerHTML = prods.map((p, i) => `
    <div class="admin-product-item">
      <div class="admin-product-thumb">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : p.emoji}
      </div>
      <div class="admin-product-details">
        <div class="name">${p.name}</div>
        <div class="price">${p.price}</div>
        <div class="cat">${p.cat}</div>
      </div>
      <div class="admin-product-actions">
        <button class="btn-edit"   onclick="openEditProduct(${i})">Edit</button>
        <button class="btn-delete" onclick="deleteProduct(${i})">Delete</button>
      </div>
    </div>
  `).join('');
  
  // Also render orders
  renderAdminOrders();
}

// Render orders in admin panel
function renderAdminOrders() {
  const ordersList = document.getElementById('adminOrdersList');
  if (!ordersList) return;
  
  // Use the global orders array instead of re-parsing
  const savedOrders = orders;
  
  if (savedOrders.length === 0) {
    ordersList.innerHTML = '<p style="text-align:center;color:#888;padding:20px 0;">No orders yet.</p>';
    return;
  }
  
  // Show latest orders first
  const recentOrders = savedOrders.slice(-10).reverse();
  
  ordersList.innerHTML = recentOrders.map(order => {
    const itemsText = order.items.map(i => `${i.name} × ${i.qty}`).join(', ');
    const date = new Date(order.date).toLocaleString();
    return `
      <div class="admin-product-item" style="flex-direction:column;align-items:flex-start;">
        <div style="font-weight:600;color:var(--rust);">Order #${order.id}</div>
        <div style="font-size:12px;color:#666;">${date}</div>
        <div style="margin:8px 0;">${escapeHtml(order.customer)} | ${order.phone1}</div>
        <div style="font-size:12px;">${escapeHtml(itemsText)}</div>
        <div style="margin-top:4px;font-weight:600;">Total: ₹${order.total}</div>
      </div>
    `;
  }).join('');
}

function openEditProduct(idx) {
  const prods = getProducts();
  const p     = prods[idx];
  document.getElementById('edit-idx').value   = idx;
  document.getElementById('edit-name').value  = p.name;
  document.getElementById('edit-price').value = p.price;
  editImgData = p.img;

  const area = document.getElementById('editImgArea');
  let prev   = area.querySelector('.preview-img');
  if (p.img) {
    area.querySelector('.upload-icon').style.display = 'none';
    area.querySelector('.upload-text').style.display = 'none';
    if (!prev) {
      prev = document.createElement('img');
      prev.className = 'preview-img';
      area.appendChild(prev);
    }
    prev.src = p.img;
  } else {
    area.querySelector('.upload-icon').style.display = '';
    area.querySelector('.upload-text').style.display = '';
    if (prev) prev.remove();
  }
  openModal('editProductModal');
}

function handleEditImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    editImgData = e.target.result;
    const area = document.getElementById('editImgArea');
    area.querySelector('.upload-icon').style.display = 'none';
    area.querySelector('.upload-text').style.display = 'none';
    let prev = area.querySelector('.preview-img');
    if (!prev) {
      prev = document.createElement('img');
      prev.className = 'preview-img';
      area.appendChild(prev);
    }
    prev.src = editImgData;
  };
  reader.readAsDataURL(file);
}

function saveEditProduct() {
  const idx   = parseInt(document.getElementById('edit-idx').value);
  const name  = document.getElementById('edit-name').value.trim();
  const price = document.getElementById('edit-price').value.trim();
  if (!name || !price) { showToast('Fill all fields!'); return; }

  const prods = getProducts();
  prods[idx].name  = name;
  prods[idx].price = price.startsWith('₹') ? price : `₹${price}`;
  if (editImgData) prods[idx].img = editImgData;

  saveProducts(prods);
  renderProducts();
  renderAdminList();
  closeModal('editProductModal');
  showToast('Product updated! ✅');
}

function deleteProduct(idx) {
  if (!confirm('Delete this product?')) return;
  const prods   = getProducts();
  const removed = prods.splice(idx, 1)[0];
  saveProducts(prods);
  renderProducts();
  renderAdminList();
  showToast(`"${removed.name}" deleted!`);
}

// ──────────────────────────────────────────────
// ORDER FLOW
// ──────────────────────────────────────────────
function startOrder(productName) {
  if (!currentUser) {
    showToast('Please login first to order! 🔑');
    openModal('authModal');
    return;
  }
  document.getElementById('o-phone1').value  = (currentUser.phone !== 'via Google') ? currentUser.phone : '';
  document.getElementById('o-phone2').value  = '';
  document.getElementById('o-address').value = '';
  setOrderStep(1);
  openModal('orderModal');
}

function setOrderStep(step) {
  [1,2,3].forEach(i => {
    document.getElementById('ostep' + i).classList.toggle('active', i === step);
    document.getElementById('sdot'  + i).classList.toggle('done',   i <= step);
  });
}

function goToPreview() {
  const cart    = getCart();
  const phone1  = document.getElementById('o-phone1').value.trim();
  const phone2  = document.getElementById('o-phone2').value.trim();
  const address = document.getElementById('o-address').value.trim();

  if (cart.length === 0) { showToast('Cart is empty!'); return; }
  if (!phone1 || !address) { showToast('Please fill all required fields!'); return; }
  if (!/^[\d\s\+\-]{7,15}$/.test(phone1)) { showToast('Enter a valid phone number!'); return; }

  // Build preview rows
  const itemsHtml = cart.map(i => {
    const n=parseFloat(i.price.replace('\u20b9',''));
    return `<div class="preview-row"><span class="preview-label">${escapeHtml(i.name)}</span><span class="preview-value">× ${i.qty} — ${isNaN(n)?'Enquire':'\u20b9'+(n*i.qty)}</span></div>`;
  }).join('');
  document.getElementById('prev-items').innerHTML = itemsHtml;
  document.getElementById('prev-phone1').textContent  = phone1;
  document.getElementById('prev-phone2').textContent  = phone2 || 'Not provided';
  document.getElementById('prev-address').textContent = address;
  document.getElementById('prev-customer').textContent = currentUser.name;
  const totalNum = getCartTotal();
  document.getElementById('prev-total').textContent = totalNum > 0 ? `\u20b9${totalNum}${cart.some(c=>c.price==='Enquire')?' + Enquire':''}`:'Enquire for pricing';
  setOrderStep(2);
}

function goBackToEdit() { setOrderStep(1); }

function placeOrder() {
  const phone1   = document.getElementById('o-phone1').value.trim();
  const phone2   = document.getElementById('o-phone2').value.trim();
  const address  = document.getElementById('o-address').value.trim();
  const customer = currentUser.name;
  const deviceId = currentUser.deviceId || getDeviceId();
  const cart     = getCart();
  const orderId  = 'AK-' + Date.now().toString(36).toUpperCase();

  const itemLines = cart.map(i=>{
    const n = parseFloat(String(i.price).replace(/[^\d.]/g, ''));
    const sub=isNaN(n)?'Enquire':'₹'+(n*i.qty);
    return `  • ${i.name} × ${i.qty} = ${sub}`;
  }).join('\n');

  const totalNum = getCartTotal();
  const hasEnq = cart.some(c=>c.price==='Enquire');
  const totalDisplay = (totalNum > 0) 
    ? `₹${totalNum}${hasEnq ? ' + Enquire items' : ''}` 
    : 'Enquire for pricing';

  const orderText =
`🛒 NEW ORDER — Annai's Kitchen

Order ID : ${orderId}
👤 Customer : ${customer}
📱 Phone 1  : ${phone1}
📱 Phone 2  : ${phone2||'N/A'}
📍 Address  : ${address}
🔖 Device ID: ${deviceId}

🧺 Items:
${itemLines}

💰 Total: ${totalDisplay}

---
Annai's Kitchen Order System`;

  // Save order to localStorage for admin tracking
  const orderData = {
    id: orderId,
    customer,
    phone1,
    phone2,
    address,
    deviceId,
    items: cart,
    total: getCartTotal(),
    date: new Date().toISOString(),
    status: 'new'
  };
  orders.push(orderData);
  localStorage.setItem('ak_orders', JSON.stringify(orders));

  // Show Digital Unboxing effect
  const modalBox = document.querySelector('#orderModal .modal-box');
  const unboxing = document.createElement('div');
  unboxing.className = 'unboxing-container';
  unboxing.innerHTML = `
    <div class="unbox-box">🎁</div>
    <div class="unbox-glow"></div>
    <div class="unbox-text">Preparing your Experience...</div>
  `;
  modalBox.appendChild(unboxing);

  setTimeout(() => {
    unboxing.classList.add('open');
    unboxing.querySelector('.unbox-text').textContent = 'Authenticity Verified ✓';
  }, 1000);

  setTimeout(() => {
    unboxing.remove();
    document.getElementById('orderSuccessId').textContent = 'Order ID: ' + orderId;
    setOrderStep(3);
  }, 3500);

  // WhatsApp — direct wa.me link (works reliably on mobile & desktop)
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(orderText)}`,'_blank');

  // Send Admin & Customer confirmation via EmailJS if enabled
  if (EMAILJS_ENABLED && typeof emailjs !== 'undefined') {
    // To Admin
    sendAdminEmailNotification(customer, orderId, cart, totalNum);
    // To Customer
    if (currentUser.email) {
      sendCustomerOrderConfirmation(customer, currentUser.email, orderId, cart, totalNum);
    }
  }

  // Send to Formspree (New Automatic Method)
  if (FORMSPREE_ID && FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
    sendToFormspree(orderText, 'New Order');
  }

  saveCart([]); updateCartBadge();
  showToast(`Order placed! WhatsApp opened for Admin. ✅`);
}

// Send background email to Admin via EmailJS
function sendAdminEmailNotification(customer, orderId, cart, total) {
  const itemsText = cart.map(i => `${i.name} × ${i.qty}`).join('\n');
  const templateParams = {
    to_email: ADMIN_EMAIL, // Admin's email
    customer_name: customer,
    order_id: orderId,
    order_items: itemsText,
    order_total: `₹${total}`,
    message: `New order from ${customer}. Check admin panel for details.`
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(() => console.log('Admin notification email sent'))
    .catch(err => console.error('Admin email failed:', err));
}

// Global Formspree Sender
function sendToFormspree(message, subject) {
  fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _subject: `${subject} — Annai's Kitchen`,
      message: message
    })
  })
  .then(response => {
    if (response.ok) console.log('Formspree message sent successfully');
  })
  .catch(error => console.error('Formspree error:', error));
}

// Send order confirmation email to customer
function sendCustomerOrderConfirmation(customer, email, orderId, cart, total) {
  const itemsText = cart.map(i=>{
    const n=parseFloat(i.price.replace('₹',''));
    const sub=isNaN(n)?'Enquire':'₹'+(n*i.qty);
    return `• ${i.name} × ${i.qty} = ${sub}`;
  }).join('\n');

const templateParams = {
    to_email: email,
    customer_name: customer,
    order_id: orderId,
    order_items: itemsText,
    order_total: `₹${total}`
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(()=>console.log('Customer confirmation email sent'))
    .catch(err=>console.error('Email send failed:', err));
}

// Send WhatsApp order confirmation to customer
function sendCustomerWhatsAppNotification(customer, phone, orderId, cart, total) {
  const itemsText = cart.map(i=>{
    const n=parseFloat(i.price.replace('₹',''));
    const sub=isNaN(n)?'Enquire':'₹'+(n*i.qty);
    return `• ${i.name} × ${i.qty} = ${sub}`;
  }).join('\n');

  const msg = `🎉 Order Confirmed!

Order #${orderId}
Thank you ${customer}!

Your order details:
${itemsText}

Total: ₹${total}

We'll contact you shortly on ${phone} for delivery.

- Annai's Kitchen`;

  // Clean phone number (remove + and spaces)
  const cleanPhone = phone.replace(/[\s\+]/g, '');

  // Try to open WhatsApp with customer's number
  setTimeout(() => {
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }, 1000);
}

// ──────────────────────────────────────────────
// CONTACT ENQUIRY
// ──────────────────────────────────────────────
function sendEnquiry(method) {
  const name  = document.getElementById('enq-name').value.trim();
  const phone = document.getElementById('enq-phone').value.trim();
  const msg   = document.getElementById('enq-msg').value.trim();

  // BUG FIX: Validate all three fields
  if (!name || !phone || !msg) { showToast('Please fill name, phone & message!'); return; }

  if (method === 'wa') {
    const text = encodeURIComponent(`Hi Annai's Kitchen! 👋\n\nName: ${name}\nPhone: ${phone}\n\nOrder: ${msg}`);
    window.open(`https://wa.me/${ADMIN_WA}?text=${text}`, '_blank');
  } else {
    // Try Formspree first if ID exists
    if (FORMSPREE_ID && FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
      const fullMsg = `Enquiry from ${name}\nPhone: ${phone}\n\nMessage:\n${msg}`;
      sendToFormspree(fullMsg, 'New Enquiry');
      showToast('Enquiry sent via Email! 📧');
    } else {
      // Fallback to mailto
      const subject = encodeURIComponent(`Order Enquiry from ${name}`);
      const body    = encodeURIComponent(`Hi Annai's Kitchen,\n\nName: ${name}\nPhone: ${phone}\n\nOrder Details:\n${msg}\n\nThank you!`);
      window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    }
  }
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  getDeviceId(); // generate device ID on first visit
  renderProducts();
  updateCartBadge();

  // Restore logged-in user from localStorage
  const savedUser = localStorage.getItem('ak_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Ensure existing saved users get a deviceId
      if (!currentUser.deviceId) currentUser.deviceId = getDeviceId();
      showUserBadge();
    } catch (e) {
      localStorage.removeItem('ak_user');
    }
  }

  // Init EmailJS if enabled
  if (EMAILJS_ENABLED && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // Init Google Auth
  initGoogleAuth();
});
