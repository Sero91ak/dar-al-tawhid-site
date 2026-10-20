import ActivityKit
import SwiftUI
import WidgetKit

struct DarPrayerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let prayerName: String
        let prayerTime: String
        let remaining: String
        let themeId: String
        let endsAt: Date
        let city: String
    }

    let city: String
}

private enum DATLivePalette {
    static let background = Color(red: 0.055, green: 0.052, blue: 0.045)
    static let cream = Color(red: 0.97, green: 0.93, blue: 0.83)
    static let gold = Color(red: 0.82, green: 0.68, blue: 0.42)
    static let muted = Color(red: 0.72, green: 0.67, blue: 0.56)
}

private struct DATLivePrayerView: View {
    let state: DarPrayerAttributes.ContentState

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("NÄCHSTES GEBET")
                    .font(.system(size: 9, weight: .bold, design: .serif))
                    .tracking(1.1)
                    .foregroundStyle(DATLivePalette.muted)
                Text(state.prayerName)
                    .font(.system(size: 22, weight: .semibold, design: .serif))
                    .foregroundStyle(DATLivePalette.gold)
                    .lineLimit(1)
                Text(state.prayerTime)
                    .font(.system(size: 21, weight: .medium, design: .serif))
                    .monospacedDigit()
                    .foregroundStyle(DATLivePalette.cream)
            }
            Spacer(minLength: 5)
            VStack(alignment: .trailing, spacing: 3) {
                Text("NOCH")
                    .font(.system(size: 9, weight: .bold, design: .serif))
                    .tracking(1.1)
                    .foregroundStyle(DATLivePalette.muted)
                Text(timerInterval: Date()...state.endsAt, countsDown: true)
                    .font(.system(size: 20, weight: .medium, design: .serif))
                    .monospacedDigit()
                    .foregroundStyle(DATLivePalette.cream)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(DATLivePalette.background)
    }
}

struct DATPrayerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DarPrayerAttributes.self) { context in
            DATLivePrayerView(state: context.state)
                .activityBackgroundTint(DATLivePalette.background)
                .activitySystemActionForegroundColor(DATLivePalette.cream)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("NÄCHSTES GEBET")
                            .font(.system(size: 9, weight: .bold, design: .serif))
                            .tracking(0.8)
                            .foregroundStyle(DATLivePalette.muted)
                        Text(context.state.prayerName)
                            .font(.system(size: 21, weight: .semibold, design: .serif))
                            .foregroundStyle(DATLivePalette.gold)
                            .lineLimit(1)
                        Text(context.state.prayerTime)
                            .font(.system(size: 18, weight: .medium, design: .serif))
                            .monospacedDigit()
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("NOCH")
                            .font(.system(size: 9, weight: .bold, design: .serif))
                            .tracking(0.8)
                            .foregroundStyle(DATLivePalette.muted)
                        Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
                            .font(.system(size: 19, weight: .medium, design: .serif))
                            .monospacedDigit()
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.city)
                        .font(.system(size: 11, weight: .medium, design: .serif))
                        .foregroundStyle(DATLivePalette.muted)
                }
            } compactLeading: {
                Text(context.state.prayerName)
                    .font(.system(size: 11, weight: .semibold, design: .serif))
                    .foregroundStyle(DATLivePalette.gold)
            } compactTrailing: {
                Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
                    .font(.system(size: 11, weight: .medium, design: .serif))
                    .monospacedDigit()
            } minimal: {
                Text(context.state.prayerName.prefix(1))
                    .font(.system(size: 12, weight: .semibold, design: .serif))
                    .foregroundStyle(DATLivePalette.gold)
            }
            .widgetURL(URL(string: "daraltawhid://prayer"))
            .keylineTint(DATLivePalette.gold)
        }
    }
}
