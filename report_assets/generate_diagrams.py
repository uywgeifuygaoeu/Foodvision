"""Generate simple report-ready PNG diagrams without requiring Mermaid CLI."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = Path(__file__).resolve().parent
FONT = ImageFont.load_default()


def rounded_box(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str, text: str) -> None:
    draw.rounded_rectangle(xy, radius=22, fill=fill, outline="#628478", width=2)
    left, top, right, bottom = xy
    lines = text.split("\n")
    line_height = 18
    start_y = (top + bottom - len(lines) * line_height) / 2
    for index, line in enumerate(lines):
        draw.text(
            ((left + right) / 2, start_y + index * line_height),
            line,
            fill="#27443b",
            font=FONT,
            anchor="ma",
        )


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    draw.line((start, end), fill="#ed735d", width=4)
    x, y = end
    draw.polygon([(x, y), (x - 12, y - 7), (x - 12, y + 7)], fill="#ed735d")


def architecture() -> None:
    image = Image.new("RGB", (1600, 820), "#fff9ee")
    draw = ImageDraw.Draw(image)
    draw.text((80, 56), "FoodVision System Architecture", fill="#27443b", font=FONT)
    boxes = [
        ((80, 250, 300, 390), "#ffd8c2", "User\nMeal photo"),
        ((390, 250, 650, 390), "#dff4e5", "React Frontend\nUpload and charts"),
        ((750, 250, 1010, 390), "#ffe89a", "FastAPI Backend\nValidation and routing"),
        ((1110, 120, 1480, 260), "#cdebcf", "PyTorch Model\nEfficientNet-B0 / ResNet18"),
        ((1110, 380, 1480, 520), "#f8cfdb", "Nutrition CSV\nApproximate serving values"),
        ((750, 600, 1010, 740), "#dff4e5", "Visualization Module\nBars, radar, Grad-CAM"),
    ]
    for xy, color, text in boxes:
        rounded_box(draw, xy, color, text)
    arrow(draw, (300, 320), (390, 320))
    arrow(draw, (650, 320), (750, 320))
    arrow(draw, (1010, 300), (1110, 210))
    arrow(draw, (1010, 350), (1110, 450))
    arrow(draw, (880, 390), (880, 600))
    arrow(draw, (750, 670), (650, 380))
    image.save(OUTPUT_DIR / "system_architecture.png")


def pipeline() -> None:
    image = Image.new("RGB", (1800, 550), "#fff9ee")
    draw = ImageDraw.Draw(image)
    draw.text((70, 48), "FoodVision Data Science Pipeline", fill="#27443b", font=FONT)
    labels = [
        ("Raw Food\nImages", "#ffd8c2"),
        ("Preprocessing\nResize and normalize", "#dff4e5"),
        ("Data\nAugmentation", "#ffe89a"),
        ("CNN Model\nTraining", "#cdebcf"),
        ("Evaluation\nMetrics and plots", "#f8cfdb"),
        ("Inference API\nNutrition mapping", "#ffd8c2"),
        ("Web\nVisualization", "#dff4e5"),
    ]
    width = 200
    gap = 45
    left = 55
    top = 205
    for index, (label, color) in enumerate(labels):
        x = left + index * (width + gap)
        rounded_box(draw, (x, top, x + width, top + 140), color, label)
        if index < len(labels) - 1:
            arrow(draw, (x + width, top + 70), (x + width + gap, top + 70))
    image.save(OUTPUT_DIR / "pipeline_diagram.png")


if __name__ == "__main__":
    architecture()
    pipeline()
