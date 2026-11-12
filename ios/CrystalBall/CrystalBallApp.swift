import SwiftUI
import AppIntents

@main
struct CrystalBallApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}

struct LaunchJarvisIntent: AppIntent {
    static var title: LocalizedStringResource = "Parler à Jarvis"
    static var description = IntentDescription("Ouvre Crystal Ball et prépare JARVIS à t’écouter.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(true, forKey: "jarvis.startVoiceOnLaunch")
        return .result()
    }
}

struct JarvisShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LaunchJarvisIntent(),
            phrases: ["Parler à Jarvis dans \\(.applicationName)", "Ouvre Jarvis dans \\(.applicationName)"],
            shortTitle: "Parler à Jarvis",
            systemImageName: "waveform"
        )
    }
}
