# Vegetable Images Guide

## 📁 Folder Structure

```
public/
  vegetables/
    ├── README.md           (Documentation)
    ├── IMAGE-GUIDE.md      (This file)
    ├── placeholder.svg     (Generic placeholder)
    ├── tomato.svg         (Tomato image)
    ├── potato.svg         (Potato image)
    ├── carrot.svg         (Carrot image)
    ├── onion.svg          (Onion image)
    ├── cabbage.svg        (Cabbage image)
    └── cucumber.svg       (Cucumber image)
```

## 🖼️ How to Use Images

### For Brokers/Farmers Adding Vegetables

When you add or edit a vegetable in the system:

1. **Go to the Vegetables Management page** (Broker Dashboard → Vegetables)
2. **Click "Add Vegetable"** or edit an existing one
3. **In the "Image URL" field**, enter one of these paths:

```
/vegetables/tomato.svg
/vegetables/potato.svg
/vegetables/carrot.svg
/vegetables/onion.svg
/vegetables/cabbage.svg
/vegetables/cucumber.svg
/vegetables/placeholder.svg
```

### Example

If you're adding a tomato:
- **Name**: Tomato
- **Price**: 45.50
- **Image URL**: `/vegetables/tomato.svg`
- **Description**: Fresh red tomatoes

## 📤 Adding Your Own Images

### Option 1: Add to Public Folder (Recommended)

1. Save your vegetable image in this folder (`public/vegetables/`)
2. Use formats: JPG, PNG, or SVG
3. Name it descriptively (e.g., `red-bell-pepper.jpg`)
4. Reference it as: `/vegetables/red-bell-pepper.jpg`

### Option 2: Use External URLs

You can also use external image URLs:
```
https://example.com/images/my-vegetable.jpg
```

## 🎨 Image Requirements

- **Recommended Size**: 400x400px or 800x800px (square)
- **File Formats**: SVG (best for icons), PNG, JPG, WebP
- **File Size**: Keep under 500KB for good performance
- **Aspect Ratio**: Square (1:1) works best in the grid layout

## 🔍 Current Available Images

| Vegetable | File Path | Preview |
|-----------|-----------|---------|
| Placeholder | `/vegetables/placeholder.svg` | Generic vegetable icon |
| Tomato | `/vegetables/tomato.svg` | 🍅 Red tomato |
| Potato | `/vegetables/potato.svg` | 🥔 Brown potato |
| Carrot | `/vegetables/carrot.svg` | 🥕 Orange carrot |
| Onion | `/vegetables/onion.svg` | 🧅 Brown onion |
| Cabbage | `/vegetables/cabbage.svg` | 🥬 Green cabbage |
| Cucumber | `/vegetables/cucumber.svg` | 🥒 Green cucumber |

## 💡 Tips

1. **Always start with a forward slash** `/` when using local images
2. **Check the path is correct** - the image won't show if the path is wrong
3. **Use descriptive names** - helps you remember which image is which
4. **Test the image** after adding - view the vegetable listing to confirm
5. **Keep backups** of your custom images

## 🐛 Troubleshooting

**Image not showing?**
- ✅ Check the path starts with `/vegetables/`
- ✅ Verify the file exists in `public/vegetables/`
- ✅ Try refreshing the browser (Ctrl+F5)
- ✅ Check browser console for errors (F12)

**Image looks stretched?**
- Use square images (same width and height)
- SVG files automatically scale without distortion

## 📞 Need Help?

Contact the system administrator if you need:
- Additional vegetable images
- Help uploading custom images
- Image optimization or resizing
