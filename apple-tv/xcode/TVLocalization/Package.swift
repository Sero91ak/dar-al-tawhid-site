// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DarAlTawhidTVLocalization",
    platforms: [
        .tvOS(.v16)
    ],
    products: [
        .library(name: "DarAlTawhidTVLocalization", targets: ["DarAlTawhidTVLocalization"])
    ],
    targets: [
        .target(
            name: "DarAlTawhidTVLocalization",
            path: "Sources",
            resources: [
                .copy("ui.json")
            ]
        )
    ]
)
