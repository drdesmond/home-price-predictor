# Take Home Coding Challenge Overview

Build a full stack web application that integrates a simple machine learning model to predict housing prices based on user input. The project should include a simple user interface, a backend that handles the prediction using a trained model, and a mechanism to store the prediction results.

## Requirements

### 1. User Interface

-   Create a simple web page with a form that allows users to input house details. Suggested fields include:
    -   Square Footage (sqft)
    -   Number of Bedrooms
-   Include a submit button to send the data for prediction.
-   Display the predicted price on the page after processing.

### 2. Backend

-   Implement a REST API endpoint (or similar) that accepts the form data.
-   Integrate a simple machine learning model in the backend that uses the input values to compute a predicted price.
-   Use a lightweight data store to log each prediction request along with its input values and the predicted price.

### 3. Machine Learning Model

-   Train a simple ML model using the sample housing data provided below.
-   The model should be trained to predict the house price using **Square Footage** and **Number of Bedrooms** as features.
-   You can pre-train the model and load it at runtime or include training as part of the backend initialization.

### 4. Technology Choices

-   Use any programming language and frameworks you are comfortable with.
-   Feel free to incorporate any modern tools or libraries, including large language models (LLMs), to assist in code generation, data analysis, or improving overall productivity.
-   Ensure the application is structured in a maintainable way.

### 5. Deployment

-   Add instructions in your README on how to run your application locally.

## Sample Data

Use the following sample data to train your model. This dataset includes house details with their corresponding prices:

| Square Footage | Number of Bedrooms | Price ($) |
| -------------- | ------------------ | --------- |
| 800            | 2                  | 150,000   |
| 1200           | 3                  | 200,000   |
| 1500           | 3                  | 250,000   |
| 1800           | 4                  | 300,000   |
| 2000           | 4                  | 320,000   |
| 2200           | 5                  | 360,000   |
| 2400           | 4                  | 380,000   |
| 2600           | 5                  | 400,000   |

**Note:** You may adjust the training process or use a library of your choice (e.g., scikit-learn in Python, ML libraries in Node.js, etc.) for building the regression model.
