import SwiftUI

struct ContentView: View {
    @StateObject private var jarvis = JarvisVoiceService()
    @EnvironmentObject private var marketContext: MarketContextStore
    @AppStorage("jarvis.workerURL") private var workerURL = ""
    @State private var draft = ""
    @State private var showSettings = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.015, green: 0.035, blue: 0.075), Color(red: 0.025, green: 0.09, blue: 0.15), .black], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(spacing: 18) {
                header
                orb
                status
                conversation
                composer
                footer
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 10)
        }
        .sheet(isPresented: $showSettings) {
            settings
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .onChange(of: marketContext.snapshot) { _, snapshot in
            jarvis.updateMarketContext(snapshot)
        }
        .onAppear {
            if UserDefaults.standard.bool(forKey: "jarvis.startVoiceOnLaunch") {
                UserDefaults.standard.set(false, forKey: "jarvis.startVoiceOnLaunch")
                Task { await jarvis.startWakeWord(workerURL: workerURL) }
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text("CRYSTAL BALL").font(.system(size: 11, weight: .bold, design: .monospaced)).tracking(3).foregroundStyle(.cyan)
                Text("J.A.R.V.I.S.").font(.system(size: 25, weight: .semibold, design: .rounded)).tracking(2).foregroundStyle(.white)
            }
            Spacer()
            Button { showSettings = true } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(.white.opacity(0.85))
                    .frame(width: 44, height: 44)
                    .background(.white.opacity(0.07), in: Circle())
            }
            .accessibilityLabel("Réglages")
        }
    }

    private var orb: some View {
        ZStack {
            Circle().fill(Color.cyan.opacity(jarvis.isConnected ? 0.16 : 0.08)).frame(width: 210, height: 210).blur(radius: 22)
            Circle().stroke(LinearGradient(colors: [.cyan.opacity(0.8), .blue.opacity(0.18), .cyan.opacity(0.65)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.4).frame(width: 174, height: 174)
            Circle().stroke(.cyan.opacity(0.13), lineWidth: 1).frame(width: 198, height: 198)
            Circle().fill(RadialGradient(colors: [Color.cyan.opacity(0.32), Color.blue.opacity(0.12), .black.opacity(0.8)], center: .center, startRadius: 2, endRadius: 86)).frame(width: 158, height: 158)
            Image(systemName: jarvis.isConnected ? "waveform" : "sparkle").font(.system(size: 48, weight: .ultraLight)).foregroundStyle(.cyan).shadow(color: .cyan.opacity(0.8), radius: 18)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 2)
        .accessibilityLabel("Noyau vocal JARVIS")
    }

    private var status: some View {
        VStack(spacing: 5) {
            Text(jarvis.status.uppercased())
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .tracking(1.5)
                .foregroundStyle(jarvis.isConnected ? .green : .cyan)
                .multilineTextAlignment(.center)
            Text("Assistant conversationnel • Analyse Crystal Ball")
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .foregroundStyle(.white.opacity(0.48))
        }
    }

    private var conversation: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    if jarvis.messages.isEmpty {
                        Text("Bonjour. Je suis JARVIS. Active le mot-clé vocal ou lance une conversation pour commencer.")
                            .font(.system(size: 15, weight: .regular, design: .rounded))
                            .foregroundStyle(.white.opacity(0.68))
                            .padding(15)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 16))
                    }
                    ForEach(jarvis.messages) { message in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(message.role == .assistant ? "JARVIS" : "VOUS")
                                .font(.system(size: 9, weight: .bold, design: .monospaced))
                                .tracking(1.5)
                                .foregroundStyle(message.role == .assistant ? .cyan : .white.opacity(0.4))
                            Text(message.text)
                                .font(.system(size: 14, weight: .regular, design: .rounded))
                                .foregroundStyle(.white.opacity(0.9))
                                .textSelection(.enabled)
                        }
                        .padding(13)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(message.role == .assistant ? Color.cyan.opacity(0.075) : Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 14))
                        .id(message.id)
                    }
                }
                .padding(.vertical, 4)
            }
            .onChange(of: jarvis.messages.count) { _, _ in
                if let last = jarvis.messages.last { withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo(last.id, anchor: .bottom) } }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var composer: some View {
        HStack(spacing: 9) {
            TextField("Écris à JARVIS…", text: $draft, axis: .vertical)
                .lineLimit(1...3)
                .focused($inputFocused)
                .padding(.horizontal, 13)
                .padding(.vertical, 11)
                .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
                .foregroundStyle(.white)
                .onSubmit(sendText)
            Button(action: sendText) {
                Image(systemName: "arrow.up").font(.system(size: 15, weight: .bold)).foregroundStyle(.black).frame(width: 42, height: 42).background(.cyan, in: Circle())
            }
            .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !jarvis.isConnected)
        }
    }

    private var footer: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                Button {
                    if jarvis.isConnected { jarvis.disconnect() }
                    else { jarvis.updateMarketContext(marketContext.snapshot); Task { await jarvis.connect(workerURL: workerURL) } }
                } label: {
                    Label(jarvis.isConnected ? "Terminer" : "Parler", systemImage: jarvis.isConnected ? "stop.fill" : "mic.fill")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(jarvis.isConnected ? Color.red.opacity(0.18) : Color.cyan, in: RoundedRectangle(cornerRadius: 15))
                        .foregroundStyle(jarvis.isConnected ? .red : .black)
                }
                Button {
                    jarvis.updateMarketContext(marketContext.snapshot)
                    Task { await jarvis.startWakeWord(workerURL: workerURL) }
                } label: {
                    Label("Salut Jarvis", systemImage: "waveform.badge.mic")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(.white.opacity(0.075), in: RoundedRectangle(cornerRadius: 15))
                        .foregroundStyle(.white)
                }
                .disabled(jarvis.isConnected)
            }
            Text("Le mot-clé fonctionne lorsque l’app est ouverte. Siri peut ouvrir JARVIS par commande vocale.")
                .font(.system(size: 10, weight: .regular, design: .rounded))
                .foregroundStyle(.white.opacity(0.4))
                .multilineTextAlignment(.center)
        }
    }

    private var settings: some View {
        NavigationStack {
            Form {
                Section("Passerelle sécurisée") {
                    TextField("https://…workers.dev/api/mobile-token", text: $workerURL)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                    Text("Adresse du Worker Cloudflare. La clé OpenAI reste côté serveur et n’est jamais stockée dans l’application.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Section {
                    Text("L’écoute continue du mot-clé en arrière-plan ou écran verrouillé n’est pas garantie par iOS. Utilise le raccourci Siri « Parler à Jarvis » pour ouvrir l’application à la voix.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Réglages JARVIS")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("OK") { showSettings = false } } }
        }
    }

    private func sendText() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        inputFocused = false
        jarvis.sendText(text)
    }
}
