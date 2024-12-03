from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load the CSV file into a DataFrame
df = pd.read_csv('melb_data.csv')

# Handle missing values
df = df.assign(
    Car=df['Car'].fillna(df['Car'].median()),
    BuildingArea=df['BuildingArea'].fillna(df['BuildingArea'].median()),
    YearBuilt=df['YearBuilt'].fillna(df['YearBuilt'].median()),
    CouncilArea=df['CouncilArea'].fillna(df['CouncilArea'].mode()[0])
)

@app.route('/data', methods=['GET'])
def get_data():
    # Convert the DataFrame to a dictionary and return as JSON
    data = df.to_dict(orient='records')
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)