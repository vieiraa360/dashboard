from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
import os

app = Flask(__name__)


MONGODB_HOST = 'ds223578.mlab.com'
MONGODB_PORT = 23578
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://root:pr0v1da@ds223578.mlab.com:23578/heroku_d2vm7g1g')
DBS_NAME = os.getenv('MONGO_DB_NAME', 'heroku_d2vm7g1g')
COLLECTION_NAME = 'projects'


    # Set up routing and call index.html file
@app.route("/")
def index():
    return render_template("index.html")



@app.route("/donorsUS/projects")
def donor_projects():

    # Fields to retrieve.
    FIELDS = {
        '_id': False, 'funding_status': True, 'school_state': True, 'secondary_focus_area': True,
        'resource_type': True, 'poverty_level': True, 'total_price_excluding_optional_support': True,
        'primary_focus_subject': True, 'teacher_prefix': True, 'primary_focus_area': True,
        'date_posted': True, 'num_donors': True, 'students_reached': True, 'total_donations': True
    }

    # Open a connection to MongoDB and retrieveave data set
    with MongoClient(MONGO_URI) as conn:
        collection = conn[DBS_NAME][COLLECTION_NAME]
        projects = collection.find(projection=FIELDS, limit=55000)
        return json.dumps(list(projects))


if __name__ == "__main__":
    app.run(debug=True)
