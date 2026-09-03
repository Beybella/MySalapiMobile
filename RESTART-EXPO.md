# How to Restart Expo After Avatar Changes

## Steps to Fix "Something Went Wrong" Error

1. **Stop the current Expo server**
   - Press `Ctrl + C` in the terminal where Expo is running

2. **Clear the cache**
   ```bash
   cd mysalapi-app
   npx expo start -c
   ```

3. **If that doesn't work, try a full reset**
   ```bash
   cd mysalapi-app
   rm -rf node_modules/.cache
   npx expo start -c
   ```

4. **On your phone/emulator**
   - Close the Expo Go app completely
   - Reopen it and scan the QR code again

## What Changed
- Updated all 12 avatar names to Filipino-themed names
- All avatars now use high-resolution viewBox (100x100 instead of 36x36)
- SVG imports updated to include all necessary components

## New Avatar Names
1. Balato
2. Fifty-Fifty
3. Kuya Wil
4. Ampaw
5. Don
6. Donya
7. Datung
8. Chinkee
9. Five-Six
10. Haciendero
11. Balikbayan
12. Gastador
