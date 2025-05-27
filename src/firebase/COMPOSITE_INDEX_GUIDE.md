# Creating a Composite Index in Firestore

If you see an error like this:

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/publicpulse-2025/firestore...
```

Follow these steps to create the required composite index:

1. Click on the URL provided in the error message. It will take you directly to the Firebase console index creation page.

2. If prompted, sign in with your Firebase account credentials.

3. You'll see a page with the index details pre-filled. The index will look something like:
   - Collection ID: `users`
   - Fields indexed:
     - `isApproved` (Ascending)
     - `role` (Ascending)
     - `__name__` (Ascending)

4. Click the "Create index" button.

5. Wait for the index to finish building (this may take a few minutes).

6. Once the index status shows "Enabled", your query will work properly.

## Alternative Solution

The code has been modified to use a simpler query that doesn't require a composite index. If you're still experiencing issues, create the index as described above.

## Manually Creating an Index

If the direct link doesn't work, you can manually create the index:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database in the left sidebar
4. Click on the "Indexes" tab
5. Click "Add Index"
6. Set the Collection ID to "users"
7. Add the following fields:
   - Field path: `isApproved`, Order: Ascending
   - Field path: `role`, Order: Ascending
8. Click "Create"
