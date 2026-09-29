#if DEBUG
import SwiftUI
import WidgetKit

struct DarDebugWidgetLabHost<Content: View>: View {
    @State private var showsLab = true
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            content
            Button { showsLab = true } label: {
                Label("Widget Lab", systemImage: "square.grid.2x2")
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule(style: .continuous))
                    .shadow(color: .black.opacity(0.24), radius: 12, y: 5)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.primary)
            .padding(.trailing, 18)
            .padding(.bottom, 28)
        }
        .sheet(isPresented: $showsLab) {
            NavigationStack {
                DarDebugWidgetLab()
                    .navigationTitle("Widget Lab")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Fertig") { showsLab = false }
                        }
                    }
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
    }
}

private enum LabWidget: String, CaseIterable, Identifiable {
    case timer = "Naechstes Gebet"
    case list = "Gebetszeiten"
    case day = "Tagesplan"
    case qibla = "Qibla"
    case today = "Heute"
    case ayah = "Ayah"
    case dua = "Dua"
    case lockDate = "Lock Datum"
    case lockHijri = "Lock Hijri"

    var id: String { rawValue }
}

private enum LabSize: String, CaseIterable, Identifiable {
    case small = "Small"
    case medium = "Medium"
    case large = "Large"
    case lock = "Lock"

    var id: String { rawValue }

    var frame: CGSize {
        switch self {
        case .small: return CGSize(width: 158, height: 158)
        case .medium: return CGSize(width: 329, height: 155)
        case .large: return CGSize(width: 329, height: 345)
        case .lock: return CGSize(width: 280, height: 72)
        }
    }
}

private struct DarDebugWidgetLab: View {
    @State private var widget: LabWidget = .timer
    @State private var size: LabSize = .medium
    @State private var look: DarWidgetLook = .petrol

    private var palette: DarWidgetPalette {
        DarWidgetTheme.palette(for: .debugLab, look: look)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                pickerGrid
                controls
                preview
                Text("Hinweis: Das ist ein In-App-Lab fuer den Simulator. Die echten Home-Screen-Widgets waehlst du im Simulator ueber Home Screen gedrueckt halten > + > DĀR AL TAWḤĪD.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color(uiColor: .secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(18)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onChange(of: widget) { newValue in
            if newValue == .lockDate || newValue == .lockHijri { size = .lock }
        }
    }

    private var pickerGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Widgets auswaehlen")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 145), spacing: 10)], spacing: 10) {
                ForEach(LabWidget.allCases) { item in
                    Button { widget = item } label: {
                        HStack {
                            Text(item.rawValue)
                                .font(.caption.weight(.semibold))
                                .lineLimit(1)
                            Spacer(minLength: 6)
                            if widget == item { Image(systemName: "checkmark.circle.fill") }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(widget == item ? Color.accentColor.opacity(0.16) : Color(uiColor: .secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var controls: some View {
        VStack(spacing: 12) {
            Picker("Format", selection: $size) {
                ForEach(LabSize.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)

            Picker("Farbe", selection: $look) {
                Text("App").tag(DarWidgetLook.app)
                Text("Petrol").tag(DarWidgetLook.petrol)
                Text("Royal").tag(DarWidgetLook.royal)
                Text("Bordeaux").tag(DarWidgetLook.bordeaux)
                Text("Eisgold").tag(DarWidgetLook.eisgold)
                Text("Tinte").tag(DarWidgetLook.tinte)
                Text("Pergament").tag(DarWidgetLook.pergament)
            }
            .pickerStyle(.menu)
        }
        .padding(14)
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var preview: some View {
        let frame = size.frame
        return VStack(spacing: 10) {
            Text("\(widget.rawValue) - \(size.rawValue)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            DarDebugWidgetPreview(widget: widget, size: size, palette: palette)
                .frame(width: frame.width, height: frame.height)
                .clipShape(RoundedRectangle(cornerRadius: size == .lock ? 18 : 28, style: .continuous))
                .shadow(color: .black.opacity(0.22), radius: 18, y: 8)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct DarDebugWidgetPreview: View {
    let widget: LabWidget
    let size: LabSize
    let palette: DarWidgetPalette

    var body: some View {
        ZStack {
            background
            switch widget {
            case .timer: timerBody
            case .list: listBody
            case .day: dayBody
            case .qibla: qiblaBody
            case .today: articleBody(title: "Tagesbeitrag", text: "Ein ruhiger Tagesimpuls fuer Herz, Gebet und Wissen.", source: "Aqida")
            case .ayah: articleBody(title: "Ayah", text: "Allah ist das Licht der Himmel und der Erde.", source: "24:35")
            case .dua: articleBody(title: "Dua des Tages", text: "Unser Herr, gib uns Gutes im Diesseits und Gutes im Jenseits.", source: "2:201")
            case .lockDate: lockBody(top: "So, 13 Sep", bottom: "Maghrib 19:34")
            case .lockHijri: lockBody(top: "20 Rabi al-Awwal 1448", bottom: "Maghrib 19:34")
            }
        }
        .clipped()
    }

    private var compact: Bool { size == .small || size == .lock }
    private var pad: CGFloat { size == .large ? 18 : compact ? 11 : 14 }
    private var brandSize: CGFloat { compact ? 8 : 10 }
    private var textSize: CGFloat { compact ? 11 : 14 }
    private var heroSize: CGFloat { size == .large ? 42 : compact ? 24 : 34 }
    private var rowSize: CGFloat { compact ? 9 : 11 }

    private var background: some View {
        ZStack {
            palette.ink
            LinearGradient(colors: [palette.panel.opacity(0.96), palette.ink.opacity(0.50), .clear], startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(colors: [palette.gold.opacity(0.18), .clear], center: .topLeading, startRadius: 2, endRadius: 118)
            RadialGradient(colors: [palette.panel.opacity(0.42), .clear], center: .bottomTrailing, startRadius: 12, endRadius: 130)
        }
    }

    private var brandLine: some View {
        HStack(spacing: compact ? 7 : 9) {
            ZStack {
                Circle().fill(palette.panel.opacity(0.72))
                Circle().stroke(palette.gold.opacity(0.62), lineWidth: 1)
                Image("BrandMark")
                    .resizable()
                    .scaledToFit()
                    .padding(compact ? 5 : 6)
            }
            .frame(width: compact ? 28 : 34, height: compact ? 28 : 34)
            VStack(alignment: .leading, spacing: 1) {
                Text(DarWidgetTheme.brandName)
                    .font(.system(size: brandSize, weight: .bold, design: .serif))
                    .foregroundStyle(palette.brandInk)
                    .lineLimit(1)
                    .minimumScaleFactor(0.45)
                Text(widget == .qibla ? "Qibla" : "Berlin")
                    .font(.system(size: compact ? 9 : 10, weight: .medium))
                    .foregroundStyle(palette.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
    }

    private var infoPill: some View {
        HStack(spacing: 8) {
            Text("20 Rabi")
            Text("Sonne 06:44")
        }
        .font(.system(size: compact ? 9 : 10, weight: .semibold, design: .rounded))
        .foregroundStyle(palette.cream)
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(palette.panel.opacity(0.54))
        .clipShape(Capsule(style: .continuous))
        .overlay(Capsule(style: .continuous).stroke(palette.line.opacity(0.30), lineWidth: 0.7))
    }

    private var timerBody: some View {
        VStack(alignment: .leading, spacing: compact ? 5 : 7) {
            brandLine
            if size != .small { infoPill }
            Spacer(minLength: 0)
            VStack(spacing: 3) {
                Text("Noch bis Maghrib")
                    .font(.system(size: textSize, weight: .semibold, design: .rounded))
                    .foregroundStyle(palette.muted)
                Text("02:18:41")
                    .font(.system(size: heroSize, weight: .semibold, design: .rounded).monospacedDigit())
                    .foregroundStyle(palette.timeInk)
                    .lineLimit(1)
                    .minimumScaleFactor(0.45)
            }
            .frame(maxWidth: .infinity)
            prayerStrip
        }
        .padding(pad)
    }

    private var listBody: some View {
        VStack(alignment: .leading, spacing: compact ? 4 : 6) {
            brandLine
            if size != .small { infoPill }
            ForEach(rows, id: \.0) { row in
                HStack {
                    Rectangle().fill(row.0 == "Maghrib" ? palette.gold : palette.line.opacity(0.18)).frame(width: 2.5)
                    Text(row.0)
                    Spacer(minLength: 4)
                    Text(row.1).monospacedDigit()
                }
                .font(.system(size: rowSize, weight: row.0 == "Maghrib" ? .bold : .medium, design: .rounded))
                .foregroundStyle(row.0 == "Maghrib" ? palette.timeInk : palette.cream.opacity(0.9))
                .padding(.horizontal, row.0 == "Maghrib" ? 6 : 0)
                .padding(.vertical, row.0 == "Maghrib" ? 3 : 1)
                .background(row.0 == "Maghrib" ? palette.gold.opacity(0.12) : .clear)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(pad)
    }

    private var dayBody: some View {
        VStack(alignment: .leading, spacing: 8) {
            brandLine
            HStack(spacing: 10) {
                Text("20 Rabi al-Awwal 1448")
                    .font(.system(size: textSize, weight: .medium, design: .serif))
                    .foregroundStyle(palette.cream)
                    .padding(9)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(palette.panel.opacity(0.34))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                VStack(spacing: 2) {
                    Text("Maghrib")
                        .font(.system(size: textSize, weight: .semibold, design: .rounded))
                        .foregroundStyle(palette.muted)
                    Text("02:18")
                        .font(.system(size: heroSize - 8, weight: .semibold, design: .rounded).monospacedDigit())
                        .foregroundStyle(palette.timeInk)
                }
                .frame(maxWidth: .infinity)
            }
            prayerStrip
        }
        .padding(pad)
    }

    private var qiblaBody: some View {
        VStack(alignment: .leading, spacing: 8) {
            brandLine
            Spacer(minLength: 0)
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(palette.panel.opacity(0.42))
                    Circle().stroke(palette.gold.opacity(0.36), lineWidth: 1)
                    Image(systemName: "location.north.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(palette.gold)
                }
                .frame(width: 48, height: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text("136 deg")
                        .font(.system(size: compact ? 22 : 28, weight: .semibold, design: .serif))
                        .foregroundStyle(palette.timeInk)
                    Text("Mekka")
                        .font(.system(size: textSize, weight: .medium))
                        .foregroundStyle(palette.cream)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(pad)
    }

    private func articleBody(title: String, text: String, source: String) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            brandLine
            Text(title)
                .font(.system(size: compact ? 14 : 17, weight: .semibold, design: .serif))
                .foregroundStyle(palette.cream)
                .lineLimit(2)
            Text(text)
                .font(.system(size: compact ? 13 : 15, weight: .regular, design: .serif))
                .foregroundStyle(palette.cream.opacity(0.92))
                .lineLimit(compact ? 4 : 5)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(palette.panel.opacity(0.28))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(palette.line.opacity(0.22), lineWidth: 0.7))
            Spacer(minLength: 0)
            Text(source)
                .font(.system(size: 9, weight: .medium, design: .serif))
                .foregroundStyle(palette.muted)
        }
        .padding(pad)
    }

    private func lockBody(top: String, bottom: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(top).font(.system(size: 12, weight: .semibold, design: .serif))
            Text(bottom).font(.system(size: 14, weight: .semibold, design: .rounded).monospacedDigit())
        }
        .foregroundStyle(palette.cream)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding(pad)
    }

    private var prayerStrip: some View {
        HStack(spacing: 0) {
            ForEach(rows.filter { $0.0 != "Shuruq" }, id: \.0) { row in
                VStack(spacing: 3) {
                    Text(row.0)
                    Text(row.1).monospacedDigit()
                }
                .font(.system(size: rowSize, weight: .medium, design: .rounded))
                .foregroundStyle(row.0 == "Maghrib" ? palette.timeInk : palette.cream.opacity(0.82))
                .padding(.vertical, 4)
                .background(row.0 == "Maghrib" ? palette.gold.opacity(0.10) : .clear)
                .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var rows: [(String, String)] {
        [("Fajr", "05:12"), ("Shuruq", "06:44"), ("Dhuhr", "13:08"), ("Asr", "16:28"), ("Maghrib", "19:34"), ("Isha", "21:02")]
    }
}

private extension DarWidgetSnapshot {
    static var debugLab: DarWidgetSnapshot {
        DarWidgetSnapshot(
            themeId: "petrol",
            inkHex: "#061B1B",
            goldHex: "#D9C586",
            textHex: "#F2E9D2",
            mutedHex: "#A9BDB4",
            cityLabel: "Berlin",
            latitude: 52.5200,
            longitude: 13.4050,
            fajrAngle: 12,
            asrFactor: 1,
            hijriLabel: "20 Rabi al-Awwal 1448",
            qiblaDegrees: 136.3,
            prayers: [],
            nextPrayerName: "Maghrib",
            nextPrayerTime: "19:34",
            nextPrayerRemaining: "02:18:41",
            recommendationTitle: "Heute empfohlen",
            recommendationBody: "Ein ruhiger Tagesimpuls fuer Herz, Gebet und Wissen.",
            postTitle: "Tagesbeitrag",
            postSnippet: "Kurzvorschau",
            postCategory: "Aqida",
            postSource: "DAR AL TAWHID",
            ayahGerman: "Allah ist das Licht der Himmel und der Erde.",
            ayahTranslit: "",
            ayahRef: "24:35",
            duaTitle: "Dua des Tages",
            duaGerman: "Unser Herr, gib uns Gutes im Diesseits und Gutes im Jenseits.",
            duaTranslit: "",
            duaCategory: "Quran",
            duaSource: "2:201",
            updatedAt: Date()
        )
    }
}
#endif
