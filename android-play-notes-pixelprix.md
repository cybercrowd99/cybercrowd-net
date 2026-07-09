# PixelPrix — Android / Google Play Build Notes

## Required before Play upload

1. App must be packaged as an Android App Bundle (.aab).
2. App must target the current required Android API level for Google Play.
3. Privacy Policy URL must be live:
   https://cybercrowd.net/privacy-policy.html
4. Family Safety URL should be live:
   https://cybercrowd.net/pixelprix-safety.html
5. Support URL should be live:
   https://cybercrowd.net/support.html
6. Data Safety form must match actual app behavior.
7. Store listing must not claim upload/sync/accounts/AI if the app does not provide them.

## Permissions

Use only what PixelPrix needs.

Required for game:
- android.permission.CAMERA
- android.permission.RECORD_AUDIO

Needed only if the wrapper loads web/R2/network assets:
- android.permission.INTERNET

Avoid unless truly needed:
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- READ_CONTACTS
- WRITE_CONTACTS
- READ_MEDIA_IMAGES
- READ_MEDIA_VIDEO
- READ_MEDIA_AUDIO
- AD_ID

## Play listing short description

PixelPrix turns cleanup into a local camera game with treasure pictures and family voice replays.

## Play listing full description draft

PixelPrix is a CyberCade clean-up adventure. Take a room picture, snap treasure pictures, and clean up by finding each treasure. The game can record short local voice replays so the player hears their own word during cleanup.

PixelPrix is designed for local play:
- no account required
- no ads in the local game flow
- no public posting
- no social sharing
- pictures and voice replays are intended to stay on the device

Parents or guardians should supervise camera and microphone use.

## Content notes

Target audience:
- Choose carefully in Play Console.
- If children are included, complete the Families / child safety questions accurately.

Ads:
- If no ads, do not include ad SDKs.

Data Safety:
- Must match the actual shipped app, not just the website text.
