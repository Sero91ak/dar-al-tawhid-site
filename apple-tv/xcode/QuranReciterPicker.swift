import SwiftUI

/// Compact tvOS control for the existing Qurʾān-player header.
/// Place this where the current reciter control is shown.
struct QuranReciterPickerButton: View {
    @ObservedObject var store: QuranReciterSelectionStore
    @State private var isPresented = false

    var body: some View {
        Button {
            isPresented = true
        } label: {
            HStack(spacing: 14) {
                Image(systemName: "waveform")
                    .font(.title3)

                VStack(alignment: .leading, spacing: 3) {
                    Text("REZITATOR")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)

                    Text(currentTitle)
                        .font(.headline)
                        .lineLimit(1)
                }

                Spacer(minLength: 8)

                if store.isLoading {
                    ProgressView()
                } else {
                    Image(systemName: "chevron.down")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(minWidth: 320, maxWidth: 520, alignment: .leading)
            .contentShape(Rectangle())
        }
        .accessibilityLabel("Qurʾān-Rezitator auswählen")
        .accessibilityValue(currentTitle)
        .sheet(isPresented: $isPresented) {
            QuranReciterPickerSheet(store: store)
        }
        .task {
            if !store.loadFinished {
                await store.load()
            }
        }
    }

    private var currentTitle: String {
        store.selectedReciter?.displayName ?? "Rezitator auswählen"
    }
}

private struct QuranReciterPickerSheet: View {
    @ObservedObject var store: QuranReciterSelectionStore
    @Environment(\.dismiss) private var dismiss

    private let columns = [
        GridItem(.flexible(), spacing: 26),
        GridItem(.flexible(), spacing: 26)
    ]

    var body: some View {
        NavigationStack {
            Group {
                if store.isLoading && store.reciters.isEmpty {
                    VStack(spacing: 22) {
                        ProgressView()
                            .controlSize(.large)
                        Text("Rezitatoren werden geladen …")
                            .foregroundStyle(.secondary)
                    }
                } else if store.reciters.isEmpty {
                    ContentUnavailableView(
                        "Keine Rezitatoren verfügbar",
                        systemImage: "waveform.slash",
                        description: Text("Die Rezitatoren konnten momentan nicht geladen werden.")
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 26) {
                            ForEach(store.reciters) { reciter in
                                reciterButton(reciter)
                            }
                        }
                        .padding(.horizontal, 70)
                        .padding(.vertical, 44)
                    }
                }
            }
            .navigationTitle("Qurʾān-Rezitator")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Schließen") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            if !store.loadFinished {
                await store.load()
            }
        }
    }

    @ViewBuilder
    private func reciterButton(_ reciter: QuranReciterEdition) -> some View {
        let isSelected = reciter.identifier == store.selectedIdentifier

        Button {
            store.select(reciter)
            dismiss()
        } label: {
            HStack(spacing: 18) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "waveform.circle")
                    .font(.title2)

                VStack(alignment: .leading, spacing: 6) {
                    Text(reciter.displayName)
                        .font(.headline)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        Text(reciter.styleName)
                        Text("•")
                        Text(reciter.identifier)
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                Spacer(minLength: 10)
            }
            .frame(maxWidth: .infinity, minHeight: 94, alignment: .leading)
            .padding(.horizontal, 22)
            .contentShape(Rectangle())
        }
        .buttonStyle(.bordered)
        .accessibilityLabel("\(reciter.displayName), \(reciter.styleName)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

#if DEBUG
#Preview {
    QuranReciterPickerButton(store: QuranReciterSelectionStore())
        .padding(80)
}
#endif
