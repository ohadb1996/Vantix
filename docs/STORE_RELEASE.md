# פרסום Vantix לחנויות (com.vantix.app)

מדריך מקוצר — מבוסס על התהליך שהוגדר ב-maxDelivery-partners.

## מזהים

| פלטפורמה | מזהה |
|----------|------|
| Bundle / Package ID | `com.vantix.app` |
| שם באפליקציה | Vantix |
| Apple Team ID | `4V7MN36663` |
| Firebase project | `maxdeliveries` |

---

## עדכון גרסה לפני כל העלאה

```bash
cd vantix
npm run bump 1.0.1
npm run sync
```

הסקריפט מעדכן: `package.json`, `android/app/build.gradle`, `ios/.../project.pbxproj`.

---

## iOS — App Store / TestFlight

### פעם ראשונה (App Store Connect)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → New App
2. Platform: iOS, Name: **Vantix**, Bundle ID: **com.vantix.app**
3. העתק את **Apple ID** של האפליקציה ל-`codemagic.yaml` → `APP_STORE_APPLE_ID`
4. מלא: Screenshots, תיאור, Privacy Policy URL, App Privacy

### בנייה אוטומטית (Codemagic) — מומלץ

**App Store Connect Apple ID:** `6785395710`

1. חבר את הריפו `vantix` ל-[Codemagic](https://codemagic.io) (אותו team כמו partners)
2. ודא ש-integration **MaxDelivery** מוגדר תחת Team settings → Integrations → App Store Connect
3. ב-Codemagic → הפרויקט → **Workflow editor** → ודא ש-`codemagic.yaml` מזוהה (workflow: **Vantix iOS**)
4. Push ל-main → הבנייה תעלה IPA ל-TestFlight אוטומטית

### בנייה ידנית (Mac)

```bash
npm run sync
cd ios/App && pod install
npm run ios:xcode
```

ב-Xcode: **Product → Archive** → **Distribute App** → App Store Connect.

או מהטרמינל:

```bash
npm run ios:release
```

---

## Android — Google Play

### פעם ראשונה

1. [Google Play Console](https://play.google.com/console) → Create app → **Vantix**
2. Package name: **com.vantix.app**
3. צור **Upload key** / keystore (שמור את הסיסמה!)
4. העתק `android/keystore.properties.example` → `android/keystore.properties` ומלא נתיב + סיסמאות

### Firebase — Google Sign-In (Android)

אחרי יצירת keystore, הוסף SHA-1 ו-SHA-256 ב-Firebase Console:

- Project **maxdeliveries** → Project settings → Your apps → **com.vantix.app**
- הוסף fingerprint מה-keystore:

```bash
keytool -list -v -keystore path/to/vantix-release.keystore -alias vantix
```

הורד `google-services.json` מעודכן ל-`android/app/`.

### בניית AAB

**Mac / Linux:**

```bash
npm run android:aab
```

**Windows:**

```bash
npm run android:aab:win
```

**Android Studio:** Open → `vantix/android` → **Build → Generate Signed Bundle / APK** → AAB → release.

הקובץ: `android/app/build/outputs/bundle/release/app-release.aab`

### העלאה

Play Console → **Production** (או Internal testing) → **Create new release** → העלה AAB → Release notes → Rollout.

---

## Checklist לפני העלאה ראשונה

- [ ] Bundle ID / package name = `com.vantix.app` בכל מקום
- [ ] `GoogleService-Info.plist` (iOS) עם `BUNDLE_ID` = `com.vantix.app`
- [ ] `google-services.json` (Android) כולל `com.vantix.app` + SHA של release keystore
- [ ] אייקון 1024×1024 ב-`ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- [ ] `android/keystore.properties` מוגדר (לא ב-git)
- [ ] `APP_STORE_APPLE_ID` ב-`codemagic.yaml` מעודכן
- [ ] Privacy Policy URL זמין (נדרש בשתי החנויות)
- [ ] בדיקת Google Sign-In על מכשיר אמיתי (iOS + Android)

---

## פקודות שימושיות

| פקודה | תיאור |
|--------|--------|
| `npm run sync` | build + cap sync ל-iOS ו-Android |
| `npm run bump X.Y.Z` | עדכון גרסה בכל הפלטפורמות |
| `npm run ios:xcode` | פתיחת Xcode |
| `npm run ios:release` | archive + export IPA |
| `npm run android:aab` | בניית AAB חתום (Mac) |
| `npm run deploy:prod` | deploy web + sync native |
