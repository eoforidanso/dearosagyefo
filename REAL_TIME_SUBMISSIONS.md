# Real-Time Visitor Submission Review

## ✨ New Features Added

Your dashboard now has **real-time auto-refresh** for visitor letter submissions!

### What's New:

1. **Auto-Refresh Every 10 Seconds**
   - Dashboard automatically checks for new visitor submissions
   - No need to manually refresh the page
   - Happens in the background without interrupting your work

2. **Desktop Notifications**
   - When new visitor letters arrive, you'll see a toast notification
   - Shows: "📬 New Submission! X new visitor letter(s) awaiting review"
   - Notification stays for 5 seconds

3. **Badge Counter**
   - The "📬 Visitor Submissions" section shows a badge with pending count
   - Updates automatically when new submissions arrive
   - Disappears when all submissions are reviewed

---

## How It Works

### On Dashboard Load:
```javascript
loadSubmissions();           // Initial load

// Auto-refresh every 10 seconds
setInterval(() => {
    loadSubmissions();
}, 10000);
```

### When New Submissions Arrive:
```javascript
// Compares current pending count with previous count
if (pending.length > previousPendingCount) {
    const newCount = pending.length - previousPendingCount;
    showToast('📬 New Submission!', `${newCount} new visitor letter(s)...`, '📬', 5000);
}
```

---

## Testing

### Test Locally (CloudFront URL):
1. Open dashboard: **https://d3269abdoxx7v9.cloudfront.net/dashboard.html**
2. Log in with your credentials
3. Keep dashboard open
4. In another tab, go to: **https://d3269abdoxx7v9.cloudfront.net/write.html**
5. Submit a test letter as a visitor
6. Return to dashboard tab
7. Within 10 seconds, you'll see:
   - Toast notification: "📬 New Submission!"
   - Badge counter updates
   - New letter appears in the list

### Test After DNS (Your Domain):
Once DNS propagates:
1. Dashboard: **https://dearosagyefo.com/dashboard.html**
2. Write page: **https://dearosagyefo.com/write.html**
3. Same workflow as above

---

## API Endpoints Used

### Get Pending Submissions:
```
GET /api/visitors/admin/pending
Headers: { 'x-admin-secret': 'osagyefo-admin-review-2026' }
```

### Get Submission History:
```
GET /api/visitors/admin/history
Headers: { 'x-admin-secret': 'osagyefo-admin-review-2026' }
```

### Approve Submission:
```
PUT /api/visitors/admin/:id/approve
Headers: { 'x-admin-secret': 'osagyefo-admin-review-2026' }
```

### Reject Submission:
```
PUT /api/visitors/admin/:id/reject
Headers: { 'x-admin-secret': 'osagyefo-admin-review-2026' }
```

---

## Customization Options

### Change Refresh Interval:

In `dashboard.html`, find this line:
```javascript
}, 10000);  // 10 seconds = 10000 milliseconds
```

Change to:
- **5 seconds**: `}, 5000);`
- **30 seconds**: `}, 30000);`
- **1 minute**: `}, 60000);`

### Disable Auto-Refresh:

Comment out the setInterval:
```javascript
// setInterval(() => {
//     loadSubmissions();
// }, 10000);
```

### Change Notification Duration:

Find the showToast call:
```javascript
showToast('📬 New Submission!', '...', '📬', 5000);  // 5 seconds
```

Change the last number (5000 = 5 seconds)

---

## Performance Notes

- **Lightweight**: Only fetches JSON data (few KB)
- **Smart**: Only shows notification when count increases
- **Efficient**: Uses cached data to avoid re-rendering unchanged content
- **Non-intrusive**: Auto-refresh happens in background

---

## Workflow for Admin

1. **Login to Dashboard**
   - See existing pending submissions

2. **Keep Dashboard Open**
   - Dashboard automatically checks every 10 seconds

3. **When Visitor Submits Letter**
   - Frontend (write.html) → POST /api/visitors/submit
   - Backend saves to database with status: "pending"

4. **Dashboard Detects New Submission** (within 10 seconds)
   - Toast notification appears
   - Badge counter increments
   - New letter appears in list

5. **Review & Approve/Reject**
   - Click "View" to read full letter
   - Click "✓ Approve" to publish to site
   - Click "✗ Reject" to decline

6. **After Action**
   - Badge counter updates
   - Letter moves to history
   - Toast confirms action

---

## Next Steps

### Add Browser Notifications (Optional):

For desktop notifications outside the browser window:

```javascript
async function loadSubmissions() {
    // ...existing code...
    
    if (previousPendingCount > 0 && pending.length > previousPendingCount) {
        // In-app notification
        showToast('📬 New Submission!', '...', '📬', 5000);
        
        // Browser notification (requires permission)
        if (Notification.permission === "granted") {
            new Notification("New Letter Submission", {
                body: `${newCount} new visitor letter awaiting review`,
                icon: '/thumbnail.png'
            });
        }
    }
}
```

Request permission on page load:
```javascript
if (Notification.permission === "default") {
    Notification.requestPermission();
}
```

---

## Troubleshooting

### Notifications Not Showing:
- Check browser console for errors
- Verify API endpoints are accessible
- Confirm admin secret is correct

### Auto-Refresh Not Working:
- Check browser console for errors
- Verify CloudFront `/api/*` routing is configured
- Test API directly: `curl https://dearosagyefo.com/api/visitors/admin/pending`

### Badge Not Updating:
- Check element exists: `document.getElementById('submissions-badge')`
- Verify API returns correct data structure

---

**Status**: ✅ Deployed to S3
**Last Updated**: April 18, 2026
