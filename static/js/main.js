function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(width, height);
    return `${width/divisor}:${height/divisor}`;
}

function getOrientation() {
    if (window.screen.orientation) {
        return window.screen.orientation.type;
    } else {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
}

function getDisplayType() {
    const ua = navigator.userAgent;
    let displayType = 'Unknown';

    // Check for mobile devices
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        displayType = 'Mobile';
    }
    // Check for tablets
    else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
        displayType = 'Tablet';
    }
    // Check for desktop
    else if (!/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        displayType = 'Desktop';
    }

    return displayType;
}

function getDisplaySettings() {
    const settings = [];

    // Check for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        settings.push('Dark Mode');
    } else {
        settings.push('Light Mode');
    }

    // Check for reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        settings.push('Reduced Motion');
    }

    // Check for high contrast
    if (window.matchMedia && window.matchMedia('(forced-colors: active)').matches) {
        settings.push('High Contrast');
    }

    return settings.join(', ') || 'Default Settings';
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    const browser = {
        name: 'Unknown',
        version: 'Unknown',
        platform: 'Unknown'
    };

    // More accurate browser detection
    if (ua.includes('Firefox/')) {
        browser.name = 'Firefox';
        browser.version = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.includes('Edg/')) {
        browser.name = 'Edge';
        browser.version = ua.match(/Edg\/([0-9.]+)/)[1];
    } else if (ua.includes('Chrome/')) {
        browser.name = 'Chrome';
        browser.version = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        browser.name = 'Safari';
        browser.version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
        browser.name = 'Opera';
        browser.version = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)[1];
    }

    // Platform detection
    if (ua.includes('Windows')) {
        browser.platform = 'Windows';
    } else if (ua.includes('Mac')) {
        browser.platform = 'macOS';
    } else if (ua.includes('Linux')) {
        browser.platform = 'Linux';
    } else if (ua.includes('Android')) {
        browser.platform = 'Android';
    } else if (ua.includes('iOS')) {
        browser.platform = 'iOS';
    }

    return browser;
}

function getOSInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return os;
}

function getRefreshRate() {
    return new Promise((resolve) => {
        let requestId = null;
        let lastTime = performance.now();
        let frames = 0;
        let refreshRate = 60; // Default value

        function countFrame() {
            frames++;
            const currentTime = performance.now();
            if (currentTime >= lastTime + 1000) {
                cancelAnimationFrame(requestId);
                refreshRate = Math.round((frames * 1000) / (currentTime - lastTime));
                resolve(refreshRate);
            } else {
                requestId = requestAnimationFrame(countFrame);
            }
        }

        requestId = requestAnimationFrame(countFrame);
    });
}

function updateDateTime() {
    const now = new Date();

    // Update date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString(undefined, dateOptions);

    // Update time
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('current-time').textContent = now.toLocaleTimeString(undefined, timeOptions);

    // Update timezone with offset
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const offsetSign = offset <= 0 ? '+' : '-';
    const timezoneWithOffset = `${timezone} (UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`;
    document.getElementById('timezone').textContent = timezoneWithOffset;

    // Update locale information
    const locale = navigator.language;
    const localeInfo = new Intl.DisplayNames(['en'], { type: 'language' });
    const regionInfo = new Intl.DisplayNames(['en'], { type: 'region' });
    const localeParts = locale.split('-');
    const language = localeInfo.of(localeParts[0]);
    const region = localeParts[1] ? regionInfo.of(localeParts[1]) : '';
    const localeDisplay = region ? `${language} (${region})` : language;
    document.getElementById('locale').textContent = localeDisplay;
}

// Cache for location data
let locationCache = {
    data: null,
    timestamp: null,
    expiryTime: 1800000 // 30 minutes in milliseconds
};

async function getLocation() {
    try {
        // Check if we have cached data that's not expired
        if (locationCache.data && locationCache.timestamp &&
            (Date.now() - locationCache.timestamp < locationCache.expiryTime)) {
            document.getElementById('location').textContent = locationCache.data;
            return;
        }

        // Try ipapi.co first
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('ipapi.co failed');

        const data = await response.json();
        const location = `${data.city || 'Unknown City'}, ${data.country_name || 'Unknown Country'}`;

        // Cache the successful response
        locationCache.data = location;
        locationCache.timestamp = Date.now();

        document.getElementById('location').textContent = location;
    } catch (error) {
        console.warn('Primary location service failed, trying fallback:', error);

        try {
            // Fallback to ip-api.com
            const fallbackResponse = await fetch('http://ip-api.com/json/');
            if (!fallbackResponse.ok) throw new Error('Fallback service failed');

            const fallbackData = await fallbackResponse.json();
            const fallbackLocation = `${fallbackData.city || 'Unknown City'}, ${fallbackData.country || 'Unknown Country'}`;

            // Cache the successful fallback response
            locationCache.data = fallbackLocation;
            locationCache.timestamp = Date.now();

            document.getElementById('location').textContent = fallbackLocation;
        } catch (fallbackError) {
            console.error('All location services failed:', fallbackError);
            document.getElementById('location').textContent = 'Location service unavailable';
        }
    }
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        document.getElementById('ip-address').textContent = data.ip;
    } catch (error) {
        document.getElementById('ip-address').textContent = 'Not Available';
    }
}

async function updateDisplayInfo() {
    // Screen Resolution
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    document.getElementById("screen-resolution").innerHTML =
        `<i class="fas fa-expand"></i> Screen Resolution<br><span>${screenWidth} pixels wide x ${screenHeight} pixels high</span>`;

    // Viewport Size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    document.getElementById("viewport-size").innerHTML =
        `<i class="fas fa-window-maximize"></i> Viewport Size<br><span>${viewportWidth} pixels wide x ${viewportHeight} pixels high</span>`;

    // Device Pixel Ratio
    const pixelRatio = window.devicePixelRatio;
    document.getElementById("pixel-ratio").innerHTML =
        `<i class="fas fa-microchip"></i> Device Pixel Ratio<br><span>${pixelRatio}</span>`;

    // Display Dimensions (approximate)
    const dpi = pixelRatio * 96;
    const screenWidthInches = screenWidth / dpi;
    const screenHeightInches = screenHeight / dpi;
    const screenWidthCm = screenWidthInches * 2.54;
    const screenHeightCm = screenHeightInches * 2.54;

    document.getElementById("display-dimensions").innerHTML =
        `<i class="fas fa-ruler"></i> Display Dimensions<br><span>${screenWidthInches.toFixed(2)}" (${screenWidthCm.toFixed(2)} cm) x ${screenHeightInches.toFixed(2)}" (${screenHeightCm.toFixed(2)} cm)</span>`;

    // Diagonal Size
    const diagonalInches = Math.sqrt(Math.pow(screenWidthInches, 2) + Math.pow(screenHeightInches, 2));
    const diagonalCm = diagonalInches * 2.54;
    document.getElementById("diagonal-size").innerHTML =
        `<i class="fas fa-vector-square"></i> Screen Diagonal Size<br><span>${diagonalInches.toFixed(2)}" (${diagonalCm.toFixed(2)} cm)</span>`;

    // Color Depth
    const colorDepth = window.screen.colorDepth;
    document.getElementById("color-depth").innerHTML =
        `<i class="fas fa-palette"></i> Color Depth<br><span>${colorDepth} bits per pixel</span>`;

    // Pixel Density
    const pixelDensity = Math.round(dpi);
    document.getElementById("pixel-density").innerHTML =
        `<i class="fas fa-dot-circle"></i> Pixel Density<br><span>${pixelDensity} DPI</span>`;

    // Refresh Rate
    try {
        const refreshRate = await getRefreshRate();
        document.getElementById("refresh-rate").innerHTML =
            `<i class="fas fa-sync"></i> Refresh Rate<br><span>${refreshRate} Hz</span>`;
    } catch (error) {
        document.getElementById("refresh-rate").innerHTML =
            `<i class="fas fa-sync"></i> Refresh Rate<br><span>Not Available</span>`;
    }

    // Display Type
    const displayType = getDisplayType();
    document.getElementById("display-type").innerHTML =
        `<i class="fas fa-desktop"></i> Display Type<br><span>${displayType}</span>`;

    // Display Settings
    const displaySettings = getDisplaySettings();
    document.getElementById("display-settings").innerHTML =
        `<i class="fas fa-cog"></i> Display Settings<br><span>${displaySettings}</span>`;

    // Screen Orientation
    const orientation = getOrientation();
    document.getElementById("screen-orientation").innerHTML =
        `<i class="fas fa-mobile-alt"></i> Screen Orientation<br><span>${orientation.charAt(0).toUpperCase() + orientation.slice(1)}</span>`;

    // Device Memory
    if (navigator.deviceMemory) {
        document.getElementById("device-memory").innerHTML =
            `<i class="fas fa-memory"></i> Device Memory<br><span>${navigator.deviceMemory} GB</span>`;
    } else {
        document.getElementById("device-memory").innerHTML =
            `<i class="fas fa-memory"></i> Device Memory<br><span>Not Available</span>`;
    }

    // Browser Information
    const browserInfo = getBrowserInfo();
    document.getElementById("browser-info").innerHTML =
        `<i class="fas fa-globe"></i> Browser Information<br><span>${browserInfo.name} ${browserInfo.version} on ${browserInfo.platform}</span>`;

    // Operating System
    const osInfo = getOSInfo();
    document.getElementById("os-info").innerHTML =
        `<i class="fas fa-laptop"></i> Operating System<br><span>${osInfo}</span>`;

    // Update footer information
    updateDateTime();
    await getLocation();
    await getIPAddress();
}

// Initialize event listeners
window.addEventListener('resize', updateDisplayInfo);
if (window.screen.orientation) {
    window.screen.orientation.addEventListener('change', updateDisplayInfo);
}

// Listen for display settings changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDisplayInfo);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateDisplayInfo);
    window.matchMedia('(forced-colors: active)').addEventListener('change', updateDisplayInfo);
}

// Update time every second
setInterval(updateDateTime, 1000);

updateDisplayInfo();