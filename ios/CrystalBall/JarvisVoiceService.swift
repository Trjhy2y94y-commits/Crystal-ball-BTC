import Foundation
import AVFoundation
import Speech
import Combine

struct JarvisMessage: Identifiable {
    enum Role { case user, assistant }
    let id = UUID()
    let role: Role
    let text: String
}

final class JarvisVoiceService: ObservableObject {
    @Published private(set) var status = "Passerelle à configurer"
    @Published private(set) var isConnected = false
    @Published private(set) var messages: [JarvisMessage] = []

    private var socket: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private let session = URLSession(configuration: .default)
    private let audioEngine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var converter: AVAudioConverter?
    private var outputFormat: AVAudioFormat?
    private var wakeEngine: AVAudioEngine?
    private var speechTask: SFSpeechRecognitionTask?
    private var speechRequest: SFSpeechAudioBufferRecognitionRequest?
    private var currentWorkerURL = ""

    func connect(workerURL: String) async {
        guard !isConnected else { return }
        guard let tokenURL = URL(string: workerURL), tokenURL.scheme == "https", tokenURL.path.hasSuffix("/api/mobile-token") else {
            setStatus("Renseigne l’URL HTTPS du Worker /api/mobile-token")
            return
        }
        currentWorkerURL = workerURL
        setStatus("Authentification sécurisée…")
        do {
            var request = URLRequest(url: tokenURL)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("https://trjhy2y94y-commits.github.io", forHTTPHeaderField: "Origin")
            request.httpBody = Data("{}".utf8)
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw NSError(domain: "JARVIS", code: (response as? HTTPURLResponse)?.statusCode ?? -1, userInfo: [NSLocalizedDescriptionKey: "Le Worker a refusé l’accès. Vérifie son déploiement et ses limites."])
            }
            let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
            try await openRealtimeSocket(token: tokenResponse.token)
        } catch {
            setStatus(error.localizedDescription)
        }
    }

    private func openRealtimeSocket(token: String) async throws {
        guard let url = URL(string: "wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1") else { throw URLError(.badURL) }
        let task = session.webSocketTask(with: url, protocols: ["realtime", "openai-insecure-api-key.\\(token)"])
        socket = task
        task.resume()
        try configureAudio()
        isConnected = true
        setStatus("JARVIS connecté · parle naturellement")
        receiveTask = Task { [weak self] in await self?.receiveLoop() }
    }

    private func configureAudio() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try audioSession.setPreferredSampleRate(24000)
        try audioSession.setActive(true)

        let input = audioEngine.inputNode
        let inputFormat = input.outputFormat(forBus: 0)
        guard let target = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24000, channels: 1, interleaved: false),
              let playback = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 24000, channels: 1, interleaved: false) else {
            throw NSError(domain: "JARVIS", code: 2, userInfo: [NSLocalizedDescriptionKey: "Format audio indisponible"])
        }
        converter = AVAudioConverter(from: inputFormat, to: target)
        outputFormat = playback
        audioEngine.attach(player)
        audioEngine.connect(player, to: audioEngine.mainMixerNode, format: playback)
        player.play()

        input.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
            self?.convertAndSend(buffer, target: target)
        }
        audioEngine.prepare()
        try audioEngine.start()
    }

    private func convertAndSend(_ input: AVAudioPCMBuffer, target: AVAudioFormat) {
        guard let converter else { return }
        let ratio = target.sampleRate / input.format.sampleRate
        let capacity = AVAudioFrameCount(Double(input.frameLength) * ratio + 32)
        guard let output = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }
        var conversionError: NSError?
        var supplied = false
        let result = converter.convert(to: output, error: &conversionError) { _, status in
            if supplied { status.pointee = .noDataNow; return nil }
            supplied = true
            status.pointee = .haveData
            return input
        }
        guard result != .error, let samples = output.int16ChannelData?.pointee else { return }
        let data = Data(bytes: samples, count: Int(output.frameLength) * MemoryLayout<Int16>.size)
        let encoded = data.base64EncodedString()
        Task { await sendEvent(["type": "input_audio_buffer.append", "audio": encoded]) }
    }

    private func receiveLoop() async {
        while !Task.isCancelled, let socket {
            do {
                let message = try await socket.receive()
                let text: String
                switch message {
                case .string(let value): text = value
                case .data(let data): text = String(data: data, encoding: .utf8) ?? ""
                @unknown default: continue
                }
                guard let data = text.data(using: .utf8),
                      let event = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { continue }
                handle(event)
            } catch {
                if !Task.isCancelled { setStatus("Connexion interrompue : \\(error.localizedDescription)"); disconnect() }
                break
            }
        }
    }

    private func handle(_ event: [String: Any]) {
        guard let type = event["type"] as? String else { return }
        switch type {
        case "session.created", "session.updated":
            setStatus("JARVIS en ligne · conversation vocale")
        case "conversation.item.input_audio_transcription.completed":
            if let text = event["transcript"] as? String { append(.user, text) }
        case "response.output_audio_transcript.done", "response.output_text.done":
            if let text = (event["transcript"] as? String) ?? (event["text"] as? String) { append(.assistant, text) }
        case "response.output_audio.delta":
            if let chunk = event["delta"] as? String, let data = Data(base64Encoded: chunk) { playPCM(data) }
        case "error":
            let errorObject = event["error"] as? [String: Any]
            setStatus("Erreur JARVIS : \\(errorObject?["message"] as? String ?? "inconnue")")
        default:
            break
        }
    }

    private func playPCM(_ data: Data) {
        guard let format = outputFormat, data.count >= 2 else { return }
        let frames = AVAudioFrameCount(data.count / MemoryLayout<Int16>.size)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames),
              let channel = buffer.floatChannelData?.pointee else { return }
        buffer.frameLength = frames
        data.withUnsafeBytes { raw in
            guard let samples = raw.bindMemory(to: Int16.self).baseAddress else { return }
            for index in 0..<Int(frames) { channel[index] = Float(samples[index]) / 32768.0 }
        }
        player.scheduleBuffer(buffer)
    }

    func sendText(_ text: String) {
        append(.user, text)
        Task {
            await sendEvent([
                "type": "conversation.item.create",
                "item": [
                    "type": "message",
                    "role": "user",
                    "content": [["type": "input_text", "text": text]]
                ]
            ])
            await sendEvent(["type": "response.create"])
        }
    }

    private func sendEvent(_ event: [String: Any]) async {
        guard let socket, let data = try? JSONSerialization.data(withJSONObject: event),
              let text = String(data: data, encoding: .utf8) else { return }
        do { try await socket.send(.string(text)) }
        catch { setStatus("Envoi impossible : \\(error.localizedDescription)") }
    }

    func startWakeWord(workerURL: String) async {
        guard !isConnected else { return }
        currentWorkerURL = workerURL
        let authorization = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        guard authorization == .authorized else {
            setStatus("Autorise la reconnaissance vocale dans Réglages iOS.")
            return
        }
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "fr-FR")), recognizer.isAvailable else {
            setStatus("Reconnaissance vocale française indisponible.")
            return
        }
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: [.duckOthers])
            try audioSession.setActive(true)
            let engine = AVAudioEngine()
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            wakeEngine = engine
            speechRequest = request
            let input = engine.inputNode
            input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in request.append(buffer) }
            engine.prepare()
            try engine.start()
            setStatus("En veille · dis « Salut Jarvis »")
            speechTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                guard let self, let result else { if error != nil { self.setStatus("Écoute vocale interrompue.") }; return }
                let phrase = result.bestTranscription.formattedString.lowercased().folding(options: .diacriticInsensitive, locale: .current)
                if phrase.contains("salut jarvis") || phrase.contains("bonjour jarvis") {
                    self.stopWakeWord()
                    Task { await self.connect(workerURL: workerURL) }
                }
            }
        } catch {
            setStatus("Micro indisponible : \\(error.localizedDescription)")
        }
    }

    private func stopWakeWord() {
        wakeEngine?.inputNode.removeTap(onBus: 0)
        wakeEngine?.stop()
        speechRequest?.endAudio()
        speechTask?.cancel()
        wakeEngine = nil
        speechRequest = nil
        speechTask = nil
    }

    func disconnect() {
        stopWakeWord()
        receiveTask?.cancel()
        receiveTask = nil
        socket?.cancel(with: .normalClosure, reason: nil)
        socket = nil
        if audioEngine.isRunning {
            audioEngine.inputNode.removeTap(onBus: 0)
            audioEngine.stop()
        }
        player.stop()
        audioEngine.detach(player)
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        isConnected = false
        setStatus("JARVIS en veille")
    }

    private func append(_ role: JarvisMessage.Role, _ text: String) {
        DispatchQueue.main.async {
            self.messages.append(JarvisMessage(role: role, text: text))
            if self.messages.count > 40 { self.messages.removeFirst(self.messages.count - 40) }
        }
    }

    private func setStatus(_ value: String) {
        DispatchQueue.main.async { self.status = value }
    }

    private struct TokenResponse: Decodable {
        let token: String
        let expires_at: Int?
    }
}
