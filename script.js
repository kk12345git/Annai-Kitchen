// ──────────────────────────────────────────────
// CONSTANTS & STATE
// ──────────────────────────────────────────────
const ADMIN_USER  = 'alproduct2026';
const ADMIN_PASS  = 'Alproduct@2026';
const ADMIN_EMAIL = 'alproductinfo2026@gmail.com';
const ADMIN_WA    = '919944124864';

let isAdmin      = false;
let currentUser  = null; // { name, phone }
let newImgData   = null;
let editImgData  = null;

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
  { id:1,  name:'Raw Mango Pickle',     nameTa:'மாங்காய் ஊறுகாய்',      price:'₹80',     cat:'pickle',  badge:'Hot',     emoji:'🥭', bg:'linear-gradient(135deg,#fff3c0,#ffe082)',   img:null },
  { id:2,  name:'Garlic Pickle',        nameTa:'பூண்டு ஊறுகாய்',        price:'₹90',     cat:'pickle',  badge:'',        emoji:'🧄', bg:'linear-gradient(135deg,#e8f5e9,#c8e6c9)',   img:null },
  { id:3,  name:'Red Banana Malt',      nameTa:'நேந்திரம் மால்ட்',       price:'₹150',    cat:'drink',   badge:'New',     emoji:'🍌', bg:'linear-gradient(135deg,#fce4ec,#f8bbd0)',   img:null },
  { id:4,  name:'Karpu Kavuni Flakes',  nameTa:'கருப்பு கவுனி',          price:'₹200',    cat:'other',   badge:'Pure',    emoji:'🌾', bg:'linear-gradient(135deg,#3d1f5e,#6a3b8a)',   img:null },
  { id:5,  name:'Garam Masala',         nameTa:'கரம் மசாலா',             price:'₹60',     cat:'spice',   badge:'',        emoji:'🌶️',bg:'linear-gradient(135deg,#fff3e0,#ffcc80)',   img:null },
  { id:6,  name:'Vadangam',             nameTa:'வடகம்',                   price:'₹50',     cat:'spice',   badge:'',        emoji:'☀️', bg:'linear-gradient(135deg,#fff9c4,#fff176)',   img:null },
  { id:7,  name:'Hibiscus Tea Pack',    nameTa:'செம்பருத்தி தேயிலை',     price:'₹120',    cat:'drink',   badge:'',        emoji:'🌺', bg:'linear-gradient(135deg,#fce4ec,#f06292)',   img:null },
  { id:8,  name:'Butterfly Pea Tea',    nameTa:'அப்பரஞ்சி தேயிலை',      price:'₹130',    cat:'drink',   badge:'Rare',    emoji:'💙', bg:'linear-gradient(135deg,#e3f2fd,#90caf9)',   img:null },
  { id:9,  name:'Necklace Set',         nameTa:'மாலை செட்',              price:'Enquire', cat:'jewelry', badge:'Popular', emoji:'💛', bg:'linear-gradient(135deg,#fff8dc,#ffe680)',   img:null },
  { id:10, name:'Earrings',             nameTa:'காது மணி',               price:'Enquire', cat:'jewelry', badge:'',        emoji:'💜', bg:'linear-gradient(135deg,#ffeeff,#ffb3ff)',   img:null },
  { id:11, name:'Bangles',              nameTa:'வளையல்',                  price:'Enquire', cat:'jewelry', badge:'',        emoji:'🔶', bg:'linear-gradient(135deg,#ffecb3,#ffd54f)',   img:null },
  { id:12, name:'Hair Accessories',     nameTa:'தலை அணிகலன்',            price:'Enquire', cat:'jewelry', badge:'New',     emoji:'🌸', bg:'linear-gradient(135deg,#e0f7fa,#80deea)',   img:null },
  { id:13, name:'Khadi Cotton Sarees',  nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'🥻', bg:'linear-gradient(135deg,#fff8f2,#fef3e0)',   img:null },
  { id:14, name:'Mangalagiri Sarees',   nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'✨', bg:'linear-gradient(135deg,#e8f5e9,#c8e6c9)',   img:null },
  { id:15, name:'Mangalagiri Kurtis',   nameTa:'',                        price:'Enquire', cat:'saree',   badge:'',        emoji:'👗', bg:'linear-gradient(135deg,#fce4ec,#f8bbd0)',   img:null },
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
  if (id === 'admin') renderAdminList();
}

// ──────────────────────────────────────────────
// RENDER PRODUCTS
// ──────────────────────────────────────────────
function renderProducts() {
  const prods = getProducts();
  renderGrid('foods-grid',   prods.filter(p => ['pickle','drink','spice','other'].includes(p.cat)));
  renderGrid('jewelry-grid', prods.filter(p => p.cat === 'jewelry'));
  renderGrid('sarees-grid',  prods.filter(p => p.cat === 'saree'));
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
      </div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${p.nameTa ? `<div class="product-name-ta">${escapeHtml(p.nameTa)}</div>` : ''}
        <div class="product-price">${escapeHtml(p.price)}</div>
      </div>
      <button class="btn-order-now" data-product-id="${p.id}">Order Now</button>
    </div>
  `).join('');

  // Attach click handlers after render (event delegation)
  grid.querySelectorAll('.btn-order-now').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = parseInt(btn.dataset.productId);
      const prod = getProducts().find(pr => pr.id === id);
      if (prod) startOrder(prod.name);
    });
  });
}

// ── Category filter ──
function filterFood(cat, btn) {
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const prods = getProducts().filter(p => ['pickle','drink','spice','other'].includes(p.cat));
  const filtered = cat === 'all' ? prods : prods.filter(p => p.cat === cat);
  renderGrid('foods-grid', filtered);
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
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

function googleLogin() {
  loginSuccess('Google User', 'via Google');
}

function requestOtp() {
  const phone = document.getElementById('loginPhone').value.trim();
  if (!phone) { showToast('Enter your phone number!'); return; }
  document.getElementById('otpLoginSection').style.display = 'block';
  document.getElementById('loginBtn').textContent = 'Resend OTP';
  showToast('OTP sent! (Demo OTP: 123456)');
}

function moveOtp(el, nextId) {
  if (el.value && nextId) document.getElementById(nextId)?.focus();
}

function verifyOtp() {
  const otp = ['otp1','otp2','otp3','otp4','otp5','otp6']
    .map(id => document.getElementById(id).value).join('');
  if (otp === '123456') {
    const phone = document.getElementById('loginPhone').value.trim();
    // BUG FIX: Clear OTP boxes after successful login
    ['otp1','otp2','otp3','otp4','otp5','otp6'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('otpLoginSection').style.display = 'none';
    document.getElementById('loginBtn').textContent = 'Send OTP';
    loginSuccess('Customer', phone);
  } else if (otp.length === 6) {
    showToast('Incorrect OTP. Try again!');
  }
}

function requestSignupOtp() {
  const phone = document.getElementById('signupPhone').value.trim();
  if (!phone) { showToast('Enter your phone number!'); return; }
  document.getElementById('otpSignupSection').style.display = 'block';
  document.getElementById('signupBtn').textContent = 'Resend OTP';
  showToast('OTP sent! (Demo OTP: 123456)');
}

function verifySignupOtp() {
  const otp = ['sotp1','sotp2','sotp3','sotp4','sotp5','sotp6']
    .map(id => document.getElementById(id).value).join('');
  if (otp === '123456') {
    const name  = document.getElementById('signupName').value.trim() || 'Customer';
    const phone = document.getElementById('signupPhone').value.trim();
    // BUG FIX: Clear OTP boxes after successful signup
    ['sotp1','sotp2','sotp3','sotp4','sotp5','sotp6'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('otpSignupSection').style.display = 'none';
    document.getElementById('signupBtn').textContent = 'Send OTP';
    loginSuccess(name, phone);
  } else if (otp.length === 6) {
    showToast('Incorrect OTP. Try again!');
  }
}

function loginSuccess(name, phone) {
  currentUser = { name, phone };
  localStorage.setItem('ak_user', JSON.stringify(currentUser));
  closeModal('authModal');
  showUserBadge();
  showToast(`Welcome, ${name}! 🎉`);
}

function showUserBadge() {
  if (!currentUser) return;
  document.getElementById('heroBtns').style.display       = 'none';
  document.getElementById('userBadgeWrap').style.display  = 'flex';
  document.getElementById('userNameDisplay').textContent  = currentUser.name;
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('ak_user');
  document.getElementById('heroBtns').style.display      = 'flex';
  document.getElementById('userBadgeWrap').style.display = 'none';
  showToast('Logged out!');
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
  document.getElementById('o-product').value = productName;
  document.getElementById('o-qty').value     = 1;
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
  const product  = document.getElementById('o-product').value;
  const qty      = parseInt(document.getElementById('o-qty').value);
  const phone1   = document.getElementById('o-phone1').value.trim();
  const phone2   = document.getElementById('o-phone2').value.trim();
  const address  = document.getElementById('o-address').value.trim();

  // BUG FIX: Validate qty is a positive number
  if (!qty || qty < 1 || !phone1 || !address) {
    showToast('Please fill all required fields correctly!');
    return;
  }
  // BUG FIX: Basic phone number format check
  if (!/^[\d\s\+\-]{7,15}$/.test(phone1)) {
    showToast('Enter a valid primary phone number!');
    return;
  }

  document.getElementById('prev-product').textContent  = product;
  document.getElementById('prev-qty').textContent      = qty;
  document.getElementById('prev-phone1').textContent   = phone1;
  document.getElementById('prev-phone2').textContent   = phone2 || 'Not provided';
  document.getElementById('prev-address').textContent  = address;
  document.getElementById('prev-customer').textContent = currentUser.name;
  setOrderStep(2);
}

function goBackToEdit() { setOrderStep(1); }

function placeOrder() {
  const product  = document.getElementById('o-product').value;
  const qty      = document.getElementById('o-qty').value;
  const phone1   = document.getElementById('o-phone1').value.trim();
  const phone2   = document.getElementById('o-phone2').value.trim();
  const address  = document.getElementById('o-address').value.trim();
  const customer = currentUser.name;

  const orderText = `🛒 NEW ORDER - Annai's Kitchen\n\nCustomer: ${customer}\nProduct: ${product}\nQuantity: ${qty}\nPrimary Phone: ${phone1}\nSecondary Phone: ${phone2 || 'N/A'}\nDelivery Address: ${address}\n\n---\nAnnai's Kitchen Order System`;

  // FIX: open WhatsApp first, then email after a short delay to avoid popup blocking
  const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(orderText)}`;
  window.open(waUrl, '_blank');

  setTimeout(() => {
    const subject = encodeURIComponent(`New Order: ${product} from ${customer}`);
    const body    = encodeURIComponent(orderText);
    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  }, 500);

  setOrderStep(3);
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
    const subject = encodeURIComponent(`Order Enquiry from ${name}`);
    const body    = encodeURIComponent(`Hi Annai's Kitchen,\n\nName: ${name}\nPhone: ${phone}\n\nOrder Details:\n${msg}\n\nThank you!`);
    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  }
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderProducts();

  // Restore logged-in user from localStorage
  const savedUser = localStorage.getItem('ak_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showUserBadge();
    } catch (e) {
      localStorage.removeItem('ak_user');
    }
  }
});
