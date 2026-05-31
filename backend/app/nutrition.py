import csv
from pathlib import Path

from .schemas import AnalysisInsight, MacroDistribution, MealAnalysis, NutritionInfo


class NutritionRepository:
    """Loads approximate per-serving nutrients and creates practical advice."""

    def __init__(self, csv_path: Path) -> None:
        required = {"class", "calories", "protein", "carbs", "fat", "fiber"}
        with csv_path.open(newline="", encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)
            missing = required.difference(reader.fieldnames or [])
            if missing:
                raise ValueError(f"nutrition.csv is missing columns: {sorted(missing)}")
            self._rows = {
                row["class"]: {
                    key: float(row[key])
                    for key in ("calories", "protein", "carbs", "fat", "fiber")
                }
                for row in reader
            }

    def get(self, class_name: str) -> NutritionInfo:
        row = self._rows.get(class_name)
        if row is None:
            raise KeyError(f"No nutrition mapping exists for class '{class_name}'.")
        return NutritionInfo(**row)

    @staticmethod
    def analyze(class_name: str, nutrition: NutritionInfo) -> MealAnalysis:
        """Convert approximate nutrients into explainable meal-level signals."""

        score = 68
        if nutrition.protein >= 20:
            score += 12
        elif nutrition.protein < 8:
            score -= 8
        if nutrition.fiber >= 4:
            score += 12
        elif nutrition.fiber < 2:
            score -= 10
        if nutrition.fat >= 18:
            score -= 10
        if nutrition.carbs >= 55:
            score -= 6
        if class_name == "vegetable_fruit":
            score += 10
        if class_name in {"dessert", "fried_food"}:
            score -= 8
        score = max(0, min(100, score))

        tags: list[str] = []
        if nutrition.protein >= 20:
            tags.append("high protein")
        if nutrition.fiber >= 4:
            tags.append("fiber friendly")
        if nutrition.carbs >= 45:
            tags.append("carb forward")
        if nutrition.fat >= 15:
            tags.append("richer choice")
        if nutrition.calories <= 180:
            tags.append("lighter energy")
        if not tags:
            tags.append("everyday portion")

        insights = [
            AnalysisInsight(
                title="Protein",
                detail=(
                    f"{nutrition.protein:g}g per estimated serving. "
                    + ("A useful protein contribution." if nutrition.protein >= 20 else "Pair with a protein source for a fuller meal.")
                ),
                tone="positive" if nutrition.protein >= 20 else "neutral",
            ),
            AnalysisInsight(
                title="Fiber",
                detail=(
                    f"{nutrition.fiber:g}g per estimated serving. "
                    + ("This supports a more filling plate." if nutrition.fiber >= 4 else "Colorful vegetables or fruit can improve this.")
                ),
                tone="positive" if nutrition.fiber >= 4 else "watch",
            ),
            AnalysisInsight(
                title="Energy balance",
                detail=(
                    f"About {nutrition.calories:g} kcal before drinks or side dishes. "
                    + ("Keep the portion moderate and add lighter sides." if nutrition.calories >= 300 else "There is room to build a balanced plate around it.")
                ),
                tone="watch" if nutrition.calories >= 300 else "neutral",
            ),
        ]

        suggestions: list[str] = []
        if nutrition.fiber < 4:
            suggestions.append("Add one colorful vegetable or fruit serving for more fiber.")
        if nutrition.protein < 15:
            suggestions.append("Pair it with eggs, seafood, tofu, or another lean protein source.")
        if nutrition.fat >= 15:
            suggestions.append("Choose a lighter cooking method or keep rich sauces on the side.")
        if nutrition.carbs >= 45:
            suggestions.append("Balance the carbohydrate portion with vegetables and water.")
        if not suggestions:
            suggestions.append("Keep the plate varied and use hunger cues to guide the portion.")

        macro_calories = {
            "protein": nutrition.protein * 4,
            "carbs": nutrition.carbs * 4,
            "fat": nutrition.fat * 9,
        }
        macro_total = sum(macro_calories.values()) or 1

        return MealAnalysis(
            balance_score=score,
            score_label="Great foundation" if score >= 78 else "Good with a small tweak" if score >= 62 else "Build a more balanced plate",
            meal_tags=tags,
            daily_value_percentages=NutritionInfo(
                calories=round(nutrition.calories / 2000 * 100, 1),
                protein=round(nutrition.protein / 50 * 100, 1),
                carbs=round(nutrition.carbs / 275 * 100, 1),
                fat=round(nutrition.fat / 78 * 100, 1),
                fiber=round(nutrition.fiber / 28 * 100, 1),
            ),
            macro_calorie_percentages=MacroDistribution(
                protein=round(macro_calories["protein"] / macro_total * 100, 1),
                carbs=round(macro_calories["carbs"] / macro_total * 100, 1),
                fat=round(macro_calories["fat"] / macro_total * 100, 1),
            ),
            insights=insights,
            suggestions=suggestions[:3],
        )

    @staticmethod
    def recommend(nutrition: NutritionInfo) -> str:
        """Build a short explanation based on nutrient thresholds."""

        tips: list[str] = []
        if nutrition.protein >= 20:
            tips.append("This is a useful high-protein choice.")
        if nutrition.fat >= 18:
            tips.append("It is relatively high in fat, so keep the serving moderate.")
        if nutrition.carbs >= 45:
            tips.append("Carbohydrates are on the higher side; pair it with vegetables and watch sugary drinks.")
        if nutrition.fiber < 4:
            tips.append("Add vegetables or fruit to bring more fiber to the plate.")
        if not tips:
            tips.append("This can fit into a balanced meal with varied vegetables and sensible portions.")
        return " ".join(tips)
