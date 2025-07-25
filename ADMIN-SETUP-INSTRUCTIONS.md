# 🔧 Admin Panel Setup Instructions

## 🚨 **IMMEDIATE FIX FOR 404 ERROR**

### **Step 1: Run Database Migration**
Copy and paste this into your **Supabase SQL Editor**:

```sql
-- Run the complete migration first
-- (Copy the entire contents of migration-admin-panel-schema.sql)
```

### **Step 2: Make Yourself Admin**
Run this in **Supabase SQL Editor** (replace with your email):

```sql
-- Make your user an admin
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'hugo_eilenberg@mac.com';

-- Verify it worked
SELECT email, is_admin, community_verified, created_at 
FROM users 
WHERE email = 'hugo_eilenberg@mac.com';
```

### **Step 3: Test Admin Access**
1. **Navigate to**: `http://localhost:3002/admin`
2. **You should see**: Admin dashboard with metrics
3. **If still 404**: Clear browser cache and try again

---

## 🔍 **DEBUGGING STEPS**

### **Check Authentication:**
```sql
-- See your current user status
SELECT 
    email, 
    is_admin, 
    community_verified,
    email_verified_at,
    created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### **Check Admin Tables:**
```sql
-- Verify migration worked
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('algorithm_config', 'listing_analytics', 'admin_actions', 'content_reports');
```

### **Test URLs:**
- **Main Site**: `http://localhost:3002/`
- **Admin Panel**: `http://localhost:3002/admin`
- **Admin Dashboard**: `http://localhost:3002/admin` (same as above)

---

## ⚡ **QUICK TEST**

After making yourself admin, try this sequence:

1. **Logout**: Go to `http://localhost:3002/api/auth/logout`
2. **Login Again**: Go back to main site and authenticate
3. **Admin Panel**: Navigate to `http://localhost:3002/admin`

You should see:
- ✅ Professional admin sidebar
- ✅ Dashboard with metrics
- ✅ Navigation to Algorithm Control, Analytics, etc.

---

## 🚨 **IF STILL 404**

Check browser console for errors:
1. **Open Browser DevTools** (F12)
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** for failed requests

Common issues:
- **Not logged in**: You'll see unauthorized access page
- **Not admin**: You'll see unauthorized access page  
- **Database not migrated**: You'll see API errors
- **Wrong URL**: Make sure you're using `localhost:3002/admin` 