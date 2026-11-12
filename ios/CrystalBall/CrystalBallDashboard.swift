import SwiftUI
import WebKit
import Combine

@MainActor
final class MarketContextStore: ObservableObject {
    @Published var snapshot = "Le tableau de bord n’a pas encore transmis de données de marché."
}

struct CrystalBallDashboard: UIViewRepresentable {
    @EnvironmentObject private var marketContext: MarketContextStore

    func makeCoordinator() -> Coordinator {
        Coordinator(marketContext: marketContext)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.015, green: 0.035, blue: 0.075, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        context.coordinator.startPolling(view)
        view.load(URLRequest(url: URL(string: "https://trjhy2y94y-commits.github.io/Crystal-ball-BTC/")!))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        coordinator.stopPolling()
    }

    final class Coordinator: NSObject {
        private let marketContext: MarketContextStore
        private weak var webView: WKWebView?
        private var timer: Timer?

        init(marketContext: MarketContextStore) {
            self.marketContext = marketContext
        }

        func startPolling(_ webView: WKWebView) {
            self.webView = webView
            timer?.invalidate()
            timer = Timer.scheduledTimer(withTimeInterval: 8, repeats: true) { [weak self] _ in
                self?.readMarketSnapshot()
            }
            readMarketSnapshot()
        }

        func stopPolling() {
            timer?.invalidate()
            timer = nil
            webView = nil
        }

        private func readMarketSnapshot() {
            let script = """
            (() => {
              const value = id => document.getElementById(id)?.innerText?.trim() || "";
              return JSON.stringify({
                price: value("homeQtPrice") || value("px") || "indisponible",
                regime: value("homeQtBias") || value("badge") || "non déterminé",
                rsi: value("homeQtRSI") || "indisponible",
                waveTrend: value("homeQtWT") || value("wtNow") || "indisponible",
                scenarios: value("probabilityPanel").slice(0, 900),
                radar: document.querySelector(".ck-dynamic-radar")?.innerText?.trim().slice(0, 700) || ""
              });
            })()
            """
            webView?.evaluateJavaScript(script) { [weak self] result, _ in
                guard let self, let snapshot = result as? String, !snapshot.isEmpty else { return }
                Task { @MainActor in self.marketContext.snapshot = snapshot }
            }
        }
    }
}
