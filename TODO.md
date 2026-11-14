# OmniBar Release & Polish TODO

## Chrome Web Store Release
- [ ] Merge PR #1 (`feat/f1-default-page`) and PR #2 (`feat/f2-m3-perf-polish`) to `main` so CI builds and publishes `dist/omnibar.zip`
- [ ] Register Chrome Web Store Developer account ($5 fee) and enable 2FA
- [ ] Add `PRIVACY.md` (or hosted privacy policy URL) stating all app/settings data stays local in `chrome.storage` with zero telemetry
- [ ] Prepare CWS permission justifications (`<all_urls>`, `declarativeNetRequest`, `tabs`, `sidePanel`, `windows`, `storage`)
- [ ] Verify/export store screenshot at `1280x800` or `640x400` (PNG/JPEG without alpha) from `assets/demo.png`
- [ ] Bump `version` in `manifest.json` for each subsequent release

## Known Limitations
- [ ] Investigate `web.whatsapp.com` embedding fallback (`Sec-Fetch-Dest: iframe` / `window.top !== window.self` / partitioned storage); current workaround is `Open in new tab` or `Open in Side Window`
