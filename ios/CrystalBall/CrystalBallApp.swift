import SwiftUI
import AppIntents

@main
struct CrystalBallApp: App {
    @StateObject private var marketContext = MarketContextStore()

    var body: some Scene {
        WindowGroup {
            TabView {
                ContentView()
                    .tabItem { Label("JARVIS", systemImage: "waveform") }
                CrystalBallDashboard()
                    .tabItem { Label("Crystal Ball", systemImage: "chart.xyaxis.line") }
            }
            .environmentObject(marketContext)
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
            phrases: ["Parler à Jarvis dans \(.applicationName)", "Ouvre Jarvis dans \(.applicationName)"],
            shortTitle: "Parler à Jarvis",
            systemImageName: "waveform"
        )
    }
}
