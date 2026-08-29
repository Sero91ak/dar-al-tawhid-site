import UIKit

final class DarNativeTabBar: UIView {
    var onSelect: ((String) -> Void)?

    private let stack = UIStackView()
    private var buttons: [UIButton] = []
    private let items: [(id: String, title: String, symbol: String)] = [
        ("home", "Start", "house.fill"),
        ("quiz", "Quiz", "brain"),
        ("feed", "Feed", "sparkles"),
        ("quran", "Qurʾān", "book.fill"),
        ("more", "Mehr", "line.3.horizontal")
    ]

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 0.06, green: 0.07, blue: 0.05, alpha: 0.96)
        layer.borderColor = UIColor(red: 0.83, green: 0.71, blue: 0.43, alpha: 0.28).cgColor
        layer.borderWidth = 1
        layer.cornerRadius = 22
        clipsToBounds = true

        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.alignment = .fill
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6)
        ])

        for (index, item) in items.enumerated() {
            var config = UIButton.Configuration.plain()
            config.image = UIImage(systemName: item.symbol)
            config.title = item.title
            config.imagePlacement = .top
            config.imagePadding = 4
            config.baseForegroundColor = UIColor(red: 0.96, green: 0.93, blue: 0.82, alpha: 0.78)
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                var out = incoming
                out.font = UIFont.systemFont(ofSize: 10, weight: .semibold)
                return out
            }
            let button = UIButton(configuration: config)
            button.tag = index
            button.addTarget(self, action: #selector(tap(_:)), for: .touchUpInside)
            buttons.append(button)
            stack.addArrangedSubview(button)
        }
        select(id: "home")
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func applySurface(_ color: UIColor) {
        var white: CGFloat = 0
        color.getWhite(&white, alpha: nil)
        let light = white > 0.62
        if light {
            backgroundColor = color.withAlphaComponent(1)
            layer.borderWidth = 0
            layer.borderColor = UIColor.clear.cgColor
            layer.cornerRadius = 0
        } else {
            layer.borderWidth = 1
            layer.cornerRadius = 22
            backgroundColor = UIColor(red: 0.06, green: 0.07, blue: 0.05, alpha: 0.96)
            layer.borderColor = UIColor(red: 0.83, green: 0.71, blue: 0.43, alpha: 0.28).cgColor
        }
        chromeIsLight = light
        select(id: lastSelectedId)
    }

    private var chromeIsLight = false
    private var lastSelectedId = "home"

    func select(id: String) {
        lastSelectedId = id
        for (index, item) in items.enumerated() {
            let active = item.id == id
            if chromeIsLight {
                buttons[index].configuration?.baseForegroundColor = active
                    ? UIColor(red: 0.07, green: 0.09, blue: 0.15, alpha: 1)
                    : UIColor(red: 0.22, green: 0.26, blue: 0.32, alpha: 1)
            } else {
                buttons[index].configuration?.baseForegroundColor = active
                    ? UIColor(red: 0.92, green: 0.78, blue: 0.42, alpha: 1)
                    : UIColor(red: 0.96, green: 0.93, blue: 0.82, alpha: 0.78)
            }
        }
    }

    @objc private func tap(_ sender: UIButton) {
        let item = items[sender.tag]
        select(id: item.id)
        onSelect?(item.id)
    }
}
