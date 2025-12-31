# Firestore Index Setup

## Problem

Firestore requires composite indexes for queries that filter by one field and order by another. The error you encountered is because the query:

```javascript
db.collection('essays')
  .where('user_id', '==', userId)
  .orderBy('updated_at', 'desc')
```

requires a composite index on `user_id` and `updated_at`.

## Solution Options

### Option 1: Use the Provided Link (Easiest)

Click the link from the error message to automatically create the index in Firebase Console:

```
https://console.firebase.google.com/v1/r/project/essay-forge/firestore/indexes?create_composite=...
```

This will open Firebase Console and pre-fill the index configuration. Click "Create Index" and wait for it to build (usually takes a few minutes).

### Option 2: Deploy via Firebase CLI

If you have Firebase CLI installed:

1. **Install Firebase CLI** (if not already installed):
   ```powershell
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```powershell
   firebase login
   ```

3. **Deploy the indexes**:
   ```powershell
   firebase deploy --only firestore:indexes
   ```

4. **Wait for index to build**: This can take several minutes depending on your data size. You can check progress in the Firebase Console.

### Option 3: Create Manually in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`essay-forge`)
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Configure:
   - **Collection ID**: `essays`
   - **Fields**:
     - `user_id` - Ascending
     - `updated_at` - Descending
   - **Query scope**: Collection
6. Click "Create"

## Files Created

- **`firestore.indexes.json`**: Defines the required indexes
- **`firestore.rules`**: Security rules for Firestore
- **`firebase.json`**: Firebase configuration
- **`.firebaserc`**: Firebase project configuration

## Verify Index is Built

After creating the index, wait for it to build. You can check the status:

1. In Firebase Console → Firestore → Indexes
2. Status will show "Building" then "Enabled" when ready
3. Once enabled, the error will disappear and essays will load properly

## Notes

- Indexes are required for production but Firestore Emulator doesn't need them during local development
- The index only needs to be created once per Firebase project
- Building time varies based on existing data (empty database = instant, large database = several minutes)
