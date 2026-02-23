# PWA Testing Guide

This guide will help you test the Progressive Web App (PWA) functionality of the Mobile Top-Up platform.

## Prerequisites

- HTTPS or localhost (PWAs require secure contexts)
- Modern browser (Chrome, Safari, Firefox, Edge)
- Mobile device for installation testing (optional but recommended)

## Testing Locally

### 1. Build and Start Production Server

PWAs only work properly in production mode. Development mode may not register the service worker correctly.

```bash
# Build the application
yarn build

# Start production server
yarn start
```

The app will be available at `http://localhost:3000`

### 2. Verify Service Worker Registration

1. Open the application in your browser
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Go to **Application** tab
4. Click **Service Workers** in the left sidebar
5. You should see `sw.js` registered and running

**Expected Output:**
- Status: `activated and is running`
- Source: `/sw.js`

### 3. Test Offline Functionality

1. In DevTools **Application** tab, check the **Offline** checkbox
2. Refresh the page
3. You should see the offline page at `/offline`
4. Uncheck **Offline** and refresh again

### 4. Check Web App Manifest

1. In DevTools **Application** tab
2. Click **Manifest** in the left sidebar
3. Verify the following:
   - **Name:** Mobile Top-Up - Prepaid Minutes Platform
   - **Short Name:** Mobile Top-Up
   - **Start URL:** /
   - **Display:** standalone
   - **Icons:** All sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)

### 5. Run Lighthouse PWA Audit

1. Open DevTools
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Analyze page load**
5. **Target Score:** 90+ (aim for 100)

**Key Metrics to Check:**
- ✓ Installable
- ✓ Has a service worker
- ✓ Responds with 200 when offline
- ✓ Has a web app manifest
- ✓ Configured for a custom splash screen
- ✓ Sets a theme color

## Testing Installation

### Desktop Installation (Chrome/Edge)

1. Visit `http://localhost:3000` in Chrome or Edge
2. After 3 seconds, an install prompt should appear in the bottom-right
3. Click **Install** button
4. The app will install and open in a standalone window
5. Check your Applications folder or Start Menu - the app should be there

**Manual Installation:**
- Click the install icon in the address bar (⊕ or install icon)
- Or: Chrome Menu → More Tools → Create Shortcut → Check "Open as window"

### Mobile Installation (iOS - Safari)

1. Open the site on your iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. The app icon will appear on your home screen
6. Tap the icon - it opens in standalone mode (no browser UI)

**iOS Features:**
- Standalone display (no Safari UI)
- Custom splash screen
- Status bar styling
- App icon on home screen

### Mobile Installation (Android - Chrome)

1. Open the site on your Android device
2. After a few seconds, a banner will appear at the bottom
3. Tap **Install** or **Add to Home Screen**
4. Confirm the installation
5. The app icon will appear in your app drawer

**Manual Installation:**
- Tap Chrome menu (⋮)
- Select **Install app** or **Add to Home Screen**

## Testing Features

### 1. Offline Support

**Test Scenario:**
1. Install the app on your phone
2. Use the app while online (browse products, view pages)
3. Turn on Airplane Mode
4. Try to navigate to previously visited pages - they should load from cache
5. Try to visit a new page - you'll see the offline page
6. Turn off Airplane Mode - app resumes normal operation

### 2. Install Prompt

**Test Scenario:**
1. Visit the site for the first time
2. Wait 3 seconds
3. Install prompt should appear in bottom-right corner
4. Test **Install** button - should trigger native installation
5. Test **Not now** button - prompt should dismiss
6. Test **X** button - prompt should close

**Prompt Dismissal:**
- Dismissal is stored in `sessionStorage`
- Prompt won't show again in the same session
- Will show again in a new session (new tab/window)

### 3. Caching Strategy

**Test Scenario:**
1. Visit several pages while online
2. Open DevTools → Application → Cache Storage
3. Expand `mobile-topup-v1` - should contain pre-cached assets
4. Expand `mobile-topup-runtime-v1` - should contain pages you visited
5. Clear network cache and reload - pages load instantly from service worker cache

### 4. App Updates

When you update the service worker:
1. Change `CACHE_NAME` version in `public/sw.js`
2. Deploy the update
3. Users will get the new service worker in background
4. Old caches are automatically cleaned up

## Debugging Issues

### Service Worker Not Registering

**Solutions:**
- Ensure you're running in production mode (`yarn build && yarn start`)
- Check DevTools Console for errors
- Verify `/sw.js` is accessible at `http://localhost:3000/sw.js`
- Try unregistering old service workers in DevTools

### Install Prompt Not Showing

**Reasons:**
- Already installed (check chrome://apps or Settings → Apps)
- Previously dismissed (clear browser data or use Incognito)
- PWA criteria not met (run Lighthouse audit)
- Browser doesn't support install prompts (e.g., Firefox)

**Force Install Prompt:**
- Chrome: DevTools → Application → Manifest → **Add to homescreen**

### Offline Page Not Working

**Solutions:**
- Verify service worker is activated
- Check that `/offline` route exists and loads
- Look for errors in DevTools Console
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Icons Not Displaying

**Solutions:**
- Verify icons exist in `public/icons/` directory
- Run `yarn pwa:generate-icons` to regenerate
- Check manifest.ts paths match actual file locations
- Hard refresh or clear cache

## Performance Optimization

### Cache Management

The service worker caches:
- **Pre-cache** (install): Essential routes like `/`, `/login`, `/offline`
- **Runtime cache**: Pages visited, images, scripts, styles
- **API requests**: NOT cached (always fresh)

### Best Practices

1. **Update Cache Version** when deploying significant changes
2. **Monitor Cache Size** - consider cache limits on mobile devices
3. **Test on Slow Networks** - use DevTools Network throttling
4. **Test on Real Devices** - emulators don't fully simulate PWA behavior

## Production Deployment

### HTTPS Required

PWAs **must** be served over HTTPS in production (except localhost).

**Deployment Checklist:**
- ✓ SSL certificate installed
- ✓ HTTPS redirect configured
- ✓ Service worker paths are correct
- ✓ Icons are optimized for mobile
- ✓ Manifest colors match brand
- ✓ Lighthouse PWA score > 90

### Environment-Specific Configuration

**Development:**
- Service worker may not work in dev mode
- Use `yarn build && yarn start` for testing

**Production:**
- Service worker automatically activated
- Caching strategies fully functional
- Install prompts appear on supported browsers

## Troubleshooting Commands

```bash
# Regenerate all icons
yarn pwa:generate-icons

# View testing instructions
yarn pwa:test

# Build and test locally
yarn build && yarn start

# Check for TypeScript errors
yarn typecheck

# Check for linting issues
yarn lint
```

## Browser Support

| Browser | Installation | Service Worker | Offline |
|---------|-------------|----------------|---------|
| Chrome (Android) | ✓ | ✓ | ✓ |
| Safari (iOS) | ✓ | ✓ | ✓ |
| Edge (Desktop/Mobile) | ✓ | ✓ | ✓ |
| Chrome (Desktop) | ✓ | ✓ | ✓ |
| Firefox | Partial | ✓ | ✓ |
| Samsung Internet | ✓ | ✓ | ✓ |

## Next Steps

1. **Customize Icons:** Replace placeholder icons with your brand logo
2. **Add Push Notifications:** Implement the push notification handlers in `sw.js`
3. **Background Sync:** Implement transaction sync for offline purchases
4. **App Updates:** Add update notification when new version available
5. **Analytics:** Track PWA installations and offline usage

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [Chrome DevTools: Debug PWAs](https://developer.chrome.com/docs/devtools/progressive-web-apps)
- [Apple: PWA Support](https://developer.apple.com/videos/play/wwdc2018/220/)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Run Lighthouse audit for detailed feedback
3. Check browser console for errors
4. Verify service worker is registered in DevTools

Happy testing! Your prepaid minutes platform is now installable as a native-like app.
