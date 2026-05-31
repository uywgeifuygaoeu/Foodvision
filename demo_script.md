# FoodVision Demo Script

Target duration: 8 to 9 minutes, leaving buffer below the 10-minute course limit.

## 0:00-1:00 Problem Definition

Hello, this is FoodVision, our food recognition and nutrition recommendation system.
Many people can take a meal photo quickly, but interpreting that meal is harder. Our goal
is to turn one photo into a useful, friendly summary: the most likely food category,
Top-3 predictions, approximate nutrients, and a practical suggestion for a more balanced meal.

## 1:00-3:20 Data Science Pipeline

We use an expanded subset of the public Food-11 image dataset. It contains 9,927 images
across 11 broad food categories, including meat and seafood. This keeps local training
practical while providing better coverage for everyday meal photos.

The pipeline applies a stratified train, validation, and test split. Images are resized to
224 by 224 pixels and normalized with ImageNet statistics. Training augmentation includes
random crops, horizontal flips, small rotations, and color variation.

Our main model is ImageNet-pretrained EfficientNet-B0. We replace its final classifier head
for our food classes and save the checkpoint with the best validation accuracy. We also
support ResNet18 as a lightweight option.

Evaluation includes accuracy, Top-3 accuracy, macro precision, recall, F1-score, a confusion
matrix, sample predictions, and wrong-prediction examples. Show the prepared training curve
and confusion matrix here. Our current refined ResNet18 model reaches 94.3 percent
test accuracy and 98.8 percent Top-3 accuracy. We first trained the classification head,
then ran a short low-learning-rate full-network refinement pass.

## 3:20-6:40 Demonstration

Open the FoodVision homepage. Briefly point out the pastel food-brand visual style and the
three-step explanation.

Scroll to Recognition Demo. Upload a food image by dragging it into the card. Explain that
the frontend validates common image types and previews the selected image. Click Analyze My
Meal.

When the result appears, show:

1. The uploaded image.
2. Top-3 predicted classes and animated confidence bars.
3. The approximate nutrient cards for calories, protein, carbohydrates, fat, and fiber.
4. The meal balance score, portion controls, and dietary-goal controls.
5. The nutrient radar chart, macro calorie split, and approximate daily-guide bars.
6. The explainable nutrient highlights and plate-building recommendation cards.
7. The visual Keep, Add, and Consider plate upgrade with the balanced plate illustration.

Scroll to Today Overview. Explain that the latest eight analyses are stored only in the local
browser. Show the same-day estimated calories, protein, and fiber totals, then point out the
average balance score and seven-day trend charts. Click a recent meal thumbnail to reopen its
full report, then mention that individual entries can be deleted.

Switch between Balanced, High protein, Lighter meal, and Lower carb. Point out that the score,
daily-reference bars, and prioritized suggestions respond to the selected goal. Click Export
share card to download a branded PNG generated locally in the browser.

Click Reset and briefly show that another food image can be analyzed. Mention that mock mode
keeps the UI demonstrable before the checkpoint is copied into deployment, while real mode
uses the PyTorch classifier with the same API contract.

## 6:40-8:30 System Architecture

Show the architecture diagram. The React frontend sends an image to the FastAPI `/predict`
endpoint. The backend validates the upload, preprocesses the image, runs PyTorch inference,
and looks up the predicted dish in the local nutrition CSV. It returns one JSON response for
the frontend visualizations.

Show `/health` and `/classes` briefly to demonstrate deployment readiness.

## 8:30-9:20 Challenges

The main challenges were:

1. Supporting a realistic data science pipeline without making every iteration expensive.
2. Preserving exactly the same class mapping from training to inference.
3. Turning estimated nutrition values into clear advice without presenting medical claims.
4. Keeping the web application presentation-ready even while model weights are stored
   separately from the Git repository and submission archive.

Thank you.
