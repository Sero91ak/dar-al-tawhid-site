#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const get=p=>fs.readFileSync(path.join(root,p),"utf8");
const view=get("ios/DarAlTawhidKids/DarAlTawhidKids/KidsNativeIntro.swift");
const shell=get("ios/DarAlTawhidKids/DarAlTawhidKids/KidsAppShell.swift");
const web=get("ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift");
const pbx=get("ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj/project.pbxproj");
const home=get("kids/start.html");
const academy=get("kids/akademie/index.html");
const tests=[
["native test panel compile-gated",view.includes("#if KIDS_CREATOR_TEST")&&view.includes("KidsCreatorPanel")],
["visitor root remains direct WKWebView",view.includes("#else\n    var body: some View {\n        KidsWebAppView()")],
["test button not a website password or query unlock",!view.includes("password")&&!view.includes("creatorSandbox=")&&!view.includes("localStorage")],
["creator menu requires explicit user tap",view.includes("showCreatorPanel = true")&&view.includes(".sheet(isPresented: $showCreatorPanel)")],
["six visible module links",["home","quran","stories","dua","parents","academy","console"].every(id=>view.includes('"'+id+'"'))],
["all module selectors backend-whitelisted",web.includes('["home", "quran", "stories", "dua", "parents", "academy", "console", "quiz-v4"].contains(key)')],
["owner notification exists only in compiled test",web.includes("#if KIDS_CREATOR_TEST\n            NotificationCenter.default.addObserver(")],
["home tab exists in live shell",home.includes('data-target="today"')],
["stories tab exists",home.includes('data-target="stories"')],
["Quran learning tab retired from live shell",!home.includes('data-target="quran"')],
["parents tab exists",home.includes('data-target="parents"')],
["dua button exists",home.includes('id="openDuaButton"')],
["Academy content exists",academy.includes("akademie")||academy.includes("Akademie")],
["test host separate from visitor",shell.includes("dar-al-tawhid-kids-creator.sero91ak.workers.dev")&&shell.includes("https://dar-al-tawhid.de/kids/start")],
["test app has independent bundle ID",pbx.includes("PRODUCT_BUNDLE_IDENTIFIER = de.daraltawhid.kids.creator;")],
["visitor bundle unchanged",pbx.includes("PRODUCT_BUNDLE_IDENTIFIER = de.daraltawhid.kids;")],
["native V4 test button is Creator-only",view.includes('button("Quiz · echte V4-Fuṣḥā-Hörvorschau"')&&
  view.indexOf('button("Quiz · echte V4-Fuṣḥā-Hörvorschau"')>view.indexOf("#if KIDS_CREATOR_TEST")],
["native V4 real MP3 host is explicitly test-only",shell.includes('v4AuditionHost = "dar-al-tawhid-test.sero91ak.workers.dev"')&&
  shell.includes('static let v4AuditionURL = URL(string: "https://dar-al-tawhid-test.sero91ak.workers.dev/kids/start")!')],
["V4 preview inside native test app, never changing visitor app",web.includes('if key == "quiz-v4"')&&
  web.includes('url: KidsAppShell.v4AuditionURL')&&web.includes('pendingCreatorTab = "quiz-v4"')],
["host-remap preserves dedicated V4 preview",shell.includes('if incoming.host?.lowercased() == v4AuditionHost { return incoming }')],
["visitor native official marker remains",web.includes('let officialMarker = "window.DAR_OFFICIAL_IOS_APP=true;"')],
["creator native official marker absent",web.includes('let officialMarker = ""')],
["synchronous native test routes only on test host",web.includes('page.url?.host?.lowercased() == "dar-al-tawhid-kids-creator.sero91ak.workers.dev"')],
["creator maps production kids urls to test host",web.includes("if !KidsAppShell.isOwnHost(url)")&&web.includes("KidsAppShell.inAppURL(from: url)")],
["no website based unlock path in code",!web.includes("ACADEMY_OWNER_PASSWORD")&&!view.includes("ACADEMY_OWNER_PASSWORD")],
["creator console opens only on dedicated Worker",web.includes("dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/test-console/index.html")],
["creator panel never writes a child record",!view.includes("UserDefaults.standard")&&!view.includes("localStorage.setItem")]
];
for(const [name,pass] of tests)assert.ok(pass,name);
console.log("KIDS TEST NATIVE V2 PASS: "+tests.length+" UI / host-isolation / unchanged visitor checks; real macOS xcodebuild still required.");
