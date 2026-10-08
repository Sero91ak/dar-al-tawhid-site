#!/usr/bin/env node
"use strict";
/* Regression checks for native iOS post-notification navigation.
 * Static invariants only. Swift syntax is parsed by the macOS CI job.
 * No push is sent, and no production service is invoked.
 */
const fs = require("node:fs");
const assert = require("node:assert/strict");

const read = p => fs.readFileSync(p, "utf8");
const router = read("ios/DarAlTawhid/DarAlTawhid/DarAppRouter.swift");
const view = read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const app = read("ios/DarAlTawhid/DarAlTawhid/DarAlTawhidApp.swift");
const push = read("ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift");
const source = read("ios/DarAlTawhid/DarAlTawhid/DarAppShell.swift");

const expect = (where, regex, why) => assert.match(where, regex, why);
expect(router, /let isHomeWithArticle = cleanType == "home"[\s\S]*?!isHomeWithArticle/, "Article target overrides a generic home push type");
expect(router, /if !cleanPost\.isEmpty[\s\S]*?apply\(\.home, webURL: target\)/,
       "Payload postId must preserve URL");
expect(router, /if !DarAppShell\.postId\(from: target\)\.isEmpty\s*\{\s*apply\(\.home, webURL: target\)/,
       "URL-only postId must preserve URL");
expect(router, /if webURL == nil[\s\S]*?DarQuickActions\.set\(dest\)[\s\S]*?DarQuickActions\.consume\(\)/,
       "Exact content deep links must remove stale QuickActions");
expect(view, /if let openURL\s*\{\s*[\s\S]*?loadPushURL\(openURL\)\s*\}\s*else if let route = destination/,
       "Generic Home must not run after loading exact content URL");
expect(view, /let isPostRoute = !DarAppShell\.postId\(from: target\)\.isEmpty/,
       "Post route must be distinguished from tab route");
expect(view, /if !isPostRoute,[\s\S]*?navigate\(to: dest, force: true\)/,
       "Fast-path tab navigation must not steal a post route");
expect(view, /current\.fragment != "home"[\s\S]*?window\.location\.hash = '#home'/,
       "Back from a push-opened article should return to Home");
expect(push, /private static var pendingOpen: \[String: String\]\?/,
       "Click must survive a cold start before SwiftUI subscribes");
expect(push, /static func consumePendingOpen\(\)/,
       "Pending click must be consumed once");
expect(app, /\.onAppear[\s\S]*?DarPushNotifications\.consumePendingOpen\(\)/,
       "Cold launch must consume the push click");
expect(app, /\.onReceive\(NotificationCenter\.default\.publisher\(for: \.darOpenPush\)\)[\s\S]*?consumePendingOpen\(\)/,
       "Warm launch must clear buffered click after consuming it");
expect(source, /static func postId\(from url: URL\)/,
       "Post URL parser must remain present");
assert.doesNotMatch(view, /if let openURL\s*\{[^}]*loadPushURL\(openURL\)\s*\}\s*if let route = destination/,
       "A second unconditional navigate must not override post opening");
console.log("Native iOS post deep-link regression markers: PASS (12 checks).");
