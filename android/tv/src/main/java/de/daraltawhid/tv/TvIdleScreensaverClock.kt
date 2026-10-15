package de.daraltawhid.tv

/**
 * Pure state machine adapted from the owner's original tvOS
 * IdleScreensaverController.swift:
 * - global 60-second idle threshold
 * - exclude Adhan, Quran playback, dialogs and offscreen windows
 * - consume first user input to wake, without activating a hidden button
 * - use monotonic elapsed-time, never wall-clock changes
 */
internal class TvIdleScreensaverClock(private val idleMillis: Long = 60_000L) {
    var visible: Boolean = false
        private set
    private var lastInteractionMillis = 0L
    private var active = false
    private var enabled = true
    private var suppressed = false

    fun start(nowMillis: Long, enabled: Boolean = true) {
        this.active = true
        this.enabled = enabled
        lastInteractionMillis = nowMillis
        visible = false
    }

    fun stop() {
        active = false
        visible = false
    }

    fun updateSuppression(value: Boolean, nowMillis: Long) {
        if (suppressed != value) {
            suppressed = value
            lastInteractionMillis = nowMillis
            if (suppressed) visible = false
        }
    }

    fun onInput(nowMillis: Long): Boolean {
        if (!active) return false
        val consumed = visible
        visible = false
        lastInteractionMillis = nowMillis
        return consumed
    }

    fun tick(nowMillis: Long): Boolean {
        if (!active || !enabled || suppressed || visible) return false
        if (nowMillis - lastInteractionMillis >= idleMillis) {
            visible = true
            return true
        }
        return false
    }
}
