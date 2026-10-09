#!/usr/bin/env python3
"""Dependency-free tests: ranking does not masquerade as real camera calibration."""
import unittest
from three_quarter_camera_diagnostic import ANGLE_GRID, best_fit_diagnostic


class CameraDiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            dict(angle_deg=15, whole_body_iou_worst=.84, head_region_iou_worst=.76),
            dict(angle_deg=20, whole_body_iou_worst=.86, head_region_iou_worst=.71),
            dict(angle_deg=45, whole_body_iou_worst=.83, head_region_iou_worst=.80),
        ]

    def test_fixed_grid_contains_nominal_45(self):
        self.assertIn(45, ANGLE_GRID)

    def test_best_body_angle_different_from_head(self):
        self.assertEqual(best_fit_diagnostic(self.rows, 'whole_body_iou_worst')['angle_deg'], 20)
        self.assertEqual(best_fit_diagnostic(self.rows, 'head_region_iou_worst')['angle_deg'], 45)

    def test_lower_angle_tie_break_is_reproducible(self):
        rows = [dict(angle_deg=a, whole_body_iou_worst=.5, head_region_iou_worst=.5) for a in (45, 20, 15)]
        self.assertEqual(best_fit_diagnostic(rows, 'whole_body_iou_worst')['angle_deg'], 15)

    def test_nan_fails_closed(self):
        self.rows[0]['head_region_iou_worst'] = float('nan')
        with self.assertRaises(ValueError):
            best_fit_diagnostic(self.rows, 'whole_body_iou_worst')

    def test_invalid_angles_fail_closed(self):
        self.rows[0]['angle_deg'] = 180
        with self.assertRaises(ValueError):
            best_fit_diagnostic(self.rows, 'whole_body_iou_worst')

    def test_invalid_metric_fails_closed(self):
        with self.assertRaises(ValueError):
            best_fit_diagnostic(self.rows, 'production_approval')

    def test_empty_scores_fail_closed(self):
        with self.assertRaises(ValueError):
            best_fit_diagnostic([], 'whole_body_iou_worst')


if __name__ == '__main__':
    unittest.main(verbosity=2)
