# Crystal Ball — iOS native

Prototype SwiftUI natif destiné à remplacer progressivement l'enveloppe PWA sur iPhone.

## Architecture
- SwiftUI pour l'interface native, avec deux onglets JARVIS et Crystal Ball. Le tableau de bord Crystal Ball existant est intégré dans WKWebView ; un pont lit périodiquement prix, régime, RSI, WaveTrend, scénarios et radar pour fournir à JARVIS un contexte de marché récent.
- AVAudioEngine pour le microphone et la lecture audio.
- Speech framework pour détecter « Salut Jarvis » au premier plan.
- Realtime WebSocket avec un jeton éphémère créé côté Worker Cloudflare et transmis au socket via l'en-tête Bearer natif.
- Aucun secret OpenAI dans l'application.
- App Intent « Parler à Jarvis » pour ouvrir l'app via Siri.

## Configuration
1. Déployer le Worker avec les bindings existants et le nouvel endpoint `POST /api/mobile-token`.
2. Dans l'app, renseigner l'URL HTTPS complète du Worker terminant par `/api/mobile-token`.
3. Ouvrir l'app, autoriser le microphone et la reconnaissance vocale.
4. Tester « Salut Jarvis » puis parler naturellement.

## Limites iOS
Le mot-clé personnalisé fonctionne lorsque l'app est ouverte au premier plan. iOS ne permet pas à une app tierce de garantir une écoute permanente écran verrouillé / en arrière-plan. Le raccourci Siri « Parler à Jarvis » ouvre l'app à la voix, puis l'utilisateur peut démarrer le dialogue.

## Build local
Installer Xcode et XcodeGen, puis :
```sh
cd ios
xcodegen generate
xcodebuild -project CrystalBall.xcodeproj -scheme CrystalBall -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```
