# 🧪 MARKETPLACE TESTING GUIDE

**Status**: Ready to test  
**Time**: 10 minutes  

---

## STEP 1: TEST ADD PRODUCT PAGE (3 minutes)

### Desktop Testing
1. **Go to**: `/braider/dashboard`
2. **Click**: "Add Product" button
3. **Verify**:
   - ✅ Page loads without errors
   - ✅ Country selector shows (NG/US)
   - ✅ Form fields are visible
   - ✅ All inputs are responsive

4. **Fill Form**:
   - Country: Nigeria
   - Product Name: "Premium Hair Extensions"
   - Description: "High quality 24 inch extensions"
   - Category: "Hair Extensions"
   - State: "Lagos"
   - City: "Ikoyi"
   - Price: "5000"
   - Stock: "10"

5. **Upload Image**:
   - Click "Upload Image"
   - Select a JPG/PNG file
   - Verify image preview appears
   - Verify success message

6. **Submit**:
   - Click "Add Product"
   - Verify success message
   - Verify redirect to marketplace

### Mobile Testing (< 640px)
1. **Open DevTools**: F12
2. **Toggle Device Toolbar**: Ctrl+Shift+M
3. **Set to**: iPhone 12 (390px)
4. **Verify**:
   - ✅ Form is single column
   - ✅ Buttons are full width
   - ✅ Text is readable
   - ✅ Inputs are touch-friendly
   - ✅ Image upload works
   - ✅ Form submits successfully

### Tablet Testing (640px - 1024px)
1. **Set to**: iPad (768px)
2. **Verify**:
   - ✅ Form is properly laid out
   - ✅ 2-column layout where appropriate
   - ✅ All elements are visible
   - ✅ Form submits successfully

---

## STEP 2: TEST MARKETPLACE PAGE (4 minutes)

### Desktop Testing
1. **Go to**: `/marketplace`
2. **Verify**:
   - ✅ Page loads without errors
   - ✅ Header displays correctly
   - ✅ Search bar is visible
   - ✅ Sidebar filters are visible
   - ✅ Product grid displays

3. **Test Search**:
   - Type "Hair Extensions"
   - Verify products filter in real-time
   - Clear search
   - Verify all products return

4. **Test Country Filter**:
   - Click "Nigeria" flag
   - Verify products filter
   - Click "USA" flag
   - Verify products filter
   - Verify currency changes (₦ vs $)

5. **Test Category Filter**:
   - Click "Hair Extensions"
   - Verify products filter
   - Click "All Products"
   - Verify all products return

6. **Test Location Filter**:
   - Select "Lagos" from dropdown
   - Verify products filter
   - Select "All Locations"
   - Verify all products return

7. **Test Pagination**:
   - Click "Next"
   - Verify page changes
   - Click "Previous"
   - Verify page changes

8. **Test Product Card**:
   - Hover over product
   - Verify hover effect (scale up)
   - Click product
   - Verify navigation to product page

### Mobile Testing (< 640px)
1. **Open DevTools**: F12
2. **Toggle Device Toolbar**: Ctrl+Shift+M
3. **Set to**: iPhone 12 (390px)
4. **Verify**:
   - ✅ Header is responsive
   - ✅ Search bar is full width
   - ✅ Filter button is visible
   - ✅ Product grid is single column
   - ✅ Product cards are readable

5. **Test Mobile Filters**:
   - Click "Filter" button
   - Verify filter drawer opens
   - Click country
   - Verify drawer closes
   - Verify products filter
   - Click "Filter" again
   - Verify drawer opens
   - Click category
   - Verify drawer closes
   - Verify products filter

6. **Test Mobile Search**:
   - Type in search
   - Verify products filter
   - Verify keyboard doesn't break layout

### Tablet Testing (640px - 1024px)
1. **Set to**: iPad (768px)
2. **Verify**:
   - ✅ Sidebar is visible
   - ✅ Product grid is 2-3 columns
   - ✅ All filters work
   - ✅ Search works
   - ✅ Pagination works

---

## STEP 3: TEST ERROR HANDLING (2 minutes)

### Add Product Errors
1. **Try to submit empty form**:
   - Click "Add Product" without filling fields
   - Verify error: "Product name is required"

2. **Try invalid price**:
   - Fill form but set price to "0"
   - Click "Add Product"
   - Verify error: "Valid price is required"

3. **Try missing location**:
   - Fill form but don't select state
   - Click "Add Product"
   - Verify error: "State/Province is required"

4. **Try large image**:
   - Create a 10MB image file
   - Try to upload
   - Verify error: "Image must be less than 5MB"

5. **Try non-image file**:
   - Try to upload a PDF
   - Verify error: "Please select an image file"

### Marketplace Errors
1. **Test with no products**:
   - Filter to a category with no products
   - Verify message: "No products found"

2. **Test with invalid search**:
   - Search for "xyzabc123"
   - Verify message: "No products found"

---

## STEP 4: VERIFY DATABASE

### Check Products Table
1. **Go to**: Supabase Dashboard
2. **Click**: SQL Editor
3. **Run**:
```sql
SELECT COUNT(*) as total_products FROM marketplace_products;
```
4. **Verify**: Count > 0

### Check Product Details
```sql
SELECT id, name, price, currency, country_code, is_active 
FROM marketplace_products 
LIMIT 5;
```
4. **Verify**: Products have correct data

---

## STEP 5: VERIFY RESPONSIVE DESIGN

### Breakpoints to Test
- **Mobile**: 375px (iPhone SE)
- **Mobile**: 390px (iPhone 12)
- **Mobile**: 414px (iPhone 12 Pro Max)
- **Tablet**: 768px (iPad)
- **Tablet**: 1024px (iPad Pro)
- **Desktop**: 1280px (Laptop)
- **Desktop**: 1920px (Desktop)

### Elements to Check at Each Breakpoint
- [ ] Text is readable
- [ ] Buttons are clickable
- [ ] Images display correctly
- [ ] Forms are usable
- [ ] Filters work
- [ ] Search works
- [ ] Pagination works
- [ ] No horizontal scroll
- [ ] No overlapping elements

---

## STEP 6: PERFORMANCE CHECK

### Page Load Time
1. **Open DevTools**: F12
2. **Go to**: Network tab
3. **Load**: `/marketplace`
4. **Verify**: Page loads in < 3 seconds

### Image Load Time
1. **Go to**: `/marketplace`
2. **Verify**: Product images load quickly
3. **Verify**: No broken images

### API Response Time
1. **Open DevTools**: F12
2. **Go to**: Network tab
3. **Search**: for products
4. **Verify**: API responds in < 1 second

---

## STEP 7: BROWSER COMPATIBILITY

### Test in Different Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Verify in Each Browser
- [ ] Page loads
- [ ] Forms work
- [ ] Images display
- [ ] Filters work
- [ ] Search works
- [ ] Responsive design works

---

## QUICK TEST CHECKLIST

### Add Product Page
- [ ] Page loads
- [ ] Form fields visible
- [ ] Country selector works
- [ ] Image upload works
- [ ] Form validation works
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] Redirects to marketplace
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] Desktop responsive

### Marketplace Page
- [ ] Page loads
- [ ] Products display
- [ ] Search works
- [ ] Country filter works
- [ ] Category filter works
- [ ] Location filter works
- [ ] Pagination works
- [ ] Product cards clickable
- [ ] Mobile responsive
- [ ] Tablet responsive
- [ ] Desktop responsive

### Error Handling
- [ ] Form validation errors
- [ ] File upload errors
- [ ] API errors
- [ ] No products message
- [ ] Error messages are clear

### Database
- [ ] Products in database
- [ ] Product data correct
- [ ] Images stored correctly
- [ ] Prices correct
- [ ] Locations correct

---

## EXPECTED RESULTS

### Add Product
✅ Product created successfully  
✅ Product appears in marketplace  
✅ Image displays correctly  
✅ Price shows with correct currency  
✅ Location displays correctly  

### Marketplace
✅ Products display in grid  
✅ Filters work correctly  
✅ Search works correctly  
✅ Pagination works correctly  
✅ Responsive on all devices  

### Error Handling
✅ Clear error messages  
✅ Form validation works  
✅ File validation works  
✅ API errors handled  

---

## TROUBLESHOOTING

### Products Not Showing
1. Check database: `SELECT COUNT(*) FROM marketplace_products;`
2. Check filters: Are they too restrictive?
3. Check API: Open DevTools → Network → Check `/api/marketplace/products`

### Image Not Uploading
1. Check file size: Must be < 5MB
2. Check file type: Must be image (JPG, PNG, WebP)
3. Check storage bucket: `braider-uploads` must exist
4. Check API response: Open DevTools → Network → Check response

### Form Not Submitting
1. Check validation: All required fields filled?
2. Check auth: Are you logged in?
3. Check API: Open DevTools → Network → Check response
4. Check console: F12 → Console → Look for errors

### Responsive Issues
1. Check viewport: Is device toolbar enabled?
2. Check breakpoints: Are Tailwind classes correct?
3. Check CSS: Are styles being applied?
4. Check browser: Try different browser

---

## NEXT STEPS

After testing:
1. ✅ Verify all tests pass
2. ✅ Check Vercel deployment
3. ✅ Monitor production
4. ✅ Gather user feedback
5. ✅ Fix any issues

---

**Status**: 🟢 READY TO TEST  
**Time**: 10 minutes  
**Impact**: Verify marketplace works!
