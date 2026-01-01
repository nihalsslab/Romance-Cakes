// Romance Cakes Web UI Logic

const BOOK_SHEET_API = 'https://script.google.com/macros/s/AKfycbxJxh_-TJ7mUy9GPSkhfJOyEVGhiU0wkurq05NfknQvrltFCW5v9vsnMHQlZmR9f-n8/exec';
const USE_MOCK_DATA = false;

// Mock Data removed/ignored for production...

document.addEventListener('DOMContentLoaded', () => {
    fetchCakes();
});

async function fetchCakes() {
    const loadingEl = document.getElementById('loading');
    const gridEl = document.getElementById('book-grid'); // Keeping ID same to avoid breaking HTML/CSS instantly, but ideally should be cake-grid
    const errorEl = document.getElementById('error-message');

    try {
        let cakes = [];

        if (USE_MOCK_DATA) {
            // ...
        } else {
            const response = await fetch(`${BOOK_SHEET_API}?action=read`);
            const data = await response.json();
            cakes = data;
        }

        renderCakes(cakes);

        loadingEl.classList.add('hidden');
        gridEl.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching books:", error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

function renderCakes(cakes) {
    const gridEl = document.getElementById('book-grid');
    gridEl.innerHTML = ''; // Clear current content

    cakes.forEach(cake => {
        const card = document.createElement('div');
        card.className = 'book-card'; // Keeping class name for CSS compatibility

        // Process the image URL to ensure it displays correctly
        const displayImage = processImageURL(cake.image_url);

        card.innerHTML = `
            <div class="book-image-container">
                <img src="${displayImage}" alt="${cake.title}" class="book-image" onerror="this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\'>Delicious Cake</div>'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${cake.title || 'Untitled Cake'}</h3>
                <p class="book-author">${cake.author || 'Freshly Baked'}</p> 
                <div class="book-footer">
                     <div class="book-price">₹${cake.price || '0.00'}</div>
                     <button class="buy-btn" onclick="buyCake('${(cake.title || '').replace(/'/g, "\\'")}', '${(cake.author || '').replace(/'/g, "\\'")}', '${cake.price}', '${(cake.image_url || '').replace(/'/g, "\\'")}')">Order Now</button>
                </div>
            </div>
        `;

        gridEl.appendChild(card);
    });
}


function processImageURL(url) {
    if (!url) return 'https://via.placeholder.com/300x450?text=No+Image';
    let newUrl = String(url).trim();

    // Already in correct format?
    if (newUrl.includes('drive.google.com/uc?export=view')) return newUrl;
    if (newUrl.includes('lh3.googleusercontent.com')) return newUrl;

    // Extract ID from various Drive URL formats
    let fileId = null;
    const regExp = /\/file\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/;
    const match = newUrl.match(regExp);

    if (match) {
        fileId = match[1] || match[2];
    }

    if (fileId) {
        // Use this specific format which is most reliable for img tags
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    return newUrl;
}

function buyCake(title, flavor, price, imageUrl) {
    const phoneNumber = "917356093565"; // Updated to Romance Cakes number from image

    let text = `Hello Romance Cakes, I am interested in ordering this cake:\n\n`;
    text += `*Cake Name:* ${title}\n`;
    text += `*Details/Flavor:* ${flavor}\n`;
    text += `*Price:* ₹${price}\n`;
    if (imageUrl) {
        text += `*Image:* ${imageUrl}`;
    }

    const message = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}
