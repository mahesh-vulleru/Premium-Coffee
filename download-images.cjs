const fs = require('fs');
const path = require('path');
const https = require('https');

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const images = [
  {
    name: 'hero-coffee-splash.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=85&w=1200&auto=format&fit=crop'
  },
  {
    name: 'aurora-pouch.jpg',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=85&w=800&auto=format&fit=crop'
  },
  {
    name: 'delivery-spoon.jpg',
    url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=85&w=800&auto=format&fit=crop'
  },
  {
    name: 'morning-fuel.jpg',
    url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=85&w=800&auto=format&fit=crop'
  },
  {
    name: 'special-offer-pouch.jpg',
    url: 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?q=85&w=800&auto=format&fit=crop'
  },
  {
    name: 'subscription-steaming.jpg',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=85&w=1400&auto=format&fit=crop'
  },
  {
    name: 'lifestyle-woman-coffee.jpg',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=85&w=900&auto=format&fit=crop'
  },
  {
    name: 'barista-latte-art.jpg',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=85&w=700&auto=format&fit=crop'
  },
  {
    name: 'cafe-interior.jpg',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=85&w=700&auto=format&fit=crop'
  },
  {
    name: 'cafe-counter.jpg',
    url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=85&w=700&auto=format&fit=crop'
  },
  {
    name: 'woman-cafe-enjoy.jpg',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=85&w=700&auto=format&fit=crop'
  },
  {
    name: 'sustainable-farm.jpg',
    url: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=85&w=900&auto=format&fit=crop'
  },
  {
    name: 'product-espresso.jpg',
    url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=500&auto=format&fit=crop'
  },
  {
    name: 'product-dark-blend.jpg',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=500&auto=format&fit=crop'
  },
  {
    name: 'product-vanilla.jpg',
    url: 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?q=80&w=500&auto=format&fit=crop'
  },
  {
    name: 'product-hazelnut.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=500&auto=format&fit=crop'
  },
  {
    name: 'product-organic.jpg',
    url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=500&auto=format&fit=crop'
  }
];

function download(item) {
  return new Promise((resolve) => {
    const dest = path.join(imagesDir, item.name);
    
    function fetchWithRedirect(url) {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchWithRedirect(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          console.error(`Failed ${item.name}: ${res.statusCode}`);
          resolve(false);
          return;
        }
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Saved: ${item.name}`);
          resolve(true);
        });
      }).on('error', (err) => {
        console.error(`Error ${item.name}:`, err.message);
        resolve(false);
      });
    }

    fetchWithRedirect(item.url);
  });
}

async function run() {
  console.log(`Downloading ${images.length} images...`);
  for (const img of images) {
    await download(img);
  }
  console.log('All downloads finished!');
}

run();

