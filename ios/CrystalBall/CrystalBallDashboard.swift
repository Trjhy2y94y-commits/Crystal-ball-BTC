import SwiftUI
import WebKit

struct CrystalBallDashboard: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.015, green: 0.035, blue: 0.075, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        view.load(URLRequest(url: URL(string: "https://trjhy2y94y-commits.github.io/Crystal-ball-BTC/")!))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
