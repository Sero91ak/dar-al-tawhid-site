import SwiftUI
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif

@available(iOSApplicationExtension 16.2, *)
struct DarPrayerLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DarPrayerAttributes.self) { context in
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("DAR AL TAWḤID")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color(red: 0.84, green: 0.75, blue: 0.52))
                    Text(context.state.prayerName)
                        .font(.system(size: 20, weight: .semibold, design: .serif))
                    Text("\(context.state.prayerTime)  ·  \(context.state.remaining)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
                    .font(.system(size: 22, weight: .medium, design: .rounded).monospacedDigit())
                    .minimumScaleFactor(0.6)
                    .multilineTextAlignment(.trailing)
            }
            .padding(16)
            .activityBackgroundTint(Color(red: 0.05, green: 0.04, blue: 0.03))
            .activitySystemActionForegroundColor(Color(red: 0.84, green: 0.75, blue: 0.52))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.prayerName)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.prayerTime)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
                        .font(.title2.monospacedDigit())
                }
            } compactLeading: {
                Image(systemName: "moon.stars.fill")
            } compactTrailing: {
                Text(context.state.prayerName)
                    .font(.caption2.weight(.semibold))
            } minimal: {
                Image(systemName: "moon.stars.fill")
            }
        }
    }
}
