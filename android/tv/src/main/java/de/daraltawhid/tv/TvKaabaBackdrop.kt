package de.daraltawhid.tv

import android.app.Activity
import android.app.AlertDialog
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView

/**
 * Native tvOS Kaaba background surface. Uses source-identical names mapped in
 * TvKaabaBackgroundChoice, and a static Android-night fallback if the artwork
 * package is not yet present in this development checkout.
 *
 * The still image is user-selected independently of the automatic weather
 * scene. TVSceneManager.swift changes its still image only in the picker.
 */
internal class TvKaabaBackdrop(
    private val activity: Activity,
    private val root: FrameLayout
) {
    private val layer = ImageView(activity).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        isFocusable = false
        alpha = 0f
    }
    private val readabilityShade = View(activity).apply {
        isFocusable = false
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    private var activeDrawable = 0

    private val preferences = activity.getPreferences(Activity.MODE_PRIVATE)

    init {
        // This fallback is part of the prior native Android app and remains
        // visible until original tvOS bitmaps are installed in drawable-nodpi.
        root.setBackgroundResource(R.drawable.tv_static_backdrop)
        val size = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        root.addView(layer, size)
        root.addView(readabilityShade, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
        readabilityShade.visibility = View.GONE
    }

    fun availableCount() =
        TvKaabaBackgroundChoice.entries.count { drawableId(it.drawable) != 0 }

    fun restore(): TvKaabaBackgroundChoice =
        TvKaabaBackgroundChoice.restore(
            preferences.getString("dar.tv.kaaba-scene.background", null)
        )

    fun showPicker(onApplied: (() -> Unit)? = null) {
        val installed = TvKaabaBackgroundChoice.entries.filter {
            drawableId(it.drawable) != 0
        }
        if (installed.isEmpty()) return // no dead picker on a staged APK
        val current = restore()
        val selected = installed.indexOf(current).coerceAtLeast(0)
        AlertDialog.Builder(activity)
            .setTitle("Kaaba-Szene · Hintergrund auswählen")
            .setSingleChoiceItems(
                installed.map { it.title }.toTypedArray(), selected
            ) { _, idx ->
                val chosen = installed[idx]
                preferences.edit().putString(
                    "dar.tv.kaaba-scene.background", chosen.key
                ).apply()
                show(chosen)
                onApplied?.invoke()
                // Original tvOS picker stays open until Menu/Back is pressed;
                // Android single-choice dialog likewise does not dismiss.
            }
            .setNegativeButton("Schließen", null)
            .show()
    }

    fun show(choice: TvKaabaBackgroundChoice = restore()): Boolean {
        val id = drawableId(choice.drawable)
        if (id == 0) {
            layer.animate().cancel()
            layer.alpha = 0f
            activeDrawable = 0
            readabilityShade.visibility = View.GONE
            return false
        }
        shade(choice.readabilityMode)
        if (id == activeDrawable) return true
        layer.animate().cancel()
        if (activeDrawable == 0) {
            layer.setImageResource(id)
            activeDrawable = id
            layer.animate().alpha(1f).setDuration(800).start()
        } else {
            // One bitmap decoded at a time: avoids two simultaneous 4K
            // textures on memory-constrained Google/Android TV hardware.
            layer.animate().alpha(0.1f).setDuration(360).withEndAction {
                layer.setImageResource(id)
                activeDrawable = id
                layer.animate().alpha(1f).setDuration(440).start()
            }.start()
        }
        return true
    }

    @Suppress("DEPRECATION")
    private fun drawableId(name: String): Int =
        activity.resources.getIdentifier(name, "drawable", activity.packageName)

    private fun shade(readabilityMode: Boolean) {
        if (!readabilityMode) {
            readabilityShade.visibility = View.GONE
            return
        }
        // tvOS uses a blurred radial readability vignette centered toward
        // the left. Use a lightweight left-to-right scrim as Android TV's
        // GPU-safe analogue; weather imagery itself is not recolored.
        readabilityShade.background = GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            intArrayOf(
                Color.argb(178, 0, 0, 0),
                Color.argb(112, 0, 0, 0),
                Color.argb(25, 0, 0, 0)
            )
        )
        readabilityShade.visibility = View.VISIBLE
    }
}
